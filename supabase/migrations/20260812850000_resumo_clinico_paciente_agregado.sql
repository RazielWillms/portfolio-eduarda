-- Resumo clinico sem transportar planos e sessoes completos.
create or replace function public.obter_resumo_clinico_paciente(p_paciente_id uuid)
returns jsonb language plpgsql stable security definer set search_path='' set row_security=off as $$declare v_uid uuid:=auth.uid();begin
 if v_uid is null or not public.usuario_ativo()or not(public.usuario_vinculado(p_paciente_id)or public.usuario_tem_permissao('clinico.visualizar_todos'))then raise exception'unauthorized'using errcode='42501';end if;
 return jsonb_build_object(
  'alvos_ativos',(select count(*)from public.alvos_clinicos a join public.objetivos_clinicos o on o.id=a.objetivo_id join public.planos_clinicos p on p.id=o.plano_id where p.paciente_id=p_paciente_id and a.profissional_id=v_uid and a.ativo and a.fase not in('pausado','encerrado')),
  'alvos_sem_protocolo',(select count(*)from public.alvos_clinicos a join public.objetivos_clinicos o on o.id=a.objetivo_id join public.planos_clinicos p on p.id=o.plano_id where p.paciente_id=p_paciente_id and a.profissional_id=v_uid and a.ativo and a.fase not in('pausado','encerrado')and not exists(select 1 from public.protocolos_intervencao_alvo pi where pi.alvo_id=a.id)),
  'concordancias_pendentes',(select count(*)from public.solicitacoes_concordancia sc where sc.paciente_id=p_paciente_id and sc.observador_id=v_uid and sc.status='pendente'),
  'revisoes_vencidas',(select count(*)from public.alvos_clinicos a join public.objetivos_clinicos o on o.id=a.objetivo_id join public.planos_clinicos p on p.id=o.plano_id where p.paciente_id=p_paciente_id and a.profissional_id=v_uid and exists(select 1 from public.revisoes_clinicas_alvo r where r.alvo_id=a.id and r.proxima_revisao_em<current_date and not exists(select 1 from public.revisoes_clinicas_alvo r2 where r2.alvo_id=a.id and r2.created_at>r.created_at))),
  'ultima_sessao',(select jsonb_build_object('id',s.id,'data',s.data,'alvos',coalesce((select jsonb_agg(jsonb_build_object('id',a.id,'nome',a.nome)order by a.nome)from public.registros_medicao rm join public.alvos_clinicos a on a.id=rm.alvo_id where rm.sessao_id=s.id),'[]'::jsonb))from public.sessoes_clinicas s where s.paciente_id=p_paciente_id and s.deleted_at is null and((s.profissional_id=v_uid and public.usuario_tem_permissao('clinico.visualizar'))or public.usuario_tem_permissao('clinico.visualizar_todos'))order by s.data desc,s.created_at desc limit 1)
 );end$$;
revoke all on function public.obter_resumo_clinico_paciente(uuid)from public;
grant execute on function public.obter_resumo_clinico_paciente(uuid)to authenticated;
notify pgrst,'reload schema';
