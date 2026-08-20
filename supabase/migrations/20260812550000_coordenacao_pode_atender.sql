-- Coordenação é um papel híbrido: organiza a operação e também pode atender.
create or replace function public.perfil_pode_atender(p_id uuid)
returns boolean language sql stable security definer set search_path='' set row_security=off as $$select exists(select 1 from public.profiles where id=p_id and papel in('profissional','coordenacao')and status='ativo')$$;
revoke all on function public.perfil_pode_atender(uuid)from public;grant execute on function public.perfil_pode_atender(uuid)to authenticated;

create or replace function public.listar_opcoes_agendamento()
returns jsonb language plpgsql stable security definer set search_path='' set row_security=off as $$begin
 if not public.usuario_coordenacao()then raise exception'unauthorized'using errcode='42501';end if;
 return jsonb_build_object(
  'pacientes',coalesce((select jsonb_agg(jsonb_build_object('id',p.id,'nome',p.nome_completo,'status',p.status,'profissionais_vinculados',(select count(*)from public.paciente_psicologos pp where pp.paciente_id=p.id))order by p.nome_completo)from public.pacientes p where p.status='ativo'),'[]'::jsonb),
  'profissionais',coalesce((select jsonb_agg(jsonb_build_object('id',p.id,'nome',p.nome,'profissao',p.profissao)order by p.nome)from public.profiles p where p.status='ativo'and p.papel in('profissional','coordenacao')),'[]'::jsonb));end$$;

create or replace function public.criar_agendamento(p_paciente_id uuid,p_profissional_id uuid,p_inicio timestamptz,p_fim timestamptz,p_finalidade text,p_modalidade text,p_local text,p_observacao text)
returns uuid language plpgsql security definer set search_path='' set row_security=off as $$declare v_id uuid;begin
 if not public.usuario_coordenacao()then raise exception'unauthorized'using errcode='42501';end if;
 perform pg_advisory_xact_lock(hashtextextended(p_profissional_id::text,0));perform pg_advisory_xact_lock(hashtextextended(p_paciente_id::text,1));
 if p_fim<=p_inicio or not exists(select 1 from public.pacientes where id=p_paciente_id and status='ativo')or not public.perfil_pode_atender(p_profissional_id)then raise exception'invalid_schedule'using errcode='22023';end if;
 if not public.horario_disponivel(p_profissional_id,p_inicio,p_fim)then raise exception'professional_conflict_or_unavailable'using errcode='23P01';end if;
 if exists(select 1 from public.agendamentos where paciente_id=p_paciente_id and status in('agendado','confirmado')and tstzrange(inicio,fim,'[)')&&tstzrange(p_inicio,p_fim,'[)'))then raise exception'patient_conflict'using errcode='23P01';end if;
 insert into public.agendamentos(paciente_id,profissional_id,inicio,fim,finalidade,modalidade,local,observacao_administrativa,criado_por)values(p_paciente_id,p_profissional_id,p_inicio,p_fim,trim(p_finalidade),p_modalidade,nullif(trim(p_local),''),nullif(trim(p_observacao),''),auth.uid())returning id into v_id;
 insert into public.audit_logs(user_id,action,entity_type,entity_id,metadata)values(auth.uid(),'AGENDAMENTO_CRIADO','agendamentos',v_id,jsonb_build_object('profissional_id',p_profissional_id,'paciente_id',p_paciente_id,'inicio',p_inicio));return v_id;end$$;

create or replace function public.editar_agendamento(p_id uuid,p_profissional_id uuid,p_finalidade text,p_modalidade text,p_local text,p_observacao text,p_motivo text,p_updated_at timestamptz)
returns void language plpgsql security definer set search_path='' set row_security=off as $$declare a public.agendamentos%rowtype;begin
 if not public.usuario_coordenacao()then raise exception'unauthorized'using errcode='42501';end if;select*into a from public.agendamentos where id=p_id for update;
 if a.id is null or a.status not in('agendado','confirmado')or length(trim(coalesce(p_motivo,'')))<5 or p_modalidade not in('presencial','domiciliar','escola','teleatendimento','outro')or not public.perfil_pode_atender(p_profissional_id)then raise exception'invalid_edit'using errcode='22023';end if;
 if a.updated_at is distinct from p_updated_at then raise exception'stale_schedule'using errcode='40001';end if;
 if p_profissional_id<>a.profissional_id and not public.horario_disponivel(p_profissional_id,a.inicio,a.fim,a.id)then raise exception'professional_conflict_or_unavailable'using errcode='23P01';end if;
 insert into public.agendamentos_historico(agendamento_id,alterado_por,tipo,inicio_anterior,fim_anterior,inicio_novo,fim_novo,motivo)values(a.id,auth.uid(),'edicao',a.inicio,a.fim,a.inicio,a.fim,trim(p_motivo));
 update public.agendamentos set profissional_id=p_profissional_id,finalidade=trim(p_finalidade),modalidade=p_modalidade,local=nullif(trim(p_local),''),observacao_administrativa=nullif(trim(p_observacao),''),status=case when p_profissional_id<>a.profissional_id then'agendado'else status end,updated_at=now()where id=a.id;
 insert into public.audit_logs(user_id,action,entity_type,entity_id,metadata)values(auth.uid(),'AGENDAMENTO_EDITADO','agendamentos',a.id,jsonb_build_object('profissional_alterado',p_profissional_id<>a.profissional_id));end$$;

create or replace function public.salvar_disponibilidade(p_profissional_id uuid,p_periodos jsonb)
returns void language plpgsql security definer set search_path='' set row_security=off as $$declare item jsonb;begin
 if not public.perfil_pode_atender(p_profissional_id)or not(public.usuario_coordenacao()or(auth.uid()=p_profissional_id and public.usuario_ativo()))then raise exception'unauthorized'using errcode='42501';end if;
 if jsonb_typeof(coalesce(p_periodos,'[]'))<>'array'then raise exception'invalid_availability'using errcode='22023';end if;
 delete from public.disponibilidades_profissional where profissional_id=p_profissional_id;
 for item in select value from jsonb_array_elements(p_periodos)loop insert into public.disponibilidades_profissional(profissional_id,dia_semana,hora_inicio,hora_fim)values(p_profissional_id,(item->>'dia_semana')::smallint,(item->>'hora_inicio')::time,(item->>'hora_fim')::time);end loop;
 insert into public.audit_logs(user_id,action,entity_type,entity_id,metadata)values(auth.uid(),'DISPONIBILIDADE_ATUALIZADA','profiles',p_profissional_id,jsonb_build_object('periodos',jsonb_array_length(p_periodos)));exception when invalid_text_representation or check_violation then raise exception'invalid_availability'using errcode='22023';end$$;

create or replace function public.opcoes_frequencia()
returns jsonb language plpgsql stable security definer set search_path='' set row_security=off as $$begin
 if not public.usuario_ativo()then raise exception'unauthorized'using errcode='42501';end if;
 return jsonb_build_object(
  'pacientes',coalesce((select jsonb_agg(jsonb_build_object('id',p.id,'nome',p.nome_completo)order by p.nome_completo)from public.pacientes p where p.status='ativo'and(public.usuario_coordenacao()or exists(select 1 from public.paciente_psicologos pp where pp.paciente_id=p.id and pp.psicologo_id=auth.uid()))),'[]'::jsonb),
  'profissionais',coalesce((select jsonb_agg(jsonb_build_object('id',pr.id,'nome',pr.nome,'profissao',pr.profissao)order by pr.nome)from public.profiles pr where pr.status='ativo'and pr.papel in('profissional','coordenacao')and(public.usuario_coordenacao()or pr.id=auth.uid())),'[]'::jsonb));end$$;

create or replace function public.registrar_ocorrencia_frequencia(p_paciente_id uuid,p_profissional_id uuid,p_data date,p_tipo text,p_motivo text,p_observacao text,p_agendamento_id uuid default null)
returns uuid language plpgsql security definer set search_path='' set row_security=off as $$declare v_id uuid;a public.agendamentos%rowtype;begin
 if not public.usuario_ativo()or not(public.usuario_coordenacao()or(p_profissional_id=auth.uid()and public.usuario_vinculado(p_paciente_id)))then raise exception'unauthorized'using errcode='42501';end if;
 if p_data is null or p_data>current_date or p_tipo not in('falta_justificada','falta_nao_justificada','cancelamento_clinica','cancelamento_profissional')or(p_tipo='falta_justificada'and length(trim(coalesce(p_motivo,'')))<3)or not exists(select 1 from public.pacientes where id=p_paciente_id and status='ativo')or not public.perfil_pode_atender(p_profissional_id)then raise exception'invalid_occurrence'using errcode='22023';end if;
 if p_agendamento_id is not null then select*into a from public.agendamentos where id=p_agendamento_id for update;if a.id is null or a.paciente_id<>p_paciente_id or a.profissional_id<>p_profissional_id or(a.inicio at time zone'America/Sao_Paulo')::date<>p_data or a.status not in('agendado','confirmado')then raise exception'invalid_schedule_link'using errcode='22023';end if;end if;
 insert into public.ocorrencias_frequencia(paciente_id,profissional_id,agendamento_id,agendamento_status_anterior,data_ocorrencia,tipo,motivo,observacao_administrativa,criado_por)values(p_paciente_id,p_profissional_id,p_agendamento_id,case when p_agendamento_id is not null then a.status end,p_data,p_tipo,nullif(trim(p_motivo),''),nullif(trim(p_observacao),''),auth.uid())returning id into v_id;
 if p_agendamento_id is not null and p_tipo in('falta_justificada','falta_nao_justificada')then update public.agendamentos set status='falta',updated_at=now()where id=p_agendamento_id;end if;
 insert into public.audit_logs(user_id,action,entity_type,entity_id,metadata)values(auth.uid(),'OCORRENCIA_FREQUENCIA_CRIADA','ocorrencias_frequencia',v_id,jsonb_build_object('tipo',p_tipo,'agendamento_vinculado',p_agendamento_id is not null));return v_id;
exception when unique_violation then raise exception'duplicate_schedule_occurrence'using errcode='23505';end$$;

revoke all on function public.listar_opcoes_agendamento()from public;grant execute on function public.listar_opcoes_agendamento()to authenticated;
revoke all on function public.criar_agendamento(uuid,uuid,timestamptz,timestamptz,text,text,text,text)from public;grant execute on function public.criar_agendamento(uuid,uuid,timestamptz,timestamptz,text,text,text,text)to authenticated;
revoke all on function public.editar_agendamento(uuid,uuid,text,text,text,text,text,timestamptz)from public;grant execute on function public.editar_agendamento(uuid,uuid,text,text,text,text,text,timestamptz)to authenticated;
revoke all on function public.salvar_disponibilidade(uuid,jsonb)from public;grant execute on function public.salvar_disponibilidade(uuid,jsonb)to authenticated;
revoke all on function public.opcoes_frequencia()from public;grant execute on function public.opcoes_frequencia()to authenticated;
revoke all on function public.registrar_ocorrencia_frequencia(uuid,uuid,date,text,text,text,uuid)from public;grant execute on function public.registrar_ocorrencia_frequencia(uuid,uuid,date,text,text,text,uuid)to authenticated;
notify pgrst,'reload schema';
