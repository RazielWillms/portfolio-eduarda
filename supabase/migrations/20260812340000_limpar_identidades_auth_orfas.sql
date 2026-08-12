-- Repara identidades órfãs deixadas por exclusões ou tentativas antigas de
-- criação. Uma identidade é órfã somente quando seu user_id não existe mais em
-- auth.users; portanto, nenhuma conta válida é atingida.

delete from auth.identities as identidade
where not exists (
  select 1
  from auth.users as usuario
  where usuario.id = identidade.user_id
);

