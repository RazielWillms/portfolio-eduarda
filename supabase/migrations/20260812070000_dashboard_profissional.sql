-- O painel operacional sempre resume somente a producao do usuario atual.
-- A visao da equipe permanece disponivel apenas dentro do paciente, por escolha explicita.
create or replace function public.avaliacoes_clinicas_profissional(
  p_desde date default (current_date - interval '1 year')::date
)
returns table (
  id uuid, paciente_id uuid, habilidade_id uuid, data date,
  created_at timestamptz, codigo text, valor numeric
)
language sql stable security definer set search_path = '' as $$
  select a.id,a.paciente_id,a.habilidade_id,a.data,a.created_at,n.codigo,n.valor
  from public.atendimentos a
  join public.niveis_avaliacao n on n.id=a.nivel_avaliacao_id
  where a.deleted_at is null
    and a.data >= p_desde
    and a.psicologo_id = auth.uid()
    and public.usuario_vinculado(a.paciente_id)
  order by a.data,a.created_at,a.id
$$;

revoke all on function public.avaliacoes_clinicas_profissional(date) from public;
grant execute on function public.avaliacoes_clinicas_profissional(date) to authenticated;

notify pgrst, 'reload schema';
