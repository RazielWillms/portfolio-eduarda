import{readFileSync}from"node:fs";import{join}from"node:path";import{describe,expect,it}from"vitest"
const sql=readFileSync(join(process.cwd(),"supabase/migrations/20260812230000_validade_social_assentimento.sql"),"utf8")
describe("validade social e assentimento",()=>{
  it("não confunde observação com consentimento e valida escalas",()=>{expect(sql).toContain("assentimento_observado");expect(sql).toContain("between 1 and 5");expect(sql).toContain("'nao_observado'")})
  it("restringe alvo ao paciente e profissional",()=>{expect(sql).toContain("p.paciente_id=p_paciente_id");expect(sql).toContain("a.profissional_id=auth.uid()")})
  it("não permite escrita direta nem copia relatos para auditoria",()=>{expect(sql).not.toMatch(/create policy .* for insert/);const a=sql.slice(sql.indexOf("create or replace function public.auditar_validade_social"));expect(a).not.toContain("new.relato");expect(a).not.toContain("new.adaptacoes_necessarias")})
})
