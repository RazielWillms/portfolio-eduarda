// Camada de leitura de dados do sistema de registros — usada em Server Components.
// Todas as consultas passam pelo cliente Supabase autenticado do usuário atual,
// então o RLS aplica automaticamente as regras de visibilidade (admin vê tudo,
// psicólogo só vê seus próprios pacientes/atendimentos).
import { createClient } from "@/lib/supabase/server"
import type { Atendimento, AtendimentoComRelacoes, Habilidade, NivelAvaliacao, Paciente, Profile } from "./types"

export async function getProfile(): Promise<Profile | null> {
  const supabase = await createClient()
  const { data: userData } = await supabase.auth.getUser()
  if (!userData?.user) return null

  const { data, error } = await supabase.from("profiles").select("*").eq("id", userData.user.id).maybeSingle()

  if (error) {
    console.log("[v0] getProfile error:", error.message)
    return null
  }
  return data as Profile | null
}

export async function getProfiles(): Promise<Profile[]> {
  const supabase = await createClient()
  const { data, error } = await supabase.from("profiles").select("*").order("nome")
  if (error) {
    console.log("[v0] getProfiles error:", error.message)
    return []
  }
  return data as Profile[]
}

export async function getNiveisAvaliacao(): Promise<NivelAvaliacao[]> {
  const supabase = await createClient()
  const { data, error } = await supabase.from("niveis_avaliacao").select("*").order("ordem")
  if (error) {
    console.log("[v0] getNiveisAvaliacao error:", error.message)
    return []
  }
  return data as NivelAvaliacao[]
}

export async function getHabilidades(): Promise<Habilidade[]> {
  const supabase = await createClient()
  const { data, error } = await supabase.from("habilidades").select("*").order("nome")
  if (error) {
    console.log("[v0] getHabilidades error:", error.message)
    return []
  }
  return data as Habilidade[]
}

export async function getHabilidade(id: string): Promise<Habilidade | null> {
  const supabase = await createClient()
  const { data, error } = await supabase.from("habilidades").select("*").eq("id", id).maybeSingle()
  if (error) {
    console.log("[v0] getHabilidade error:", error.message)
    return null
  }
  return data as Habilidade | null
}

export async function getPacientes(): Promise<Paciente[]> {
  const supabase = await createClient()
  const { data, error } = await supabase.from("pacientes").select("*").order("nome_completo")
  if (error) {
    console.log("[v0] getPacientes error:", error.message)
    return []
  }
  return data as Paciente[]
}

export async function getPaciente(id: string): Promise<Paciente | null> {
  const supabase = await createClient()
  const { data, error } = await supabase.from("pacientes").select("*").eq("id", id).maybeSingle()
  if (error) {
    console.log("[v0] getPaciente error:", error.message)
    return null
  }
  return data as Paciente | null
}

export async function getAtendimentos(): Promise<AtendimentoComRelacoes[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("atendimentos")
    .select(
      "*, paciente:pacientes(id, nome_completo), habilidade:habilidades(id, nome), nivel_avaliacao:niveis_avaliacao(id, codigo, label, valor)",
    )
    .order("data", { ascending: false })

  if (error) {
    console.log("[v0] getAtendimentos error:", error.message)
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
    .order("data", { ascending: false })

  if (error) {
    console.log("[v0] getAtendimentosPorPaciente error:", error.message)
    return []
  }
  return data as unknown as AtendimentoComRelacoes[]
}
