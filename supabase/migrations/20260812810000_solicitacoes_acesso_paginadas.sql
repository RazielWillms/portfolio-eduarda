-- Listagem escalavel das solicitacoes sem ampliar a visibilidade de dados.
create or replace function public.listar_solicitacoes_acesso_paginadas(
 p_direcao text,p_busca text default'',p_status text default'todos',p_limite integer default 10,p_offset integer default 0)
returns table(id uuid,paciente_id uuid,solicitante_id uuid,status text,mensagem text,papel_no_caso text,resolvido_por uuid,resolvido_em timestamptz,created_at timestamptz,paciente_nome text,solicitante_nome text,solicitante_email text,total bigint)
language plpgsql stable security definer set search_path='' set row_security=off as $$begin
 if auth.uid()is null or not public.usuario_ativo()or p_direcao not in('recebidas','enviadas')or p_status not in('todos','pendente','aprovado','negado')then raise exception'unauthorized'using errcode='42501';end if;
 return query select s.id,s.paciente_id,s.solicitante_id,s.status,s.mensagem,s.papel_no_caso,s.resolvido_por,s.resolvido_em,s.created_at,p.nome_completo,pr.nome,pr.email,count(*)over()
 from public.solicitacoes_acesso s join public.pacientes p on p.id=s.paciente_id join public.profiles pr on pr.id=s.solicitante_id
 where(
   (p_direcao='enviadas'and s.solicitante_id=auth.uid())or
   (p_direcao='recebidas'and s.solicitante_id<>auth.uid()and public.usuario_tem_permissao('acessos.aprovar')and(public.usuario_tem_permissao('acessos.aprovar_global')or exists(select 1 from public.paciente_psicologos pp where pp.paciente_id=s.paciente_id and pp.psicologo_id=auth.uid())))
  )and(p_status='todos'or s.status=p_status)
  and(coalesce(trim(p_busca),'')=''or public.normalizar_texto(p.nome_completo)like'%'||public.normalizar_texto(p_busca)||'%'or public.normalizar_texto(pr.nome)like'%'||public.normalizar_texto(p_busca)||'%')
 order by s.created_at desc limit least(greatest(p_limite,1),50)offset greatest(p_offset,0);
end$$;
revoke all on function public.listar_solicitacoes_acesso_paginadas(text,text,text,integer,integer)from public;
grant execute on function public.listar_solicitacoes_acesso_paginadas(text,text,text,integer,integer)to authenticated;
notify pgrst,'reload schema';
