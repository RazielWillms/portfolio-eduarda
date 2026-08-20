-- Historico profissional leve: nao transporta observacoes, medicoes ou tentativas.
create or replace function public.listar_sessoes_profissional_paginadas(
 p_busca text default'',p_inicio date default null,p_fim date default null,p_limite integer default 20,p_offset integer default 0)
returns table(id uuid,paciente_id uuid,paciente_nome text,data date,contexto text,ambiente_tipo text,total_alvos bigint,total bigint)
language plpgsql stable security definer set search_path='' set row_security=off as $$begin
 if auth.uid()is null or not public.usuario_ativo()then raise exception'unauthorized'using errcode='42501';end if;
 return query select s.id,s.paciente_id,p.nome_completo,s.data,coalesce(s.contexto,s.ambiente_tipo,'Contexto não informado'),s.ambiente_tipo,count(r.id),count(*)over()
 from public.sessoes_clinicas s join public.pacientes p on p.id=s.paciente_id left join public.registros_medicao r on r.sessao_id=s.id
 where s.profissional_id=auth.uid()and s.deleted_at is null
  and(p_inicio is null or s.data>=p_inicio)and(p_fim is null or s.data<=p_fim)
  and(coalesce(trim(p_busca),'')=''or public.normalizar_texto(p.nome_completo)like'%'||public.normalizar_texto(p_busca)||'%')
 group by s.id,s.paciente_id,p.nome_completo,s.data,s.contexto,s.ambiente_tipo,s.created_at
 order by s.data desc,s.created_at desc limit least(greatest(p_limite,1),50)offset greatest(p_offset,0);
end$$;
revoke all on function public.listar_sessoes_profissional_paginadas(text,date,date,integer,integer)from public;
grant execute on function public.listar_sessoes_profissional_paginadas(text,date,date,integer,integer)to authenticated;
notify pgrst,'reload schema';
