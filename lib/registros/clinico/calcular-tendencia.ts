import { ordenarAvaliacoes } from "./calcular-progresso"
import type { AvaliacaoClinica, TendenciaHabilidade } from "./tipos"

export function calcularTendencia(avaliacoes: AvaliacaoClinica[]): TendenciaHabilidade {
  const validas = ordenarAvaliacoes(avaliacoes).filter((item) => Number.isFinite(item.valor))
  if (validas.length < 6) return "dados_insuficientes"
  const ultimas = validas.slice(-3)
  const anteriores = validas.slice(-6, -3)
  const media = (itens: AvaliacaoClinica[]) => itens.reduce((total, item) => total + item.valor, 0) / itens.length
  const diferenca = media(ultimas) - media(anteriores)
  if (Math.abs(diferenca) < 1e-9) return "estavel"
  return diferenca > 0 ? "melhora" : "queda"
}
