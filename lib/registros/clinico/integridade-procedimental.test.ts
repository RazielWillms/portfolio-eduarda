import { readFileSync } from "node:fs"
import { join } from "node:path"
import { describe, expect, it } from "vitest"
const sql = readFileSync(join(process.cwd(), "supabase/migrations/20260812190000_integridade_procedimental.sql"), "utf8")
describe("integridade procedimental", () => {
  it("exige um checklist para cada medição da sessão", () => {
    expect(sql).toContain("missing_procedural_integrity")
    expect(sql).toContain("unique(registro_medicao_id)")
    expect(sql).toContain("itens_realizados=itens_previstos or length(trim(desvios))>=3")
  })
  it("bloqueia a RPC anterior e mantém criação atômica", () => {
    expect(sql).toContain("registrar_sessao_clinica_v3")
    expect(sql).toContain("revoke execute on function public.registrar_sessao_clinica_v2")
    expect(sql).not.toMatch(/create policy .* for insert/)
  })
  it("não replica detalhes dos desvios na auditoria", () => {
    const auditoria = sql.slice(sql.indexOf("create or replace function public.auditar_integridade_procedimental"))
    expect(auditoria).not.toContain("new.desvios")
    expect(auditoria).not.toMatch(/new\.itens(?:\W|$)/)
  })
})
