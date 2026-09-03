import { describe, expect, it } from "vitest"
import { readFileSync } from "node:fs"
import { join } from "node:path"
import { mensagemErroOcorrencia } from "./frequencia-erros"

const migration = (name: string) => readFileSync(join(process.cwd(), "supabase/migrations", name), "utf8")
const sql = migration("20260903000000_corrigir_responsavel_ocorrencia_coordenacao.sql")
const anterior = migration("20260812870000_sequencias_faltas_nao_justificadas.sql")

describe("regressão de frequência para coordenação", () => {
  it("usa a mesma regra assistencial da agenda, sem exigir papel profissional", () => {
    expect(sql).toContain("not public.perfil_pode_atender(p_profissional_id)")
    expect(sql).not.toContain("papel='profissional'")
    const regra = migration("20260812550000_coordenacao_pode_atender.sql")
    expect(regra).toContain("papel in('profissional','coordenacao')and status='ativo'")
  })
  it("preserva a autorização para si e para outros responsáveis", () => {
    const autorizacao = anterior.split("\n").find(l => l.includes("if not public.usuario_ativo()or not(public.usuario_tem_permissao('frequencia.gerenciar')"))
    expect(autorizacao).toBeTruthy()
    expect(sql).toContain(autorizacao!.trim())
  })
  it("preserva integralmente sequência, agenda e auditoria após a validação", () => {
    const corpo = (source: string) => {
      const inicio = source.indexOf("perform pg_advisory_xact_lock")
      return source.slice(inicio, source.indexOf("end$$;", inicio) + 7).replace(/\r/g, "")
    }
    expect(corpo(sql)).toBe(corpo(anterior))
  })
  it("é reaplicável sem remover a função ou alterar ocorrências antigas", () => {
    expect(sql).toContain("create or replace function public.registrar_ocorrencia_frequencia")
    expect(sql).not.toContain("drop function")
    expect(sql).toContain("begin;")
    expect(sql).toContain("commit;")
  })
})

describe("mensagens de validação das ocorrências", () => {
  it.each([
    ["invalid_occurrence_date", "data válida"],
    ["invalid_occurrence_type", "situação válida"],
    ["invalid_occurrence_reason", "pelo menos 3 caracteres"],
    ["invalid_occurrence_patient", "paciente selecionado"],
    ["invalid_occurrence_professional", "profissional ou coordenador ativo"],
    ["invalid_schedule_link", "agendamento"],
    ["invalid_sequence", "continuidade"],
    ["stale_previous_occurrence", "histórico de faltas mudou"],
  ])("explica o erro %s e corresponde ao código do banco", (message, trecho) => {
    expect(sql).toContain("'" + message + "'")
    expect(mensagemErroOcorrencia({ message, code: "22023" })).toContain(trecho)
  })
  it("não culpa a continuidade em uma falha genérica de falta justificada", () => {
    expect(mensagemErroOcorrencia({ message: "invalid_occurrence", code: "22023" })).not.toContain("continuidade")
  })
  it("distingue permissões e migration ausente", () => {
    expect(mensagemErroOcorrencia({ message: "unauthorized", code: "42501" })).toContain("permissão")
    expect(mensagemErroOcorrencia({ message: "missing", code: "PGRST202" })).toContain("migration")
  })
})
