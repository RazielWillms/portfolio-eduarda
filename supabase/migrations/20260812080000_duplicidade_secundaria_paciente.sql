-- Detecta provavel duplicidade mesmo quando a data de nascimento foi digitada
-- de forma diferente: CPF, nome da crianca e nome do responsavel coincidentes.

create or replace function public.buscar_possiveis_duplicatas_paciente(
  p_nome_completo text,
  p_data_nascimento date,
  p_nome_responsavel text default null,
  p_cpf_responsavel text default null
)
returns table (
  paciente_id uuid, nome_mascarado text, responsavel_mascarado text,
  data_nascimento date, ja_vinculado boolean, criado_por_nome text
)
language plpgsql stable security definer set search_path = '' as $$
begin
  if auth.uid() is null or not public.usuario_ativo() or p_data_nascimento is null then return; end if;
  if public.normalizar_cpf(p_cpf_responsavel) is null and
     (length(public.normalizar_texto(p_nome_completo)) < 4 or
      length(public.normalizar_texto(p_nome_responsavel)) < 4) then return; end if;

  return query
  select p.id,
    left(p.nome_completo,1) || repeat('*',greatest(length(p.nome_completo)-1,3)),
    case when p.nome_responsavel is null then null
      else left(p.nome_responsavel,1) || repeat('*',greatest(length(p.nome_responsavel)-1,3)) end,
    p.data_nascimento, public.usuario_vinculado(p.id), null::text
  from public.pacientes p
  where
    -- Identificacao forte principal: CPF do responsavel + nascimento.
    (public.normalizar_cpf(p_cpf_responsavel) is not null
      and public.normalizar_cpf(p.cpf_responsavel)=public.normalizar_cpf(p_cpf_responsavel)
      and p.data_nascimento=p_data_nascimento)
    or
    -- Alerta secundario: os tres textos coincidem, ainda que o nascimento divirja.
    (public.normalizar_cpf(p_cpf_responsavel) is not null
      and public.normalizar_cpf(p.cpf_responsavel)=public.normalizar_cpf(p_cpf_responsavel)
      and public.normalizar_texto(p.nome_completo)=public.normalizar_texto(p_nome_completo)
      and public.normalizar_texto(p.nome_responsavel)=public.normalizar_texto(p_nome_responsavel))
    or
    -- Sem CPF, mantem a identificacao composta original.
    (public.normalizar_cpf(p_cpf_responsavel) is null
      and p.data_nascimento=p_data_nascimento
      and public.normalizar_texto(p.nome_completo)=public.normalizar_texto(p_nome_completo)
      and public.normalizar_texto(p.nome_responsavel)=public.normalizar_texto(p_nome_responsavel))
  limit 5;
end $$;

create or replace function public.criar_paciente_com_vinculo(
  p_nome_completo text, p_nome_responsavel text, p_cpf_responsavel text,
  p_data_nascimento date, p_diagnostico text, p_contatos text, p_observacoes text
)
returns uuid language plpgsql security definer set search_path = '' as $$
declare v_id uuid;
begin
  if auth.uid() is null or not public.usuario_ativo() then
    raise exception 'unauthorized' using errcode='42501';
  end if;
  if nullif(trim(p_nome_completo),'') is null or p_data_nascimento is null then
    raise exception 'invalid_patient' using errcode='22023';
  end if;

  -- Com CPF, serializa todas as tentativas do mesmo nucleo familiar para que
  -- a verificacao secundaria tambem seja atomica.
  perform pg_advisory_xact_lock(hashtextextended(coalesce(
    public.normalizar_cpf(p_cpf_responsavel),
    public.normalizar_texto(p_nome_completo)||':'||public.normalizar_texto(p_nome_responsavel)
  ),0));

  if exists (
    select 1 from public.pacientes p where
      (public.normalizar_cpf(p_cpf_responsavel) is not null
        and public.normalizar_cpf(p.cpf_responsavel)=public.normalizar_cpf(p_cpf_responsavel)
        and p.data_nascimento=p_data_nascimento)
      or
      (public.normalizar_cpf(p_cpf_responsavel) is not null
        and public.normalizar_cpf(p.cpf_responsavel)=public.normalizar_cpf(p_cpf_responsavel)
        and public.normalizar_texto(p.nome_completo)=public.normalizar_texto(p_nome_completo)
        and public.normalizar_texto(p.nome_responsavel)=public.normalizar_texto(p_nome_responsavel))
      or
      (public.normalizar_cpf(p_cpf_responsavel) is null
        and p.data_nascimento=p_data_nascimento
        and public.normalizar_texto(p.nome_completo)=public.normalizar_texto(p_nome_completo)
        and public.normalizar_texto(p.nome_responsavel)=public.normalizar_texto(p_nome_responsavel))
  ) then
    raise exception 'possible_duplicate' using errcode='P0001';
  end if;

  insert into public.pacientes
    (nome_completo,nome_responsavel,cpf_responsavel,data_nascimento,diagnostico,contatos,observacoes,criado_por)
  values (trim(p_nome_completo),nullif(trim(p_nome_responsavel),''),public.normalizar_cpf(p_cpf_responsavel),
    p_data_nascimento,nullif(trim(p_diagnostico),''),nullif(trim(p_contatos),''),
    nullif(trim(p_observacoes),''),auth.uid()) returning id into v_id;
  insert into public.paciente_psicologos (paciente_id,psicologo_id)
  values (v_id,auth.uid()) on conflict do nothing;
  return v_id;
end $$;

revoke all on function public.buscar_possiveis_duplicatas_paciente(text,date,text,text) from public;
revoke all on function public.criar_paciente_com_vinculo(text,text,text,date,text,text,text) from public;
grant execute on function public.buscar_possiveis_duplicatas_paciente(text,date,text,text) to authenticated;
grant execute on function public.criar_paciente_com_vinculo(text,text,text,date,text,text,text) to authenticated;

notify pgrst, 'reload schema';
