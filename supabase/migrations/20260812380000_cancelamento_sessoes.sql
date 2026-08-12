-- Cancelamento reversivel de sessoes, preservando o registro original e autoria.
alter table public.sessoes_clinicas add column if not exists motivo_cancelamento text;
alter table public.sessoes_clinicas add column if not exists cancelada_por uuid references public.profiles(id) on delete restrict;
alter table public.sessoes_clinicas add column if not exists cancelada_em timestamptz;
alter table public.sessoes_clinicas add column if not exists motivo_restauracao text;
alter table public.sessoes_clinicas add column if not exists restaurada_por uuid references public.profiles(id) on delete restrict;
alter table public.sessoes_clinicas add column if not exists restaurada_em timestamptz;
-- Reconcilia eventuais cancelamentos anteriores à existência dos metadados.
update public.sessoes_clinicas set
  motivo_cancelamento=coalesce(nullif(trim(motivo_cancelamento),''),'Cancelamento anterior à trilha estruturada.'),
  cancelada_por=coalesce(cancelada_por,profissional_id),
  cancelada_em=coalesce(cancelada_em,deleted_at,updated_at,created_at),
  deleted_at=coalesce(deleted_at,updated_at,created_at)
where status='cancelada';
alter table public.sessoes_clinicas drop constraint if exists sessoes_cancelamento_consistente_check;
alter table public.sessoes_clinicas add constraint sessoes_cancelamento_consistente_check check(
  (status='cancelada' and deleted_at is not null and cancelada_por is not null and cancelada_em is not null and length(trim(coalesce(motivo_cancelamento,'')))>=5)
  or (status<>'cancelada' and deleted_at is null)
);

create or replace function public.cancelar_sessao_clinica(p_sessao_id uuid,p_motivo text)
returns void language plpgsql security definer set search_path='pg_catalog','public' set row_security=off as $$
declare v_sessao public.sessoes_clinicas%rowtype;
begin
  select*into v_sessao from public.sessoes_clinicas where id=p_sessao_id for update;
  if not found or v_sessao.profissional_id<>auth.uid() or not public.usuario_ativo() or not public.usuario_vinculado(v_sessao.paciente_id) then raise exception 'unauthorized_session_cancellation' using errcode='42501';end if;
  if v_sessao.status='cancelada' or v_sessao.deleted_at is not null then raise exception 'session_already_cancelled' using errcode='22023';end if;
  if length(trim(coalesce(p_motivo,'')))<5 then raise exception 'invalid_cancellation_reason' using errcode='22023';end if;
  update public.sessoes_clinicas set status='cancelada',deleted_at=now(),motivo_cancelamento=trim(p_motivo),cancelada_por=auth.uid(),cancelada_em=now(),updated_at=now() where id=p_sessao_id;
  insert into public.audit_logs(user_id,action,entity_type,entity_id,metadata)values(auth.uid(),'SESSAO_CANCELADA','sessoes_clinicas',p_sessao_id,jsonb_build_object('paciente_id',v_sessao.paciente_id,'profissional_id',v_sessao.profissional_id,'data',v_sessao.data,'motivo_informado',true));
end $$;

create or replace function public.restaurar_sessao_clinica(p_sessao_id uuid,p_motivo text)
returns void language plpgsql security definer set search_path='pg_catalog','public' set row_security=off as $$
declare v_sessao public.sessoes_clinicas%rowtype;
begin
  select*into v_sessao from public.sessoes_clinicas where id=p_sessao_id for update;
  if not found or v_sessao.profissional_id<>auth.uid() or not public.usuario_ativo() or not public.usuario_vinculado(v_sessao.paciente_id) then raise exception 'unauthorized_session_restore' using errcode='42501';end if;
  if v_sessao.status<>'cancelada' or v_sessao.deleted_at is null then raise exception 'session_not_cancelled' using errcode='22023';end if;
  if length(trim(coalesce(p_motivo,'')))<5 then raise exception 'invalid_restore_reason' using errcode='22023';end if;
  update public.sessoes_clinicas set status='finalizada',deleted_at=null,motivo_restauracao=trim(p_motivo),restaurada_por=auth.uid(),restaurada_em=now(),updated_at=now() where id=p_sessao_id;
  insert into public.audit_logs(user_id,action,entity_type,entity_id,metadata)values(auth.uid(),'SESSAO_RESTAURADA','sessoes_clinicas',p_sessao_id,jsonb_build_object('paciente_id',v_sessao.paciente_id,'profissional_id',v_sessao.profissional_id,'data',v_sessao.data,'motivo_informado',true));
end $$;

revoke all on function public.cancelar_sessao_clinica(uuid,text)from public;grant execute on function public.cancelar_sessao_clinica(uuid,text)to authenticated;
revoke all on function public.restaurar_sessao_clinica(uuid,text)from public;grant execute on function public.restaurar_sessao_clinica(uuid,text)to authenticated;
notify pgrst,'reload schema';
