-- COMANDO 1 — LIMPAR DADOS
-- Preserva: administrador principal, seu auth.users e o catálogo public.habilidades.
-- Remove: demais usuários, pacientes, vínculos, sessões, planos, auditoria e compartilhamentos.
begin;

do $$
begin
  if not exists (
    select 1 from public.profiles
    where admin_principal and papel='admin' and status='ativo'
  ) then
    raise exception 'Administrador principal ativo não encontrado. Limpeza cancelada.';
  end if;
end
$$;

-- Necessário porque registros clínicos versionados possuem gatilhos append-only.
set local session_replication_role = replica;

delete from public.concordancia_referencias;
delete from public.solicitacoes_concordancia;
delete from public.integridade_procedimental;
delete from public.observacoes_abc;
delete from public.registros_medicao;
delete from public.sessoes_clinicas;
delete from public.revisoes_clinicas_alvo;
delete from public.planos_apoio_comportamental_alvo;
delete from public.protocolos_intervencao_alvo;
delete from public.registros_validade_social;
delete from public.capacitacoes_aplicadores;
delete from public.historico_fases_alvo;
delete from public.criterios_dominio_alvo;
delete from public.configuracoes_medicao_alvo;
delete from public.definicoes_operacionais_alvo;
delete from public.alvos_clinicos;
delete from public.objetivos_clinicos;
delete from public.planos_clinicos;
delete from public.acessos_responsavel;
delete from public.solicitacoes_acesso;
delete from public.paciente_habilidades;
delete from public.paciente_psicologos;
delete from public.pacientes;
delete from public.audit_logs;
delete from public.niveis_avaliacao;

-- Exclui contas e perfis que não sejam o administrador principal.
delete from auth.users
where id not in (select id from public.profiles where admin_principal);

delete from public.profiles
where not admin_principal;

-- Confirma a invariável solicitada.
do $$
begin
  if (select count(*) from public.profiles) <> 1
     or (select count(*) from auth.users) <> 1 then
    raise exception 'A limpeza não terminou com exatamente um administrador. Transação cancelada.';
  end if;
end
$$;

commit;

select
  (select count(*) from public.profiles) as administradores_preservados,
  (select count(*) from public.habilidades) as habilidades_preservadas,
  (select count(*) from public.pacientes) as pacientes_restantes,
  (select count(*) from public.sessoes_clinicas) as sessoes_restantes;
