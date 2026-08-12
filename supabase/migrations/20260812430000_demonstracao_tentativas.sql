-- Enriquece o cenário fictício com agregados de tentativas, sem liberar escrita ou dados reais.
create or replace function public.obter_cenario_demonstracao_v2()
returns jsonb language plpgsql stable security definer set search_path='pg_catalog','public' set row_security=off as $$
declare v_base jsonb;v_sessoes jsonb;
begin
 v_base:=public.obter_cenario_demonstracao();if v_base is null then return null;end if;
 select coalesce(jsonb_agg(jsonb_set(sessao,'{registros}',coalesce((select jsonb_agg(jsonb_set(registro,'{tentativas}',coalesce((select jsonb_agg(jsonb_build_object('id',t.id,'ordem',t.ordem,'resultado',t.resultado,'nivel_ajuda',t.nivel_ajuda,'latencia_segundos',t.latencia_segundos)order by t.ordem)from public.tentativas_individuais t where t.registro_medicao_id=(registro->>'id')::uuid),'[]'::jsonb),true))from jsonb_array_elements(sessao->'registros')registro),'[]'::jsonb),true))),'[]'::jsonb)into v_sessoes from jsonb_array_elements(v_base->'sessoes')sessao;
 return jsonb_set(v_base,'{sessoes}',v_sessoes,true);
end $$;
revoke all on function public.obter_cenario_demonstracao_v2()from public;
grant execute on function public.obter_cenario_demonstracao_v2()to authenticated;
notify pgrst,'reload schema';
