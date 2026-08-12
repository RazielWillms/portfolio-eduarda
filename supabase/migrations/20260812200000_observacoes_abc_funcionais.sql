-- Ciclo 7: observacoes ABC descritivas para avaliacao funcional.
create table if not exists public.observacoes_abc (
  id uuid primary key default gen_random_uuid(),
  sessao_id uuid not null references public.sessoes_clinicas(id) on delete restrict,
  alvo_id uuid not null references public.alvos_clinicos(id) on delete restrict,
  profissional_id uuid not null references public.profiles(id) on delete restrict,
  antecedente text not null check (length(trim(antecedente))>=3),
  comportamento_observado text not null check (length(trim(comportamento_observado))>=3),
  consequencia text not null check (length(trim(consequencia))>=3),
  funcao_hipotese text check (funcao_hipotese is null or funcao_hipotese in ('atencao','fuga_esquiva','acesso_tangivel','automatica','indeterminada')),
  intensidade numeric check (intensidade is null or intensidade between 0 and 10),
  duracao_segundos numeric check (duracao_segundos is null or duracao_segundos>=0),
  created_at timestamptz not null default now()
);
create index if not exists observacoes_abc_alvo_data_idx on public.observacoes_abc(alvo_id,created_at desc);
alter table public.observacoes_abc enable row level security;
alter table public.observacoes_abc force row level security;
drop policy if exists observacoes_abc_select on public.observacoes_abc;
create policy observacoes_abc_select on public.observacoes_abc for select to authenticated using (public.usuario_admin() or profissional_id=auth.uid());

create or replace function public.registrar_sessao_clinica_v4(p_paciente_id uuid,p_data date,p_contexto text,p_observacoes_privadas text,p_registros jsonb,p_ambiente_tipo text,p_aplicador_tipo text,p_integridade jsonb,p_observacoes_abc jsonb)
returns uuid language plpgsql security definer set search_path='pg_catalog','public' set row_security=off as $$
declare v_id uuid; v_item jsonb;
begin
  if jsonb_typeof(p_observacoes_abc)<>'array' then raise exception 'invalid_abc_observation' using errcode='22023'; end if;
  v_id := public.registrar_sessao_clinica_v3(p_paciente_id,p_data,p_contexto,p_observacoes_privadas,p_registros,p_ambiente_tipo,p_aplicador_tipo,p_integridade);
  for v_item in select value from jsonb_array_elements(p_observacoes_abc) loop
    if not exists(select 1 from public.registros_medicao r join public.alvos_clinicos a on a.id=r.alvo_id where r.sessao_id=v_id and a.id=(v_item->>'alvo_id')::uuid and a.natureza='reducao') then raise exception 'invalid_abc_target' using errcode='22023'; end if;
    insert into public.observacoes_abc(sessao_id,alvo_id,profissional_id,antecedente,comportamento_observado,consequencia,funcao_hipotese,intensidade,duracao_segundos)
    values(v_id,(v_item->>'alvo_id')::uuid,auth.uid(),trim(v_item->>'antecedente'),trim(v_item->>'comportamento_observado'),trim(v_item->>'consequencia'),nullif(v_item->>'funcao_hipotese',''),nullif(v_item->>'intensidade','')::numeric,nullif(v_item->>'duracao_segundos','')::numeric);
  end loop;
  return v_id;
exception when invalid_text_representation or check_violation then raise exception 'invalid_abc_observation' using errcode='22023';
end $$;
revoke execute on function public.registrar_sessao_clinica_v3(uuid,date,text,text,jsonb,text,text,jsonb) from authenticated;
revoke all on function public.registrar_sessao_clinica_v4(uuid,date,text,text,jsonb,text,text,jsonb,jsonb) from public;
grant execute on function public.registrar_sessao_clinica_v4(uuid,date,text,text,jsonb,text,text,jsonb,jsonb) to authenticated;

create or replace function public.auditar_observacao_abc() returns trigger language plpgsql security definer set search_path='' as $$
begin insert into public.audit_logs(user_id,action,entity_type,entity_id,metadata) values(auth.uid(),'OBSERVACAO_ABC_INSERT','observacoes_abc',new.id,jsonb_build_object('sessao_id',new.sessao_id,'alvo_id',new.alvo_id,'profissional_id',new.profissional_id,'funcao_hipotese',new.funcao_hipotese)); return new; end $$;
drop trigger if exists audit_observacoes_abc on public.observacoes_abc;
create trigger audit_observacoes_abc after insert on public.observacoes_abc for each row execute function public.auditar_observacao_abc();
revoke all on function public.auditar_observacao_abc() from public;
notify pgrst,'reload schema';
