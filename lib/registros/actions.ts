"use server"

// Server Actions do sistema de registros. Todas rodam com o cliente Supabase
// autenticado do usuário (respeitando RLS) — nunca usar o cliente admin aqui,
// exceto na criação de contas de usuário (ver createUsuario), que exige a
// service role key para criar o registro em auth.users.
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import type { Papel } from "./types"

function genericError(message: string) {
  return { error: message }
}

// ---------- Auth ----------

export async function signIn(email: string, password: string) {
  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    console.log("[v0] signIn error:", error.message)
    return genericError("E-mail ou senha inválidos.")
  }

  redirect("/registros")
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect("/registros/login")
}

// ---------- Pacientes ----------

export async function createPaciente(input: {
  nome_completo: string
  nome_responsavel: string | null
  data_nascimento: string | null
  diagnostico: string | null
  contatos: string | null
  observacoes: string | null
}) {
  const supabase = await createClient()
  const { data: userData } = await supabase.auth.getUser()
  if (!userData?.user) return genericError("Sessão expirada. Faça login novamente.")

  const { data: paciente, error } = await supabase
    .from("pacientes")
    .insert({ ...input, criado_por: userData.user.id })
    .select("id")
    .single()

  if (error) {
    console.log("[v0] createPaciente error:", error.message)
    return genericError("Não foi possível cadastrar o paciente.")
  }

  const { error: linkError } = await supabase
    .from("paciente_psicologos")
    .insert({ paciente_id: paciente.id, psicologo_id: userData.user.id })

  if (linkError) {
    console.log("[v0] createPaciente link error:", linkError.message)
  }

  revalidatePath("/registros/pacientes")
  redirect(`/registros/pacientes/${paciente.id}`)
}

export async function updatePaciente(
  id: string,
  input: {
    nome_completo: string
    nome_responsavel: string | null
    data_nascimento: string | null
    diagnostico: string | null
    contatos: string | null
    observacoes: string | null
    status: "ativo" | "inativo"
  },
) {
  const supabase = await createClient()
  const { error } = await supabase.from("pacientes").update(input).eq("id", id)

  if (error) {
    console.log("[v0] updatePaciente error:", error.message)
    return genericError("Não foi possível atualizar o paciente.")
  }

  revalidatePath("/registros/pacientes")
  revalidatePath(`/registros/pacientes/${id}`)
  redirect(`/registros/pacientes/${id}`)
}

// ---------- Habilidades ----------

export async function createHabilidade(input: {
  nome: string
  descricao: string | null
  categoria: string | null
  peso: number
}) {
  const supabase = await createClient()
  const { error } = await supabase.from("habilidades").insert(input)

  if (error) {
    console.log("[v0] createHabilidade error:", error.message)
    return genericError("Não foi possível cadastrar a habilidade.")
  }

  revalidatePath("/registros/habilidades")
  redirect("/registros/habilidades")
}

export async function updateHabilidade(
  id: string,
  input: {
    nome: string
    descricao: string | null
    categoria: string | null
    peso: number
    status: "ativa" | "inativa"
  },
) {
  const supabase = await createClient()
  const { error } = await supabase.from("habilidades").update(input).eq("id", id)

  if (error) {
    console.log("[v0] updateHabilidade error:", error.message)
    return genericError("Não foi possível atualizar a habilidade.")
  }

  revalidatePath("/registros/habilidades")
  redirect("/registros/habilidades")
}

// ---------- Atendimentos ----------

export async function createAtendimento(input: {
  paciente_id: string
  habilidade_id: string
  data: string
  nivel_avaliacao_id: string
  observacoes: string | null
}) {
  const supabase = await createClient()
  const { data: userData } = await supabase.auth.getUser()
  if (!userData?.user) return genericError("Sessão expirada. Faça login novamente.")

  const { error } = await supabase.from("atendimentos").insert({ ...input, psicologo_id: userData.user.id })

  if (error) {
    console.log("[v0] createAtendimento error:", error.message)
    return genericError("Não foi possível registrar o atendimento.")
  }

  revalidatePath("/registros/atendimentos")
  revalidatePath(`/registros/pacientes/${input.paciente_id}`)
  redirect("/registros/atendimentos")
}

// ---------- Usuários (somente admin) ----------
// Cria a conta diretamente via Admin API (service role), já com e-mail confirmado
// e senha provisória. O trigger handle_new_user cria a linha em profiles.

export async function createUsuario(input: {
  nome: string
  email: string
  papel: Papel
  senhaProvisoria: string
}) {
  const supabase = await createClient()
  const profile = await supabase.from("profiles").select("papel").eq("id", (await supabase.auth.getUser()).data.user?.id ?? "").maybeSingle()

  if (profile.data?.papel !== "admin") {
    return genericError("Apenas administradores podem cadastrar usuários.")
  }

  const admin = createAdminClient()
  const { error } = await admin.auth.admin.createUser({
    email: input.email,
    password: input.senhaProvisoria,
    email_confirm: true,
    user_metadata: { nome: input.nome },
    app_metadata: { papel: input.papel, status: "ativo" },
  })

  if (error) {
    console.log("[v0] createUsuario error:", error.message)
    return genericError("Não foi possível criar o usuário. Verifique se o e-mail já está em uso.")
  }

  revalidatePath("/registros/usuarios")
  redirect("/registros/usuarios")
}

export async function updateUsuarioStatus(id: string, status: "ativo" | "inativo") {
  const supabase = await createClient()
  const { data: userData } = await supabase.auth.getUser()
  if (!userData?.user) return genericError("Sessão expirada. Faça login novamente.")

  const profile = await supabase.from("profiles").select("papel").eq("id", userData.user.id).maybeSingle()
  if (profile.data?.papel !== "admin") {
    return genericError("Apenas administradores podem alterar usuários.")
  }

  const admin = createAdminClient()
  const { error } = await admin.from("profiles").update({ status }).eq("id", id)

  if (error) {
    console.log("[v0] updateUsuarioStatus error:", error.message)
    return genericError("Não foi possível atualizar o usuário.")
  }

  revalidatePath("/registros/usuarios")
}

export async function updateUsuarioPapel(id: string, papel: Papel) {
  const supabase = await createClient()
  const { data: userData } = await supabase.auth.getUser()
  if (!userData?.user) return genericError("Sessão expirada. Faça login novamente.")

  const profile = await supabase.from("profiles").select("papel").eq("id", userData.user.id).maybeSingle()
  if (profile.data?.papel !== "admin") {
    return genericError("Apenas administradores podem alterar usuários.")
  }

  const admin = createAdminClient()
  const { error } = await admin.from("profiles").update({ papel }).eq("id", id)

  if (error) {
    console.log("[v0] updateUsuarioPapel error:", error.message)
    return genericError("Não foi possível atualizar o usuário.")
  }

  revalidatePath("/registros/usuarios")
}
