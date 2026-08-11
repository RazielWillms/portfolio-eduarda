-- Reconcilia instalacoes que ja possuíam audit_logs com schema parcial.
-- Nenhum log existente e removido.
create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid()
);

alter table public.audit_logs
  add column if not exists user_id uuid references public.profiles(id) on delete set null,
  add column if not exists action text,
  add column if not exists entity_type text,
  add column if not exists entity_id uuid,
  add column if not exists metadata jsonb default '{}'::jsonb,
  add column if not exists created_at timestamptz default now();

update public.audit_logs
set action = coalesce(action, 'LEGACY'),
    entity_type = coalesce(entity_type, 'unknown'),
    metadata = coalesce(metadata, '{}'::jsonb),
    created_at = coalesce(created_at, now())
where action is null or entity_type is null or metadata is null or created_at is null;

alter table public.audit_logs
  alter column action set not null,
  alter column entity_type set not null,
  alter column metadata set default '{}'::jsonb,
  alter column metadata set not null,
  alter column created_at set default now(),
  alter column created_at set not null;

create index if not exists audit_logs_entity_idx
  on public.audit_logs (entity_type, entity_id, created_at desc);
create index if not exists audit_logs_user_idx
  on public.audit_logs (user_id, created_at desc);

alter table public.audit_logs enable row level security;
alter table public.audit_logs force row level security;
drop policy if exists audit_logs_admin_select on public.audit_logs;
create policy audit_logs_admin_select on public.audit_logs for select to authenticated
  using (public.usuario_admin());

notify pgrst, 'reload schema';
