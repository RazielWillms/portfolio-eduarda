import { readFileSync } from "node:fs"
import { join } from "node:path"
import { describe, expect, it } from "vitest"
const sql = readFileSync(join(process.cwd(), "supabase/migrations/20260812170000_contexto_generalizacao_sessao.sql"), "utf8")
describe("contexto de generalização", () => {
  it("usa categorias mínimas e bloqueia a RPC anterior", () => {
    expect(sql).toContain("ambiente_tipo")
    expect(sql).toContain("aplicador_tipo")
    expect(sql).toContain("registrar_sessao_clinica_v2")
    expect(sql).toContain("revoke execute on function public.registrar_sessao_clinica")
  })
})
