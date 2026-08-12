// Camada de leitura de dados do sistema de registros — usada em Server Components.
// Todas as consultas passam pelo cliente Supabase autenticado do usuário atual,
// então o RLS aplica automaticamente as regras de visibilidade (admin vê tudo,
// profissional só vê os dados autorizados pelas políticas e vínculos explícitos.
import { createClient } from "@/lib/supabase/server"
import type {
  CandidatoDuplicataPaciente,
  Habilidade,
  NivelAvaliacao,
  Paciente,
  Profile,
  ProfissionalResumo,
  Agendamento,OpcoesAgenda,
  SolicitacaoAcessoComRelacoes,
} from "./types"
import type { CapacitacaoAplicador, PlanoClinicoCompleto, RegistroValidadeSocial, SessaoClinicaComRegistros, SinteseAvaliacaoInicial, SolicitacaoConcordancia } from "./clinico/modelo"
import type { AcessoResponsavel } from "./responsavel/types"
import { reportServerError } from "@/lib/server-log"
import { assinarFoto } from "./fotos"

export async function getProfile(): Promise<Profile | null> {
  const supabase = await createClient()
  const { data: userData } = await supabase.auth.getUser()
  if (!userData?.user) return null

  const { data, error } = await supabase.from("profiles").select("*").eq("id", userData.user.id).maybeSingle()

  if (error) {
    reportServerError("getProfile", error)
    return null
  }
  if(!data)return null
  return {...data,foto_url:await assinarFoto(supabase,data.foto_path)} as Profile
}

export async function getProfiles(): Promise<Profile[]> {
  const supabase = await createClient()
  const { data, error } = await supabase.from("profiles").select("*").neq("email", "demo@registrosaba.local").order("nome")
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
  if(!data)return null
  return {...data,foto_url:await assinarFoto(supabase,data.foto_path)} as Paciente
}

export async function getAgendamentos(inicio:string,fim:string):Promise<Agendamento[]>{const supabase=await createClient(),{data,error}=await supabase.rpc("listar_agendamentos",{p_inicio:inicio,p_fim:fim});if(error){reportServerError("getAgendamentos",error);return[]}return(data??[])as Agendamento[]}
export async function getOpcoesAgenda():Promise<OpcoesAgenda|null>{const supabase=await createClient(),{data,error}=await supabase.rpc("listar_opcoes_agendamento");if(error){reportServerError("getOpcoesAgenda",error);return null}return data as OpcoesAgenda}

export async function getProfissionaisVinculadosPaciente(pacienteId: string): Promise<ProfissionalResumo[]> {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc("profissionais_vinculados_paciente", { p_paciente_id: pacienteId })
  if (error) { reportServerError("getProfissionaisVinculadosPaciente", error); return [] }
  return Promise.all(((data??[])as ProfissionalResumo[]).map(async p=>({...p,foto_url:await assinarFoto(supabase,p.foto_path)})))
}

export async function getAcessosResponsavel(pacienteId: string): Promise<AcessoResponsavel[]> {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc("listar_acessos_responsavel", { p_paciente_id: pacienteId })
  if (error) { reportServerError("getAcessosResponsavel", error); return [] }
  return (data ?? []) as AcessoResponsavel[]
}

export async function getPlanosClinicosPaciente(pacienteId: string): Promise<PlanoClinicoCompleto[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("planos_clinicos")
    .select("*, objetivos:objetivos_clinicos(*, alvos:alvos_clinicos(*, definicoes:definicoes_operacionais_alvo(*), medicoes:configuracoes_medicao_alvo(*), criterios:criterios_dominio_alvo(*), historico_fases:historico_fases_alvo(*), protocolos:protocolos_intervencao_alvo(*), planos_apoio:planos_apoio_comportamental_alvo(*), revisoes:revisoes_clinicas_alvo(*)))")
    .eq("paciente_id", pacienteId)
    .order("created_at", { ascending: false })
  if (error) { reportServerError("getPlanosClinicosPaciente", error); return [] }
  return (data ?? []) as unknown as PlanoClinicoCompleto[]
}

export async function getSessoesClinicasPaciente(pacienteId: string): Promise<SessaoClinicaComRegistros[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("sessoes_clinicas")
    .select("*, registros:registros_medicao(*, alvo:alvos_clinicos(id,nome), integridade:integridade_procedimental(*), tentativas:tentativas_individuais(*)), observacoes_abc(*)")
    .eq("paciente_id", pacienteId)
    .is("deleted_at", null)
    .order("data", { ascending: false })
  if (error) { reportServerError("getSessoesClinicasPaciente", error); return [] }
  return (data ?? []) as unknown as SessaoClinicaComRegistros[]
}

export async function getSessoesCanceladasPaciente(pacienteId:string):Promise<SessaoClinicaComRegistros[]>{
  const supabase=await createClient();const{data,error}=await supabase.from("sessoes_clinicas").select("*, registros:registros_medicao(*, alvo:alvos_clinicos(id,nome), integridade:integridade_procedimental(*), tentativas:tentativas_individuais(*)), observacoes_abc(*)").eq("paciente_id",pacienteId).eq("status","cancelada").not("deleted_at","is",null).order("cancelada_em",{ascending:false})
  if(error){reportServerError("getSessoesCanceladasPaciente",error);return[]}
  return(data??[])as unknown as SessaoClinicaComRegistros[]
}

export async function getSintesesAvaliacaoPaciente(pacienteId:string):Promise<SinteseAvaliacaoInicial[]>{
  const supabase=await createClient();const{data:userData}=await supabase.auth.getUser();if(!userData.user)return[]
  const{data,error}=await supabase.from("sinteses_avaliacao_inicial").select("*").eq("paciente_id",pacienteId).eq("profissional_id",userData.user.id).order("versao",{ascending:false})
  if(error){reportServerError("getSintesesAvaliacaoPaciente",error);return[]}
  return(data??[])as SinteseAvaliacaoInicial[]
}

export type SessaoClinicaComPaciente = SessaoClinicaComRegistros & {
  paciente: { id: string; nome_completo: string }
}

export async function getSessoesClinicasProfissional(): Promise<SessaoClinicaComPaciente[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("sessoes_clinicas")
    .select("*, paciente:pacientes(id,nome_completo), registros:registros_medicao(*, alvo:alvos_clinicos(id,nome), integridade:integridade_procedimental(*), tentativas:tentativas_individuais(*)), observacoes_abc(*)")
    .is("deleted_at", null)
    .order("data", { ascending: false })
  if (error) { reportServerError("getSessoesClinicasProfissional", error); return [] }
  return (data ?? []) as unknown as SessaoClinicaComPaciente[]
}

export interface CenarioDemonstracao {
  profissional: { nome: string; email: string }
  paciente: { id: string; nome: string; data_nascimento: string; diagnostico: string | null }
  planos: Array<{
    id: string; titulo: string; justificativa: string | null; status: string; iniciado_em: string; revisar_em: string | null
    objetivos: Array<{
      id: string; descricao: string; horizonte: string
      alvos: Array<{
        id: string; nome: string; categoria: string | null; natureza: string; fase: string; definicao: string
        medicao: { tipo: string; unidade: string } | null
        criterio: { direcao: string; valor_alvo: number; sessoes_consecutivas: number; ambientes_minimos: number; aplicadores_minimos: number } | null
        protocolo: { estrategia: string; hierarquia_ajuda: string; esvanecimento: string | null; reforcadores: string; correcao_erro: string } | null
      }>
    }>
  }>
  sessoes: Array<{
    id: string; data: string; contexto: string | null; ambiente_tipo: string | null; aplicador_tipo: string | null
    registros: Array<{ id: string; alvo_id: string; alvo_nome: string; tipo_medicao: string; dados: Record<string, unknown>; integridade_percentual: number | null;tentativas:Array<{id:string;ordem:number;resultado:"correta"|"incorreta"|"sem_resposta";nivel_ajuda:"independente"|"gestual"|"verbal"|"modelo"|"fisica_parcial"|"fisica_total";latencia_segundos:number|null}> }>
  }>
  validade_social: Array<{ respondente_tipo: string; objetivo_relevante: boolean; aceitabilidade: number; viabilidade: number; beneficio_percebido: number; assentimento_observado: string; relato: string; registrado_em: string }>
}

export async function getCenarioDemonstracao(): Promise<CenarioDemonstracao | null> {
  const supabase = await createClient()
  const versao2 = await supabase.rpc("obter_cenario_demonstracao_v2")
  if (!versao2.error) return versao2.data as CenarioDemonstracao | null
  reportServerError("getCenarioDemonstracao.v2", versao2.error)
  if (!["PGRST202","42883"].includes(versao2.error.code??"")) return null
  const base = await supabase.rpc("obter_cenario_demonstracao")
  if (base.error) { reportServerError("getCenarioDemonstracao.base", base.error); return null }
  return base.data as CenarioDemonstracao | null
}

export async function getValidadeSocialPaciente(pacienteId: string): Promise<RegistroValidadeSocial[]> {
  const supabase=await createClient(); const {data,error}=await supabase.from("registros_validade_social").select("*").eq("paciente_id",pacienteId).order("registrado_em",{ascending:false})
  if(error){reportServerError("getValidadeSocialPaciente",error);return []}
  return (data??[]) as RegistroValidadeSocial[]
}

export async function getCapacitacoesPaciente(pacienteId:string):Promise<CapacitacaoAplicador[]>{const supabase=await createClient();const{data,error}=await supabase.from("capacitacoes_aplicadores").select("*").eq("paciente_id",pacienteId).order("realizado_em",{ascending:false});if(error){reportServerError("getCapacitacoesPaciente",error);return[]}return(data??[])as CapacitacaoAplicador[]}

export async function getConcordanciasPaciente(pacienteId:string):Promise<SolicitacaoConcordancia[]>{const supabase=await createClient();const{data,error}=await supabase.from("solicitacoes_concordancia").select("*, alvo:alvos_clinicos(id,nome), solicitante:profiles!solicitante_id(id,nome), observador:profiles!observador_id(id,nome)").eq("paciente_id",pacienteId).order("solicitado_em",{ascending:false});if(error){reportServerError("getConcordanciasPaciente",error);return[]}return(data??[])as unknown as SolicitacaoConcordancia[]}

// ---------- Duplicidade de pacientes ----------
// Roda via RPC de uma função SECURITY DEFINER: compara contra TODOS os pacientes
// (não só os do usuário atual), mas retorna apenas dados mascarados.
export async function buscarPossiveisDuplicatasPaciente(input: {
  nomeCompleto: string
  dataNascimento: string | null
  nomeResponsavel: string | null
  cpfResponsavel: string | null
  cpfPaciente: string | null
}): Promise<CandidatoDuplicataPaciente[]> {
  if (!input.dataNascimento) return []

  const supabase = await createClient()
  const { data, error } = await supabase.rpc("buscar_possiveis_duplicatas_paciente", {
    p_nome_completo: input.nomeCompleto,
    p_data_nascimento: input.dataNascimento,
    p_nome_responsavel: input.nomeResponsavel,
    p_cpf_responsavel: input.cpfResponsavel,
    p_cpf_paciente: input.cpfPaciente,
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
