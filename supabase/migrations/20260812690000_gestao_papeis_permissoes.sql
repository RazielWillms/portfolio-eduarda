-- Gestão de papéis exclusiva do administrador principal.

create or replace function public.configuracao_papeis_acesso()
returns jsonb language plpgsql stable security definer set search_path=''set row_security=off as $$begin
 if not public.usuario_admin_principal()then raise exception'unauthorized'using errcode='42501';end if;
 return jsonb_build_object(
  'permissoes',(select coalesce(jsonb_agg(jsonb_build_object('chave',chave,'modulo',modulo,'nome',nome,'descricao',descricao,'sensivel',sensivel)order by modulo,nome),'[]')from public.permissoes_sistema where ativo),
  'papeis',(select coalesce(jsonb_agg(jsonb_build_object('id',pa.id,'nome',pa.nome,'slug',pa.slug,'descricao',pa.descricao,'ativo',pa.ativo,'sistema',pa.sistema,'permissoes',coalesce((select jsonb_agg(pp.permissao_chave order by pp.permissao_chave)from public.papel_permissoes pp where pp.papel_id=pa.id),'[]'))order by pa.nome),'[]')from public.papeis_acesso pa),
  'usuarios',(select coalesce(jsonb_agg(jsonb_build_object('id',p.id,'nome',p.nome,'email',p.email,'status',p.status,'admin_principal',p.admin_principal,'papel_id',ppa.papel_id)order by p.nome),'[]')from public.profiles p left join public.perfil_papel_acesso ppa on ppa.profile_id=p.id where lower(p.email)<>'demo@registrosaba.local')
 );end$$;

create or replace function public.salvar_papel_acesso(p_id uuid,p_nome text,p_descricao text,p_permissoes text[])
returns uuid language plpgsql security definer set search_path=''set row_security=off as $$declare v_id uuid;v_slug text;begin
 if not public.usuario_admin_principal()then raise exception'unauthorized'using errcode='42501';end if;
 if char_length(trim(coalesce(p_nome,'')))not between 2 and 80 then raise exception'invalid_role'using errcode='22023';end if;
 if exists(select 1 from unnest(coalesce(p_permissoes,'{}'))k where not exists(select 1 from public.permissoes_sistema ps where ps.chave=k and ps.ativo))then raise exception'invalid_permission'using errcode='22023';end if;
 if p_id is null then
  v_slug:=trim(both'_'from regexp_replace(public.normalizar_texto(p_nome),'[^a-z0-9]+','_','g'))||'_'||substr(gen_random_uuid()::text,1,8);
  insert into public.papeis_acesso(nome,slug,descricao,criado_por)values(trim(p_nome),v_slug,nullif(trim(p_descricao),''),auth.uid())returning id into v_id;
 else
  update public.papeis_acesso set nome=trim(p_nome),descricao=nullif(trim(p_descricao),''),updated_at=now()where id=p_id returning id into v_id;
  if v_id is null then raise exception'role_not_found'using errcode='P0002';end if;
 end if;
 delete from public.papel_permissoes where papel_id=v_id and permissao_chave<>all(coalesce(p_permissoes,'{}'));
 insert into public.papel_permissoes(papel_id,permissao_chave,concedido_por)select v_id,k,auth.uid()from unnest(coalesce(p_permissoes,'{}'))k on conflict do nothing;
 return v_id;end$$;

create or replace function public.alterar_status_papel_acesso(p_id uuid,p_ativo boolean)
returns void language plpgsql security definer set search_path=''set row_security=off as $$begin
 if not public.usuario_admin_principal()then raise exception'unauthorized'using errcode='42501';end if;
 if exists(select 1 from public.papeis_acesso where id=p_id and sistema)then raise exception'system_role_is_protected'using errcode='42501';end if;
 if not p_ativo and exists(select 1 from public.perfil_papel_acesso ppa join public.profiles p on p.id=ppa.profile_id and p.status='ativo'where ppa.papel_id=p_id)then raise exception'role_in_use'using errcode='23503';end if;
 update public.papeis_acesso set ativo=p_ativo,updated_at=now()where id=p_id;
end$$;

create or replace function public.atribuir_papel_acesso(p_profile_id uuid,p_papel_id uuid)
returns void language plpgsql security definer set search_path=''set row_security=off as $$declare v_slug text;begin
 if not public.usuario_admin_principal()then raise exception'unauthorized'using errcode='42501';end if;
 if exists(select 1 from public.profiles where id=p_profile_id and admin_principal)then raise exception'main_admin_is_protected'using errcode='42501';end if;
 select slug into v_slug from public.papeis_acesso where id=p_papel_id and ativo;
 if v_slug is null or not exists(select 1 from public.profiles where id=p_profile_id)then raise exception'invalid_assignment'using errcode='22023';end if;
 update public.profiles set papel=case v_slug when'administrador'then'admin'when'coordenacao'then'coordenacao'else'profissional'end where id=p_profile_id;
 insert into public.perfil_papel_acesso(profile_id,papel_id,atribuido_por)values(p_profile_id,p_papel_id,auth.uid())
 on conflict(profile_id)do update set papel_id=excluded.papel_id,atribuido_por=excluded.atribuido_por,updated_at=now();
end$$;

revoke all on function public.configuracao_papeis_acesso()from public;
revoke all on function public.salvar_papel_acesso(uuid,text,text,text[])from public;
revoke all on function public.alterar_status_papel_acesso(uuid,boolean)from public;
revoke all on function public.atribuir_papel_acesso(uuid,uuid)from public;
grant execute on function public.configuracao_papeis_acesso()to authenticated;
grant execute on function public.salvar_papel_acesso(uuid,text,text,text[])to authenticated;
grant execute on function public.alterar_status_papel_acesso(uuid,boolean)to authenticated;
grant execute on function public.atribuir_papel_acesso(uuid,uuid)to authenticated;
notify pgrst,'reload schema';
