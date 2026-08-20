-- Migra módulos administrativos para capacidades granulares.

create or replace function public.substituir_guarda_funcoes(p_funcoes text[],p_antiga text,p_nova text)
returns void language plpgsql security definer set search_path='' as $$
declare v_nome text;v_def text;v_quantidade integer;
begin
  foreach v_nome in array p_funcoes loop
    select pg_catalog.pg_get_functiondef(p.oid) into v_def
    from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid=p.pronamespace
    where n.nspname='public'and p.proname=v_nome order by p.oid desc limit 1;
    if v_def is null then continue;end if;
    v_def:=replace(v_def,p_antiga,p_nova);
    execute v_def;
  end loop;
end$$;

-- Agenda: leitura da equipe e gestão são capacidades independentes.
select public.substituir_guarda_funcoes(
  array['listar_agendamentos'],
  'public.usuario_coordenacao()',
  'public.usuario_tem_permissao(''agenda.visualizar_equipe'')'
);
select public.substituir_guarda_funcoes(
  array['listar_opcoes_agendamento','criar_agendamento','editar_agendamento','reagendar_agendamento','cancelar_agendamento','atualizar_status_agendamento','criar_serie_agendamentos'],
  'public.usuario_coordenacao()',
  'public.usuario_tem_permissao(''agenda.gerenciar'')'
);
select public.substituir_guarda_funcoes(
  array['consultar_disponibilidade_agenda'],
  'public.usuario_coordenacao()',
  'public.usuario_tem_permissao(''agenda.gerenciar'')'
);
select public.substituir_guarda_funcoes(
  array['salvar_disponibilidade','salvar_indisponibilidade'],
  'public.usuario_coordenacao()',
  'public.usuario_tem_permissao(''disponibilidade.gerenciar'')'
);

-- Frequência: consulta consolidada não concede escrita administrativa.
select public.substituir_guarda_funcoes(
  array['opcoes_frequencia','relatorio_frequencia'],
  'public.usuario_coordenacao()',
  'public.usuario_tem_permissao(''frequencia.visualizar_equipe'')'
);
select public.substituir_guarda_funcoes(
  array['registrar_ocorrencia_frequencia','cancelar_ocorrencia_frequencia'],
  'public.usuario_coordenacao()',
  'public.usuario_tem_permissao(''frequencia.gerenciar'')'
);

-- Administração de usuários deixa de depender do nome do papel.
select public.substituir_guarda_funcoes(
  array['atualizar_profile_admin','usuario_pode_ver_profile'],
  'public.usuario_admin()',
  'public.usuario_tem_permissao(''usuarios.editar'')'
);

drop policy if exists agendamentos_select on public.agendamentos;
create policy agendamentos_select on public.agendamentos for select to authenticated
using(public.usuario_tem_permissao('agenda.visualizar_equipe')or(profissional_id=auth.uid()and public.usuario_tem_permissao('agenda.visualizar_propria')));

drop policy if exists agendamentos_historico_select on public.agendamentos_historico;
create policy agendamentos_historico_select on public.agendamentos_historico for select to authenticated
using(public.usuario_tem_permissao('agenda.visualizar_equipe')or exists(select 1 from public.agendamentos a where a.id=agendamento_id and a.profissional_id=auth.uid()));

drop policy if exists disponibilidades_select on public.disponibilidades_profissional;
create policy disponibilidades_select on public.disponibilidades_profissional for select to authenticated
using(public.usuario_tem_permissao('disponibilidade.gerenciar'));
drop policy if exists indisponibilidades_select on public.indisponibilidades_profissional;
create policy indisponibilidades_select on public.indisponibilidades_profissional for select to authenticated
using(public.usuario_tem_permissao('disponibilidade.gerenciar'));
drop policy if exists series_agendamentos_select on public.series_agendamentos;
create policy series_agendamentos_select on public.series_agendamentos for select to authenticated
using(public.usuario_tem_permissao('agenda.visualizar_equipe')or profissional_id=auth.uid());

drop policy if exists ocorrencias_frequencia_select on public.ocorrencias_frequencia;
create policy ocorrencias_frequencia_select on public.ocorrencias_frequencia for select to authenticated
using(public.usuario_tem_permissao('frequencia.visualizar_equipe')or(profissional_id=auth.uid()and public.usuario_ativo()));

-- A função de manutenção é transitória e não fica exposta após aplicar a migration.
drop function public.substituir_guarda_funcoes(text[],text,text);
notify pgrst,'reload schema';
