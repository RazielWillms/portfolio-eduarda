create or replace function public.listar_pacientes_coordenacao(p_busca text default'',p_status text default'ativo',p_limite integer default 20,p_offset integer default 0)
returns table(id uuid,nome text,responsavel text,status text,profissionais_vinculados bigint,vinculado_usuario boolean,total bigint)
language plpgsql stable security definer set search_path='' set row_security=off as $$begin
 if auth.uid()is null or not public.usuario_ativo()or not public.usuario_tem_permissao('pacientes.cadastrar_administrativo')then raise exception'unauthorized'using errcode='42501';end if;
 return query select p.id,p.nome_completo,p.nome_responsavel,p.status,
  (select count(*)from public.paciente_psicologos equipe where equipe.paciente_id=p.id),
  exists(select 1 from public.paciente_psicologos proprio where proprio.paciente_id=p.id and proprio.psicologo_id=auth.uid()),count(*)over()
 from public.pacientes p where not public.paciente_demonstracao(p.id)
 and(p_status='todos'or p.status=p_status)
 and(coalesce(trim(p_busca),'')=''or p.nome_completo ilike'%'||trim(p_busca)||'%'or coalesce(p.nome_responsavel,'')ilike'%'||trim(p_busca)||'%')
 order by p.nome_completo limit least(greatest(p_limite,1),50)offset greatest(p_offset,0);
end$$;
revoke all on function public.listar_pacientes_coordenacao(text,text,integer,integer)from public;
grant execute on function public.listar_pacientes_coordenacao(text,text,integer,integer)to authenticated;
notify pgrst,'reload schema';
