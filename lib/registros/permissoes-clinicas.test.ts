import{describe,expect,it}from"vitest";import{readFileSync}from"node:fs";import{join}from"node:path"
const sql=readFileSync(join(process.cwd(),"supabase/migrations/20260812680000_permissoes_clinicas_sensiveis.sql"),"utf8")
describe("permissões clínicas sensíveis",()=>{
 it("combina planejamento com vínculo",()=>{expect(sql).toContain("clinico.visualizar')and public.usuario_vinculado(paciente_id)");expect(sql).toContain("clinico.planejar")})
 it("preserva autoria de sessões",()=>{expect(sql).toContain("profissional_id=auth.uid()and public.usuario_tem_permissao('clinico.visualizar')");expect(sql).toContain("sessoes.registrar")})
 it("mantém exceção global explícita e separada",()=>{expect(sql).toContain("clinico.visualizar_todos");expect(sql).not.toContain("public.usuario_admin()")})
 it("fecha a versão anterior da RPC",()=>{expect(sql).toContain("revoke execute on function public.registrar_sessao_clinica_v6")})
})
