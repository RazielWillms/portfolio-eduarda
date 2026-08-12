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
  foto_path: string | null
  foto_url?: string | null
  foto_zoom: number
  foto_pos_x: number
  foto_pos_y: number
  profissao: string | null
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
export interface Agendamento{id:string;paciente_id:string;profissional_id:string;inicio:string;fim:string;finalidade:string;modalidade:string;local:string|null;status:StatusAgendamento;observacao_administrativa:string|null;sessao_id:string|null;paciente_nome:string;profissional_nome:string;pode_iniciar:boolean}
export interface OpcoesAgenda{pacientes:{id:string;nome:string;status:string}[];profissionais:{id:string;nome:string;profissao:string|null}[]}

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
