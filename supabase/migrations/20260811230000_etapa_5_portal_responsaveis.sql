-- Etapa 5: acessos externos somente leitura, com token armazenado apenas como hash.
create extension if not exists pgcrypto with schema extensions;

create table if not exists public.acessos_responsavel (
  id uuid primary key default gen_random_uuid(),
  paciente_id uuid not null references public.pacientes(id) on delete cascade,
  token_hash bytea not null unique,
  descricao text not null default 'Responsável',
  criado_por uuid not null references public.profiles(id) on delete restrict,
  criado_em timestamptz not null default now(),
  expira_em timestamptz,
  revogado_em timestamptz,
  ultimo_acesso_em timestamptz,
  ativo boolean not null default true,
  check (expira_em is null or expira_em > criado_em)
);

create index if not exists acessos_responsavel_paciente_idx on public.acessos_responsavel (paciente_id, criado_em desc);
alter table public.acessos_responsavel enable row level security;
alter table public.acessos_responsavel force row level security;
-- Sem policies: toda operação passa pelas funções abaixo.

create or replace function public.criar_acesso_responsavel(
  p_paciente_id uuid, p_validade_dias integer default null, p_descricao text default 'Responsável'
)
returns table (id uuid, token text, criado_em timestamptz, expira_em timestamptz)
language plpgsql security definer
set search_path = 'pg_catalog', 'public', 'extensions'
as $$
declare v_token text; v_id uuid; v_criado timestamptz; v_expira timestamptz;
begin
  if auth.uid() is null or not public.usuario_vinculado(p_paciente_id) then
    raise exception 'unauthorized' using errcode = '42501';
  end if;
  if p_validade_dias is not null and p_validade_dias not in (7, 30, 90) then
    raise exception 'invalid_expiration' using errcode = '22023';
  end if;
  perform pg_advisory_xact_lock(hashtextextended(p_paciente_id::text, 0));
  update public.acessos_responsavel
  set ativo = false, revogado_em = coalesce(revogado_em, now())
  where paciente_id = p_paciente_id and ativo and revogado_em is null;
  -- Hexadecimal evita qualquer transformacao do token por URL, clipboard ou roteador.
  v_token := encode(extensions.gen_random_bytes(32), 'hex');
  insert into public.acessos_responsavel
    (paciente_id, token_hash, descricao, criado_por, expira_em)
  values
    (p_paciente_id, extensions.digest(convert_to(v_token, 'UTF8'), 'sha256'),
     coalesce(nullif(trim(p_descricao), ''), 'Responsável'), auth.uid(),
     case when p_validade_dias is null then null else now() + make_interval(days => p_validade_dias) end)
  returning acessos_responsavel.id, acessos_responsavel.criado_em, acessos_responsavel.expira_em
  into v_id, v_criado, v_expira;
  return query select v_id, v_token, v_criado, v_expira;
end
$$;

create or replace function public.listar_acessos_responsavel(p_paciente_id uuid)
returns table (
  id uuid, descricao text, criado_em timestamptz, expira_em timestamptz,
  revogado_em timestamptz, ultimo_acesso_em timestamptz, ativo boolean
)
language sql stable security definer
set search_path = 'pg_catalog', 'public'
as $$
  select a.id, a.descricao, a.criado_em, a.expira_em, a.revogado_em, a.ultimo_acesso_em, a.ativo
  from public.acessos_responsavel a
  where a.paciente_id = p_paciente_id and public.usuario_vinculado(p_paciente_id)
  order by a.criado_em desc
$$;

create or replace function public.revogar_acesso_responsavel(p_acesso_id uuid)
returns void language plpgsql security definer
set search_path = 'pg_catalog', 'public'
as $$
declare v_paciente_id uuid;
begin
  select paciente_id into v_paciente_id from public.acessos_responsavel where id = p_acesso_id for update;
  if v_paciente_id is null or not public.usuario_vinculado(v_paciente_id) then
    raise exception 'unauthorized' using errcode = '42501';
  end if;
  update public.acessos_responsavel
  set ativo = false, revogado_em = coalesce(revogado_em, now())
  where id = p_acesso_id;
end
$$;

-- Retorna um DTO mínimo. Não há observações, profissionais, contatos, CPF,
-- diagnóstico, pesos ou IDs de atendimentos no resultado.
create or replace function public.obter_acompanhamento_responsavel(p_token text)
returns jsonb
language plpgsql security definer
set search_path = 'pg_catalog', 'public', 'extensions'
set row_security = off
as $$
declare v_acesso public.acessos_responsavel%rowtype; v_resultado jsonb;
begin
  if p_token is null or length(p_token) < 40 or length(p_token) > 100 then return null; end if;
  select * into v_acesso
  from public.acessos_responsavel a
  where a.token_hash = extensions.digest(convert_to(p_token, 'UTF8'), 'sha256')
    and a.ativo and a.revogado_em is null
    and (a.expira_em is null or a.expira_em > now())
  for update;
  if not found then return null; end if;

  update public.acessos_responsavel set ultimo_acesso_em = now() where id = v_acesso.id;

  select jsonb_build_object(
    'primeiro_nome', split_part(trim(p.nome_completo), ' ', 1),
    'ultima_atualizacao', (select max(at.data) from public.atendimentos at where at.paciente_id = p.id),
    'habilidades', coalesce((
      select jsonb_agg(jsonb_build_object(
        'nome', h.nome,
        'avaliacoes', coalesce((
          select jsonb_agg(jsonb_build_object('data', at.data, 'codigo', n.codigo, 'valor', n.valor)
            order by at.data, at.created_at, at.id)
          from public.atendimentos at
          join public.niveis_avaliacao n on n.id = at.nivel_avaliacao_id
          where at.paciente_id = ph.paciente_id and at.habilidade_id = ph.habilidade_id
            and at.data >= current_date - interval '1 year'
        ), '[]'::jsonb)
      ) order by h.nome)
      from public.paciente_habilidades ph
      join public.habilidades h on h.id = ph.habilidade_id
      where ph.paciente_id = p.id and ph.ativo
    ), '[]'::jsonb)
  ) into v_resultado
  from public.pacientes p where p.id = v_acesso.paciente_id;
  return v_resultado;
end
$$;

revoke all on function public.criar_acesso_responsavel(uuid, integer, text) from public;
revoke all on function public.listar_acessos_responsavel(uuid) from public;
revoke all on function public.revogar_acesso_responsavel(uuid) from public;
revoke all on function public.obter_acompanhamento_responsavel(text) from public;
grant execute on function public.criar_acesso_responsavel(uuid, integer, text) to authenticated;
grant execute on function public.listar_acessos_responsavel(uuid) to authenticated;
grant execute on function public.revogar_acesso_responsavel(uuid) to authenticated;
grant execute on function public.obter_acompanhamento_responsavel(text) to anon, authenticated;

notify pgrst, 'reload schema';
