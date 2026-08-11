import { VALOR_MAXIMO_AVALIACAO } from "./escala"
import { ordenarAvaliacoes } from "./calcular-progresso"
import type { AquisicaoHabilidade, AvaliacaoClinica } from "./tipos"

export function verificarAquisicao(avaliacoes: AvaliacaoClinica[], consecutivasNecessarias = 3): AquisicaoHabilidade {
  let sequencia = 0
  for (const avaliacao of ordenarAvaliacoes(avaliacoes)) {
    sequencia = avaliacao.valor === VALOR_MAXIMO_AVALIACAO ? sequencia + 1 : 0
    if (sequencia === consecutivasNecessarias) {
      return { adquirida: true, adquiridaEm: avaliacao.data }
    }
  }
  return { adquirida: false, adquiridaEm: null }
}
