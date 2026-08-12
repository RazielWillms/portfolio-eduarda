-- Ciclo 8: planos de apoio comportamental versionados para alvos de reducao.
create table if not exists public.planos_apoio_comportamental_alvo (
  id uuid primary key default gen_random_uuid(),
  alvo_id uuid not null references public.alvos_clinicos(id) on delete restrict,
  versao integer not null check (versao>0),
  funcao_assumida text not null check (funcao_assumida in ('atencao','fuga_esquiva','acesso_tangivel','automatica','multipla','indeterminada')),
  justificativa_funcional text not null check (length(trim(justificativa_funcional))>=10),
  estrategias_antecedentes text not null check (length(trim(estrategias_antecedentes))>=3),
  comportamento_substitutivo text not null check (length(trim(comportamento_substitutivo))>=3),
  procedimento_ensino_substitutivo text not null check (length(trim(procedimento_ensino_substitutivo))>=3),
  estrategias_consequentes text not null check (length(trim(estrategias_consequentes))>=3),
  plano_seguranca text,
  criterios_revisao text not null check (length(trim(criterios_revisao))>=3),
  criado_por uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  unique(alvo_id,versao)
);
create index if not exists planos_apoio_comportamental_alvo_idx on public.planos_apoio_comportamental_alvo(alvo_id,versao desc);

create or replace function public.criar_plano_apoio_comportamental(p_alvo_id uuid,p_funcao_assumida text,p_justificativa_funcional text,p_estrategias_antecedentes text,p_comportamento_substitutivo text,p_procedimento_ensino_substitutivo text,p_estrategias_consequentes text,p_plano_seguranca text,p_criterios_revisao text)
returns integer language plpgsql security definer set search_path='pg_catalog','public' set row_security=off as $$
declare v_versao integer;
begin
  if not public.usuario_pode_editar_alvo(p_alvo_id) or not exists(select 1 from public.alvos_clinicos where id=p_alvo_id and natureza='reducao') then raise exception 'unauthorized_or_invalid_reduction_target' using errcode='42501'; end if;
  if p_funcao_assumida not in ('atencao','fuga_esquiva','acesso_tangivel','automatica','multipla','indeterminada') or length(trim(p_justificativa_funcional))<10 or length(trim(p_estrategias_antecedentes))<3 or length(trim(p_comportamento_substitutivo))<3 or length(trim(p_procedimento_ensino_substitutivo))<3 or length(trim(p_estrategias_consequentes))<3 or length(trim(p_criterios_revisao))<3 then raise exception 'invalid_behavior_support_plan' using errcode='22023'; end if;
  perform pg_advisory_xact_lock(hashtextextended(p_alvo_id::text,0));
  select coalesce(max(versao),0)+1 into v_versao from public.planos_apoio_comportamental_alvo where alvo_id=p_alvo_id;
  insert into public.planos_apoio_comportamental_alvo(alvo_id,versao,funcao_assumida,justificativa_funcional,estrategias_antecedentes,comportamento_substitutivo,procedimento_ensino_substitutivo,estrategias_consequentes,plano_seguranca,criterios_revisao,criado_por)
  values(p_alvo_id,v_versao,p_funcao_assumida,trim(p_justificativa_funcional),trim(p_estrategias_antecedentes),trim(p_comportamento_substitutivo),trim(p_procedimento_ensino_substitutivo),trim(p_estrategias_consequentes),nullif(trim(p_plano_seguranca),''),trim(p_criterios_revisao),auth.uid());
  return v_versao;
end $$;
alter table public.planos_apoio_comportamental_alvo enable row level security;
alter table public.planos_apoio_comportamental_alvo force row level security;
drop policy if exists planos_apoio_comportamental_select on public.planos_apoio_comportamental_alvo;
create policy planos_apoio_comportamental_select on public.planos_apoio_comportamental_alvo for select to authenticated using (public.usuario_admin() or exists(select 1 from public.alvos_clinicos a where a.id=alvo_id and a.profissional_id=auth.uid()));

create or replace function public.auditar_plano_apoio_comportamental() returns trigger language plpgsql security definer set search_path='' as $$
begin insert into public.audit_logs(user_id,action,entity_type,entity_id,metadata) values(auth.uid(),'PLANO_APOIO_COMPORTAMENTAL_INSERT','planos_apoio_comportamental_alvo',new.id,jsonb_build_object('alvo_id',new.alvo_id,'versao',new.versao,'funcao_assumida',new.funcao_assumida)); return new; end $$;
drop trigger if exists audit_planos_apoio_comportamental on public.planos_apoio_comportamental_alvo;
create trigger audit_planos_apoio_comportamental after insert on public.planos_apoio_comportamental_alvo for each row execute function public.auditar_plano_apoio_comportamental();
revoke all on function public.criar_plano_apoio_comportamental(uuid,text,text,text,text,text,text,text,text) from public;
grant execute on function public.criar_plano_apoio_comportamental(uuid,text,text,text,text,text,text,text,text) to authenticated;
revoke all on function public.auditar_plano_apoio_comportamental() from public;
notify pgrst,'reload schema';
