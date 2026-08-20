import { describe, expect, it } from "vitest"
import { readFileSync } from "node:fs"
import { join } from "node:path"

const ler = (arquivo: string) => readFileSync(join(process.cwd(), arquivo), "utf8")

describe("tempo da agenda e das sessões", () => {
  it("não oferece registro antes do início do compromisso", () => {
    const agenda = ler("components/registros/agenda-operacional.tsx")
    expect(agenda).toContain("podeRegistrarSessao(a.inicio)")
    expect(agenda).toContain("Sessão — disponível no horário")
  })

  it("protege no banco o horário do compromisso e datas futuras", () => {
    const sql = ler("supabase/migrations/20260812710000_impedir_sessoes_futuras.sql")
    expect(sql).toContain("schedule_not_started")
    expect(sql).toContain("future_session_date")
    expect(sql).toContain("v_inicio > now()")
  })

  it("destaca a data escolhida no cabeçalho e em toda a grade", () => {
    const timeline = ler("components/registros/agenda-timeline.tsx")
    expect(timeline.match(/chaveData\(d\) === referencia/g)?.length).toBeGreaterThanOrEqual(2)
    expect(timeline).not.toContain("chaveData(d) === chaveData(new Date())")
  })
})
