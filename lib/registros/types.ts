// Tipos do sistema de registro e acompanhamento ABA
// Espelham as tabelas reais no Supabase (schema public):
// profiles, niveis_avaliacao, habilidades, pacientes, paciente_psicologos, atendimentos

export type Papel = "admin" | "psicologo"
export type StatusUsuario = "ativo" | "inativo"
export type StatusPaciente = "ativo" | "inativo"
export type StatusHabilidade = "ativa" | "inativa"

export interface Profile {
  id: string
  nome: string
  email: string
  papel: Papel
  status: StatusUsuario
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

export interface Paciente {
  id: string
  nome_completo: string
  nome_responsavel: string | null
  data_nascimento: string | null // ISO (yyyy-mm-dd)
  diagnostico: string | null
  contatos: string | null
  observacoes: string | null
  status: StatusPaciente
  criado_por: string
  created_at: string
}

export interface Atendimento {
  id: string
  paciente_id: string
  psicologo_id: string
  habilidade_id: string
  data: string // ISO (yyyy-mm-dd)
  nivel_avaliacao_id: string
  observacoes: string | null
  created_at: string
}

// Registro de atendimento já com os relacionamentos resolvidos, prontos para exibição.
export interface AtendimentoComRelacoes extends Atendimento {
  paciente: Pick<Paciente, "id" | "nome_completo">
  habilidade: Pick<Habilidade, "id" | "nome">
  nivel_avaliacao: Pick<NivelAvaliacao, "id" | "codigo" | "label" | "valor">
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
