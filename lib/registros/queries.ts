// Camada de leitura de dados do sistema de registros — usada em Server Components.
// Todas as consultas passam pelo cliente Supabase autenticado do usuário atual,
// então o RLS aplica automaticamente as regras de visibilidade (admin vê tudo,
// psicólogo só vê seus próprios pacientes/atendimentos).
import { createClient } from "@/lib/supabase/server"
import type {
  AtendimentoComRelacoes,
  CandidatoDuplicataPaciente,
  Habilidade,
  NivelAvaliacao,
  Paciente,
  PacienteHabilidade,
  Profile,
  ProfissionalResumo,
  SolicitacaoAcessoComRelacoes,
} from "./types"
import type { AvaliacaoClinica } from "./clinico"
import type { AcessoResponsavel } from "./responsavel/types"
import { reportServerError } from "@/lib/server-log"

export async function getProfile(): Promise<Profile | null> {
  const supabase = await createClient()
  const { data: userData } = await supabase.auth.getUser()
  if (!userData?.user) return null

  const { data, error } = await supabase.from("profiles").select("*").eq("id", userData.user.id).maybeSingle()

  if (error) {
    reportServerError("getProfile", error)
    return null
  }
  return data as Profile | null
}

export async function getProfiles(): Promise<Profile[]> {
  const supabase = await createClient()
  const { data, error } = await supabase.from("profiles").select("*").order("nome")
  if (error) {
    reportServerError("getProfiles", error)
    return []
  }
  return data as Profile[]
}

export async function getNiveisAvaliacao(): Promise<NivelAvaliacao[]> {
  const supabase = await createClient()
  const { data, error } = await supabase.from("niveis_avaliacao").select("*").order("ordem")
  if (error) {
    reportServerError("getNiveisAvaliacao", error)
    return []
  }
  return data as NivelAvaliacao[]
}

export async function getHabilidades(): Promise<Habilidade[]> {
  const supabase = await createClient()
  const { data, error } = await supabase.from("habilidades").select("*").order("nome")
  if (error) {
    reportServerError("getHabilidades", error)
    return []
  }
  return data as Habilidade[]
}

export async function getHabilidade(id: string): Promise<Habilidade | null> {
  const supabase = await createClient()
  const { data, error } = await supabase.from("habilidades").select("*").eq("id", id).maybeSingle()
  if (error) {
    reportServerError("getHabilidade", error)
    return null
  }
  return data as Habilidade | null
}

export async function getPacientes(): Promise<Paciente[]> {
  const supabase = await createClient()
  const { data, error } = await supabase.from("pacientes").select("*").order("nome_completo")
  if (error) {
    reportServerError("getPacientes", error)
    return []
  }
  return data as Paciente[]
}

export async function getPaciente(id: string): Promise<Paciente | null> {
  const supabase = await createClient()
  const { data, error } = await supabase.from("pacientes").select("*").eq("id", id).maybeSingle()
  if (error) {
    reportServerError("getPaciente", error)
    return null
  }
  return data as Paciente | null
}

export async function getPacienteHabilidades(pacienteId: string): Promise<PacienteHabilidade[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("paciente_habilidades")
    .select("*, habilidade:habilidades(id, nome, descricao, categoria, status)")
    .eq("paciente_id", pacienteId)
    .order("created_at")
  if (error) {
    reportServerError("getPacienteHabilidades", error)
    return []
  }
  return data as unknown as PacienteHabilidade[]
}

export async function getAvaliacoesClinicasPaciente(pacienteId: string): Promise<AvaliacaoClinica[]> {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc("avaliacoes_clinicas_paciente", { p_paciente_id: pacienteId })
  if (error) {
    reportServerError("getAvaliacoesClinicasPaciente", error)
    return []
  }
  return (data ?? []).map((item: Omit<AvaliacaoClinica, "valor"> & { valor: number | string }) => ({
    ...item,
    valor: Number(item.valor),
  })) as AvaliacaoClinica[]
}

export async function getProfissionaisVinculadosPaciente(pacienteId: string): Promise<ProfissionalResumo[]> {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc("profissionais_vinculados_paciente", { p_paciente_id: pacienteId })
  if (error) { reportServerError("getProfissionaisVinculadosPaciente", error); return [] }
  return (data ?? []) as ProfissionalResumo[]
}

export async function getPacienteHabilidadesTodos(): Promise<PacienteHabilidade[]> {
  const supabase = await createClient()
  const { data: usuario } = await supabase.auth.getUser()
  if (!usuario.user) return []
  const { data, error } = await supabase
    .from("paciente_habilidades")
    .select("*, habilidade:habilidades(id, nome, descricao, categoria, status)")
    .eq("profissional_id", usuario.user.id)
  if (error) { reportServerError("getPacienteHabilidadesTodos", error); return [] }
  return data as unknown as PacienteHabilidade[]
}

export async function getAvaliacoesClinicasProfissional(): Promise<(AvaliacaoClinica & { paciente_id: string })[]> {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc("avaliacoes_clinicas_profissional")
  if (error) { reportServerError("getAvaliacoesClinicasProfissional", error); return [] }
  return (data ?? []).map((item: AvaliacaoClinica & { paciente_id: string; valor: number | string }) => ({
    ...item, valor: Number(item.valor),
  }))
}

export async function getAcessosResponsavel(pacienteId: string): Promise<AcessoResponsavel[]> {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc("listar_acessos_responsavel", { p_paciente_id: pacienteId })
  if (error) { reportServerError("getAcessosResponsavel", error); return [] }
  return (data ?? []) as AcessoResponsavel[]
}

export async function getAtendimentos(): Promise<AtendimentoComRelacoes[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("atendimentos")
    .select(
      "*, paciente:pacientes(id, nome_completo), habilidade:habilidades(id, nome), nivel_avaliacao:niveis_avaliacao(id, codigo, label, valor)",
    )
    .is("deleted_at", null)
    .order("data", { ascending: false })

  if (error) {
    reportServerError("getAtendimentos", error)
    return []
  }
  return data as unknown as AtendimentoComRelacoes[]
}

export async function getAtendimentosPorPaciente(pacienteId: string): Promise<AtendimentoComRelacoes[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("atendimentos")
    .select(
      "*, paciente:pacientes(id, nome_completo), habilidade:habilidades(id, nome), nivel_avaliacao:niveis_avaliacao(id, codigo, label, valor)",
    )
    .eq("paciente_id", pacienteId)
    .is("deleted_at", null)
    .order("data", { ascending: false })

  if (error) {
    reportServerError("getAtendimentosPorPaciente", error)
    return []
  }
  return data as unknown as AtendimentoComRelacoes[]
}

export async function getAtendimento(id: string): Promise<AtendimentoComRelacoes | null> {
  const supabase = await createClient()
  const { data, error } = await supabase.from("atendimentos")
    .select("*, paciente:pacientes(id, nome_completo), habilidade:habilidades(id, nome), nivel_avaliacao:niveis_avaliacao(id, codigo, label, valor)")
    .eq("id", id).is("deleted_at", null).maybeSingle()
  if (error) return null
  return data as unknown as AtendimentoComRelacoes | null
}

export async function getAtendimentosExcluidos(): Promise<AtendimentoComRelacoes[]> {
  const supabase = await createClient()
  const { data, error } = await supabase.from("atendimentos")
    .select("*, paciente:pacientes(id, nome_completo), habilidade:habilidades(id, nome), nivel_avaliacao:niveis_avaliacao(id, codigo, label, valor)")
    .not("deleted_at", "is", null).order("deleted_at", { ascending: false })
  if (error) return []
  return data as unknown as AtendimentoComRelacoes[]
}

// ---------- Duplicidade de pacientes ----------
// Roda via RPC de uma função SECURITY DEFINER: compara contra TODOS os pacientes
// (não só os do usuário atual), mas retorna apenas dados mascarados.
export async function buscarPossiveisDuplicatasPaciente(input: {
  nomeCompleto: string
  dataNascimento: string | null
  nomeResponsavel: string | null
  cpfResponsavel: string | null
}): Promise<CandidatoDuplicataPaciente[]> {
  if (!input.dataNascimento) return []

  const supabase = await createClient()
  const { data, error } = await supabase.rpc("buscar_possiveis_duplicatas_paciente", {
    p_nome_completo: input.nomeCompleto,
    p_data_nascimento: input.dataNascimento,
    p_nome_responsavel: input.nomeResponsavel,
    p_cpf_responsavel: input.cpfResponsavel,
  })

  if (error) {
    reportServerError("buscarPossiveisDuplicatasPaciente", error)
    return []
  }

  return (data ?? []) as CandidatoDuplicataPaciente[]
}

// ---------- Solicitações de acesso ----------

export async function getSolicitacoesRecebidas(): Promise<SolicitacaoAcessoComRelacoes[]> {
  const supabase = await createClient()
  const { data: userData } = await supabase.auth.getUser()
  if (!userData?.user) return []

  // Recebidas = solicitações pendentes de pacientes que o usuário já criou/atende,
  // que a política de RLS já restringe corretamente — aqui só filtramos o status.
  const { data, error } = await supabase
    .from("solicitacoes_acesso")
    .select("*, paciente:pacientes(id, nome_completo), solicitante:profiles!solicitante_id(id, nome, email)")
    .eq("status", "pendente")
    .neq("solicitante_id", userData.user.id)
    .order("created_at", { ascending: false })

  if (error) {
    reportServerError("getSolicitacoesRecebidas", error)
    return []
  }
  return data as unknown as SolicitacaoAcessoComRelacoes[]
}

export async function getSolicitacoesEnviadas(): Promise<SolicitacaoAcessoComRelacoes[]> {
  const supabase = await createClient()
  const { data: userData } = await supabase.auth.getUser()
  if (!userData?.user) return []

  const { data, error } = await supabase
    .from("solicitacoes_acesso")
    .select("*, paciente:pacientes(id, nome_completo), solicitante:profiles!solicitante_id(id, nome, email)")
    .eq("solicitante_id", userData.user.id)
    .order("created_at", { ascending: false })

  if (error) {
    reportServerError("getSolicitacoesEnviadas", error)
    return []
  }
  return data as unknown as SolicitacaoAcessoComRelacoes[]
}
