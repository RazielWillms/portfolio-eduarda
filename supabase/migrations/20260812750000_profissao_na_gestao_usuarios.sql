create or replace function public.atualizar_profissao_profile_admin(p_usuario_id uuid,p_profissao_id uuid)
returns void language plpgsql security definer set search_path='' set row_security=off as $$
declare v_profissao public.profissoes%rowtype;
begin
 if auth.uid() is null or not public.usuario_ativo() or not public.usuario_tem_permissao('usuarios.editar') then raise exception 'forbidden' using errcode='42501';end if;
 if p_profissao_id is not null then select * into v_profissao from public.profissoes where id=p_profissao_id and ativo;if v_profissao.id is null then raise exception 'invalid_profession' using errcode='22023';end if;end if;
 if not exists(select 1 from public.profiles where id=p_usuario_id)then raise exception 'profile_not_found' using errcode='P0002';end if;
 update public.profiles set profissao_id=p_profissao_id,profissao=v_profissao.nome,conselho_tipo=v_profissao.conselho_sigla where id=p_usuario_id;
end$$;
revoke all on function public.atualizar_profissao_profile_admin(uuid,uuid) from public;
grant execute on function public.atualizar_profissao_profile_admin(uuid,uuid) to authenticated;
notify pgrst,'reload schema';
