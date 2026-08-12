-- Fecha versões públicas substituídas e reduz privilégios implícitos no schema.
revoke create on schema public from public,anon,authenticated;
alter default privileges in schema public revoke execute on functions from public;
alter default privileges in schema public revoke all on tables from public,anon;
alter default privileges in schema public revoke all on sequences from public,anon;
do $$ declare assinatura text;begin foreach assinatura in array array[
 'public.criar_acesso_responsavel(uuid,integer,text)','public.criar_acesso_responsavel(uuid,integer,text,text)','public.criar_acesso_responsavel(uuid,integer,text,text,integer,uuid[],boolean,boolean,boolean,boolean)','public.obter_acompanhamento_responsavel(text)',
 'public.registrar_sessao_clinica(uuid,date,text,text,jsonb)','public.registrar_sessao_clinica_v2(uuid,date,text,text,jsonb,text,text)','public.registrar_sessao_clinica_v3(uuid,date,text,text,jsonb,text,text,jsonb)','public.registrar_sessao_clinica_v4(uuid,date,text,text,jsonb,text,text,jsonb,jsonb)','public.registrar_sessao_clinica_v5(uuid,date,text,text,jsonb,text,text,jsonb,jsonb,text)',
 'public.criar_revisao_clinica_alvo(uuid,date,date,text,text,date)','public.criar_revisao_clinica_alvo_v2(uuid,date,date,text,text,date,boolean)','public.criar_revisao_clinica_alvo_v3(uuid,date,date,text,text,date,boolean)','public.obter_cenario_demonstracao()'
 ]loop if to_regprocedure(assinatura)is not null then execute format('revoke all on function %s from public,anon,authenticated',assinatura);end if;end loop;end $$;
-- Alguns ambientes antigos podem não ter todas as funcionalidades opcionais.
-- A concessão condicional permite aplicar o endurecimento sem falhar; a migration
-- que cria cada função continua responsável por concedê-la quando for instalada.
do $$ declare item record;begin for item in select*from(values
 ('public.criar_acesso_responsavel_v2(uuid,integer,text,text,integer,uuid[],boolean,boolean,boolean,boolean,boolean)','authenticated'),
 ('public.obter_acompanhamento_responsavel_v2(text)','anon,authenticated'),
 ('public.registrar_sessao_clinica_v6(uuid,date,text,text,jsonb,text,text,jsonb,jsonb,text,jsonb)','authenticated'),
 ('public.criar_revisao_clinica_alvo_v4(uuid,date,date,text,text,date,boolean)','authenticated'),
 ('public.obter_cenario_demonstracao_v2()','authenticated')
 )as contratos(assinatura,papeis)loop if to_regprocedure(item.assinatura)is not null then execute format('grant execute on function %s to %s',item.assinatura,item.papeis);end if;end loop;end $$;
notify pgrst,'reload schema';
