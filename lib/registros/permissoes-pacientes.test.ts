import{describe,expect,it}from"vitest";import{readFileSync}from"node:fs";import{join}from"node:path"
const sql=readFileSync(join(process.cwd(),"supabase/migrations/20260812670000_permissoes_pacientes_solicitacoes.sql"),"utf8")
describe("permissões de pacientes e solicitações",()=>{
 it("não substitui vínculo por permissão clínica",()=>{expect(sql).toContain("public.usuario_vinculado(id)or public.usuario_tem_permissao('pacientes.visualizar_todos')");expect(sql).not.toContain("clinico.visualizar')or")})
 it("separa aprovação vinculada da global",()=>{expect(sql).toContain("acessos.aprovar_global");expect(sql).toContain("not public.usuario_tem_permissao('acessos.aprovar')or not(public.usuario_vinculado")})
 it("mantém vínculo automático somente no cadastro clínico e aprovação",()=>{expect(sql).toContain("criar_paciente_com_vinculo");expect(sql).toContain("on conflict do nothing")})
 it("mantém busca protegida por entrada exata e capacidade",()=>{expect(sql).toContain("buscar_possiveis_duplicatas_paciente");expect(sql).toContain("pacientes.cadastrar")})
})
