-- Portal externo baseado nas mesmas series clinicas do ambiente profissional.
alter table public.acessos_responsavel add column if not exists configuracao jsonb not null default '{}'::jsonb;
alter table public.acessos_responsavel drop constraint if exists acessos_responsavel_configuracao_check;
alter table public.acessos_responsavel add constraint acessos_responsavel_configuracao_check check(jsonb_typeof(configuracao)='object');

drop function if exists public.criar_acesso_responsavel(uuid,integer,text,text);
create function public.criar_acesso_responsavel(
  p_paciente_id uuid,p_validade_dias integer default null,p_descricao text default 'Responsavel',p_escopo text default 'profissional',
  p_periodo_meses integer default 12,p_alvos uuid[] default '{}',p_exibir_criterios boolean default true,
  p_exibir_fases boolean default true,p_exibir_integridade boolean default false,p_exibir_contextos boolean default false
) returns table(id uuid,token text,criado_em timestamptz,expira_em timestamptz)
language plpgsql security definer set search_path='pg_catalog','public','extensions' as $$
declare v_token text;v_id uuid;v_criado timestamptz;v_expira timestamptz;v_alvos uuid[]:=coalesce(p_alvos,'{}'::uuid[]);
begin
  if auth.uid() is null or not public.usuario_vinculado(p_paciente_id) then raise exception 'unauthorized' using errcode='42501'; end if;
  if p_validade_dias is not null and p_validade_dias not in(7,30,90) then raise exception 'invalid_expiration' using errcode='22023'; end if;
  if p_escopo not in('profissional','equipe') or p_periodo_meses not in(3,6,12,24) then raise exception 'invalid_configuration' using errcode='22023'; end if;
  if cardinality(v_alvos)<>(select count(distinct x) from unnest(v_alvos)x) then raise exception 'duplicate_target' using errcode='22023'; end if;
  if exists(select 1 from unnest(v_alvos)aid where not exists(select 1 from public.alvos_clinicos a join public.objetivos_clinicos o on o.id=a.objetivo_id join public.planos_clinicos pc on pc.id=o.plano_id where a.id=aid and pc.paciente_id=p_paciente_id and (p_escopo='equipe' or a.profissional_id=auth.uid()))) then raise exception 'invalid_target' using errcode='42501'; end if;
  perform pg_advisory_xact_lock(hashtextextended(p_paciente_id::text||auth.uid()::text,0));
  update public.acessos_responsavel set ativo=false,revogado_em=coalesce(revogado_em,now()) where paciente_id=p_paciente_id and criado_por=auth.uid() and ativo and revogado_em is null;
  v_token:=encode(extensions.gen_random_bytes(32),'hex');
  insert into public.acessos_responsavel(paciente_id,token_hash,descricao,criado_por,expira_em,escopo,configuracao)
  values(p_paciente_id,extensions.digest(convert_to(v_token,'UTF8'),'sha256'),coalesce(nullif(trim(p_descricao),''),'Responsavel'),auth.uid(),case when p_validade_dias is null then null else now()+make_interval(days=>p_validade_dias)end,p_escopo,
    jsonb_build_object('periodo_meses',p_periodo_meses,'alvo_ids',to_jsonb(v_alvos),'exibir_criterios',p_exibir_criterios,'exibir_fases',p_exibir_fases,'exibir_integridade',p_exibir_integridade,'exibir_contextos',p_exibir_contextos))
  returning acessos_responsavel.id,acessos_responsavel.criado_em,acessos_responsavel.expira_em into v_id,v_criado,v_expira;
  return query select v_id,v_token,v_criado,v_expira;
end $$;

drop function if exists public.listar_acessos_responsavel(uuid);
create function public.listar_acessos_responsavel(p_paciente_id uuid)
returns table(id uuid,descricao text,criado_em timestamptz,expira_em timestamptz,revogado_em timestamptz,ultimo_acesso_em timestamptz,ativo boolean,escopo text,configuracao jsonb)
language sql stable security definer set search_path='pg_catalog','public' as $$
 select a.id,a.descricao,a.criado_em,a.expira_em,a.revogado_em,a.ultimo_acesso_em,a.ativo,a.escopo,a.configuracao from public.acessos_responsavel a
 where a.paciente_id=p_paciente_id and a.criado_por=auth.uid() and public.usuario_vinculado(p_paciente_id) order by a.criado_em desc
$$;

create or replace function public.obter_acompanhamento_responsavel(p_token text)
returns jsonb language plpgsql security definer set search_path='pg_catalog','public','extensions' set row_security=off as $$
declare v_acesso public.acessos_responsavel%rowtype;v_resultado jsonb;v_cfg jsonb;v_inicio date;
begin
 if p_token is null or length(p_token)<40 or length(p_token)>100 then return null;end if;
 select*into v_acesso from public.acessos_responsavel a where a.token_hash=extensions.digest(convert_to(p_token,'UTF8'),'sha256') and a.ativo and a.revogado_em is null and(a.expira_em is null or a.expira_em>now())for update;
 if not found then return null;end if;update public.acessos_responsavel set ultimo_acesso_em=now()where id=v_acesso.id;
 v_cfg:=v_acesso.configuracao;v_inicio:=current_date-make_interval(months=>coalesce((v_cfg->>'periodo_meses')::integer,12));
 select jsonb_build_object('primeiro_nome',split_part(trim(p.nome_completo),' ',1),'periodo_inicio',v_inicio,'periodo_fim',current_date,'ultima_atualizacao',(select max(s.data)from public.sessoes_clinicas s where s.paciente_id=p.id and s.deleted_at is null and s.status='finalizada' and(v_acesso.escopo='equipe'or s.profissional_id=v_acesso.criado_por)),'configuracao',v_cfg,
 'alvos',coalesce((select jsonb_agg(jsonb_build_object('id',a.id,'nome',a.nome,'natureza',a.natureza,
   'criterio',case when coalesce((v_cfg->>'exibir_criterios')::boolean,true)then(select jsonb_build_object('direcao',c.direcao,'valor',c.valor_alvo,'sessoes',c.sessoes_consecutivas)from public.criterios_dominio_alvo c where c.alvo_id=a.id order by c.versao desc limit 1)else null end,
   'pontos',coalesce((select jsonb_agg(jsonb_build_object('id',r.id,'data',s.data,'tipo',r.tipo_medicao,'unidade',case when r.tipo_medicao='taxa'then'por minuto'when r.tipo_medicao in('duracao','latencia')then'segundos'when r.tipo_medicao in('percentual_oportunidades','tentativas_discretas','intervalo_parcial','intervalo_total','amostragem_momentanea','escala_independencia')then'%'when r.tipo_medicao='frequencia'then'ocorrencias'else'nivel'end,
    'valor',case when r.tipo_medicao='frequencia'then(r.dados->>'contagem')::numeric when r.tipo_medicao='taxa'then round(((r.dados->>'contagem')::numeric/nullif((r.dados->>'duracao_observacao_segundos')::numeric,0))*60,2)when r.tipo_medicao in('duracao','latencia')then(r.dados->>'segundos')::numeric when r.tipo_medicao in('percentual_oportunidades','tentativas_discretas')then round((r.dados->>'respostas_independentes')::numeric/nullif((r.dados->>'oportunidades')::numeric,0)*100,2)when r.tipo_medicao in('intervalo_parcial','intervalo_total','amostragem_momentanea')then round((r.dados->>'intervalos_com_ocorrencia')::numeric/nullif((r.dados->>'intervalos')::numeric,0)*100,2)when r.tipo_medicao='escala_independencia'then case r.dados->>'codigo'when'A'then 100 when'B+'then 70 when'B-'then 50 when'C'then 0 end when r.tipo_medicao='intensidade'then(r.dados->>'nivel')::numeric end,
    'numerador',case when r.tipo_medicao in('percentual_oportunidades','tentativas_discretas')then(r.dados->>'respostas_independentes')::numeric when r.tipo_medicao in('intervalo_parcial','intervalo_total','amostragem_momentanea')then(r.dados->>'intervalos_com_ocorrencia')::numeric when r.tipo_medicao='taxa'then(r.dados->>'contagem')::numeric else null end,
    'denominador',case when r.tipo_medicao in('percentual_oportunidades','tentativas_discretas')then(r.dados->>'oportunidades')::numeric when r.tipo_medicao in('intervalo_parcial','intervalo_total','amostragem_momentanea')then(r.dados->>'intervalos')::numeric when r.tipo_medicao='taxa'then(r.dados->>'duracao_observacao_segundos')::numeric else null end,
    'fase',case when coalesce((v_cfg->>'exibir_fases')::boolean,true)then case s.finalidade when'linha_de_base'then'linha_de_base'when'intervencao'then'ensino'when'generalizacao'then'generalizacao'when'manutencao'then'manutencao'else null end else null end,
    'ambiente',case when coalesce((v_cfg->>'exibir_contextos')::boolean,false)then s.ambiente_tipo else null end,'aplicador',case when coalesce((v_cfg->>'exibir_contextos')::boolean,false)then s.aplicador_tipo else null end,
    'protocolo_versao',(select pi.versao from public.protocolos_intervencao_alvo pi where pi.id=r.protocolo_intervencao_id),
    'integridade',case when coalesce((v_cfg->>'exibir_integridade')::boolean,false)then(select round(i.itens_realizados::numeric/nullif(i.itens_previstos,0)*100,0)from public.integridade_procedimental i where i.registro_medicao_id=r.id limit 1)else null end)order by s.data,s.created_at,r.id)
    from public.registros_medicao r join public.sessoes_clinicas s on s.id=r.sessao_id where r.alvo_id=a.id and s.paciente_id=p.id and s.deleted_at is null and s.status='finalizada'and s.data>=v_inicio and(v_acesso.escopo='equipe'or s.profissional_id=v_acesso.criado_por)),'[]'::jsonb))order by a.nome)
   from public.alvos_clinicos a join public.objetivos_clinicos o on o.id=a.objetivo_id join public.planos_clinicos pc on pc.id=o.plano_id where pc.paciente_id=p.id and a.ativo and(v_acesso.escopo='equipe'or a.profissional_id=v_acesso.criado_por)and(jsonb_array_length(coalesce(v_cfg->'alvo_ids','[]'::jsonb))=0 or (v_cfg->'alvo_ids') ? a.id::text)),'[]'::jsonb))
 into v_resultado from public.pacientes p where p.id=v_acesso.paciente_id;return v_resultado;
end $$;
revoke all on function public.criar_acesso_responsavel(uuid,integer,text,text,integer,uuid[],boolean,boolean,boolean,boolean)from public;
grant execute on function public.criar_acesso_responsavel(uuid,integer,text,text,integer,uuid[],boolean,boolean,boolean,boolean)to authenticated;
revoke all on function public.listar_acessos_responsavel(uuid)from public;grant execute on function public.listar_acessos_responsavel(uuid)to authenticated;
notify pgrst,'reload schema';
