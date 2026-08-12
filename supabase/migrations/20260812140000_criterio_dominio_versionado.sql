-- Cria uma nova versao de criterio sob lock transacional. Versoes anteriores
-- permanecem imutaveis e explicam as decisoes historicas.
create or replace function public.criar_criterio_dominio_alvo(
  p_alvo_id uuid,
  p_direcao text,
  p_valor_alvo numeric,
  p_sessoes_consecutivas integer,
  p_oportunidades_minimas integer default null,
  p_ambientes_minimos integer default 1,
  p_aplicadores_minimos integer default 1,
  p_dias_manutencao integer default null,
  p_configuracao jsonb default '{}'::jsonb
)
returns integer language plpgsql security definer
set search_path='pg_catalog','public' set row_security=off as $$
declare v_versao integer;
begin
  if not public.usuario_pode_editar_alvo(p_alvo_id) then
    raise exception 'unauthorized' using errcode='42501';
  end if;
  if p_direcao not in ('aumentar','reduzir') or p_valor_alvo is null
     or p_sessoes_consecutivas<1 or p_ambientes_minimos<1 or p_aplicadores_minimos<1
     or (p_oportunidades_minimas is not null and p_oportunidades_minimas<1)
     or (p_dias_manutencao is not null and p_dias_manutencao<0)
     or jsonb_typeof(coalesce(p_configuracao,'{}'::jsonb))<>'object' then
    raise exception 'invalid_mastery_criterion' using errcode='22023';
  end if;
  perform pg_advisory_xact_lock(hashtextextended(p_alvo_id::text,0));
  select coalesce(max(versao),0)+1 into v_versao
  from public.criterios_dominio_alvo where alvo_id=p_alvo_id;
  insert into public.criterios_dominio_alvo(
    alvo_id,versao,direcao,valor_alvo,sessoes_consecutivas,oportunidades_minimas,
    ambientes_minimos,aplicadores_minimos,dias_manutencao,configuracao,criado_por
  ) values(
    p_alvo_id,v_versao,p_direcao,p_valor_alvo,p_sessoes_consecutivas,p_oportunidades_minimas,
    p_ambientes_minimos,p_aplicadores_minimos,p_dias_manutencao,coalesce(p_configuracao,'{}'::jsonb),auth.uid()
  );
  return v_versao;
end $$;

revoke all on function public.criar_criterio_dominio_alvo(uuid,text,numeric,integer,integer,integer,integer,integer,jsonb) from public;
grant execute on function public.criar_criterio_dominio_alvo(uuid,text,numeric,integer,integer,integer,integer,integer,jsonb) to authenticated;
notify pgrst,'reload schema';
