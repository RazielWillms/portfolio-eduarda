-- Ciclo 12: concordancia entre observadores com referencia cega.
create table if not exists public.solicitacoes_concordancia (
  id uuid primary key default gen_random_uuid(), paciente_id uuid not null references public.pacientes(id) on delete restrict,
  registro_medicao_id uuid not null references public.registros_medicao(id) on delete restrict, alvo_id uuid not null references public.alvos_clinicos(id) on delete restrict,
  solicitante_id uuid not null references public.profiles(id) on delete restrict, observador_id uuid not null references public.profiles(id) on delete restrict,
  tipo_medicao text not null, unidade_comparavel text not null, status text not null default 'pendente' check(status in('pendente','concluida','cancelada')),
  valor_observador numeric, concordancia_percentual numeric check(concordancia_percentual is null or concordancia_percentual between 0 and 100),
  solicitado_em timestamptz not null default now(), respondido_em timestamptz, unique(registro_medicao_id,observador_id), check(solicitante_id<>observador_id)
);
create table if not exists public.concordancia_referencias (
  solicitacao_id uuid primary key references public.solicitacoes_concordancia(id) on delete restrict,
  valor_referencia numeric not null
);
alter table public.solicitacoes_concordancia enable row level security; alter table public.solicitacoes_concordancia force row level security;
alter table public.concordancia_referencias enable row level security; alter table public.concordancia_referencias force row level security;
drop policy if exists concordancia_participantes_select on public.solicitacoes_concordancia;
create policy concordancia_participantes_select on public.solicitacoes_concordancia for select to authenticated using(public.usuario_admin() or auth.uid() in(solicitante_id,observador_id));
-- Nenhuma policy de leitura para concordancia_referencias: o valor original permanece cego.

create or replace function public.valor_medicao_comparavel(p_tipo text,p_dados jsonb) returns numeric language plpgsql immutable set search_path='' as $$
declare a numeric;b numeric;
begin
 if p_tipo='frequencia' then return (p_dados->>'contagem')::numeric; end if;
 if p_tipo='taxa' then return round((p_dados->>'contagem')::numeric*60/(p_dados->>'duracao_observacao_segundos')::numeric,4); end if;
 if p_tipo in('duracao','latencia') then return (p_dados->>'segundos')::numeric; end if;
 if p_tipo in('percentual_oportunidades','tentativas_discretas') then return round((p_dados->>'respostas_independentes')::numeric*100/(p_dados->>'oportunidades')::numeric,4); end if;
 if p_tipo in('intervalo_parcial','intervalo_total','amostragem_momentanea') then return round((p_dados->>'intervalos_com_ocorrencia')::numeric*100/(p_dados->>'intervalos')::numeric,4); end if;
 if p_tipo='escala_independencia' then return case p_dados->>'codigo' when 'A' then 100 when 'B+' then 70 when 'B-' then 50 when 'C' then 0 end; end if;
 if p_tipo='intensidade' then return (p_dados->>'nivel')::numeric; end if; return null;
exception when others then return null; end $$;

create or replace function public.solicitar_concordancia(p_registro_medicao_id uuid,p_observador_id uuid) returns uuid language plpgsql security definer set search_path='pg_catalog','public' set row_security=off as $$
declare r record;v_id uuid;v_valor numeric;v_unidade text;
begin
 select rm.*,s.paciente_id,s.profissional_id into r from public.registros_medicao rm join public.sessoes_clinicas s on s.id=rm.sessao_id where rm.id=p_registro_medicao_id and s.profissional_id=auth.uid();
 if not found or p_observador_id=auth.uid() or not exists(select 1 from public.paciente_psicologos pp join public.profiles p on p.id=pp.psicologo_id where pp.paciente_id=r.paciente_id and pp.psicologo_id=p_observador_id and p.status='ativo') then raise exception 'unauthorized_ioa_request' using errcode='42501'; end if;
 v_valor:=public.valor_medicao_comparavel(r.tipo_medicao,r.dados);if v_valor is null then raise exception 'invalid_ioa_measurement' using errcode='22023';end if;
 v_unidade:=case when r.tipo_medicao='taxa' then 'por minuto' when r.tipo_medicao in('duracao','latencia') then 'segundos' when r.tipo_medicao in('percentual_oportunidades','tentativas_discretas','intervalo_parcial','intervalo_total','amostragem_momentanea','escala_independencia') then '%' when r.tipo_medicao='frequencia' then 'ocorrencias' else 'nivel' end;
 insert into public.solicitacoes_concordancia(paciente_id,registro_medicao_id,alvo_id,solicitante_id,observador_id,tipo_medicao,unidade_comparavel) values(r.paciente_id,r.id,r.alvo_id,auth.uid(),p_observador_id,r.tipo_medicao,v_unidade) returning id into v_id;
 insert into public.concordancia_referencias values(v_id,v_valor);return v_id;
end $$;
create or replace function public.responder_concordancia(p_solicitacao_id uuid,p_valor_observador numeric) returns numeric language plpgsql security definer set search_path='pg_catalog','public' set row_security=off as $$
declare s public.solicitacoes_concordancia%rowtype;v_ref numeric;v_pct numeric;
begin select * into s from public.solicitacoes_concordancia where id=p_solicitacao_id for update;if not found or s.observador_id<>auth.uid() or s.status<>'pendente' or p_valor_observador<0 then raise exception 'unauthorized_or_invalid_ioa_response' using errcode='42501';end if;select valor_referencia into v_ref from public.concordancia_referencias where solicitacao_id=s.id;v_pct:=case when greatest(abs(v_ref),abs(p_valor_observador))=0 then 100 else round(least(abs(v_ref),abs(p_valor_observador))*100/greatest(abs(v_ref),abs(p_valor_observador)),2) end;update public.solicitacoes_concordancia set valor_observador=p_valor_observador,concordancia_percentual=v_pct,status='concluida',respondido_em=now() where id=s.id;return v_pct;end $$;
create or replace function public.auditar_concordancia() returns trigger language plpgsql security definer set search_path='' as $$
begin insert into public.audit_logs(user_id,action,entity_type,entity_id,metadata) values(auth.uid(),'CONCORDANCIA_'||tg_op,'solicitacoes_concordancia',new.id,jsonb_build_object('paciente_id',new.paciente_id,'alvo_id',new.alvo_id,'solicitante_id',new.solicitante_id,'observador_id',new.observador_id,'status',new.status));return new;end $$;
drop trigger if exists audit_solicitacoes_concordancia on public.solicitacoes_concordancia;
create trigger audit_solicitacoes_concordancia after insert or update on public.solicitacoes_concordancia for each row execute function public.auditar_concordancia();
revoke all on function public.valor_medicao_comparavel(text,jsonb) from public;revoke all on function public.solicitar_concordancia(uuid,uuid) from public;grant execute on function public.solicitar_concordancia(uuid,uuid) to authenticated;revoke all on function public.responder_concordancia(uuid,numeric) from public;grant execute on function public.responder_concordancia(uuid,numeric) to authenticated;
revoke all on function public.auditar_concordancia() from public;
notify pgrst,'reload schema';
