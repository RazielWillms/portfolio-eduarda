-- Revisao clinica com snapshot ampliado, calculado exclusivamente no servidor.
create or replace function public.criar_revisao_clinica_alvo_v2(p_alvo_id uuid,p_periodo_inicio date,p_periodo_fim date,p_decisao text,p_justificativa text,p_proxima_revisao_em date,p_confirmar_limitacoes boolean default false)
returns uuid language plpgsql security definer set search_path='pg_catalog','public' set row_security=off as $$
declare v_id uuid;v_ambientes integer;v_aplicadores integer;v_criterio uuid;v_snapshot jsonb;
begin
 if p_decisao in('avancar_fase','encerrar')and not coalesce(p_confirmar_limitacoes,false)then raise exception'limitations_not_confirmed'using errcode='22023';end if;
 v_id:=public.criar_revisao_clinica_alvo(p_alvo_id,p_periodo_inicio,p_periodo_fim,p_decisao,p_justificativa,p_proxima_revisao_em);
 select count(distinct s.ambiente_tipo),count(distinct s.aplicador_tipo)into v_ambientes,v_aplicadores from public.registros_medicao r join public.sessoes_clinicas s on s.id=r.sessao_id where r.alvo_id=p_alvo_id and s.profissional_id=auth.uid()and s.data between p_periodo_inicio and p_periodo_fim and s.status='finalizada'and s.deleted_at is null;
 select c.id into v_criterio from public.criterios_dominio_alvo c where c.alvo_id=p_alvo_id order by c.versao desc limit 1;
 select evidencias_snapshot into v_snapshot from public.revisoes_clinicas_alvo where id=v_id;
 update public.revisoes_clinicas_alvo set evidencias_snapshot=v_snapshot||jsonb_build_object('criterio_vigente_id',v_criterio,'ambientes',v_ambientes,'aplicadores',v_aplicadores,'limitacoes_confirmadas',coalesce(p_confirmar_limitacoes,false),'snapshot_versao',2)where id=v_id;
 return v_id;
end $$;
revoke all on function public.criar_revisao_clinica_alvo_v2(uuid,date,date,text,text,date,boolean)from public;
grant execute on function public.criar_revisao_clinica_alvo_v2(uuid,date,date,text,text,date,boolean)to authenticated;
notify pgrst,'reload schema';
