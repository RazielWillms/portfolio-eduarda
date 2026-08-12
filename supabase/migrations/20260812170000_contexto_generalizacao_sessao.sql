-- Ciclo 4: evidencias estruturadas e minimizadas de generalizacao/manutencao.
alter table public.sessoes_clinicas add column if not exists ambiente_tipo text;
alter table public.sessoes_clinicas add column if not exists aplicador_tipo text;
alter table public.sessoes_clinicas drop constraint if exists sessoes_clinicas_ambiente_tipo_check;
alter table public.sessoes_clinicas add constraint sessoes_clinicas_ambiente_tipo_check check (ambiente_tipo is null or ambiente_tipo in ('clinica','casa','escola','comunidade','teleatendimento','outro'));
alter table public.sessoes_clinicas drop constraint if exists sessoes_clinicas_aplicador_tipo_check;
alter table public.sessoes_clinicas add constraint sessoes_clinicas_aplicador_tipo_check check (aplicador_tipo is null or aplicador_tipo in ('profissional','cuidador','educador','outro'));

create or replace function public.registrar_sessao_clinica_v2(p_paciente_id uuid,p_data date,p_contexto text,p_observacoes_privadas text,p_registros jsonb,p_ambiente_tipo text,p_aplicador_tipo text)
returns uuid language plpgsql security definer set search_path='pg_catalog','public' set row_security=off as $$
declare v_id uuid;
begin
  if p_ambiente_tipo not in ('clinica','casa','escola','comunidade','teleatendimento','outro') or p_aplicador_tipo not in ('profissional','cuidador','educador','outro') then raise exception 'invalid_session_context' using errcode='22023'; end if;
  v_id := public.registrar_sessao_clinica(p_paciente_id,p_data,p_contexto,p_observacoes_privadas,p_registros);
  update public.sessoes_clinicas set ambiente_tipo=p_ambiente_tipo,aplicador_tipo=p_aplicador_tipo where id=v_id;
  return v_id;
end $$;
revoke execute on function public.registrar_sessao_clinica(uuid,date,text,text,jsonb) from authenticated;
revoke all on function public.registrar_sessao_clinica_v2(uuid,date,text,text,jsonb,text,text) from public;
grant execute on function public.registrar_sessao_clinica_v2(uuid,date,text,text,jsonb,text,text) to authenticated;
notify pgrst,'reload schema';
