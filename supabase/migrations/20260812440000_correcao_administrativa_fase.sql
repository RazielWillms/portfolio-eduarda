-- Separa correção administrativa do fluxo clínico baseado em revisão.
alter table public.historico_fases_alvo add column if not exists tipo_alteracao text not null default 'legado';
alter table public.historico_fases_alvo drop constraint if exists historico_fases_tipo_alteracao_check;
alter table public.historico_fases_alvo add constraint historico_fases_tipo_alteracao_check check(tipo_alteracao in('legado','decisao_clinica','correcao_administrativa'));

create or replace function public.corrigir_fase_alvo(p_alvo_id uuid,p_nova_fase text,p_motivo text,p_confirmar_correcao boolean)
returns void language plpgsql security definer set search_path='pg_catalog','public' set row_security=off as $$
declare v_alvo public.alvos_clinicos%rowtype;
begin
 if not coalesce(p_confirmar_correcao,false)or p_nova_fase not in('rascunho','linha_de_base','ensino','generalizacao','manutencao','pausado','encerrado')or length(trim(coalesce(p_motivo,'')))<20 then raise exception'invalid_phase_correction'using errcode='22023';end if;
 select*into v_alvo from public.alvos_clinicos where id=p_alvo_id for update;
 if not found or not public.usuario_pode_editar_alvo(p_alvo_id)then raise exception'unauthorized'using errcode='42501';end if;
 if v_alvo.fase=p_nova_fase then raise exception'invalid_phase_correction'using errcode='22023';end if;
 perform set_config('app.alterando_fase_alvo','1',true);
 update public.alvos_clinicos set fase=p_nova_fase where id=p_alvo_id;
 insert into public.historico_fases_alvo(alvo_id,fase_anterior,nova_fase,motivo,alterado_por,tipo_alteracao)values(p_alvo_id,v_alvo.fase,p_nova_fase,trim(p_motivo),auth.uid(),'correcao_administrativa');
end $$;

revoke execute on function public.alterar_fase_alvo(uuid,text,text)from authenticated;
revoke all on function public.corrigir_fase_alvo(uuid,text,text,boolean)from public;
grant execute on function public.corrigir_fase_alvo(uuid,text,text,boolean)to authenticated;

create or replace function public.marcar_transicao_fase_clinica()returns trigger language plpgsql set search_path=''as $$
begin if new.revisao_clinica_id is not null then new.tipo_alteracao:='decisao_clinica';end if;return new;end $$;
drop trigger if exists marcar_transicao_fase_clinica on public.historico_fases_alvo;
create trigger marcar_transicao_fase_clinica before update of revisao_clinica_id on public.historico_fases_alvo for each row execute function public.marcar_transicao_fase_clinica();
notify pgrst,'reload schema';
