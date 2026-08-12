-- Fotos opcionais em bucket privado, com acesso limitado ao dono ou profissional vinculado.
alter table public.profiles add column if not exists foto_path text;
alter table public.pacientes add column if not exists foto_path text;
alter table public.profiles drop constraint if exists profiles_foto_path_check;
alter table public.profiles add constraint profiles_foto_path_check check(foto_path is null or foto_path~'^profiles/[0-9a-f-]{36}/[0-9]+\.(jpg|png|webp)$');
alter table public.pacientes drop constraint if exists pacientes_foto_path_check;
alter table public.pacientes add constraint pacientes_foto_path_check check(foto_path is null or foto_path~'^patients/[0-9a-f-]{36}/[0-9]+\.(jpg|png|webp)$');

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('fotos-cadastro','fotos-cadastro',false,2097152,array['image/jpeg','image/png','image/webp'])
on conflict(id)do update set public=false,file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types;

drop policy if exists fotos_cadastro_select on storage.objects;
create policy fotos_cadastro_select on storage.objects for select to authenticated using(
 bucket_id='fotos-cadastro'and(
  (storage.foldername(name))[1]='profiles'and((storage.foldername(name))[2])::uuid=auth.uid()
  or(storage.foldername(name))[1]='profiles'and public.usuario_pode_ver_profile(((storage.foldername(name))[2])::uuid)
  or(storage.foldername(name))[1]='patients'and public.usuario_vinculado(((storage.foldername(name))[2])::uuid)
  or public.usuario_admin()
 )
);
drop policy if exists fotos_cadastro_insert on storage.objects;
create policy fotos_cadastro_insert on storage.objects for insert to authenticated with check(
 bucket_id='fotos-cadastro'and public.usuario_ativo()and(
  (storage.foldername(name))[1]='profiles'and((storage.foldername(name))[2])::uuid=auth.uid()
  or(storage.foldername(name))[1]='patients'and public.usuario_vinculado(((storage.foldername(name))[2])::uuid)
 )
);
drop policy if exists fotos_cadastro_delete on storage.objects;
create policy fotos_cadastro_delete on storage.objects for delete to authenticated using(
 bucket_id='fotos-cadastro'and public.usuario_ativo()and(
  (storage.foldername(name))[1]='profiles'and((storage.foldername(name))[2])::uuid=auth.uid()
  or(storage.foldername(name))[1]='patients'and public.usuario_vinculado(((storage.foldername(name))[2])::uuid)
 )
);

create or replace function public.atualizar_minha_foto(p_foto_path text)returns void language plpgsql security definer set search_path='pg_catalog','public' set row_security=off as $$
begin if auth.uid()is null or not public.usuario_ativo()then raise exception'unauthorized'using errcode='42501';end if;if p_foto_path is not null and p_foto_path!~('^profiles/'||auth.uid()::text||'/[0-9]+\.(jpg|png|webp)$')then raise exception'invalid_photo_path'using errcode='22023';end if;update public.profiles set foto_path=p_foto_path where id=auth.uid();end $$;
create or replace function public.atualizar_foto_paciente(p_paciente_id uuid,p_foto_path text)returns void language plpgsql security definer set search_path='pg_catalog','public' set row_security=off as $$
begin if not public.usuario_ativo()or not public.usuario_vinculado(p_paciente_id)then raise exception'unauthorized'using errcode='42501';end if;if p_foto_path is not null and p_foto_path!~('^patients/'||p_paciente_id::text||'/[0-9]+\.(jpg|png|webp)$')then raise exception'invalid_photo_path'using errcode='22023';end if;update public.pacientes set foto_path=p_foto_path where id=p_paciente_id;end $$;
revoke all on function public.atualizar_minha_foto(text)from public;grant execute on function public.atualizar_minha_foto(text)to authenticated;
revoke all on function public.atualizar_foto_paciente(uuid,text)from public;grant execute on function public.atualizar_foto_paciente(uuid,text)to authenticated;

drop function if exists public.profissionais_vinculados_paciente(uuid);
create function public.profissionais_vinculados_paciente(p_paciente_id uuid)returns table(id uuid,nome text,foto_path text)language sql stable security definer set search_path=''as $$select p.id,p.nome,p.foto_path from public.paciente_psicologos pp join public.profiles p on p.id=pp.psicologo_id and p.status='ativo'where pp.paciente_id=p_paciente_id and(public.usuario_admin()or public.usuario_vinculado(p_paciente_id))order by p.nome$$;
revoke all on function public.profissionais_vinculados_paciente(uuid)from public;grant execute on function public.profissionais_vinculados_paciente(uuid)to authenticated;
notify pgrst,'reload schema';
