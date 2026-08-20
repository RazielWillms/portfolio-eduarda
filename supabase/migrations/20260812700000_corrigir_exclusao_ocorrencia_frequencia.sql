-- Corrige exclusão lógica de ocorrências após a migração para permissões granulares.
create or replace function public.cancelar_ocorrencia_frequencia(p_id uuid,p_motivo text)
returns void language plpgsql security definer set search_path=''set row_security=off as $$
declare o public.ocorrencias_frequencia%rowtype;v_linhas integer:=0;
begin
 if auth.uid()is null or not public.usuario_ativo()then raise exception'unauthorized'using errcode='42501';end if;
 if length(trim(coalesce(p_motivo,'')))<5 then raise exception'invalid_reason'using errcode='22023';end if;
 select*into o from public.ocorrencias_frequencia where id=p_id for update;
 if not found then raise exception'occurrence_not_found'using errcode='P0002';end if;
 if o.cancelado_em is not null then raise exception'occurrence_already_cancelled'using errcode='22023';end if;
 if not(
  public.usuario_tem_permissao('frequencia.gerenciar')or
  (o.criado_por=auth.uid()and o.profissional_id=auth.uid()and public.usuario_tem_permissao('frequencia.registrar_propria'))
 )then raise exception'unauthorized'using errcode='42501';end if;

 update public.ocorrencias_frequencia set cancelado_em=now(),cancelado_por=auth.uid(),motivo_cancelamento=trim(p_motivo),updated_at=now()where id=o.id;
 if o.agendamento_id is not null and o.tipo in('falta_justificada','falta_nao_justificada')then
  update public.agendamentos set status=coalesce(o.agendamento_status_anterior,'agendado'),updated_at=now()
  where id=o.agendamento_id and status='falta'
   and not exists(select 1 from public.ocorrencias_frequencia outra where outra.agendamento_id=o.agendamento_id and outra.id<>o.id and outra.cancelado_em is null and outra.tipo in('falta_justificada','falta_nao_justificada'));
  get diagnostics v_linhas=row_count;
 end if;
 insert into public.audit_logs(user_id,action,entity_type,entity_id,metadata)
 values(auth.uid(),'OCORRENCIA_FREQUENCIA_CANCELADA','ocorrencias_frequencia',o.id,jsonb_build_object('motivo_informado',true,'agendamento_id',o.agendamento_id,'status_restaurado',v_linhas>0));
end$$;
revoke all on function public.cancelar_ocorrencia_frequencia(uuid,text)from public;
grant execute on function public.cancelar_ocorrencia_frequencia(uuid,text)to authenticated;
notify pgrst,'reload schema';
