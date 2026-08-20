-- Controle administrativo de faltas e cancelamentos, independente do prontuário.
create table if not exists public.ocorrencias_frequencia(
 id uuid primary key default gen_random_uuid(),
 paciente_id uuid not null references public.pacientes(id)on delete restrict,
 profissional_id uuid not null references public.profiles(id)on delete restrict,
 agendamento_id uuid references public.agendamentos(id)on delete restrict,
 agendamento_status_anterior text,
 data_ocorrencia date not null,
 tipo text not null check(tipo in('falta_justificada','falta_nao_justificada','cancelamento_clinica','cancelamento_profissional')),
 motivo text,
 observacao_administrativa text,
 criado_por uuid not null references public.profiles(id)on delete restrict,
 cancelado_em timestamptz,
 cancelado_por uuid references public.profiles(id)on delete restrict,
 motivo_cancelamento text,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 constraint ocorrencias_frequencia_motivo_check check(tipo<>'falta_justificada'or length(trim(coalesce(motivo,'')))>=3)
);
create index if not exists ocorrencias_frequencia_data_idx on public.ocorrencias_frequencia(data_ocorrencia desc);
create index if not exists ocorrencias_frequencia_profissional_data_idx on public.ocorrencias_frequencia(profissional_id,data_ocorrencia desc);
create index if not exists ocorrencias_frequencia_paciente_data_idx on public.ocorrencias_frequencia(paciente_id,data_ocorrencia desc);
create unique index if not exists ocorrencias_frequencia_agendamento_uidx on public.ocorrencias_frequencia(agendamento_id)where agendamento_id is not null and cancelado_em is null;
alter table public.ocorrencias_frequencia enable row level security;
alter table public.ocorrencias_frequencia force row level security;
drop policy if exists ocorrencias_frequencia_select on public.ocorrencias_frequencia;
create policy ocorrencias_frequencia_select on public.ocorrencias_frequencia for select to authenticated using(public.usuario_coordenacao()or(profissional_id=auth.uid()and public.usuario_ativo()));
-- Não há políticas de insert/update/delete: toda escrita passa pelas RPCs auditadas.

create or replace function public.opcoes_frequencia()
returns jsonb language plpgsql stable security definer set search_path='' set row_security=off as $$begin
 if not public.usuario_ativo()then raise exception'unauthorized'using errcode='42501';end if;
 return jsonb_build_object(
  'pacientes',coalesce((select jsonb_agg(jsonb_build_object('id',p.id,'nome',p.nome_completo)order by p.nome_completo)from public.pacientes p where p.status='ativo'and(public.usuario_coordenacao()or exists(select 1 from public.paciente_psicologos pp where pp.paciente_id=p.id and pp.psicologo_id=auth.uid()))),'[]'::jsonb),
  'profissionais',coalesce((select jsonb_agg(jsonb_build_object('id',pr.id,'nome',pr.nome,'profissao',pr.profissao)order by pr.nome)from public.profiles pr where pr.status='ativo'and pr.papel='profissional'and(public.usuario_coordenacao()or pr.id=auth.uid())),'[]'::jsonb));end$$;

create or replace function public.sugerir_agendamentos_frequencia(p_paciente_id uuid,p_profissional_id uuid,p_data date)
returns table(id uuid,inicio timestamptz,fim timestamptz,status text,finalidade text)
language plpgsql stable security definer set search_path='' set row_security=off as $$begin
 if not(public.usuario_coordenacao()or(p_profissional_id=auth.uid()and public.usuario_ativo()and public.usuario_vinculado(p_paciente_id)))then raise exception'unauthorized'using errcode='42501';end if;
 return query select a.id,a.inicio,a.fim,a.status,a.finalidade from public.agendamentos a where a.paciente_id=p_paciente_id and a.profissional_id=p_profissional_id and(a.inicio at time zone'America/Sao_Paulo')::date=p_data and a.status in('agendado','confirmado')and not exists(select 1 from public.ocorrencias_frequencia o where o.agendamento_id=a.id and o.cancelado_em is null)order by a.inicio;end$$;

create or replace function public.registrar_ocorrencia_frequencia(p_paciente_id uuid,p_profissional_id uuid,p_data date,p_tipo text,p_motivo text,p_observacao text,p_agendamento_id uuid default null)
returns uuid language plpgsql security definer set search_path='' set row_security=off as $$declare v_id uuid;a public.agendamentos%rowtype;begin
 if not public.usuario_ativo()or not(public.usuario_coordenacao()or(p_profissional_id=auth.uid()and public.usuario_vinculado(p_paciente_id)))then raise exception'unauthorized'using errcode='42501';end if;
 if p_data is null or p_data>current_date or p_tipo not in('falta_justificada','falta_nao_justificada','cancelamento_clinica','cancelamento_profissional')or(p_tipo='falta_justificada'and length(trim(coalesce(p_motivo,'')))<3)or not exists(select 1 from public.pacientes where id=p_paciente_id and status='ativo')or not exists(select 1 from public.profiles where id=p_profissional_id and papel='profissional'and status='ativo')then raise exception'invalid_occurrence'using errcode='22023';end if;
 if p_agendamento_id is not null then select*into a from public.agendamentos where id=p_agendamento_id for update;if a.id is null or a.paciente_id<>p_paciente_id or a.profissional_id<>p_profissional_id or(a.inicio at time zone'America/Sao_Paulo')::date<>p_data or a.status not in('agendado','confirmado')then raise exception'invalid_schedule_link'using errcode='22023';end if;end if;
 insert into public.ocorrencias_frequencia(paciente_id,profissional_id,agendamento_id,agendamento_status_anterior,data_ocorrencia,tipo,motivo,observacao_administrativa,criado_por)values(p_paciente_id,p_profissional_id,p_agendamento_id,case when p_agendamento_id is not null then a.status end,p_data,p_tipo,nullif(trim(p_motivo),''),nullif(trim(p_observacao),''),auth.uid())returning id into v_id;
 if p_agendamento_id is not null and p_tipo in('falta_justificada','falta_nao_justificada')then update public.agendamentos set status='falta',updated_at=now()where id=p_agendamento_id;end if;
 insert into public.audit_logs(user_id,action,entity_type,entity_id,metadata)values(auth.uid(),'OCORRENCIA_FREQUENCIA_CRIADA','ocorrencias_frequencia',v_id,jsonb_build_object('tipo',p_tipo,'agendamento_vinculado',p_agendamento_id is not null));return v_id;
exception when unique_violation then raise exception'duplicate_schedule_occurrence'using errcode='23505';end$$;

create or replace function public.cancelar_ocorrencia_frequencia(p_id uuid,p_motivo text)
returns void language plpgsql security definer set search_path='' set row_security=off as $$declare o public.ocorrencias_frequencia%rowtype;begin
 select*into o from public.ocorrencias_frequencia where id=p_id for update;
 if o.id is null or o.cancelado_em is not null or length(trim(coalesce(p_motivo,'')))<5 or not(public.usuario_coordenacao()or(o.criado_por=auth.uid()and o.profissional_id=auth.uid()and public.usuario_ativo()))then raise exception'unauthorized_or_invalid'using errcode='42501';end if;
 update public.ocorrencias_frequencia set cancelado_em=now(),cancelado_por=auth.uid(),motivo_cancelamento=trim(p_motivo),updated_at=now()where id=o.id;
 if o.agendamento_id is not null and o.tipo in('falta_justificada','falta_nao_justificada')then update public.agendamentos set status=coalesce(o.agendamento_status_anterior,'agendado'),updated_at=now()where id=o.agendamento_id and status='falta';end if;
 insert into public.audit_logs(user_id,action,entity_type,entity_id,metadata)values(auth.uid(),'OCORRENCIA_FREQUENCIA_CANCELADA','ocorrencias_frequencia',o.id,jsonb_build_object('motivo_informado',true));end$$;

create or replace function public.relatorio_frequencia(p_inicio date,p_fim date,p_profissional_id uuid default null,p_paciente_id uuid default null)
returns jsonb language plpgsql stable security definer set search_path='' set row_security=off as $$declare v_registros jsonb;v_profissionais jsonb;v_pacientes jsonb;begin
 if not public.usuario_ativo()or p_inicio is null or p_fim is null or p_fim<p_inicio or p_fim-p_inicio>370 then raise exception'invalid_report'using errcode='22023';end if;
 if not public.usuario_coordenacao()then p_profissional_id:=auth.uid();end if;
 select coalesce(jsonb_agg(jsonb_build_object('id',o.id,'paciente_id',o.paciente_id,'paciente_nome',p.nome_completo,'profissional_id',o.profissional_id,'profissional_nome',pr.nome,'agendamento_id',o.agendamento_id,'data_ocorrencia',o.data_ocorrencia,'tipo',o.tipo,'motivo',o.motivo,'observacao_administrativa',o.observacao_administrativa,'criado_por',o.criado_por,'created_at',o.created_at)order by o.data_ocorrencia desc,o.created_at desc),'[]'::jsonb)into v_registros from public.ocorrencias_frequencia o join public.pacientes p on p.id=o.paciente_id join public.profiles pr on pr.id=o.profissional_id where o.cancelado_em is null and o.data_ocorrencia between p_inicio and p_fim and(p_profissional_id is null or o.profissional_id=p_profissional_id)and(p_paciente_id is null or o.paciente_id=p_paciente_id);
 select coalesce(jsonb_agg(x order by(x->>'total')::integer desc),'[]'::jsonb)into v_profissionais from(select jsonb_build_object('id',pr.id,'nome',pr.nome,'total',count(*),'justificadas',count(*)filter(where o.tipo='falta_justificada'),'nao_justificadas',count(*)filter(where o.tipo='falta_nao_justificada'),'cancelamentos',count(*)filter(where o.tipo like'cancelamento_%'))x from public.ocorrencias_frequencia o join public.profiles pr on pr.id=o.profissional_id where o.cancelado_em is null and o.data_ocorrencia between p_inicio and p_fim and(p_profissional_id is null or o.profissional_id=p_profissional_id)and(p_paciente_id is null or o.paciente_id=p_paciente_id)group by pr.id,pr.nome)s;
 select coalesce(jsonb_agg(x order by(x->>'total_faltas')::integer desc),'[]'::jsonb)into v_pacientes from(select jsonb_build_object('id',p.id,'nome',p.nome_completo,'total_faltas',count(*)filter(where o.tipo like'falta_%'),'justificadas',count(*)filter(where o.tipo='falta_justificada'),'nao_justificadas',count(*)filter(where o.tipo='falta_nao_justificada'))x from public.ocorrencias_frequencia o join public.pacientes p on p.id=o.paciente_id where o.cancelado_em is null and o.data_ocorrencia between p_inicio and p_fim and(p_profissional_id is null or o.profissional_id=p_profissional_id)and(p_paciente_id is null or o.paciente_id=p_paciente_id)group by p.id,p.nome_completo)s;
 return jsonb_build_object('registros',v_registros,'profissionais',v_profissionais,'pacientes',v_pacientes);end$$;

revoke all on table public.ocorrencias_frequencia from anon,authenticated;
grant select on table public.ocorrencias_frequencia to authenticated;
revoke all on function public.opcoes_frequencia()from public;grant execute on function public.opcoes_frequencia()to authenticated;
revoke all on function public.sugerir_agendamentos_frequencia(uuid,uuid,date)from public;grant execute on function public.sugerir_agendamentos_frequencia(uuid,uuid,date)to authenticated;
revoke all on function public.registrar_ocorrencia_frequencia(uuid,uuid,date,text,text,text,uuid)from public;grant execute on function public.registrar_ocorrencia_frequencia(uuid,uuid,date,text,text,text,uuid)to authenticated;
revoke all on function public.cancelar_ocorrencia_frequencia(uuid,text)from public;grant execute on function public.cancelar_ocorrencia_frequencia(uuid,text)to authenticated;
revoke all on function public.relatorio_frequencia(date,date,uuid,uuid)from public;grant execute on function public.relatorio_frequencia(date,date,uuid,uuid)to authenticated;
notify pgrst,'reload schema';
