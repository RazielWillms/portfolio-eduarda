-- Reinstala os contratos atuais do portal. Requer a estrutura base criada em
-- 20260812370000_portal_series_clinicas.sql.
create or replace function public.criar_acesso_responsavel_v2(
 p_paciente_id uuid,p_validade_dias integer default null,p_descricao text default 'Responsavel',p_escopo text default 'profissional',
 p_periodo_meses integer default 12,p_alvos uuid[] default '{}',p_exibir_criterios boolean default true,
 p_exibir_fases boolean default true,p_exibir_integridade boolean default false,p_exibir_contextos boolean default false,
 p_exibir_analise_tentativas boolean default false
)returns table(id uuid,token text,criado_em timestamptz,expira_em timestamptz)
language plpgsql security definer set search_path='pg_catalog','public' set row_security=off as $$
declare v record;begin
 select*into v from public.criar_acesso_responsavel(
  p_paciente_id,p_validade_dias,p_descricao,p_escopo,p_periodo_meses,p_alvos,
  p_exibir_criterios,p_exibir_fases,p_exibir_integridade,p_exibir_contextos
 );
 if v.id is null then raise exception'access_not_created'using errcode='P0001';end if;
 update public.acessos_responsavel a set configuracao=a.configuracao||jsonb_build_object(
  'exibir_analise_tentativas',coalesce(p_exibir_analise_tentativas,false)
 )where a.id=v.id;
 return query select v.id,v.token,v.criado_em,v.expira_em;
end$$;

create or replace function public.obter_acompanhamento_responsavel_v2(p_token text)
returns jsonb language plpgsql security definer
set search_path='pg_catalog','public','extensions' set row_security=off as $$
declare v_base jsonb;v_alvos jsonb;begin
 v_base:=public.obter_acompanhamento_responsavel(p_token);
 if v_base is null or not coalesce((v_base->'configuracao'->>'exibir_analise_tentativas')::boolean,false)then return v_base;end if;
 select coalesce(jsonb_agg(jsonb_set(alvo,'{pontos}',coalesce((
  select jsonb_agg(jsonb_set(ponto,'{tentativas}',coalesce((
   select jsonb_build_object(
    'total',count(*),
    'independentes',count(*)filter(where t.resultado='correta'and t.nivel_ajuda='independente'),
    'corretasComAjuda',count(*)filter(where t.resultado='correta'and t.nivel_ajuda<>'independente'),
    'comAjuda',count(*)filter(where t.nivel_ajuda<>'independente'),
    'incorretas',count(*)filter(where t.resultado='incorreta'),
    'semResposta',count(*)filter(where t.resultado='sem_resposta'),
    'latenciaMedia',round(avg(t.latencia_segundos),2),
    'ajudas',jsonb_build_object(
     'gestual',count(*)filter(where t.nivel_ajuda='gestual'),
     'verbal',count(*)filter(where t.nivel_ajuda='verbal'),
     'modelo',count(*)filter(where t.nivel_ajuda='modelo'),
     'fisica_parcial',count(*)filter(where t.nivel_ajuda='fisica_parcial'),
     'fisica_total',count(*)filter(where t.nivel_ajuda='fisica_total')
    )
   )from public.tentativas_individuais t
   where t.registro_medicao_id=(ponto->>'id')::uuid having count(*)>0
  ),'null'::jsonb),true))from jsonb_array_elements(coalesce(alvo->'pontos','[]'::jsonb))ponto
 ),'[]'::jsonb),true)))into v_alvos
 from jsonb_array_elements(coalesce(v_base->'alvos','[]'::jsonb))alvo;
 return jsonb_set(v_base,'{alvos}',coalesce(v_alvos,'[]'::jsonb),true);
end$$;

revoke all on function public.criar_acesso_responsavel_v2(uuid,integer,text,text,integer,uuid[],boolean,boolean,boolean,boolean,boolean)from public,anon;
grant execute on function public.criar_acesso_responsavel_v2(uuid,integer,text,text,integer,uuid[],boolean,boolean,boolean,boolean,boolean)to authenticated;
revoke all on function public.obter_acompanhamento_responsavel_v2(text)from public;
grant execute on function public.obter_acompanhamento_responsavel_v2(text)to anon,authenticated;
notify pgrst,'reload schema';
