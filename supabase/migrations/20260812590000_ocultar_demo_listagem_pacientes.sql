-- O cenário reservado continua disponível pelas RPCs SECURITY DEFINER do modo
-- demonstração, mas deixa de ser consultável nas telas operacionais normais.
drop policy if exists pacientes_select on public.pacientes;
create policy pacientes_select on public.pacientes
for select to authenticated
using (
  not public.paciente_demonstracao(id)
  and (public.usuario_admin() or public.usuario_vinculado(id))
);

notify pgrst, 'reload schema';
