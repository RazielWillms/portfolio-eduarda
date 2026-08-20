// Camada de leitura de dados do sistema de registros — usada em Server Components.
// Todas as consultas passam pelo cliente Supabase autenticado do usuário atual,
// então o RLS aplica automaticamente as regras de visibilidade (admin vê tudo,
// profissional só vê os dados autorizados pelas políticas e vínculos explícitos.
import { createClient } from "@/lib/supabase/server"
import { cache } from "react"
import type {
  CandidatoDuplicataPaciente,
  Habilidade,
  NivelAvaliacao,
  Paciente,
  Profile,
  ProfissionalResumo,
  Agendamento,OpcoesAgenda,DisponibilidadeProfissional,OpcoesFrequencia,RelatorioFrequencia,SugestaoAgendamentoFrequencia,TipoOcorrenciaFrequencia,
  SolicitacaoAcessoComRelacoes,
} from "./types"
import type { CapacitacaoAplicador, PlanoClinicoCompleto, RegistroValidadeSocial, SessaoClinicaComRegistros, SinteseAvaliacaoInicial, SolicitacaoConcordancia } from "./clinico/modelo"
import type { AcessoResponsavel } from "./responsavel/types"
import { reportServerError } from "@/lib/server-log"
import { assinarFoto } from "./fotos"
import { permissoesLegadas, type Permissao } from "./permissoes"
import type { ConfigPapeis } from "@/components/registros/papeis-acesso-form"
import { measureServerOperation } from "@/lib/server-performance"

export const getProfile=cache(async ():Promise<Profile|null>=>measureServerOperation("profile.current",async()=>{
  const supabase = await createClient()
  const { data: userData } = await supabase.auth.getUser()
  if (!userData?.user) return null

  const { data, error } = await supabase.from("profiles").select("*").eq("id", userData.user.id).maybeSingle()

  if (error) {
    reportServerError("getProfile", error)
    return null
  }
  if(!data)return null
  const {data: permissoes, error: permissoesError}=await supabase.rpc("minhas_permissoes")
  const efetivas = permissoesError
    ? permissoesLegadas(data.papel,data.admin_principal)
    : ((permissoes??[]).map((item:{chave:string})=>item.chave) as Permissao[])
  return {...data,permissoes:efetivas,foto_url:await assinarFoto(supabase,data.foto_path)} as Profile
}))

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

export async function getUsuariosAdminPaginados(input:{busca:string;profissaoId?:string;papel:string;status:string;limite:number;offset:number}){
  const supabase=await createClient(),{data,error}=await supabase.rpc("listar_usuarios_admin",{p_busca:input.busca,p_profissao_id:input.profissaoId||null,p_papel:input.papel,p_status:input.status,p_limite:input.limite,p_offset:input.offset})
  if(error){reportServerError("getUsuariosAdminPaginados",error);return null}
  return data as import("./types").UsuarioResumo[]
}

export async function getPainelProfissionalAgregado(){return measureServerOperation("dashboard.profissional",async()=>{const supabase=await createClient(),{data,error}=await supabase.rpc("obter_painel_profissional_agregado");if(error){reportServerError("getPainelProfissionalAgregado",error);return null}return data as import("./types").PainelProfissionalAgregado})}
export async function getPainelCoordenacaoAgregado(){return measureServerOperation("dashboard.coordenacao",async()=>{const supabase=await createClient(),{data,error}=await supabase.rpc("obter_painel_coordenacao_agregado");if(error){reportServerError("getPainelCoordenacaoAgregado",error);return null}return data as import("./types").PainelCoordenacaoAgregado})}
export async function getSessoesProfissionalPaginadas(input:{busca:string;inicio?:string;fim?:string;limite:number;offset:number}){return measureServerOperation("sessoes.listar_resumos",async()=>{const supabase=await createClient(),{data,error}=await supabase.rpc("listar_sessoes_profissional_paginadas",{p_busca:input.busca,p_inicio:input.inicio||null,p_fim:input.fim||null,p_limite:input.limite,p_offset:input.offset});if(error){reportServerError("getSessoesProfissionalPaginadas",error);return null}return(data??[])as import("./types").SessaoProfissionalResumo[]})}
export async function getSessoesPacientePaginadas(input:{pacienteId:string;canceladas:boolean;limite:number;offset:number}){return measureServerOperation(input.canceladas?"sessoes.paciente_canceladas":"sessoes.paciente_ativas",async()=>{const supabase=await createClient(),{data,error}=await supabase.rpc("listar_sessoes_paciente_paginadas",{p_paciente_id:input.pacienteId,p_canceladas:input.canceladas,p_limite:input.limite,p_offset:input.offset});if(error){reportServerError("getSessoesPacientePaginadas",error);return null}return(data??[])as import("./types").SessaoPacienteResumo[]})}
export async function getSessaoClinicaDetalhe(pacienteId:string,sessaoId:string){return measureServerOperation("sessoes.carregar_detalhe",async()=>{const supabase=await createClient(),{data,error}=await supabase.from("sessoes_clinicas").select("*, registros:registros_medicao(*, alvo:alvos_clinicos(id,nome), integridade:integridade_procedimental(*), tentativas:tentativas_individuais(*)), observacoes_abc(*)").eq("id",sessaoId).eq("paciente_id",pacienteId).maybeSingle();if(error){reportServerError("getSessaoClinicaDetalhe",error);return null}return data as unknown as SessaoClinicaComRegistros|null})}
export async function getResumoClinicoPaciente(pacienteId:string){return measureServerOperation("paciente.resumo_clinico",async()=>{const supabase=await createClient(),{data,error}=await supabase.rpc("obter_resumo_clinico_paciente",{p_paciente_id:pacienteId});if(error){reportServerError("getResumoClinicoPaciente",error);return null}return data as import("./types").ResumoClinicoPaciente})}
export async function getSessoesClinicasPacienteDesde(pacienteId:string,inicio?:string):Promise<SessaoClinicaComRegistros[]>{return measureServerOperation("analise.sessoes_periodo",async()=>{const supabase=await createClient();let consulta=supabase.from("sessoes_clinicas").select("*, registros:registros_medicao(*, alvo:alvos_clinicos(id,nome), integridade:integridade_procedimental(*), tentativas:tentativas_individuais(*)), observacoes_abc(*)").eq("paciente_id",pacienteId).is("deleted_at",null).order("data",{ascending:false});if(inicio)consulta=consulta.gte("data",inicio);const{data,error}=await consulta;if(error){reportServerError("getSessoesClinicasPacienteDesde",error);return[]}return(data??[])as unknown as SessaoClinicaComRegistros[]})}
export async function getObservacoesAbcPaciente(pacienteId:string){return measureServerOperation("intervencao.observacoes_abc",async()=>{const supabase=await createClient(),{data,error}=await supabase.from("sessoes_clinicas").select("observacoes_abc(*)").eq("paciente_id",pacienteId).is("deleted_at",null);if(error){reportServerError("getObservacoesAbcPaciente",error);return[]}return(data??[]).flatMap(item=>item.observacoes_abc)as import("./clinico/modelo").ObservacaoAbc[]})}

export async function getConfiguracaoPapeis():Promise<ConfigPapeis|null>{const supabase=await createClient(),{data,error}=await supabase.rpc("configuracao_papeis_acesso");if(error){reportServerError("getConfiguracaoPapeis",error);return null}return data as ConfigPapeis}

export async function getAgendamentos(inicio:string,fim:string):Promise<Agendamento[]>{return measureServerOperation("agenda.listar",async()=>{const supabase=await createClient(),{data,error}=await supabase.rpc("listar_agendamentos",{p_inicio:inicio,p_fim:fim});if(error){reportServerError("getAgendamentos",error);return[]}const agenda=(data??[])as Agendamento[],ids=agenda.filter(a=>a.status==="falta").map(a=>a.id);if(!ids.length)return agenda;const{data:ocorrencias,error:erroOcorrencias}=await supabase.from("ocorrencias_frequencia").select("id,agendamento_id,tipo,motivo").in("agendamento_id",ids).is("cancelado_em",null);if(erroOcorrencias){reportServerError("getAgendamentos.ocorrencias",erroOcorrencias);return agenda}const porAgenda=new Map((ocorrencias??[]).map(o=>[o.agendamento_id,o]));return agenda.map(a=>{const o=porAgenda.get(a.id);return o?{...a,ocorrencia_frequencia_id:o.id,ocorrencia_frequencia_tipo:o.tipo as TipoOcorrenciaFrequencia,ocorrencia_frequencia_motivo:o.motivo}:a})})}
export async function getOpcoesAgenda():Promise<OpcoesAgenda|null>{const supabase=await createClient(),{data,error}=await supabase.rpc("listar_opcoes_agendamento");if(error){reportServerError("getOpcoesAgenda",error);return null}return data as OpcoesAgenda}
export async function getDisponibilidadesAgenda():Promise<DisponibilidadeProfissional[]>{const supabase=await createClient(),{data,error}=await supabase.from("disponibilidades_profissional").select("*").eq("ativo",true).order("dia_semana").order("hora_inicio");if(error){reportServerError("getDisponibilidadesAgenda",error);return[]}return(data??[])as DisponibilidadeProfissional[]}
export async function getOpcoesFrequencia():Promise<OpcoesFrequencia|null>{const supabase=await createClient(),{data,error}=await supabase.rpc("opcoes_frequencia");if(error){reportServerError("getOpcoesFrequencia",error);return null}return data as OpcoesFrequencia}
export async function getProfissoes(incluirInativas=false){const supabase=await createClient(),{data,error}=await supabase.rpc("listar_profissoes",{p_incluir_inativas:incluirInativas});if(error){reportServerError("getProfissoes",error);return[]}return(data??[])as import("./types").Profissao[]}
export async function getRelatorioFrequencia(inicio:string,fim:string,profissionalId?:string,pacienteId?:string):Promise<RelatorioFrequencia>{return measureServerOperation("frequencia.relatorio",async()=>{const supabase=await createClient(),{data,error}=await supabase.rpc("relatorio_frequencia",{p_inicio:inicio,p_fim:fim,p_profissional_id:profissionalId||null,p_paciente_id:pacienteId||null});if(error){reportServerError("getRelatorioFrequencia",error);return{registros:[],profissionais:[],pacientes:[]}}const relatorio=data as RelatorioFrequencia,ids=relatorio.registros.map(r=>r.agendamento_id).filter((id):id is string=>!!id);if(!ids.length)return relatorio;const{data:agenda}=await supabase.from("agendamentos").select("id,inicio,fim").in("id",ids);const porId=new Map((agenda??[]).map(a=>[a.id,a]));return{...relatorio,registros:relatorio.registros.map(r=>{const a=r.agendamento_id?porId.get(r.agendamento_id):null;return a?{...r,agendamento_inicio:a.inicio,agendamento_fim:a.fim}:r})}})}
export async function getRelatorioFrequenciaPaginado(input:{inicio:string;fim:string;profissionalId?:string;pacienteId?:string;limite:number;offset:number}){return measureServerOperation("frequencia.relatorio_paginado",async()=>{const supabase=await createClient(),{data,error}=await supabase.rpc("relatorio_frequencia_paginado",{p_inicio:input.inicio,p_fim:input.fim,p_profissional_id:input.profissionalId||null,p_paciente_id:input.pacienteId||null,p_limite:input.limite,p_offset:input.offset});if(error){reportServerError("getRelatorioFrequenciaPaginado",error);return null}return data as import("./types").RelatorioFrequenciaPaginado})}
export async function getSugestoesAgendamentoFrequencia(pacienteId:string,profissionalId:string,data:string):Promise<SugestaoAgendamentoFrequencia[]>{const supabase=await createClient(),{data:registros,error}=await supabase.rpc("sugerir_agendamentos_frequencia",{p_paciente_id:pacienteId,p_profissional_id:profissionalId,p_data:data});if(error){reportServerError("getSugestoesAgendamentoFrequencia",error);return[]}return(registros??[])as SugestaoAgendamentoFrequencia[]}

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
 return measureServerOperation("clinico.planos_completos",async()=>{ const supabase = await createClient()
  const { data, error } = await supabase
    .from("planos_clinicos")
    .select("*, objetivos:objetivos_clinicos(*, alvos:alvos_clinicos(*, definicoes:definicoes_operacionais_alvo(*), medicoes:configuracoes_medicao_alvo(*), criterios:criterios_dominio_alvo(*), historico_fases:historico_fases_alvo(*), protocolos:protocolos_intervencao_alvo(*), planos_apoio:planos_apoio_comportamental_alvo(*), revisoes:revisoes_clinicas_alvo(*)))")
    .eq("paciente_id", pacienteId)
    .order("created_at", { ascending: false })
  if (error) { reportServerError("getPlanosClinicosPaciente", error); return [] }
  return (data ?? []) as unknown as PlanoClinicoCompleto[] })
}

export async function getSessoesAvaliacaoPaciente(pacienteId:string):Promise<import("./types").SessaoAvaliacaoResumo[]>{return measureServerOperation("avaliacao.sessoes_resumo",async()=>{const supabase=await createClient(),{data:userData}=await supabase.auth.getUser();if(!userData.user)return[];const{data,error}=await supabase.from("sessoes_clinicas").select("id,paciente_id,profissional_id,data,contexto,finalidade").eq("paciente_id",pacienteId).eq("profissional_id",userData.user.id).is("deleted_at",null).in("finalidade",["vinculo_acolhimento","entrevista_responsaveis","avaliacao_inicial","observacao_clinica","orientacao_equipe"]).order("data",{ascending:false});if(error){reportServerError("getSessoesAvaliacaoPaciente",error);return[]}return(data??[])as import("./types").SessaoAvaliacaoResumo[]})}

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
    .select("*, paciente:pacientes!inner(id,nome_completo), registros:registros_medicao(*, alvo:alvos_clinicos(id,nome), integridade:integridade_procedimental(*), tentativas:tentativas_individuais(*)), observacoes_abc(*)")
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
