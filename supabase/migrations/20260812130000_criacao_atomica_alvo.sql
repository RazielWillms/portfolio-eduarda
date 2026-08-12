-- Cria alvo, primeira definicao operacional e primeira configuracao de medida
-- na mesma transacao, evitando alvos clinicamente incompletos.
create or replace function public.criar_alvo_clinico_com_configuracao(
  p_objetivo_id uuid,
  p_nome text,
  p_categoria text,
  p_natureza text,
  p_descricao_observavel text,
  p_resposta_esperada text,
  p_tipo_medicao text,
  p_unidade text,
  p_parametros jsonb default '{}'::jsonb
)
returns uuid language plpgsql security definer
set search_path='pg_catalog','public' set row_security=off as $$
declare v_plano_id uuid; v_alvo_id uuid;
begin
  select o.plano_id into v_plano_id from public.objetivos_clinicos o where o.id=p_objetivo_id;
  if v_plano_id is null or not public.usuario_dono_plano(v_plano_id) then
    raise exception 'unauthorized' using errcode='42501';
  end if;
  if length(trim(coalesce(p_nome,'')))<2 or length(trim(coalesce(p_descricao_observavel,'')))<10 then
    raise exception 'invalid_target_definition' using errcode='22023';
  end if;
  if p_natureza not in ('aquisicao','reducao') or p_tipo_medicao not in (
    'frequencia','taxa','duracao','latencia','percentual_oportunidades',
    'tentativas_discretas','intervalo_parcial','intervalo_total',
    'amostragem_momentanea','escala_independencia','intensidade') then
    raise exception 'invalid_target_configuration' using errcode='22023';
  end if;
  insert into public.alvos_clinicos(objetivo_id,profissional_id,nome,categoria,natureza)
  values(p_objetivo_id,auth.uid(),trim(p_nome),nullif(trim(p_categoria),''),p_natureza)
  returning id into v_alvo_id;
  insert into public.definicoes_operacionais_alvo
    (alvo_id,versao,descricao_observavel,resposta_esperada,criado_por)
  values(v_alvo_id,1,trim(p_descricao_observavel),nullif(trim(p_resposta_esperada),''),auth.uid());
  insert into public.configuracoes_medicao_alvo
    (alvo_id,versao,tipo,unidade,parametros,criado_por)
  values(v_alvo_id,1,p_tipo_medicao,trim(p_unidade),coalesce(p_parametros,'{}'::jsonb),auth.uid());
  return v_alvo_id;
end $$;

revoke all on function public.criar_alvo_clinico_com_configuracao(uuid,text,text,text,text,text,text,text,jsonb) from public;
grant execute on function public.criar_alvo_clinico_com_configuracao(uuid,text,text,text,text,text,text,text,jsonb) to authenticated;
notify pgrst,'reload schema';
