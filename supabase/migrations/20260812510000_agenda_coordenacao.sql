-- Agenda operacional separada do prontuário clínico.
alter table public.profiles drop constraint if exists profiles_papel_check;
alter table public.profiles add constraint profiles_papel_check check(papel in('admin','profissional','coordenacao'));

create or replace function public.usuario_coordenacao()
returns boolean language sql stable security definer set search_path='' as $$
select exists(select 1 from public.profiles where id=auth.uid() and papel in('admin','coordenacao') and status='ativo')$$;
revoke all on function public.usuario_coordenacao() from public;grant execute on function public.usuario_coordenacao() to authenticated;

create table if not exists public.agendamentos(
 id uuid primary key default gen_random_uuid(),paciente_id uuid not null references public.pacientes(id),
 profissional_id uuid not null references public.profiles(id),inicio timestamptz not null,fim timestamptz not null,
 finalidade text not null default'avaliacao_inicial',modalidade text not null default'presencial',local text,
 status text not null default'agendado',observacao_administrativa text,criado_por uuid not null references public.profiles(id),
 sessao_id uuid references public.sessoes_clinicas(id),cancelado_em timestamptz,created_at timestamptz not null default now(),updated_at timestamptz not null default now(),
 constraint agendamentos_periodo_check check(fim>inicio),
 constraint agendamentos_status_check check(status in('agendado','confirmado','realizado','cancelado','falta','reagendado')),
 constraint agendamentos_modalidade_check check(modalidade in('presencial','domiciliar','escola','teleatendimento','outro'))
);
create index if not exists agendamentos_profissional_inicio_idx on public.agendamentos(profissional_id,inicio);
create index if not exists agendamentos_paciente_inicio_idx on public.agendamentos(paciente_id,inicio);
alter table public.agendamentos enable row level security;
drop policy if exists agendamentos_select on public.agendamentos;
create policy agendamentos_select on public.agendamentos for select to authenticated using(public.usuario_coordenacao() or profissional_id=auth.uid());
-- Escrita é exclusivamente pelas RPCs abaixo.

create or replace function public.listar_opcoes_agendamento()
returns jsonb language plpgsql stable security definer set search_path='' set row_security=off as $$
begin
 if not public.usuario_coordenacao() then raise exception'unauthorized'using errcode='42501';end if;
 return jsonb_build_object(
  'pacientes',coalesce((select jsonb_agg(jsonb_build_object('id',p.id,'nome',p.nome_completo,'status',p.status)order by p.nome_completo)from public.pacientes p where p.status='ativo'),'[]'::jsonb),
  'profissionais',coalesce((select jsonb_agg(jsonb_build_object('id',p.id,'nome',p.nome,'profissao',p.profissao)order by p.nome)from public.profiles p where p.status='ativo'and p.papel='profissional'),'[]'::jsonb));
end$$;

create or replace function public.listar_agendamentos(p_inicio timestamptz,p_fim timestamptz)
returns table(id uuid,paciente_id uuid,profissional_id uuid,inicio timestamptz,fim timestamptz,finalidade text,modalidade text,local text,status text,observacao_administrativa text,sessao_id uuid,paciente_nome text,profissional_nome text,pode_iniciar boolean)
language sql stable security definer set search_path='' set row_security=off as $$
 select a.id,a.paciente_id,a.profissional_id,a.inicio,a.fim,a.finalidade,a.modalidade,a.local,a.status,a.observacao_administrativa,a.sessao_id,p.nome_completo,pr.nome,
  a.profissional_id=auth.uid()and public.usuario_vinculado(a.paciente_id)
 from public.agendamentos a join public.pacientes p on p.id=a.paciente_id join public.profiles pr on pr.id=a.profissional_id
 where a.inicio>=p_inicio and a.inicio<p_fim and(public.usuario_coordenacao()or a.profissional_id=auth.uid())order by a.inicio$$;

create or replace function public.criar_agendamento(p_paciente_id uuid,p_profissional_id uuid,p_inicio timestamptz,p_fim timestamptz,p_finalidade text,p_modalidade text,p_local text,p_observacao text)
returns uuid language plpgsql security definer set search_path='' set row_security=off as $$declare v_id uuid;begin
 if not public.usuario_coordenacao()then raise exception'unauthorized'using errcode='42501';end if;
 if p_fim<=p_inicio or not exists(select 1 from public.pacientes where id=p_paciente_id and status='ativo')or not exists(select 1 from public.profiles where id=p_profissional_id and papel='profissional'and status='ativo')then raise exception'invalid_schedule'using errcode='22023';end if;
 if exists(select 1 from public.agendamentos where profissional_id=p_profissional_id and status in('agendado','confirmado')and tstzrange(inicio,fim,'[)')&&tstzrange(p_inicio,p_fim,'[)'))then raise exception'schedule_conflict'using errcode='23P01';end if;
 insert into public.agendamentos(paciente_id,profissional_id,inicio,fim,finalidade,modalidade,local,observacao_administrativa,criado_por)values(p_paciente_id,p_profissional_id,p_inicio,p_fim,trim(p_finalidade),p_modalidade,nullif(trim(p_local),''),nullif(trim(p_observacao),''),auth.uid())returning id into v_id;
 insert into public.audit_logs(user_id,action,entity_type,entity_id,metadata)values(auth.uid(),'AGENDAMENTO_CRIADO','agendamentos',v_id,jsonb_build_object('profissional_id',p_profissional_id,'paciente_id',p_paciente_id,'inicio',p_inicio));return v_id;end$$;

create or replace function public.atualizar_status_agendamento(p_id uuid,p_status text)
returns void language plpgsql security definer set search_path='' set row_security=off as $$declare v public.agendamentos%rowtype;begin
 select*into v from public.agendamentos where id=p_id for update;if not found then raise exception'not_found'using errcode='P0002';end if;
 if not public.usuario_coordenacao()and not(v.profissional_id=auth.uid()and p_status in('confirmado','falta'))then raise exception'unauthorized'using errcode='42501';end if;
 if p_status not in('agendado','confirmado','cancelado','falta')then raise exception'invalid_status'using errcode='22023';end if;
 update public.agendamentos set status=p_status,cancelado_em=case when p_status='cancelado'then now()else null end,updated_at=now()where id=p_id;
 insert into public.audit_logs(user_id,action,entity_type,entity_id,metadata)values(auth.uid(),'AGENDAMENTO_STATUS_ALTERADO','agendamentos',p_id,jsonb_build_object('status',p_status));end$$;

create or replace function public.cadastrar_paciente_administrativo(p_nome text,p_responsavel text,p_cpf_responsavel text,p_cpf_paciente text,p_nascimento date,p_contatos text)
returns uuid language plpgsql security definer set search_path='' set row_security=off as $$declare v_id uuid;begin
 if not public.usuario_coordenacao()then raise exception'unauthorized'using errcode='42501';end if;
 if nullif(trim(p_nome),'')is null or p_nascimento is null then raise exception'invalid_patient'using errcode='22023';end if;
 if exists(select 1 from public.pacientes p where(public.normalizar_cpf(p_cpf_paciente)is not null and public.normalizar_cpf(p.cpf_paciente)=public.normalizar_cpf(p_cpf_paciente))or(public.normalizar_cpf(p_cpf_responsavel)is not null and public.normalizar_cpf(p.cpf_responsavel)=public.normalizar_cpf(p_cpf_responsavel)and p.data_nascimento=p_nascimento)or(public.normalizar_texto(p.nome_completo)=public.normalizar_texto(p_nome)and p.data_nascimento=p_nascimento and public.normalizar_texto(p.nome_responsavel)=public.normalizar_texto(p_responsavel)))then raise exception'possible_duplicate'using errcode='P0001';end if;
 insert into public.pacientes(nome_completo,nome_responsavel,cpf_responsavel,cpf_paciente,data_nascimento,contatos,criado_por)values(trim(p_nome),nullif(trim(p_responsavel),''),public.normalizar_cpf(p_cpf_responsavel),public.normalizar_cpf(p_cpf_paciente),p_nascimento,nullif(trim(p_contatos),''),auth.uid())returning id into v_id;return v_id;end$$;

create or replace function public.atualizar_profile_admin(p_usuario_id uuid,p_papel text default null,p_status text default null)
returns void language plpgsql security definer set search_path='pg_catalog','public' set row_security=off as $$declare v public.profiles%rowtype;begin
 if auth.uid()is null or not public.usuario_admin()then raise exception'unauthorized'using errcode='42501';end if;select*into v from public.profiles where id=p_usuario_id for update;if not found then raise exception'profile_not_found'using errcode='P0002';end if;
 if v.admin_principal and((p_papel is not null and p_papel<>v.papel)or(p_status is not null and p_status<>v.status))then raise exception'main_admin_is_protected'using errcode='42501';end if;
 if p_papel is not null and p_papel not in('admin','profissional','coordenacao')then raise exception'invalid_role'using errcode='23514';end if;if p_status is not null and p_status not in('ativo','inativo')then raise exception'invalid_status'using errcode='23514';end if;
 if p_usuario_id=auth.uid()and(p_status='inativo'or(p_papel is not null and p_papel<>'admin'))then raise exception'cannot_remove_own_admin_access'using errcode='42501';end if;update public.profiles set papel=coalesce(p_papel,papel),status=coalesce(p_status,status)where id=p_usuario_id;end$$;

revoke all on function public.listar_opcoes_agendamento()from public;grant execute on function public.listar_opcoes_agendamento()to authenticated;
revoke all on function public.listar_agendamentos(timestamptz,timestamptz)from public;grant execute on function public.listar_agendamentos(timestamptz,timestamptz)to authenticated;
revoke all on function public.criar_agendamento(uuid,uuid,timestamptz,timestamptz,text,text,text,text)from public;grant execute on function public.criar_agendamento(uuid,uuid,timestamptz,timestamptz,text,text,text,text)to authenticated;
revoke all on function public.atualizar_status_agendamento(uuid,text)from public;grant execute on function public.atualizar_status_agendamento(uuid,text)to authenticated;
revoke all on function public.cadastrar_paciente_administrativo(text,text,text,text,date,text)from public;grant execute on function public.cadastrar_paciente_administrativo(text,text,text,text,date,text)to authenticated;
notify pgrst,'reload schema';
