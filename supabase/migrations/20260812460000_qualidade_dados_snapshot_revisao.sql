-- Acrescenta indicadores reprodutíveis de qualidade ao snapshot da revisão.
create or replace function public.criar_revisao_clinica_alvo_v4(p_alvo_id uuid,p_periodo_inicio date,p_periodo_fim date,p_decisao text,p_justificativa text,p_proxima_revisao_em date,p_confirmar_limitacoes boolean default false)
returns uuid language plpgsql security definer set search_path='pg_catalog','public' set row_security=off as $$
declare v_id uuid;v_paciente uuid;v_total integer;v_integridade integer;v_ioa_n integer;v_ioa numeric;v_competencia numeric;v_competencia_em date;v_snapshot jsonb;
begin
 v_id:=public.criar_revisao_clinica_alvo_v3(p_alvo_id,p_periodo_inicio,p_periodo_fim,p_decisao,p_justificativa,p_proxima_revisao_em,p_confirmar_limitacoes);
 select o.paciente_id into v_paciente from public.alvos_clinicos a join public.objetivos_clinicos o on o.id=a.objetivo_id where a.id=p_alvo_id and a.profissional_id=auth.uid();
 select count(*),count(i.id)into v_total,v_integridade from public.registros_medicao r join public.sessoes_clinicas s on s.id=r.sessao_id left join public.integridade_procedimental i on i.registro_medicao_id=r.id where r.alvo_id=p_alvo_id and s.profissional_id=auth.uid()and s.status='finalizada'and s.deleted_at is null and s.data between p_periodo_inicio and p_periodo_fim;
 select count(*),round(avg(c.concordancia_percentual),2)into v_ioa_n,v_ioa from public.solicitacoes_concordancia c where c.alvo_id=p_alvo_id and c.solicitante_id=auth.uid()and c.status='concluida'and c.respondido_em::date between p_periodo_inicio and p_periodo_fim;
 select c.competencia_percentual,c.realizado_em into v_competencia,v_competencia_em from public.capacitacoes_aplicadores c where c.paciente_id=v_paciente and c.profissional_id=auth.uid()and(c.alvo_id=p_alvo_id or c.alvo_id is null)order by(c.alvo_id=p_alvo_id)desc,c.realizado_em desc,c.created_at desc limit 1;
 select evidencias_snapshot into v_snapshot from public.revisoes_clinicas_alvo where id=v_id;
 update public.revisoes_clinicas_alvo set evidencias_snapshot=v_snapshot||jsonb_build_object('cobertura_integridade_percentual',case when v_total=0 then null else round(v_integridade*100.0/v_total,2)end,'concordancias_concluidas',v_ioa_n,'concordancia_media_percentual',v_ioa,'competencia_aplicador_percentual',v_competencia,'competencia_aplicador_em',v_competencia_em,'snapshot_versao',4)where id=v_id;
 return v_id;
end $$;
revoke all on function public.criar_revisao_clinica_alvo_v4(uuid,date,date,text,text,date,boolean)from public;
grant execute on function public.criar_revisao_clinica_alvo_v4(uuid,date,date,text,text,date,boolean)to authenticated;
notify pgrst,'reload schema';
