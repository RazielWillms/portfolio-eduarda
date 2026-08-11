"use server"

// Server Actions do sistema de registros. Todas rodam com o cliente Supabase
// autenticado do usuário (respeitando RLS) — nunca usar o cliente admin aqui,
// exceto na criação de contas de usuário (ver createUsuario), que exige a
// service role key para criar o registro em auth.users.
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { buscarPossiveisDuplicatasPaciente } from "./queries"
import type { CandidatoDuplicataPaciente, Papel } from "./types"
import { reportServerError } from "@/lib/server-log"

function genericError(message: string) {
  return { error: message }
}

function missingDatabaseObjectMessage(message: string) {
  const match = message.match(/(?:column|relation) ["']?([a-zA-Z0-9_.]+)["']? does not exist/i)
  return match ? `O banco não possui o objeto esperado: ${match[1]}.` : `Falha estrutural do banco: ${message}`
}

// ---------- Auth ----------

export async function signIn(email: string, password: string) {
  const supabase = await createClient()
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    reportServerError("signIn", error)
    const code = error.code

    if (code === "over_request_rate_limit" || error.status === 429) {
      return genericError("Muitas tentativas de acesso. Aguarde alguns minutos e tente novamente.")
    }
    if (code === "email_not_confirmed") {
      return genericError("Este e-mail ainda não foi confirmado.")
    }
    if (code === "invalid_credentials") {
      return genericError("E-mail ou senha inválidos.")
    }

    return genericError("Não foi possível acessar o serviço de autenticação. Tente novamente em instantes.")
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("status")
    .eq("id", data.user.id)
    .maybeSingle()

  if (profileError || !profile) {
    reportServerError("signIn.profile", profileError ?? { code: "profile_not_found" })
    await supabase.auth.signOut()
    return genericError("Sua conta foi autenticada, mas não possui um perfil profissional configurado.")
  }

  if (profile.status !== "ativo") {
    revalidatePath("/", "layout")
    redirect("/registros/bloqueado")
  }

  revalidatePath("/", "layout")
  redirect("/registros")
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect("/registros/login")
}

export async function alterarMinhaSenha(novaSenha: string, confirmacao: string) {
  if (novaSenha.length < 8) return genericError("A nova senha deve ter pelo menos 8 caracteres.")
  if (novaSenha !== confirmacao) return genericError("A confirmação da senha não corresponde.")

  const supabase = await createClient()
  const { data: userData } = await supabase.auth.getUser()
  if (!userData.user) return genericError("Sessão expirada. Faça login novamente.")

  const { error } = await supabase.auth.updateUser({ password: novaSenha })
  if (error) {
    reportServerError("alterarMinhaSenha", error)
    if (error.code === "same_password") return genericError("A nova senha deve ser diferente da senha atual.")
    if (error.code === "weak_password") return genericError("Escolha uma senha mais forte.")
    if (error.status === 429) return genericError("Muitas tentativas. Aguarde alguns minutos e tente novamente.")
    return genericError("Não foi possível alterar a senha agora.")
  }

  return { success: true }
}

// ---------- Pacientes ----------

export async function criarAcessoResponsavel(input: { pacienteId: string; validadeDias: 7 | 30 | 90 | null; descricao: string; escopo: "profissional" | "equipe" }) {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc("criar_acesso_responsavel", {
    p_paciente_id: input.pacienteId, p_validade_dias: input.validadeDias, p_descricao: input.descricao, p_escopo: input.escopo,
  })
  if (error) {
    reportServerError("criarAcessoResponsavel", error)
    if (error.code === "PGRST202" || error.code === "42883") {
      return genericError("O banco ainda não possui a função necessária para gerar o acesso externo.")
    }
    if (error.code === "42501") {
      return genericError("Você precisa estar vinculado a este paciente para gerar um acesso externo.")
    }
    if (error.code === "22023") {
      return genericError("A validade escolhida para o acesso não é permitida.")
    }
    if (error.code === "42P01") {
      return genericError("A estrutura do portal de responsáveis ainda não foi instalada no banco.")
    }
    return genericError("Não foi possível gerar o acesso externo devido a uma falha no banco de dados.")
  }
  if (!data?.[0]) return genericError("O banco não retornou o acesso externo gerado.")
  return { success: true, acesso: data[0] as { id: string; token: string; criado_em: string; expira_em: string | null } }
}

export async function revogarAcessoResponsavel(input: { acessoId: string; pacienteId: string }) {
  const supabase = await createClient()
  const { error } = await supabase.rpc("revogar_acesso_responsavel", { p_acesso_id: input.acessoId })
  if (error) return genericError("Não foi possível revogar o acesso.")
  revalidatePath(`/registros/pacientes/${input.pacienteId}`)
  return { success: true }
}

type CreatePacienteInput = {
  nome_completo: string
  nome_responsavel: string | null
  cpf_responsavel: string | null
  data_nascimento: string | null
  diagnostico: string | null
  contatos: string | null
  observacoes: string | null
}

// Verifica se já existe um paciente com nome/CPF do responsável/nome do responsável
// coincidentes antes de cadastrar. Retorna candidatos mascarados para o formulário
// confirmar com o profissional antes de criar um registro duplicado.
export async function verificarDuplicidadePaciente(
  input: Pick<CreatePacienteInput, "nome_completo" | "data_nascimento" | "nome_responsavel" | "cpf_responsavel">,
): Promise<{ candidatos: CandidatoDuplicataPaciente[] }> {
  const candidatos = await buscarPossiveisDuplicatasPaciente({
    nomeCompleto: input.nome_completo,
    dataNascimento: input.data_nascimento,
    nomeResponsavel: input.nome_responsavel,
    cpfResponsavel: input.cpf_responsavel,
  })
  return { candidatos }
}

export async function createPaciente(input: CreatePacienteInput) {
  const supabase = await createClient()
  const { data: userData } = await supabase.auth.getUser()
  if (!userData?.user) return genericError("Sessão expirada. Faça login novamente.")

  const { candidatos } = await verificarDuplicidadePaciente(input)
  if (candidatos.length > 0) {
    return { duplicidade: candidatos }
  }

  const { data: pacienteId, error } = await supabase.rpc("criar_paciente_com_vinculo", {
    p_nome_completo: input.nome_completo,
    p_nome_responsavel: input.nome_responsavel,
    p_cpf_responsavel: input.cpf_responsavel,
    p_data_nascimento: input.data_nascimento,
    p_diagnostico: input.diagnostico,
    p_contatos: input.contatos,
    p_observacoes: input.observacoes,
  })

  if (error) {
    reportServerError("createPaciente", error)
    if (error.message.includes("possible_duplicate") || error.code === "23505") {
      const duplicatas = await verificarDuplicidadePaciente(input)
      if (duplicatas.candidatos.length > 0) return { duplicidade: duplicatas.candidatos }
    }
    if (error.code === "PGRST202" || error.code === "42883") {
      return genericError("O banco ainda não possui a função necessária para cadastrar pacientes.")
    }
    if (error.code === "42501") {
      return genericError("Seu perfil não possui permissão ativa para cadastrar pacientes.")
    }
    if (["22023", "23502", "23514"].includes(error.code ?? "")) {
      return genericError("Revise os dados obrigatórios do paciente e tente novamente.")
    }
    return genericError("Não foi possível cadastrar o paciente devido a uma falha no banco de dados.")
  }

  revalidatePath("/registros/pacientes")
  redirect(`/registros/pacientes/${pacienteId}`)
}

// ---------- Solicitações de acesso ----------

export async function solicitarAcessoPaciente(input: {
  pacienteId: string
  mensagem: string | null
  papelNoCaso: string | null
}) {
  const supabase = await createClient()
  const { data: userData } = await supabase.auth.getUser()
  if (!userData?.user) return genericError("Sessão expirada. Faça login novamente.")

  const { error } = await supabase.rpc("solicitar_acesso_paciente", {
    p_paciente_id: input.pacienteId,
    p_mensagem: input.mensagem,
    p_papel_no_caso: input.papelNoCaso,
  })

  if (error) {
    reportServerError("solicitarAcessoPaciente", error)
    if (error.code === "PGRST202" || error.code === "42883") {
      return genericError("O banco ainda não possui a função necessária para solicitar acesso.")
    }
    if (error.code === "23505" || error.message.includes("already_linked")) {
      return genericError("Você já possui vínculo com este paciente ou uma solicitação pendente.")
    }
    if (error.code === "42501") {
      return genericError("Seu perfil não possui permissão ativa para solicitar acesso.")
    }
    if (error.code === "22023") {
      return genericError("Esta solicitação não pode mais ser processada.")
    }
    return genericError("Não foi possível enviar a solicitação devido a uma falha no banco de dados.")
  }

  revalidatePath("/registros/solicitacoes")
  return { success: true }
}

export async function aprovarSolicitacaoAcesso(id: string) {
  const supabase = await createClient()
  const { error } = await supabase.rpc("aprovar_solicitacao_acesso", { p_solicitacao_id: id })

  if (error) {
    reportServerError("aprovarSolicitacaoAcesso", error)
    return genericError("Não foi possível aprovar a solicitação.")
  }

  revalidatePath("/registros/solicitacoes")
  revalidatePath("/registros/pacientes")
  return { success: true }
}

export async function negarSolicitacaoAcesso(id: string) {
  const supabase = await createClient()
  const { error } = await supabase.rpc("negar_solicitacao_acesso", { p_solicitacao_id: id })

  if (error) {
    reportServerError("negarSolicitacaoAcesso", error)
    return genericError("Não foi possível negar a solicitação.")
  }

  revalidatePath("/registros/solicitacoes")
  return { success: true }
}

export async function updatePaciente(
  id: string,
  input: {
    nome_completo: string
    nome_responsavel: string | null
    cpf_responsavel: string | null
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
    reportServerError("updatePaciente", error)
    return genericError("Não foi possível atualizar o paciente.")
  }

  revalidatePath("/registros/pacientes")
  revalidatePath(`/registros/pacientes/${id}`)
  redirect(`/registros/pacientes/${id}`)
}

// ---------- Habilidades ----------

export async function vincularHabilidadePaciente(input: { pacienteId: string; habilidadeId: string; peso: number }) {
  const supabase = await createClient()
  const { data: usuario } = await supabase.auth.getUser()
  if (!usuario.user) return genericError("Sua sessao expirou. Entre novamente.")
  const { error } = await supabase.from("paciente_habilidades").upsert(
    { paciente_id: input.pacienteId, habilidade_id: input.habilidadeId, profissional_id: usuario.user.id, peso: input.peso, ativo: true },
    { onConflict: "paciente_id,habilidade_id,profissional_id" },
  )
  if (error) return genericError("Não foi possível vincular a habilidade.")
  revalidatePath(`/registros/pacientes/${input.pacienteId}`)
  return { success: true }
}

export async function atualizarPacienteHabilidade(input: {
  id: string
  pacienteId: string
  peso: number
  ativo: boolean
}) {
  const supabase = await createClient()
  const { error } = await supabase
    .from("paciente_habilidades")
    .update({ peso: input.peso, ativo: input.ativo })
    .eq("id", input.id)
  if (error) return genericError("Não foi possível atualizar a habilidade do paciente.")
  revalidatePath(`/registros/pacientes/${input.pacienteId}`)
  return { success: true }
}

export async function createHabilidade(input: {
  nome: string
  descricao: string | null
  categoria: string | null
  peso: number
}) {
  const supabase = await createClient()
  const { error } = await supabase.from("habilidades").insert(input)

  if (error) {
    reportServerError("createHabilidade", error)
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
    reportServerError("updateHabilidade", error)
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
    reportServerError("createAtendimento", error)
    return genericError("Não foi possível registrar o atendimento.")
  }

  revalidatePath("/registros/atendimentos")
  revalidatePath(`/registros/pacientes/${input.paciente_id}`)
  redirect("/registros/atendimentos")
}

export async function updateAtendimento(id: string, input: {
  paciente_id: string; habilidade_id: string; data: string; nivel_avaliacao_id: string; observacoes: string | null
}) {
  const supabase = await createClient()
  const { data, error } = await supabase.from("atendimentos").update(input).eq("id", id).is("deleted_at", null).select("id").maybeSingle()
  if (error || !data) return genericError("Você não possui permissão para alterar este atendimento.")
  revalidatePath("/registros/atendimentos"); revalidatePath(`/registros/pacientes/${input.paciente_id}`)
  redirect("/registros/atendimentos")
}

export async function excluirAtendimento(input: { id: string; pacienteId: string }) {
  const supabase = await createClient(); const { data: userData } = await supabase.auth.getUser()
  if (!userData.user) return genericError("Sessão expirada. Faça login novamente.")
  const { data, error } = await supabase.from("atendimentos")
    .update({ deleted_at: new Date().toISOString(), deleted_by: userData.user.id }).eq("id", input.id).is("deleted_at", null).select("id").maybeSingle()
  if (error || !data) return genericError("Você não possui permissão para excluir este atendimento.")
  revalidatePath("/registros/atendimentos"); revalidatePath(`/registros/pacientes/${input.pacienteId}`)
  return { success: true }
}

export async function restaurarAtendimento(input: { id: string; pacienteId: string }) {
  const supabase = await createClient()
  const { data, error } = await supabase.from("atendimentos").update({ deleted_at: null, deleted_by: null }).eq("id", input.id).select("id").maybeSingle()
  if (error || !data) return genericError("Você não possui permissão para restaurar este atendimento.")
  revalidatePath("/registros/atendimentos"); revalidatePath(`/registros/pacientes/${input.pacienteId}`)
  return { success: true }
}

export async function excluirOuDesativarHabilidade(id: string) {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc("excluir_ou_desativar_habilidade", { p_habilidade_id: id })
  if (error) return genericError("Apenas administradores podem excluir ou desativar habilidades globais.")
  revalidatePath("/registros/habilidades")
  return { success: true, resultado: data as "excluida" | "desativada" }
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
  if (!admin) return genericError("A chave administrativa do Supabase não está configurada no servidor.")
  const { error } = await admin.auth.admin.createUser({
    email: input.email,
    password: input.senhaProvisoria,
    email_confirm: true,
    user_metadata: { nome: input.nome },
    app_metadata: { papel: input.papel, status: "ativo" },
  })

  if (error) {
    reportServerError("createUsuario", error)
    if (error.code === "email_exists" || error.message.toLowerCase().includes("already been registered")) {
      return genericError("Já existe um usuário cadastrado com este e-mail.")
    }
    if (error.code === "unexpected_failure" || error.message.toLowerCase().includes("database error")) {
      return genericError("O usuário não pôde ser criado porque o trigger de perfis do banco está desatualizado.")
    }
    return genericError(`Não foi possível criar o usuário (código ${error.code ?? "desconhecido"}).`)
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

  const { error } = await supabase.rpc("atualizar_profile_admin", {
    p_usuario_id: id,
    p_papel: null,
    p_status: status,
  })

  if (error) {
    reportServerError("updateUsuarioStatus", error)
    if (error.code === "PGRST202" || error.code === "42883") return genericError("A função administrativa ainda não foi instalada no banco.")
    if (error.message.includes("cannot_remove_own_admin_access")) return genericError("Você não pode remover o acesso administrativo da própria conta.")
    if (error.message.includes("main_admin_is_protected")) return genericError("O administrador principal não pode ser rebaixado ou inativado.")
    if (error.code === "42501") return genericError("Apenas administradores ativos podem alterar usuários.")
    if (error.code === "23514") return genericError("O papel ou status escolhido não é aceito pela configuração atual do banco.")
    if (error.code === "42703" || error.code === "42P01") return genericError(missingDatabaseObjectMessage(error.message))
    return genericError(`Não foi possível atualizar o usuário (código ${error.code ?? "desconhecido"}).`)
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

  const { error } = await supabase.rpc("atualizar_profile_admin", {
    p_usuario_id: id,
    p_papel: papel,
    p_status: null,
  })

  if (error) {
    reportServerError("updateUsuarioPapel", error)
    if (error.code === "PGRST202" || error.code === "42883") return genericError("A função administrativa ainda não foi instalada no banco.")
    if (error.message.includes("cannot_remove_own_admin_access")) return genericError("Você não pode remover o acesso administrativo da própria conta.")
    if (error.message.includes("main_admin_is_protected")) return genericError("O papel do administrador principal é protegido.")
    if (error.code === "42501") return genericError("Apenas administradores ativos podem alterar usuários.")
    if (error.code === "23514") return genericError("O papel ou status escolhido não é aceito pela configuração atual do banco.")
    if (error.code === "42703" || error.code === "42P01") return genericError(missingDatabaseObjectMessage(error.message))
    return genericError(`Não foi possível atualizar o usuário (código ${error.code ?? "desconhecido"}).`)
  }

  revalidatePath("/registros/usuarios")
}
