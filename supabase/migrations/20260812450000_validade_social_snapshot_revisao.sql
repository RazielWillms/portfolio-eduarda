-- Snapshot estruturado de validade social, sem copiar relatos sensíveis.
create or replace function public.criar_revisao_clinica_alvo_v3(p_alvo_id uuid,p_periodo_inicio date,p_periodo_fim date,p_decisao text,p_justificativa text,p_proxima_revisao_em date,p_confirmar_limitacoes boolean default false)
returns uuid language plpgsql security definer set search_path='pg_catalog','public' set row_security=off as $$
declare v_id uuid;v_paciente_id uuid;v_validade public.registros_validade_social%rowtype;v_snapshot jsonb;
begin
 v_id:=public.criar_revisao_clinica_alvo_v2(p_alvo_id,p_periodo_inicio,p_periodo_fim,p_decisao,p_justificativa,p_proxima_revisao_em,p_confirmar_limitacoes);
 select o.paciente_id into v_paciente_id from public.alvos_clinicos a join public.objetivos_clinicos o on o.id=a.objetivo_id where a.id=p_alvo_id and a.profissional_id=auth.uid();
 select v.* into v_validade from public.registros_validade_social v where v.paciente_id=v_paciente_id and v.profissional_id=auth.uid()and(v.alvo_id=p_alvo_id or v.alvo_id is null)order by(v.alvo_id=p_alvo_id)desc,v.registrado_em desc,v.created_at desc limit 1;
 select evidencias_snapshot into v_snapshot from public.revisoes_clinicas_alvo where id=v_id;
 update public.revisoes_clinicas_alvo set evidencias_snapshot=v_snapshot||jsonb_build_object('validade_social_id',v_validade.id,'validade_social_em',v_validade.registrado_em,'objetivo_relevante',v_validade.objetivo_relevante,'aceitabilidade',v_validade.aceitabilidade,'viabilidade',v_validade.viabilidade,'beneficio_percebido',v_validade.beneficio_percebido,'assentimento_observado',v_validade.assentimento_observado,'snapshot_versao',3)where id=v_id;
 return v_id;
end $$;
revoke all on function public.criar_revisao_clinica_alvo_v3(uuid,date,date,text,text,date,boolean)from public;
grant execute on function public.criar_revisao_clinica_alvo_v3(uuid,date,date,text,text,date,boolean)to authenticated;
notify pgrst,'reload schema';
