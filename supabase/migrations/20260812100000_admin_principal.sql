-- Mantem um administrador principal protegido contra rebaixamento, inativacao
-- ou exclusao por outros administradores e pelos clientes autenticados.

alter table public.profiles
  add column if not exists admin_principal boolean not null default false;

-- Em instalacoes existentes, o administrador mais antigo assume a funcao.
update public.profiles set admin_principal=true
where id=(
  select id from public.profiles
  where papel='admin' and status='ativo'
  order by created_at,id limit 1
)
and not exists(select 1 from public.profiles where admin_principal);

do $$ begin
  if not exists(select 1 from public.profiles where admin_principal) then
    raise exception 'Não existe administrador ativo para assumir como principal.';
  end if;
end $$;

create unique index if not exists profiles_um_admin_principal_uidx
  on public.profiles (admin_principal) where admin_principal;

alter table public.profiles drop constraint if exists profiles_admin_principal_check;
alter table public.profiles add constraint profiles_admin_principal_check
  check (not admin_principal or (papel='admin' and status='ativo'));

create or replace function public.proteger_admin_principal()
returns trigger language plpgsql set search_path='' as $$
begin
  if tg_op='DELETE' and old.admin_principal then
    raise exception 'main_admin_is_protected' using errcode='42501';
  end if;
  if tg_op='UPDATE' and old.admin_principal and
     (new.papel is distinct from old.papel
      or new.status is distinct from old.status
      or new.admin_principal is distinct from old.admin_principal) then
    raise exception 'main_admin_is_protected' using errcode='42501';
  end if;
  return case when tg_op='DELETE' then old else new end;
end $$;

drop trigger if exists profiles_proteger_admin_principal on public.profiles;
create trigger profiles_proteger_admin_principal
before update or delete on public.profiles
for each row execute function public.proteger_admin_principal();

create or replace function public.atualizar_profile_admin(
  p_usuario_id uuid, p_papel text default null, p_status text default null
)
returns void language plpgsql security definer
set search_path='pg_catalog','public' set row_security=off as $$
declare v_alvo public.profiles%rowtype;
begin
  if auth.uid() is null or not public.usuario_admin() then
    raise exception 'unauthorized' using errcode='42501';
  end if;
  select * into v_alvo from public.profiles where id=p_usuario_id for update;
  if not found then raise exception 'profile_not_found' using errcode='P0002'; end if;
  if v_alvo.admin_principal and
     ((p_papel is not null and p_papel<>v_alvo.papel)
       or (p_status is not null and p_status<>v_alvo.status)) then
    raise exception 'main_admin_is_protected' using errcode='42501';
  end if;
  if p_papel is not null and p_papel not in ('admin','profissional') then
    raise exception 'invalid_role' using errcode='23514';
  end if;
  if p_status is not null and p_status not in ('ativo','inativo') then
    raise exception 'invalid_status' using errcode='23514';
  end if;
  if p_usuario_id=auth.uid() and
     (p_status='inativo' or (p_papel is not null and p_papel<>'admin')) then
    raise exception 'cannot_remove_own_admin_access' using errcode='42501';
  end if;
  update public.profiles set papel=coalesce(p_papel,papel),status=coalesce(p_status,status)
  where id=p_usuario_id;
end $$;

revoke all on function public.atualizar_profile_admin(uuid,text,text) from public;
grant execute on function public.atualizar_profile_admin(uuid,text,text) to authenticated;
notify pgrst, 'reload schema';
