export const ESCALA_AVALIACAO = {
  A: { valor: 1, descricao: "Executa de forma independente." },
  "B+": { valor: 0.7, descricao: "Executa com ajuda leve." },
  "B-": { valor: 0.5, descricao: "Executa com ajuda significativa." },
  C: { valor: 0, descricao: "Ainda não executa a habilidade." },
} as const

export type CodigoAvaliacao = keyof typeof ESCALA_AVALIACAO

export const VALOR_MAXIMO_AVALIACAO = Math.max(...Object.values(ESCALA_AVALIACAO).map((item) => item.valor))

export function obterAvaliacao(codigo: string) {
  return ESCALA_AVALIACAO[codigo as CodigoAvaliacao] ?? null
}
