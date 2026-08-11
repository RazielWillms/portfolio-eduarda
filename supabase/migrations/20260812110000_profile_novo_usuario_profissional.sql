-- Atualiza o trigger de Auth para o vocabulario de papeis admin/profissional.
-- A assinatura e o nome seguem o trigger padrao ja instalado no projeto.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_papel text;
  v_status text;
begin
  v_papel := coalesce(new.raw_app_meta_data ->> 'papel', 'profissional');
  v_status := coalesce(new.raw_app_meta_data ->> 'status', 'ativo');

  if v_papel not in ('admin','profissional') then v_papel := 'profissional'; end if;
  if v_status not in ('ativo','inativo') then v_status := 'ativo'; end if;

  insert into public.profiles (id,nome,email,papel,status)
  values (
    new.id,
    coalesce(nullif(trim(new.raw_user_meta_data ->> 'nome'),''),split_part(new.email,'@',1)),
    new.email,
    v_papel,
    v_status
  )
  on conflict (id) do update set
    nome=excluded.nome,
    email=excluded.email;
  return new;
end $$;

-- Garante que exista exatamente um disparo para a funcao atualizada. Caso o
-- trigger padrao ja exista, DROP/CREATE apenas o reconecta de forma idempotente.
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

notify pgrst, 'reload schema';
