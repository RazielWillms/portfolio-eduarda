-- Etapa 3: habilidades especificas por paciente e leitura clinica segura.

create table public.paciente_habilidades (
  id uuid primary key default gen_random_uuid(),
  paciente_id uuid not null references public.pacientes(id) on delete cascade,
  habilidade_id uuid not null references public.habilidades(id) on delete restrict,
  peso numeric(6,2) not null default 1 check (peso > 0 and peso <= 100),
  ativo boolean not null default true,
  iniciado_em date not null default current_date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (paciente_id, habilidade_id)
);

-- Atendimentos anteriores ja caracterizam uma habilidade trabalhada.
insert into public.paciente_habilidades (paciente_id, habilidade_id, peso, iniciado_em)
select a.paciente_id, a.habilidade_id, 1, min(a.data)
from public.atendimentos a
group by a.paciente_id, a.habilidade_id
on conflict (paciente_id, habilidade_id) do nothing;

create or replace function public.atualizar_paciente_habilidades_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin new.updated_at = now(); return new; end
$$;

create trigger paciente_habilidades_updated_at
before update on public.paciente_habilidades
for each row execute function public.atualizar_paciente_habilidades_updated_at();

create or replace function public.preservar_identidade_paciente_habilidade()
returns trigger language plpgsql set search_path = '' as $$
begin
  if new.paciente_id <> old.paciente_id or new.habilidade_id <> old.habilidade_id then
    raise exception 'patient_skill_identity_is_immutable' using errcode = '22023';
  end if;
  return new;
end
$$;

create trigger paciente_habilidades_identidade_imutavel
before update on public.paciente_habilidades
for each row execute function public.preservar_identidade_paciente_habilidade();

alter table public.paciente_habilidades enable row level security;
alter table public.paciente_habilidades force row level security;

create policy paciente_habilidades_select on public.paciente_habilidades for select to authenticated
  using (public.usuario_admin() or public.usuario_vinculado(paciente_id));
create policy paciente_habilidades_insert on public.paciente_habilidades for insert to authenticated
  with check (public.usuario_admin() or public.usuario_vinculado(paciente_id));
create policy paciente_habilidades_update on public.paciente_habilidades for update to authenticated
  using (public.usuario_admin() or public.usuario_vinculado(paciente_id))
  with check (public.usuario_admin() or public.usuario_vinculado(paciente_id));

-- Retorna apenas a serie necessaria aos calculos. Observacoes e demais campos
-- privados nunca atravessam esta funcao.
create or replace function public.avaliacoes_clinicas_paciente(p_paciente_id uuid)
returns table (
  id uuid,
  habilidade_id uuid,
  data date,
  created_at timestamptz,
  codigo text,
  valor numeric,
  profissional_nome text
)
language sql
stable
security definer
set search_path = ''
as $$
  select a.id, a.habilidade_id, a.data, a.created_at, n.codigo, n.valor,
    case when a.psicologo_id = auth.uid() or public.usuario_admin() then p.nome else null end
  from public.atendimentos a
  join public.niveis_avaliacao n on n.id = a.nivel_avaliacao_id
  left join public.profiles p on p.id = a.psicologo_id
  where a.paciente_id = p_paciente_id
    and (public.usuario_admin() or public.usuario_vinculado(p_paciente_id))
  order by a.data, a.created_at, a.id
$$;

revoke all on function public.avaliacoes_clinicas_paciente(uuid) from public;
grant execute on function public.avaliacoes_clinicas_paciente(uuid) to authenticated;

-- Um atendimento novo ativa implicitamente o vinculo da habilidade. Isso
-- preserva compatibilidade com o formulario existente e evita registros orfaos.
create or replace function public.garantir_paciente_habilidade()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not (public.usuario_admin() or (new.psicologo_id = auth.uid() and public.usuario_vinculado(new.paciente_id))) then
    raise exception 'unauthorized' using errcode = '42501';
  end if;
  insert into public.paciente_habilidades (paciente_id, habilidade_id, peso, iniciado_em, ativo)
  values (new.paciente_id, new.habilidade_id, 1, new.data, true)
  on conflict (paciente_id, habilidade_id)
  do update set ativo = true;
  return new;
end
$$;

create trigger atendimentos_garantir_paciente_habilidade
before insert or update of paciente_id, habilidade_id on public.atendimentos
for each row execute function public.garantir_paciente_habilidade();
