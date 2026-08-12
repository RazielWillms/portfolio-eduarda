import { readFileSync } from "node:fs"
import { join } from "node:path"
import { describe, expect, it } from "vitest"
const sql = readFileSync(join(process.cwd(), "supabase/migrations/20260812200000_observacoes_abc_funcionais.sql"), "utf8")
describe("observações ABC", () => {
  it("aceita apenas alvos de redução medidos na própria sessão", () => {
    expect(sql).toContain("r.sessao_id=v_id")
    expect(sql).toContain("a.natureza='reducao'")
    expect(sql).toContain("invalid_abc_target")
  })
  it("trata função como hipótese limitada e isola por autor", () => {
    expect(sql).toContain("funcao_hipotese")
    expect(sql).toContain("profissional_id=auth.uid()")
    expect(sql).not.toMatch(/create policy .* for insert/)
  })
  it("não replica a narrativa clínica na auditoria", () => {
    const auditoria = sql.slice(sql.indexOf("create or replace function public.auditar_observacao_abc"))
    expect(auditoria).not.toContain("new.antecedente")
    expect(auditoria).not.toContain("new.consequencia")
    expect(auditoria).not.toContain("new.comportamento_observado")
  })
})
