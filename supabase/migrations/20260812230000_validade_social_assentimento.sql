-- Ciclo 10: validade social e assentimento observavel, sem inferir consentimento.
create table if not exists public.registros_validade_social (
  id uuid primary key default gen_random_uuid(),
  paciente_id uuid not null references public.pacientes(id) on delete restrict,
  alvo_id uuid references public.alvos_clinicos(id) on delete restrict,
  profissional_id uuid not null references public.profiles(id) on delete restrict,
  respondente_tipo text not null check (respondente_tipo in ('paciente','responsavel','profissional','equipe')),
  objetivo_relevante boolean not null,
  aceitabilidade smallint not null check (aceitabilidade between 1 and 5),
  viabilidade smallint not null check (viabilidade between 1 and 5),
  beneficio_percebido smallint not null check (beneficio_percebido between 1 and 5),
  assentimento_observado text not null check (assentimento_observado in ('aceite','recusa','ambivalente','nao_observado','nao_aplicavel')),
  relato text not null check (length(trim(relato))>=3),
  adaptacoes_necessarias text,
  registrado_em date not null default current_date,
  created_at timestamptz not null default now()
);
create index if not exists validade_social_paciente_data_idx on public.registros_validade_social(paciente_id,registrado_em desc);
alter table public.registros_validade_social enable row level security;
alter table public.registros_validade_social force row level security;
drop policy if exists validade_social_select on public.registros_validade_social;
create policy validade_social_select on public.registros_validade_social for select to authenticated using (public.usuario_admin() or profissional_id=auth.uid());

create or replace function public.registrar_validade_social(p_paciente_id uuid,p_alvo_id uuid,p_respondente_tipo text,p_objetivo_relevante boolean,p_aceitabilidade integer,p_viabilidade integer,p_beneficio_percebido integer,p_assentimento_observado text,p_relato text,p_adaptacoes_necessarias text,p_registrado_em date)
returns uuid language plpgsql security definer set search_path='pg_catalog','public' set row_security=off as $$
declare v_id uuid;
begin
  if not public.usuario_vinculado(p_paciente_id) or (p_alvo_id is not null and not exists(select 1 from public.alvos_clinicos a join public.objetivos_clinicos o on o.id=a.objetivo_id join public.planos_clinicos p on p.id=o.plano_id where a.id=p_alvo_id and p.paciente_id=p_paciente_id and a.profissional_id=auth.uid())) then raise exception 'unauthorized' using errcode='42501'; end if;
  if p_respondente_tipo not in ('paciente','responsavel','profissional','equipe') or p_aceitabilidade not between 1 and 5 or p_viabilidade not between 1 and 5 or p_beneficio_percebido not between 1 and 5 or p_assentimento_observado not in ('aceite','recusa','ambivalente','nao_observado','nao_aplicavel') or length(trim(p_relato))<3 or p_registrado_em is null then raise exception 'invalid_social_validity' using errcode='22023'; end if;
  insert into public.registros_validade_social(paciente_id,alvo_id,profissional_id,respondente_tipo,objetivo_relevante,aceitabilidade,viabilidade,beneficio_percebido,assentimento_observado,relato,adaptacoes_necessarias,registrado_em)
  values(p_paciente_id,p_alvo_id,auth.uid(),p_respondente_tipo,p_objetivo_relevante,p_aceitabilidade,p_viabilidade,p_beneficio_percebido,p_assentimento_observado,trim(p_relato),nullif(trim(p_adaptacoes_necessarias),''),p_registrado_em) returning id into v_id;
  return v_id;
end $$;
create or replace function public.auditar_validade_social() returns trigger language plpgsql security definer set search_path='' as $$
begin insert into public.audit_logs(user_id,action,entity_type,entity_id,metadata) values(auth.uid(),'VALIDADE_SOCIAL_INSERT','registros_validade_social',new.id,jsonb_build_object('paciente_id',new.paciente_id,'alvo_id',new.alvo_id,'profissional_id',new.profissional_id,'respondente_tipo',new.respondente_tipo,'registrado_em',new.registrado_em)); return new; end $$;
drop trigger if exists audit_registros_validade_social on public.registros_validade_social;
create trigger audit_registros_validade_social after insert on public.registros_validade_social for each row execute function public.auditar_validade_social();
revoke all on function public.registrar_validade_social(uuid,uuid,text,boolean,integer,integer,integer,text,text,text,date) from public;
grant execute on function public.registrar_validade_social(uuid,uuid,text,boolean,integer,integer,integer,text,text,text,date) to authenticated;
revoke all on function public.auditar_validade_social() from public;
notify pgrst,'reload schema';
