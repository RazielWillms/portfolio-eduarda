-- Autorização clínica: capacidade + vínculo + autoria, conforme a natureza do dado.

insert into public.permissoes_sistema(chave,modulo,nome,descricao,sensivel)values
 ('clinico.visualizar_todos','clinico','Visualizar dados clínicos globalmente','Exceção administrativa explícita que preserva a compatibilidade do administrador.',true)
on conflict(chave)do update set modulo=excluded.modulo,nome=excluded.nome,descricao=excluded.descricao,sensivel=excluded.sensivel;
insert into public.papel_permissoes(papel_id,permissao_chave,concedido_por)
select pa.id,'clinico.visualizar_todos',p.id from public.papeis_acesso pa cross join lateral(select id from public.profiles where admin_principal and status='ativo'limit 1)p
where pa.slug='administrador'on conflict do nothing;

-- Planejamento é visível à equipe vinculada, mas somente autores planejam/escrevem.
drop policy if exists planos_select on public.planos_clinicos;
create policy planos_select on public.planos_clinicos for select to authenticated using(
 public.usuario_tem_permissao('clinico.visualizar_todos')or(public.usuario_tem_permissao('clinico.visualizar')and public.usuario_vinculado(paciente_id))
);
drop policy if exists planos_insert on public.planos_clinicos;
create policy planos_insert on public.planos_clinicos for insert to authenticated with check(
 public.usuario_tem_permissao('clinico.planejar')and profissional_responsavel_id=auth.uid()and public.usuario_ativo()and public.usuario_vinculado(paciente_id)
);
drop policy if exists planos_update on public.planos_clinicos;
create policy planos_update on public.planos_clinicos for update to authenticated
 using(public.usuario_tem_permissao('clinico.planejar')and profissional_responsavel_id=auth.uid()and public.usuario_ativo())
 with check(public.usuario_tem_permissao('clinico.planejar')and profissional_responsavel_id=auth.uid()and public.usuario_vinculado(paciente_id));

drop policy if exists objetivos_insert on public.objetivos_clinicos;
create policy objetivos_insert on public.objetivos_clinicos for insert to authenticated with check(public.usuario_tem_permissao('clinico.planejar')and public.usuario_dono_plano(plano_id));
drop policy if exists objetivos_update on public.objetivos_clinicos;
create policy objetivos_update on public.objetivos_clinicos for update to authenticated using(public.usuario_tem_permissao('clinico.planejar')and public.usuario_dono_plano(plano_id))with check(public.usuario_tem_permissao('clinico.planejar')and public.usuario_dono_plano(plano_id));
drop policy if exists alvos_insert on public.alvos_clinicos;
create policy alvos_insert on public.alvos_clinicos for insert to authenticated with check(public.usuario_tem_permissao('clinico.planejar')and profissional_id=auth.uid()and exists(select 1 from public.objetivos_clinicos o where o.id=objetivo_id and public.usuario_dono_plano(o.plano_id)));
drop policy if exists alvos_update on public.alvos_clinicos;
create policy alvos_update on public.alvos_clinicos for update to authenticated using(public.usuario_tem_permissao('clinico.planejar')and public.usuario_pode_editar_alvo(id))with check(public.usuario_tem_permissao('clinico.planejar')and profissional_id=auth.uid());

-- Sessão, medição e observações privadas continuam limitadas ao autor; a exceção
-- global existe somente porque administradores já possuíam essa regra explícita.
drop policy if exists sessoes_clinicas_select on public.sessoes_clinicas;
create policy sessoes_clinicas_select on public.sessoes_clinicas for select to authenticated using(
 (profissional_id=auth.uid()and public.usuario_tem_permissao('clinico.visualizar'))or public.usuario_tem_permissao('clinico.visualizar_todos')
);
drop policy if exists registros_medicao_select on public.registros_medicao;
create policy registros_medicao_select on public.registros_medicao for select to authenticated using(
 public.usuario_tem_permissao('clinico.visualizar_todos')or exists(select 1 from public.sessoes_clinicas s where s.id=sessao_id and s.profissional_id=auth.uid()and public.usuario_tem_permissao('clinico.visualizar'))
);

drop policy if exists observacoes_abc_select on public.observacoes_abc;
create policy observacoes_abc_select on public.observacoes_abc for select to authenticated using(profissional_id=auth.uid()or public.usuario_tem_permissao('clinico.visualizar_todos'));
drop policy if exists integridade_procedimental_select on public.integridade_procedimental;
create policy integridade_procedimental_select on public.integridade_procedimental for select to authenticated using(public.usuario_tem_permissao('clinico.visualizar_todos')or exists(select 1 from public.sessoes_clinicas s where s.id=sessao_id and s.profissional_id=auth.uid()));
drop policy if exists protocolos_intervencao_select on public.protocolos_intervencao_alvo;
create policy protocolos_intervencao_select on public.protocolos_intervencao_alvo for select to authenticated using(public.usuario_tem_permissao('clinico.visualizar_todos')or exists(select 1 from public.alvos_clinicos a where a.id=alvo_id and a.profissional_id=auth.uid()));
drop policy if exists planos_apoio_comportamental_select on public.planos_apoio_comportamental_alvo;
create policy planos_apoio_comportamental_select on public.planos_apoio_comportamental_alvo for select to authenticated using(public.usuario_tem_permissao('clinico.visualizar_todos')or exists(select 1 from public.alvos_clinicos a where a.id=alvo_id and a.profissional_id=auth.uid()));
drop policy if exists revisoes_clinicas_select on public.revisoes_clinicas_alvo;
create policy revisoes_clinicas_select on public.revisoes_clinicas_alvo for select to authenticated using(profissional_id=auth.uid()or public.usuario_tem_permissao('clinico.visualizar_todos'));
drop policy if exists validade_social_select on public.registros_validade_social;
create policy validade_social_select on public.registros_validade_social for select to authenticated using(profissional_id=auth.uid()or public.usuario_tem_permissao('clinico.visualizar_todos'));
drop policy if exists capacitacoes_aplicadores_select on public.capacitacoes_aplicadores;
create policy capacitacoes_aplicadores_select on public.capacitacoes_aplicadores for select to authenticated using(profissional_id=auth.uid()or public.usuario_tem_permissao('clinico.visualizar_todos'));
drop policy if exists concordancia_participantes_select on public.solicitacoes_concordancia;
create policy concordancia_participantes_select on public.solicitacoes_concordancia for select to authenticated using(auth.uid()in(solicitante_id,observador_id)or public.usuario_tem_permissao('clinico.visualizar_todos'));

-- A entrada pública vigente recebe a capacidade de registrar além do vínculo.
do $$declare v_def text;begin
 select pg_get_functiondef(p.oid)into v_def from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public'and p.proname='registrar_sessao_clinica_v7'limit 1;
 if v_def is not null and position('sessoes.registrar' in v_def)=0 then
  v_def:=regexp_replace(v_def,'\mbegin\M','begin if not public.usuario_tem_permissao(''sessoes.registrar'')then raise exception''unauthorized''using errcode=''42501'';end if;','i');
  execute v_def;
 end if;
end$$;

-- Versões anteriores permanecem utilizáveis internamente pela cadeia security definer,
-- mas deixam de ser pontos de entrada para authenticated.
revoke execute on function public.registrar_sessao_clinica_v6(uuid,date,text,text,jsonb,text,text,jsonb,jsonb,text,jsonb)from authenticated;

notify pgrst,'reload schema';
