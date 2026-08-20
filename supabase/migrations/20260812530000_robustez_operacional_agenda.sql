-- Etapa 6/7: transições estritas, edição concorrente e cancelamento justificado.
alter table public.agendamentos add column if not exists cancelamento_motivo text;
alter table public.agendamentos add column if not exists cancelado_por uuid references public.profiles(id);
create unique index if not exists agendamentos_sessao_unica_uidx on public.agendamentos(sessao_id)where sessao_id is not null;

create or replace function public.atualizar_status_agendamento(p_id uuid,p_status text)
returns void language plpgsql security definer set search_path='' set row_security=off as $$declare a public.agendamentos%rowtype;begin
 select*into a from public.agendamentos where id=p_id for update;if a.id is null then raise exception'not_found'using errcode='P0002';end if;
 if a.profissional_id<>auth.uid()or not public.usuario_ativo()then raise exception'unauthorized'using errcode='42501';end if;
 if not((a.status='agendado'and p_status in('confirmado','falta'))or(a.status='confirmado'and p_status='falta'))then raise exception'invalid_transition'using errcode='22023';end if;
 update public.agendamentos set status=p_status,updated_at=now()where id=a.id;
 insert into public.audit_logs(user_id,action,entity_type,entity_id,metadata)values(auth.uid(),'AGENDAMENTO_STATUS_ALTERADO','agendamentos',a.id,jsonb_build_object('anterior',a.status,'novo',p_status));end$$;

create or replace function public.cancelar_agendamento(p_id uuid,p_motivo text,p_updated_at timestamptz)
returns void language plpgsql security definer set search_path='' set row_security=off as $$declare a public.agendamentos%rowtype;begin
 if not public.usuario_coordenacao()then raise exception'unauthorized'using errcode='42501';end if;select*into a from public.agendamentos where id=p_id for update;
 if a.id is null or a.status not in('agendado','confirmado')or length(trim(coalesce(p_motivo,'')))<5 then raise exception'invalid_cancel'using errcode='22023';end if;
 if a.updated_at is distinct from p_updated_at then raise exception'stale_schedule'using errcode='40001';end if;
 update public.agendamentos set status='cancelado',cancelado_em=now(),cancelado_por=auth.uid(),cancelamento_motivo=trim(p_motivo),updated_at=now()where id=a.id;
 insert into public.audit_logs(user_id,action,entity_type,entity_id,metadata)values(auth.uid(),'AGENDAMENTO_CANCELADO','agendamentos',a.id,jsonb_build_object('motivo_informado',true));end$$;

create or replace function public.editar_agendamento(p_id uuid,p_profissional_id uuid,p_finalidade text,p_modalidade text,p_local text,p_observacao text,p_motivo text,p_updated_at timestamptz)
returns void language plpgsql security definer set search_path='' set row_security=off as $$declare a public.agendamentos%rowtype;begin
 if not public.usuario_coordenacao()then raise exception'unauthorized'using errcode='42501';end if;select*into a from public.agendamentos where id=p_id for update;
 if a.id is null or a.status not in('agendado','confirmado')or length(trim(coalesce(p_motivo,'')))<5 or p_modalidade not in('presencial','domiciliar','escola','teleatendimento','outro')or not exists(select 1 from public.profiles where id=p_profissional_id and papel='profissional'and status='ativo')then raise exception'invalid_edit'using errcode='22023';end if;
 if a.updated_at is distinct from p_updated_at then raise exception'stale_schedule'using errcode='40001';end if;
 if p_profissional_id<>a.profissional_id and not public.horario_disponivel(p_profissional_id,a.inicio,a.fim,a.id)then raise exception'professional_conflict_or_unavailable'using errcode='23P01';end if;
 insert into public.agendamentos_historico(agendamento_id,alterado_por,tipo,inicio_anterior,fim_anterior,inicio_novo,fim_novo,motivo)values(a.id,auth.uid(),'edicao',a.inicio,a.fim,a.inicio,a.fim,trim(p_motivo));
 update public.agendamentos set profissional_id=p_profissional_id,finalidade=trim(p_finalidade),modalidade=p_modalidade,local=nullif(trim(p_local),''),observacao_administrativa=nullif(trim(p_observacao),''),status=case when p_profissional_id<>a.profissional_id then'agendado'else status end,updated_at=now()where id=a.id;
 insert into public.audit_logs(user_id,action,entity_type,entity_id,metadata)values(auth.uid(),'AGENDAMENTO_EDITADO','agendamentos',a.id,jsonb_build_object('profissional_alterado',p_profissional_id<>a.profissional_id));end$$;

create or replace function public.vincular_sessao_agendamento(p_agendamento_id uuid,p_sessao_id uuid)
returns void language plpgsql security definer set search_path='' set row_security=off as $$declare a public.agendamentos%rowtype;s public.sessoes_clinicas%rowtype;begin
 select*into a from public.agendamentos where id=p_agendamento_id for update;select*into s from public.sessoes_clinicas where id=p_sessao_id for update;
 if a.id is null or s.id is null or a.sessao_id is not null or exists(select 1 from public.agendamentos where sessao_id=s.id)or a.profissional_id<>auth.uid()or s.profissional_id<>auth.uid()or a.paciente_id<>s.paciente_id or a.status not in('agendado','confirmado')then raise exception'unauthorized_or_duplicate_session'using errcode='42501';end if;
 update public.agendamentos set sessao_id=s.id,status='realizado',updated_at=now()where id=a.id;
 insert into public.audit_logs(user_id,action,entity_type,entity_id,metadata)values(auth.uid(),'AGENDAMENTO_REALIZADO','agendamentos',a.id,jsonb_build_object('sessao_id',s.id));end$$;

-- Cria a sessão e conclui o compromisso na mesma transação. Assim, um compromisso
-- já utilizado nunca deixa para trás uma segunda sessão clínica sem vínculo.
create or replace function public.registrar_sessao_clinica_v7(p_paciente_id uuid,p_data date,p_contexto text,p_observacoes_privadas text,p_registros jsonb,p_ambiente_tipo text,p_aplicador_tipo text,p_integridade jsonb,p_observacoes_abc jsonb,p_finalidade text,p_tentativas jsonb default'[]',p_agendamento_id uuid default null)
returns uuid language plpgsql security definer set search_path='pg_catalog','public' set row_security=off as $$declare a public.agendamentos%rowtype;v_sessao uuid;begin
 if p_agendamento_id is not null then
  select*into a from public.agendamentos where id=p_agendamento_id for update;
  if a.id is null or a.sessao_id is not null or a.profissional_id<>auth.uid()or a.paciente_id<>p_paciente_id or a.status not in('agendado','confirmado')or not public.usuario_vinculado(p_paciente_id)then raise exception'unauthorized_or_duplicate_session'using errcode='42501';end if;
 end if;
 v_sessao:=public.registrar_sessao_clinica_v6(p_paciente_id,p_data,p_contexto,p_observacoes_privadas,p_registros,p_ambiente_tipo,p_aplicador_tipo,p_integridade,p_observacoes_abc,p_finalidade,p_tentativas);
 if p_agendamento_id is not null then
  update public.agendamentos set sessao_id=v_sessao,status='realizado',updated_at=now()where id=a.id;
  insert into public.audit_logs(user_id,action,entity_type,entity_id,metadata)values(auth.uid(),'AGENDAMENTO_REALIZADO','agendamentos',a.id,jsonb_build_object('sessao_id',v_sessao));
 end if;return v_sessao;end$$;

create or replace function public.listar_opcoes_agendamento()
returns jsonb language plpgsql stable security definer set search_path='' set row_security=off as $$begin
 if not public.usuario_coordenacao()then raise exception'unauthorized'using errcode='42501';end if;
 return jsonb_build_object(
  'pacientes',coalesce((select jsonb_agg(jsonb_build_object('id',p.id,'nome',p.nome_completo,'status',p.status,'profissionais_vinculados',(select count(*)from public.paciente_psicologos pp where pp.paciente_id=p.id))order by p.nome_completo)from public.pacientes p where p.status='ativo'),'[]'::jsonb),
  'profissionais',coalesce((select jsonb_agg(jsonb_build_object('id',p.id,'nome',p.nome,'profissao',p.profissao)order by p.nome)from public.profiles p where p.status='ativo'and p.papel='profissional'),'[]'::jsonb));end$$;

drop function if exists public.listar_agendamentos(timestamptz,timestamptz);
create function public.listar_agendamentos(p_inicio timestamptz,p_fim timestamptz)
returns table(id uuid,paciente_id uuid,profissional_id uuid,inicio timestamptz,fim timestamptz,finalidade text,modalidade text,local text,status text,observacao_administrativa text,sessao_id uuid,paciente_nome text,profissional_nome text,pode_iniciar boolean,historico jsonb,updated_at timestamptz,cancelamento_motivo text)
language sql stable security definer set search_path='' set row_security=off as $$select a.id,a.paciente_id,a.profissional_id,a.inicio,a.fim,a.finalidade,a.modalidade,a.local,a.status,a.observacao_administrativa,a.sessao_id,p.nome_completo,pr.nome,exists(select 1 from public.paciente_psicologos pp where pp.paciente_id=a.paciente_id and pp.psicologo_id=a.profissional_id),coalesce((select jsonb_agg(jsonb_build_object('tipo',h.tipo,'inicio_anterior',h.inicio_anterior,'fim_anterior',h.fim_anterior,'inicio_novo',h.inicio_novo,'fim_novo',h.fim_novo,'motivo',h.motivo,'created_at',h.created_at)order by h.created_at desc)from public.agendamentos_historico h where h.agendamento_id=a.id),'[]'::jsonb),a.updated_at,a.cancelamento_motivo from public.agendamentos a join public.pacientes p on p.id=a.paciente_id join public.profiles pr on pr.id=a.profissional_id where a.inicio>=p_inicio and a.inicio<p_fim and(public.usuario_coordenacao()or a.profissional_id=auth.uid())order by a.inicio$$;

revoke all on function public.cancelar_agendamento(uuid,text,timestamptz)from public;grant execute on function public.cancelar_agendamento(uuid,text,timestamptz)to authenticated;
revoke all on function public.editar_agendamento(uuid,uuid,text,text,text,text,text,timestamptz)from public;grant execute on function public.editar_agendamento(uuid,uuid,text,text,text,text,text,timestamptz)to authenticated;
revoke all on function public.registrar_sessao_clinica_v7(uuid,date,text,text,jsonb,text,text,jsonb,jsonb,text,jsonb,uuid)from public;grant execute on function public.registrar_sessao_clinica_v7(uuid,date,text,text,jsonb,text,text,jsonb,jsonb,text,jsonb,uuid)to authenticated;
revoke execute on function public.vincular_sessao_agendamento(uuid,uuid)from authenticated;
revoke all on function public.listar_opcoes_agendamento()from public;grant execute on function public.listar_opcoes_agendamento()to authenticated;
revoke all on function public.listar_agendamentos(timestamptz,timestamptz)from public;grant execute on function public.listar_agendamentos(timestamptz,timestamptz)to authenticated;
notify pgrst,'reload schema';
