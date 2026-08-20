-- Agenda recorrente e disponibilidade explícita (expediente - bloqueios - compromissos).
create table if not exists public.series_agendamentos(
 id uuid primary key default gen_random_uuid(),paciente_id uuid not null references public.pacientes(id),profissional_id uuid not null references public.profiles(id),
 frequencia text not null check(frequencia in('semanal','quinzenal','tres_semanas','mensal')),inicio_em date not null,fim_em date not null,
 horario time not null,duracao_minutos integer not null check(duracao_minutos between 10 and 480),criado_por uuid not null references public.profiles(id),
 status text not null default'ativa'check(status in('ativa','encerrada','cancelada')),created_at timestamptz not null default now(),updated_at timestamptz not null default now()
);
alter table public.agendamentos add column if not exists serie_id uuid references public.series_agendamentos(id)on delete restrict;
alter table public.agendamentos add column if not exists ocorrencia_numero integer;
create index if not exists agendamentos_serie_idx on public.agendamentos(serie_id,inicio);
alter table public.series_agendamentos enable row level security;alter table public.series_agendamentos force row level security;
create policy series_agendamentos_select on public.series_agendamentos for select to authenticated using(public.usuario_coordenacao()or profissional_id=auth.uid());

create table if not exists public.indisponibilidades_profissional(
 id uuid primary key default gen_random_uuid(),profissional_id uuid not null references public.profiles(id),inicio timestamptz not null,fim timestamptz not null,motivo text,
 criado_por uuid not null references public.profiles(id),cancelado_em timestamptz,created_at timestamptz not null default now(),constraint indisponibilidade_periodo_check check(fim>inicio)
);
create index if not exists indisponibilidades_profissional_periodo_idx on public.indisponibilidades_profissional(profissional_id,inicio,fim)where cancelado_em is null;
alter table public.indisponibilidades_profissional enable row level security;alter table public.indisponibilidades_profissional force row level security;
create policy indisponibilidades_select on public.indisponibilidades_profissional for select to authenticated using(public.usuario_coordenacao()or profissional_id=auth.uid());

create or replace function public.horario_disponivel(p_profissional uuid,p_inicio timestamptz,p_fim timestamptz,p_ignorar uuid default null)
returns boolean language sql stable security definer set search_path='' set row_security=off as $$select public.perfil_pode_atender(p_profissional)and p_fim>p_inicio
 and exists(select 1 from public.disponibilidades_profissional d where d.profissional_id=p_profissional and d.ativo and d.dia_semana=extract(dow from p_inicio at time zone'America/Sao_Paulo')::int and(p_inicio at time zone'America/Sao_Paulo')::time>=d.hora_inicio and(p_fim at time zone'America/Sao_Paulo')::time<=d.hora_fim and(p_inicio at time zone'America/Sao_Paulo')::date=(p_fim at time zone'America/Sao_Paulo')::date)
 and not exists(select 1 from public.indisponibilidades_profissional i where i.profissional_id=p_profissional and i.cancelado_em is null and tstzrange(i.inicio,i.fim,'[)')&&tstzrange(p_inicio,p_fim,'[)'))
 and not exists(select 1 from public.agendamentos a where a.id is distinct from p_ignorar and a.profissional_id=p_profissional and a.status in('agendado','confirmado')and tstzrange(a.inicio,a.fim,'[)')&&tstzrange(p_inicio,p_fim,'[)'))$$;

create or replace function public.consultar_disponibilidade_agenda(p_inicio timestamptz,p_fim timestamptz)
returns table(profissional_id uuid,profissional_nome text,profissao text,status text,motivo text)
language plpgsql stable security definer set search_path='' set row_security=off as $$begin
 if not public.usuario_coordenacao()or p_fim<=p_inicio then raise exception'unauthorized_or_invalid'using errcode='42501';end if;
 return query select p.id,p.nome,p.profissao,case
  when not exists(select 1 from public.disponibilidades_profissional d where d.profissional_id=p.id and d.ativo)then'nao_configurada'
  when not exists(select 1 from public.disponibilidades_profissional d where d.profissional_id=p.id and d.ativo and d.dia_semana=extract(dow from p_inicio at time zone'America/Sao_Paulo')::int and(p_inicio at time zone'America/Sao_Paulo')::time>=d.hora_inicio and(p_fim at time zone'America/Sao_Paulo')::time<=d.hora_fim and(p_inicio at time zone'America/Sao_Paulo')::date=(p_fim at time zone'America/Sao_Paulo')::date)then'fora_expediente'
  when exists(select 1 from public.indisponibilidades_profissional i where i.profissional_id=p.id and i.cancelado_em is null and tstzrange(i.inicio,i.fim,'[)')&&tstzrange(p_inicio,p_fim,'[)'))then'indisponivel'
  when exists(select 1 from public.agendamentos a where a.profissional_id=p.id and a.status in('agendado','confirmado')and tstzrange(a.inicio,a.fim,'[)')&&tstzrange(p_inicio,p_fim,'[)'))then'ocupado'
  else'disponivel'end,
  case when exists(select 1 from public.indisponibilidades_profissional i where i.profissional_id=p.id and i.cancelado_em is null and tstzrange(i.inicio,i.fim,'[)')&&tstzrange(p_inicio,p_fim,'[)'))then'Bloqueio cadastrado'when exists(select 1 from public.agendamentos a where a.profissional_id=p.id and a.status in('agendado','confirmado')and tstzrange(a.inicio,a.fim,'[)')&&tstzrange(p_inicio,p_fim,'[)'))then'Já possui compromisso'else null end
 from public.profiles p where p.status='ativo'and p.papel in('profissional','coordenacao')order by case when public.horario_disponivel(p.id,p_inicio,p_fim)then 0 else 1 end,p.nome;end$$;

create or replace function public.criar_serie_agendamentos(p_paciente_id uuid,p_profissional_id uuid,p_inicio timestamptz,p_duracao_minutos integer,p_frequencia text,p_fim_recorrencia date,p_finalidade text,p_modalidade text,p_local text,p_observacao text,p_conflitos text default'bloquear')
returns jsonb language plpgsql security definer set search_path='' set row_security=off as $$declare v_serie uuid;v_agendamento uuid;v_data timestamptz:=p_inicio;v_fim timestamptz;v_num integer:=0;v_criados integer:=0;v_conflitos jsonb:='[]';v_interval interval;begin
 if not public.usuario_coordenacao()or p_duracao_minutos not between 10 and 480 or p_frequencia not in('nenhuma','semanal','quinzenal','tres_semanas','mensal')or p_conflitos not in('bloquear','ignorar')or not public.perfil_pode_atender(p_profissional_id)or not exists(select 1 from public.pacientes where id=p_paciente_id and status='ativo')then raise exception'invalid_series'using errcode='22023';end if;
 if p_frequencia='nenhuma'then p_fim_recorrencia:=(p_inicio at time zone'America/Sao_Paulo')::date;else if p_fim_recorrencia is null or p_fim_recorrencia<(p_inicio at time zone'America/Sao_Paulo')::date or p_fim_recorrencia>(p_inicio at time zone'America/Sao_Paulo')::date+730 then raise exception'invalid_series_period'using errcode='22023';end if;end if;
 v_interval:=case p_frequencia when'semanal'then interval'1 week'when'quinzenal'then interval'2 weeks'when'tres_semanas'then interval'3 weeks'when'mensal'then interval'1 month'else interval'100 years'end;
 if p_frequencia<>'nenhuma'then insert into public.series_agendamentos(paciente_id,profissional_id,frequencia,inicio_em,fim_em,horario,duracao_minutos,criado_por)values(p_paciente_id,p_profissional_id,p_frequencia,(p_inicio at time zone'America/Sao_Paulo')::date,p_fim_recorrencia,(p_inicio at time zone'America/Sao_Paulo')::time,p_duracao_minutos,auth.uid())returning id into v_serie;end if;
 while(v_data at time zone'America/Sao_Paulo')::date<=p_fim_recorrencia and v_num<105 loop v_num:=v_num+1;v_fim:=v_data+make_interval(mins=>p_duracao_minutos);
  perform pg_advisory_xact_lock(hashtextextended(p_profissional_id::text,0));perform pg_advisory_xact_lock(hashtextextended(p_paciente_id::text,1));
  if not public.horario_disponivel(p_profissional_id,v_data,v_fim)or exists(select 1 from public.agendamentos where paciente_id=p_paciente_id and status in('agendado','confirmado')and tstzrange(inicio,fim,'[)')&&tstzrange(v_data,v_fim,'[)'))then
   v_conflitos:=v_conflitos||jsonb_build_array(jsonb_build_object('data',v_data,'motivo','Horário indisponível'));
   if p_conflitos='bloquear'then raise exception'series_conflict:%',v_data using errcode='23P01';end if;
  else insert into public.agendamentos(paciente_id,profissional_id,inicio,fim,finalidade,modalidade,local,observacao_administrativa,criado_por,serie_id,ocorrencia_numero)values(p_paciente_id,p_profissional_id,v_data,v_fim,trim(p_finalidade),p_modalidade,nullif(trim(p_local),''),nullif(trim(p_observacao),''),auth.uid(),v_serie,v_num)returning id into v_agendamento;v_criados:=v_criados+1;end if;
  v_data:=v_data+v_interval;end loop;
 if v_criados=0 then raise exception'no_available_occurrences'using errcode='23P01';end if;
 insert into public.audit_logs(user_id,action,entity_type,entity_id,metadata)values(auth.uid(),case when v_serie is null then'AGENDAMENTO_CRIADO'else'SERIE_AGENDAMENTOS_CRIADA'end,case when v_serie is null then'agendamentos'else'series_agendamentos'end,coalesce(v_serie,v_agendamento),jsonb_build_object('criados',v_criados,'conflitos',jsonb_array_length(v_conflitos)));
 return jsonb_build_object('serie_id',v_serie,'criados',v_criados,'conflitos',v_conflitos);end$$;

create or replace function public.salvar_indisponibilidade(p_profissional_id uuid,p_inicio timestamptz,p_fim timestamptz,p_motivo text)
returns uuid language plpgsql security definer set search_path='' set row_security=off as $$declare v_id uuid;begin
 if not public.perfil_pode_atender(p_profissional_id)or not(public.usuario_coordenacao()or auth.uid()=p_profissional_id)or p_fim<=p_inicio then raise exception'unauthorized_or_invalid'using errcode='42501';end if;
 insert into public.indisponibilidades_profissional(profissional_id,inicio,fim,motivo,criado_por)values(p_profissional_id,p_inicio,p_fim,nullif(trim(p_motivo),''),auth.uid())returning id into v_id;
 insert into public.audit_logs(user_id,action,entity_type,entity_id,metadata)values(auth.uid(),'INDISPONIBILIDADE_CRIADA','indisponibilidades_profissional',v_id,jsonb_build_object('profissional_id',p_profissional_id));return v_id;end$$;

revoke all on table public.series_agendamentos,public.indisponibilidades_profissional from anon,authenticated;grant select on table public.series_agendamentos,public.indisponibilidades_profissional to authenticated;
revoke all on function public.horario_disponivel(uuid,timestamptz,timestamptz,uuid)from public;
revoke all on function public.consultar_disponibilidade_agenda(timestamptz,timestamptz)from public;grant execute on function public.consultar_disponibilidade_agenda(timestamptz,timestamptz)to authenticated;
revoke all on function public.criar_serie_agendamentos(uuid,uuid,timestamptz,integer,text,date,text,text,text,text,text)from public;grant execute on function public.criar_serie_agendamentos(uuid,uuid,timestamptz,integer,text,date,text,text,text,text,text)to authenticated;
revoke all on function public.salvar_indisponibilidade(uuid,timestamptz,timestamptz,text)from public;grant execute on function public.salvar_indisponibilidade(uuid,timestamptz,timestamptz,text)to authenticated;
notify pgrst,'reload schema';
