// Tipos do sistema de registro e acompanhamento ABA
// Espelham as tabelas reais no Supabase (schema public):
// profiles, niveis_avaliacao, habilidades, pacientes e paciente_psicologos

export type Papel = "admin" | "profissional" | "coordenacao"
export type StatusUsuario = "ativo" | "inativo"
export type StatusPaciente = "ativo" | "inativo"
export type StatusHabilidade = "ativa" | "inativa"

export interface Profile {
  id: string
  nome: string
  email: string
  papel: Papel
  status: StatusUsuario
  admin_principal: boolean
  permissoes?: import("./permissoes").Permissao[]
  foto_path: string | null
  foto_url?: string | null
  foto_zoom: number
  foto_pos_x: number
  foto_pos_y: number
  profissao: string | null
  profissao_id: string | null
  conselho_tipo: string | null
  conselho_numero: string | null
  conselho_uf: string | null
  created_at: string
}

export interface NivelAvaliacao {
  id: string
  codigo: string
  label: string
  valor: number
  ordem: number
}

export interface Habilidade {
  id: string
  nome: string
  descricao: string | null
  categoria: string | null
  peso: number
  status: StatusHabilidade
  created_at: string
}

export interface PacienteHabilidade {
  id: string
  paciente_id: string
  habilidade_id: string
  profissional_id: string
  peso: number
  ativo: boolean
  iniciado_em: string
  created_at: string
  deleted_at?: string | null
  updated_at: string
  habilidade: Pick<Habilidade, "id" | "nome" | "descricao" | "categoria" | "status">
}

export interface ProfissionalResumo { id:string;nome:string;foto_path:string|null;foto_url?:string|null;foto_zoom:number;foto_pos_x:number;foto_pos_y:number;profissao:string|null;conselho_tipo:string|null;conselho_numero:string|null;conselho_uf:string|null }
export type { AcessoResponsavel } from "./responsavel/types"

export interface Paciente {
  id: string
  nome_completo: string
  nome_responsavel: string | null
  cpf_responsavel: string | null
  cpf_paciente: string | null
  data_nascimento: string | null // ISO (yyyy-mm-dd)
  diagnostico: string | null
  contatos: string | null
  observacoes: string | null
  status: StatusPaciente
  criado_por: string
  foto_path: string | null
  foto_url?: string | null
  foto_zoom: number
  foto_pos_x: number
  foto_pos_y: number
  created_at: string
}

export type StatusAgendamento="agendado"|"confirmado"|"realizado"|"cancelado"|"falta"|"reagendado"
export interface Agendamento{id:string;paciente_id:string;profissional_id:string;inicio:string;fim:string;finalidade:string;modalidade:string;local:string|null;status:StatusAgendamento;observacao_administrativa:string|null;sessao_id:string|null;paciente_nome:string;profissional_nome:string;pode_iniciar:boolean;updated_at:string;cancelamento_motivo:string|null;ocorrencia_frequencia_id?:string|null;ocorrencia_frequencia_tipo?:TipoOcorrenciaFrequencia|null;ocorrencia_frequencia_motivo?:string|null;historico:{tipo:"reagendamento"|"edicao";inicio_anterior:string;fim_anterior:string;inicio_novo:string;fim_novo:string;motivo:string;created_at:string}[]}
export interface OpcoesAgenda{pacientes:{id:string;nome:string;status:string;profissionais_vinculados:number}[];profissionais:{id:string;nome:string;profissao:string|null}[]}
export interface DisponibilidadeProfissional{id:string;profissional_id:string;dia_semana:number;hora_inicio:string;hora_fim:string;ativo:boolean}
export interface ConsultaDisponibilidade{profissional_id:string;profissional_nome:string;profissao:string|null;status:"disponivel"|"ocupado"|"fora_expediente"|"indisponivel"|"nao_configurada";motivo:string|null}
export interface HorarioDisponivelAgenda{inicio:string;fim:string}
export interface Profissao{id:string;nome:string;conselho_sigla:string|null;ativo:boolean;ordem:number}
export interface PacienteBuscaOperacional{id:string;nome:string;responsavel:string|null;status:string;total:number}
export interface PacienteCoordenacaoResumo extends PacienteBuscaOperacional{profissionais_vinculados:number;vinculado_usuario:boolean}
export interface ProfissionalBuscaOperacional{id:string;nome:string;profissao_id:string|null;profissao:string|null;conselho_sigla:string|null;total:number}
export interface UsuarioResumo{id:string;nome:string;email:string;papel:Papel;status:StatusUsuario;admin_principal:boolean;profissao_id:string|null;profissao:string|null;total:number}
export interface PainelProfissionalAgregado{totais:{pacientes_ativos:number;sessoes_mes:number;alvos_ativos:number;configuracoes_pendentes:number;solicitacoes_pendentes:number};proximo_compromisso:{id:string;paciente_id:string;paciente_nome:string;inicio:string}|null;pacientes:{id:string;nome:string;alvos_ativos:number;sessoes_mes:number;ultima_sessao:string|null}[];sessoes_recentes:{id:string;paciente_id:string;paciente_nome:string;data:string;contexto:string;alvos:number}[]}
export interface PainelCoordenacaoAgregado{compromissos_7_dias:number;pacientes_ativos:number;pacientes_sem_profissional:number;proximo:{id:string;paciente_id:string;paciente_nome:string;profissional_nome:string;inicio:string;pode_iniciar:boolean}|null}
export interface SessaoProfissionalResumo{id:string;paciente_id:string;paciente_nome:string;data:string;contexto:string;ambiente_tipo:string|null;total_alvos:number;total:number}
export interface SessaoPacienteResumo{id:string;paciente_id:string;profissional_id:string;data:string;contexto:string;ambiente_tipo:string|null;finalidade:import("./clinico/modelo").FinalidadeSessao;status:"rascunho"|"finalizada"|"cancelada";motivo_cancelamento:string|null;total_alvos:number;total_abc:number;total:number}
export interface ResumoClinicoPaciente{alvos_ativos:number;alvos_sem_protocolo:number;concordancias_pendentes:number;revisoes_vencidas:number;ultima_sessao:{id:string;data:string;alvos:{id:string;nome:string}[]}|null}
export interface ResultadoSerieAgendamentos{serie_id:string|null;criados:number;conflitos:{data:string;motivo:string}[]}
export type TipoOcorrenciaFrequencia="falta_justificada"|"falta_nao_justificada"|"cancelamento_clinica"|"cancelamento_profissional"
export interface OpcoesFrequencia{pacientes:{id:string;nome:string}[];profissionais:{id:string;nome:string;profissao:string|null}[]}
export interface SugestaoAgendamentoFrequencia{id:string;inicio:string;fim:string;status:string;finalidade:string}
export interface OcorrenciaFrequencia{id:string;paciente_id:string;paciente_nome:string;profissional_id:string;profissional_nome:string;agendamento_id:string|null;agendamento_inicio?:string|null;agendamento_fim?:string|null;agendamento_status_anterior?:string|null;data_ocorrencia:string;tipo:TipoOcorrenciaFrequencia;motivo:string|null;observacao_administrativa:string|null;criado_por:string;created_at:string}
export interface RelatorioFrequencia{registros:OcorrenciaFrequencia[];profissionais:{id:string;nome:string;total:number;justificadas:number;nao_justificadas:number;cancelamentos:number}[];pacientes:{id:string;nome:string;total_faltas:number;justificadas:number;nao_justificadas:number}[]}
export interface RelatorioFrequenciaPaginado extends RelatorioFrequencia{resumo:{ocorrencias:number;faltas:number;justificadas:number;nao_justificadas:number;cancelamentos:number};total_registros:number}

export type StatusSolicitacaoAcesso = "pendente" | "aprovado" | "negado"

// Candidato a duplicata retornado pela função SECURITY DEFINER, com dados mascarados
// (nunca expõe diagnóstico, contatos ou nome completo do responsável).
export interface CandidatoDuplicataPaciente {
  paciente_id: string
  nome_mascarado: string
  responsavel_mascarado: string | null
  data_nascimento: string | null
  ja_vinculado: boolean
  criado_por_nome: string | null
}

export interface SolicitacaoAcesso {
  id: string
  paciente_id: string
  solicitante_id: string
  destinatario_id: string | null
  status: StatusSolicitacaoAcesso
  mensagem: string | null
  papel_no_caso: string | null
  resolvido_por: string | null
  resolvido_em: string | null
  created_at: string
}

export interface SolicitacaoAcessoComRelacoes extends SolicitacaoAcesso {
  paciente: Pick<Paciente, "id" | "nome_completo"> | null
  solicitante: Pick<Profile, "id" | "nome" | "email">
}
export interface SolicitacaoAcessoPaginada extends SolicitacaoAcesso {paciente_nome:string;solicitante_nome:string;solicitante_email:string;total:number}
export interface SessaoAvaliacaoResumo {id:string;paciente_id:string;profissional_id:string;data:string;contexto:string|null;finalidade:string}

export function calcularIdade(dataNascimentoISO: string | null): number | null {
  if (!dataNascimentoISO) return null
  const nascimento = new Date(dataNascimentoISO)
  if (Number.isNaN(nascimento.getTime())) return null
  const hoje = new Date()
  let idade = hoje.getFullYear() - nascimento.getFullYear()
  const aindaNaoFezAniversario =
    hoje.getMonth() < nascimento.getMonth() ||
    (hoje.getMonth() === nascimento.getMonth() && hoje.getDate() < nascimento.getDate())
  if (aindaNaoFezAniversario) idade -= 1
  return idade
}
