-- Indices direcionados aos filtros e agregacoes usados pela interface.
create index if not exists sessoes_clinicas_paciente_data_ativas_idx
on public.sessoes_clinicas(paciente_id,data desc,created_at desc)
where deleted_at is null;

create index if not exists sessoes_clinicas_avaliacao_profissional_idx
on public.sessoes_clinicas(paciente_id,profissional_id,finalidade,data desc)
where deleted_at is null;

create index if not exists registros_medicao_sessao_idx
on public.registros_medicao(sessao_id);

create index if not exists observacoes_abc_sessao_idx
on public.observacoes_abc(sessao_id);

create index if not exists concordancias_paciente_observador_status_idx
on public.solicitacoes_concordancia(paciente_id,observador_id,status,solicitado_em desc);

create index if not exists revisoes_clinicas_proxima_idx
on public.revisoes_clinicas_alvo(alvo_id,proxima_revisao_em,created_at desc)
where proxima_revisao_em is not null;

analyze public.sessoes_clinicas;
analyze public.registros_medicao;
analyze public.observacoes_abc;
analyze public.solicitacoes_concordancia;
analyze public.revisoes_clinicas_alvo;
