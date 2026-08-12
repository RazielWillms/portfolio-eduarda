-- Ciclo 3: preserva o criterio vigente em cada medicao para decisoes clinicas rastreaveis.
alter table public.registros_medicao
  add column if not exists criterio_dominio_id uuid references public.criterios_dominio_alvo(id) on delete restrict;

create index if not exists registros_medicao_criterio_idx
  on public.registros_medicao(criterio_dominio_id) where criterio_dominio_id is not null;

create or replace function public.vincular_criterio_vigente_medicao()
returns trigger language plpgsql security definer set search_path='pg_catalog','public' as $$
begin
  if new.criterio_dominio_id is null then
    select c.id into new.criterio_dominio_id
    from public.criterios_dominio_alvo c
    where c.alvo_id=new.alvo_id
    order by c.versao desc limit 1;
  end if;
  return new;
end $$;

drop trigger if exists vincular_criterio_vigente_medicao on public.registros_medicao;
create trigger vincular_criterio_vigente_medicao
before insert on public.registros_medicao for each row
execute function public.vincular_criterio_vigente_medicao();

revoke all on function public.vincular_criterio_vigente_medicao() from public;
notify pgrst,'reload schema';
