export interface AcessoResponsavel {
  id: string
  descricao: string
  criado_em: string
  expira_em: string | null
  revogado_em: string | null
  ultimo_acesso_em: string | null
  ativo: boolean
  escopo: "profissional" | "equipe"
}

export interface SharedSkillProgress {
  nome: string
  status: "nao_iniciada" | "em_desenvolvimento" | "adquirida"
  progresso: number | null
  tendencia: "melhora" | "estavel" | "queda" | "dados_insuficientes"
  adquiridaEm: string | null
  avaliacoes: { data: string; codigo: string; valor: number }[]
}

export interface SharedPatientDashboard {
  primeiroNome: string
  periodoInicio: string
  periodoFim: string
  ultimaAtualizacao: string | null
  progressoGeral: number | null
  habilidades: SharedSkillProgress[]
}
