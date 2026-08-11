// Tipos do sistema de registro e acompanhamento ABA — Etapa 1
// Toda a estrutura abaixo é pensada para migrar depois para tabelas reais
// (ex.: Supabase), mas hoje vive apenas em memória / localStorage.

export type Papel = "admin" | "psicologo"

export interface Usuario {
  id: string
  nome: string
  email: string
  papel: Papel
  ativo: boolean
}

export type StatusPaciente = "ativo" | "inativo"

export interface Paciente {
  id: string
  nomeCompleto: string
  nomeResponsavel: string
  dataNascimento: string // ISO (yyyy-mm-dd)
  observacoes: string
  diagnostico?: string
  contatos: string
  status: StatusPaciente
  // Já em array pensando na partilha futura entre psicólogos.
  // Nesta etapa cada cadastro novo grava apenas o autor do registro aqui.
  psicologosIds: string[]
}

export type StatusHabilidade = "ativa" | "inativa"

export interface Habilidade {
  id: string
  nome: string
  descricao: string
  categoria: string
  // Peso usado no cálculo de progresso (0 a 1). Pode ser ajustado depois
  // sem afetar os registros de atendimento já lançados.
  peso: number
  status: StatusHabilidade
}

export interface RegistroAtendimento {
  id: string
  pacienteId: string
  psicologoId: string
  data: string // ISO (yyyy-mm-dd)
  habilidadeId: string
  // Código do nível na escala de avaliação (ver ESCALA_AVALIACAO_PADRAO)
  nota: string
  observacoes: string
}

export interface NivelAvaliacao {
  codigo: string
  label: string
  // Valor numérico do nível (0 a 1), usado no cálculo de progresso.
  valor: number
}

// Escala qualitativa mockada para demonstração da interface nesta Etapa 1.
// Baseada na planilha de acompanhamento ABA enviada pela equipe.
// TODO: em etapa futura, permitir que cada clínica configure sua própria
// escala (nomes dos níveis e valores) em uma tela de configuração.
export const ESCALA_AVALIACAO_PADRAO: NivelAvaliacao[] = [
  { codigo: "A", label: "A — Sem auxílio", valor: 1 },
  { codigo: "B+", label: "B+ — Com menos ajuda", valor: 0.7 },
  { codigo: "B-", label: "B- — Com mais ajuda", valor: 0.5 },
  { codigo: "C", label: "C — Não realizou", valor: 0 },
]

export function nivelPorCodigo(codigo: string): NivelAvaliacao | undefined {
  return ESCALA_AVALIACAO_PADRAO.find((n) => n.codigo === codigo)
}

export function calcularIdade(dataNascimentoISO: string): number {
  const hoje = new Date()
  const nascimento = new Date(dataNascimentoISO)
  let idade = hoje.getFullYear() - nascimento.getFullYear()
  const aindaNaoFezAniversario =
    hoje.getMonth() < nascimento.getMonth() ||
    (hoje.getMonth() === nascimento.getMonth() && hoje.getDate() < nascimento.getDate())
  if (aindaNaoFezAniversario) idade -= 1
  return idade
}
