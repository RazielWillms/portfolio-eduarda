-- Ciclo 1 / Fundacao clinica ABA.
-- Modelo aditivo: atendimentos e habilidades legados continuam operacionais.

create table if not exists public.planos_clinicos (
  id uuid primary key default gen_random_uuid(),
  paciente_id uuid not null references public.pacientes(id) on delete restrict,
  profissional_responsavel_id uuid not null references public.profiles(id) on delete restrict,
  titulo text not null check (length(trim(titulo)) between 3 and 160),
  justificativa text,
  status text not null default 'rascunho'
    check (status in ('rascunho','em_revisao','aprovado','em_execucao','encerrado')),
  iniciado_em date,
  revisar_em date,
  encerrado_em date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (encerrado_em is null or status='encerrado')
);

create table if not exists public.objetivos_clinicos (
  id uuid primary key default gen_random_uuid(),
  plano_id uuid not null references public.planos_clinicos(id) on delete cascade,
  descricao text not null check (length(trim(descricao)) between 3 and 1000),
  horizonte text not null default 'curto_prazo'
    check (horizonte in ('curto_prazo','longo_prazo')),
  ordem integer not null default 0 check (ordem >= 0),
  ativo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.alvos_clinicos (
  id uuid primary key default gen_random_uuid(),
  objetivo_id uuid not null references public.objetivos_clinicos(id) on delete cascade,
  profissional_id uuid not null references public.profiles(id) on delete restrict,
  nome text not null check (length(trim(nome)) between 2 and 160),
  categoria text,
  natureza text not null default 'aquisicao'
    check (natureza in ('aquisicao','reducao')),
  fase text not null default 'rascunho'
    check (fase in ('rascunho','linha_de_base','ensino','generalizacao','manutencao','pausado','encerrado')),
  ativo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.definicoes_operacionais_alvo (
  id uuid primary key default gen_random_uuid(),
  alvo_id uuid not null references public.alvos_clinicos(id) on delete cascade,
  versao integer not null check (versao > 0),
  descricao_observavel text not null check (length(trim(descricao_observavel)) >= 10),
  resposta_esperada text,
  condicoes_antecedentes text,
  exemplos text,
  nao_exemplos text,
  materiais text,
  instrucao_sd text,
  resposta_correta text,
  resposta_incorreta text,
  criterios_interrupcao text,
  criado_por uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  unique (alvo_id,versao)
);

create table if not exists public.configuracoes_medicao_alvo (
  id uuid primary key default gen_random_uuid(),
  alvo_id uuid not null references public.alvos_clinicos(id) on delete cascade,
  versao integer not null check (versao > 0),
  tipo text not null check (tipo in (
    'frequencia','taxa','duracao','latencia','percentual_oportunidades',
    'tentativas_discretas','intervalo_parcial','intervalo_total',
    'amostragem_momentanea','escala_independencia','intensidade'
  )),
  unidade text not null check (length(trim(unidade)) between 1 and 60),
  parametros jsonb not null default '{}'::jsonb,
  criado_por uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  unique (alvo_id,versao),
  check (jsonb_typeof(parametros)='object')
);

create table if not exists public.criterios_dominio_alvo (
  id uuid primary key default gen_random_uuid(),
  alvo_id uuid not null references public.alvos_clinicos(id) on delete cascade,
  versao integer not null check (versao > 0),
  direcao text not null default 'aumentar' check (direcao in ('aumentar','reduzir')),
  valor_alvo numeric,
  sessoes_consecutivas integer not null default 1 check (sessoes_consecutivas > 0),
  oportunidades_minimas integer check (oportunidades_minimas is null or oportunidades_minimas > 0),
  ambientes_minimos integer not null default 1 check (ambientes_minimos > 0),
  aplicadores_minimos integer not null default 1 check (aplicadores_minimos > 0),
  dias_manutencao integer check (dias_manutencao is null or dias_manutencao >= 0),
  configuracao jsonb not null default '{}'::jsonb,
  criado_por uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  unique (alvo_id,versao),
  check (jsonb_typeof(configuracao)='object')
);

create table if not exists public.historico_fases_alvo (
  id uuid primary key default gen_random_uuid(),
  alvo_id uuid not null references public.alvos_clinicos(id) on delete cascade,
  fase_anterior text,
  nova_fase text not null,
  motivo text not null check (length(trim(motivo)) >= 3),
  alterado_por uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now()
);

create index if not exists planos_clinicos_paciente_idx on public.planos_clinicos(paciente_id,status);
create index if not exists objetivos_clinicos_plano_idx on public.objetivos_clinicos(plano_id,ordem);
create index if not exists alvos_clinicos_objetivo_idx on public.alvos_clinicos(objetivo_id,fase);
create index if not exists historico_fases_alvo_idx on public.historico_fases_alvo(alvo_id,created_at desc);

create or replace function public.usuario_dono_plano(p_plano_id uuid)
returns boolean language sql stable security definer set search_path='' as $$
  select exists(select 1 from public.planos_clinicos p
    where p.id=p_plano_id and p.profissional_responsavel_id=auth.uid()
      and public.usuario_ativo() and public.usuario_vinculado(p.paciente_id))
$$;

create or replace function public.usuario_pode_editar_alvo(p_alvo_id uuid)
returns boolean language sql stable security definer set search_path='' as $$
  select exists(select 1 from public.alvos_clinicos a
    join public.objetivos_clinicos o on o.id=a.objetivo_id
    where a.id=p_alvo_id and a.profissional_id=auth.uid()
      and public.usuario_dono_plano(o.plano_id))
$$;

revoke all on function public.usuario_dono_plano(uuid) from public;
revoke all on function public.usuario_pode_editar_alvo(uuid) from public;
grant execute on function public.usuario_dono_plano(uuid) to authenticated;
grant execute on function public.usuario_pode_editar_alvo(uuid) to authenticated;

do $$ declare t text; p record;
begin
  foreach t in array array['planos_clinicos','objetivos_clinicos','alvos_clinicos',
    'definicoes_operacionais_alvo','configuracoes_medicao_alvo','criterios_dominio_alvo','historico_fases_alvo']
  loop
    execute format('alter table public.%I enable row level security',t);
    execute format('alter table public.%I force row level security',t);
    for p in select policyname from pg_policies where schemaname='public' and tablename=t
    loop execute format('drop policy %I on public.%I',p.policyname,t); end loop;
  end loop;
end $$;

create policy planos_select on public.planos_clinicos for select to authenticated
  using (public.usuario_admin() or public.usuario_vinculado(paciente_id));
create policy planos_insert on public.planos_clinicos for insert to authenticated
  with check (profissional_responsavel_id=auth.uid() and public.usuario_ativo() and public.usuario_vinculado(paciente_id));
create policy planos_update on public.planos_clinicos for update to authenticated
  using (profissional_responsavel_id=auth.uid() and public.usuario_ativo())
  with check (profissional_responsavel_id=auth.uid() and public.usuario_vinculado(paciente_id));

create policy objetivos_select on public.objetivos_clinicos for select to authenticated
  using (exists(select 1 from public.planos_clinicos p where p.id=plano_id));
create policy objetivos_insert on public.objetivos_clinicos for insert to authenticated
  with check (public.usuario_dono_plano(plano_id));
create policy objetivos_update on public.objetivos_clinicos for update to authenticated
  using (public.usuario_dono_plano(plano_id)) with check (public.usuario_dono_plano(plano_id));

create policy alvos_select on public.alvos_clinicos for select to authenticated
  using (exists(select 1 from public.objetivos_clinicos o where o.id=objetivo_id));
create policy alvos_insert on public.alvos_clinicos for insert to authenticated
  with check (profissional_id=auth.uid() and exists(
    select 1 from public.objetivos_clinicos o where o.id=objetivo_id and public.usuario_dono_plano(o.plano_id)));
create policy alvos_update on public.alvos_clinicos for update to authenticated
  using (public.usuario_pode_editar_alvo(id)) with check (profissional_id=auth.uid());

create policy definicoes_select on public.definicoes_operacionais_alvo for select to authenticated
  using (exists(select 1 from public.alvos_clinicos a where a.id=alvo_id));
create policy definicoes_insert on public.definicoes_operacionais_alvo for insert to authenticated
  with check (criado_por=auth.uid() and public.usuario_pode_editar_alvo(alvo_id));
create policy medicoes_select on public.configuracoes_medicao_alvo for select to authenticated
  using (exists(select 1 from public.alvos_clinicos a where a.id=alvo_id));
create policy medicoes_insert on public.configuracoes_medicao_alvo for insert to authenticated
  with check (criado_por=auth.uid() and public.usuario_pode_editar_alvo(alvo_id));
create policy criterios_select on public.criterios_dominio_alvo for select to authenticated
  using (exists(select 1 from public.alvos_clinicos a where a.id=alvo_id));
create policy criterios_insert on public.criterios_dominio_alvo for insert to authenticated
  with check (criado_por=auth.uid() and public.usuario_pode_editar_alvo(alvo_id));
create policy fases_select on public.historico_fases_alvo for select to authenticated
  using (exists(select 1 from public.alvos_clinicos a where a.id=alvo_id));
create policy fases_insert on public.historico_fases_alvo for insert to authenticated
  with check (alterado_por=auth.uid() and public.usuario_pode_editar_alvo(alvo_id));

create or replace function public.proteger_identidade_clinica()
returns trigger language plpgsql set search_path='' as $$
begin
  if tg_table_name='planos_clinicos' and
     (new.id<>old.id or new.paciente_id<>old.paciente_id
      or new.profissional_responsavel_id<>old.profissional_responsavel_id
      or new.created_at<>old.created_at) then
    raise exception 'immutable_clinical_plan_identity' using errcode='22023';
  elsif tg_table_name='objetivos_clinicos' and
     (new.id<>old.id or new.plano_id<>old.plano_id or new.created_at<>old.created_at) then
    raise exception 'immutable_clinical_objective_identity' using errcode='22023';
  elsif tg_table_name='alvos_clinicos' then
    if new.id<>old.id or new.objetivo_id<>old.objetivo_id
       or new.profissional_id<>old.profissional_id or new.created_at<>old.created_at then
      raise exception 'immutable_clinical_target_identity' using errcode='22023';
    end if;
    if new.fase<>old.fase and coalesce(current_setting('app.alterando_fase_alvo',true),'')<>'1' then
      raise exception 'use_target_phase_rpc' using errcode='22023';
    end if;
  end if;
  return new;
end $$;

do $$ declare t text;
begin foreach t in array array['planos_clinicos','objetivos_clinicos','alvos_clinicos'] loop
  execute format('drop trigger if exists proteger_identidade on public.%I',t);
  execute format('create trigger proteger_identidade before update on public.%I for each row execute function public.proteger_identidade_clinica()',t);
end loop; end $$;

create or replace function public.alterar_fase_alvo(
  p_alvo_id uuid,p_nova_fase text,p_motivo text
)
returns void language plpgsql security definer
set search_path='pg_catalog','public' set row_security=off as $$
declare v_alvo public.alvos_clinicos%rowtype;
begin
  if p_nova_fase not in ('rascunho','linha_de_base','ensino','generalizacao','manutencao','pausado','encerrado')
     or length(trim(coalesce(p_motivo,'')))<3 then
    raise exception 'invalid_target_phase_change' using errcode='22023';
  end if;
  select * into v_alvo from public.alvos_clinicos where id=p_alvo_id for update;
  if not found or not public.usuario_pode_editar_alvo(p_alvo_id) then
    raise exception 'unauthorized' using errcode='42501';
  end if;
  if v_alvo.fase=p_nova_fase then return; end if;
  perform set_config('app.alterando_fase_alvo','1',true);
  update public.alvos_clinicos set fase=p_nova_fase where id=p_alvo_id;
  insert into public.historico_fases_alvo(alvo_id,fase_anterior,nova_fase,motivo,alterado_por)
  values(p_alvo_id,v_alvo.fase,p_nova_fase,trim(p_motivo),auth.uid());
end $$;
revoke all on function public.alterar_fase_alvo(uuid,text,text) from public;
grant execute on function public.alterar_fase_alvo(uuid,text,text) to authenticated;

-- Versoes clinicas e historico sao append-only: nao ha policies de update/delete.
create or replace function public.proteger_registro_clinico_versionado()
returns trigger language plpgsql set search_path='' as $$
begin raise exception 'clinical_version_is_immutable' using errcode='22023'; end $$;
do $$ declare t text;
begin
  foreach t in array array['definicoes_operacionais_alvo','configuracoes_medicao_alvo',
    'criterios_dominio_alvo','historico_fases_alvo']
  loop
    execute format('drop trigger if exists proteger_versao on public.%I',t);
    execute format('create trigger proteger_versao before update or delete on public.%I for each row execute function public.proteger_registro_clinico_versionado()',t);
  end loop;
end $$;

create or replace function public.atualizar_updated_at_clinico()
returns trigger language plpgsql set search_path='' as $$ begin new.updated_at=now(); return new; end $$;
do $$ declare t text;
begin foreach t in array array['planos_clinicos','objetivos_clinicos','alvos_clinicos'] loop
  execute format('drop trigger if exists atualizar_updated_at on public.%I',t);
  execute format('create trigger atualizar_updated_at before update on public.%I for each row execute function public.atualizar_updated_at_clinico()',t);
end loop; end $$;

-- Auditoria registra estrutura e campos alterados, sem copiar conteudo clinico.
create or replace function public.sanitizar_auditoria(p_tabela text,p_dados jsonb)
returns jsonb language sql immutable set search_path='' as $$
  select case p_tabela
    when 'pacientes' then p_dados-array['nome_completo','nome_responsavel','cpf_responsavel','diagnostico','contatos','observacoes']
    when 'atendimentos' then p_dados-array['observacoes']
    when 'profiles' then p_dados-array['nome','email']
    when 'solicitacoes_acesso' then p_dados-array['mensagem','papel_no_caso']
    when 'acessos_responsavel' then p_dados-array['token_hash','descricao']
    when 'planos_clinicos' then p_dados-array['titulo','justificativa']
    when 'objetivos_clinicos' then p_dados-array['descricao']
    when 'alvos_clinicos' then p_dados-array['nome','categoria']
    when 'definicoes_operacionais_alvo' then p_dados-array['descricao_observavel','resposta_esperada','condicoes_antecedentes','exemplos','nao_exemplos','materiais','instrucao_sd','resposta_correta','resposta_incorreta','criterios_interrupcao']
    when 'configuracoes_medicao_alvo' then p_dados-array['parametros']
    when 'criterios_dominio_alvo' then p_dados-array['configuracao']
    when 'historico_fases_alvo' then p_dados-array['motivo']
    else p_dados-array['token_hash'] end
$$;

do $$ declare t text;
begin
  foreach t in array array['planos_clinicos','objetivos_clinicos','alvos_clinicos',
    'definicoes_operacionais_alvo','configuracoes_medicao_alvo','criterios_dominio_alvo','historico_fases_alvo']
  loop
    execute format('drop trigger if exists audit_%I on public.%I',t,t);
    execute format('create trigger audit_%I after insert or update or delete on public.%I for each row execute function public.registrar_auditoria_tabela()',t,t);
  end loop;
end $$;

notify pgrst,'reload schema';
