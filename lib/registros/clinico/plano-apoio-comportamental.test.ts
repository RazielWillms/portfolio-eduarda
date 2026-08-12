import { readFileSync } from "node:fs"
import { join } from "node:path"
import { describe, expect, it } from "vitest"
const sql = readFileSync(join(process.cwd(), "supabase/migrations/20260812210000_planos_apoio_comportamental.sql"), "utf8")
describe("plano de apoio comportamental", () => {
  it("aceita somente alvo de redução do profissional e versiona sem sobrescrever", () => {
    expect(sql).toContain("natureza='reducao'")
    expect(sql).toContain("public.usuario_pode_editar_alvo")
    expect(sql).toContain("coalesce(max(versao),0)+1")
    expect(sql).not.toMatch(/update public\.planos_apoio_comportamental_alvo/)
  })
  it("não permite escrita direta e minimiza a auditoria", () => {
    expect(sql).not.toMatch(/create policy .* for insert/)
    const auditoria=sql.slice(sql.indexOf("create or replace function public.auditar_plano_apoio_comportamental"))
    expect(auditoria).not.toContain("new.plano_seguranca")
    expect(auditoria).not.toContain("new.justificativa_funcional")
  })
})
