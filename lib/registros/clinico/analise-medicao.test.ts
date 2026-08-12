import { describe, expect, it } from "vitest"
import { unidadeMedicao, valorMedicao } from "./analise-medicao"

describe("análise de medições estruturadas", () => {
  it("calcula taxa por minuto", () => expect(valorMedicao("taxa", { contagem: 6, duracao_observacao_segundos: 120 })).toBe(3))
  it("calcula percentuais sem inventar dados", () => {
    expect(valorMedicao("percentual_oportunidades", { respostas_independentes: 7, oportunidades: 10 })).toBe(70)
    expect(valorMedicao("intervalo_parcial", { intervalos_com_ocorrencia: 2, intervalos: 8 })).toBe(25)
    expect(valorMedicao("percentual_oportunidades", { respostas_independentes: 0, oportunidades: 0 })).toBeNull()
  })
  it("converte a escala de independência", () => {
    expect(valorMedicao("escala_independencia", { codigo: "B+" })).toBe(70)
    expect(unidadeMedicao("escala_independencia")).toBe("%")
  })
})
