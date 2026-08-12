import { readFileSync } from "node:fs"
import { join } from "node:path"
import { describe, expect, it } from "vitest"

const sql = readFileSync(join(process.cwd(), "supabase/migrations/20260812120000_fundacao_clinica_aba.sql"), "utf8")

describe("fundacao clinica ABA", () => {
  it("mantem definicoes, medicoes, criterios e fases versionados e imutaveis", () => {
    expect(sql).toContain("unique (alvo_id,versao)")
    expect(sql).toContain("clinical_version_is_immutable")
    expect(sql).not.toMatch(/create policy (definicoes|medicoes|criterios|fases)_(update|delete)/)
  })

  it("restringe escrita ao profissional responsavel e vinculado", () => {
    expect(sql).toContain("profissional_responsavel_id=auth.uid()")
    expect(sql).toContain("public.usuario_vinculado(paciente_id)")
    expect(sql).toContain("public.usuario_pode_editar_alvo")
  })

  it("obriga mudanca de fase pela RPC auditavel", () => {
    expect(sql).toContain("use_target_phase_rpc")
    expect(sql).toContain("public.alterar_fase_alvo")
    expect(sql).toContain("insert into public.historico_fases_alvo")
  })

  it("remove conteudo clinico sensivel dos logs genericos", () => {
    expect(sql).toContain("when 'definicoes_operacionais_alvo'")
    expect(sql).toContain("p_dados-array['parametros']")
    expect(sql).toContain("p_dados-array['motivo']")
  })
})
