import { readFileSync } from "node:fs"
import { join } from "node:path"
import { describe, expect, it } from "vitest"
const sql = readFileSync(join(process.cwd(), "supabase/migrations/20260812180000_protocolos_intervencao_versionados.sql"), "utf8")
describe("protocolos de intervenção", () => {
  it("versiona protocolos sem permitir escrita direta", () => {
    expect(sql).toContain("pg_advisory_xact_lock")
    expect(sql).toContain("coalesce(max(versao),0)+1")
    expect(sql).not.toMatch(/create policy .* for insert/)
  })
  it("vincula o protocolo vigente à medição e minimiza a auditoria", () => {
    expect(sql).toContain("before insert on public.registros_medicao")
    expect(sql).toContain("protocolo_intervencao_id")
    const auditoria = sql.slice(sql.indexOf("create or replace function public.auditar_protocolo_intervencao"))
    expect(auditoria).not.toContain("'reforcadores',new.reforcadores")
    expect(auditoria).not.toContain("'correcao_erro',new.correcao_erro")
  })
})
