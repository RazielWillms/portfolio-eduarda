import { readFileSync } from "node:fs"
import { join } from "node:path"
import { describe, expect, it } from "vitest"

const sql = readFileSync(join(process.cwd(), "supabase/migrations/20260812150000_sessoes_clinicas_estruturadas.sql"), "utf8")
const auditoriaCorrigidaSql = readFileSync(join(process.cwd(), "supabase/migrations/20260812270000_corrigir_auditoria_sessoes.sql"), "utf8")
const prePlanejamentoSql = readFileSync(join(process.cwd(), "supabase/migrations/20260812350000_sessoes_pre_planejamento.sql"), "utf8")

describe("sessoes clinicas estruturadas", () => {
  it("registra sessao e múltiplos alvos em uma única RPC", () => {
    expect(sql).toContain("create or replace function public.registrar_sessao_clinica")
    expect(sql).toContain("for v_item in select value from jsonb_array_elements(p_registros)")
    expect(sql).toContain("unique (sessao_id,alvo_id)")
    expect(sql).toContain("duplicate_target_in_session")
  })

  it("valida os dados conforme o tipo de medicao", () => {
    expect(sql).toContain("public.validar_dados_medicao")
    expect(sql).toContain("percentual_oportunidades")
    expect(sql).toContain("escala_independencia")
    expect(sql).toContain("intervalos_com_ocorrencia")
  })

  it("isola sessoes por autor e não oferece escrita direta", () => {
    expect(sql).toContain("profissional_id=auth.uid()")
    expect(sql).toContain("s.profissional_id=auth.uid()")
    expect(sql).not.toMatch(/create policy .* for insert/)
    expect(sql).not.toMatch(/create policy .* for update/)
    expect(sql).toContain("revoke all on function public.registrar_sessao_clinica")
  })

  it("não copia conteúdo clínico privado para a auditoria", () => {
    const trechoAuditoria = sql.slice(sql.indexOf("create or replace function public.auditar_sessao_estruturada"))
    expect(trechoAuditoria).not.toContain("observacoes_privadas")
    expect(trechoAuditoria).not.toContain("'dados',new.dados")
  })

  it("audita tabelas com formatos diferentes sem acessar campos inexistentes", () => {
    expect(auditoriaCorrigidaSql).toContain("to_jsonb(new)")
    expect(auditoriaCorrigidaSql).toContain("v_novo->>'sessao_id'")
    expect(auditoriaCorrigidaSql).not.toContain("new.sessao_id")
  })

  it("permite sessões pré-planejamento sem alvos, preservando vínculo e autoria", () => {
    expect(prePlanejamentoSql).toContain("'vinculo_acolhimento'")
    expect(prePlanejamentoSql).toContain("jsonb_array_length(coalesce(p_registros,'[]'::jsonb))=0")
    expect(prePlanejamentoSql).toContain("public.usuario_vinculado(p_paciente_id)")
    expect(prePlanejamentoSql).toContain("profissional_id")
  })

  it("permite linha de base sem protocolo e mantém integridade quando há protocolo", () => {
    expect(prePlanejamentoSql).toContain("protocolo_intervencao_id is not null")
    expect(prePlanejamentoSql).toContain("missing_procedural_integrity")
  })
})
