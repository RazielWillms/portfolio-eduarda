export interface AcessoResponsavel {
  id: string
  descricao: string
  criado_em: string
  expira_em: string | null
  revogado_em: string | null
  ultimo_acesso_em: string | null
  ativo: boolean
  escopo: "profissional" | "equipe"
  configuracao: ConfiguracaoCompartilhamento
}

export interface ConfiguracaoCompartilhamento { periodo_meses:number; alvo_ids:string[]; exibir_criterios:boolean; exibir_fases:boolean; exibir_integridade:boolean; exibir_contextos:boolean; exibir_analise_tentativas?:boolean }

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

export interface SharedClinicalTarget { id:string;nome:string;natureza:"aquisicao"|"reducao";criterio:{direcao:"aumentar"|"reduzir";valor:number|null;sessoes:number}|null;pontos:Array<{id:string;data:string;tipo:string;unidade:string;valor:number;numerador:number|null;denominador:number|null;fase:string|null;ambiente:string|null;aplicador:string|null;protocolo_versao:number|null;integridade:number|null;tentativas?:import("../clinico/serie-clinica").ResumoTentativas|null}> }
export interface SharedClinicalDashboard { primeiroNome:string;periodoInicio:string;periodoFim:string;ultimaAtualizacao:string|null;configuracao:ConfiguracaoCompartilhamento;alvos:SharedClinicalTarget[] }
