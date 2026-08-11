-- Etapa 6: auditoria imutavel, soft delete, indices e endurecimento de RLS.

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists audit_logs_entity_idx on public.audit_logs (entity_type, entity_id, created_at desc);
create index if not exists audit_logs_user_idx on public.audit_logs (user_id, created_at desc);
alter table public.audit_logs enable row level security;
alter table public.audit_logs force row level security;
drop policy if exists audit_logs_admin_select on public.audit_logs;
create policy audit_logs_admin_select on public.audit_logs for select to authenticated using (public.usuario_admin());

alter table public.atendimentos
  add column if not exists updated_at timestamptz,
  add column if not exists updated_by uuid references public.profiles(id) on delete set null,
  add column if not exists deleted_at timestamptz,
  add column if not exists deleted_by uuid references public.profiles(id) on delete set null;
update public.atendimentos set updated_at = created_at where updated_at is null;
alter table public.atendimentos alter column updated_at set default now();

alter table public.habilidades add column if not exists deleted_at timestamptz;

create index if not exists atendimentos_paciente_data_ativos_idx
  on public.atendimentos (paciente_id, data desc) where deleted_at is null;
create index if not exists atendimentos_profissional_data_ativos_idx
  on public.atendimentos (psicologo_id, data desc) where deleted_at is null;
create index if not exists atendimentos_habilidade_data_ativos_idx
  on public.atendimentos (habilidade_id, data desc) where deleted_at is null;
create index if not exists paciente_habilidades_paciente_ativos_idx
  on public.paciente_habilidades (paciente_id, habilidade_id) where ativo;
create index if not exists solicitacoes_acesso_recebidas_idx
  on public.solicitacoes_acesso (paciente_id, created_at desc) where status = 'pendente';

create or replace function public.sanitizar_auditoria(p_tabela text, p_dados jsonb)
returns jsonb language sql immutable set search_path = '' as $$
  select case p_tabela
    when 'pacientes' then p_dados - array['nome_completo','nome_responsavel','cpf_responsavel','diagnostico','contatos','observacoes']
    when 'atendimentos' then p_dados - array['observacoes']
    when 'profiles' then p_dados - array['nome','email']
    when 'solicitacoes_acesso' then p_dados - array['mensagem','papel_no_caso']
    when 'acessos_responsavel' then p_dados - array['token_hash','descricao']
    else p_dados - array['token_hash']
  end
$$;

create or replace function public.registrar_auditoria_tabela()
returns trigger language plpgsql security definer set search_path = '' as $$
declare v_old jsonb; v_new jsonb; v_id uuid; v_action text; v_changed text[];
begin
  v_old := case when tg_op = 'INSERT' then null else public.sanitizar_auditoria(tg_table_name, to_jsonb(old)) end;
  v_new := case when tg_op = 'DELETE' then null else public.sanitizar_auditoria(tg_table_name, to_jsonb(new)) end;
  v_id := coalesce((v_new->>'id')::uuid,(v_old->>'id')::uuid,
    (v_new->>'paciente_id')::uuid,(v_old->>'paciente_id')::uuid);
  v_action := upper(tg_table_name || '_' || tg_op);
  if tg_table_name = 'atendimentos' and tg_op = 'UPDATE' then
    if v_old->>'deleted_at' is null and v_new->>'deleted_at' is not null then v_action := 'ATENDIMENTO_DELETED';
    elsif v_old->>'deleted_at' is not null and v_new->>'deleted_at' is null then v_action := 'ATENDIMENTO_RESTORED';
    else v_action := 'ATENDIMENTO_UPDATED'; end if;
  elsif tg_table_name = 'habilidades' and tg_op = 'UPDATE' then
    if v_old->>'status' = 'ativa' and v_new->>'status' = 'inativa' then v_action := 'HABILIDADE_DISABLED';
    elsif v_old->>'status' = 'inativa' and v_new->>'status' = 'ativa' then v_action := 'HABILIDADE_RESTORED';
    else v_action := 'HABILIDADE_UPDATED'; end if;
  elsif tg_table_name = 'acessos_responsavel' and tg_op = 'UPDATE' and v_old->>'revogado_em' is null and v_new->>'revogado_em' is not null then
    v_action := 'ACESSO_RESPONSAVEL_REVOKED';
  elsif tg_table_name = 'acessos_responsavel' and tg_op = 'UPDATE' then
    return new; -- ultimo acesso ja e auditado na propria entidade; evita log por visualizacao.
  end if;
  if tg_op = 'UPDATE' then
    select array_agg(key) into v_changed from jsonb_each(v_new) n
      where v_old -> n.key is distinct from n.value;
  end if;
  insert into public.audit_logs (user_id, action, entity_type, entity_id, metadata)
  values (auth.uid(), v_action, tg_table_name, v_id,
    jsonb_strip_nulls(jsonb_build_object('changed_fields', v_changed, 'before', v_old, 'after', v_new)));
  if tg_op = 'DELETE' then return old; end if;
  return new;
end
$$;

do $$ declare t text;
begin
  foreach t in array array['profiles','pacientes','paciente_psicologos','solicitacoes_acesso','atendimentos','habilidades','paciente_habilidades','acessos_responsavel']
  loop
    execute format('drop trigger if exists audit_%I on public.%I', t, t);
    execute format('create trigger audit_%I after insert or update or delete on public.%I for each row execute function public.registrar_auditoria_tabela()', t, t);
  end loop;
end $$;

create or replace function public.proteger_atendimento()
returns trigger language plpgsql set search_path = '' as $$
begin
  if new.id <> old.id or new.psicologo_id <> old.psicologo_id or new.created_at <> old.created_at then
    raise exception 'immutable_attendance_fields' using errcode = '22023';
  end if;
  if old.deleted_at is null and new.deleted_at is not null and new.deleted_by is distinct from auth.uid() then
    raise exception 'invalid_deleted_by' using errcode = '22023';
  end if;
  if old.deleted_at is not null and new.deleted_at is null and new.deleted_by is not null then
    raise exception 'invalid_restore' using errcode = '22023';
  end if;
  if old.deleted_at is not distinct from new.deleted_at and old.deleted_by is distinct from new.deleted_by then
    raise exception 'immutable_deleted_by' using errcode = '22023';
  end if;
  new.updated_at := now();
  new.updated_by := auth.uid();
  return new;
end
$$;
drop trigger if exists atendimentos_campos_protegidos on public.atendimentos;
create trigger atendimentos_campos_protegidos before update on public.atendimentos
for each row execute function public.proteger_atendimento();

-- Reinstala policies auditadas. Administrador pode ler para suporte, mas nunca
-- editar registros clinicos em nome do profissional.
do $$ declare p record;
begin for p in select policyname from pg_policies where schemaname='public' and tablename='atendimentos'
loop execute format('drop policy %I on public.atendimentos', p.policyname); end loop; end $$;
create policy atendimentos_select on public.atendimentos for select to authenticated
  using (public.usuario_admin() or psicologo_id = auth.uid());
create policy atendimentos_insert on public.atendimentos for insert to authenticated
  with check (public.usuario_ativo() and psicologo_id = auth.uid() and public.usuario_vinculado(paciente_id)
    and deleted_at is null and deleted_by is null and updated_by is null);
create policy atendimentos_update on public.atendimentos for update to authenticated
  using (public.usuario_ativo() and psicologo_id = auth.uid())
  with check (public.usuario_ativo() and psicologo_id = auth.uid() and public.usuario_vinculado(paciente_id));

-- Administradores podem localizar pacientes para suporte e autorização, mas
-- somente profissionais vinculados alteram conteúdo assistencial/pessoal.
drop policy if exists pacientes_update on public.pacientes;
create policy pacientes_update on public.pacientes for update to authenticated
  using (public.usuario_ativo() and public.usuario_vinculado(id))
  with check (public.usuario_ativo() and public.usuario_vinculado(id));

-- Catalogo global: leitura autenticada; somente administradores gerenciam.
alter table public.habilidades enable row level security;
alter table public.habilidades force row level security;
do $$ declare p record;
begin for p in select policyname from pg_policies where schemaname='public' and tablename='habilidades'
loop execute format('drop policy %I on public.habilidades', p.policyname); end loop; end $$;
create policy habilidades_select on public.habilidades for select to authenticated using (public.usuario_ativo());
create policy habilidades_insert on public.habilidades for insert to authenticated with check (public.usuario_admin());
create policy habilidades_update on public.habilidades for update to authenticated
  using (public.usuario_admin()) with check (public.usuario_admin());

alter table public.niveis_avaliacao enable row level security;
drop policy if exists niveis_avaliacao_select on public.niveis_avaliacao;
create policy niveis_avaliacao_select on public.niveis_avaliacao for select to authenticated using (public.usuario_ativo());

-- Funcoes clinicas ignoram exclusoes logicas.
create or replace function public.avaliacoes_clinicas_paciente(p_paciente_id uuid)
returns table (id uuid, habilidade_id uuid, data date, created_at timestamptz, codigo text, valor numeric, profissional_nome text)
language sql stable security definer set search_path = '' as $$
  select a.id, a.habilidade_id, a.data, a.created_at, n.codigo, n.valor,
    case when a.psicologo_id = auth.uid() or public.usuario_admin() then p.nome else null end
  from public.atendimentos a join public.niveis_avaliacao n on n.id=a.nivel_avaliacao_id
  left join public.profiles p on p.id=a.psicologo_id
  where a.paciente_id=p_paciente_id and a.deleted_at is null
    and (public.usuario_admin() or public.usuario_vinculado(p_paciente_id))
  order by a.data,a.created_at,a.id
$$;

create or replace function public.avaliacoes_clinicas_profissional(p_desde date default (current_date - interval '1 year')::date)
returns table (id uuid,paciente_id uuid,habilidade_id uuid,data date,created_at timestamptz,codigo text,valor numeric)
language sql stable security definer set search_path = '' as $$
  select a.id,a.paciente_id,a.habilidade_id,a.data,a.created_at,n.codigo,n.valor
  from public.atendimentos a join public.niveis_avaliacao n on n.id=a.nivel_avaliacao_id
  where a.deleted_at is null and a.data>=p_desde
    and (public.usuario_admin() or public.usuario_vinculado(a.paciente_id))
  order by a.data,a.created_at,a.id
$$;

-- Exclusao global: apaga apenas habilidade nunca utilizada; caso contrario desativa.
create or replace function public.excluir_ou_desativar_habilidade(p_habilidade_id uuid)
returns text language plpgsql security definer set search_path = '' as $$
begin
  if not public.usuario_admin() then raise exception 'unauthorized' using errcode='42501'; end if;
  if exists(select 1 from public.atendimentos where habilidade_id=p_habilidade_id)
     or exists(select 1 from public.paciente_habilidades where habilidade_id=p_habilidade_id) then
    update public.habilidades set status='inativa',deleted_at=coalesce(deleted_at,now()) where id=p_habilidade_id;
    return 'desativada';
  end if;
  delete from public.habilidades where id=p_habilidade_id;
  return 'excluida';
end
$$;
revoke all on function public.excluir_ou_desativar_habilidade(uuid) from public;
grant execute on function public.excluir_ou_desativar_habilidade(uuid) to authenticated;

-- Reinstala o DTO externo para excluir atendimentos removidos logicamente.
create or replace function public.obter_acompanhamento_responsavel(p_token text)
returns jsonb language plpgsql security definer
set search_path = 'pg_catalog', 'public', 'extensions'
set row_security = off as $$
declare v_acesso public.acessos_responsavel%rowtype; v_resultado jsonb;
begin
  if p_token is null or length(p_token)<40 or length(p_token)>100 then return null; end if;
  select * into v_acesso from public.acessos_responsavel a
  where a.token_hash=extensions.digest(convert_to(p_token,'UTF8'),'sha256')
    and a.ativo and a.revogado_em is null and (a.expira_em is null or a.expira_em>now()) for update;
  if not found then return null; end if;
  update public.acessos_responsavel set ultimo_acesso_em=now() where id=v_acesso.id;
  select jsonb_build_object(
    'primeiro_nome',split_part(trim(p.nome_completo),' ',1),
    'ultima_atualizacao',(select max(at.data) from public.atendimentos at where at.paciente_id=p.id and at.deleted_at is null),
    'habilidades',coalesce((select jsonb_agg(jsonb_build_object(
      'nome',h.nome,'avaliacoes',coalesce((select jsonb_agg(jsonb_build_object(
        'data',at.data,'codigo',n.codigo,'valor',n.valor) order by at.data,at.created_at,at.id)
        from public.atendimentos at join public.niveis_avaliacao n on n.id=at.nivel_avaliacao_id
        where at.paciente_id=ph.paciente_id and at.habilidade_id=ph.habilidade_id
          and at.deleted_at is null and at.data>=current_date-interval '1 year'),'[]'::jsonb)
      ) order by h.nome) from public.paciente_habilidades ph join public.habilidades h on h.id=ph.habilidade_id
      where ph.paciente_id=p.id and ph.ativo),'[]'::jsonb)
  ) into v_resultado from public.pacientes p where p.id=v_acesso.paciente_id;
  return v_resultado;
end $$;

notify pgrst, 'reload schema';
