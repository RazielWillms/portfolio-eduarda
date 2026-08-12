-- Sintese versionada da avaliacao inicial por profissional.
create table if not exists public.sinteses_avaliacao_inicial (
  id uuid primary key default gen_random_uuid(),
  paciente_id uuid not null references public.pacientes(id) on delete restrict,
  profissional_id uuid not null references public.profiles(id) on delete restrict,
  versao integer not null check (versao > 0),
  status text not null check (status in ('rascunho','concluida')),
  periodo_inicio date not null,
  periodo_fim date not null,
  fontes_informacao text not null check (length(trim(fontes_informacao)) >= 3),
  potencialidades text not null check (length(trim(potencialidades)) >= 3),
  necessidades_identificadas text not null check (length(trim(necessidades_identificadas)) >= 3),
  prioridades_recomendadas text not null check (length(trim(prioridades_recomendadas)) >= 3),
  recomendacoes_iniciais text,
  conclusao text,
  sessoes_consideradas uuid[] not null default '{}',
  created_at timestamptz not null default now(),
  unique (paciente_id, profissional_id, versao),
  check (periodo_fim >= periodo_inicio),
  check (status = 'rascunho' or length(trim(coalesce(conclusao,''))) >= 3)
);
create index if not exists sinteses_avaliacao_paciente_profissional_idx on public.sinteses_avaliacao_inicial(paciente_id,profissional_id,versao desc);
alter table public.sinteses_avaliacao_inicial enable row level security;
alter table public.sinteses_avaliacao_inicial force row level security;
drop policy if exists sinteses_avaliacao_select on public.sinteses_avaliacao_inicial;
create policy sinteses_avaliacao_select on public.sinteses_avaliacao_inicial for select to authenticated
using (profissional_id=auth.uid() and public.usuario_ativo() and public.usuario_vinculado(paciente_id));

create or replace function public.registrar_sintese_avaliacao_inicial(
  p_paciente_id uuid,p_status text,p_periodo_inicio date,p_periodo_fim date,
  p_fontes_informacao text,p_potencialidades text,p_necessidades_identificadas text,
  p_prioridades_recomendadas text,p_recomendacoes_iniciais text,p_conclusao text,
  p_sessoes_consideradas uuid[] default '{}'
) returns uuid language plpgsql security definer set search_path='pg_catalog','public' set row_security=off as $$
declare v_id uuid; v_versao integer; v_sessoes uuid[]:=coalesce(p_sessoes_consideradas,'{}'::uuid[]);
begin
  if not public.usuario_ativo() or not public.usuario_vinculado(p_paciente_id) then raise exception 'unauthorized' using errcode='42501'; end if;
  if p_status not in ('rascunho','concluida') or p_periodo_inicio is null or p_periodo_fim is null or p_periodo_fim<p_periodo_inicio
    or length(trim(coalesce(p_fontes_informacao,'')))<3 or length(trim(coalesce(p_potencialidades,'')))<3
    or length(trim(coalesce(p_necessidades_identificadas,'')))<3 or length(trim(coalesce(p_prioridades_recomendadas,'')))<3
    or (p_status='concluida' and length(trim(coalesce(p_conclusao,'')))<3)
  then raise exception 'invalid_assessment_summary' using errcode='22023'; end if;
  if cardinality(v_sessoes)<>(select count(distinct x) from unnest(v_sessoes) x) then raise exception 'duplicate_assessment_session' using errcode='22023'; end if;
  if exists(select 1 from unnest(v_sessoes) sid where not exists(
    select 1 from public.sessoes_clinicas s where s.id=sid and s.paciente_id=p_paciente_id and s.profissional_id=auth.uid()
      and s.deleted_at is null and s.finalidade in ('vinculo_acolhimento','entrevista_responsaveis','avaliacao_inicial','observacao_clinica','orientacao_equipe')
  )) then raise exception 'invalid_assessment_session' using errcode='42501'; end if;
  perform pg_advisory_xact_lock(hashtext(p_paciente_id::text||auth.uid()::text));
  select coalesce(max(versao),0)+1 into v_versao from public.sinteses_avaliacao_inicial where paciente_id=p_paciente_id and profissional_id=auth.uid();
  insert into public.sinteses_avaliacao_inicial(paciente_id,profissional_id,versao,status,periodo_inicio,periodo_fim,fontes_informacao,potencialidades,necessidades_identificadas,prioridades_recomendadas,recomendacoes_iniciais,conclusao,sessoes_consideradas)
  values(p_paciente_id,auth.uid(),v_versao,p_status,p_periodo_inicio,p_periodo_fim,trim(p_fontes_informacao),trim(p_potencialidades),trim(p_necessidades_identificadas),trim(p_prioridades_recomendadas),nullif(trim(p_recomendacoes_iniciais),''),nullif(trim(p_conclusao),''),v_sessoes)
  returning id into v_id;
  return v_id;
end $$;

create or replace function public.auditar_sintese_avaliacao_inicial() returns trigger language plpgsql security definer set search_path='' as $$
begin insert into public.audit_logs(user_id,action,entity_type,entity_id,metadata) values(auth.uid(),'SINTESE_AVALIACAO_INSERT','sinteses_avaliacao_inicial',new.id,jsonb_build_object('paciente_id',new.paciente_id,'profissional_id',new.profissional_id,'versao',new.versao,'status',new.status,'sessoes_consideradas',cardinality(new.sessoes_consideradas))); return new; end $$;
drop trigger if exists audit_sinteses_avaliacao_inicial on public.sinteses_avaliacao_inicial;
create trigger audit_sinteses_avaliacao_inicial after insert on public.sinteses_avaliacao_inicial for each row execute function public.auditar_sintese_avaliacao_inicial();
revoke all on function public.registrar_sintese_avaliacao_inicial(uuid,text,date,date,text,text,text,text,text,text,uuid[]) from public;
grant execute on function public.registrar_sintese_avaliacao_inicial(uuid,text,date,date,text,text,text,text,text,text,uuid[]) to authenticated;
revoke all on function public.auditar_sintese_avaliacao_inicial() from public;
notify pgrst,'reload schema';
