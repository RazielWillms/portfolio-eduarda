-- Ciclo 6: integridade procedimental por alvo medido na sessao.
create table if not exists public.integridade_procedimental (
  id uuid primary key default gen_random_uuid(),
  sessao_id uuid not null references public.sessoes_clinicas(id) on delete restrict,
  registro_medicao_id uuid not null references public.registros_medicao(id) on delete restrict,
  protocolo_intervencao_id uuid not null references public.protocolos_intervencao_alvo(id) on delete restrict,
  itens jsonb not null check (jsonb_typeof(itens)='object'),
  itens_previstos integer not null check (itens_previstos>0),
  itens_realizados integer not null check (itens_realizados>=0 and itens_realizados<=itens_previstos),
  desvios text,
  created_at timestamptz not null default now(),
  unique(registro_medicao_id),
  check (itens_realizados=itens_previstos or length(trim(desvios))>=3)
);
alter table public.integridade_procedimental enable row level security;
alter table public.integridade_procedimental force row level security;
drop policy if exists integridade_procedimental_select on public.integridade_procedimental;
create policy integridade_procedimental_select on public.integridade_procedimental for select to authenticated using (public.usuario_admin() or exists(select 1 from public.sessoes_clinicas s where s.id=sessao_id and s.profissional_id=auth.uid()));

create or replace function public.registrar_sessao_clinica_v3(p_paciente_id uuid,p_data date,p_contexto text,p_observacoes_privadas text,p_registros jsonb,p_ambiente_tipo text,p_aplicador_tipo text,p_integridade jsonb)
returns uuid language plpgsql security definer set search_path='pg_catalog','public' set row_security=off as $$
declare v_id uuid; v_item jsonb; v_registro public.registros_medicao%rowtype; v_previstos integer; v_realizados integer;
begin
  if jsonb_typeof(p_integridade)<>'array' then raise exception 'invalid_procedural_integrity' using errcode='22023'; end if;
  v_id := public.registrar_sessao_clinica_v2(p_paciente_id,p_data,p_contexto,p_observacoes_privadas,p_registros,p_ambiente_tipo,p_aplicador_tipo);
  for v_item in select value from jsonb_array_elements(p_integridade) loop
    select r.* into v_registro from public.registros_medicao r where r.sessao_id=v_id and r.alvo_id=(v_item->>'alvo_id')::uuid;
    if not found or v_registro.protocolo_intervencao_id is null or jsonb_typeof(v_item->'itens')<>'object' then raise exception 'invalid_procedural_integrity' using errcode='22023'; end if;
    v_previstos := 3;
    v_realizados := (case when (v_item->'itens'->>'hierarquia_ajuda')::boolean then 1 else 0 end)+(case when (v_item->'itens'->>'reforcamento')::boolean then 1 else 0 end)+(case when (v_item->'itens'->>'correcao_erro')::boolean then 1 else 0 end);
    insert into public.integridade_procedimental(sessao_id,registro_medicao_id,protocolo_intervencao_id,itens,itens_previstos,itens_realizados,desvios)
    values(v_id,v_registro.id,v_registro.protocolo_intervencao_id,v_item->'itens',v_previstos,v_realizados,nullif(trim(v_item->>'desvios'),''));
  end loop;
  if (select count(*) from public.registros_medicao where sessao_id=v_id)!=(select count(*) from public.integridade_procedimental where sessao_id=v_id) then raise exception 'missing_procedural_integrity' using errcode='22023'; end if;
  return v_id;
exception when invalid_text_representation then raise exception 'invalid_procedural_integrity' using errcode='22023';
end $$;
revoke execute on function public.registrar_sessao_clinica_v2(uuid,date,text,text,jsonb,text,text) from authenticated;
revoke all on function public.registrar_sessao_clinica_v3(uuid,date,text,text,jsonb,text,text,jsonb) from public;
grant execute on function public.registrar_sessao_clinica_v3(uuid,date,text,text,jsonb,text,text,jsonb) to authenticated;

create or replace function public.auditar_integridade_procedimental() returns trigger language plpgsql security definer set search_path='' as $$
begin insert into public.audit_logs(user_id,action,entity_type,entity_id,metadata) values(auth.uid(),'INTEGRIDADE_PROCEDIMENTAL_INSERT','integridade_procedimental',new.id,jsonb_build_object('sessao_id',new.sessao_id,'registro_medicao_id',new.registro_medicao_id,'itens_previstos',new.itens_previstos,'itens_realizados',new.itens_realizados)); return new; end $$;
drop trigger if exists audit_integridade_procedimental on public.integridade_procedimental;
create trigger audit_integridade_procedimental after insert on public.integridade_procedimental for each row execute function public.auditar_integridade_procedimental();
revoke all on function public.auditar_integridade_procedimental() from public;
notify pgrst,'reload schema';
