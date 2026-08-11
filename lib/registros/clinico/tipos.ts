export type StatusClinicoHabilidade = "nao_iniciada" | "em_desenvolvimento" | "adquirida"
export type TendenciaHabilidade = "melhora" | "estavel" | "queda" | "dados_insuficientes"

export interface AvaliacaoClinica {
  id: string
  habilidade_id: string
  data: string
  created_at?: string
  codigo: string
  valor: number
  profissional_nome?: string | null
}

export interface ProgressoHabilidade {
  percentual: number | null
  quantidadeAvaliacoes: number
  quantidadeConsiderada: number
}

export interface AquisicaoHabilidade {
  adquirida: boolean
  adquiridaEm: string | null
}

export interface IndicadorHabilidade extends ProgressoHabilidade, AquisicaoHabilidade {
  status: StatusClinicoHabilidade
  tendencia: TendenciaHabilidade
  ultimaAvaliacao: AvaliacaoClinica | null
}
