-- Catálogo normalizado de profissões e buscas operacionais paginadas.
create table if not exists public.profissoes(
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  conselho_sigla text,
  ativo boolean not null default true,
  ordem integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profissoes_nome_check check(length(trim(nome))between 2 and 100),
  constraint profissoes_conselho_check check(conselho_sigla is null or length(trim(conselho_sigla))between 2 and 30)
);
create unique index if not exists profissoes_nome_normalizado_uidx on public.profissoes(lower(trim(nome)));

insert into public.profissoes(nome,conselho_sigla,ordem)values
 ('Psicólogo','CRP',10),('Fonoaudiólogo','CREFONO',20),('Terapeuta ocupacional','CREFITO',30),
 ('Psicopedagogo',null,40),('Fisioterapeuta','CREFITO',50),('Assistente social','CRESS',60),
 ('Médico','CRM',70),('Pedagogo',null,80),('Outro',null,999)
on conflict do nothing;

alter table public.profiles add column if not exists profissao_id uuid references public.profissoes(id);
update public.profiles p set profissao_id=pr.id
from public.profissoes pr where p.profissao_id is null and(
 lower(trim(p.profissao))=lower(trim(pr.nome))
 or(lower(p.profissao)like'%psic%'and pr.nome='Psicólogo')
 or(lower(p.profissao)like'%fono%'and pr.nome='Fonoaudiólogo')
 or(lower(p.profissao)like'%ocupacional%'and pr.nome='Terapeuta ocupacional')
 or(lower(p.profissao)like'%fisioter%'and pr.nome='Fisioterapeuta')
 or(lower(p.profissao)like'%pedagog%'and pr.nome='Pedagogo')
 or(lower(p.profissao)like'%social%'and pr.nome='Assistente social')
 or(lower(p.profissao)like'%medic%'and pr.nome='Médico'));
update public.profiles set profissao_id=(select id from public.profissoes where nome='Outro')where profissao_id is null and nullif(trim(profissao),'')is not null;
create index if not exists profiles_profissao_id_idx on public.profiles(profissao_id)where profissao_id is not null;

alter table public.profissoes enable row level security;
drop policy if exists profissoes_select on public.profissoes;
create policy profissoes_select on public.profissoes for select to authenticated using(ativo or exists(select 1 from public.profiles p where p.id=auth.uid()and p.admin_principal));

create or replace function public.listar_profissoes(p_incluir_inativas boolean default false)
returns table(id uuid,nome text,conselho_sigla text,ativo boolean,ordem integer)
language sql stable security definer set search_path='' set row_security=off as $$
 select pr.id,pr.nome,pr.conselho_sigla,pr.ativo,pr.ordem from public.profissoes pr
 where pr.ativo or(p_incluir_inativas and exists(select 1 from public.profiles p where p.id=auth.uid()and p.admin_principal and p.status='ativo'))
 order by pr.ordem,pr.nome
$$;

create or replace function public.salvar_profissao(p_id uuid,p_nome text,p_conselho_sigla text,p_ativo boolean,p_ordem integer)
returns uuid language plpgsql security definer set search_path='' set row_security=off as $$declare v_id uuid;begin
 if not exists(select 1 from public.profiles where id=auth.uid()and admin_principal and status='ativo')then raise exception'unauthorized'using errcode='42501';end if;
 if length(trim(coalesce(p_nome,'')))not between 2 and 100 then raise exception'invalid_profession'using errcode='22023';end if;
 if p_id is null then insert into public.profissoes(nome,conselho_sigla,ativo,ordem)values(trim(p_nome),nullif(upper(trim(p_conselho_sigla)),''),coalesce(p_ativo,true),coalesce(p_ordem,0))returning id into v_id;
 else update public.profissoes set nome=trim(p_nome),conselho_sigla=nullif(upper(trim(p_conselho_sigla)),''),ativo=coalesce(p_ativo,true),ordem=coalesce(p_ordem,0),updated_at=now()where id=p_id returning id into v_id;end if;
 return v_id;
end$$;

create or replace function public.atualizar_meus_dados_profissionais_v2(p_profissao_id uuid,p_conselho_numero text,p_conselho_uf text)
returns void language plpgsql security definer set search_path='' set row_security=off as $$declare v_profissao public.profissoes%rowtype;begin
 if auth.uid()is null or not public.usuario_ativo()then raise exception'unauthorized'using errcode='42501';end if;
 if p_profissao_id is not null then select*into v_profissao from public.profissoes where id=p_profissao_id and ativo;if v_profissao.id is null then raise exception'invalid_profession'using errcode='22023';end if;end if;
 if length(coalesce(p_conselho_numero,''))>40 or(p_conselho_uf is not null and trim(p_conselho_uf)<>''and upper(trim(p_conselho_uf))!~'^[A-Z]{2}$')then raise exception'invalid_professional_data'using errcode='22023';end if;
 update public.profiles set profissao_id=p_profissao_id,profissao=v_profissao.nome,conselho_tipo=v_profissao.conselho_sigla,conselho_numero=nullif(trim(p_conselho_numero),''),conselho_uf=nullif(upper(trim(p_conselho_uf)),'')where id=auth.uid();
end$$;

create or replace function public.buscar_pacientes_operacionais(p_busca text default'',p_status text default'ativo',p_limite integer default 20,p_offset integer default 0)
returns table(id uuid,nome text,responsavel text,status text,total bigint)
language plpgsql stable security definer set search_path='' set row_security=off as $$begin
 if not(public.usuario_tem_permissao('agenda.gerenciar')or public.usuario_tem_permissao('frequencia.gerenciar')or public.usuario_tem_permissao('frequencia.registrar_propria'))then raise exception'unauthorized'using errcode='42501';end if;
 return query select p.id,p.nome_completo,p.nome_responsavel,p.status,count(*)over() from public.pacientes p
 where not public.paciente_demonstracao(p.id)and(p_status='todos'or p.status=p_status)
 and(public.usuario_tem_permissao('agenda.gerenciar')or public.usuario_tem_permissao('frequencia.gerenciar')or exists(select 1 from public.paciente_psicologos pp where pp.paciente_id=p.id and pp.psicologo_id=auth.uid()))
 and(coalesce(trim(p_busca),'')=''or p.nome_completo ilike'%'||trim(p_busca)||'%'or coalesce(p.nome_responsavel,'')ilike'%'||trim(p_busca)||'%')
 order by p.nome_completo limit least(greatest(p_limite,1),50)offset greatest(p_offset,0);
end$$;

create or replace function public.buscar_profissionais_operacionais(p_busca text default'',p_profissao_id uuid default null,p_limite integer default 20,p_offset integer default 0)
returns table(id uuid,nome text,profissao_id uuid,profissao text,conselho_sigla text,total bigint)
language plpgsql stable security definer set search_path='' set row_security=off as $$begin
 if not(public.usuario_tem_permissao('agenda.gerenciar')or public.usuario_tem_permissao('frequencia.gerenciar'))then raise exception'unauthorized'using errcode='42501';end if;
 return query select p.id,p.nome,p.profissao_id,coalesce(pr.nome,p.profissao),coalesce(pr.conselho_sigla,p.conselho_tipo),count(*)over()
 from public.profiles p left join public.profissoes pr on pr.id=p.profissao_id
 where p.status='ativo'and p.papel in('profissional','coordenacao')and not public.usuario_demonstracao(p.id)
 and(p_profissao_id is null or p.profissao_id=p_profissao_id)
 and(coalesce(trim(p_busca),'')=''or p.nome ilike'%'||trim(p_busca)||'%')
 order by p.nome limit least(greatest(p_limite,1),50)offset greatest(p_offset,0);
end$$;

revoke all on function public.listar_profissoes(boolean),public.salvar_profissao(uuid,text,text,boolean,integer),public.atualizar_meus_dados_profissionais_v2(uuid,text,text),public.buscar_pacientes_operacionais(text,text,integer,integer),public.buscar_profissionais_operacionais(text,uuid,integer,integer)from public;
grant execute on function public.listar_profissoes(boolean),public.atualizar_meus_dados_profissionais_v2(uuid,text,text),public.buscar_pacientes_operacionais(text,text,integer,integer),public.buscar_profissionais_operacionais(text,uuid,integer,integer)to authenticated;
grant execute on function public.salvar_profissao(uuid,text,text,boolean,integer)to authenticated;
notify pgrst,'reload schema';
