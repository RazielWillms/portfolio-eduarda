import "server-only"
import { createClient as createSupabaseClient } from "@supabase/supabase-js"
import { calcularIndicadorHabilidade, calcularProgressoGeral, calcularSerieProgressoGeral } from "@/lib/registros/clinico"
import type { AvaliacaoClinica } from "@/lib/registros/clinico"
import type { SharedPatientDashboard } from "./types"
import { reportServerError } from "@/lib/server-log"

interface RawDashboard {
  primeiro_nome: string
  ultima_atualizacao: string | null
  habilidades: { nome: string; avaliacoes: { data: string; codigo: string; valor: number | string }[] }[]
}

export async function obterPortalResponsavel(token: string): Promise<(SharedPatientDashboard & { serieGeral: { data: string; percentual: number; avaliacoes: number }[] }) | null> {
  const supabase = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  )
  const { data, error } = await supabase.rpc("obter_acompanhamento_responsavel", { p_token: token })
  if (error) {
    reportServerError("obterPortalResponsavel", error)
    return null
  }
  if (!data) return null
  const raw = data as RawDashboard
  const todas: AvaliacaoClinica[] = []
  const habilidades = raw.habilidades.map((h, index) => {
    const avaliacoes = h.avaliacoes.map((a, itemIndex) => ({
      id: `${index}-${itemIndex}`, habilidade_id: String(index), data: a.data,
      codigo: a.codigo, valor: Number(a.valor),
    }))
    todas.push(...avaliacoes)
    const indicador = calcularIndicadorHabilidade(avaliacoes)
    return { nome: h.nome, status: indicador.status, progresso: indicador.percentual,
      tendencia: indicador.tendencia, adquiridaEm: indicador.adquiridaEm,
      avaliacoes: avaliacoes.map(({ data, codigo, valor }) => ({ data, codigo, valor })) }
  })
  const ponderadas = habilidades.map((_, index) => ({ habilidadeId: String(index), peso: 1, ativo: true }))
  const fim = new Date().toISOString().slice(0, 10)
  const inicioData = new Date(); inicioData.setFullYear(inicioData.getFullYear() - 1)
  return {
    primeiroNome: raw.primeiro_nome, periodoInicio: inicioData.toISOString().slice(0, 10), periodoFim: fim,
    ultimaAtualizacao: raw.ultima_atualizacao,
    progressoGeral: calcularProgressoGeral(habilidades.map((h) => ({ progresso: h.progresso, peso: 1, ativo: true }))),
    habilidades,
    serieGeral: calcularSerieProgressoGeral(todas, ponderadas),
  }
}
