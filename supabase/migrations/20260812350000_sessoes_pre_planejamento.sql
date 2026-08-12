-- Sessões podem anteceder o planejamento. A finalidade define quando alvos,
-- protocolo e integridade são obrigatórios.

alter table public.sessoes_clinicas add column if not exists finalidade text not null default 'intervencao';
alter table public.sessoes_clinicas drop constraint if exists sessoes_clinicas_finalidade_check;
alter table public.sessoes_clinicas add constraint sessoes_clinicas_finalidade_check check (finalidade in (
  'vinculo_acolhimento','entrevista_responsaveis','avaliacao_inicial','observacao_clinica',
  'linha_de_base','intervencao','generalizacao','manutencao','orientacao_equipe'
));

-- Na linha de base ainda pode não existir protocolo. A integridade do protocolo
-- é exigida somente para registros que possuem protocolo vigente.
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
  if (select count(*) from public.registros_medicao where sessao_id=v_id and protocolo_intervencao_id is not null)!=(select count(*) from public.integridade_procedimental where sessao_id=v_id) then raise exception 'missing_procedural_integrity' using errcode='22023'; end if;
  return v_id;
exception when invalid_text_representation then raise exception 'invalid_procedural_integrity' using errcode='22023';
end $$;

create or replace function public.registrar_sessao_clinica_v5(
  p_paciente_id uuid,p_data date,p_contexto text,p_observacoes_privadas text,
  p_registros jsonb,p_ambiente_tipo text,p_aplicador_tipo text,p_integridade jsonb,
  p_observacoes_abc jsonb,p_finalidade text
)
returns uuid language plpgsql security definer set search_path='pg_catalog','public' set row_security=off as $$
declare v_id uuid;
begin
  if p_finalidade not in ('vinculo_acolhimento','entrevista_responsaveis','avaliacao_inicial','observacao_clinica','linha_de_base','intervencao','generalizacao','manutencao','orientacao_equipe') then raise exception 'invalid_session_purpose' using errcode='22023'; end if;

  if p_finalidade in ('vinculo_acolhimento','entrevista_responsaveis','avaliacao_inicial','observacao_clinica','orientacao_equipe')
     and jsonb_array_length(coalesce(p_registros,'[]'::jsonb))=0 then
    if auth.uid() is null or not public.usuario_ativo() or not public.usuario_vinculado(p_paciente_id)
       or p_data is null or p_ambiente_tipo not in ('clinica','casa','escola','comunidade','teleatendimento','outro')
       or p_aplicador_tipo not in ('profissional','cuidador','educador','outro') then
      raise exception 'invalid_or_unauthorized_session' using errcode='42501';
    end if;
    insert into public.sessoes_clinicas(paciente_id,profissional_id,data,contexto,observacoes_privadas,status,ambiente_tipo,aplicador_tipo,finalidade)
    values(p_paciente_id,auth.uid(),p_data,nullif(trim(p_contexto),''),nullif(trim(p_observacoes_privadas),''),'finalizada',p_ambiente_tipo,p_aplicador_tipo,p_finalidade)
    returning id into v_id;
    return v_id;
  end if;

  if jsonb_array_length(coalesce(p_registros,'[]'::jsonb))=0 then raise exception 'session_requires_target' using errcode='22023'; end if;
  v_id := public.registrar_sessao_clinica_v4(p_paciente_id,p_data,p_contexto,p_observacoes_privadas,p_registros,p_ambiente_tipo,p_aplicador_tipo,p_integridade,p_observacoes_abc);
  update public.sessoes_clinicas set finalidade=p_finalidade where id=v_id;
  return v_id;
end $$;

revoke execute on function public.registrar_sessao_clinica_v4(uuid,date,text,text,jsonb,text,text,jsonb,jsonb) from authenticated;
revoke all on function public.registrar_sessao_clinica_v5(uuid,date,text,text,jsonb,text,text,jsonb,jsonb,text) from public;
grant execute on function public.registrar_sessao_clinica_v5(uuid,date,text,text,jsonb,text,text,jsonb,jsonb,text) to authenticated;
notify pgrst,'reload schema';

