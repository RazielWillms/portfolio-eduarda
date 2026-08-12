-- Ciclo 5: protocolos de intervencao versionados e rastreaveis por medicao.
create table if not exists public.protocolos_intervencao_alvo (
  id uuid primary key default gen_random_uuid(),
  alvo_id uuid not null references public.alvos_clinicos(id) on delete restrict,
  versao integer not null check (versao>0),
  estrategia_ensino text not null check (estrategia_ensino in ('tentativas_discretas','ensino_naturalistico','encadeamento','modelacao','treino_comunicacao_funcional','outro')),
  hierarquia_ajuda text not null,
  procedimento_esvanecimento text,
  reforcadores text not null,
  esquema_reforcamento text not null,
  correcao_erro text not null,
  instrucoes_aplicacao text,
  criado_por uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  unique(alvo_id,versao)
);
create index if not exists protocolos_intervencao_alvo_idx on public.protocolos_intervencao_alvo(alvo_id,versao desc);

create or replace function public.criar_protocolo_intervencao_alvo(p_alvo_id uuid,p_estrategia_ensino text,p_hierarquia_ajuda text,p_procedimento_esvanecimento text,p_reforcadores text,p_esquema_reforcamento text,p_correcao_erro text,p_instrucoes_aplicacao text)
returns integer language plpgsql security definer set search_path='pg_catalog','public' set row_security=off as $$
declare v_versao integer;
begin
  if not public.usuario_pode_editar_alvo(p_alvo_id) then raise exception 'unauthorized' using errcode='42501'; end if;
  if p_estrategia_ensino not in ('tentativas_discretas','ensino_naturalistico','encadeamento','modelacao','treino_comunicacao_funcional','outro') or length(trim(p_hierarquia_ajuda))<3 or length(trim(p_reforcadores))<2 or length(trim(p_esquema_reforcamento))<2 or length(trim(p_correcao_erro))<3 then raise exception 'invalid_intervention_protocol' using errcode='22023'; end if;
  perform pg_advisory_xact_lock(hashtextextended(p_alvo_id::text,0));
  select coalesce(max(versao),0)+1 into v_versao from public.protocolos_intervencao_alvo where alvo_id=p_alvo_id;
  insert into public.protocolos_intervencao_alvo(alvo_id,versao,estrategia_ensino,hierarquia_ajuda,procedimento_esvanecimento,reforcadores,esquema_reforcamento,correcao_erro,instrucoes_aplicacao,criado_por)
  values(p_alvo_id,v_versao,p_estrategia_ensino,trim(p_hierarquia_ajuda),nullif(trim(p_procedimento_esvanecimento),''),trim(p_reforcadores),trim(p_esquema_reforcamento),trim(p_correcao_erro),nullif(trim(p_instrucoes_aplicacao),''),auth.uid());
  return v_versao;
end $$;

alter table public.protocolos_intervencao_alvo enable row level security;
alter table public.protocolos_intervencao_alvo force row level security;
drop policy if exists protocolos_intervencao_select on public.protocolos_intervencao_alvo;
create policy protocolos_intervencao_select on public.protocolos_intervencao_alvo for select to authenticated using (public.usuario_admin() or exists(select 1 from public.alvos_clinicos a where a.id=alvo_id and a.profissional_id=auth.uid()));
alter table public.registros_medicao add column if not exists protocolo_intervencao_id uuid references public.protocolos_intervencao_alvo(id) on delete restrict;

create or replace function public.vincular_protocolo_vigente_medicao()
returns trigger language plpgsql security definer set search_path='pg_catalog','public' as $$
begin
  if new.protocolo_intervencao_id is null then select p.id into new.protocolo_intervencao_id from public.protocolos_intervencao_alvo p where p.alvo_id=new.alvo_id order by p.versao desc limit 1; end if;
  return new;
end $$;
drop trigger if exists vincular_protocolo_vigente_medicao on public.registros_medicao;
create trigger vincular_protocolo_vigente_medicao before insert on public.registros_medicao for each row execute function public.vincular_protocolo_vigente_medicao();
create or replace function public.auditar_protocolo_intervencao()
returns trigger language plpgsql security definer set search_path='' as $$
begin
  insert into public.audit_logs(user_id,action,entity_type,entity_id,metadata)
  values(auth.uid(),'PROTOCOLO_INTERVENCAO_INSERT','protocolos_intervencao_alvo',new.id,jsonb_build_object('alvo_id',new.alvo_id,'versao',new.versao,'estrategia_ensino',new.estrategia_ensino));
  return new;
end $$;
drop trigger if exists audit_protocolos_intervencao_alvo on public.protocolos_intervencao_alvo;
create trigger audit_protocolos_intervencao_alvo after insert on public.protocolos_intervencao_alvo for each row execute function public.auditar_protocolo_intervencao();
revoke all on function public.criar_protocolo_intervencao_alvo(uuid,text,text,text,text,text,text,text) from public;
grant execute on function public.criar_protocolo_intervencao_alvo(uuid,text,text,text,text,text,text,text) to authenticated;
revoke all on function public.vincular_protocolo_vigente_medicao() from public;
revoke all on function public.auditar_protocolo_intervencao() from public;
notify pgrst,'reload schema';
