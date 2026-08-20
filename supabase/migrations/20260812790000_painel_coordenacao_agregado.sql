-- Painel operacional da coordenacao em uma unica leitura agregada.
create or replace function public.obter_painel_coordenacao_agregado()
returns jsonb
language plpgsql
stable
security definer
set search_path=''
set row_security=off
as $$
declare
  v_agora timestamptz:=now();
  v_fim timestamptz:=now()+interval '7 days';
begin
  if auth.uid()is null or not public.usuario_ativo()or not public.usuario_tem_permissao('agenda.visualizar_equipe')then
    raise exception'unauthorized'using errcode='42501';
  end if;

  return jsonb_build_object(
    'compromissos_7_dias',(select count(*)from public.agendamentos a
      where a.inicio>=v_agora and a.inicio<v_fim and a.status in('agendado','confirmado')
        and not public.paciente_demonstracao(a.paciente_id)),
    'pacientes_ativos',(select count(*)from public.pacientes p
      where p.status='ativo'and not public.paciente_demonstracao(p.id)),
    'pacientes_sem_profissional',(select count(*)from public.pacientes p
      where p.status='ativo'and not public.paciente_demonstracao(p.id)
      and not exists(select 1 from public.paciente_psicologos pp where pp.paciente_id=p.id)),
    'proximo',(select jsonb_build_object(
      'id',a.id,'paciente_id',a.paciente_id,'paciente_nome',p.nome_completo,
      'profissional_nome',pr.nome,'inicio',a.inicio,
      'pode_iniciar',exists(select 1 from public.paciente_psicologos pp
        where pp.paciente_id=a.paciente_id and pp.psicologo_id=a.profissional_id)
    )from public.agendamentos a
      join public.pacientes p on p.id=a.paciente_id
      join public.profiles pr on pr.id=a.profissional_id
      where a.inicio>=v_agora and a.inicio<v_fim and a.status in('agendado','confirmado')
        and not public.paciente_demonstracao(a.paciente_id)
      order by a.inicio limit 1)
  );
end$$;

revoke all on function public.obter_painel_coordenacao_agregado()from public;
grant execute on function public.obter_painel_coordenacao_agregado()to authenticated;
notify pgrst,'reload schema';
