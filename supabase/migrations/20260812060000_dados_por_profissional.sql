-- Isola habilidades e compartilhamentos por profissional, preservando a visao
-- agregada da equipe apenas quando ela for explicitamente selecionada.

alter table public.paciente_habilidades
  add column if not exists profissional_id uuid references public.profiles(id) on delete restrict;

update public.paciente_habilidades ph
set profissional_id = coalesce(
  (select a.psicologo_id from public.atendimentos a
   where a.paciente_id = ph.paciente_id and a.habilidade_id = ph.habilidade_id
   order by a.data, a.created_at, a.id limit 1),
  (select p.criado_por from public.pacientes p where p.id = ph.paciente_id)
)
where ph.profissional_id is null;

alter table public.paciente_habilidades alter column profissional_id set not null;
alter table public.paciente_habilidades drop constraint if exists paciente_habilidades_paciente_id_habilidade_id_key;
create unique index if not exists paciente_habilidades_profissional_uidx
  on public.paciente_habilidades (paciente_id, habilidade_id, profissional_id);

insert into public.paciente_habilidades
  (paciente_id, habilidade_id, profissional_id, peso, ativo, iniciado_em)
select a.paciente_id, a.habilidade_id, a.psicologo_id, 1, true, min(a.data)
from public.atendimentos a
where a.psicologo_id is not null
group by a.paciente_id, a.habilidade_id, a.psicologo_id
on conflict (paciente_id, habilidade_id, profissional_id) do nothing;

drop policy if exists paciente_habilidades_insert on public.paciente_habilidades;
drop policy if exists paciente_habilidades_update on public.paciente_habilidades;
create policy paciente_habilidades_insert on public.paciente_habilidades for insert to authenticated
  with check (public.usuario_admin() or
    (profissional_id = auth.uid() and public.usuario_vinculado(paciente_id)));
create policy paciente_habilidades_update on public.paciente_habilidades for update to authenticated
  using (public.usuario_admin() or profissional_id = auth.uid())
  with check (public.usuario_admin() or
    (profissional_id = auth.uid() and public.usuario_vinculado(paciente_id)));

create or replace function public.preservar_identidade_paciente_habilidade()
returns trigger language plpgsql set search_path = '' as $$
begin
  if new.paciente_id <> old.paciente_id or new.habilidade_id <> old.habilidade_id
     or new.profissional_id <> old.profissional_id then
    raise exception 'patient_skill_identity_is_immutable' using errcode = '22023';
  end if;
  return new;
end
$$;

create or replace function public.garantir_paciente_habilidade()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if not (public.usuario_admin() or
      (new.psicologo_id = auth.uid() and public.usuario_vinculado(new.paciente_id))) then
    raise exception 'unauthorized' using errcode = '42501';
  end if;
  insert into public.paciente_habilidades
    (paciente_id, habilidade_id, profissional_id, peso, iniciado_em, ativo)
  values (new.paciente_id, new.habilidade_id, new.psicologo_id, 1, new.data, true)
  on conflict (paciente_id, habilidade_id, profissional_id)
  do update set ativo = true;
  return new;
end
$$;

drop index if exists public.acessos_responsavel_um_ativo_uidx;
with ativos_ordenados as (
  select id, row_number() over
    (partition by paciente_id, criado_por order by criado_em desc, id desc) as ordem
  from public.acessos_responsavel where ativo and revogado_em is null
)
update public.acessos_responsavel a set ativo = false, revogado_em = now()
from ativos_ordenados o where a.id = o.id and o.ordem > 1;
create unique index if not exists acessos_responsavel_um_ativo_profissional_uidx
  on public.acessos_responsavel (paciente_id, criado_por)
  where ativo and revogado_em is null;

create or replace function public.criar_acesso_responsavel(
  p_paciente_id uuid, p_validade_dias integer default null,
  p_descricao text default 'Responsavel', p_escopo text default 'profissional'
)
returns table (id uuid, token text, criado_em timestamptz, expira_em timestamptz)
language plpgsql security definer
set search_path = 'pg_catalog', 'public', 'extensions' as $$
declare v_token text; v_id uuid; v_criado timestamptz; v_expira timestamptz;
begin
  if auth.uid() is null or not public.usuario_vinculado(p_paciente_id) then
    raise exception 'unauthorized' using errcode = '42501';
  end if;
  if p_validade_dias is not null and p_validade_dias not in (7,30,90) then
    raise exception 'invalid_expiration' using errcode = '22023';
  end if;
  if p_escopo not in ('profissional','equipe') then
    raise exception 'invalid_scope' using errcode = '22023';
  end if;
  perform pg_advisory_xact_lock(hashtextextended(p_paciente_id::text || auth.uid()::text, 0));
  update public.acessos_responsavel set ativo=false, revogado_em=coalesce(revogado_em,now())
  where paciente_id=p_paciente_id and criado_por=auth.uid() and ativo and revogado_em is null;
  v_token := encode(extensions.gen_random_bytes(32),'hex');
  insert into public.acessos_responsavel
    (paciente_id,token_hash,descricao,criado_por,expira_em,escopo)
  values (p_paciente_id,extensions.digest(convert_to(v_token,'UTF8'),'sha256'),
    coalesce(nullif(trim(p_descricao),''),'Responsavel'),auth.uid(),
    case when p_validade_dias is null then null else now()+make_interval(days=>p_validade_dias) end,p_escopo)
  returning acessos_responsavel.id,acessos_responsavel.criado_em,acessos_responsavel.expira_em
  into v_id,v_criado,v_expira;
  return query select v_id,v_token,v_criado,v_expira;
end $$;

drop function if exists public.listar_acessos_responsavel(uuid);
create function public.listar_acessos_responsavel(p_paciente_id uuid)
returns table (id uuid, descricao text, criado_em timestamptz, expira_em timestamptz,
  revogado_em timestamptz, ultimo_acesso_em timestamptz, ativo boolean, escopo text)
language sql stable security definer set search_path='pg_catalog','public' as $$
  select a.id,a.descricao,a.criado_em,a.expira_em,a.revogado_em,a.ultimo_acesso_em,a.ativo,a.escopo
  from public.acessos_responsavel a
  where a.paciente_id=p_paciente_id and a.criado_por=auth.uid()
    and public.usuario_vinculado(p_paciente_id)
  order by a.criado_em desc
$$;

create or replace function public.revogar_acesso_responsavel(p_acesso_id uuid)
returns void language plpgsql security definer set search_path='pg_catalog','public' as $$
begin
  update public.acessos_responsavel set ativo=false,revogado_em=coalesce(revogado_em,now())
  where id=p_acesso_id and (criado_por=auth.uid() or public.usuario_admin());
  if not found then raise exception 'unauthorized' using errcode='42501'; end if;
end $$;

create or replace function public.obter_acompanhamento_responsavel(p_token text)
returns jsonb language plpgsql security definer
set search_path='pg_catalog','public','extensions' set row_security=off as $$
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
        where at.paciente_id=p.id and at.habilidade_id=h.id and at.deleted_at is null
          and at.data>=current_date-interval '1 year'
          and (v_acesso.escopo='equipe' or at.psicologo_id=v_acesso.criado_por)),'[]'::jsonb))
      order by h.nome) from public.habilidades h where exists (
        select 1 from public.paciente_habilidades ph where ph.paciente_id=p.id
          and ph.habilidade_id=h.id and ph.ativo
          and (v_acesso.escopo='equipe' or ph.profissional_id=v_acesso.criado_por))), '[]'::jsonb)
  ) into v_resultado from public.pacientes p where p.id=v_acesso.paciente_id;
  return v_resultado;
end $$;

revoke all on function public.listar_acessos_responsavel(uuid) from public;
grant execute on function public.listar_acessos_responsavel(uuid) to authenticated;

notify pgrst, 'reload schema';
