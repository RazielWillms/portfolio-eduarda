import { readFileSync } from "node:fs"
import { join } from "node:path"
import { describe, expect, it } from "vitest"

const sql = readFileSync(join(process.cwd(), "supabase/migrations/20260812160000_criterio_vigente_na_medicao.sql"), "utf8")
describe("critério vigente na medição", () => {
  it("captura automaticamente a versão vigente sem reescrever dados antigos", () => {
    expect(sql).toContain("add column if not exists criterio_dominio_id")
    expect(sql).toContain("before insert on public.registros_medicao")
    expect(sql).toContain("order by c.versao desc limit 1")
    expect(sql).not.toMatch(/update public\.registros_medicao/)
  })
})
