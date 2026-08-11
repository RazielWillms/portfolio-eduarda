-- Etapa 2.1: pacientes globais, vinculos, solicitacoes e isolamento por RLS.
-- Esta migration pressupoe as tabelas-base ja usadas pela aplicacao:
-- profiles, pacientes, paciente_psicologos e atendimentos.

create extension if not exists unaccent;

-- Preserva funcoes legadas com a mesma assinatura. CREATE OR REPLACE nao
-- permite mudar o nome de um argumento (por exemplo, `txt` para `valor`).
do $migration$
begin
  if to_regprocedure('public.normalizar_texto(text)') is null then
    execute $function$
      create function public.normalizar_texto(txt text)
      returns text
      language sql
      immutable
      parallel safe
      set search_path = ''
      as 'select regexp_replace(lower(public.unaccent(coalesce($1, ''''))), ''[^a-z0-9]+'', '''', ''g'')'
    $function$;
  end if;

  if to_regprocedure('public.normalizar_cpf(text)') is null then
    execute $function$
      create function public.normalizar_cpf(txt text)
      returns text
      language sql
      immutable
      parallel safe
      set search_path = ''
      as 'select nullif(regexp_replace(coalesce($1, ''''), ''[^0-9]+'', '''', ''g''), '''')'
    $function$;
  end if;
end
$migration$;

alter table public.pacientes add column if not exists cpf_responsavel text;

-- CPF + nascimento e a identificacao forte. O indice tambem fecha a janela de
-- corrida entre a verificacao e a gravacao.
create unique index if not exists pacientes_cpf_responsavel_nascimento_uidx
  on public.pacientes (public.normalizar_cpf(cpf_responsavel), data_nascimento)
  where public.normalizar_cpf(cpf_responsavel) is not null and data_nascimento is not null;

delete from public.paciente_psicologos a
using public.paciente_psicologos b
where a.ctid > b.ctid
  and a.paciente_id = b.paciente_id
  and a.psicologo_id = b.psicologo_id;

create unique index if not exists paciente_psicologos_paciente_profissional_uidx
  on public.paciente_psicologos (paciente_id, psicologo_id);

create table if not exists public.solicitacoes_acesso (
  id uuid primary key default gen_random_uuid(),
  paciente_id uuid not null references public.pacientes(id) on delete cascade,
  solicitante_id uuid not null references public.profiles(id) on delete cascade,
  destinatario_id uuid references public.profiles(id) on delete set null,
  status text not null default 'pendente' check (status in ('pendente', 'aprovado', 'negado')),
  mensagem text,
  papel_no_caso text,
  resolvido_por uuid references public.profiles(id) on delete set null,
  resolvido_em timestamptz,
  created_at timestamptz not null default now(),
  constraint solicitacao_nao_resolvida check (
    (status = 'pendente' and resolvido_por is null and resolvido_em is null)
    or (status <> 'pendente' and resolvido_por is not null and resolvido_em is not null)
  )
);

-- Compatibilidade com uma versao parcial que usava flexao feminina/cancelada.
do $$
declare c record;
begin
  for c in
    select conname from pg_constraint
    where conrelid = 'public.solicitacoes_acesso'::regclass and contype = 'c'
      and pg_get_constraintdef(oid) ilike '%status%'
  loop
    execute format('alter table public.solicitacoes_acesso drop constraint %I', c.conname);
  end loop;
end $$;
update public.solicitacoes_acesso set status = 'aprovado' where status = 'aprovada';
update public.solicitacoes_acesso set status = 'negado' where status in ('negada', 'cancelada');
alter table public.solicitacoes_acesso
  add constraint solicitacoes_acesso_status_check check (status in ('pendente', 'aprovado', 'negado')),
  add constraint solicitacao_nao_resolvida check (
    (status = 'pendente' and resolvido_por is null and resolvido_em is null)
    or (status <> 'pendente' and resolvido_por is not null and resolvido_em is not null)
  );

create unique index if not exists solicitacoes_acesso_pendente_uidx
  on public.solicitacoes_acesso (paciente_id, solicitante_id)
  where status = 'pendente';

create or replace function public.usuario_ativo()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.status = 'ativo'
  )
$$;

create or replace function public.usuario_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.status = 'ativo' and p.papel = 'admin'
  )
$$;

create or replace function public.usuario_vinculado(p_paciente_id uuid, p_usuario_id uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.paciente_psicologos pp
    join public.profiles p on p.id = pp.psicologo_id and p.status = 'ativo'
    where pp.paciente_id = p_paciente_id and pp.psicologo_id = p_usuario_id
  )
$$;

create or replace function public.usuario_pode_ver_profile(p_profile_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select p_profile_id = auth.uid() or public.usuario_admin() or exists (
    select 1 from public.solicitacoes_acesso s
    where s.solicitante_id = p_profile_id
      and public.usuario_vinculado(s.paciente_id)
  )
$$;

revoke all on function public.usuario_ativo() from public;
revoke all on function public.usuario_admin() from public;
revoke all on function public.usuario_vinculado(uuid, uuid) from public;
revoke all on function public.usuario_pode_ver_profile(uuid) from public;
grant execute on function public.usuario_ativo() to authenticated;
grant execute on function public.usuario_admin() to authenticated;
grant execute on function public.usuario_vinculado(uuid, uuid) to authenticated;
grant execute on function public.usuario_pode_ver_profile(uuid) to authenticated;

-- Busca exata e mascarada. Nao aceita buscas parciais nem consulta sem data.
create or replace function public.buscar_possiveis_duplicatas_paciente(
  p_nome_completo text,
  p_data_nascimento date,
  p_nome_responsavel text default null,
  p_cpf_responsavel text default null
)
returns table (
  paciente_id uuid,
  nome_mascarado text,
  responsavel_mascarado text,
  data_nascimento date,
  ja_vinculado boolean,
  criado_por_nome text
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null or not public.usuario_ativo() or p_data_nascimento is null then
    return;
  end if;
  if public.normalizar_cpf(p_cpf_responsavel) is null and
     (length(public.normalizar_texto(p_nome_completo)) < 4 or length(public.normalizar_texto(p_nome_responsavel)) < 4) then
    return;
  end if;

  return query
  select p.id,
    left(p.nome_completo, 1) || repeat('*', greatest(length(p.nome_completo) - 1, 3)),
    case when p.nome_responsavel is null then null
      else left(p.nome_responsavel, 1) || repeat('*', greatest(length(p.nome_responsavel) - 1, 3)) end,
    p.data_nascimento,
    public.usuario_vinculado(p.id),
    null::text
  from public.pacientes p
  where p.data_nascimento = p_data_nascimento
    and (
      (public.normalizar_cpf(p_cpf_responsavel) is not null and
       public.normalizar_cpf(p.cpf_responsavel) = public.normalizar_cpf(p_cpf_responsavel))
      or
      (public.normalizar_cpf(p_cpf_responsavel) is null and
       public.normalizar_texto(p.nome_completo) = public.normalizar_texto(p_nome_completo) and
       public.normalizar_texto(p.nome_responsavel) = public.normalizar_texto(p_nome_responsavel))
    )
  limit 5;
end
$$;

revoke all on function public.buscar_possiveis_duplicatas_paciente(text, date, text, text) from public;
grant execute on function public.buscar_possiveis_duplicatas_paciente(text, date, text, text) to authenticated;

-- Cria paciente e vinculo na mesma transacao, repetindo a verificacao no banco.
create or replace function public.criar_paciente_com_vinculo(
  p_nome_completo text,
  p_nome_responsavel text,
  p_cpf_responsavel text,
  p_data_nascimento date,
  p_diagnostico text,
  p_contatos text,
  p_observacoes text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id uuid;
begin
  if auth.uid() is null or not public.usuario_ativo() then
    raise exception 'unauthorized' using errcode = '42501';
  end if;
  if nullif(trim(p_nome_completo), '') is null or p_data_nascimento is null then
    raise exception 'invalid_patient' using errcode = '22023';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(
    coalesce(public.normalizar_cpf(p_cpf_responsavel),
      public.normalizar_texto(p_nome_completo) || ':' || public.normalizar_texto(p_nome_responsavel))
    || ':' || p_data_nascimento::text, 0));

  if exists (
    select 1 from public.pacientes p
    where p.data_nascimento = p_data_nascimento and (
      (public.normalizar_cpf(p_cpf_responsavel) is not null and
       public.normalizar_cpf(p.cpf_responsavel) = public.normalizar_cpf(p_cpf_responsavel))
      or
      (public.normalizar_cpf(p_cpf_responsavel) is null and
       public.normalizar_texto(p.nome_completo) = public.normalizar_texto(p_nome_completo) and
       public.normalizar_texto(p.nome_responsavel) = public.normalizar_texto(p_nome_responsavel))
    )
  ) then
    raise exception 'possible_duplicate' using errcode = 'P0001';
  end if;

  insert into public.pacientes
    (nome_completo, nome_responsavel, cpf_responsavel, data_nascimento, diagnostico, contatos, observacoes, criado_por)
  values
    (trim(p_nome_completo), nullif(trim(p_nome_responsavel), ''), public.normalizar_cpf(p_cpf_responsavel),
     p_data_nascimento, nullif(trim(p_diagnostico), ''), nullif(trim(p_contatos), ''),
     nullif(trim(p_observacoes), ''), auth.uid())
  returning id into v_id;

  insert into public.paciente_psicologos (paciente_id, psicologo_id)
  values (v_id, auth.uid()) on conflict do nothing;
  return v_id;
end
$$;

revoke all on function public.criar_paciente_com_vinculo(text, text, text, date, text, text, text) from public;
grant execute on function public.criar_paciente_com_vinculo(text, text, text, date, text, text, text) to authenticated;

create or replace function public.solicitar_acesso_paciente(
  p_paciente_id uuid, p_mensagem text default null, p_papel_no_caso text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare v_id uuid;
begin
  if auth.uid() is null or not public.usuario_ativo() then raise exception 'unauthorized' using errcode = '42501'; end if;
  if public.usuario_vinculado(p_paciente_id) then raise exception 'already_linked' using errcode = '23505'; end if;
  insert into public.solicitacoes_acesso (paciente_id, solicitante_id, mensagem, papel_no_caso)
  values (p_paciente_id, auth.uid(), nullif(trim(p_mensagem), ''), nullif(trim(p_papel_no_caso), ''))
  on conflict (paciente_id, solicitante_id) where status = 'pendente'
  do update set mensagem = excluded.mensagem, papel_no_caso = excluded.papel_no_caso
  returning id into v_id;
  return v_id;
end
$$;

create or replace function public.decidir_solicitacao_acesso(p_solicitacao_id uuid, p_aprovar boolean)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare v_s public.solicitacoes_acesso%rowtype;
begin
  select * into v_s from public.solicitacoes_acesso where id = p_solicitacao_id for update;
  if not found or v_s.status <> 'pendente' then raise exception 'request_not_pending' using errcode = '22023'; end if;
  if not (public.usuario_admin() or public.usuario_vinculado(v_s.paciente_id)) then
    raise exception 'unauthorized' using errcode = '42501';
  end if;
  if p_aprovar then
    insert into public.paciente_psicologos (paciente_id, psicologo_id)
    values (v_s.paciente_id, v_s.solicitante_id) on conflict do nothing;
  end if;
  update public.solicitacoes_acesso set
    status = case when p_aprovar then 'aprovado' else 'negado' end,
    resolvido_por = auth.uid(), resolvido_em = now()
  where id = p_solicitacao_id;
end
$$;

create or replace function public.aprovar_solicitacao_acesso(p_solicitacao_id uuid) returns void
language sql security definer set search_path = '' as $$ select public.decidir_solicitacao_acesso(p_solicitacao_id, true) $$;
create or replace function public.negar_solicitacao_acesso(p_solicitacao_id uuid) returns void
language sql security definer set search_path = '' as $$ select public.decidir_solicitacao_acesso(p_solicitacao_id, false) $$;

revoke all on function public.solicitar_acesso_paciente(uuid, text, text) from public;
revoke all on function public.decidir_solicitacao_acesso(uuid, boolean) from public;
revoke all on function public.aprovar_solicitacao_acesso(uuid) from public;
revoke all on function public.negar_solicitacao_acesso(uuid) from public;
grant execute on function public.solicitar_acesso_paciente(uuid, text, text) to authenticated;
grant execute on function public.aprovar_solicitacao_acesso(uuid) to authenticated;
grant execute on function public.negar_solicitacao_acesso(uuid) to authenticated;

alter table public.pacientes enable row level security;
alter table public.paciente_psicologos enable row level security;
alter table public.atendimentos enable row level security;
alter table public.solicitacoes_acesso enable row level security;
alter table public.profiles enable row level security;
alter table public.pacientes force row level security;
alter table public.paciente_psicologos force row level security;
alter table public.atendimentos force row level security;
alter table public.solicitacoes_acesso force row level security;

-- Policies permissivas sao somadas (OR). Removemos todas as policies legadas
-- destas tabelas antes de instalar o conjunto auditado abaixo.
do $$
declare p record;
begin
  for p in
    select schemaname, tablename, policyname from pg_policies
    where schemaname = 'public'
      and tablename in ('pacientes', 'paciente_psicologos', 'atendimentos', 'solicitacoes_acesso', 'profiles')
  loop
    execute format('drop policy %I on %I.%I', p.policyname, p.schemaname, p.tablename);
  end loop;
end $$;

create policy profiles_select on public.profiles for select to authenticated
  using (public.usuario_pode_ver_profile(id));

create policy pacientes_select on public.pacientes for select to authenticated
  using (public.usuario_admin() or public.usuario_vinculado(id));
create policy pacientes_update on public.pacientes for update to authenticated
  using (public.usuario_admin() or public.usuario_vinculado(id))
  with check (public.usuario_admin() or public.usuario_vinculado(id));
-- INSERT e DELETE diretos permanecem negados: criacao e feita pela RPC atomica.

create policy vinculos_select on public.paciente_psicologos for select to authenticated
  using (public.usuario_admin() or psicologo_id = auth.uid() or public.usuario_vinculado(paciente_id));
-- INSERT/UPDATE/DELETE diretos permanecem negados: apenas RPCs autorizadas alteram vinculos.

create policy atendimentos_select on public.atendimentos for select to authenticated
  using (public.usuario_admin() or psicologo_id = auth.uid());
create policy atendimentos_insert on public.atendimentos for insert to authenticated
  with check (psicologo_id = auth.uid() and public.usuario_vinculado(paciente_id));
create policy atendimentos_update on public.atendimentos for update to authenticated
  using (psicologo_id = auth.uid())
  with check (psicologo_id = auth.uid() and public.usuario_vinculado(paciente_id));
create policy atendimentos_delete on public.atendimentos for delete to authenticated
  using (psicologo_id = auth.uid());

create policy solicitacoes_select on public.solicitacoes_acesso for select to authenticated
  using (solicitante_id = auth.uid() or public.usuario_admin() or public.usuario_vinculado(paciente_id));
-- Escrita direta negada; solicitar/decidir passa pelas RPCs.

-- Garante que as RPCs novas sejam publicadas imediatamente pelo PostgREST.
notify pgrst, 'reload schema';
