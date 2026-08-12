-- ExposiÃ§Ã£o controlada do cenÃ¡rio fictÃ­cio para o modo de demonstraÃ§Ã£o.
-- NÃ£o hÃ¡ impersonaÃ§Ã£o: a funÃ§Ã£o retorna somente o dataset identificado pelo
-- e-mail reservado da demonstraÃ§Ã£o e nÃ£o oferece qualquer operaÃ§Ã£o de escrita.
create or replace function public.obter_cenario_demonstracao()
returns jsonb
language plpgsql
stable
security definer
set search_path='pg_catalog','public'
set row_security=off
as $$
declare
  v_demo_id uuid;
  v_paciente_id uuid;
  v_resultado jsonb;
begin
  if auth.uid() is null or not public.usuario_ativo() then
    raise exception 'unauthorized' using errcode='42501';
  end if;

  select id into v_demo_id
  from public.profiles
  where lower(email)='demo@registrosaba.local'
    and papel='profissional' and status='ativo'
  limit 1;

  if v_demo_id is null then return null; end if;

  select p.id into v_paciente_id
  from public.pacientes p
  join public.paciente_psicologos pp
    on pp.paciente_id=p.id and pp.psicologo_id=v_demo_id
  where p.nome_completo like '%DemonstraÃ§Ã£o%'
  order by p.created_at desc
  limit 1;

  if v_paciente_id is null then return null; end if;

  select jsonb_build_object(
    'profissional',jsonb_build_object('nome',pr.nome,'email',pr.email),
    'paciente',jsonb_build_object(
      'id',p.id,
      'nome',p.nome_completo,
      'data_nascimento',p.data_nascimento,
      'diagnostico',p.diagnostico
    ),
    'planos',coalesce((
      select jsonb_agg(jsonb_build_object(
        'id',pc.id,'titulo',pc.titulo,'justificativa',pc.justificativa,
        'status',pc.status,'iniciado_em',pc.iniciado_em,'revisar_em',pc.revisar_em,
        'objetivos',coalesce((
          select jsonb_agg(jsonb_build_object(
            'id',o.id,'descricao',o.descricao,'horizonte',o.horizonte,
            'alvos',coalesce((
              select jsonb_agg(jsonb_build_object(
                'id',a.id,'nome',a.nome,'categoria',a.categoria,
                'natureza',a.natureza,'fase',a.fase,
                'definicao',(select d.descricao_observavel from public.definicoes_operacionais_alvo d where d.alvo_id=a.id order by d.versao desc limit 1),
                'medicao',(select jsonb_build_object('tipo',m.tipo,'unidade',m.unidade) from public.configuracoes_medicao_alvo m where m.alvo_id=a.id order by m.versao desc limit 1),
                'criterio',(select jsonb_build_object('direcao',c.direcao,'valor_alvo',c.valor_alvo,'sessoes_consecutivas',c.sessoes_consecutivas,'ambientes_minimos',c.ambientes_minimos,'aplicadores_minimos',c.aplicadores_minimos) from public.criterios_dominio_alvo c where c.alvo_id=a.id order by c.versao desc limit 1),
                'protocolo',(select jsonb_build_object('estrategia',pi.estrategia_ensino,'hierarquia_ajuda',pi.hierarquia_ajuda,'esvanecimento',pi.procedimento_esvanecimento,'reforcadores',pi.reforcadores,'correcao_erro',pi.correcao_erro) from public.protocolos_intervencao_alvo pi where pi.alvo_id=a.id order by pi.versao desc limit 1)
              ) order by a.created_at)
              from public.alvos_clinicos a where a.objetivo_id=o.id
            ),'[]'::jsonb)
          ) order by o.ordem)
          from public.objetivos_clinicos o where o.plano_id=pc.id
        ),'[]'::jsonb)
      ) order by pc.created_at)
      from public.planos_clinicos pc
      where pc.paciente_id=v_paciente_id and pc.profissional_responsavel_id=v_demo_id
    ),'[]'::jsonb),
    'sessoes',coalesce((
      select jsonb_agg(jsonb_build_object(
        'id',s.id,'data',s.data,'contexto',s.contexto,
        'ambiente_tipo',s.ambiente_tipo,'aplicador_tipo',s.aplicador_tipo,
        'registros',coalesce((
          select jsonb_agg(jsonb_build_object(
            'id',r.id,'alvo_id',r.alvo_id,'alvo_nome',a.nome,
            'tipo_medicao',r.tipo_medicao,'dados',r.dados,
            'integridade_percentual',(select round(ip.itens_realizados::numeric*100/ip.itens_previstos,1) from public.integridade_procedimental ip where ip.registro_medicao_id=r.id)
          ) order by a.nome)
          from public.registros_medicao r
          join public.alvos_clinicos a on a.id=r.alvo_id
          where r.sessao_id=s.id
        ),'[]'::jsonb)
      ) order by s.data)
      from public.sessoes_clinicas s
      where s.paciente_id=v_paciente_id and s.profissional_id=v_demo_id
        and s.deleted_at is null and s.status='finalizada'
    ),'[]'::jsonb),
    'validade_social',coalesce((
      select jsonb_agg(jsonb_build_object(
        'respondente_tipo',v.respondente_tipo,
        'objetivo_relevante',v.objetivo_relevante,
        'aceitabilidade',v.aceitabilidade,'viabilidade',v.viabilidade,
        'beneficio_percebido',v.beneficio_percebido,
        'assentimento_observado',v.assentimento_observado,
        'relato',v.relato,'registrado_em',v.registrado_em
      ) order by v.registrado_em desc)
      from public.registros_validade_social v
      where v.paciente_id=v_paciente_id and v.profissional_id=v_demo_id
    ),'[]'::jsonb)
  ) into v_resultado
  from public.profiles pr
  join public.pacientes p on p.id=v_paciente_id
  where pr.id=v_demo_id;

  return v_resultado;
end
$$;

revoke all on function public.obter_cenario_demonstracao() from public;
grant execute on function public.obter_cenario_demonstracao() to authenticated;
notify pgrst,'reload schema';


