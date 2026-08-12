import type { CriterioDominioAlvo, RegistroMedicaoComAlvo, SessaoClinicaComRegistros } from "./modelo"
import { valorMedicao } from "./analise-medicao"

export type ResultadoDominio = {
  estado: "sem_dados" | "em_progresso" | "criterio_atingido" | "verificacao_manual"
  consecutivas: number
  necessarias: number
  mensagem: string
}

export function avaliarDominio(criterio: CriterioDominioAlvo, alvoId: string, sessoes: SessaoClinicaComRegistros[]): ResultadoDominio {
  const evidencias = sessoes.flatMap((sessao) => sessao.registros
    .filter((r) => r.alvo_id === alvoId && r.criterio_dominio_id === criterio.id)
    .map((registro) => ({ sessao, registro, valor: valorMedicao(registro.tipo_medicao, registro.dados) })))
    .filter((e): e is { sessao: SessaoClinicaComRegistros; registro: RegistroMedicaoComAlvo; valor: number } => e.valor !== null)
    .sort((a, b) => b.sessao.data.localeCompare(a.sessao.data))

  if (!evidencias.length) return { estado: "sem_dados", consecutivas: 0, necessarias: criterio.sessoes_consecutivas, mensagem: "Ainda não há medições vinculadas à versão vigente do critério." }
  let consecutivas = 0
  const qualificadas: typeof evidencias = []
  for (const evidencia of evidencias) {
    const oportunidades = Number(evidencia.registro.dados.oportunidades ?? 0)
    const oportunidadesValidas = criterio.oportunidades_minimas === null || oportunidades >= criterio.oportunidades_minimas
    const valorValido = criterio.valor_alvo !== null && (criterio.direcao === "aumentar" ? evidencia.valor >= criterio.valor_alvo : evidencia.valor <= criterio.valor_alvo)
    if (!oportunidadesValidas || !valorValido) break
    qualificadas.push(evidencia)
    consecutivas += 1
  }
  const ambientes = new Set(qualificadas.map((e) => e.sessao.ambiente_tipo).filter(Boolean)).size
  const aplicadores = new Set(qualificadas.map((e) => e.sessao.aplicador_tipo).filter(Boolean)).size
  const datas = qualificadas.map((e) => new Date(`${e.sessao.data}T12:00:00`).getTime())
  const dias = datas.length > 1 ? Math.floor((Math.max(...datas) - Math.min(...datas)) / 86400000) : 0
  const quantitativo = consecutivas >= criterio.sessoes_consecutivas
  const contexto = ambientes >= criterio.ambientes_minimos && aplicadores >= criterio.aplicadores_minimos
  const manutencao = criterio.dias_manutencao === null || dias >= criterio.dias_manutencao
  const atingido = quantitativo && contexto && manutencao
  const pendencias = [!quantitativo && `${consecutivas}/${criterio.sessoes_consecutivas} sessões`, ambientes < criterio.ambientes_minimos && `${ambientes}/${criterio.ambientes_minimos} ambientes`, aplicadores < criterio.aplicadores_minimos && `${aplicadores}/${criterio.aplicadores_minimos} tipos de aplicador`, !manutencao && `${dias}/${criterio.dias_manutencao} dias`].filter(Boolean).join(" · ")
  return { estado: atingido ? "criterio_atingido" : "em_progresso", consecutivas, necessarias: criterio.sessoes_consecutivas, mensagem: atingido ? "Os dados atendem aos parâmetros quantitativos, de generalização e manutenção do critério vigente. A mudança de fase continua sendo uma decisão do profissional." : `Evidências pendentes: ${pendencias}.` }
}
