-- Vincula uma transicao de fase a revisao clinica que a justificou.
alter table public.historico_fases_alvo add column if not exists revisao_clinica_id uuid references public.revisoes_clinicas_alvo(id)on delete restrict;
create unique index if not exists historico_fase_revisao_unique on public.historico_fases_alvo(revisao_clinica_id)where revisao_clinica_id is not null;
create or replace function public.aplicar_decisao_fase(p_revisao_id uuid,p_nova_fase text)
returns void language plpgsql security definer set search_path='pg_catalog','public' set row_security=off as $$
declare v_revisao public.revisoes_clinicas_alvo%rowtype;v_alvo public.alvos_clinicos%rowtype;v_destino text;
begin
 select*into v_revisao from public.revisoes_clinicas_alvo where id=p_revisao_id for update;
 if not found or v_revisao.profissional_id<>auth.uid()or not public.usuario_pode_editar_alvo(v_revisao.alvo_id)then raise exception'unauthorized'using errcode='42501';end if;
 if v_revisao.decisao not in('avancar_fase','retornar_fase')or exists(select 1 from public.historico_fases_alvo where revisao_clinica_id=p_revisao_id)then raise exception'invalid_review_transition'using errcode='22023';end if;
 select*into v_alvo from public.alvos_clinicos where id=v_revisao.alvo_id for update;
 v_destino:=case
  when v_revisao.decisao='avancar_fase'and v_alvo.fase='rascunho'then'linha_de_base'
  when v_revisao.decisao='avancar_fase'and v_alvo.fase='linha_de_base'then'ensino'
  when v_revisao.decisao='avancar_fase'and v_alvo.fase='ensino'then'generalizacao'
  when v_revisao.decisao='avancar_fase'and v_alvo.fase='generalizacao'then'manutencao'
  when v_revisao.decisao='avancar_fase'and v_alvo.fase='manutencao'then'encerrado'
  when v_revisao.decisao='retornar_fase'and v_alvo.fase='manutencao'then'generalizacao'
  when v_revisao.decisao='retornar_fase'and v_alvo.fase='generalizacao'then'ensino'
  when v_revisao.decisao='retornar_fase'and v_alvo.fase='ensino'then'linha_de_base'
 end;
 if v_destino is null or p_nova_fase<>v_destino then raise exception'invalid_review_transition'using errcode='22023';end if;
 perform public.alterar_fase_alvo(v_alvo.id,v_destino,'Decisão clínica: '||v_revisao.justificativa);
 update public.historico_fases_alvo set revisao_clinica_id=v_revisao.id where id=(select id from public.historico_fases_alvo where alvo_id=v_alvo.id and alterado_por=auth.uid()and revisao_clinica_id is null order by created_at desc limit 1);
end $$;
revoke all on function public.aplicar_decisao_fase(uuid,text)from public;
grant execute on function public.aplicar_decisao_fase(uuid,text)to authenticated;
notify pgrst,'reload schema';
