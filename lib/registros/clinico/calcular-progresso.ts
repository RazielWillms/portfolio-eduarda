import { VALOR_MAXIMO_AVALIACAO } from "./escala"
import type { AvaliacaoClinica, ProgressoHabilidade } from "./tipos"

export function ordenarAvaliacoes(avaliacoes: AvaliacaoClinica[]) {
  return [...avaliacoes].sort((a, b) =>
    a.data.localeCompare(b.data) ||
    (a.created_at ?? "").localeCompare(b.created_at ?? "") ||
    a.id.localeCompare(b.id),
  )
}

export function calcularProgresso(avaliacoes: AvaliacaoClinica[], janela = 5): ProgressoHabilidade {
  const validas = ordenarAvaliacoes(avaliacoes).filter((item) => Number.isFinite(item.valor))
  const recentes = validas.slice(-janela)
  if (recentes.length === 0) {
    return { percentual: null, quantidadeAvaliacoes: 0, quantidadeConsiderada: 0 }
  }
  const media = recentes.reduce((total, item) => total + item.valor, 0) / recentes.length
  return {
    percentual: Math.round((media / VALOR_MAXIMO_AVALIACAO) * 100),
    quantidadeAvaliacoes: validas.length,
    quantidadeConsiderada: recentes.length,
  }
}
