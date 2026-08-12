-- Corrige a auditoria polimórfica de sessões e registros de medição.
-- to_jsonb(NEW) evita acessar campos inexistentes no tipo de registro do gatilho.
create or replace function public.auditar_sessao_estruturada()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_novo jsonb := to_jsonb(new);
begin
  insert into public.audit_logs(user_id,action,entity_type,entity_id,metadata)
  values(
    auth.uid(),
    upper(tg_table_name || '_' || tg_op),
    tg_table_name,
    (v_novo->>'id')::uuid,
    case
      when tg_table_name='sessoes_clinicas' then jsonb_build_object(
        'paciente_id',v_novo->>'paciente_id',
        'profissional_id',v_novo->>'profissional_id',
        'data',v_novo->>'data',
        'status',v_novo->>'status'
      )
      else jsonb_build_object(
        'sessao_id',v_novo->>'sessao_id',
        'alvo_id',v_novo->>'alvo_id',
        'tipo_medicao',v_novo->>'tipo_medicao'
      )
    end
  );
  return new;
end
$$;

revoke all on function public.auditar_sessao_estruturada() from public;
notify pgrst,'reload schema';

