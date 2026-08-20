-- Repara de forma idempotente o bucket privado e suas politicas de acesso.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('fotos-cadastro','fotos-cadastro',false,2097152,array['image/jpeg','image/png','image/webp'])
on conflict(id)do update set public=false,file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types;

drop policy if exists fotos_cadastro_select on storage.objects;
create policy fotos_cadastro_select on storage.objects for select to authenticated using(
 bucket_id='fotos-cadastro'and(
  (storage.foldername(name))[1]='profiles'and(storage.foldername(name))[2]=auth.uid()::text
  or(storage.foldername(name))[1]='profiles'and public.usuario_pode_ver_profile(((storage.foldername(name))[2])::uuid)
  or(storage.foldername(name))[1]='patients'and public.usuario_vinculado(((storage.foldername(name))[2])::uuid)
  or public.usuario_admin()
 )
);

drop policy if exists fotos_cadastro_insert on storage.objects;
create policy fotos_cadastro_insert on storage.objects for insert to authenticated with check(
 bucket_id='fotos-cadastro'and public.usuario_ativo()and(
  (storage.foldername(name))[1]='profiles'and(storage.foldername(name))[2]=auth.uid()::text
  or(storage.foldername(name))[1]='patients'and public.usuario_vinculado(((storage.foldername(name))[2])::uuid)
 )
);

drop policy if exists fotos_cadastro_delete on storage.objects;
create policy fotos_cadastro_delete on storage.objects for delete to authenticated using(
 bucket_id='fotos-cadastro'and public.usuario_ativo()and(
  (storage.foldername(name))[1]='profiles'and(storage.foldername(name))[2]=auth.uid()::text
  or(storage.foldername(name))[1]='patients'and public.usuario_vinculado(((storage.foldername(name))[2])::uuid)
 )
);

notify pgrst,'reload schema';
