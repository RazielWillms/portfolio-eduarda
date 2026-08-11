import { describe, expect, it } from "vitest"
import { calcularIndicadorHabilidade, calcularProgresso, calcularProgressoGeral, calcularSerieProgressoGeral, calcularTendencia, filtrarAvaliacoesPorPeriodo, verificarAquisicao } from "."
import type { AvaliacaoClinica } from "."

function serie(valores: number[]): AvaliacaoClinica[] {
  return valores.map((valor, index) => ({
    id: String(index), habilidade_id: "habilidade", valor,
    codigo: valor === 1 ? "A" : valor === 0.7 ? "B+" : valor === 0.5 ? "B-" : "C",
    data: `2026-01-${String(index + 1).padStart(2, "0")}`,
  }))
}

describe("aquisição de habilidade", () => {
  it("adquire com três avaliações máximas consecutivas", () => {
    expect(verificarAquisicao(serie([1, 1, 1]))).toEqual({ adquirida: true, adquiridaEm: "2026-01-03" })
  })
  it("interrompe a sequência quando uma nota não é máxima", () => {
    expect(verificarAquisicao(serie([1, 1, 0.7, 1])).adquirida).toBe(false)
  })
  it("reconhece uma sequência máxima posterior", () => {
    expect(verificarAquisicao(serie([0.7, 1, 1, 1])).adquiridaEm).toBe("2026-01-04")
  })
  it("recalcula após alteração retroativa", () => {
    const avaliacoes = serie([1, 1, 1])
    expect(verificarAquisicao(avaliacoes).adquirida).toBe(true)
    avaliacoes[1] = { ...avaliacoes[1], valor: 0.7, codigo: "B+" }
    expect(calcularIndicadorHabilidade(avaliacoes).status).toBe("em_desenvolvimento")
  })
})

describe("progresso", () => {
  it("não transforma ausência de dados em zero", () => expect(calcularProgresso([]).percentual).toBeNull())
  it("calcula uma avaliação", () => expect(calcularProgresso(serie([0.7])).percentual).toBe(70))
  it("calcula menos de cinco avaliações", () => expect(calcularProgresso(serie([1, 0.7])).percentual).toBe(85))
  it("calcula cinco avaliações", () => expect(calcularProgresso(serie([1, 0.7, 1, 0.5, 1])).percentual).toBe(84))
  it("usa apenas as cinco avaliações mais recentes", () => expect(calcularProgresso(serie([0, 1, 1, 1, 1, 1])).percentual).toBe(100))
})

describe("tendência e progresso geral", () => {
  it("exige seis avaliações para tendência", () => expect(calcularTendencia(serie([1, 1, 1]))).toBe("dados_insuficientes"))
  it("identifica melhora simples", () => expect(calcularTendencia(serie([0, 0.5, 0.5, 0.7, 1, 1]))).toBe("melhora"))
  it("pondera somente habilidades ativas com dados", () => {
    expect(calcularProgressoGeral([
      { progresso: 80, peso: 1, ativo: true },
      { progresso: 60, peso: 3, ativo: true },
      { progresso: 100, peso: 2, ativo: true },
      { progresso: null, peso: 10, ativo: true },
      { progresso: 0, peso: 10, ativo: false },
    ])).toBe(77)
  })
})

describe("analytics por período", () => {
  it("filtra avaliações sem inventar pontos em datas vazias", () => {
    const avaliacoes = serie([0.5, 0.7, 1])
    expect(filtrarAvaliacoesPorPeriodo(avaliacoes, { inicio: "2026-01-02", fim: "2026-01-03" })).toHaveLength(2)
    expect(calcularSerieProgressoGeral(avaliacoes, [{ habilidadeId: "habilidade", peso: 1, ativo: true }])).toHaveLength(3)
  })
})
