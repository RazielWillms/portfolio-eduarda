-- Mantém o cenário fictício exclusivamente no modo de demonstração.
create or replace function public.usuario_demonstracao(p_id uuid)
returns boolean language sql stable security definer set search_path='' set row_security=off
as $$select exists(select 1 from public.profiles p where p.id=p_id and lower(p.email)='demo@registrosaba.local')$$;
create or replace function public.paciente_demonstracao(p_id uuid)
returns boolean language sql stable security definer set search_path='' set row_security=off
as $$select exists(select 1 from public.pacientes pa join public.profiles pr on pr.id=pa.criado_por where pa.id=p_id and lower(pr.email)='demo@registrosaba.local')$$;

create or replace function public.perfil_pode_atender(p_id uuid)
returns boolean language sql stable security definer set search_path='' set row_security=off as $$
 select exists(select 1 from public.profiles where id=p_id and papel in('profissional','coordenacao')and status='ativo'and lower(coalesce(email,''))<>'demo@registrosaba.local')
$$;

create or replace function public.bloquear_demo_em_fluxo_operacional()
returns trigger language plpgsql security definer set search_path='' set row_security=off as $$begin
 if public.usuario_demonstracao(new.profissional_id)or public.paciente_demonstracao(new.paciente_id)then
  raise exception'demo_not_available_for_operations'using errcode='22023';
 end if;
 return new;
end$$;
drop trigger if exists agendamentos_bloquear_demo on public.agendamentos;
create trigger agendamentos_bloquear_demo before insert or update of paciente_id,profissional_id on public.agendamentos for each row execute function public.bloquear_demo_em_fluxo_operacional();
drop trigger if exists ocorrencias_frequencia_bloquear_demo on public.ocorrencias_frequencia;
create trigger ocorrencias_frequencia_bloquear_demo before insert or update of paciente_id,profissional_id on public.ocorrencias_frequencia for each row execute function public.bloquear_demo_em_fluxo_operacional();

create or replace function public.listar_opcoes_agendamento()
returns jsonb language plpgsql stable security definer set search_path='' set row_security=off as $$begin
 if not public.usuario_coordenacao()then raise exception'unauthorized'using errcode='42501';end if;
 return jsonb_build_object(
  'pacientes',coalesce((select jsonb_agg(jsonb_build_object('id',p.id,'nome',p.nome_completo,'status',p.status,'profissionais_vinculados',(select count(*)from public.paciente_psicologos pp where pp.paciente_id=p.id))order by p.nome_completo)from public.pacientes p where p.status='ativo'and not public.paciente_demonstracao(p.id)),'[]'::jsonb),
  'profissionais',coalesce((select jsonb_agg(jsonb_build_object('id',p.id,'nome',p.nome,'profissao',p.profissao)order by p.nome)from public.profiles p where p.status='ativo'and p.papel in('profissional','coordenacao')and not public.usuario_demonstracao(p.id)),'[]'::jsonb));end$$;

create or replace function public.opcoes_frequencia()
returns jsonb language plpgsql stable security definer set search_path='' set row_security=off as $$begin
 if not public.usuario_ativo()then raise exception'unauthorized'using errcode='42501';end if;
 return jsonb_build_object(
  'pacientes',coalesce((select jsonb_agg(jsonb_build_object('id',p.id,'nome',p.nome_completo)order by p.nome_completo)from public.pacientes p where p.status='ativo'and not public.paciente_demonstracao(p.id)and(public.usuario_coordenacao()or exists(select 1 from public.paciente_psicologos pp where pp.paciente_id=p.id and pp.psicologo_id=auth.uid()))),'[]'::jsonb),
  'profissionais',coalesce((select jsonb_agg(jsonb_build_object('id',pr.id,'nome',pr.nome,'profissao',pr.profissao)order by pr.nome)from public.profiles pr where pr.status='ativo'and pr.papel in('profissional','coordenacao')and not public.usuario_demonstracao(pr.id)and(public.usuario_coordenacao()or pr.id=auth.uid())),'[]'::jsonb));end$$;

-- A função detalhada da disponibilidade também omite a conta reservada.
create or replace function public.consultar_disponibilidade_agenda(p_inicio timestamptz,p_fim timestamptz)
returns table(profissional_id uuid,profissional_nome text,profissao text,status text,motivo text)
language plpgsql stable security definer set search_path='' set row_security=off as $$begin
 if not public.usuario_coordenacao()or p_inicio is null or p_fim is null or p_fim<=p_inicio then raise exception'unauthorized_or_invalid'using errcode='42501';end if;
 return query select p.id,p.nome,p.profissao,case
  when not exists(select 1 from public.disponibilidades_profissional d where d.profissional_id=p.id and d.ativo)then'nao_configurada'
  when not exists(select 1 from public.disponibilidades_profissional d where d.profissional_id=p.id and d.ativo and d.dia_semana=extract(dow from p_inicio at time zone'America/Sao_Paulo')::int and(p_inicio at time zone'America/Sao_Paulo')::time>=d.hora_inicio and(p_fim at time zone'America/Sao_Paulo')::time<=d.hora_fim and(p_inicio at time zone'America/Sao_Paulo')::date=(p_fim at time zone'America/Sao_Paulo')::date)then'fora_expediente'
  when exists(select 1 from public.indisponibilidades_profissional i where i.profissional_id=p.id and i.cancelado_em is null and tstzrange(i.inicio,i.fim,'[)')&&tstzrange(p_inicio,p_fim,'[)'))then'indisponivel'
  when exists(select 1 from public.agendamentos a where a.profissional_id=p.id and a.status in('agendado','confirmado')and tstzrange(a.inicio,a.fim,'[)')&&tstzrange(p_inicio,p_fim,'[)'))then'ocupado'else'disponivel'end,
  case
  when not exists(select 1 from public.disponibilidades_profissional d where d.profissional_id=p.id and d.ativo)then'Expediente semanal não cadastrado.'
  when not exists(select 1 from public.disponibilidades_profissional d where d.profissional_id=p.id and d.ativo and d.dia_semana=extract(dow from p_inicio at time zone'America/Sao_Paulo')::int and(p_inicio at time zone'America/Sao_Paulo')::time>=d.hora_inicio and(p_fim at time zone'America/Sao_Paulo')::time<=d.hora_fim and(p_inicio at time zone'America/Sao_Paulo')::date=(p_fim at time zone'America/Sao_Paulo')::date)then coalesce((select'Expediente do dia: '||string_agg(to_char(d.hora_inicio,'HH24:MI')||' às '||to_char(d.hora_fim,'HH24:MI'),', 'order by d.hora_inicio)||'.'from public.disponibilidades_profissional d where d.profissional_id=p.id and d.ativo and d.dia_semana=extract(dow from p_inicio at time zone'America/Sao_Paulo')::int),'Sem expediente configurado neste dia.')
  when exists(select 1 from public.indisponibilidades_profissional i where i.profissional_id=p.id and i.cancelado_em is null and tstzrange(i.inicio,i.fim,'[)')&&tstzrange(p_inicio,p_fim,'[)'))then(select'Bloqueio: '||string_agg(to_char(i.inicio at time zone'America/Sao_Paulo','HH24:MI')||' às '||to_char(i.fim at time zone'America/Sao_Paulo','HH24:MI'),', 'order by i.inicio)||'.'from public.indisponibilidades_profissional i where i.profissional_id=p.id and i.cancelado_em is null and tstzrange(i.inicio,i.fim,'[)')&&tstzrange(p_inicio,p_fim,'[)'))
  when exists(select 1 from public.agendamentos a where a.profissional_id=p.id and a.status in('agendado','confirmado')and tstzrange(a.inicio,a.fim,'[)')&&tstzrange(p_inicio,p_fim,'[)'))then(select'Ocupado: '||string_agg(to_char(a.inicio at time zone'America/Sao_Paulo','HH24:MI')||' às '||to_char(a.fim at time zone'America/Sao_Paulo','HH24:MI'),', 'order by a.inicio)||'.'from public.agendamentos a where a.profissional_id=p.id and a.status in('agendado','confirmado')and tstzrange(a.inicio,a.fim,'[)')&&tstzrange(p_inicio,p_fim,'[)'))
  else'Livre no intervalo solicitado.'end
 from public.profiles p where p.status='ativo'and p.papel in('profissional','coordenacao')and not public.usuario_demonstracao(p.id)
 order by case when public.horario_disponivel(p.id,p_inicio,p_fim)then 0 else 1 end,p.nome;end$$;

revoke all on function public.usuario_demonstracao(uuid),public.paciente_demonstracao(uuid),public.bloquear_demo_em_fluxo_operacional()from public;
revoke all on function public.listar_opcoes_agendamento(),public.opcoes_frequencia(),public.consultar_disponibilidade_agenda(timestamptz,timestamptz)from public;
grant execute on function public.listar_opcoes_agendamento(),public.opcoes_frequencia(),public.consultar_disponibilidade_agenda(timestamptz,timestamptz)to authenticated;
notify pgrst,'reload schema';
