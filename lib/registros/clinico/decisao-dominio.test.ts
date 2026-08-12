import { describe, expect, it } from "vitest"
import type { CriterioDominioAlvo, SessaoClinicaComRegistros } from "./modelo"
import { avaliarDominio } from "./decisao-dominio"

const criterio = { id: "c1", sessoes_consecutivas: 2, direcao: "aumentar", valor_alvo: 80, oportunidades_minimas: 5, ambientes_minimos: 1, aplicadores_minimos: 1, dias_manutencao: null } as CriterioDominioAlvo
function sessao(data: string, valor: number, criterioId: string | null = "c1") {
  return { data, ambiente_tipo: "clinica", aplicador_tipo: "profissional", registros: [{ alvo_id: "a1", criterio_dominio_id: criterioId, tipo_medicao: "percentual_oportunidades", dados: { respostas_independentes: valor, oportunidades: 10 } }] } as unknown as SessaoClinicaComRegistros
}

describe("apoio à decisão de domínio", () => {
  it("exige sessões consecutivas e da mesma versão do critério", () => {
    expect(avaliarDominio(criterio, "a1", [sessao("2026-08-02", 8), sessao("2026-08-01", 9), sessao("2026-07-30", 10, "antigo")]).estado).toBe("criterio_atingido")
    expect(avaliarDominio(criterio, "a1", [sessao("2026-08-02", 7), sessao("2026-08-01", 9)]).consecutivas).toBe(0)
  })
  it("exige evidência estruturada de generalização", () => {
    const casa = { ...sessao("2026-08-02", 10), ambiente_tipo: "casa", aplicador_tipo: "cuidador" } as SessaoClinicaComRegistros
    const clinica = sessao("2026-08-01", 9)
    expect(avaliarDominio({ ...criterio, ambientes_minimos: 2, aplicadores_minimos: 2 }, "a1", [casa, clinica]).estado).toBe("criterio_atingido")
    expect(avaliarDominio({ ...criterio, ambientes_minimos: 2 }, "a1", [clinica]).estado).toBe("em_progresso")
  })
})
