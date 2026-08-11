-- O papel representa nivel de acesso, nao a formacao ou especialidade.
-- Nomes estruturais legados (psicologo_id/paciente_psicologos) sao mantidos
-- nesta etapa para evitar uma refatoracao de alto risco sem ganho funcional.

do $$
declare t record;
begin
  -- O trigger de protecao impede elevacao pelo cliente. Durante a migracao,
  -- desabilitamos somente esse trigger e o reativamos na mesma transacao.
  for t in
    select tr.tgname from pg_trigger tr join pg_proc p on p.oid=tr.tgfoid
    where tr.tgrelid='public.profiles'::regclass
      and p.proname='prevent_self_privilege_escalation' and not tr.tgisinternal
  loop execute format('alter table public.profiles disable trigger %I',t.tgname); end loop;

  -- Remove checks legados que ainda aceitam apenas admin/psicologo.
  for t in
    select conname from pg_constraint
    where conrelid='public.profiles'::regclass and contype='c'
      and pg_get_constraintdef(oid) ilike '%papel%'
  loop execute format('alter table public.profiles drop constraint %I',t.conname); end loop;

  update public.profiles set papel='profissional' where papel='psicologo';
  alter table public.profiles add constraint profiles_papel_check
    check (papel in ('admin','profissional'));

  for t in
    select tr.tgname from pg_trigger tr join pg_proc p on p.oid=tr.tgfoid
    where tr.tgrelid='public.profiles'::regclass
      and p.proname='prevent_self_privilege_escalation' and not tr.tgisinternal
  loop execute format('alter table public.profiles enable trigger %I',t.tgname); end loop;
end $$;

create or replace function public.atualizar_profile_admin(
  p_usuario_id uuid, p_papel text default null, p_status text default null
)
returns void language plpgsql security definer
set search_path='pg_catalog','public' set row_security=off as $$
begin
  if auth.uid() is null or not public.usuario_admin() then
    raise exception 'unauthorized' using errcode='42501';
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
  update public.profiles set
    papel=coalesce(p_papel,papel), status=coalesce(p_status,status)
  where id=p_usuario_id;
  if not found then raise exception 'profile_not_found' using errcode='P0002'; end if;
end $$;

revoke all on function public.atualizar_profile_admin(uuid,text,text) from public;
grant execute on function public.atualizar_profile_admin(uuid,text,text) to authenticated;
notify pgrst, 'reload schema';
