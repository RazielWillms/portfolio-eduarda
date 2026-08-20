-- Impede prontuário antecipado e libera o registro vinculado somente no início do compromisso.
create or replace function public.registrar_sessao_clinica_v8(
  p_paciente_id uuid,p_data date,p_contexto text,p_observacoes_privadas text,
  p_registros jsonb,p_ambiente_tipo text,p_aplicador_tipo text,p_integridade jsonb,
  p_observacoes_abc jsonb,p_finalidade text,p_tentativas jsonb default '[]',
  p_agendamento_id uuid default null
)
returns uuid language plpgsql security definer
set search_path='pg_catalog','public' set row_security=off as $$
declare
  v_inicio timestamptz;
begin
  if not public.usuario_tem_permissao('sessoes.registrar') then
    raise exception 'unauthorized' using errcode='42501';
  end if;

  if p_data > (now() at time zone 'America/Sao_Paulo')::date then
    raise exception 'future_session_date' using errcode='22023';
  end if;

  if p_agendamento_id is not null then
    select inicio into v_inicio from public.agendamentos where id=p_agendamento_id;
    if v_inicio is not null and v_inicio > now() then
      raise exception 'schedule_not_started' using errcode='22023';
    end if;
  end if;

  return public.registrar_sessao_clinica_v7(
    p_paciente_id,p_data,p_contexto,p_observacoes_privadas,p_registros,
    p_ambiente_tipo,p_aplicador_tipo,p_integridade,p_observacoes_abc,
    p_finalidade,p_tentativas,p_agendamento_id
  );
end$$;

revoke all on function public.registrar_sessao_clinica_v8(uuid,date,text,text,jsonb,text,text,jsonb,jsonb,text,jsonb,uuid) from public;
grant execute on function public.registrar_sessao_clinica_v8(uuid,date,text,text,jsonb,text,text,jsonb,jsonb,text,jsonb,uuid) to authenticated;
revoke execute on function public.registrar_sessao_clinica_v7(uuid,date,text,text,jsonb,text,text,jsonb,jsonb,text,jsonb,uuid) from authenticated;

notify pgrst,'reload schema';
