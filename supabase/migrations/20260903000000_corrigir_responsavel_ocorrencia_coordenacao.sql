-- Restaura a regra assistencial: profissionais e coordenadores ativos podem atender.
-- Preserva permissões, vínculo, sequência, agenda e auditoria. Não altera lançamentos.
begin;

create or replace function public.registrar_ocorrencia_frequencia(p_paciente_id uuid,p_profissional_id uuid,p_data date,p_tipo text,p_motivo text,p_observacao text,p_agendamento_id uuid default null,p_continuidade_falta text default null,p_ocorrencia_anterior_id uuid default null)
returns uuid language plpgsql security definer set search_path='' set row_security=off as $$declare v_id uuid;a public.agendamentos%rowtype;anterior public.ocorrencias_frequencia%rowtype;v_ultima_id uuid;v_quantidade integer;begin
 if not public.usuario_ativo()or not(public.usuario_tem_permissao('frequencia.gerenciar')or(p_profissional_id=auth.uid()and public.usuario_tem_permissao('frequencia.registrar_propria')and public.usuario_vinculado(p_paciente_id)))then raise exception'unauthorized'using errcode='42501';end if;
 if p_data is null or p_data>current_date then raise exception'invalid_occurrence_date'using errcode='22023';end if;
 if p_tipo is null or p_tipo not in('falta_justificada','falta_nao_justificada','cancelamento_clinica','cancelamento_profissional')then raise exception'invalid_occurrence_type'using errcode='22023';end if;
 if p_tipo='falta_justificada'and length(trim(coalesce(p_motivo,'')))<3 then raise exception'invalid_occurrence_reason'using errcode='22023';end if;
 if not exists(select 1 from public.pacientes where id=p_paciente_id and status='ativo')then raise exception'invalid_occurrence_patient'using errcode='22023';end if;
 if not public.perfil_pode_atender(p_profissional_id)then raise exception'invalid_occurrence_professional'using errcode='22023';end if;
 perform pg_advisory_xact_lock(hashtextextended(p_paciente_id::text||p_profissional_id::text,0));
 if p_tipo='falta_nao_justificada'then
  select id into v_ultima_id from public.ocorrencias_frequencia where paciente_id=p_paciente_id and profissional_id=p_profissional_id and tipo='falta_nao_justificada'and cancelado_em is null and data_ocorrencia<p_data order by data_ocorrencia desc,created_at desc limit 1;
  if v_ultima_id is null then p_continuidade_falta:='inicio_sequencia';p_ocorrencia_anterior_id:=null;v_quantidade:=1;
  elsif p_ocorrencia_anterior_id is distinct from v_ultima_id then raise exception'stale_previous_occurrence'using errcode='22023';
  elsif p_continuidade_falta='consecutiva_confirmada'then select*into anterior from public.ocorrencias_frequencia where id=v_ultima_id; if anterior.sequencia_quantidade is null then raise exception'invalid_sequence'using errcode='22023';end if;v_quantidade:=anterior.sequencia_quantidade+1;
  elsif p_continuidade_falta='sequencia_interrompida'then p_ocorrencia_anterior_id:=null;v_quantidade:=1;
  elsif p_continuidade_falta='nao_confirmada'then v_quantidade:=null;
  else raise exception'invalid_sequence'using errcode='22023';end if;
 else p_continuidade_falta:=null;p_ocorrencia_anterior_id:=null;v_quantidade:=null;end if;
 if p_agendamento_id is not null then select*into a from public.agendamentos where id=p_agendamento_id for update;if a.id is null or a.paciente_id<>p_paciente_id or a.profissional_id<>p_profissional_id or(a.inicio at time zone'America/Sao_Paulo')::date<>p_data or a.status not in('agendado','confirmado')then raise exception'invalid_schedule_link'using errcode='22023';end if;end if;
 insert into public.ocorrencias_frequencia(paciente_id,profissional_id,agendamento_id,agendamento_status_anterior,data_ocorrencia,tipo,motivo,observacao_administrativa,continuidade_falta,ocorrencia_anterior_id,sequencia_quantidade,criado_por)values(p_paciente_id,p_profissional_id,p_agendamento_id,case when p_agendamento_id is not null then a.status end,p_data,p_tipo,nullif(trim(p_motivo),''),nullif(trim(p_observacao),''),p_continuidade_falta,p_ocorrencia_anterior_id,v_quantidade,auth.uid())returning id into v_id;
 if p_agendamento_id is not null and p_tipo in('falta_justificada','falta_nao_justificada')then update public.agendamentos set status='falta',updated_at=now()where id=p_agendamento_id;end if;
 insert into public.audit_logs(user_id,action,entity_type,entity_id,metadata)values(auth.uid(),'OCORRENCIA_FREQUENCIA_CRIADA','ocorrencias_frequencia',v_id,jsonb_build_object('tipo',p_tipo,'agendamento_vinculado',p_agendamento_id is not null,'continuidade_falta',p_continuidade_falta,'sequencia_quantidade',v_quantidade));return v_id;
exception when unique_violation then raise exception'duplicate_schedule_occurrence'using errcode='23505';end$$;

revoke all on function public.registrar_ocorrencia_frequencia(uuid,uuid,date,text,text,text,uuid,text,uuid)from public;
grant execute on function public.registrar_ocorrencia_frequencia(uuid,uuid,date,text,text,text,uuid,text,uuid)to authenticated;
notify pgrst,'reload schema';
commit;

