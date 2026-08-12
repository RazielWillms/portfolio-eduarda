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
import { extensaoFoto, FOTO_BUCKET, validarFoto } from "./fotos"

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

export async function criarAgendamento(input:{pacienteId:string;profissionalId:string;inicio:string;fim:string;finalidade:string;modalidade:string;local:string;observacao:string}){const supabase=await createClient(),{error}=await supabase.rpc("criar_agendamento",{p_paciente_id:input.pacienteId,p_profissional_id:input.profissionalId,p_inicio:input.inicio,p_fim:input.fim,p_finalidade:input.finalidade,p_modalidade:input.modalidade,p_local:input.local,p_observacao:input.observacao});if(error){reportServerError("criarAgendamento",error);if(error.message.includes("schedule_conflict")||error.code==="23P01")return genericError("Este profissional já possui um compromisso no horário.");if(error.code==="42501")return genericError("Somente coordenação ou administração pode criar agendamentos.");return genericError("Não foi possível criar o agendamento.")}revalidatePath("/registros/agenda");revalidatePath("/registros");return{success:true}}
export async function atualizarStatusAgendamento(id:string,status:"agendado"|"confirmado"|"cancelado"|"falta"){const supabase=await createClient(),{error}=await supabase.rpc("atualizar_status_agendamento",{p_id:id,p_status:status});if(error){reportServerError("atualizarStatusAgendamento",error);return genericError("Não foi possível atualizar o compromisso.")}revalidatePath("/registros/agenda");revalidatePath("/registros");return{success:true}}

export async function alterarMinhaSenha(senhaAtual: string, novaSenha: string, confirmacao: string) {
  if (!senhaAtual) return genericError("Informe sua senha atual.")
  if (novaSenha.length < 8) return genericError("A nova senha deve ter pelo menos 8 caracteres.")
  if (novaSenha !== confirmacao) return genericError("A confirmação da senha não corresponde.")

  const supabase = await createClient()
  const { data: userData } = await supabase.auth.getUser()
  if (!userData.user) return genericError("Sessão expirada. Faça login novamente.")

  if (!userData.user.email) return genericError("Sua conta não possui um e-mail válido para confirmar a senha atual.")
  const { error: confirmacaoError } = await supabase.auth.signInWithPassword({
    email: userData.user.email,
    password: senhaAtual,
  })
  if (confirmacaoError) {
    reportServerError("alterarMinhaSenha.confirmarSenhaAtual", confirmacaoError)
    if (confirmacaoError.status === 429) return genericError("Muitas tentativas. Aguarde alguns minutos e tente novamente.")
    return genericError("A senha atual está incorreta.")
  }

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

function lerEnquadramento(formData:FormData){
  const zoom=Number(formData.get("zoom")),posX=Number(formData.get("posX")),posY=Number(formData.get("posY"))
  if(!Number.isFinite(zoom)||zoom<1||zoom>2.5||!Number.isFinite(posX)||Math.abs(posX)>50||!Number.isFinite(posY)||Math.abs(posY)>50)return null
  return{zoom,posX,posY}
}
async function salvarFotoPrivada(input:{arquivo:File;escopo:"profiles"|"patients";id:string;pathAnterior:string|null;zoom:number;posX:number;posY:number}){
  const erroValidacao=validarFoto(input.arquivo);if(erroValidacao)return genericError(erroValidacao)
  const supabase=await createClient(),path=`${input.escopo}/${input.id}/${Date.now()}.${extensaoFoto(input.arquivo.type)}`
  const{error:uploadError}=await supabase.storage.from(FOTO_BUCKET).upload(path,input.arquivo,{contentType:input.arquivo.type,upsert:false,cacheControl:"3600"})
  if(uploadError){reportServerError("salvarFotoPrivada.upload",uploadError);return genericError("Não foi possível enviar a foto.")}
  const crop={p_foto_path:path,p_zoom:input.zoom,p_pos_x:input.posX,p_pos_y:input.posY}
  const rpc=input.escopo==="profiles"?await supabase.rpc("atualizar_minha_foto",crop):await supabase.rpc("atualizar_foto_paciente",{p_paciente_id:input.id,...crop})
  if(rpc.error){await supabase.storage.from(FOTO_BUCKET).remove([path]);reportServerError("salvarFotoPrivada.referencia",rpc.error);return genericError("Não foi possível associar a foto ao cadastro.")}
  if(input.pathAnterior)await supabase.storage.from(FOTO_BUCKET).remove([input.pathAnterior])
  return{success:true}
}
export async function atualizarMinhaFoto(formData:FormData){const arquivo=formData.get("foto"),crop=lerEnquadramento(formData);if(!(arquivo instanceof File))return genericError("Selecione uma foto.");if(!crop)return genericError("O enquadramento informado é inválido.");const supabase=await createClient(),{data:user}=await supabase.auth.getUser();if(!user.user)return genericError("Sessão expirada. Faça login novamente.");const{data:profile}=await supabase.from("profiles").select("foto_path").eq("id",user.user.id).maybeSingle();const r=await salvarFotoPrivada({arquivo,escopo:"profiles",id:user.user.id,pathAnterior:profile?.foto_path??null,...crop});if("success"in r)revalidatePath("/registros","layout");return r}
export async function removerMinhaFoto(){const supabase=await createClient(),{data:user}=await supabase.auth.getUser();if(!user.user)return genericError("Sessão expirada. Faça login novamente.");const{data:profile}=await supabase.from("profiles").select("foto_path").eq("id",user.user.id).maybeSingle();const{error}=await supabase.rpc("atualizar_minha_foto",{p_foto_path:null,p_zoom:1,p_pos_x:0,p_pos_y:0});if(error)return genericError("Não foi possível remover a foto.");if(profile?.foto_path)await supabase.storage.from(FOTO_BUCKET).remove([profile.foto_path]);revalidatePath("/registros","layout");return{success:true}}
export async function atualizarFotoPaciente(pacienteId:string,formData:FormData){const arquivo=formData.get("foto"),crop=lerEnquadramento(formData);if(!(arquivo instanceof File))return genericError("Selecione uma foto.");if(!crop)return genericError("O enquadramento informado é inválido.");const supabase=await createClient(),{data:paciente}=await supabase.from("pacientes").select("foto_path").eq("id",pacienteId).maybeSingle();if(!paciente)return genericError("Paciente não encontrado ou sem permissão.");const r=await salvarFotoPrivada({arquivo,escopo:"patients",id:pacienteId,pathAnterior:paciente.foto_path??null,...crop});if("success"in r)revalidatePath(`/registros/pacientes/${pacienteId}`,"layout");return r}
export async function removerFotoPaciente(pacienteId:string){const supabase=await createClient(),{data:paciente}=await supabase.from("pacientes").select("foto_path").eq("id",pacienteId).maybeSingle();if(!paciente)return genericError("Paciente não encontrado ou sem permissão.");const{error}=await supabase.rpc("atualizar_foto_paciente",{p_paciente_id:pacienteId,p_foto_path:null,p_zoom:1,p_pos_x:0,p_pos_y:0});if(error)return genericError("Não foi possível remover a foto.");if(paciente.foto_path)await supabase.storage.from(FOTO_BUCKET).remove([paciente.foto_path]);revalidatePath(`/registros/pacientes/${pacienteId}`,"layout");return{success:true}}
export async function atualizarEnquadramentoFoto(tipo:"profile"|"paciente",id:string,zoom:number,posX:number,posY:number){
  const fd=new FormData();fd.set("zoom",String(zoom));fd.set("posX",String(posX));fd.set("posY",String(posY));const crop=lerEnquadramento(fd)
  if(!crop)return genericError("O enquadramento informado é inválido.")
  const supabase=await createClient()
  if(tipo==="profile"){
    const{data:user}=await supabase.auth.getUser();if(!user.user)return genericError("Sessão expirada. Faça login novamente.")
    const{data:profile}=await supabase.from("profiles").select("foto_path").eq("id",user.user.id).maybeSingle();if(!profile?.foto_path)return genericError("Adicione uma foto antes de ajustar o enquadramento.")
    const{error}=await supabase.rpc("atualizar_minha_foto",{p_foto_path:profile.foto_path,p_zoom:crop.zoom,p_pos_x:crop.posX,p_pos_y:crop.posY});if(error)return genericError("Não foi possível salvar o enquadramento.")
  }else{
    const{data:paciente}=await supabase.from("pacientes").select("foto_path").eq("id",id).maybeSingle();if(!paciente?.foto_path)return genericError("Adicione uma foto antes de ajustar o enquadramento.")
    const{error}=await supabase.rpc("atualizar_foto_paciente",{p_paciente_id:id,p_foto_path:paciente.foto_path,p_zoom:crop.zoom,p_pos_x:crop.posX,p_pos_y:crop.posY});if(error)return genericError("Não foi possível salvar o enquadramento.")
  }
  revalidatePath("/registros","layout");return{success:true}
}

export async function atualizarMeusDadosProfissionais(input:{profissao:string;conselhoTipo:string;conselhoNumero:string;conselhoUf:string}){
  const profissao=input.profissao.trim(),conselhoTipo=input.conselhoTipo.trim().toUpperCase(),conselhoNumero=input.conselhoNumero.trim(),conselhoUf=input.conselhoUf.trim().toUpperCase()
  if(profissao.length>100||conselhoTipo.length>30||conselhoNumero.length>40||conselhoUf&&!/^[A-Z]{2}$/.test(conselhoUf))return genericError("Revise os dados profissionais informados.")
  const supabase=await createClient(),{error}=await supabase.rpc("atualizar_meus_dados_profissionais",{p_profissao:profissao||null,p_conselho_tipo:conselhoTipo||null,p_conselho_numero:conselhoNumero||null,p_conselho_uf:conselhoUf||null})
  if(error){reportServerError("atualizarMeusDadosProfissionais",error);return genericError("Não foi possível atualizar os dados profissionais.")}
  revalidatePath("/registros","layout");return{success:true}
}

// ---------- Pacientes ----------

export async function criarAcessoResponsavel(input: { pacienteId:string;validadeDias:7|30|90|null;descricao:string;escopo:"profissional"|"equipe";periodoMeses:3|6|12|24;alvoIds:string[];exibirCriterios:boolean;exibirFases:boolean;exibirIntegridade:boolean;exibirContextos:boolean;exibirAnaliseTentativas:boolean }) {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc("criar_acesso_responsavel_v2", {
    p_paciente_id:input.pacienteId,p_validade_dias:input.validadeDias,p_descricao:input.descricao,p_escopo:input.escopo,p_periodo_meses:input.periodoMeses,p_alvos:input.alvoIds,p_exibir_criterios:input.exibirCriterios,p_exibir_fases:input.exibirFases,p_exibir_integridade:input.exibirIntegridade,p_exibir_contextos:input.exibirContextos,p_exibir_analise_tentativas:input.exibirAnaliseTentativas,
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
  cpf_paciente: string | null
  data_nascimento: string | null
  diagnostico: string | null
  contatos: string | null
  observacoes: string | null
}

// Verifica se já existe um paciente com nome/CPF do responsável/nome do responsável
// coincidentes antes de cadastrar. Retorna candidatos mascarados para o formulário
// confirmar com o profissional antes de criar um registro duplicado.
export async function verificarDuplicidadePaciente(
  input: Pick<CreatePacienteInput, "nome_completo" | "data_nascimento" | "nome_responsavel" | "cpf_responsavel" | "cpf_paciente">,
): Promise<{ candidatos: CandidatoDuplicataPaciente[] }> {
  const candidatos = await buscarPossiveisDuplicatasPaciente({
    nomeCompleto: input.nome_completo,
    dataNascimento: input.data_nascimento,
    nomeResponsavel: input.nome_responsavel,
    cpfResponsavel: input.cpf_responsavel,
    cpfPaciente: input.cpf_paciente,
  })
  return { candidatos }
}

export async function createPaciente(input: CreatePacienteInput) {
  const supabase = await createClient()
  const { data: userData } = await supabase.auth.getUser()
  if (!userData?.user) return genericError("Sessão expirada. Faça login novamente.")
  const cpfPaciente=input.cpf_paciente?.replace(/\D/g,"")||null
  const cpfResponsavel=input.cpf_responsavel?.replace(/\D/g,"")||null
  if(cpfPaciente&&cpfPaciente.length!==11)return genericError("O CPF do paciente deve conter 11 dígitos.")
  if(cpfResponsavel&&cpfResponsavel.length!==11)return genericError("O CPF do responsável deve conter 11 dígitos.")
  input={...input,cpf_paciente:cpfPaciente,cpf_responsavel:cpfResponsavel}

  const { candidatos } = await verificarDuplicidadePaciente(input)
  if (candidatos.length > 0) {
    return { duplicidade: candidatos }
  }

  const { data: pacienteId, error } = await supabase.rpc("criar_paciente_com_vinculo", {
    p_nome_completo: input.nome_completo,
    p_nome_responsavel: input.nome_responsavel,
    p_cpf_responsavel: input.cpf_responsavel,
    p_cpf_paciente: input.cpf_paciente,
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
    cpf_paciente: string | null
    data_nascimento: string | null
    diagnostico: string | null
    contatos: string | null
    observacoes: string | null
    status: "ativo" | "inativo"
  },
) {
  const supabase = await createClient()
  const cpfPaciente=input.cpf_paciente?.replace(/\D/g,"")||null
  const cpfResponsavel=input.cpf_responsavel?.replace(/\D/g,"")||null
  if(cpfPaciente&&cpfPaciente.length!==11)return genericError("O CPF do paciente deve conter 11 dígitos.")
  if(cpfResponsavel&&cpfResponsavel.length!==11)return genericError("O CPF do responsável deve conter 11 dígitos.")
  const { data: atualizado, error } = await supabase.from("pacientes").update({...input,cpf_paciente:cpfPaciente,cpf_responsavel:cpfResponsavel}).eq("id", id).select("id").maybeSingle()

  if (error) {
    reportServerError("updatePaciente", error)
    if(error.code==="23505")return genericError("Este CPF já está associado a outro paciente.")
    return genericError("Não foi possível atualizar o paciente.")
  }

  if(!atualizado)return genericError("Paciente não encontrado ou sem permissão para atualização.")
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

// ---------- Fundacao clinica ABA ----------

export async function criarPlanoClinico(input: { pacienteId: string; titulo: string; justificativa: string | null }) {
  const supabase = await createClient()
  const { data: usuario } = await supabase.auth.getUser()
  if (!usuario.user) return genericError("Sua sessão expirou. Entre novamente.")
  if (input.titulo.trim().length < 3) return genericError("Informe um título com pelo menos 3 caracteres.")
  const { error } = await supabase.from("planos_clinicos").insert({
    paciente_id: input.pacienteId,
    profissional_responsavel_id: usuario.user.id,
    titulo: input.titulo.trim(),
    justificativa: input.justificativa?.trim() || null,
  })
  if (error) {
    reportServerError("criarPlanoClinico", error)
    if (["42P01", "PGRST205"].includes(error.code ?? "")) return genericError("A fundação clínica ainda não foi instalada no banco.")
    if (error.code === "42501") return genericError("Você precisa estar vinculado ao paciente para criar o plano.")
    return genericError("Não foi possível criar o plano clínico.")
  }
  revalidatePath(`/registros/pacientes/${input.pacienteId}`)
  return { success: true }
}

export async function criarObjetivoClinico(input: { pacienteId: string; planoId: string; descricao: string; horizonte: "curto_prazo" | "longo_prazo" }) {
  if (input.descricao.trim().length < 3) return genericError("Descreva o objetivo clínico.")
  const supabase = await createClient()
  const { error } = await supabase.from("objetivos_clinicos").insert({
    plano_id: input.planoId, descricao: input.descricao.trim(), horizonte: input.horizonte,
  })
  if (error) {
    reportServerError("criarObjetivoClinico", error)
    if (error.code === "42501") return genericError("Somente o responsável pelo plano pode adicionar objetivos.")
    return genericError("Não foi possível adicionar o objetivo.")
  }
  revalidatePath(`/registros/pacientes/${input.pacienteId}`)
  return { success: true }
}

export async function criarAlvoClinico(input: {
  pacienteId: string; objetivoId: string; nome: string; categoria: string | null
  natureza: "aquisicao" | "reducao"; descricaoObservavel: string; respostaEsperada: string | null
  tipoMedicao: string; unidade: string
}) {
  const supabase = await createClient()
  const { error } = await supabase.rpc("criar_alvo_clinico_com_configuracao", {
    p_objetivo_id: input.objetivoId, p_nome: input.nome, p_categoria: input.categoria,
    p_natureza: input.natureza, p_descricao_observavel: input.descricaoObservavel,
    p_resposta_esperada: input.respostaEsperada, p_tipo_medicao: input.tipoMedicao,
    p_unidade: input.unidade, p_parametros: {},
  })
  if (error) {
    reportServerError("criarAlvoClinico", error)
    if (["42883", "PGRST202"].includes(error.code ?? "")) return genericError("A função de criação de alvos ainda não foi instalada no banco.")
    if (error.code === "42501") return genericError("Somente o responsável pelo plano pode criar alvos.")
    if (error.code === "22023") return genericError("Revise a definição e a configuração de medida do alvo.")
    return genericError("Não foi possível criar o alvo clínico.")
  }
  revalidatePath(`/registros/pacientes/${input.pacienteId}`)
  return { success: true }
}

export async function criarCriterioDominioAlvo(input: {
  pacienteId: string; alvoId: string; direcao: "aumentar" | "reduzir"; valorAlvo: number
  sessoesConsecutivas: number; oportunidadesMinimas: number | null; ambientesMinimos: number
  aplicadoresMinimos: number; diasManutencao: number | null
}) {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc("criar_criterio_dominio_alvo", {
    p_alvo_id: input.alvoId, p_direcao: input.direcao, p_valor_alvo: input.valorAlvo,
    p_sessoes_consecutivas: input.sessoesConsecutivas, p_oportunidades_minimas: input.oportunidadesMinimas,
    p_ambientes_minimos: input.ambientesMinimos, p_aplicadores_minimos: input.aplicadoresMinimos,
    p_dias_manutencao: input.diasManutencao, p_configuracao: {},
  })
  if (error) {
    reportServerError("criarCriterioDominioAlvo", error)
    if (["42883", "PGRST202"].includes(error.code ?? "")) return genericError("A função de critérios ainda não foi instalada no banco.")
    if (error.code === "42501") return genericError("Você não possui permissão para configurar este alvo.")
    return genericError("Revise os valores do critério de domínio.")
  }
  revalidatePath(`/registros/pacientes/${input.pacienteId}`)
  return { success: true, versao: Number(data) }
}

export async function alterarFaseAlvo(input: { pacienteId: string; alvoId: string; novaFase: string; motivo: string; confirmarCorrecao:boolean }) {
  const supabase = await createClient()
  const { error } = await supabase.rpc("corrigir_fase_alvo", {
    p_alvo_id: input.alvoId, p_nova_fase: input.novaFase, p_motivo: input.motivo,p_confirmar_correcao:input.confirmarCorrecao,
  })
  if (error) {
    reportServerError("alterarFaseAlvo", error)
    if (error.code === "42501") return genericError("Você não possui permissão para alterar este alvo.")
    if (["42883", "PGRST202"].includes(error.code ?? "")) return genericError("A função de correção de fase ainda não foi instalada no banco.")
    if(error.message.includes("invalid_phase_correction"))return genericError("Confirme a correção e informe um motivo com pelo menos 20 caracteres.")
    return genericError("Não foi possível registrar a correção de fase.")
  }
  revalidatePath(`/registros/pacientes/${input.pacienteId}`)
  return { success: true }
}

export async function criarProtocoloIntervencaoAlvo(input: {
  pacienteId: string; alvoId: string; estrategiaEnsino: string; hierarquiaAjuda: string
  procedimentoEsvanecimento: string | null; reforcadores: string; esquemaReforcamento: string
  correcaoErro: string; instrucoesAplicacao: string | null
}) {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc("criar_protocolo_intervencao_alvo", {
    p_alvo_id: input.alvoId, p_estrategia_ensino: input.estrategiaEnsino,
    p_hierarquia_ajuda: input.hierarquiaAjuda, p_procedimento_esvanecimento: input.procedimentoEsvanecimento,
    p_reforcadores: input.reforcadores, p_esquema_reforcamento: input.esquemaReforcamento,
    p_correcao_erro: input.correcaoErro, p_instrucoes_aplicacao: input.instrucoesAplicacao,
  })
  if (error) {
    reportServerError("criarProtocoloIntervencaoAlvo", error)
    if (error.code === "42501") return genericError("Você não possui permissão para configurar este alvo.")
    if (["42883", "PGRST202"].includes(error.code ?? "")) return genericError("A estrutura de protocolos ainda não foi instalada no banco.")
    return genericError("Não foi possível salvar o protocolo de intervenção.")
  }
  revalidatePath(`/registros/pacientes/${input.pacienteId}`)
  return { success: true, versao: Number(data) }
}

export async function criarPlanoApoioComportamental(input: {
  pacienteId: string; alvoId: string; funcaoAssumida: string; justificativaFuncional: string
  estrategiasAntecedentes: string; comportamentoSubstitutivo: string; procedimentoEnsinoSubstitutivo: string
  estrategiasConsequentes: string; planoSeguranca: string | null; criteriosRevisao: string
}) {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc("criar_plano_apoio_comportamental", {
    p_alvo_id: input.alvoId, p_funcao_assumida: input.funcaoAssumida, p_justificativa_funcional: input.justificativaFuncional,
    p_estrategias_antecedentes: input.estrategiasAntecedentes, p_comportamento_substitutivo: input.comportamentoSubstitutivo,
    p_procedimento_ensino_substitutivo: input.procedimentoEnsinoSubstitutivo, p_estrategias_consequentes: input.estrategiasConsequentes,
    p_plano_seguranca: input.planoSeguranca, p_criterios_revisao: input.criteriosRevisao,
  })
  if (error) {
    reportServerError("criarPlanoApoioComportamental", error)
    if (error.code === "42501") return genericError("Você não possui permissão para configurar este alvo de redução.")
    if (["42883", "PGRST202"].includes(error.code ?? "")) return genericError("A estrutura de apoio comportamental ainda não foi instalada no banco.")
    return genericError("Não foi possível salvar o plano de apoio comportamental.")
  }
  revalidatePath(`/registros/pacientes/${input.pacienteId}`)
  return { success: true, versao: Number(data) }
}

export async function criarRevisaoClinicaAlvo(input: { pacienteId: string; alvoId: string; periodoInicio: string; periodoFim: string; decisao: string; justificativa: string; proximaRevisaoEm: string | null; confirmarLimitacoes: boolean }) {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc("criar_revisao_clinica_alvo_v4", { p_alvo_id: input.alvoId, p_periodo_inicio: input.periodoInicio, p_periodo_fim: input.periodoFim, p_decisao: input.decisao, p_justificativa: input.justificativa, p_proxima_revisao_em: input.proximaRevisaoEm, p_confirmar_limitacoes: input.confirmarLimitacoes })
  if (error) {
    reportServerError("criarRevisaoClinicaAlvo", error)
    if (error.code === "42501") return genericError("Você não possui permissão para revisar este alvo.")
    if (["42883", "PGRST202"].includes(error.code ?? "")) return genericError("A estrutura de revisões clínicas ainda não foi instalada no banco.")
    return genericError("Não foi possível registrar a revisão clínica.")
  }
  revalidatePath(`/registros/pacientes/${input.pacienteId}`)
  return { success: true, revisaoId: data as string }
}

export async function aplicarDecisaoFase(input:{pacienteId:string;revisaoId:string;novaFase:string}){
  const supabase=await createClient();const{error}=await supabase.rpc("aplicar_decisao_fase",{p_revisao_id:input.revisaoId,p_nova_fase:input.novaFase})
  if(error){reportServerError("aplicarDecisaoFase",error);if(error.code==="42501")return genericError("Você não possui permissão para aplicar esta decisão.");if(["42883","PGRST202"].includes(error.code??""))return genericError("A estrutura de aplicação da decisão ainda não foi instalada no banco.");if(error.message.includes("invalid_review_transition"))return genericError("Esta revisão já foi aplicada ou não corresponde à fase atual do alvo.");return genericError("Não foi possível aplicar a mudança de fase.")}
  revalidatePath(`/registros/pacientes/${input.pacienteId}`);return{success:true}
}

export async function registrarValidadeSocial(input:{pacienteId:string;alvoId:string|null;respondenteTipo:string;objetivoRelevante:boolean;aceitabilidade:number;viabilidade:number;beneficioPercebido:number;assentimentoObservado:string;relato:string;adaptacoesNecessarias:string|null;registradoEm:string}){
  const supabase=await createClient();const {data,error}=await supabase.rpc("registrar_validade_social",{p_paciente_id:input.pacienteId,p_alvo_id:input.alvoId,p_respondente_tipo:input.respondenteTipo,p_objetivo_relevante:input.objetivoRelevante,p_aceitabilidade:input.aceitabilidade,p_viabilidade:input.viabilidade,p_beneficio_percebido:input.beneficioPercebido,p_assentimento_observado:input.assentimentoObservado,p_relato:input.relato,p_adaptacoes_necessarias:input.adaptacoesNecessarias,p_registrado_em:input.registradoEm})
  if(error){reportServerError("registrarValidadeSocial",error);if(error.code==="42501")return genericError("Você não possui permissão para este paciente ou alvo.");if(["42883","PGRST202"].includes(error.code??""))return genericError("A estrutura de validade social ainda não foi instalada no banco.");return genericError("Não foi possível registrar a avaliação de validade social.")}
  revalidatePath(`/registros/pacientes/${input.pacienteId}`);return{success:true,id:data as string}
}

export async function registrarCapacitacaoAplicador(input:{pacienteId:string;alvoId:string|null;participanteTipo:string;habilidadesTreinadas:string;instrucaoRealizada:boolean;modelacaoRealizada:boolean;ensaioRealizado:boolean;feedbackRealizado:boolean;competenciaPercentual:number;criterioCompetencia:string;observacoes:string|null;acompanhamentoEm:string|null;realizadoEm:string}){const supabase=await createClient();const{data,error}=await supabase.rpc("registrar_capacitacao_aplicador",{p_paciente_id:input.pacienteId,p_alvo_id:input.alvoId,p_participante_tipo:input.participanteTipo,p_habilidades_treinadas:input.habilidadesTreinadas,p_instrucao_realizada:input.instrucaoRealizada,p_modelacao_realizada:input.modelacaoRealizada,p_ensaio_realizado:input.ensaioRealizado,p_feedback_realizado:input.feedbackRealizado,p_competencia_percentual:input.competenciaPercentual,p_criterio_competencia:input.criterioCompetencia,p_observacoes:input.observacoes,p_acompanhamento_em:input.acompanhamentoEm,p_realizado_em:input.realizadoEm});if(error){reportServerError("registrarCapacitacaoAplicador",error);if(error.code==="42501")return genericError("Você não possui permissão para este paciente ou alvo.");if(["42883","PGRST202"].includes(error.code??""))return genericError("A estrutura de capacitação ainda não foi instalada no banco.");return genericError("Não foi possível registrar a capacitação.")}revalidatePath(`/registros/pacientes/${input.pacienteId}`);return{success:true,id:data as string}}

export async function solicitarConcordancia(input:{pacienteId:string;registroMedicaoId:string;observadorId:string}){const supabase=await createClient();const{data,error}=await supabase.rpc("solicitar_concordancia",{p_registro_medicao_id:input.registroMedicaoId,p_observador_id:input.observadorId});if(error){reportServerError("solicitarConcordancia",error);if(error.code==="42501")return genericError("O observador precisa estar ativo e vinculado ao paciente.");if(error.code==="23505")return genericError("Já existe uma solicitação para este observador e medição.");if(["42883","PGRST202"].includes(error.code??""))return genericError("A estrutura de concordância ainda não foi instalada no banco.");return genericError("Não foi possível solicitar a concordância.")}revalidatePath(`/registros/pacientes/${input.pacienteId}`);return{success:true,id:data as string}}
export async function responderConcordancia(input:{pacienteId:string;solicitacaoId:string;valor:number}){const supabase=await createClient();const{data,error}=await supabase.rpc("responder_concordancia",{p_solicitacao_id:input.solicitacaoId,p_valor_observador:input.valor});if(error){reportServerError("responderConcordancia",error);if(error.code==="42501")return genericError("A solicitação não está disponível para resposta.");return genericError("Não foi possível registrar a medição independente.")}revalidatePath(`/registros/pacientes/${input.pacienteId}`);return{success:true,concordancia:Number(data)}}

export async function registrarSinteseAvaliacao(input:{
  pacienteId:string;status:"rascunho"|"concluida";periodoInicio:string;periodoFim:string
  fontesInformacao:string;potencialidades:string;necessidadesIdentificadas:string
  prioridadesRecomendadas:string;recomendacoesIniciais:string|null;conclusao:string|null;sessoesConsideradas:string[]
}){
  const supabase=await createClient()
  const{data,error}=await supabase.rpc("registrar_sintese_avaliacao_inicial",{
    p_paciente_id:input.pacienteId,p_status:input.status,p_periodo_inicio:input.periodoInicio,p_periodo_fim:input.periodoFim,
    p_fontes_informacao:input.fontesInformacao,p_potencialidades:input.potencialidades,p_necessidades_identificadas:input.necessidadesIdentificadas,
    p_prioridades_recomendadas:input.prioridadesRecomendadas,p_recomendacoes_iniciais:input.recomendacoesIniciais,p_conclusao:input.conclusao,
    p_sessoes_consideradas:input.sessoesConsideradas,
  })
  if(error){
    reportServerError("registrarSinteseAvaliacao",error)
    if(["42883","PGRST202"].includes(error.code??""))return genericError("A estrutura de síntese de avaliação ainda não foi instalada no banco.")
    if(error.code==="42501")return genericError("Você não possui autorização para usar este paciente ou uma das sessões selecionadas.")
    if(error.code==="22023")return genericError("Revise o período e os campos obrigatórios da síntese.")
    return genericError("Não foi possível registrar a síntese da avaliação.")
  }
  revalidatePath(`/registros/pacientes/${input.pacienteId}/avaliacao`)
  revalidatePath(`/registros/pacientes/${input.pacienteId}/planejamento`)
  return{success:true,id:data as string}
}

export async function registrarSessaoClinica(input: {
  pacienteId: string; data: string; contexto: string | null; observacoesPrivadas: string | null
  ambienteTipo: string; aplicadorTipo: string; finalidade: string
  registros: { alvo_id: string; dados: Record<string, unknown>; observacao: string | null }[]
  integridade: { alvo_id: string; itens: { hierarquia_ajuda: boolean; reforcamento: boolean; correcao_erro: boolean }; desvios: string | null }[]
  observacoesAbc: { alvo_id: string; antecedente: string; comportamento_observado: string; consequencia: string; funcao_hipotese: string | null; intensidade: number | null; duracao_segundos: number | null }[]
  tentativas: { alvo_id:string; itens:{ ordem:number;resultado:string;nivel_ajuda:string;latencia_segundos:number|null;observacao:string|null }[] }[]
}) {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc("registrar_sessao_clinica_v6", {
    p_paciente_id: input.pacienteId, p_data: input.data, p_contexto: input.contexto,
    p_observacoes_privadas: input.observacoesPrivadas, p_registros: input.registros,
    p_ambiente_tipo: input.ambienteTipo, p_aplicador_tipo: input.aplicadorTipo,
    p_integridade: input.integridade,
    p_observacoes_abc: input.observacoesAbc,
    p_finalidade: input.finalidade,
    p_tentativas: input.tentativas,
  })
  if (error) {
    reportServerError("registrarSessaoClinica", error)
    if (["42883", "PGRST202"].includes(error.code ?? "")) return genericError("A estrutura de tentativas individuais ainda não foi instalada no banco.")
    if (error.message.includes("trials_summary_mismatch")) return genericError("O resumo não corresponde às tentativas detalhadas.")
    if (error.message.includes("invalid_trials")) return genericError("Revise os resultados e níveis de ajuda das tentativas.")
    if (error.message.includes("session_requires_target")) return genericError("Esta finalidade exige pelo menos um alvo clínico.")
    if (error.message.includes("session_purpose")) return genericError("Selecione uma finalidade de sessão válida.")
    if (error.message.includes("invalid_session_target")) return genericError("Um dos alvos não está disponível para coleta nesta fase.")
    if (error.message.includes("invalid_measurement_data")) return genericError("Revise os valores informados nas medições.")
    if (error.message.includes("duplicate_target_in_session")) return genericError("O mesmo alvo não pode aparecer duas vezes na sessão.")
    if (error.message.includes("session_context")) return genericError("Selecione um ambiente e um tipo de aplicador válidos.")
    if (error.message.includes("procedural_integrity")) return genericError("Confirme a aplicação do protocolo e descreva eventuais desvios.")
    if (error.message.includes("abc_")) return genericError("Revise os campos do registro ABC.")
    if (error.code === "42501") return genericError("Você não possui autorização para registrar esta sessão.")
    return genericError("Não foi possível registrar a sessão clínica.")
  }
  revalidatePath(`/registros/pacientes/${input.pacienteId}`)
  revalidatePath("/registros")
  return { success: true, sessaoId: data as string }
}

export async function cancelarSessaoClinica(input:{sessaoId:string;pacienteId:string;motivo:string}){
  const supabase=await createClient();const{error}=await supabase.rpc("cancelar_sessao_clinica",{p_sessao_id:input.sessaoId,p_motivo:input.motivo})
  if(error){reportServerError("cancelarSessaoClinica",error);if(["42883","PGRST202"].includes(error.code??""))return genericError("A estrutura de cancelamento ainda não foi instalada no banco.");if(error.code==="42501")return genericError("Somente o autor vinculado pode cancelar esta sessão.");if(error.code==="22023")return genericError("Informe uma justificativa válida para o cancelamento.");return genericError("Não foi possível cancelar a sessão.")}
  revalidatePath(`/registros/pacientes/${input.pacienteId}/sessoes`);revalidatePath(`/registros/pacientes/${input.pacienteId}/analise`);revalidatePath("/registros/sessoes");return{success:true}
}
export async function restaurarSessaoClinica(input:{sessaoId:string;pacienteId:string;motivo:string}){
  const supabase=await createClient();const{error}=await supabase.rpc("restaurar_sessao_clinica",{p_sessao_id:input.sessaoId,p_motivo:input.motivo})
  if(error){reportServerError("restaurarSessaoClinica",error);if(["42883","PGRST202"].includes(error.code??""))return genericError("A estrutura de restauração ainda não foi instalada no banco.");if(error.code==="42501")return genericError("Somente o autor vinculado pode restaurar esta sessão.");if(error.code==="22023")return genericError("Informe uma justificativa válida para a restauração.");return genericError("Não foi possível restaurar a sessão.")}
  revalidatePath(`/registros/pacientes/${input.pacienteId}/sessoes`);revalidatePath(`/registros/pacientes/${input.pacienteId}/analise`);revalidatePath("/registros/sessoes");return{success:true}
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

export async function excluirOuDesativarHabilidade(id: string) {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc("excluir_ou_desativar_habilidade", { p_habilidade_id: id })
  if (error) return genericError("Apenas administradores podem excluir ou desativar habilidades globais.")
  revalidatePath("/registros/habilidades")
  return { success: true, resultado: data as "excluida" | "desativada" }
}

// ---------- Usuários (somente admin) ----------
// Cria a conta via Admin API e, em seguida, o profile explicitamente. Se o
// profile falhar, a conta recém-criada é removida para preservar atomicidade.

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
  const { data: usuarioCriado, error } = await admin.auth.admin.createUser({
    email: input.email,
    password: input.senhaProvisoria,
    email_confirm: true,
  })

  if (error) {
    reportServerError("createUsuario", error)
    if (error.code === "email_exists" || error.message.toLowerCase().includes("already been registered")) {
      return genericError("Já existe um usuário cadastrado com este e-mail.")
    }
    if (error.code === "weak_password") return genericError("A senha provisória não atende à política de segurança configurada no Supabase.")
    return genericError(`O Supabase Auth recusou a criação (código ${error.code ?? "desconhecido"}, HTTP ${error.status ?? "—"}).`)
  }

  if (!usuarioCriado.user) return genericError("O Supabase não retornou a conta criada.")
  const { error: profileError } = await admin.from("profiles").upsert({
    id: usuarioCriado.user.id,
    nome: input.nome.trim(),
    email: input.email.trim().toLowerCase(),
    papel: input.papel,
    status: "ativo",
    admin_principal: false,
  }, { onConflict: "id" })

  if (profileError) {
    reportServerError("createUsuario.profile", profileError)
    const { error: rollbackError } = await admin.auth.admin.deleteUser(usuarioCriado.user.id)
    if (rollbackError) reportServerError("createUsuario.rollback", rollbackError)
    return genericError(`A conta foi revertida porque o perfil não pôde ser criado (código ${profileError.code ?? "desconhecido"}).`)
  }

  revalidatePath("/registros/usuarios")
  redirect("/registros/usuarios")
}

export async function redefinirSenhaUsuario(input: { usuarioId: string; senhaProvisoria: string }) {
  if (input.senhaProvisoria.length < 8) return genericError("A senha provisória deve ter pelo menos 8 caracteres.")

  const supabase = await createClient()
  const { data: userData } = await supabase.auth.getUser()
  if (!userData.user) return genericError("Sessão expirada. Faça login novamente.")
  if (userData.user.id === input.usuarioId) return genericError("Altere sua própria senha pela página Minha conta.")

  const { data: administrador } = await supabase.from("profiles").select("papel,status,admin_principal").eq("id", userData.user.id).maybeSingle()
  if (!administrador?.admin_principal || administrador.papel !== "admin" || administrador.status !== "ativo") {
    return genericError("Somente o administrador principal pode redefinir senhas de outros usuários.")
  }

  const { data: alvo } = await supabase.from("profiles").select("email").eq("id", input.usuarioId).maybeSingle()
  if (!alvo) return genericError("Usuário não encontrado.")
  if (alvo.email.toLowerCase() === "demo@registrosaba.local") return genericError("A senha do cenário de demonstração não pode ser alterada por esta tela.")

  const admin = createAdminClient()
  if (!admin) return genericError("A chave administrativa do Supabase não está configurada no servidor.")
  const { error } = await admin.auth.admin.updateUserById(input.usuarioId, { password: input.senhaProvisoria })
  if (error) {
    reportServerError("redefinirSenhaUsuario", error)
    if (error.code === "weak_password") return genericError("Escolha uma senha provisória mais forte.")
    if (error.status === 429) return genericError("Muitas tentativas. Aguarde alguns minutos e tente novamente.")
    return genericError("Não foi possível redefinir a senha do usuário.")
  }

  const { error: auditError } = await admin.from("audit_logs").insert({
    user_id: userData.user.id,
    action: "PASSWORD_RESET_BY_MAIN_ADMIN",
    entity_type: "profiles",
    entity_id: input.usuarioId,
    metadata: { password_exposed: false },
  })
  if (auditError) reportServerError("redefinirSenhaUsuario.audit", auditError)
  return { success: true }
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

