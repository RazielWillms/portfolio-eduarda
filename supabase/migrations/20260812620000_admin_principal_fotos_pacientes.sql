-- O administrador principal pode manter fotos cadastrais para suporte,
-- sem conceder a mesma excecao aos demais administradores.
create or replace function public.usuario_admin_principal()
returns boolean language sql stable security definer set search_path='' as $$
 select exists(
  select 1 from public.profiles
  where id=auth.uid()and papel='admin'and status='ativo'and admin_principal
 )
$$;
revoke all on function public.usuario_admin_principal()from public;
grant execute on function public.usuario_admin_principal()to authenticated;

drop policy if exists fotos_cadastro_insert on storage.objects;
create policy fotos_cadastro_insert on storage.objects for insert to authenticated with check(
 bucket_id='fotos-cadastro'and public.usuario_ativo()and(
  (storage.foldername(name))[1]='profiles'and(storage.foldername(name))[2]=auth.uid()::text
  or(storage.foldername(name))[1]='patients'and(
   public.usuario_vinculado(((storage.foldername(name))[2])::uuid)
   or public.usuario_admin_principal()
  )
 )
);

drop policy if exists fotos_cadastro_delete on storage.objects;
create policy fotos_cadastro_delete on storage.objects for delete to authenticated using(
 bucket_id='fotos-cadastro'and public.usuario_ativo()and(
  (storage.foldername(name))[1]='profiles'and(storage.foldername(name))[2]=auth.uid()::text
  or(storage.foldername(name))[1]='patients'and(
   public.usuario_vinculado(((storage.foldername(name))[2])::uuid)
   or public.usuario_admin_principal()
  )
 )
);

create or replace function public.atualizar_foto_paciente(
 p_paciente_id uuid,p_foto_path text,p_zoom numeric default 1,
 p_pos_x numeric default 0,p_pos_y numeric default 0
)returns void language plpgsql security definer
set search_path='pg_catalog','public' set row_security=off as $$begin
 if not public.usuario_ativo()or not(
  public.usuario_vinculado(p_paciente_id)or public.usuario_admin_principal()
 )then raise exception'unauthorized'using errcode='42501';end if;
 if p_foto_path is not null and p_foto_path!~(
  '^patients/'||p_paciente_id::text||'/[0-9]+\.(jpg|png|webp)$'
 )then raise exception'invalid_photo_path'using errcode='22023';end if;
 if p_zoom not between 1 and 2.5 or p_pos_x not between-50 and 50
  or p_pos_y not between-50 and 50
 then raise exception'invalid_photo_crop'using errcode='22023';end if;
 update public.pacientes set foto_path=p_foto_path,foto_zoom=p_zoom,
  foto_pos_x=p_pos_x,foto_pos_y=p_pos_y where id=p_paciente_id;
end$$;
revoke all on function public.atualizar_foto_paciente(uuid,text,numeric,numeric,numeric)from public;
grant execute on function public.atualizar_foto_paciente(uuid,text,numeric,numeric,numeric)to authenticated;

notify pgrst,'reload schema';
