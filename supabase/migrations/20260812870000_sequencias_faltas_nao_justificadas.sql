-- Confirmação rastreável de faltas consecutivas sem exigir uso da agenda.
alter table public.ocorrencias_frequencia
 add column if not exists continuidade_falta text,
 add column if not exists ocorrencia_anterior_id uuid references public.ocorrencias_frequencia(id) on delete restrict,
 add column if not exists sequencia_quantidade integer;

-- Registros anteriores não provam continuidade, mas podem ser o ponto inicial
-- confirmado pelo profissional no próximo lançamento.
update public.ocorrencias_frequencia
set continuidade_falta='inicio_sequencia',sequencia_quantidade=1
where tipo='falta_nao_justificada'and continuidade_falta is null;

alter table public.ocorrencias_frequencia drop constraint if exists ocorrencias_frequencia_continuidade_check;
alter table public.ocorrencias_frequencia add constraint ocorrencias_frequencia_continuidade_check check(
 (tipo='falta_nao_justificada' and continuidade_falta in('inicio_sequencia','consecutiva_confirmada','sequencia_interrompida','nao_confirmada'))
 or (tipo<>'falta_nao_justificada' and continuidade_falta is null and ocorrencia_anterior_id is null and sequencia_quantidade is null)
);
alter table public.ocorrencias_frequencia drop constraint if exists ocorrencias_frequencia_sequencia_check;
alter table public.ocorrencias_frequencia add constraint ocorrencias_frequencia_sequencia_check check(
 (continuidade_falta='nao_confirmada' and sequencia_quantidade is null)
 or (continuidade_falta in('inicio_sequencia','sequencia_interrompida') and ocorrencia_anterior_id is null and sequencia_quantidade=1)
 or (continuidade_falta='consecutiva_confirmada' and ocorrencia_anterior_id is not null and sequencia_quantidade>=2)
 or continuidade_falta is null
);
create index if not exists ocorrencias_frequencia_sequencia_idx on public.ocorrencias_frequencia(paciente_id,profissional_id,data_ocorrencia desc,created_at desc) where cancelado_em is null and tipo='falta_nao_justificada';

create or replace function public.contexto_falta_anterior(p_paciente_id uuid,p_profissional_id uuid,p_data date)
returns jsonb language plpgsql stable security definer set search_path='' set row_security=off as $$declare o public.ocorrencias_frequencia%rowtype;begin
 if p_data is null or not(public.usuario_tem_permissao('frequencia.gerenciar')or(p_profissional_id=auth.uid()and public.usuario_tem_permissao('frequencia.registrar_propria')and public.usuario_vinculado(p_paciente_id)))then raise exception'unauthorized'using errcode='42501';end if;
 select*into o from public.ocorrencias_frequencia where paciente_id=p_paciente_id and profissional_id=p_profissional_id and tipo='falta_nao_justificada' and cancelado_em is null and data_ocorrencia<p_data order by data_ocorrencia desc,created_at desc limit 1;
 if o.id is null then return null;end if;
 return jsonb_build_object('id',o.id,'data_ocorrencia',o.data_ocorrencia,'sequencia_quantidade',o.sequencia_quantidade);
end$$;

drop function if exists public.registrar_ocorrencia_frequencia(uuid,uuid,date,text,text,text,uuid);
create or replace function public.registrar_ocorrencia_frequencia(p_paciente_id uuid,p_profissional_id uuid,p_data date,p_tipo text,p_motivo text,p_observacao text,p_agendamento_id uuid default null,p_continuidade_falta text default null,p_ocorrencia_anterior_id uuid default null)
returns uuid language plpgsql security definer set search_path='' set row_security=off as $$declare v_id uuid;a public.agendamentos%rowtype;anterior public.ocorrencias_frequencia%rowtype;v_ultima_id uuid;v_quantidade integer;begin
 if not public.usuario_ativo()or not(public.usuario_tem_permissao('frequencia.gerenciar')or(p_profissional_id=auth.uid()and public.usuario_tem_permissao('frequencia.registrar_propria')and public.usuario_vinculado(p_paciente_id)))then raise exception'unauthorized'using errcode='42501';end if;
 if p_data is null or p_data>current_date or p_tipo not in('falta_justificada','falta_nao_justificada','cancelamento_clinica','cancelamento_profissional')or(p_tipo='falta_justificada'and length(trim(coalesce(p_motivo,'')))<3)or not exists(select 1 from public.pacientes where id=p_paciente_id and status='ativo')or not exists(select 1 from public.profiles where id=p_profissional_id and papel='profissional'and status='ativo')then raise exception'invalid_occurrence'using errcode='22023';end if;
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

create or replace function public.cancelar_ocorrencia_frequencia(p_id uuid,p_motivo text)
returns void language plpgsql security definer set search_path='' set row_security=off as $$declare o public.ocorrencias_frequencia%rowtype;v_linhas integer:=0;begin
 if length(trim(coalesce(p_motivo,'')))<5 then raise exception'invalid_reason'using errcode='22023';end if;
 select*into o from public.ocorrencias_frequencia where id=p_id for update;if o.id is null then raise exception'occurrence_not_found'using errcode='P0002';end if;if o.cancelado_em is not null then raise exception'occurrence_already_cancelled'using errcode='55000';end if;
 if not(public.usuario_tem_permissao('frequencia.gerenciar')or(o.criado_por=auth.uid()and o.profissional_id=auth.uid()and public.usuario_tem_permissao('frequencia.registrar_propria')))then raise exception'unauthorized'using errcode='42501';end if;
 update public.ocorrencias_frequencia set cancelado_em=now(),cancelado_por=auth.uid(),motivo_cancelamento=trim(p_motivo),updated_at=now()where id=o.id;
 update public.ocorrencias_frequencia set continuidade_falta='nao_confirmada',sequencia_quantidade=null,updated_at=now()where ocorrencia_anterior_id=o.id and cancelado_em is null;
 if o.agendamento_id is not null and o.tipo in('falta_justificada','falta_nao_justificada')then update public.agendamentos set status=coalesce(o.agendamento_status_anterior,'agendado'),updated_at=now()where id=o.agendamento_id and status='falta'and not exists(select 1 from public.ocorrencias_frequencia outra where outra.agendamento_id=o.agendamento_id and outra.id<>o.id and outra.cancelado_em is null and outra.tipo in('falta_justificada','falta_nao_justificada'));get diagnostics v_linhas=row_count;end if;
 insert into public.audit_logs(user_id,action,entity_type,entity_id,metadata)values(auth.uid(),'OCORRENCIA_FREQUENCIA_CANCELADA','ocorrencias_frequencia',o.id,jsonb_build_object('motivo_informado',true,'agendamento_id',o.agendamento_id,'status_restaurado',v_linhas>0,'sequencia_dependente_invalidada',true));end$$;

create or replace function public.relatorio_frequencia_paginado(p_inicio date,p_fim date,p_profissional_id uuid default null,p_paciente_id uuid default null,p_limite integer default 20,p_offset integer default 0)
returns jsonb language plpgsql stable security definer set search_path='' set row_security=off as $$declare v_registros jsonb;v_profissionais jsonb;v_pacientes jsonb;v_resumo jsonb;v_total bigint;begin
 if not public.usuario_ativo()or p_inicio is null or p_fim is null or p_fim<p_inicio or p_fim-p_inicio>370 then raise exception'invalid_report'using errcode='22023';end if;if not public.usuario_tem_permissao('frequencia.visualizar_equipe')then p_profissional_id:=auth.uid();end if;
 select count(*),jsonb_build_object('ocorrencias',count(*),'faltas',count(*)filter(where o.tipo like'falta_%'),'justificadas',count(*)filter(where o.tipo='falta_justificada'),'nao_justificadas',count(*)filter(where o.tipo='falta_nao_justificada'),'cancelamentos',count(*)filter(where o.tipo like'cancelamento_%'),'sequencias_em_alerta',count(*)filter(where o.tipo='falta_nao_justificada'and o.sequencia_quantidade>=3),'sequencias_em_atencao',count(*)filter(where o.tipo='falta_nao_justificada'and o.sequencia_quantidade=2))into v_total,v_resumo from public.ocorrencias_frequencia o where o.cancelado_em is null and o.data_ocorrencia between p_inicio and p_fim and(p_profissional_id is null or o.profissional_id=p_profissional_id)and(p_paciente_id is null or o.paciente_id=p_paciente_id);
 select coalesce(jsonb_agg(x order by(x->>'data_ocorrencia')desc,(x->>'created_at')desc),'[]'::jsonb)into v_registros from(select jsonb_build_object('id',o.id,'paciente_id',o.paciente_id,'paciente_nome',p.nome_completo,'profissional_id',o.profissional_id,'profissional_nome',pr.nome,'agendamento_id',o.agendamento_id,'agendamento_inicio',a.inicio,'agendamento_fim',a.fim,'data_ocorrencia',o.data_ocorrencia,'tipo',o.tipo,'motivo',o.motivo,'observacao_administrativa',o.observacao_administrativa,'continuidade_falta',o.continuidade_falta,'ocorrencia_anterior_id',o.ocorrencia_anterior_id,'sequencia_quantidade',o.sequencia_quantidade,'criado_por',o.criado_por,'created_at',o.created_at)x from public.ocorrencias_frequencia o join public.pacientes p on p.id=o.paciente_id join public.profiles pr on pr.id=o.profissional_id left join public.agendamentos a on a.id=o.agendamento_id where o.cancelado_em is null and o.data_ocorrencia between p_inicio and p_fim and(p_profissional_id is null or o.profissional_id=p_profissional_id)and(p_paciente_id is null or o.paciente_id=p_paciente_id)order by o.data_ocorrencia desc,o.created_at desc limit least(greatest(p_limite,1),50)offset greatest(p_offset,0))s;
 select coalesce(jsonb_agg(x order by(x->>'total')::integer desc),'[]'::jsonb)into v_profissionais from(select jsonb_build_object('id',pr.id,'nome',pr.nome,'total',count(*),'justificadas',count(*)filter(where o.tipo='falta_justificada'),'nao_justificadas',count(*)filter(where o.tipo='falta_nao_justificada'),'cancelamentos',count(*)filter(where o.tipo like'cancelamento_%'))x from public.ocorrencias_frequencia o join public.profiles pr on pr.id=o.profissional_id where o.cancelado_em is null and o.data_ocorrencia between p_inicio and p_fim and(p_profissional_id is null or o.profissional_id=p_profissional_id)and(p_paciente_id is null or o.paciente_id=p_paciente_id)group by pr.id,pr.nome)s;
 select coalesce(jsonb_agg(x order by(x->>'total_faltas')::integer desc),'[]'::jsonb)into v_pacientes from(select jsonb_build_object('id',p.id,'nome',p.nome_completo,'total_faltas',count(*)filter(where o.tipo like'falta_%'),'justificadas',count(*)filter(where o.tipo='falta_justificada'),'nao_justificadas',count(*)filter(where o.tipo='falta_nao_justificada'))x from public.ocorrencias_frequencia o join public.pacientes p on p.id=o.paciente_id where o.cancelado_em is null and o.data_ocorrencia between p_inicio and p_fim and(p_profissional_id is null or o.profissional_id=p_profissional_id)and(p_paciente_id is null or o.paciente_id=p_paciente_id)group by p.id,p.nome_completo)s;
 return jsonb_build_object('registros',v_registros,'profissionais',v_profissionais,'pacientes',v_pacientes,'resumo',v_resumo,'total_registros',v_total);end$$;

revoke all on function public.contexto_falta_anterior(uuid,uuid,date)from public;grant execute on function public.contexto_falta_anterior(uuid,uuid,date)to authenticated;
revoke all on function public.registrar_ocorrencia_frequencia(uuid,uuid,date,text,text,text,uuid,text,uuid)from public;grant execute on function public.registrar_ocorrencia_frequencia(uuid,uuid,date,text,text,text,uuid,text,uuid)to authenticated;
notify pgrst,'reload schema';
