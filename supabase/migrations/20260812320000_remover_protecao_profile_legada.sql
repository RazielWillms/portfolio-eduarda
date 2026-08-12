-- A autorizacao de alteracao de profiles hoje e garantida por RLS e pela RPC
-- atualizar_profile_admin. O trigger legado abaixo foi criado antes desse
-- desenho e, em algumas instalacoes, tambem intercepta INSERTs disparados pelo
-- Auth, impedindo a criacao de novos usuarios.

do $$
declare
  v_trigger record;
begin
  for v_trigger in
    select t.tgname
    from pg_trigger t
    join pg_proc p on p.oid = t.tgfoid
    where t.tgrelid = 'public.profiles'::regclass
      and not t.tgisinternal
      and p.proname = 'prevent_self_privilege_escalation'
  loop
    execute format('drop trigger %I on public.profiles', v_trigger.tgname);
  end loop;
end
$$;

-- A protecao atual do administrador principal permanece instalada e a escrita
-- administrativa continua restrita a atualizar_profile_admin.
notify pgrst, 'reload schema';

