-- Consolida o registro clínico no modelo de sessões estruturadas.
-- Esta migração é destrutiva por decisão explícita de produto: o modelo antigo
-- de atendimentos não possui dados que precisem ser preservados.

-- Remove primeiro os gatilhos, pois eles dependem das funções legadas.
do $$
begin
  if to_regclass('public.atendimentos') is not null then
    drop trigger if exists atendimentos_garantir_paciente_habilidade on public.atendimentos;
    drop trigger if exists atendimentos_campos_protegidos on public.atendimentos;
  end if;
end
$$;

-- Funções de leitura do modelo anterior não fazem mais parte da API.
drop function if exists public.avaliacoes_clinicas_paciente(uuid);
drop function if exists public.avaliacoes_clinicas_profissional(date);
drop function if exists public.garantir_paciente_habilidade();
drop function if exists public.proteger_atendimento();

-- A exclusão do catálogo global não depende mais de atendimentos antigos.
create or replace function public.excluir_ou_desativar_habilidade(p_habilidade_id uuid)
returns text language plpgsql security definer set search_path = '' as $$
begin
  if not public.usuario_admin() then
    raise exception 'unauthorized' using errcode='42501';
  end if;
  if exists(select 1 from public.paciente_habilidades where habilidade_id=p_habilidade_id) then
    update public.habilidades
      set status='inativa',deleted_at=coalesce(deleted_at,now())
      where id=p_habilidade_id;
    return 'desativada';
  end if;
  delete from public.habilidades where id=p_habilidade_id;
  return 'excluida';
end
$$;

-- Mantém o contrato mínimo do portal, agora derivado de alvos e sessões.
create or replace function public.obter_acompanhamento_responsavel(p_token text)
returns jsonb language plpgsql security definer
set search_path='pg_catalog','public','extensions' set row_security=off as $$
declare
  v_acesso public.acessos_responsavel%rowtype;
  v_resultado jsonb;
begin
  if p_token is null or length(p_token)<40 or length(p_token)>100 then return null; end if;

  select * into v_acesso
  from public.acessos_responsavel a
  where a.token_hash=extensions.digest(convert_to(p_token,'UTF8'),'sha256')
    and a.ativo and a.revogado_em is null
    and (a.expira_em is null or a.expira_em>now())
  for update;

  if not found then return null; end if;

  update public.acessos_responsavel
    set ultimo_acesso_em=now()
    where id=v_acesso.id;

  select jsonb_build_object(
    'primeiro_nome',split_part(trim(p.nome_completo),' ',1),
    'ultima_atualizacao',(
      select max(s.data)
      from public.sessoes_clinicas s
      where s.paciente_id=p.id and s.deleted_at is null and s.status='finalizada'
        and (v_acesso.escopo='equipe' or s.profissional_id=v_acesso.criado_por)
    ),
    'habilidades',coalesce((
      select jsonb_agg(jsonb_build_object(
        'nome',a.nome,
        'avaliacoes',coalesce((
          select jsonb_agg(jsonb_build_object(
            'data',s.data,
            'codigo',case
              when r.tipo_medicao='escala_independencia' then r.dados->>'codigo'
              else concat(round((
                case
                  when r.tipo_medicao in ('percentual_oportunidades','tentativas_discretas')
                    then (r.dados->>'respostas_independentes')::numeric/nullif((r.dados->>'oportunidades')::numeric,0)
                  when r.tipo_medicao in ('intervalo_parcial','intervalo_total','amostragem_momentanea')
                    then (r.dados->>'intervalos_com_ocorrencia')::numeric/nullif((r.dados->>'intervalos')::numeric,0)
                  else null
                end
              )*100), '%')
            end,
            'valor',case
              when r.tipo_medicao='escala_independencia' then
                case r.dados->>'codigo' when 'A' then 1 when 'B+' then .7 when 'B-' then .5 when 'C' then 0 end
              when r.tipo_medicao in ('percentual_oportunidades','tentativas_discretas')
                then (r.dados->>'respostas_independentes')::numeric/nullif((r.dados->>'oportunidades')::numeric,0)
              when r.tipo_medicao in ('intervalo_parcial','intervalo_total','amostragem_momentanea')
                then (r.dados->>'intervalos_com_ocorrencia')::numeric/nullif((r.dados->>'intervalos')::numeric,0)
              else null
            end
          ) order by s.data,s.created_at,r.id)
          from public.registros_medicao r
          join public.sessoes_clinicas s on s.id=r.sessao_id
          where r.alvo_id=a.id and s.paciente_id=p.id
            and s.deleted_at is null and s.status='finalizada'
            and s.data>=current_date-interval '1 year'
            and (v_acesso.escopo='equipe' or s.profissional_id=v_acesso.criado_por)
            and r.tipo_medicao in ('escala_independencia','percentual_oportunidades','tentativas_discretas','intervalo_parcial','intervalo_total','amostragem_momentanea')
        ),'[]'::jsonb)
      ) order by a.nome)
      from public.alvos_clinicos a
      join public.objetivos_clinicos o on o.id=a.objetivo_id
      join public.planos_clinicos pc on pc.id=o.plano_id
      where pc.paciente_id=p.id and a.ativo
        and (v_acesso.escopo='equipe' or a.profissional_id=v_acesso.criado_por)
    ),'[]'::jsonb)
  ) into v_resultado
  from public.pacientes p
  where p.id=v_acesso.paciente_id;

  return v_resultado;
end
$$;

-- Remove políticas, gatilhos e finalmente a tabela legada sem CASCADE.
do $$
declare p record;
begin
  if to_regclass('public.atendimentos') is not null then
    for p in select policyname from pg_policies
      where schemaname='public' and tablename='atendimentos'
    loop
      execute format('drop policy %I on public.atendimentos',p.policyname);
    end loop;
    drop table public.atendimentos;
  end if;
end
$$;

notify pgrst,'reload schema';
