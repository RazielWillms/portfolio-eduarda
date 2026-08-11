-- O trigger atende tabelas heterogeneas. Campos exclusivos de uma tabela
-- precisam ser lidos do JSON, nao diretamente de OLD/NEW.
create or replace function public.registrar_auditoria_tabela()
returns trigger language plpgsql security definer set search_path = '' as $$
declare v_old jsonb; v_new jsonb; v_id uuid; v_action text; v_changed text[];
begin
  v_old := case when tg_op = 'INSERT' then null else public.sanitizar_auditoria(tg_table_name, to_jsonb(old)) end;
  v_new := case when tg_op = 'DELETE' then null else public.sanitizar_auditoria(tg_table_name, to_jsonb(new)) end;
  v_id := coalesce((v_new->>'id')::uuid,(v_old->>'id')::uuid,
    (v_new->>'paciente_id')::uuid,(v_old->>'paciente_id')::uuid);
  v_action := upper(tg_table_name || '_' || tg_op);
  if tg_table_name = 'atendimentos' and tg_op = 'UPDATE' then
    if v_old->>'deleted_at' is null and v_new->>'deleted_at' is not null then v_action := 'ATENDIMENTO_DELETED';
    elsif v_old->>'deleted_at' is not null and v_new->>'deleted_at' is null then v_action := 'ATENDIMENTO_RESTORED';
    else v_action := 'ATENDIMENTO_UPDATED'; end if;
  elsif tg_table_name = 'habilidades' and tg_op = 'UPDATE' then
    if v_old->>'status' = 'ativa' and v_new->>'status' = 'inativa' then v_action := 'HABILIDADE_DISABLED';
    elsif v_old->>'status' = 'inativa' and v_new->>'status' = 'ativa' then v_action := 'HABILIDADE_RESTORED';
    else v_action := 'HABILIDADE_UPDATED'; end if;
  elsif tg_table_name = 'acessos_responsavel' and tg_op = 'UPDATE'
    and v_old->>'revogado_em' is null and v_new->>'revogado_em' is not null then
    v_action := 'ACESSO_RESPONSAVEL_REVOKED';
  elsif tg_table_name = 'acessos_responsavel' and tg_op = 'UPDATE' then
    return new;
  end if;
  if tg_op = 'UPDATE' then
    select array_agg(key) into v_changed from jsonb_each(v_new) n
      where v_old -> n.key is distinct from n.value;
  end if;
  insert into public.audit_logs (user_id, action, entity_type, entity_id, metadata)
  values (auth.uid(), v_action, tg_table_name, v_id,
    jsonb_strip_nulls(jsonb_build_object('changed_fields', v_changed, 'before', v_old, 'after', v_new)));
  if tg_op = 'DELETE' then return old; end if;
  return new;
end
$$;

notify pgrst, 'reload schema';
