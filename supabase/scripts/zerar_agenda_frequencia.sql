-- Zera somente os módulos de Agenda, Disponibilidade e Frequência.
-- Execute no SQL Editor do Supabase com uma conta administrativa.
begin;

-- Remove os registros dependentes antes dos agendamentos.
delete from public.ocorrencias_frequencia;
delete from public.agendamentos_historico;
delete from public.agendamentos;
delete from public.series_agendamentos;

-- Configurações operacionais da agenda.
delete from public.indisponibilidades_profissional;
delete from public.disponibilidades_profissional;

-- Evita manter auditorias apontando para registros que deixaram de existir.
delete from public.audit_logs
where entity_type in ('agendamentos', 'series_agendamentos', 'ocorrencias_frequencia', 'indisponibilidades_profissional')
   or action in (
     'AGENDAMENTO_CRIADO', 'AGENDAMENTO_STATUS_ALTERADO', 'AGENDAMENTO_REALIZADO',
     'AGENDAMENTO_REAGENDADO', 'AGENDAMENTO_EDITADO', 'AGENDAMENTO_CANCELADO',
     'SERIE_AGENDAMENTOS_CRIADA', 'DISPONIBILIDADE_ATUALIZADA',
     'INDISPONIBILIDADE_CRIADA', 'OCORRENCIA_FREQUENCIA_CRIADA',
     'OCORRENCIA_FREQUENCIA_CANCELADA'
   );

commit;

select
  (select count(*) from public.agendamentos) as agendamentos,
  (select count(*) from public.ocorrencias_frequencia) as ocorrencias_frequencia,
  (select count(*) from public.series_agendamentos) as series,
  (select count(*) from public.disponibilidades_profissional) as expedientes,
  (select count(*) from public.indisponibilidades_profissional) as bloqueios;
