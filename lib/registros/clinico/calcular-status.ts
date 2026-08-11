import { calcularProgresso, ordenarAvaliacoes } from "./calcular-progresso"
import { calcularTendencia } from "./calcular-tendencia"
import { verificarAquisicao } from "./verificar-aquisicao"
import type { AvaliacaoClinica, IndicadorHabilidade } from "./tipos"

export function calcularIndicadorHabilidade(avaliacoes: AvaliacaoClinica[]): IndicadorHabilidade {
  const ordenadas = ordenarAvaliacoes(avaliacoes)
  const progresso = calcularProgresso(ordenadas)
  const aquisicao = verificarAquisicao(ordenadas)
  return {
    ...progresso,
    ...aquisicao,
    status: ordenadas.length === 0 ? "nao_iniciada" : aquisicao.adquirida ? "adquirida" : "em_desenvolvimento",
    tendencia: calcularTendencia(ordenadas),
    ultimaAvaliacao: ordenadas.at(-1) ?? null,
  }
}
