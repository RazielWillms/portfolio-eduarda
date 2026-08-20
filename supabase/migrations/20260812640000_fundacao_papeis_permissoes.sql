-- Fundação de papéis configuráveis.
-- Esta migration não associa perfis nem substitui as verificações legadas.

create table if not exists public.permissoes_sistema (
  chave text primary key,
  modulo text not null,
  nome text not null,
  descricao text not null,
  sensivel boolean not null default false,
  ativo boolean not null default true,
  created_at timestamptz not null default now(),
  constraint permissoes_sistema_chave_check check (chave ~ '^[a-z][a-z0-9_]*\.[a-z][a-z0-9_]*$'),
  constraint permissoes_sistema_modulo_check check (modulo ~ '^[a-z][a-z0-9_]*$')
);

comment on table public.permissoes_sistema is
  'Catálogo fechado de capacidades reconhecidas pelo sistema; novas chaves são instaladas por migration.';

create table if not exists public.papeis_acesso (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  slug text not null unique,
  descricao text,
  ativo boolean not null default true,
  sistema boolean not null default false,
  criado_por uuid references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint papeis_acesso_nome_check check (char_length(trim(nome)) between 2 and 80),
  constraint papeis_acesso_slug_check check (slug ~ '^[a-z][a-z0-9_]{1,49}$')
);

create table if not exists public.papel_permissoes (
  papel_id uuid not null references public.papeis_acesso(id) on delete cascade,
  permissao_chave text not null references public.permissoes_sistema(chave) on delete restrict,
  concedido_por uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  primary key (papel_id, permissao_chave)
);

-- Relação separada mantém o campo legado profiles.papel intacto durante a migração.
-- A chave primária garante exatamente zero ou um papel configurável por perfil.
create table if not exists public.perfil_papel_acesso (
  profile_id uuid primary key references public.profiles(id) on delete cascade,
  papel_id uuid not null references public.papeis_acesso(id) on delete restrict,
  atribuido_por uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists papel_permissoes_permissao_idx
  on public.papel_permissoes(permissao_chave, papel_id);
create index if not exists perfil_papel_acesso_papel_idx
  on public.perfil_papel_acesso(papel_id);

insert into public.permissoes_sistema(chave, modulo, nome, descricao, sensivel) values
  ('usuarios.visualizar', 'usuarios', 'Visualizar usuários', 'Consultar usuários e seus papéis.', true),
  ('usuarios.criar', 'usuarios', 'Criar usuários', 'Criar contas de acesso ao sistema.', true),
  ('usuarios.editar', 'usuarios', 'Editar usuários', 'Alterar dados, status e papel permitido de usuários.', true),
  ('usuarios.redefinir_senha', 'usuarios', 'Redefinir senhas', 'Prestar suporte redefinindo a senha de outra conta.', true),
  ('papeis.atribuir', 'papeis', 'Atribuir papéis', 'Atribuir papéis previamente autorizados aos usuários.', true),
  ('papeis.gerenciar', 'papeis', 'Gerenciar papéis', 'Criar, editar, desativar e configurar papéis.', true),
  ('agenda.visualizar_propria', 'agenda', 'Visualizar agenda própria', 'Consultar os próprios compromissos.' , false),
  ('agenda.visualizar_equipe', 'agenda', 'Visualizar agenda da equipe', 'Consultar compromissos de outros responsáveis.', true),
  ('agenda.gerenciar', 'agenda', 'Gerenciar agenda', 'Criar, editar, reagendar e cancelar compromissos.', true),
  ('disponibilidade.gerenciar', 'disponibilidade', 'Gerenciar disponibilidade', 'Configurar expedientes e bloqueios da equipe.', true),
  ('frequencia.registrar_propria', 'frequencia', 'Registrar frequência própria', 'Registrar ocorrências relacionadas aos próprios atendimentos.', false),
  ('frequencia.visualizar_equipe', 'frequencia', 'Visualizar frequência da equipe', 'Consultar indicadores e ocorrências de toda a equipe.', true),
  ('frequencia.gerenciar', 'frequencia', 'Gerenciar frequência', 'Registrar e desfazer ocorrências administrativas da equipe.', true),
  ('pacientes.cadastrar', 'pacientes', 'Cadastrar pacientes', 'Realizar cadastro clínico de paciente.', false),
  ('pacientes.cadastrar_administrativo', 'pacientes', 'Cadastrar pacientes administrativamente', 'Cadastrar paciente sem conceder acesso ao prontuário.', true),
  ('pacientes.editar_cadastro', 'pacientes', 'Editar cadastro do paciente', 'Alterar dados cadastrais quando também houver autorização sobre o paciente.', true),
  ('acessos.solicitar', 'acessos', 'Solicitar acesso', 'Solicitar vínculo com paciente existente.', false),
  ('acessos.aprovar', 'acessos', 'Aprovar solicitações', 'Decidir solicitações quando autorizado sobre o paciente.', true),
  ('sessoes.registrar', 'sessoes', 'Registrar sessões', 'Registrar sessões para pacientes autorizados.', false),
  ('sessoes.editar_proprias', 'sessoes', 'Editar sessões próprias', 'Editar registros clínicos de própria autoria.', false),
  ('clinico.visualizar', 'clinico', 'Visualizar prontuário', 'Visualizar dados clínicos quando houver vínculo ou regra explícita.', true),
  ('clinico.planejar', 'clinico', 'Gerenciar planejamento', 'Criar e alterar planejamento clínico próprio.', true),
  ('compartilhamento.gerenciar', 'compartilhamento', 'Gerenciar compartilhamentos', 'Criar e revogar acessos externos dentro do próprio escopo clínico.', true),
  ('habilidades.gerenciar', 'habilidades', 'Gerenciar habilidades', 'Cadastrar e manter o catálogo de habilidades.', true),
  ('auditoria.visualizar', 'auditoria', 'Visualizar auditoria', 'Consultar eventos auditáveis do sistema.', true)
on conflict (chave) do update set
  modulo=excluded.modulo,
  nome=excluded.nome,
  descricao=excluded.descricao,
  sensivel=excluded.sensivel;

alter table public.permissoes_sistema enable row level security;
alter table public.papeis_acesso enable row level security;
alter table public.papel_permissoes enable row level security;
alter table public.perfil_papel_acesso enable row level security;

-- Somente o principal enxerga a configuração completa e pode administrá-la.
-- Não há policies de escrita no catálogo de permissões: ele é controlado por migrations.
drop policy if exists permissoes_sistema_principal_select on public.permissoes_sistema;
create policy permissoes_sistema_principal_select on public.permissoes_sistema
  for select to authenticated using (public.usuario_admin_principal());
drop policy if exists papeis_acesso_principal_all on public.papeis_acesso;
create policy papeis_acesso_principal_all on public.papeis_acesso
  for all to authenticated using (public.usuario_admin_principal())
  with check (public.usuario_admin_principal());
drop policy if exists papel_permissoes_principal_all on public.papel_permissoes;
create policy papel_permissoes_principal_all on public.papel_permissoes
  for all to authenticated using (public.usuario_admin_principal())
  with check (public.usuario_admin_principal());
drop policy if exists perfil_papel_acesso_principal_all on public.perfil_papel_acesso;
create policy perfil_papel_acesso_principal_all on public.perfil_papel_acesso
  for all to authenticated using (public.usuario_admin_principal())
  with check (public.usuario_admin_principal());

create or replace function public.usuario_tem_permissao(p_chave text, p_usuario_id uuid default auth.uid())
returns boolean language sql stable security definer set search_path='' set row_security=off as $$
  select case
    when p_usuario_id is null then false
    when p_usuario_id<>auth.uid() and not public.usuario_admin_principal() then false
    when exists(
      select 1 from public.profiles p
      where p.id=p_usuario_id and p.status='ativo' and p.admin_principal
    ) then exists(
      select 1 from public.permissoes_sistema ps where ps.chave=p_chave and ps.ativo
    )
    else exists(
      select 1
      from public.perfil_papel_acesso ppa
      join public.papeis_acesso pa on pa.id=ppa.papel_id and pa.ativo
      join public.papel_permissoes pp on pp.papel_id=pa.id
      join public.permissoes_sistema ps on ps.chave=pp.permissao_chave and ps.ativo
      join public.profiles p on p.id=ppa.profile_id and p.status='ativo'
      where ppa.profile_id=p_usuario_id and ps.chave=p_chave
    )
  end
$$;

create or replace function public.minhas_permissoes()
returns table(chave text) language sql stable security definer
set search_path='' set row_security=off as $$
  select ps.chave
  from public.permissoes_sistema ps
  where ps.ativo and public.usuario_tem_permissao(ps.chave, auth.uid())
  order by ps.chave
$$;

revoke all on function public.usuario_tem_permissao(text,uuid) from public;
revoke all on function public.minhas_permissoes() from public;
grant execute on function public.usuario_tem_permissao(text,uuid) to authenticated;
grant execute on function public.minhas_permissoes() to authenticated;

create or replace function public.auditar_configuracao_papel()
returns trigger language plpgsql security definer set search_path='' as $$
declare
  v_entidade uuid;
  v_anterior jsonb := case when tg_op in('UPDATE','DELETE') then to_jsonb(old) else null end;
  v_novo jsonb := case when tg_op in('INSERT','UPDATE') then to_jsonb(new) else null end;
begin
  v_entidade := coalesce(
    nullif(v_novo->>'id','')::uuid,
    nullif(v_anterior->>'id','')::uuid,
    nullif(v_novo->>'papel_id','')::uuid,
    nullif(v_anterior->>'papel_id','')::uuid
  );
  insert into public.audit_logs(user_id,action,entity_type,entity_id,metadata)
  values(
    auth.uid(),
    upper(tg_table_name||'_'||tg_op),
    tg_table_name,
    v_entidade,
    jsonb_build_object(
      'anterior',v_anterior,
      'novo',v_novo
    )
  );
  return case when tg_op='DELETE' then old else new end;
end
$$;

drop trigger if exists papeis_acesso_auditoria on public.papeis_acesso;
create trigger papeis_acesso_auditoria after insert or update or delete on public.papeis_acesso
for each row execute function public.auditar_configuracao_papel();
drop trigger if exists papel_permissoes_auditoria on public.papel_permissoes;
create trigger papel_permissoes_auditoria after insert or update or delete on public.papel_permissoes
for each row execute function public.auditar_configuracao_papel();
drop trigger if exists perfil_papel_acesso_auditoria on public.perfil_papel_acesso;
create trigger perfil_papel_acesso_auditoria after insert or update or delete on public.perfil_papel_acesso
for each row execute function public.auditar_configuracao_papel();

notify pgrst, 'reload schema';
