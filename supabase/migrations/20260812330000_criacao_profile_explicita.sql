-- A criacao de profiles passa a ser feita explicitamente pela aplicacao logo
-- apos a Admin API criar auth.users. Isso evita que qualquer falha em public
-- seja ocultada pelo Auth sob a mensagem generica "Database error creating new user".

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

comment on function public.handle_new_user() is
  'Mantida somente para compatibilidade histórica; a aplicação cria profiles explicitamente.';

notify pgrst, 'reload schema';

