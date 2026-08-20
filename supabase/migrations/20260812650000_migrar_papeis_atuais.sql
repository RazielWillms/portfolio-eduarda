-- Espelha os papéis legados na estrutura configurável sem trocar a autoridade atual.
-- Enquanto a migração gradual estiver em andamento, profiles.papel continua soberano.

insert into public.papeis_acesso(nome,slug,descricao,ativo,sistema,criado_por) values
  ('Administrador','administrador','Administração geral e coordenação operacional do sistema.',true,true,null),
  ('Coordenação','coordenacao','Gestão operacional, agenda, frequência e possibilidade de atendimento clínico mediante vínculo.',true,true,null),
  ('Profissional','profissional','Atendimento clínico e acesso aos pacientes explicitamente vinculados.',true,true,null)
on conflict(slug) do update set
  nome=excluded.nome,
  descricao=excluded.descricao,
  ativo=true,
  sistema=true;

-- Reaplicar esta migration reconcilia os papéis de sistema com a matriz definida abaixo.
delete from public.papel_permissoes pp
using public.papeis_acesso pa
where pa.id=pp.papel_id and pa.slug in('administrador','coordenacao','profissional');

with matriz(slug,chave) as (values
  -- Administração comum: mantém a gestão atual, mas não recebe as duas capacidades
  -- exclusivas do principal (gerenciar papéis e redefinir senha de terceiros).
  ('administrador','usuarios.visualizar'),
  ('administrador','usuarios.criar'),
  ('administrador','usuarios.editar'),
  ('administrador','papeis.atribuir'),
  ('administrador','agenda.visualizar_propria'),
  ('administrador','agenda.visualizar_equipe'),
  ('administrador','agenda.gerenciar'),
  ('administrador','disponibilidade.gerenciar'),
  ('administrador','frequencia.registrar_propria'),
  ('administrador','frequencia.visualizar_equipe'),
  ('administrador','frequencia.gerenciar'),
  ('administrador','pacientes.cadastrar'),
  ('administrador','pacientes.cadastrar_administrativo'),
  ('administrador','pacientes.editar_cadastro'),
  ('administrador','acessos.solicitar'),
  ('administrador','acessos.aprovar'),
  ('administrador','sessoes.registrar'),
  ('administrador','sessoes.editar_proprias'),
  ('administrador','clinico.visualizar'),
  ('administrador','clinico.planejar'),
  ('administrador','compartilhamento.gerenciar'),
  ('administrador','habilidades.gerenciar'),
  ('administrador','auditoria.visualizar'),

  -- Coordenação tem capacidades operacionais e pode atuar clinicamente,
  -- mas acesso clínico continua condicionado a vínculo e autoria.
  ('coordenacao','agenda.visualizar_propria'),
  ('coordenacao','agenda.visualizar_equipe'),
  ('coordenacao','agenda.gerenciar'),
  ('coordenacao','disponibilidade.gerenciar'),
  ('coordenacao','frequencia.registrar_propria'),
  ('coordenacao','frequencia.visualizar_equipe'),
  ('coordenacao','frequencia.gerenciar'),
  ('coordenacao','pacientes.cadastrar'),
  ('coordenacao','pacientes.cadastrar_administrativo'),
  ('coordenacao','pacientes.editar_cadastro'),
  ('coordenacao','acessos.solicitar'),
  ('coordenacao','acessos.aprovar'),
  ('coordenacao','sessoes.registrar'),
  ('coordenacao','sessoes.editar_proprias'),
  ('coordenacao','clinico.visualizar'),
  ('coordenacao','clinico.planejar'),
  ('coordenacao','compartilhamento.gerenciar'),
  ('coordenacao','habilidades.gerenciar'),

  -- Profissional opera no próprio escopo e nos pacientes vinculados.
  ('profissional','agenda.visualizar_propria'),
  ('profissional','frequencia.registrar_propria'),
  ('profissional','pacientes.cadastrar'),
  ('profissional','pacientes.editar_cadastro'),
  ('profissional','acessos.solicitar'),
  ('profissional','acessos.aprovar'),
  ('profissional','sessoes.registrar'),
  ('profissional','sessoes.editar_proprias'),
  ('profissional','clinico.visualizar'),
  ('profissional','clinico.planejar'),
  ('profissional','compartilhamento.gerenciar'),
  ('profissional','habilidades.gerenciar')
)
insert into public.papel_permissoes(papel_id,permissao_chave,concedido_por)
select pa.id,m.chave,principal.id
from matriz m
join public.papeis_acesso pa on pa.slug=m.slug
cross join lateral (
  select p.id from public.profiles p
  where p.admin_principal and p.status='ativo'
  limit 1
) principal
join public.permissoes_sistema ps on ps.chave=m.chave and ps.ativo
on conflict(papel_id,permissao_chave) do nothing;

create or replace function public.sincronizar_papel_legado_configuravel()
returns trigger language plpgsql security definer set search_path='' set row_security=off as $$
declare
  v_papel_id uuid;
  v_principal_id uuid;
  v_slug text;
begin
  v_slug := case new.papel
    when 'admin' then 'administrador'
    when 'coordenacao' then 'coordenacao'
    when 'profissional' then 'profissional'
    else null
  end;
  if v_slug is null then return new; end if;

  select id into v_papel_id from public.papeis_acesso where slug=v_slug and sistema;
  select id into v_principal_id from public.profiles where admin_principal and status='ativo' limit 1;
  if v_papel_id is null or v_principal_id is null then return new; end if;

  insert into public.perfil_papel_acesso(profile_id,papel_id,atribuido_por)
  values(new.id,v_papel_id,v_principal_id)
  on conflict(profile_id) do update set
    papel_id=excluded.papel_id,
    atribuido_por=excluded.atribuido_por,
    updated_at=now()
  where public.perfil_papel_acesso.papel_id is distinct from excluded.papel_id;
  return new;
end
$$;

drop trigger if exists profiles_sincronizar_papel_configuravel on public.profiles;
create trigger profiles_sincronizar_papel_configuravel
after insert or update of papel on public.profiles
for each row execute function public.sincronizar_papel_legado_configuravel();

-- Associa todos os perfis já existentes. A atribuição não altera profiles.papel.
insert into public.perfil_papel_acesso(profile_id,papel_id,atribuido_por)
select p.id,pa.id,principal.id
from public.profiles p
join public.papeis_acesso pa on pa.slug=case p.papel
  when 'admin' then 'administrador'
  when 'coordenacao' then 'coordenacao'
  when 'profissional' then 'profissional'
end
cross join lateral (
  select id from public.profiles where admin_principal and status='ativo' limit 1
) principal
on conflict(profile_id) do update set
  papel_id=excluded.papel_id,
  atribuido_por=excluded.atribuido_por,
  updated_at=now();

-- Identidade e ativação dos papéis de sistema são protegidas. O principal poderá
-- configurar suas permissões, mas não remover os papéis necessários à compatibilidade.
create or replace function public.proteger_papel_sistema()
returns trigger language plpgsql set search_path='' as $$
begin
  if tg_op='DELETE' and old.sistema then
    raise exception 'system_role_is_protected' using errcode='42501';
  end if;
  if tg_op='UPDATE' and old.sistema and (
    new.slug is distinct from old.slug or
    new.sistema is distinct from old.sistema or
    new.ativo is distinct from old.ativo
  ) then
    raise exception 'system_role_is_protected' using errcode='42501';
  end if;
  return case when tg_op='DELETE' then old else new end;
end
$$;

drop trigger if exists papeis_acesso_proteger_sistema on public.papeis_acesso;
create trigger papeis_acesso_proteger_sistema
before update or delete on public.papeis_acesso
for each row execute function public.proteger_papel_sistema();

notify pgrst, 'reload schema';
