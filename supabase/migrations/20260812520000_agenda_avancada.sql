-- Etapa 5/7: disponibilidade, reagendamento, histórico e conflitos completos.
create table if not exists public.disponibilidades_profissional(
 id uuid primary key default gen_random_uuid(),profissional_id uuid not null references public.profiles(id)on delete cascade,
 dia_semana smallint not null check(dia_semana between 0 and 6),hora_inicio time not null,hora_fim time not null,ativo boolean not null default true,
 created_at timestamptz not null default now(),updated_at timestamptz not null default now(),
 constraint disponibilidade_periodo_check check(hora_fim>hora_inicio),unique(profissional_id,dia_semana,hora_inicio,hora_fim)
);
create table if not exists public.agendamentos_historico(
 id uuid primary key default gen_random_uuid(),agendamento_id uuid not null references public.agendamentos(id)on delete cascade,
 alterado_por uuid not null references public.profiles(id),tipo text not null check(tipo in('reagendamento','edicao')),
 inicio_anterior timestamptz,fim_anterior timestamptz,inicio_novo timestamptz,fim_novo timestamptz,motivo text,created_at timestamptz not null default now()
);
alter table public.disponibilidades_profissional enable row level security;alter table public.agendamentos_historico enable row level security;
drop policy if exists disponibilidades_select on public.disponibilidades_profissional;create policy disponibilidades_select on public.disponibilidades_profissional for select to authenticated using(public.usuario_coordenacao()or profissional_id=auth.uid());
drop policy if exists agendamentos_historico_select on public.agendamentos_historico;create policy agendamentos_historico_select on public.agendamentos_historico for select to authenticated using(public.usuario_coordenacao()or exists(select 1 from public.agendamentos a where a.id=agendamento_id and a.profissional_id=auth.uid()));

create or replace function public.horario_disponivel(p_profissional uuid,p_inicio timestamptz,p_fim timestamptz,p_ignorar uuid default null)
returns boolean language sql stable security definer set search_path='' set row_security=off as $$select
 not exists(select 1 from public.agendamentos a where a.id is distinct from p_ignorar and a.status in('agendado','confirmado')and(a.profissional_id=p_profissional)and tstzrange(a.inicio,a.fim,'[)')&&tstzrange(p_inicio,p_fim,'[)'))
 and(not exists(select 1 from public.disponibilidades_profissional d where d.profissional_id=p_profissional and d.ativo)or exists(select 1 from public.disponibilidades_profissional d where d.profissional_id=p_profissional and d.ativo and d.dia_semana=extract(dow from p_inicio at time zone'America/Sao_Paulo')::int and(p_inicio at time zone'America/Sao_Paulo')::time>=d.hora_inicio and(p_fim at time zone'America/Sao_Paulo')::time<=d.hora_fim and(p_inicio at time zone'America/Sao_Paulo')::date=(p_fim at time zone'America/Sao_Paulo')::date))$$;

create or replace function public.criar_agendamento(p_paciente_id uuid,p_profissional_id uuid,p_inicio timestamptz,p_fim timestamptz,p_finalidade text,p_modalidade text,p_local text,p_observacao text)
returns uuid language plpgsql security definer set search_path='' set row_security=off as $$declare v_id uuid;begin
 if not public.usuario_coordenacao()then raise exception'unauthorized'using errcode='42501';end if;
 perform pg_advisory_xact_lock(hashtextextended(p_profissional_id::text,0));perform pg_advisory_xact_lock(hashtextextended(p_paciente_id::text,1));
 if p_fim<=p_inicio or not exists(select 1 from public.pacientes where id=p_paciente_id and status='ativo')or not exists(select 1 from public.profiles where id=p_profissional_id and papel='profissional'and status='ativo')then raise exception'invalid_schedule'using errcode='22023';end if;
 if not public.horario_disponivel(p_profissional_id,p_inicio,p_fim)then raise exception'professional_conflict_or_unavailable'using errcode='23P01';end if;
 if exists(select 1 from public.agendamentos where paciente_id=p_paciente_id and status in('agendado','confirmado')and tstzrange(inicio,fim,'[)')&&tstzrange(p_inicio,p_fim,'[)'))then raise exception'patient_conflict'using errcode='23P01';end if;
 insert into public.agendamentos(paciente_id,profissional_id,inicio,fim,finalidade,modalidade,local,observacao_administrativa,criado_por)values(p_paciente_id,p_profissional_id,p_inicio,p_fim,trim(p_finalidade),p_modalidade,nullif(trim(p_local),''),nullif(trim(p_observacao),''),auth.uid())returning id into v_id;
 insert into public.audit_logs(user_id,action,entity_type,entity_id,metadata)values(auth.uid(),'AGENDAMENTO_CRIADO','agendamentos',v_id,jsonb_build_object('profissional_id',p_profissional_id,'paciente_id',p_paciente_id,'inicio',p_inicio));return v_id;end$$;

create or replace function public.reagendar_agendamento(p_id uuid,p_inicio timestamptz,p_fim timestamptz,p_motivo text)
returns void language plpgsql security definer set search_path='' set row_security=off as $$declare a public.agendamentos%rowtype;begin
 if not public.usuario_coordenacao()then raise exception'unauthorized'using errcode='42501';end if;select*into a from public.agendamentos where id=p_id for update;
 if a.id is null or a.status not in('agendado','confirmado')or p_fim<=p_inicio or length(trim(coalesce(p_motivo,'')))<5 then raise exception'invalid_reschedule'using errcode='22023';end if;
 perform pg_advisory_xact_lock(hashtextextended(a.profissional_id::text,0));perform pg_advisory_xact_lock(hashtextextended(a.paciente_id::text,1));
 if not public.horario_disponivel(a.profissional_id,p_inicio,p_fim,a.id)then raise exception'professional_conflict_or_unavailable'using errcode='23P01';end if;
 if exists(select 1 from public.agendamentos x where x.id<>a.id and x.paciente_id=a.paciente_id and x.status in('agendado','confirmado')and tstzrange(x.inicio,x.fim,'[)')&&tstzrange(p_inicio,p_fim,'[)'))then raise exception'patient_conflict'using errcode='23P01';end if;
 insert into public.agendamentos_historico(agendamento_id,alterado_por,tipo,inicio_anterior,fim_anterior,inicio_novo,fim_novo,motivo)values(a.id,auth.uid(),'reagendamento',a.inicio,a.fim,p_inicio,p_fim,trim(p_motivo));
 update public.agendamentos set inicio=p_inicio,fim=p_fim,status='agendado',updated_at=now()where id=a.id;
 insert into public.audit_logs(user_id,action,entity_type,entity_id,metadata)values(auth.uid(),'AGENDAMENTO_REAGENDADO','agendamentos',a.id,jsonb_build_object('inicio_anterior',a.inicio,'inicio_novo',p_inicio));end$$;

create or replace function public.salvar_disponibilidade(p_profissional_id uuid,p_periodos jsonb)
returns void language plpgsql security definer set search_path='' set row_security=off as $$declare item jsonb;begin
 if not(public.usuario_coordenacao()or(auth.uid()=p_profissional_id and public.usuario_ativo()))then raise exception'unauthorized'using errcode='42501';end if;
 if jsonb_typeof(coalesce(p_periodos,'[]'))<>'array'then raise exception'invalid_availability'using errcode='22023';end if;
 delete from public.disponibilidades_profissional where profissional_id=p_profissional_id;
 for item in select value from jsonb_array_elements(p_periodos)loop insert into public.disponibilidades_profissional(profissional_id,dia_semana,hora_inicio,hora_fim)values(p_profissional_id,(item->>'dia_semana')::smallint,(item->>'hora_inicio')::time,(item->>'hora_fim')::time);end loop;
 insert into public.audit_logs(user_id,action,entity_type,entity_id,metadata)values(auth.uid(),'DISPONIBILIDADE_ATUALIZADA','profiles',p_profissional_id,jsonb_build_object('periodos',jsonb_array_length(p_periodos)));exception when invalid_text_representation or check_violation then raise exception'invalid_availability'using errcode='22023';end$$;

drop function if exists public.listar_agendamentos(timestamptz,timestamptz);
create function public.listar_agendamentos(p_inicio timestamptz,p_fim timestamptz)
returns table(id uuid,paciente_id uuid,profissional_id uuid,inicio timestamptz,fim timestamptz,finalidade text,modalidade text,local text,status text,observacao_administrativa text,sessao_id uuid,paciente_nome text,profissional_nome text,pode_iniciar boolean,historico jsonb)
language sql stable security definer set search_path='' set row_security=off as $$
 select a.id,a.paciente_id,a.profissional_id,a.inicio,a.fim,a.finalidade,a.modalidade,a.local,a.status,a.observacao_administrativa,a.sessao_id,p.nome_completo,pr.nome,a.profissional_id=auth.uid()and public.usuario_vinculado(a.paciente_id),
 coalesce((select jsonb_agg(jsonb_build_object('inicio_anterior',h.inicio_anterior,'fim_anterior',h.fim_anterior,'inicio_novo',h.inicio_novo,'fim_novo',h.fim_novo,'motivo',h.motivo,'created_at',h.created_at)order by h.created_at desc)from public.agendamentos_historico h where h.agendamento_id=a.id),'[]'::jsonb)
 from public.agendamentos a join public.pacientes p on p.id=a.paciente_id join public.profiles pr on pr.id=a.profissional_id where a.inicio>=p_inicio and a.inicio<p_fim and(public.usuario_coordenacao()or a.profissional_id=auth.uid())order by a.inicio$$;

revoke all on function public.horario_disponivel(uuid,timestamptz,timestamptz,uuid)from public;
revoke all on function public.reagendar_agendamento(uuid,timestamptz,timestamptz,text)from public;grant execute on function public.reagendar_agendamento(uuid,timestamptz,timestamptz,text)to authenticated;
revoke all on function public.salvar_disponibilidade(uuid,jsonb)from public;grant execute on function public.salvar_disponibilidade(uuid,jsonb)to authenticated;
revoke all on function public.listar_agendamentos(timestamptz,timestamptz)from public;grant execute on function public.listar_agendamentos(timestamptz,timestamptz)to authenticated;
notify pgrst,'reload schema';
