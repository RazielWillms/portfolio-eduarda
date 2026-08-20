-- Explica a disponibilidade sem revelar dados identificáveis do compromisso.
create or replace function public.consultar_disponibilidade_agenda(p_inicio timestamptz,p_fim timestamptz)
returns table(profissional_id uuid,profissional_nome text,profissao text,status text,motivo text)
language plpgsql stable security definer set search_path='' set row_security=off as $$
begin
 if not public.usuario_coordenacao() or p_inicio is null or p_fim is null or p_fim<=p_inicio then
  raise exception'unauthorized_or_invalid'using errcode='42501';
 end if;
 return query
 select p.id,p.nome,p.profissao,
  case
   when not exists(select 1 from public.disponibilidades_profissional d where d.profissional_id=p.id and d.ativo)then'nao_configurada'
   when not exists(select 1 from public.disponibilidades_profissional d where d.profissional_id=p.id and d.ativo and d.dia_semana=extract(dow from p_inicio at time zone'America/Sao_Paulo')::int and(p_inicio at time zone'America/Sao_Paulo')::time>=d.hora_inicio and(p_fim at time zone'America/Sao_Paulo')::time<=d.hora_fim and(p_inicio at time zone'America/Sao_Paulo')::date=(p_fim at time zone'America/Sao_Paulo')::date)then'fora_expediente'
   when exists(select 1 from public.indisponibilidades_profissional i where i.profissional_id=p.id and i.cancelado_em is null and tstzrange(i.inicio,i.fim,'[)')&&tstzrange(p_inicio,p_fim,'[)'))then'indisponivel'
   when exists(select 1 from public.agendamentos a where a.profissional_id=p.id and a.status in('agendado','confirmado')and tstzrange(a.inicio,a.fim,'[)')&&tstzrange(p_inicio,p_fim,'[)'))then'ocupado'
   else'disponivel'
  end,
  case
   when not exists(select 1 from public.disponibilidades_profissional d where d.profissional_id=p.id and d.ativo)
    then'Expediente semanal não cadastrado.'
   when not exists(select 1 from public.disponibilidades_profissional d where d.profissional_id=p.id and d.ativo and d.dia_semana=extract(dow from p_inicio at time zone'America/Sao_Paulo')::int and(p_inicio at time zone'America/Sao_Paulo')::time>=d.hora_inicio and(p_fim at time zone'America/Sao_Paulo')::time<=d.hora_fim and(p_inicio at time zone'America/Sao_Paulo')::date=(p_fim at time zone'America/Sao_Paulo')::date)
    then coalesce((select'Expediente do dia: '||string_agg(to_char(d.hora_inicio,'HH24:MI')||' às '||to_char(d.hora_fim,'HH24:MI'),', 'order by d.hora_inicio)||'.'from public.disponibilidades_profissional d where d.profissional_id=p.id and d.ativo and d.dia_semana=extract(dow from p_inicio at time zone'America/Sao_Paulo')::int),'Sem expediente configurado neste dia.')
   when exists(select 1 from public.indisponibilidades_profissional i where i.profissional_id=p.id and i.cancelado_em is null and tstzrange(i.inicio,i.fim,'[)')&&tstzrange(p_inicio,p_fim,'[)'))
    then(select'Bloqueio: '||string_agg(to_char(i.inicio at time zone'America/Sao_Paulo','HH24:MI')||' às '||to_char(i.fim at time zone'America/Sao_Paulo','HH24:MI'),', 'order by i.inicio)||'.'from public.indisponibilidades_profissional i where i.profissional_id=p.id and i.cancelado_em is null and tstzrange(i.inicio,i.fim,'[)')&&tstzrange(p_inicio,p_fim,'[)'))
   when exists(select 1 from public.agendamentos a where a.profissional_id=p.id and a.status in('agendado','confirmado')and tstzrange(a.inicio,a.fim,'[)')&&tstzrange(p_inicio,p_fim,'[)'))
    then(select'Ocupado: '||string_agg(to_char(a.inicio at time zone'America/Sao_Paulo','HH24:MI')||' às '||to_char(a.fim at time zone'America/Sao_Paulo','HH24:MI'),', 'order by a.inicio)||'.'from public.agendamentos a where a.profissional_id=p.id and a.status in('agendado','confirmado')and tstzrange(a.inicio,a.fim,'[)')&&tstzrange(p_inicio,p_fim,'[)'))
   else'Livre no intervalo solicitado.'
  end
 from public.profiles p
 where p.status='ativo'and p.papel in('profissional','coordenacao')
 order by case when public.horario_disponivel(p.id,p_inicio,p_fim)then 0 else 1 end,p.nome;
end$$;

revoke all on function public.consultar_disponibilidade_agenda(timestamptz,timestamptz)from public;
grant execute on function public.consultar_disponibilidade_agenda(timestamptz,timestamptz)to authenticated;
notify pgrst,'reload schema';
