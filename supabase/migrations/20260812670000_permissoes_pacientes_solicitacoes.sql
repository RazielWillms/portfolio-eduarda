-- Permissões de pacientes sempre combinadas com vínculo ou exceção global explícita.

insert into public.permissoes_sistema(chave,modulo,nome,descricao,sensivel)values
 ('pacientes.visualizar_todos','pacientes','Visualizar todos os cadastros','Exceção administrativa para consultar cadastros de pacientes sem vínculo.',true),
 ('acessos.aprovar_global','acessos','Aprovar acessos globalmente','Decidir solicitações sem vínculo prévio com o paciente.',true)
on conflict(chave)do update set modulo=excluded.modulo,nome=excluded.nome,descricao=excluded.descricao,sensivel=excluded.sensivel;

insert into public.papel_permissoes(papel_id,permissao_chave,concedido_por)
select pa.id,p.chave,principal.id from public.papeis_acesso pa
cross join(values('pacientes.visualizar_todos'),('acessos.aprovar_global'))p(chave)
cross join lateral(select id from public.profiles where admin_principal and status='ativo'limit 1)principal
where pa.slug='administrador'
on conflict do nothing;

create or replace function public.solicitar_acesso_paciente(p_paciente_id uuid,p_mensagem text default null,p_papel_no_caso text default null)
returns uuid language plpgsql security definer set search_path=''as $$declare v_id uuid;begin
 if auth.uid()is null or not public.usuario_ativo()or not public.usuario_tem_permissao('acessos.solicitar')then raise exception'unauthorized'using errcode='42501';end if;
 if public.usuario_vinculado(p_paciente_id)then raise exception'already_linked'using errcode='23505';end if;
 if not exists(select 1 from public.pacientes where id=p_paciente_id and status='ativo')then raise exception'patient_not_found'using errcode='P0002';end if;
 insert into public.solicitacoes_acesso(paciente_id,solicitante_id,mensagem,papel_no_caso)
 values(p_paciente_id,auth.uid(),nullif(trim(p_mensagem),''),nullif(trim(p_papel_no_caso),''))
 on conflict(paciente_id,solicitante_id)where status='pendente'do update set mensagem=excluded.mensagem,papel_no_caso=excluded.papel_no_caso
 returning id into v_id;return v_id;end$$;

create or replace function public.decidir_solicitacao_acesso(p_solicitacao_id uuid,p_aprovar boolean)
returns void language plpgsql security definer set search_path=''as $$declare v_s public.solicitacoes_acesso%rowtype;begin
 select*into v_s from public.solicitacoes_acesso where id=p_solicitacao_id for update;
 if not found or v_s.status<>'pendente'then raise exception'request_not_pending'using errcode='22023';end if;
 if not public.usuario_tem_permissao('acessos.aprovar')or not(public.usuario_vinculado(v_s.paciente_id)or public.usuario_tem_permissao('acessos.aprovar_global'))then raise exception'unauthorized'using errcode='42501';end if;
 if p_aprovar then insert into public.paciente_psicologos(paciente_id,psicologo_id)values(v_s.paciente_id,v_s.solicitante_id)on conflict do nothing;end if;
 update public.solicitacoes_acesso set status=case when p_aprovar then'aprovado'else'negado'end,resolvido_por=auth.uid(),resolvido_em=now()where id=p_solicitacao_id;
 insert into public.audit_logs(user_id,action,entity_type,entity_id,metadata)values(auth.uid(),case when p_aprovar then'ACESSO_APROVADO'else'ACESSO_NEGADO'end,'solicitacoes_acesso',v_s.id,jsonb_build_object('paciente_id',v_s.paciente_id,'solicitante_id',v_s.solicitante_id));
end$$;

-- Reinstala os atalhos para que apontem para a decisão atualizada.
create or replace function public.aprovar_solicitacao_acesso(p_solicitacao_id uuid)returns void language sql security definer set search_path=''as $$select public.decidir_solicitacao_acesso(p_solicitacao_id,true)$$;
create or replace function public.negar_solicitacao_acesso(p_solicitacao_id uuid)returns void language sql security definer set search_path=''as $$select public.decidir_solicitacao_acesso(p_solicitacao_id,false)$$;

-- As funções extensas de cadastro/duplicidade permanecem iguais, recebendo apenas guardas granulares.
do $$declare v_nome text;v_def text;begin
 foreach v_nome in array array['buscar_possiveis_duplicatas_paciente','criar_paciente_com_vinculo']loop
  select pg_get_functiondef(p.oid)into v_def from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public'and p.proname=v_nome order by p.oid desc limit 1;
  if v_def is not null and position('pacientes.cadastrar' in v_def)=0 then
   v_def:=replace(v_def,'not public.usuario_ativo()','not public.usuario_ativo() or not public.usuario_tem_permissao(''pacientes.cadastrar'')');execute v_def;
  end if;
 end loop;
 select pg_get_functiondef(p.oid)into v_def from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public'and p.proname='cadastrar_paciente_administrativo'order by p.oid desc limit 1;
 if v_def is not null and position('pacientes.cadastrar_administrativo' in v_def)=0 then v_def:=replace(v_def,'public.usuario_coordenacao()','public.usuario_tem_permissao(''pacientes.cadastrar_administrativo'')');execute v_def;end if;
end$$;

drop policy if exists pacientes_select on public.pacientes;
create policy pacientes_select on public.pacientes for select to authenticated using(
 public.usuario_vinculado(id)or public.usuario_tem_permissao('pacientes.visualizar_todos')
);
drop policy if exists pacientes_update on public.pacientes;
create policy pacientes_update on public.pacientes for update to authenticated
 using(public.usuario_tem_permissao('pacientes.editar_cadastro')and(public.usuario_vinculado(id)or public.usuario_tem_permissao('pacientes.visualizar_todos')))
 with check(public.usuario_tem_permissao('pacientes.editar_cadastro')and(public.usuario_vinculado(id)or public.usuario_tem_permissao('pacientes.visualizar_todos')));
drop policy if exists vinculos_select on public.paciente_psicologos;
create policy vinculos_select on public.paciente_psicologos for select to authenticated using(
 psicologo_id=auth.uid()or public.usuario_vinculado(paciente_id)or public.usuario_tem_permissao('pacientes.visualizar_todos')
);
drop policy if exists solicitacoes_select on public.solicitacoes_acesso;
create policy solicitacoes_select on public.solicitacoes_acesso for select to authenticated using(
 solicitante_id=auth.uid()or public.usuario_vinculado(paciente_id)or public.usuario_tem_permissao('acessos.aprovar_global')
);

revoke all on function public.solicitar_acesso_paciente(uuid,text,text)from public;
revoke all on function public.decidir_solicitacao_acesso(uuid,boolean)from public;
grant execute on function public.solicitar_acesso_paciente(uuid,text,text)to authenticated;
grant execute on function public.aprovar_solicitacao_acesso(uuid)to authenticated;
grant execute on function public.negar_solicitacao_acesso(uuid)to authenticated;
notify pgrst,'reload schema';
