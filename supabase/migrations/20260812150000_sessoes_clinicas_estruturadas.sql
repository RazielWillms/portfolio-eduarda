-- Ciclo 2: sessoes estruturadas e registros objetivos multi-alvo.

create table if not exists public.sessoes_clinicas (
  id uuid primary key default gen_random_uuid(),
  paciente_id uuid not null references public.pacientes(id) on delete restrict,
  profissional_id uuid not null references public.profiles(id) on delete restrict,
  data date not null,
  contexto text,
  observacoes_privadas text,
  status text not null default 'finalizada' check (status in ('rascunho','finalizada','cancelada')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  check (deleted_at is null or status='cancelada')
);

create table if not exists public.registros_medicao (
  id uuid primary key default gen_random_uuid(),
  sessao_id uuid not null references public.sessoes_clinicas(id) on delete restrict,
  alvo_id uuid not null references public.alvos_clinicos(id) on delete restrict,
  definicao_operacional_id uuid not null references public.definicoes_operacionais_alvo(id) on delete restrict,
  configuracao_medicao_id uuid not null references public.configuracoes_medicao_alvo(id) on delete restrict,
  tipo_medicao text not null,
  dados jsonb not null,
  observacao text,
  created_at timestamptz not null default now(),
  unique (sessao_id,alvo_id),
  check (jsonb_typeof(dados)='object')
);

create index if not exists sessoes_clinicas_paciente_data_idx on public.sessoes_clinicas(paciente_id,data desc);
create index if not exists sessoes_clinicas_profissional_data_idx on public.sessoes_clinicas(profissional_id,data desc);
create index if not exists registros_medicao_alvo_idx on public.registros_medicao(alvo_id,created_at desc);

create or replace function public.json_numero_nao_negativo(p_dados jsonb,p_chave text)
returns boolean language sql immutable set search_path='' as $$
  select jsonb_typeof(p_dados->p_chave)='number' and (p_dados->>p_chave)::numeric>=0
$$;

create or replace function public.validar_dados_medicao(p_tipo text,p_dados jsonb)
returns boolean language plpgsql immutable set search_path='' as $$
declare v_total numeric; v_parte numeric;
begin
  if jsonb_typeof(p_dados)<>'object' then return false; end if;
  if p_tipo='frequencia' then return public.json_numero_nao_negativo(p_dados,'contagem'); end if;
  if p_tipo='taxa' then return public.json_numero_nao_negativo(p_dados,'contagem')
    and public.json_numero_nao_negativo(p_dados,'duracao_observacao_segundos')
    and (p_dados->>'duracao_observacao_segundos')::numeric>0; end if;
  if p_tipo in ('duracao','latencia') then return public.json_numero_nao_negativo(p_dados,'segundos'); end if;
  if p_tipo in ('percentual_oportunidades','tentativas_discretas') then
    if not public.json_numero_nao_negativo(p_dados,'oportunidades')
       or not public.json_numero_nao_negativo(p_dados,'respostas_independentes') then return false; end if;
    v_total := (p_dados->>'oportunidades')::numeric; v_parte := (p_dados->>'respostas_independentes')::numeric;
    return v_total>0 and v_parte<=v_total;
  end if;
  if p_tipo in ('intervalo_parcial','intervalo_total','amostragem_momentanea') then
    if not public.json_numero_nao_negativo(p_dados,'intervalos')
       or not public.json_numero_nao_negativo(p_dados,'intervalos_com_ocorrencia') then return false; end if;
    v_total := (p_dados->>'intervalos')::numeric; v_parte := (p_dados->>'intervalos_com_ocorrencia')::numeric;
    return v_total>0 and v_parte<=v_total;
  end if;
  if p_tipo='escala_independencia' then return p_dados->>'codigo' in ('A','B+','B-','C'); end if;
  if p_tipo='intensidade' then return public.json_numero_nao_negativo(p_dados,'nivel'); end if;
  return false;
exception when others then return false;
end $$;

create or replace function public.registrar_sessao_clinica(
  p_paciente_id uuid,p_data date,p_contexto text,p_observacoes_privadas text,p_registros jsonb
)
returns uuid language plpgsql security definer
set search_path='pg_catalog','public' set row_security=off as $$
declare v_sessao_id uuid; v_item jsonb; v_alvo public.alvos_clinicos%rowtype;
  v_config public.configuracoes_medicao_alvo%rowtype; v_def public.definicoes_operacionais_alvo%rowtype;
begin
  if auth.uid() is null or not public.usuario_ativo() or not public.usuario_vinculado(p_paciente_id)
     or p_data is null or jsonb_typeof(p_registros)<>'array' or jsonb_array_length(p_registros)=0 then
    raise exception 'invalid_or_unauthorized_session' using errcode='42501';
  end if;
  insert into public.sessoes_clinicas(paciente_id,profissional_id,data,contexto,observacoes_privadas,status)
  values(p_paciente_id,auth.uid(),p_data,nullif(trim(p_contexto),''),nullif(trim(p_observacoes_privadas),''),'finalizada')
  returning id into v_sessao_id;
  for v_item in select value from jsonb_array_elements(p_registros) loop
    select a.* into v_alvo from public.alvos_clinicos a
    join public.objetivos_clinicos o on o.id=a.objetivo_id
    join public.planos_clinicos p on p.id=o.plano_id
    where a.id=(v_item->>'alvo_id')::uuid and p.paciente_id=p_paciente_id
      and a.profissional_id=auth.uid() and a.ativo and a.fase not in ('rascunho','pausado','encerrado');
    if not found then raise exception 'invalid_session_target' using errcode='22023'; end if;
    select * into v_config from public.configuracoes_medicao_alvo
      where alvo_id=v_alvo.id order by versao desc limit 1;
    select * into v_def from public.definicoes_operacionais_alvo
      where alvo_id=v_alvo.id order by versao desc limit 1;
    if v_config.id is null or v_def.id is null
       or not public.validar_dados_medicao(v_config.tipo,v_item->'dados') then
      raise exception 'invalid_measurement_data' using errcode='22023';
    end if;
    insert into public.registros_medicao(sessao_id,alvo_id,definicao_operacional_id,
      configuracao_medicao_id,tipo_medicao,dados,observacao)
    values(v_sessao_id,v_alvo.id,v_def.id,v_config.id,v_config.tipo,v_item->'dados',
      nullif(trim(v_item->>'observacao'),''));
  end loop;
  return v_sessao_id;
exception when unique_violation then
  raise exception 'duplicate_target_in_session' using errcode='22023';
end $$;

alter table public.sessoes_clinicas enable row level security;
alter table public.sessoes_clinicas force row level security;
alter table public.registros_medicao enable row level security;
alter table public.registros_medicao force row level security;
drop policy if exists sessoes_clinicas_select on public.sessoes_clinicas;
drop policy if exists registros_medicao_select on public.registros_medicao;
create policy sessoes_clinicas_select on public.sessoes_clinicas for select to authenticated
  using (public.usuario_admin() or profissional_id=auth.uid());
create policy registros_medicao_select on public.registros_medicao for select to authenticated
  using (public.usuario_admin() or exists(select 1 from public.sessoes_clinicas s
    where s.id=sessao_id and s.profissional_id=auth.uid()));
-- Sem escrita direta: a sessao finalizada e seus registros nascem pela RPC atomica.

create or replace function public.auditar_sessao_estruturada()
returns trigger language plpgsql security definer set search_path='' as $$
begin
  insert into public.audit_logs(user_id,action,entity_type,entity_id,metadata)
  values(auth.uid(),upper(tg_table_name||'_'||tg_op),tg_table_name,new.id,
    case when tg_table_name='sessoes_clinicas' then jsonb_build_object(
      'paciente_id',new.paciente_id,'profissional_id',new.profissional_id,'data',new.data,'status',new.status)
    else jsonb_build_object('sessao_id',new.sessao_id,'alvo_id',new.alvo_id,'tipo_medicao',new.tipo_medicao) end);
  return new;
end $$;
drop trigger if exists audit_sessoes_clinicas on public.sessoes_clinicas;
create trigger audit_sessoes_clinicas after insert on public.sessoes_clinicas
for each row execute function public.auditar_sessao_estruturada();
drop trigger if exists audit_registros_medicao on public.registros_medicao;
create trigger audit_registros_medicao after insert on public.registros_medicao
for each row execute function public.auditar_sessao_estruturada();

revoke all on function public.json_numero_nao_negativo(jsonb,text) from public;
revoke all on function public.validar_dados_medicao(text,jsonb) from public;
revoke all on function public.registrar_sessao_clinica(uuid,date,text,text,jsonb) from public;
grant execute on function public.registrar_sessao_clinica(uuid,date,text,text,jsonb) to authenticated;
notify pgrst,'reload schema';
