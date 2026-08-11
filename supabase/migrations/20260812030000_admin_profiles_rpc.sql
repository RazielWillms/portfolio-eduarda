-- Administracao de perfis sem expor nem exigir a service role na aplicacao.
-- A funcao valida o administrador autenticado antes de qualquer alteracao.
create or replace function public.atualizar_profile_admin(
  p_usuario_id uuid,
  p_papel text default null,
  p_status text default null
)
returns void
language plpgsql
security definer
set search_path = ''
set row_security = off
as $$
begin
  if auth.uid() is null or not public.usuario_admin() then
    raise exception 'unauthorized' using errcode = '42501';
  end if;
  if p_papel is not null and p_papel not in ('admin', 'psicologo') then
    raise exception 'invalid_role' using errcode = '22023';
  end if;
  if p_status is not null and p_status not in ('ativo', 'inativo') then
    raise exception 'invalid_status' using errcode = '22023';
  end if;
  if p_papel is null and p_status is null then
    raise exception 'no_changes' using errcode = '22023';
  end if;
  if p_usuario_id = auth.uid() and (p_status = 'inativo' or (p_papel is not null and p_papel <> 'admin')) then
    raise exception 'cannot_remove_own_admin_access' using errcode = '42501';
  end if;

  update public.profiles as profile_alvo
  set papel = coalesce(p_papel, profile_alvo.papel),
      status = coalesce(p_status, profile_alvo.status)
  where profile_alvo.id = p_usuario_id;

  if not found then
    raise exception 'profile_not_found' using errcode = '22023';
  end if;
end
$$;

revoke all on function public.atualizar_profile_admin(uuid, text, text) from public;
grant execute on function public.atualizar_profile_admin(uuid, text, text) to authenticated;

notify pgrst, 'reload schema';
