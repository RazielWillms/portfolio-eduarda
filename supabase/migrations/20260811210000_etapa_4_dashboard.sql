-- Etapa 4: leituras agregadas seguras para dashboards.

create or replace function public.profissionais_vinculados_paciente(p_paciente_id uuid)
returns table (id uuid, nome text)
language sql stable security definer set search_path = '' as $$
  select p.id, p.nome
  from public.paciente_psicologos pp
  join public.profiles p on p.id = pp.psicologo_id and p.status = 'ativo'
  where pp.paciente_id = p_paciente_id
    and (public.usuario_admin() or public.usuario_vinculado(p_paciente_id))
  order by p.nome
$$;

create or replace function public.avaliacoes_clinicas_profissional(p_desde date default (current_date - interval '1 year')::date)
returns table (
  id uuid, paciente_id uuid, habilidade_id uuid, data date,
  created_at timestamptz, codigo text, valor numeric
)
language sql stable security definer set search_path = '' as $$
  select a.id, a.paciente_id, a.habilidade_id, a.data, a.created_at, n.codigo, n.valor
  from public.atendimentos a
  join public.niveis_avaliacao n on n.id = a.nivel_avaliacao_id
  where a.data >= p_desde
    and (public.usuario_admin() or public.usuario_vinculado(a.paciente_id))
  order by a.data, a.created_at, a.id
$$;

revoke all on function public.profissionais_vinculados_paciente(uuid) from public;
revoke all on function public.avaliacoes_clinicas_profissional(date) from public;
grant execute on function public.profissionais_vinculados_paciente(uuid) to authenticated;
grant execute on function public.avaliacoes_clinicas_profissional(date) to authenticated;
