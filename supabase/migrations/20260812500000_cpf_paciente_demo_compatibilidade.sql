-- CPF opcional do paciente e compatibilidade do cenário de demonstração.
alter table public.pacientes add column if not exists cpf_paciente text;
alter table public.pacientes drop constraint if exists pacientes_cpf_paciente_formato_check;
alter table public.pacientes add constraint pacientes_cpf_paciente_formato_check check(public.normalizar_cpf(cpf_paciente) is null or length(public.normalizar_cpf(cpf_paciente))=11);

update public.pacientes set cpf_paciente=public.normalizar_cpf(cpf_paciente) where cpf_paciente is not null;

create unique index if not exists pacientes_cpf_paciente_uidx
  on public.pacientes(public.normalizar_cpf(cpf_paciente))
  where public.normalizar_cpf(cpf_paciente) is not null;

drop function if exists public.buscar_possiveis_duplicatas_paciente(text,date,text,text);
create function public.buscar_possiveis_duplicatas_paciente(
  p_nome_completo text,p_data_nascimento date,p_nome_responsavel text default null,
  p_cpf_responsavel text default null,p_cpf_paciente text default null
) returns table(paciente_id uuid,nome_mascarado text,responsavel_mascarado text,data_nascimento date,ja_vinculado boolean,criado_por_nome text)
language plpgsql stable security definer set search_path='' as $$
begin
  if auth.uid() is null or not public.usuario_ativo() or p_data_nascimento is null then return; end if;
  if public.normalizar_cpf(p_cpf_paciente) is null and public.normalizar_cpf(p_cpf_responsavel) is null and
    (length(public.normalizar_texto(p_nome_completo))<4 or length(public.normalizar_texto(p_nome_responsavel))<4) then return; end if;
  return query select p.id,
    left(p.nome_completo,1)||repeat('*',greatest(length(p.nome_completo)-1,3)),
    case when p.nome_responsavel is null then null else left(p.nome_responsavel,1)||repeat('*',greatest(length(p.nome_responsavel)-1,3)) end,
    p.data_nascimento,public.usuario_vinculado(p.id),null::text
  from public.pacientes p where
    (public.normalizar_cpf(p_cpf_paciente) is not null and public.normalizar_cpf(p.cpf_paciente)=public.normalizar_cpf(p_cpf_paciente)) or
    (public.normalizar_cpf(p_cpf_responsavel) is not null and public.normalizar_cpf(p.cpf_responsavel)=public.normalizar_cpf(p_cpf_responsavel) and p.data_nascimento=p_data_nascimento) or
    (public.normalizar_cpf(p_cpf_responsavel) is not null and public.normalizar_cpf(p.cpf_responsavel)=public.normalizar_cpf(p_cpf_responsavel) and public.normalizar_texto(p.nome_completo)=public.normalizar_texto(p_nome_completo) and public.normalizar_texto(p.nome_responsavel)=public.normalizar_texto(p_nome_responsavel)) or
    (public.normalizar_cpf(p_cpf_responsavel) is null and p.data_nascimento=p_data_nascimento and public.normalizar_texto(p.nome_completo)=public.normalizar_texto(p_nome_completo) and public.normalizar_texto(p.nome_responsavel)=public.normalizar_texto(p_nome_responsavel))
  limit 5;
end $$;

drop function if exists public.criar_paciente_com_vinculo(text,text,text,date,text,text,text);
create function public.criar_paciente_com_vinculo(
  p_nome_completo text,p_nome_responsavel text,p_cpf_responsavel text,p_data_nascimento date,
  p_diagnostico text,p_contatos text,p_observacoes text,p_cpf_paciente text default null
) returns uuid language plpgsql security definer set search_path='' as $$
declare v_id uuid;
begin
  if auth.uid() is null or not public.usuario_ativo() then raise exception 'unauthorized' using errcode='42501'; end if;
  if nullif(trim(p_nome_completo),'') is null or p_data_nascimento is null then raise exception 'invalid_patient' using errcode='22023'; end if;
  perform pg_advisory_xact_lock(hashtextextended(coalesce(public.normalizar_cpf(p_cpf_paciente),public.normalizar_cpf(p_cpf_responsavel),public.normalizar_texto(p_nome_completo)||':'||public.normalizar_texto(p_nome_responsavel)),0));
  if exists(select 1 from public.pacientes p where
    (public.normalizar_cpf(p_cpf_paciente) is not null and public.normalizar_cpf(p.cpf_paciente)=public.normalizar_cpf(p_cpf_paciente)) or
    (public.normalizar_cpf(p_cpf_responsavel) is not null and public.normalizar_cpf(p.cpf_responsavel)=public.normalizar_cpf(p_cpf_responsavel) and p.data_nascimento=p_data_nascimento) or
    (public.normalizar_cpf(p_cpf_responsavel) is not null and public.normalizar_cpf(p.cpf_responsavel)=public.normalizar_cpf(p_cpf_responsavel) and public.normalizar_texto(p.nome_completo)=public.normalizar_texto(p_nome_completo) and public.normalizar_texto(p.nome_responsavel)=public.normalizar_texto(p_nome_responsavel)) or
    (public.normalizar_cpf(p_cpf_responsavel) is null and p.data_nascimento=p_data_nascimento and public.normalizar_texto(p.nome_completo)=public.normalizar_texto(p_nome_completo) and public.normalizar_texto(p.nome_responsavel)=public.normalizar_texto(p_nome_responsavel)))
  then raise exception 'possible_duplicate' using errcode='P0001'; end if;
  insert into public.pacientes(nome_completo,nome_responsavel,cpf_responsavel,cpf_paciente,data_nascimento,diagnostico,contatos,observacoes,criado_por)
  values(trim(p_nome_completo),nullif(trim(p_nome_responsavel),''),public.normalizar_cpf(p_cpf_responsavel),public.normalizar_cpf(p_cpf_paciente),p_data_nascimento,nullif(trim(p_diagnostico),''),nullif(trim(p_contatos),''),nullif(trim(p_observacoes),''),auth.uid()) returning id into v_id;
  insert into public.paciente_psicologos(paciente_id,psicologo_id) values(v_id,auth.uid()) on conflict do nothing;
  return v_id;
end $$;

revoke all on function public.buscar_possiveis_duplicatas_paciente(text,date,text,text,text) from public;
revoke all on function public.criar_paciente_com_vinculo(text,text,text,date,text,text,text,text) from public;
grant execute on function public.buscar_possiveis_duplicatas_paciente(text,date,text,text,text) to authenticated;
grant execute on function public.criar_paciente_com_vinculo(text,text,text,date,text,text,text,text) to authenticated;

-- Mantém o novo identificador fora dos registros de auditoria.
create or replace function public.sanitizar_auditoria(p_tabela text,p_dados jsonb)
returns jsonb language sql immutable set search_path='' as $$
  select case p_tabela
    when 'pacientes' then p_dados-array['nome_completo','nome_responsavel','cpf_responsavel','cpf_paciente','diagnostico','contatos','observacoes']
    when 'profiles' then p_dados-array['nome','email','conselho_numero']
    when 'solicitacoes_acesso' then p_dados-array['mensagem','papel_no_caso']
    when 'acessos_responsavel' then p_dados-array['token_hash','descricao']
    when 'planos_clinicos' then p_dados-array['titulo','justificativa']
    when 'objetivos_clinicos' then p_dados-array['descricao']
    when 'alvos_clinicos' then p_dados-array['nome','categoria']
    when 'definicoes_operacionais_alvo' then p_dados-array['descricao_observavel','resposta_esperada','condicoes_antecedentes','exemplos','nao_exemplos','materiais','instrucao_sd','resposta_correta','resposta_incorreta','criterios_interrupcao']
    when 'configuracoes_medicao_alvo' then p_dados-array['parametros']
    when 'criterios_dominio_alvo' then p_dados-array['configuracao']
    when 'historico_fases_alvo' then p_dados-array['motivo']
    else p_dados-array['token_hash'] end
$$;

-- Garante que instalações que pularam a migration de tentativas ainda exponham
-- a versão esperada pela aplicação. A função-base continua sendo a única fonte.
create or replace function public.obter_cenario_demonstracao_v2()
returns jsonb language plpgsql stable security definer set search_path='pg_catalog','public' set row_security=off as $$
declare v_base jsonb;v_sessoes jsonb;
begin
  v_base:=public.obter_cenario_demonstracao();if v_base is null then return null;end if;
  select coalesce(
    jsonb_agg(
      jsonb_set(
        sessao,
        '{registros}',
        coalesce((
          select jsonb_agg(
            jsonb_set(
              registro,
              '{tentativas}',
              coalesce((
                select jsonb_agg(
                  jsonb_build_object(
                    'id',t.id,
                    'ordem',t.ordem,
                    'resultado',t.resultado,
                    'nivel_ajuda',t.nivel_ajuda,
                    'latencia_segundos',t.latencia_segundos
                  ) order by t.ordem
                )
                from public.tentativas_individuais t
                where t.registro_medicao_id=(registro->>'id')::uuid
              ),'[]'::jsonb),
              true
            )
          )
          from jsonb_array_elements(sessao->'registros') registro
        ),'[]'::jsonb),
        true
      )
    ),
    '[]'::jsonb
  ) into v_sessoes
  from jsonb_array_elements(v_base->'sessoes') sessao;
  return jsonb_set(v_base,'{sessoes}',v_sessoes,true);
end $$;
revoke all on function public.obter_cenario_demonstracao_v2() from public;
grant execute on function public.obter_cenario_demonstracao_v2() to authenticated;

notify pgrst,'reload schema';
