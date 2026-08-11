-- Escopo de indicadores por profissional. O padrao mais restritivo preserva
-- compatibilidade e evita ampliar links existentes.
alter table public.acessos_responsavel
  add column if not exists escopo text not null default 'profissional';

alter table public.acessos_responsavel drop constraint if exists acessos_responsavel_escopo_check;
alter table public.acessos_responsavel add constraint acessos_responsavel_escopo_check
  check (escopo in ('profissional', 'equipe'));

with ativos_ordenados as (
  select id, row_number() over (partition by paciente_id order by criado_em desc, id desc) as ordem
  from public.acessos_responsavel
  where ativo and revogado_em is null
)
update public.acessos_responsavel a
set ativo = false, revogado_em = now()
from ativos_ordenados o
where a.id = o.id and o.ordem > 1;

create unique index if not exists acessos_responsavel_um_ativo_uidx
  on public.acessos_responsavel (paciente_id)
  where ativo and revogado_em is null;

create or replace function public.criar_acesso_responsavel(
  p_paciente_id uuid,
  p_validade_dias integer default null,
  p_descricao text default 'Responsável',
  p_escopo text default 'profissional'
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
  if p_escopo not in ('profissional', 'equipe') then
    raise exception 'invalid_scope' using errcode = '22023';
  end if;
  perform pg_advisory_xact_lock(hashtextextended(p_paciente_id::text, 0));
  update public.acessos_responsavel
  set ativo = false, revogado_em = coalesce(revogado_em, now())
  where paciente_id = p_paciente_id and ativo and revogado_em is null;
  v_token := encode(extensions.gen_random_bytes(32), 'hex');
  insert into public.acessos_responsavel
    (paciente_id, token_hash, descricao, criado_por, expira_em, escopo)
  values
    (p_paciente_id, extensions.digest(convert_to(v_token, 'UTF8'), 'sha256'),
     coalesce(nullif(trim(p_descricao), ''), 'Responsável'), auth.uid(),
     case when p_validade_dias is null then null else now() + make_interval(days => p_validade_dias) end,
     p_escopo)
  returning acessos_responsavel.id, acessos_responsavel.criado_em, acessos_responsavel.expira_em
  into v_id, v_criado, v_expira;
  return query select v_id, v_token, v_criado, v_expira;
end
$$;

create or replace function public.obter_acompanhamento_responsavel(p_token text)
returns jsonb language plpgsql security definer
set search_path = 'pg_catalog', 'public', 'extensions'
set row_security = off as $$
declare v_acesso public.acessos_responsavel%rowtype; v_resultado jsonb;
begin
  if p_token is null or length(p_token)<40 or length(p_token)>100 then return null; end if;
  select * into v_acesso from public.acessos_responsavel a
  where a.token_hash=extensions.digest(convert_to(p_token,'UTF8'),'sha256')
    and a.ativo and a.revogado_em is null and (a.expira_em is null or a.expira_em>now()) for update;
  if not found then return null; end if;
  update public.acessos_responsavel set ultimo_acesso_em=now() where id=v_acesso.id;
  select jsonb_build_object(
    'primeiro_nome',split_part(trim(p.nome_completo),' ',1),
    'ultima_atualizacao',(select max(at.data) from public.atendimentos at
      where at.paciente_id=p.id and at.deleted_at is null
        and (v_acesso.escopo='equipe' or at.psicologo_id=v_acesso.criado_por)),
    'habilidades',coalesce((select jsonb_agg(jsonb_build_object(
      'nome',h.nome,'avaliacoes',coalesce((select jsonb_agg(jsonb_build_object(
        'data',at.data,'codigo',n.codigo,'valor',n.valor) order by at.data,at.created_at,at.id)
        from public.atendimentos at join public.niveis_avaliacao n on n.id=at.nivel_avaliacao_id
        where at.paciente_id=ph.paciente_id and at.habilidade_id=ph.habilidade_id
          and at.deleted_at is null and at.data>=current_date-interval '1 year'
          and (v_acesso.escopo='equipe' or at.psicologo_id=v_acesso.criado_por)),'[]'::jsonb)
      ) order by h.nome) from public.paciente_habilidades ph join public.habilidades h on h.id=ph.habilidade_id
      where ph.paciente_id=p.id and ph.ativo),'[]'::jsonb)
  ) into v_resultado from public.pacientes p where p.id=v_acesso.paciente_id;
  return v_resultado;
end $$;

revoke all on function public.criar_acesso_responsavel(uuid, integer, text, text) from public;
grant execute on function public.criar_acesso_responsavel(uuid, integer, text, text) to authenticated;
revoke all on function public.obter_acompanhamento_responsavel(text) from public;
grant execute on function public.obter_acompanhamento_responsavel(text) to anon, authenticated;

notify pgrst, 'reload schema';
