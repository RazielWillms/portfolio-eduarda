-- Completa o painel profissional com agenda e solicitacoes sem carregar listas inteiras.
create or replace function public.obter_painel_profissional_agregado()
returns jsonb language plpgsql stable security definer set search_path='' set row_security=off as $$
declare
 v_uid uuid:=auth.uid();
 v_inicio date:=date_trunc('month',current_date)::date;
 v_agora timestamptz:=now();
 v_fim_agenda timestamptz:=now()+interval '7 days';
begin
 if v_uid is null or not public.usuario_ativo()then raise exception'unauthorized'using errcode='42501';end if;
 return jsonb_build_object(
  'totais',jsonb_build_object(
   'pacientes_ativos',(select count(*)from public.pacientes p join public.paciente_psicologos pp on pp.paciente_id=p.id where pp.psicologo_id=v_uid and p.status='ativo'and not public.paciente_demonstracao(p.id)),
   'sessoes_mes',(select count(*)from public.sessoes_clinicas s where s.profissional_id=v_uid and s.deleted_at is null and s.data>=v_inicio),
   'alvos_ativos',(select count(*)from public.alvos_clinicos a join public.objetivos_clinicos o on o.id=a.objetivo_id join public.planos_clinicos pl on pl.id=o.plano_id join public.paciente_psicologos pp on pp.paciente_id=pl.paciente_id where pp.psicologo_id=v_uid and a.profissional_id=v_uid and a.ativo and a.fase not in('pausado','encerrado')),
   'configuracoes_pendentes',(select count(*)from public.alvos_clinicos a join public.objetivos_clinicos o on o.id=a.objetivo_id join public.planos_clinicos pl on pl.id=o.plano_id join public.paciente_psicologos pp on pp.paciente_id=pl.paciente_id where pp.psicologo_id=v_uid and a.profissional_id=v_uid and a.ativo and(not exists(select 1 from public.configuracoes_medicao_alvo m where m.alvo_id=a.id)or not exists(select 1 from public.criterios_dominio_alvo c where c.alvo_id=a.id)or(a.fase<>'linha_de_base'and not exists(select 1 from public.protocolos_intervencao_alvo pi where pi.alvo_id=a.id)))),
   'solicitacoes_pendentes',(select count(*)from public.solicitacoes_acesso s where public.usuario_tem_permissao('acessos.aprovar')and s.status='pendente'and s.solicitante_id<>v_uid and(public.usuario_tem_permissao('acessos.aprovar_global')or exists(select 1 from public.paciente_psicologos pp where pp.paciente_id=s.paciente_id and pp.psicologo_id=v_uid)))
  ),
  'proximo_compromisso',(select jsonb_build_object('id',a.id,'paciente_id',a.paciente_id,'paciente_nome',p.nome_completo,'inicio',a.inicio)from public.agendamentos a join public.pacientes p on p.id=a.paciente_id where a.profissional_id=v_uid and a.inicio>=v_agora and a.inicio<v_fim_agenda and a.status in('agendado','confirmado')and not public.paciente_demonstracao(a.paciente_id)order by a.inicio limit 1),
  'pacientes',coalesce((select jsonb_agg(jsonb_build_object('id',x.id,'nome',x.nome,'alvos_ativos',x.alvos_ativos,'sessoes_mes',x.sessoes_mes,'ultima_sessao',x.ultima_sessao)order by x.nome)from(select p.id,p.nome_completo nome,(select count(*)from public.alvos_clinicos a join public.objetivos_clinicos o on o.id=a.objetivo_id join public.planos_clinicos pl on pl.id=o.plano_id where pl.paciente_id=p.id and a.profissional_id=v_uid and a.ativo and a.fase not in('pausado','encerrado'))alvos_ativos,(select count(*)from public.sessoes_clinicas s where s.paciente_id=p.id and s.profissional_id=v_uid and s.deleted_at is null and s.data>=v_inicio)sessoes_mes,(select max(s.data)from public.sessoes_clinicas s where s.paciente_id=p.id and s.profissional_id=v_uid and s.deleted_at is null)ultima_sessao from public.pacientes p join public.paciente_psicologos pp on pp.paciente_id=p.id where pp.psicologo_id=v_uid and p.status='ativo'and not public.paciente_demonstracao(p.id)order by p.nome_completo limit 12)x),'[]'::jsonb),
  'sessoes_recentes',coalesce((select jsonb_agg(jsonb_build_object('id',x.id,'paciente_id',x.paciente_id,'paciente_nome',x.paciente_nome,'data',x.data,'contexto',x.contexto,'alvos',x.alvos)order by x.data desc,x.created_at desc)from(select s.id,s.paciente_id,p.nome_completo paciente_nome,s.data,coalesce(s.contexto,s.ambiente_tipo,'Contexto não informado')contexto,s.created_at,(select count(*)from public.registros_medicao r where r.sessao_id=s.id)alvos from public.sessoes_clinicas s join public.pacientes p on p.id=s.paciente_id where s.profissional_id=v_uid and s.deleted_at is null order by s.data desc,s.created_at desc limit 5)x),'[]'::jsonb)
 );
end$$;
revoke all on function public.obter_painel_profissional_agregado()from public;
grant execute on function public.obter_painel_profissional_agregado()to authenticated;
notify pgrst,'reload schema';
