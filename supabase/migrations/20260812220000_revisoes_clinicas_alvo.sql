-- Ciclo 9: revisoes clinicas versionadas com snapshot de evidencias calculado no servidor.
create table if not exists public.revisoes_clinicas_alvo (
  id uuid primary key default gen_random_uuid(),
  alvo_id uuid not null references public.alvos_clinicos(id) on delete restrict,
  profissional_id uuid not null references public.profiles(id) on delete restrict,
  periodo_inicio date not null,
  periodo_fim date not null check (periodo_fim>=periodo_inicio),
  decisao text not null check (decisao in ('manter','modificar_protocolo','coletar_mais_dados','avancar_fase','retornar_fase','pausar','encerrar')),
  justificativa text not null check (length(trim(justificativa))>=10),
  evidencias_snapshot jsonb not null check (jsonb_typeof(evidencias_snapshot)='object'),
  proxima_revisao_em date,
  created_at timestamptz not null default now()
);
create index if not exists revisoes_clinicas_alvo_idx on public.revisoes_clinicas_alvo(alvo_id,created_at desc);
alter table public.revisoes_clinicas_alvo enable row level security;
alter table public.revisoes_clinicas_alvo force row level security;
drop policy if exists revisoes_clinicas_select on public.revisoes_clinicas_alvo;
create policy revisoes_clinicas_select on public.revisoes_clinicas_alvo for select to authenticated using (public.usuario_admin() or profissional_id=auth.uid());

create or replace function public.criar_revisao_clinica_alvo(p_alvo_id uuid,p_periodo_inicio date,p_periodo_fim date,p_decisao text,p_justificativa text,p_proxima_revisao_em date)
returns uuid language plpgsql security definer set search_path='pg_catalog','public' set row_security=off as $$
declare v_id uuid; v_medicoes integer; v_sessoes integer; v_abc integer; v_integridade numeric; v_primeira date; v_ultima date;
begin
  if not public.usuario_pode_editar_alvo(p_alvo_id) then raise exception 'unauthorized' using errcode='42501'; end if;
  if p_periodo_inicio is null or p_periodo_fim<p_periodo_inicio or p_decisao not in ('manter','modificar_protocolo','coletar_mais_dados','avancar_fase','retornar_fase','pausar','encerrar') or length(trim(p_justificativa))<10 or (p_proxima_revisao_em is not null and p_proxima_revisao_em<=p_periodo_fim) then raise exception 'invalid_clinical_review' using errcode='22023'; end if;
  select count(r.id),count(distinct s.id),min(s.data),max(s.data),round(avg(case when i.itens_previstos>0 then i.itens_realizados*100.0/i.itens_previstos end),2)
  into v_medicoes,v_sessoes,v_primeira,v_ultima,v_integridade from public.registros_medicao r join public.sessoes_clinicas s on s.id=r.sessao_id left join public.integridade_procedimental i on i.registro_medicao_id=r.id
  where r.alvo_id=p_alvo_id and s.profissional_id=auth.uid() and s.data between p_periodo_inicio and p_periodo_fim;
  select count(*) into v_abc from public.observacoes_abc o join public.sessoes_clinicas s on s.id=o.sessao_id where o.alvo_id=p_alvo_id and s.profissional_id=auth.uid() and s.data between p_periodo_inicio and p_periodo_fim;
  insert into public.revisoes_clinicas_alvo(alvo_id,profissional_id,periodo_inicio,periodo_fim,decisao,justificativa,evidencias_snapshot,proxima_revisao_em)
  values(p_alvo_id,auth.uid(),p_periodo_inicio,p_periodo_fim,p_decisao,trim(p_justificativa),jsonb_build_object('medicoes',v_medicoes,'sessoes',v_sessoes,'primeira_sessao',v_primeira,'ultima_sessao',v_ultima,'integridade_media_percentual',v_integridade,'observacoes_abc',v_abc),p_proxima_revisao_em) returning id into v_id;
  return v_id;
end $$;

create or replace function public.auditar_revisao_clinica() returns trigger language plpgsql security definer set search_path='' as $$
begin insert into public.audit_logs(user_id,action,entity_type,entity_id,metadata) values(auth.uid(),'REVISAO_CLINICA_INSERT','revisoes_clinicas_alvo',new.id,jsonb_build_object('alvo_id',new.alvo_id,'profissional_id',new.profissional_id,'periodo_inicio',new.periodo_inicio,'periodo_fim',new.periodo_fim,'decisao',new.decisao)); return new; end $$;
drop trigger if exists audit_revisoes_clinicas_alvo on public.revisoes_clinicas_alvo;
create trigger audit_revisoes_clinicas_alvo after insert on public.revisoes_clinicas_alvo for each row execute function public.auditar_revisao_clinica();
revoke all on function public.criar_revisao_clinica_alvo(uuid,date,date,text,text,date) from public;
grant execute on function public.criar_revisao_clinica_alvo(uuid,date,date,text,text,date) to authenticated;
revoke all on function public.auditar_revisao_clinica() from public;
notify pgrst,'reload schema';
