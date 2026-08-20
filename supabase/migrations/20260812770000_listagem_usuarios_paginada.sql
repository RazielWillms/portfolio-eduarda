create or replace function public.listar_usuarios_admin(p_busca text default'',p_profissao_id uuid default null,p_papel text default'todos',p_status text default'todos',p_limite integer default 20,p_offset integer default 0)
returns table(id uuid,nome text,email text,papel text,status text,admin_principal boolean,profissao_id uuid,profissao text,total bigint)
language plpgsql stable security definer set search_path='' set row_security=off as $$begin
 if auth.uid()is null or not public.usuario_ativo()or not public.usuario_tem_permissao('usuarios.visualizar')then raise exception'unauthorized'using errcode='42501';end if;
 return query select p.id,p.nome,p.email,p.papel,p.status,p.admin_principal,p.profissao_id,coalesce(pr.nome,p.profissao),count(*)over()
 from public.profiles p left join public.profissoes pr on pr.id=p.profissao_id
 where not public.usuario_demonstracao(p.id)
 and(p_profissao_id is null or p.profissao_id=p_profissao_id)
 and(p_papel='todos'or p.papel=p_papel)and(p_status='todos'or p.status=p_status)
 and(coalesce(trim(p_busca),'')=''or p.nome ilike'%'||trim(p_busca)||'%'or p.email ilike'%'||trim(p_busca)||'%')
 order by p.admin_principal desc,p.nome limit least(greatest(p_limite,1),50)offset greatest(p_offset,0);
end$$;
revoke all on function public.listar_usuarios_admin(text,uuid,text,text,integer,integer)from public;
grant execute on function public.listar_usuarios_admin(text,uuid,text,text,integer,integer)to authenticated;
notify pgrst,'reload schema';
