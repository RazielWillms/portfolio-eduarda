-- Massa densa para testar Agenda, Disponibilidade e Frequencia.
-- Historico: ultimos dois meses. Agenda futura: proximos sete dias.
-- Execute primeiro zerar_agenda_frequencia.sql.
begin;

do $$
declare
  v_teste uuid; v_eduarda uuid; v_quantidade integer;
  v_davi constant uuid := '7cacd53e-c5f1-4982-8664-9cfb80b7fd15';
  v_paciente_teste constant uuid := 'f6c53556-8876-4524-bd93-7b6afda28725';
  v_bloqueio_teste date; v_bloqueio_eduarda date;
begin
  select count(*), (array_agg(id))[1] into v_quantidade, v_teste from public.profiles where lower(trim(nome))=lower('Teste');
  if v_quantidade<>1 then raise exception 'Esperado exatamente um profile chamado Teste; encontrados: %',v_quantidade; end if;
  select count(*), (array_agg(id))[1] into v_quantidade, v_eduarda from public.profiles where lower(trim(nome))=lower('Eduarda do Amarante Chiodi');
  if v_quantidade<>1 then raise exception 'Esperado exatamente um profile chamado Eduarda do Amarante Chiodi; encontrados: %',v_quantidade; end if;
  if not exists(select 1 from public.pacientes where id=v_davi and status='ativo') then raise exception 'Davi dos Santos Junior nao foi encontrado ou nao esta ativo.'; end if;
  if not exists(select 1 from public.pacientes where id=v_paciente_teste and status='ativo') then raise exception 'Paciente teste nao foi encontrado ou nao esta ativo.'; end if;
  if public.usuario_demonstracao(v_teste) or public.usuario_demonstracao(v_eduarda) or public.paciente_demonstracao(v_davi) or public.paciente_demonstracao(v_paciente_teste) then
    raise exception 'A carga nao pode utilizar usuarios ou pacientes reservados para demonstracao.';
  end if;

  -- Dois turnos, preservando o intervalo de almoco.
  insert into public.disponibilidades_profissional(profissional_id,dia_semana,hora_inicio,hora_fim,ativo)
  select profissional_id,dia_semana,turno.hora_inicio,turno.hora_fim,true
  from (values(v_teste),(v_eduarda)) profissionais(profissional_id)
  cross join generate_series(1,5) dia_semana
  cross join (values(time '08:00',time '12:00'),(time '13:30',time '18:00')) turno(hora_inicio,hora_fim)
  on conflict(profissional_id,dia_semana,hora_inicio,hora_fim) do update set ativo=excluded.ativo,updated_at=now();

  select d::date into v_bloqueio_teste from generate_series(current_date+1,current_date+10,interval '1 day') d where extract(isodow from d) between 1 and 5 order by d limit 1;
  select d::date into v_bloqueio_eduarda from generate_series(current_date+1,current_date+10,interval '1 day') d where extract(isodow from d) between 1 and 5 order by d offset 1 limit 1;

  -- Um bloqueio pontual futuro para cada pessoa, visivel na consulta de disponibilidade.
  insert into public.indisponibilidades_profissional(profissional_id,inicio,fim,motivo,criado_por,created_at) values
    (v_teste,(v_bloqueio_teste+time '09:20') at time zone 'America/Sao_Paulo',(v_bloqueio_teste+time '10:40') at time zone 'America/Sao_Paulo','Reuniao interna da equipe',v_teste,now()),
    (v_eduarda,(v_bloqueio_eduarda+time '14:10') at time zone 'America/Sao_Paulo',(v_bloqueio_eduarda+time '15:30') at time zone 'America/Sao_Paulo','Compromisso profissional externo',v_eduarda,now());

  create temporary table tmp_agenda_ficticia(id uuid primary key,paciente_id uuid not null,profissional_id uuid not null,inicio timestamptz not null,sequencia integer not null) on commit drop;

  -- Treze compromissos diarios de 40 minutos por profissional.
  insert into tmp_agenda_ficticia
  select gen_random_uuid(),
    case when (p.ordem+h.ordem+extract(doy from dia)::integer)%2=0 then v_davi else v_paciente_teste end,
    p.profissional_id,(dia::date+h.horario) at time zone 'America/Sao_Paulo',
    row_number() over(order by dia,p.ordem,h.ordem)::integer
  from generate_series(current_date-interval '2 months',current_date+interval '7 days',interval '1 day') dia
  cross join (values(1,v_teste),(2,v_eduarda)) p(ordem,profissional_id)
  cross join (values
    (1,time '08:00'),(2,time '08:40'),(3,time '09:20'),(4,time '10:00'),(5,time '10:40'),(6,time '11:20'),
    (7,time '13:30'),(8,time '14:10'),(9,time '14:50'),(10,time '15:30'),(11,time '16:10'),(12,time '16:50'),(13,time '17:30')) h(ordem,horario)
  where extract(isodow from dia) between 1 and 5
    and not(p.profissional_id=v_teste and dia::date=v_bloqueio_teste and h.horario>=time '09:20' and h.horario<time '10:40')
    and not(p.profissional_id=v_eduarda and dia::date=v_bloqueio_eduarda and h.horario>=time '14:10' and h.horario<time '15:30');

  insert into public.agendamentos(id,paciente_id,profissional_id,inicio,fim,finalidade,modalidade,local,status,observacao_administrativa,criado_por,created_at,updated_at,cancelado_em,cancelado_por,cancelamento_motivo)
  select s.id,s.paciente_id,s.profissional_id,s.inicio,s.inicio+interval '40 minutes',
    case s.sequencia%4 when 0 then 'intervencao' when 1 then 'avaliacao_inicial' when 2 then 'generalizacao' else 'orientacao_familiar' end,
    case when s.sequencia%9=0 then 'domiciliar' else 'presencial' end,
    case when s.sequencia%9=0 then 'Residencia do paciente' else 'Clinica' end,
    case when (s.inicio at time zone 'America/Sao_Paulo')::date>current_date then case when s.sequencia%3=0 then 'confirmado' else 'agendado' end
      when s.sequencia%13=0 then 'cancelado' when s.sequencia%4=0 or s.sequencia%7=0 then 'falta' else 'realizado' end,
    'Registro ficticio para demonstracao de agenda e frequencia.',s.profissional_id,s.inicio-interval '7 days',greatest(s.inicio+interval '1 hour',now()-interval '1 day'),
    case when (s.inicio at time zone 'America/Sao_Paulo')::date<=current_date and s.sequencia%13=0 then s.inicio-interval '1 day' end,
    case when (s.inicio at time zone 'America/Sao_Paulo')::date<=current_date and s.sequencia%13=0 then s.profissional_id end,
    case when (s.inicio at time zone 'America/Sao_Paulo')::date<=current_date and s.sequencia%13=0 then 'Cancelamento administrativo ficticio.' end
  from tmp_agenda_ficticia s;

  -- Volume alto de faltas, com motivos variados para alimentar os relatorios.
  insert into public.ocorrencias_frequencia(paciente_id,profissional_id,agendamento_id,agendamento_status_anterior,data_ocorrencia,tipo,motivo,observacao_administrativa,criado_por,created_at,updated_at)
  select s.paciente_id,s.profissional_id,s.id,'agendado',(s.inicio at time zone 'America/Sao_Paulo')::date,
    case when s.sequencia%13=0 and s.sequencia%2=0 then 'cancelamento_profissional' when s.sequencia%13=0 then 'cancelamento_clinica'
      when s.sequencia%3=0 then 'falta_justificada' else 'falta_nao_justificada' end,
    case when s.sequencia%13=0 then 'Reorganizacao administrativa da agenda.' when s.sequencia%9=0 then 'Atestado medico informado pelo responsavel.'
      when s.sequencia%3=0 then 'Imprevisto familiar comunicado previamente.' else null end,
    case when s.sequencia%13=0 then 'Familia comunicada; reposicao ainda nao definida.' when s.sequencia%3=0 then 'Justificativa registrada pela equipe administrativa.'
      else 'Nao houve justificativa ate o fechamento do periodo.' end,
    s.profissional_id,s.inicio+interval '1 hour',s.inicio+interval '1 hour'
  from tmp_agenda_ficticia s
  where (s.inicio at time zone 'America/Sao_Paulo')::date<=current_date and(s.sequencia%13=0 or s.sequencia%4=0 or s.sequencia%7=0);
end $$;

commit;

select
 (select count(*) from public.agendamentos where inicio>=current_date-interval '2 months') as compromissos,
 (select count(*) from public.agendamentos where inicio>now() and status in('agendado','confirmado')) as compromissos_futuros,
 (select count(*) from public.indisponibilidades_profissional where cancelado_em is null) as bloqueios_pontuais,
 (select count(*) from public.ocorrencias_frequencia where data_ocorrencia>=current_date-interval '2 months') as ocorrencias,
 (select count(*) from public.ocorrencias_frequencia where data_ocorrencia>=current_date-interval '2 months' and tipo='falta_justificada') as faltas_justificadas,
 (select count(*) from public.ocorrencias_frequencia where data_ocorrencia>=current_date-interval '2 months' and tipo='falta_nao_justificada') as faltas_nao_justificadas,
 (select count(*) from public.ocorrencias_frequencia where data_ocorrencia>=current_date-interval '2 months' and tipo like 'cancelamento_%') as cancelamentos;
