import { describe, expect, it } from "vitest"
import { readFileSync } from "node:fs"
import { join } from "node:path"

const ler = (arquivo: string) => readFileSync(join(process.cwd(), arquivo), "utf8")

describe("busca de horários por profissional", () => {
  const sql = ler("supabase/migrations/20260812720000_busca_horarios_por_profissional.sql")

  it("considera expediente, disponibilidade real e conflito do paciente", () => {
    expect(sql).toContain("disponibilidades_profissional")
    expect(sql).toContain("horario_disponivel")
    expect(sql).toContain("a.paciente_id=p_paciente_id")
    expect(sql).toContain("tstzrange")
    expect(sql).toContain("interval '15 minutes'")
  })

  it("não devolve detalhes de compromissos ocupados", () => {
    expect(sql).toContain("returns table(inicio timestamptz,fim timestamptz)")
    expect(sql).not.toContain("paciente_nome")
    expect(sql).not.toContain("observacao_administrativa")
  })

  it("oferece os dois modos no mesmo formulário", () => {
    const form = ler("components/registros/novo-agendamento-form.tsx")
    const busca = ler("components/registros/busca-horarios-profissional.tsx")
    expect(form).toContain("Tenho uma data e horário")
    expect(form).toContain("Tenho um profissional")
    expect(form).toContain("BuscaHorariosProfissional")
    expect(form).toContain("Horário selecionado")
    expect(form).toContain('modo==="horario"&&<Card>')
    expect(busca).toContain("aria-pressed={escolhido}")
    expect(busca).toContain("Horários livres na semana")
    expect(busca).not.toContain("Próximos 30 dias")
  })

  it("abre e permite remover o filtro de um compromisso vindo da frequência", () => {
    const frequencia = ler("components/registros/frequencia-painel.tsx")
    const agenda = ler("components/registros/agenda-operacional.tsx")
    expect(frequencia).toContain("&destaque=${r.agendamento_id}")
    expect(agenda).toContain("Compromisso localizado pela Frequência")
    expect(agenda).toContain("Remover filtro")
    expect(agenda).toMatch(/a\.id\s*===\s*destaqueId/)
  })
})
