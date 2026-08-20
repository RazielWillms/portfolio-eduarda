-- Busca intervalos livres sem revelar os compromissos que ocupam os demais horários.
create or replace function public.buscar_horarios_disponiveis_agenda(
  p_profissional_id uuid,p_paciente_id uuid,p_inicio date,p_dias integer,p_duracao_minutos integer
)
returns table(inicio timestamptz,fim timestamptz)
language plpgsql stable security definer set search_path='' set row_security=off as $$
begin
  if not public.usuario_tem_permissao('agenda.gerenciar') then raise exception 'unauthorized' using errcode='42501';end if;
  if p_inicio is null or p_dias not in(7,14,30)or p_duracao_minutos not in(30,40,50,60,90,120)
    or not exists(select 1 from public.profiles where id=p_profissional_id and status='ativo')
    or not exists(select 1 from public.pacientes where id=p_paciente_id and status='ativo')then
    raise exception 'invalid_search' using errcode='22023';
  end if;

  return query
  with datas as(
    select d::date dia from generate_series(p_inicio,p_inicio+p_dias-1,interval '1 day')d
  ), candidatos as(
    select slot as slot_inicio,slot+make_interval(mins=>p_duracao_minutos)as slot_fim
    from datas d
    join public.disponibilidades_profissional dp on dp.profissional_id=p_profissional_id and dp.ativo and dp.dia_semana=extract(dow from d.dia)::integer
    cross join lateral generate_series(
      (d.dia+dp.hora_inicio)::timestamp at time zone 'America/Sao_Paulo',
      ((d.dia+dp.hora_fim)::timestamp at time zone 'America/Sao_Paulo')-make_interval(mins=>p_duracao_minutos),
      interval '15 minutes'
    )slot
  )
  select c.slot_inicio,c.slot_fim from candidatos c
  where c.slot_inicio>=now()
    and public.horario_disponivel(p_profissional_id,c.slot_inicio,c.slot_fim,null)
    and not exists(select 1 from public.agendamentos a where a.paciente_id=p_paciente_id and a.status in('agendado','confirmado')and tstzrange(a.inicio,a.fim,'[)')&&tstzrange(c.slot_inicio,c.slot_fim,'[)'))
  order by c.slot_inicio limit 240;
end$$;

revoke all on function public.buscar_horarios_disponiveis_agenda(uuid,uuid,date,integer,integer)from public;
grant execute on function public.buscar_horarios_disponiveis_agenda(uuid,uuid,date,integer,integer)to authenticated;
notify pgrst,'reload schema';
