-- Ciclo 11: capacitacao de aplicadores e competencia observada.
create table if not exists public.capacitacoes_aplicadores (
  id uuid primary key default gen_random_uuid(),
  paciente_id uuid not null references public.pacientes(id) on delete restrict,
  alvo_id uuid references public.alvos_clinicos(id) on delete restrict,
  profissional_id uuid not null references public.profiles(id) on delete restrict,
  participante_tipo text not null check (participante_tipo in ('cuidador','educador','profissional','equipe')),
  habilidades_treinadas text not null check (length(trim(habilidades_treinadas))>=3),
  instrucao_realizada boolean not null,
  modelacao_realizada boolean not null,
  ensaio_realizado boolean not null,
  feedback_realizado boolean not null,
  competencia_percentual numeric not null check (competencia_percentual between 0 and 100),
  criterio_competencia text not null check (length(trim(criterio_competencia))>=3),
  observacoes text,
  acompanhamento_em date,
  realizado_em date not null default current_date,
  created_at timestamptz not null default now()
);
create index if not exists capacitacoes_aplicadores_paciente_idx on public.capacitacoes_aplicadores(paciente_id,realizado_em desc);
alter table public.capacitacoes_aplicadores enable row level security;
alter table public.capacitacoes_aplicadores force row level security;
drop policy if exists capacitacoes_aplicadores_select on public.capacitacoes_aplicadores;
create policy capacitacoes_aplicadores_select on public.capacitacoes_aplicadores for select to authenticated using (public.usuario_admin() or profissional_id=auth.uid());

create or replace function public.registrar_capacitacao_aplicador(p_paciente_id uuid,p_alvo_id uuid,p_participante_tipo text,p_habilidades_treinadas text,p_instrucao_realizada boolean,p_modelacao_realizada boolean,p_ensaio_realizado boolean,p_feedback_realizado boolean,p_competencia_percentual numeric,p_criterio_competencia text,p_observacoes text,p_acompanhamento_em date,p_realizado_em date)
returns uuid language plpgsql security definer set search_path='pg_catalog','public' set row_security=off as $$
declare v_id uuid;
begin
  if not public.usuario_vinculado(p_paciente_id) or (p_alvo_id is not null and not exists(select 1 from public.alvos_clinicos a join public.objetivos_clinicos o on o.id=a.objetivo_id join public.planos_clinicos p on p.id=o.plano_id where a.id=p_alvo_id and p.paciente_id=p_paciente_id and a.profissional_id=auth.uid())) then raise exception 'unauthorized' using errcode='42501'; end if;
  if p_participante_tipo not in ('cuidador','educador','profissional','equipe') or length(trim(p_habilidades_treinadas))<3 or p_competencia_percentual not between 0 and 100 or length(trim(p_criterio_competencia))<3 or p_realizado_em is null or (p_acompanhamento_em is not null and p_acompanhamento_em<p_realizado_em) then raise exception 'invalid_implementer_training' using errcode='22023'; end if;
  insert into public.capacitacoes_aplicadores(paciente_id,alvo_id,profissional_id,participante_tipo,habilidades_treinadas,instrucao_realizada,modelacao_realizada,ensaio_realizado,feedback_realizado,competencia_percentual,criterio_competencia,observacoes,acompanhamento_em,realizado_em)
  values(p_paciente_id,p_alvo_id,auth.uid(),p_participante_tipo,trim(p_habilidades_treinadas),p_instrucao_realizada,p_modelacao_realizada,p_ensaio_realizado,p_feedback_realizado,p_competencia_percentual,trim(p_criterio_competencia),nullif(trim(p_observacoes),''),p_acompanhamento_em,p_realizado_em) returning id into v_id;
  return v_id;
end $$;
create or replace function public.auditar_capacitacao_aplicador() returns trigger language plpgsql security definer set search_path='' as $$
begin insert into public.audit_logs(user_id,action,entity_type,entity_id,metadata) values(auth.uid(),'CAPACITACAO_APLICADOR_INSERT','capacitacoes_aplicadores',new.id,jsonb_build_object('paciente_id',new.paciente_id,'alvo_id',new.alvo_id,'profissional_id',new.profissional_id,'participante_tipo',new.participante_tipo,'competencia_percentual',new.competencia_percentual,'realizado_em',new.realizado_em)); return new; end $$;
drop trigger if exists audit_capacitacoes_aplicadores on public.capacitacoes_aplicadores;
create trigger audit_capacitacoes_aplicadores after insert on public.capacitacoes_aplicadores for each row execute function public.auditar_capacitacao_aplicador();
revoke all on function public.registrar_capacitacao_aplicador(uuid,uuid,text,text,boolean,boolean,boolean,boolean,numeric,text,text,date,date) from public;
grant execute on function public.registrar_capacitacao_aplicador(uuid,uuid,text,text,boolean,boolean,boolean,boolean,numeric,text,text,date,date) to authenticated;
revoke all on function public.auditar_capacitacao_aplicador() from public;
notify pgrst,'reload schema';
