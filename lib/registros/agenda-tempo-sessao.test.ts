import { describe, expect, it } from "vitest"
import { readFileSync } from "node:fs"
import { join } from "node:path"

const ler = (arquivo: string) => readFileSync(join(process.cwd(), arquivo), "utf8")

describe("tempo da agenda e das sessões", () => {
  it("oferece o registro somente dentro da tolerância de dez minutos", () => {
    const agenda = ler("components/registros/agenda-operacional.tsx")
    expect(agenda).toContain("podeRegistrarSessao(a.inicio)")
    expect(agenda).toContain("TOLERANCIA_INICIO_SESSAO_MS = 10 * 60 * 1000")
    expect(agenda).toContain("Sessão — disponível 10 min antes")
  })

  it("protege no banco o horário do compromisso e datas futuras", () => {
    const sql = ler("supabase/migrations/20260812850000_tolerancia_inicio_sessao_agendada.sql")
    expect(sql).toContain("schedule_not_started")
    expect(sql).toContain("future_session_date")
    expect(sql).toContain("v_inicio - interval '10 minutes' > now()")
  })

  it("volta diretamente para a agenda após criar", () => {
    const formulario = ler("components/registros/novo-agendamento-form.tsx")
    expect(formulario).toContain("router.replace(`/registros/agenda?data=${data}&visao=dia&formato=lista`)")
    expect(formulario).not.toContain("else setResultado")
  })

  it("destaca a data escolhida no cabeçalho e em toda a grade", () => {
    const timeline = ler("components/registros/agenda-timeline.tsx")
    expect(timeline.match(/chaveData\(d\) === referencia/g)?.length).toBeGreaterThanOrEqual(2)
    expect(timeline).not.toContain("chaveData(d) === chaveData(new Date())")
  })
})
