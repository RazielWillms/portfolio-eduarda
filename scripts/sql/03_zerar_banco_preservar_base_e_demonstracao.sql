-- LIMPEZA PARA INICIO DO USO REAL
--
-- Preserva:
--   * o administrador principal e sua conta de autenticação;
--   * o usuário reservado demo@registrosaba.local e todo o cenário clínico dele;
--   * habilidades e níveis de avaliação;
--   * profissões;
--   * papéis, permissões e atribuições dos dois usuários preservados.
--
-- Remove:
--   * demais usuários;
--   * pacientes e prontuários reais/de teste;
--   * agenda, disponibilidade, bloqueios e frequência;
--   * solicitações, compartilhamentos e auditoria que não pertencem ao cenário demo.
--
-- Execute no SQL Editor do Supabase. Toda a operação é transacional: qualquer
-- inconsistência provoca ROLLBACK automático.

begin;

do $$
declare
  v_admins integer;
  v_demos integer;
  v_pacientes_demo integer;
begin
  select count(*) into v_admins
  from public.profiles
  where admin_principal and papel = 'admin' and status = 'ativo';

  select count(*) into v_demos
  from public.profiles
  where lower(email) = 'demo@registrosaba.local';

  select count(*) into v_pacientes_demo
  from public.pacientes p
  join public.profiles pr on pr.id = p.criado_por
  where lower(pr.email) = 'demo@registrosaba.local';

  if v_admins <> 1 then
    raise exception 'A limpeza exige exatamente um administrador principal ativo; encontrados: %.', v_admins;
  end if;

  if v_demos <> 1 or v_pacientes_demo = 0 then
    raise exception 'Cenário de demonstração incompleto. Execute a carga demonstrativa antes da limpeza.';
  end if;
end
$$;

drop table if exists pg_temp._manter_concordancias;
drop table if exists pg_temp._manter_revisoes;
drop table if exists pg_temp._manter_registros;
drop table if exists pg_temp._manter_sessoes;
drop table if exists pg_temp._manter_alvos;
drop table if exists pg_temp._manter_objetivos;
drop table if exists pg_temp._manter_planos;
drop table if exists pg_temp._manter_pacientes;
drop table if exists pg_temp._manter_profiles;

-- Não utiliza ON COMMIT DROP: alguns executores do SQL Editor confirmam cada
-- comando de criação separadamente, o que removeria a tabela antes do próximo.
create temporary table _manter_profiles as
select id
from public.profiles
where admin_principal
   or lower(email) = 'demo@registrosaba.local';

create temporary table _manter_pacientes as
select p.id
from public.pacientes p
join public.profiles pr on pr.id = p.criado_por
where lower(pr.email) = 'demo@registrosaba.local';

create temporary table _manter_planos as
select id from public.planos_clinicos
where paciente_id in (select id from _manter_pacientes)
  and profissional_responsavel_id in (select id from _manter_profiles);

create temporary table _manter_objetivos as
select id from public.objetivos_clinicos
where plano_id in (select id from _manter_planos);

create temporary table _manter_alvos as
select id from public.alvos_clinicos
where objetivo_id in (select id from _manter_objetivos)
  and profissional_id in (select id from _manter_profiles);

create temporary table _manter_sessoes as
select id from public.sessoes_clinicas
where paciente_id in (select id from _manter_pacientes)
  and profissional_id in (select id from _manter_profiles);

create temporary table _manter_registros as
select id from public.registros_medicao
where sessao_id in (select id from _manter_sessoes)
  and alvo_id in (select id from _manter_alvos);

create temporary table _manter_revisoes as
select id from public.revisoes_clinicas_alvo
where alvo_id in (select id from _manter_alvos)
  and profissional_id in (select id from _manter_profiles);

create temporary table _manter_concordancias as
select id from public.solicitacoes_concordancia
where paciente_id in (select id from _manter_pacientes)
  and registro_medicao_id in (select id from _manter_registros)
  and alvo_id in (select id from _manter_alvos)
  and solicitante_id in (select id from _manter_profiles)
  and observador_id in (select id from _manter_profiles);

-- Os registros clínicos versionados possuem proteções append-only. Durante esta
-- transação administrativa, os gatilhos são suspensos; as chaves estrangeiras
-- voltam a ser aplicadas antes da exclusão das contas.
set local session_replication_role = replica;

-- Agenda e frequência são deliberadamente reiniciadas por completo.
delete from public.ocorrencias_frequencia;
delete from public.agendamentos_historico;
delete from public.agendamentos;
delete from public.series_agendamentos;
delete from public.indisponibilidades_profissional;
delete from public.disponibilidades_profissional;

-- Descendentes clínicos, mantendo apenas o cenário reservado.
delete from public.concordancia_referencias
where solicitacao_id not in (select id from _manter_concordancias);

delete from public.solicitacoes_concordancia
where id not in (select id from _manter_concordancias);

delete from public.tentativas_individuais
where registro_medicao_id not in (select id from _manter_registros)
   or profissional_id not in (select id from _manter_profiles);

delete from public.integridade_procedimental
where sessao_id not in (select id from _manter_sessoes);

delete from public.observacoes_abc
where sessao_id not in (select id from _manter_sessoes)
   or alvo_id not in (select id from _manter_alvos)
   or profissional_id not in (select id from _manter_profiles);

delete from public.registros_medicao
where id not in (select id from _manter_registros);

delete from public.sessoes_clinicas
where id not in (select id from _manter_sessoes);

delete from public.sinteses_avaliacao_inicial
where paciente_id not in (select id from _manter_pacientes)
   or profissional_id not in (select id from _manter_profiles);

delete from public.registros_validade_social
where paciente_id not in (select id from _manter_pacientes)
   or profissional_id not in (select id from _manter_profiles);

delete from public.capacitacoes_aplicadores
where paciente_id not in (select id from _manter_pacientes)
   or profissional_id not in (select id from _manter_profiles);

delete from public.revisoes_clinicas_alvo
where id not in (select id from _manter_revisoes);

delete from public.planos_apoio_comportamental_alvo
where alvo_id not in (select id from _manter_alvos);

delete from public.protocolos_intervencao_alvo
where alvo_id not in (select id from _manter_alvos);

delete from public.historico_fases_alvo
where alvo_id not in (select id from _manter_alvos)
   or (revisao_clinica_id is not null
       and revisao_clinica_id not in (select id from _manter_revisoes));

delete from public.criterios_dominio_alvo
where alvo_id not in (select id from _manter_alvos);

delete from public.configuracoes_medicao_alvo
where alvo_id not in (select id from _manter_alvos);

delete from public.definicoes_operacionais_alvo
where alvo_id not in (select id from _manter_alvos);

delete from public.alvos_clinicos
where id not in (select id from _manter_alvos);

delete from public.objetivos_clinicos
where id not in (select id from _manter_objetivos);

delete from public.planos_clinicos
where id not in (select id from _manter_planos);

-- Acesso, vínculos e cadastros de pacientes.
delete from public.acessos_responsavel
where paciente_id not in (select id from _manter_pacientes)
   or criado_por not in (select id from _manter_profiles);

delete from public.solicitacoes_acesso;

delete from public.paciente_habilidades
where paciente_id not in (select id from _manter_pacientes)
   or profissional_id not in (select id from _manter_profiles);

delete from public.paciente_psicologos
where paciente_id not in (select id from _manter_pacientes)
   or psicologo_id not in (select id from _manter_profiles);

delete from public.pacientes
where id not in (select id from _manter_pacientes);

-- A auditoria operacional começa limpa. O cenário demo não depende dela.
delete from public.audit_logs;

-- Papéis e permissões são preservados. Referências históricas a usuários que
-- serão removidos passam para o administrador principal.
update public.papeis_acesso
set criado_por = (select id from public.profiles where admin_principal limit 1)
where criado_por is not null
  and criado_por not in (select id from _manter_profiles);

update public.papel_permissoes
set concedido_por = (select id from public.profiles where admin_principal limit 1)
where concedido_por not in (select id from _manter_profiles);

delete from public.perfil_papel_acesso
where profile_id not in (select id from _manter_profiles);

update public.perfil_papel_acesso
set atribuido_por = (select id from public.profiles where admin_principal limit 1)
where atribuido_por not in (select id from _manter_profiles);

set local session_replication_role = origin;

-- Com as FKs novamente ativas, o Auth remove identidades e sessões associadas.
delete from auth.users
where id not in (select id from _manter_profiles);

-- Salvaguarda para instalações onde profiles não possui ON DELETE CASCADE.
delete from public.profiles
where id not in (select id from _manter_profiles);

-- Validação final antes do commit.
do $$
begin
  if (select count(*) from public.profiles) <> 2 then
    raise exception 'A limpeza não terminou com administrador + demonstração. Transação cancelada.';
  end if;

  if exists (
    select 1 from public.pacientes
    where id not in (select id from _manter_pacientes)
  ) then
    raise exception 'Restaram pacientes fora do cenário demonstrativo. Transação cancelada.';
  end if;

  if exists (select 1 from public.agendamentos)
     or exists (select 1 from public.ocorrencias_frequencia) then
    raise exception 'Agenda ou frequência não foram totalmente limpas. Transação cancelada.';
  end if;
end
$$;

drop table if exists pg_temp._manter_concordancias;
drop table if exists pg_temp._manter_revisoes;
drop table if exists pg_temp._manter_registros;
drop table if exists pg_temp._manter_sessoes;
drop table if exists pg_temp._manter_alvos;
drop table if exists pg_temp._manter_objetivos;
drop table if exists pg_temp._manter_planos;
drop table if exists pg_temp._manter_pacientes;
drop table if exists pg_temp._manter_profiles;

commit;

select
  (select count(*) from public.profiles where admin_principal) as administradores_principais,
  (select count(*) from public.profiles where lower(email) = 'demo@registrosaba.local') as usuarios_demo,
  (select count(*) from public.pacientes) as pacientes_demo,
  (select count(*) from public.sessoes_clinicas) as sessoes_demo,
  (select count(*) from public.habilidades) as habilidades_preservadas,
  (select count(*) from public.niveis_avaliacao) as niveis_preservados,
  (select count(*) from public.profissoes) as profissoes_preservadas,
  (select count(*) from public.papeis_acesso) as papeis_preservados,
  (select count(*) from public.agendamentos) as agendamentos_restantes,
  (select count(*) from public.ocorrencias_frequencia) as ocorrencias_restantes;
