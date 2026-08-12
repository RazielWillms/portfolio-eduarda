import { readFileSync } from "node:fs"
import { join } from "node:path"
import { describe, expect, it } from "vitest"

const sql = readFileSync(join(process.cwd(), "supabase/migrations/20260812140000_criterio_dominio_versionado.sql"), "utf8")

describe("criterio de dominio versionado", () => {
  it("serializa a numeracao e nunca altera versoes anteriores", () => {
    expect(sql).toContain("pg_advisory_xact_lock")
    expect(sql).toContain("coalesce(max(versao),0)+1")
    expect(sql).toContain("insert into public.criterios_dominio_alvo")
    expect(sql).not.toMatch(/update public\.criterios_dominio_alvo/)
  })

  it("exige autoria autorizada e valida os limites", () => {
    expect(sql).toContain("public.usuario_pode_editar_alvo")
    expect(sql).toContain("invalid_mastery_criterion")
    expect(sql).toContain("p_sessoes_consecutivas<1")
  })
})
