-- A disponibilidade e uma configuracao operacional exclusiva da coordenacao/administracao.
drop policy if exists disponibilidades_select on public.disponibilidades_profissional;
create policy disponibilidades_select on public.disponibilidades_profissional
for select to authenticated using (public.usuario_coordenacao());

drop policy if exists indisponibilidades_select on public.indisponibilidades_profissional;
create policy indisponibilidades_select on public.indisponibilidades_profissional
for select to authenticated using (public.usuario_coordenacao());

create or replace function public.salvar_disponibilidade(p_profissional_id uuid,p_periodos jsonb)
returns void language plpgsql security definer set search_path='' set row_security=off as $$declare item jsonb;begin
 if not public.usuario_coordenacao()or not public.perfil_pode_atender(p_profissional_id)then raise exception'unauthorized'using errcode='42501';end if;
 if jsonb_typeof(coalesce(p_periodos,'[]'))<>'array'then raise exception'invalid_availability'using errcode='22023';end if;
 delete from public.disponibilidades_profissional where profissional_id=p_profissional_id;
 for item in select value from jsonb_array_elements(p_periodos)loop
  insert into public.disponibilidades_profissional(profissional_id,dia_semana,hora_inicio,hora_fim)
  values(p_profissional_id,(item->>'dia_semana')::smallint,(item->>'hora_inicio')::time,(item->>'hora_fim')::time);
 end loop;
 insert into public.audit_logs(user_id,action,entity_type,entity_id,metadata)
 values(auth.uid(),'DISPONIBILIDADE_ATUALIZADA','profiles',p_profissional_id,jsonb_build_object('periodos',jsonb_array_length(p_periodos)));
exception when invalid_text_representation or check_violation then raise exception'invalid_availability'using errcode='22023';end$$;

create or replace function public.salvar_indisponibilidade(p_profissional_id uuid,p_inicio timestamptz,p_fim timestamptz,p_motivo text)
returns uuid language plpgsql security definer set search_path='' set row_security=off as $$declare v_id uuid;begin
 if not public.usuario_coordenacao()or not public.perfil_pode_atender(p_profissional_id)or p_fim<=p_inicio then raise exception'unauthorized_or_invalid'using errcode='42501';end if;
 insert into public.indisponibilidades_profissional(profissional_id,inicio,fim,motivo,criado_por)
 values(p_profissional_id,p_inicio,p_fim,nullif(trim(p_motivo),''),auth.uid())returning id into v_id;
 insert into public.audit_logs(user_id,action,entity_type,entity_id,metadata)
 values(auth.uid(),'INDISPONIBILIDADE_CRIADA','indisponibilidades_profissional',v_id,jsonb_build_object('profissional_id',p_profissional_id));
 return v_id;
end$$;

notify pgrst,'reload schema';
