export type StatusPlanoClinico = "rascunho" | "em_revisao" | "aprovado" | "em_execucao" | "encerrado"
export type HorizonteObjetivo = "curto_prazo" | "longo_prazo"
export type NaturezaAlvo = "aquisicao" | "reducao"
export type FaseAlvo = "rascunho" | "linha_de_base" | "ensino" | "generalizacao" | "manutencao" | "pausado" | "encerrado"
export type TipoMedicao = "frequencia" | "taxa" | "duracao" | "latencia" | "percentual_oportunidades" | "tentativas_discretas" | "intervalo_parcial" | "intervalo_total" | "amostragem_momentanea" | "escala_independencia" | "intensidade"
export type FinalidadeSessao = "vinculo_acolhimento" | "entrevista_responsaveis" | "avaliacao_inicial" | "observacao_clinica" | "linha_de_base" | "intervencao" | "generalizacao" | "manutencao" | "orientacao_equipe"

export interface SinteseAvaliacaoInicial {
  id:string; paciente_id:string; profissional_id:string; versao:number; status:"rascunho"|"concluida"
  periodo_inicio:string; periodo_fim:string; fontes_informacao:string; potencialidades:string
  necessidades_identificadas:string; prioridades_recomendadas:string; recomendacoes_iniciais:string|null
  conclusao:string|null; sessoes_consideradas:string[]; created_at:string
}

export interface PlanoClinico {
  id: string
  paciente_id: string
  profissional_responsavel_id: string
  titulo: string
  justificativa: string | null
  status: StatusPlanoClinico
  iniciado_em: string | null
  revisar_em: string | null
  encerrado_em: string | null
  created_at: string
  updated_at: string
}

export interface ObjetivoClinico {
  id: string
  plano_id: string
  descricao: string
  horizonte: HorizonteObjetivo
  ordem: number
  ativo: boolean
  created_at: string
  updated_at: string
}

export interface AlvoClinico {
  id: string
  objetivo_id: string
  profissional_id: string
  nome: string
  categoria: string | null
  natureza: NaturezaAlvo
  fase: FaseAlvo
  ativo: boolean
  created_at: string
  updated_at: string
}

export interface DefinicaoOperacionalAlvo {
  id: string
  alvo_id: string
  versao: number
  descricao_observavel: string
  resposta_esperada: string | null
  condicoes_antecedentes: string | null
  exemplos: string | null
  nao_exemplos: string | null
  materiais: string | null
  instrucao_sd: string | null
  resposta_correta: string | null
  resposta_incorreta: string | null
  criterios_interrupcao: string | null
  criado_por: string
  created_at: string
}

export interface ConfiguracaoMedicaoAlvo {
  id: string
  alvo_id: string
  versao: number
  tipo: TipoMedicao
  unidade: string
  parametros: Record<string, unknown>
  criado_por: string
  created_at: string
}

export interface CriterioDominioAlvo {
  id: string
  alvo_id: string
  versao: number
  direcao: "aumentar" | "reduzir"
  valor_alvo: number | null
  sessoes_consecutivas: number
  oportunidades_minimas: number | null
  ambientes_minimos: number
  aplicadores_minimos: number
  dias_manutencao: number | null
  configuracao: Record<string, unknown>
  criado_por: string
  created_at: string
}

export interface AlvoClinicoCompleto extends AlvoClinico {
  definicoes: DefinicaoOperacionalAlvo[]
  medicoes: ConfiguracaoMedicaoAlvo[]
  criterios: CriterioDominioAlvo[]
  historico_fases: HistoricoFaseAlvo[]
  protocolos: ProtocoloIntervencaoAlvo[]
  planos_apoio: PlanoApoioComportamentalAlvo[]
  revisoes: RevisaoClinicaAlvo[]
}

export interface RevisaoClinicaAlvo {
  id: string; alvo_id: string; profissional_id: string; periodo_inicio: string; periodo_fim: string
  decisao: "manter" | "modificar_protocolo" | "coletar_mais_dados" | "avancar_fase" | "retornar_fase" | "pausar" | "encerrar"
  justificativa: string
  evidencias_snapshot: { medicoes: number; sessoes: number; primeira_sessao: string | null; ultima_sessao: string | null; integridade_media_percentual: number | null; observacoes_abc: number;criterio_vigente_id?:string|null;ambientes?:number;aplicadores?:number;limitacoes_confirmadas?:boolean;snapshot_versao?:number;validade_social_id?:string|null;validade_social_em?:string|null;objetivo_relevante?:boolean|null;aceitabilidade?:number|null;viabilidade?:number|null;beneficio_percebido?:number|null;assentimento_observado?:string|null;cobertura_integridade_percentual?:number|null;concordancias_concluidas?:number;concordancia_media_percentual?:number|null;competencia_aplicador_percentual?:number|null;competencia_aplicador_em?:string|null }
  proxima_revisao_em: string | null; created_at: string
}

export interface PlanoApoioComportamentalAlvo {
  id: string; alvo_id: string; versao: number
  funcao_assumida: "atencao" | "fuga_esquiva" | "acesso_tangivel" | "automatica" | "multipla" | "indeterminada"
  justificativa_funcional: string; estrategias_antecedentes: string; comportamento_substitutivo: string
  procedimento_ensino_substitutivo: string; estrategias_consequentes: string; plano_seguranca: string | null
  criterios_revisao: string; criado_por: string; created_at: string
}

export interface ProtocoloIntervencaoAlvo {
  id: string
  alvo_id: string
  versao: number
  estrategia_ensino: "tentativas_discretas" | "ensino_naturalistico" | "encadeamento" | "modelacao" | "treino_comunicacao_funcional" | "outro"
  hierarquia_ajuda: string
  procedimento_esvanecimento: string | null
  reforcadores: string
  esquema_reforcamento: string
  correcao_erro: string
  instrucoes_aplicacao: string | null
  criado_por: string
  created_at: string
}

export interface HistoricoFaseAlvo {
  id: string
  alvo_id: string
  fase_anterior: FaseAlvo | null
  nova_fase: FaseAlvo
  motivo: string
  alterado_por: string
  revisao_clinica_id?: string | null
  tipo_alteracao?: "legado"|"decisao_clinica"|"correcao_administrativa"
  created_at: string
}

export interface ObjetivoClinicoCompleto extends ObjetivoClinico {
  alvos: AlvoClinicoCompleto[]
}

export interface PlanoClinicoCompleto extends PlanoClinico {
  objetivos: ObjetivoClinicoCompleto[]
}

export interface SessaoClinica {
  id: string
  paciente_id: string
  profissional_id: string
  data: string
  contexto: string | null
  ambiente_tipo: "clinica" | "casa" | "escola" | "comunidade" | "teleatendimento" | "outro" | null
  aplicador_tipo: "profissional" | "cuidador" | "educador" | "outro" | null
  finalidade: FinalidadeSessao
  observacoes_privadas: string | null
  status: "rascunho" | "finalizada" | "cancelada"
  created_at: string
  updated_at: string
  deleted_at: string | null
  motivo_cancelamento:string|null
  cancelada_por:string|null
  cancelada_em:string|null
  motivo_restauracao:string|null
  restaurada_por:string|null
  restaurada_em:string|null
}

export interface RegistroMedicao {
  id: string
  sessao_id: string
  alvo_id: string
  definicao_operacional_id: string
  configuracao_medicao_id: string
  criterio_dominio_id: string | null
  protocolo_intervencao_id: string | null
  tipo_medicao: TipoMedicao
  dados: Record<string, unknown>
  observacao: string | null
  created_at: string
}

export interface RegistroMedicaoComAlvo extends RegistroMedicao {
  alvo: Pick<AlvoClinico, "id" | "nome">
  integridade: IntegridadeProcedimental[]
  tentativas: TentativaIndividual[]
}

export interface TentativaIndividual { id:string;registro_medicao_id:string;profissional_id:string;ordem:number;resultado:"correta"|"incorreta"|"sem_resposta";nivel_ajuda:"independente"|"gestual"|"verbal"|"modelo"|"fisica_parcial"|"fisica_total";latencia_segundos:number|null;observacao:string|null;created_at:string }

export interface IntegridadeProcedimental {
  id: string
  sessao_id: string
  registro_medicao_id: string
  protocolo_intervencao_id: string
  itens: { hierarquia_ajuda: boolean; reforcamento: boolean; correcao_erro: boolean }
  itens_previstos: number
  itens_realizados: number
  desvios: string | null
  created_at: string
}

export interface SessaoClinicaComRegistros extends SessaoClinica {
  registros: RegistroMedicaoComAlvo[]
  observacoes_abc: ObservacaoAbc[]
}

export interface ObservacaoAbc {
  id: string
  sessao_id: string
  alvo_id: string
  profissional_id: string
  antecedente: string
  comportamento_observado: string
  consequencia: string
  funcao_hipotese: "atencao" | "fuga_esquiva" | "acesso_tangivel" | "automatica" | "indeterminada" | null
  intensidade: number | null
  duracao_segundos: number | null
  created_at: string
}

export interface RegistroValidadeSocial {
  id:string; paciente_id:string; alvo_id:string|null; profissional_id:string
  respondente_tipo:"paciente"|"responsavel"|"profissional"|"equipe"; objetivo_relevante:boolean
  aceitabilidade:number; viabilidade:number; beneficio_percebido:number
  assentimento_observado:"aceite"|"recusa"|"ambivalente"|"nao_observado"|"nao_aplicavel"
  relato:string; adaptacoes_necessarias:string|null; registrado_em:string; created_at:string
}

export interface CapacitacaoAplicador {
  id:string;paciente_id:string;alvo_id:string|null;profissional_id:string;participante_tipo:"cuidador"|"educador"|"profissional"|"equipe"
  habilidades_treinadas:string;instrucao_realizada:boolean;modelacao_realizada:boolean;ensaio_realizado:boolean;feedback_realizado:boolean
  competencia_percentual:number;criterio_competencia:string;observacoes:string|null;acompanhamento_em:string|null;realizado_em:string;created_at:string
}

export interface SolicitacaoConcordancia {
  id:string;paciente_id:string;registro_medicao_id:string;alvo_id:string;solicitante_id:string;observador_id:string
  tipo_medicao:TipoMedicao;unidade_comparavel:string;status:"pendente"|"concluida"|"cancelada";valor_observador:number|null
  concordancia_percentual:number|null;solicitado_em:string;respondido_em:string|null
  alvo:{id:string;nome:string};solicitante:{id:string;nome:string};observador:{id:string;nome:string}
}
