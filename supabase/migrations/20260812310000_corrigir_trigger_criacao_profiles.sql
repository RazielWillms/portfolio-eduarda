-- Reconcilia o provisionamento de public.profiles ao criar uma conta no Auth.
-- Instalacoes antigas podem conservar mais de um trigger, ou uma versao que
-- ainda tenta gravar o papel legado "psicologo".

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = 'pg_catalog', 'public'
set row_security = off
as $$
declare
  v_papel text := coalesce(new.raw_app_meta_data ->> 'papel', 'profissional');
  v_status text := coalesce(new.raw_app_meta_data ->> 'status', 'ativo');
  v_nome text;
begin
  if v_papel not in ('admin', 'profissional') then
    v_papel := 'profissional';
  end if;
  if v_status not in ('ativo', 'inativo') then
    v_status := 'ativo';
  end if;

  v_nome := coalesce(
    nullif(trim(new.raw_user_meta_data ->> 'nome'), ''),
    nullif(split_part(coalesce(new.email, ''), '@', 1), ''),
    'Novo usuário'
  );

  insert into public.profiles (
    id, nome, email, papel, status, admin_principal
  ) values (
    new.id, v_nome, new.email, v_papel, v_status, false
  )
  on conflict (id) do update set
    nome = excluded.nome,
    email = excluded.email;

  return new;
end
$$;

-- Remove qualquer trigger legado de auth.users que aponte para a funcao de
-- provisionamento, independentemente do nome usado naquela instalacao.
do $$
declare
  v_trigger record;
begin
  for v_trigger in
    select t.tgname
    from pg_trigger t
    join pg_proc p on p.oid = t.tgfoid
    join pg_namespace n on n.oid = p.pronamespace
    where t.tgrelid = 'auth.users'::regclass
      and not t.tgisinternal
      and n.nspname = 'public'
      and p.proname = 'handle_new_user'
  loop
    execute format('drop trigger %I on auth.users', v_trigger.tgname);
  end loop;
end
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

revoke all on function public.handle_new_user() from public;
notify pgrst, 'reload schema';

