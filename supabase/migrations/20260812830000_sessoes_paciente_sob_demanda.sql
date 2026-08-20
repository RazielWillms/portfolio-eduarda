-- Resumos paginados do historico de um paciente; conteudo clinico permanece sob RLS.
create or replace function public.listar_sessoes_paciente_paginadas(p_paciente_id uuid,p_canceladas boolean default false,p_limite integer default 15,p_offset integer default 0)
returns table(id uuid,paciente_id uuid,profissional_id uuid,data date,contexto text,ambiente_tipo text,finalidade text,status text,motivo_cancelamento text,total_alvos bigint,total_abc bigint,total bigint)
language plpgsql stable security definer set search_path='' set row_security=off as $$begin
 if auth.uid()is null or not public.usuario_ativo()or not(public.usuario_tem_permissao('clinico.visualizar')or public.usuario_tem_permissao('clinico.visualizar_todos'))then raise exception'unauthorized'using errcode='42501';end if;
 return query select s.id,s.paciente_id,s.profissional_id,s.data,coalesce(s.contexto,s.ambiente_tipo,'Contexto não informado'),s.ambiente_tipo,s.finalidade,s.status,s.motivo_cancelamento,
  (select count(*)from public.registros_medicao r where r.sessao_id=s.id),(select count(*)from public.observacoes_abc o where o.sessao_id=s.id),count(*)over()
 from public.sessoes_clinicas s where s.paciente_id=p_paciente_id
  and((s.profissional_id=auth.uid()and public.usuario_tem_permissao('clinico.visualizar'))or public.usuario_tem_permissao('clinico.visualizar_todos'))
  and(case when p_canceladas then s.status='cancelada'and s.deleted_at is not null else s.status<>'cancelada'and s.deleted_at is null end)
 order by case when p_canceladas then s.cancelada_em else s.data::timestamptz end desc nulls last,s.created_at desc
 limit least(greatest(p_limite,1),50)offset greatest(p_offset,0);
end$$;
revoke all on function public.listar_sessoes_paciente_paginadas(uuid,boolean,integer,integer)from public;
grant execute on function public.listar_sessoes_paciente_paginadas(uuid,boolean,integer,integer)to authenticated;
notify pgrst,'reload schema';
