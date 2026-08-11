"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { Activity, AlertCircle, Award, CalendarDays, Plus, Sparkles } from "lucide-react"
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts"
import {
  calcularIdade,
  type AtendimentoComRelacoes,
  type Habilidade,
  type Paciente,
  type PacienteHabilidade,
  type ProfissionalResumo,
} from "@/lib/registros/types"
import {
  calcularIndicadoresPorHabilidade,
  calcularResumoPeriodo,
  calcularSerieProgressoGeral,
  filtrarAvaliacoesPorPeriodo,
  periodoAnterior,
  type AvaliacaoClinica,
  type IntervaloData,
} from "@/lib/registros/clinico"
import { PacienteHabilidades } from "@/components/registros/paciente-habilidades"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, type ChartConfig } from "@/components/ui/chart"
import { FieldHelp } from "@/components/registros/field-help"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"

type Preset = "30d" | "3m" | "6m" | "1a" | "personalizado"
const chartConfig = { percentual: { label: "Progresso", color: "var(--primary)" } } satisfies ChartConfig

function hojeISO() { return new Date().toISOString().slice(0, 10) }
function inicioPreset(preset: Exclude<Preset, "personalizado">) {
  const data = new Date(); const dias = { "30d": 30, "3m": 90, "6m": 180, "1a": 365 }[preset]
  data.setDate(data.getDate() - dias + 1); return data.toISOString().slice(0, 10)
}
function formatarData(data: string) { return new Date(`${data}T12:00:00`).toLocaleDateString("pt-BR") }

export function PacienteDashboard({ paciente, profissionais, vinculos, habilidades, avaliacoes, atendimentosVisiveis, profissionalAtualId, ocultarCabecalho = false }: {
  paciente: Paciente
  profissionais: ProfissionalResumo[]
  vinculos: PacienteHabilidade[]
  habilidades: Habilidade[]
  avaliacoes: AvaliacaoClinica[]
  atendimentosVisiveis: AtendimentoComRelacoes[]
  profissionalAtualId: string
  ocultarCabecalho?: boolean
}) {
  const [escopo, setEscopo] = useState<"meus" | "equipe">("meus")
  const [preset, setPreset] = useState<Preset>("3m")
  const [inicioCustom, setInicioCustom] = useState(inicioPreset("3m"))
  const [fimCustom, setFimCustom] = useState(hojeISO())
  const [habilidadeSelecionada, setHabilidadeSelecionada] = useState(
    vinculos.find((vinculo) => vinculo.profissional_id === profissionalAtualId)?.habilidade_id ?? "",
  )
  const periodo: IntervaloData = preset === "personalizado"
    ? { inicio: inicioCustom, fim: fimCustom }
    : { inicio: inicioPreset(preset), fim: hojeISO() }
  const { inicio, fim } = periodo

  const vinculosDoEscopo = useMemo(() => escopo === "equipe"
    ? vinculos
    : vinculos.filter((vinculo) => vinculo.profissional_id === profissionalAtualId), [vinculos, escopo, profissionalAtualId])
  const avaliacoesDoEscopo = useMemo(() => escopo === "equipe"
    ? avaliacoes
    : avaliacoes.filter((avaliacao) => Boolean(avaliacao.profissional_nome)), [avaliacoes, escopo])

  const dados = useMemo(() => {
    const ponderadas = vinculosDoEscopo.map((v) => ({ habilidadeId: v.habilidade_id, peso: Number(v.peso), ativo: v.ativo }))
    const periodoAtual = { inicio, fim }
    const filtradas = filtrarAvaliacoesPorPeriodo(avaliacoesDoEscopo, periodoAtual)
    const indicadores = calcularIndicadoresPorHabilidade(filtradas, ponderadas)
    const resumo = calcularResumoPeriodo(filtradas, ponderadas)
    const anterior = periodoAnterior(periodoAtual)
    const resumoAnterior = calcularResumoPeriodo(filtrarAvaliacoesPorPeriodo(avaliacoesDoEscopo, anterior), ponderadas)
    return { filtradas, indicadores, resumo, resumoAnterior, serie: calcularSerieProgressoGeral(filtradas, ponderadas) }
  }, [avaliacoesDoEscopo, vinculosDoEscopo, inicio, fim])

  const porId = new Map(vinculosDoEscopo.map((v) => [v.habilidade_id, v]))
  const selecionada = porId.get(habilidadeSelecionada)
  const serieHabilidade = dados.filtradas.filter((a) => a.habilidade_id === habilidadeSelecionada)
    .map((a) => ({ ...a, observacao: atendimentosVisiveis.find((at) => at.id === a.id)?.observacoes ?? null }))
  const ultimaSessao = avaliacoesDoEscopo.length ? [...avaliacoesDoEscopo].sort((a, b) => b.data.localeCompare(a.data))[0].data : null
  const adquiridas = dados.indicadores.filter((i) => i.indicador.adquirida).sort((a, b) =>
    (b.indicador.adquiridaEm ?? "").localeCompare(a.indicador.adquiridaEm ?? ""))
  const atencao = dados.indicadores.filter((i) => i.indicador.tendencia === "queda" || i.indicador.tendencia === "dados_insuficientes")
  const variacao = dados.resumo.progressoGeral !== null && dados.resumoAnterior.progressoGeral !== null
    ? dados.resumo.progressoGeral - dados.resumoAnterior.progressoGeral : null
  const cards = [
    ["Habilidades acompanhadas", vinculosDoEscopo.filter((v) => v.ativo).length, Sparkles],
    ["Pontos de atenção", atencao.length, AlertCircle],
    ["Última sessão", ultimaSessao ? formatarData(ultimaSessao) : "Sem sessões", CalendarDays],
    ["Progresso geral", dados.resumo.progressoGeral === null ? "Sem dados" : `${dados.resumo.progressoGeral}%`, Activity],
  ] as const

  return <div className="flex flex-col gap-6">
    {!ocultarCabecalho && <section className="rounded-2xl border border-border bg-card p-5">
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
        <div><h1 className="text-2xl font-bold">{paciente.nome_completo}</h1><p className="text-sm text-muted-foreground">Acompanhamento do paciente</p></div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-3 text-sm">
          <div><span className="text-muted-foreground">Idade</span><p className="font-semibold">{calcularIdade(paciente.data_nascimento) ?? "—"} anos</p></div>
          <div><span className="text-muted-foreground">Responsável</span><p className="font-semibold truncate max-w-40">{paciente.nome_responsavel ?? "—"}</p></div>
          <div><span className="text-muted-foreground">Última sessão</span><p className="font-semibold">{ultimaSessao ? formatarData(ultimaSessao) : "Sem sessões"}</p></div>
          <div><span className="text-muted-foreground">Habilidades ativas</span><p className="font-semibold">{vinculosDoEscopo.filter((v) => v.ativo).length}</p></div>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3"><p className="text-xs text-muted-foreground">{profissionais.length} profissional(is) vinculado(s)</p><Button asChild size="sm"><Link href={`/registros/atendimentos/novo?paciente=${paciente.id}`}><Plus className="size-4" />Registrar atendimento</Link></Button></div>
    </section>}


    <section className="flex flex-col sm:flex-row sm:items-end gap-3 rounded-2xl border bg-card p-4">
      <div className="min-w-52"><span className="text-sm font-semibold mb-2 block">Dados exibidos</span><Select value={escopo} onValueChange={(valor) => setEscopo(valor as "meus" | "equipe")}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="meus">Meus registros</SelectItem><SelectItem value="equipe">Equipe vinculada</SelectItem></SelectContent></Select></div>
      <div className="min-w-52"><span className="flex items-center gap-1 text-sm font-semibold mb-2">Período analisado <FieldHelp text="Os indicadores históricos e gráficos consideram somente avaliações dentro deste intervalo." /></span><Select value={preset} onValueChange={(v) => setPreset(v as Preset)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="30d">Últimos 30 dias</SelectItem><SelectItem value="3m">Últimos 3 meses</SelectItem><SelectItem value="6m">Últimos 6 meses</SelectItem><SelectItem value="1a">Último ano</SelectItem><SelectItem value="personalizado">Período personalizado</SelectItem></SelectContent></Select></div>
      {preset === "personalizado" && <><Input aria-label="Data inicial" type="date" value={inicioCustom} onChange={(e) => setInicioCustom(e.target.value)} className="sm:w-44" /><Input aria-label="Data final" type="date" value={fimCustom} onChange={(e) => setFimCustom(e.target.value)} className="sm:w-44" /></>}
      <p className="text-xs text-muted-foreground sm:ml-auto">{formatarData(periodo.inicio)} a {formatarData(periodo.fim)}</p>
    </section>

    <section className="grid grid-cols-2 lg:grid-cols-4 gap-3">{cards.map(([label, valor, Icon]) => <Card key={label}><CardContent className="p-4"><Icon className="size-4 text-primary mb-2" /><p className="text-xl font-bold">{valor}</p><p className="text-xs text-muted-foreground">{label}</p></CardContent></Card>)}</section>

    <section className="grid grid-cols-1 xl:grid-cols-3 gap-4">
      <Card className="xl:col-span-2"><CardHeader><CardTitle className="text-base flex items-center gap-1">Evolução geral <FieldHelp text="Série do progresso geral ponderado nas datas em que houve avaliações; períodos sem dados não geram pontos." /></CardTitle></CardHeader><CardContent>{dados.serie.length === 0 ? <p className="text-sm text-muted-foreground py-16 text-center">Não há avaliações no período selecionado.</p> : <ChartContainer config={chartConfig} className="h-72 w-full aspect-auto"><LineChart data={dados.serie} margin={{ left: 0, right: 12 }}><CartesianGrid vertical={false} /><XAxis dataKey="data" tickFormatter={(v) => formatarData(v).slice(0, 5)} /><YAxis domain={[0, 100]} tickFormatter={(v) => `${v}%`} width={38} /><ChartTooltip formatter={(value, _name, item) => <div className="grid gap-1"><strong>{value}%</strong><span>{formatarData(item.payload.data)}</span><span>{item.payload.avaliacoes} avaliações utilizadas</span></div>} /><Line dataKey="percentual" stroke="var(--color-percentual)" strokeWidth={3} dot={{ r: 4 }} connectNulls={false} /></LineChart></ChartContainer>}</CardContent></Card>
      <Card><CardHeader><CardTitle className="text-base">Comparação de períodos</CardTitle></CardHeader><CardContent className="space-y-4"><div><p className="text-xs text-muted-foreground">Período atual</p><p className="text-2xl font-bold">{dados.resumo.progressoGeral === null ? "Sem dados" : `${dados.resumo.progressoGeral}%`}</p></div><div><p className="text-xs text-muted-foreground">Período anterior equivalente</p><p className="text-xl font-semibold">{dados.resumoAnterior.progressoGeral === null ? "Sem dados" : `${dados.resumoAnterior.progressoGeral}%`}</p></div><div><p className="text-xs text-muted-foreground">Variação</p><p className="font-semibold">{variacao === null ? "Não calculável" : `${variacao > 0 ? "+" : ""}${variacao} pontos percentuais`}</p></div></CardContent></Card>
    </section>

    <Card><CardHeader><CardTitle className="text-base">Evolução por habilidade</CardTitle></CardHeader><CardContent className="space-y-4"><Select value={habilidadeSelecionada} onValueChange={setHabilidadeSelecionada}><SelectTrigger className="max-w-sm"><SelectValue placeholder="Selecione uma habilidade" /></SelectTrigger><SelectContent>{vinculosDoEscopo.map((v) => <SelectItem key={v.id} value={v.habilidade_id}>{v.habilidade.nome}</SelectItem>)}</SelectContent></Select>{!selecionada || serieHabilidade.length === 0 ? <p className="text-sm text-muted-foreground py-12 text-center">Ainda não há avaliações desta habilidade no período.</p> : <ChartContainer config={{ valor: { label: selecionada.habilidade.nome, color: "var(--primary)" } }} className="h-72 w-full aspect-auto"><LineChart data={serieHabilidade} margin={{ left: 0, right: 12 }}><CartesianGrid vertical={false} /><XAxis dataKey="data" tickFormatter={(v) => formatarData(v).slice(0, 5)} /><YAxis domain={[0, 1]} ticks={[0, 0.5, 0.7, 1]} tickFormatter={(v) => v === 1 ? "A" : v === 0.7 ? "B+" : v === 0.5 ? "B-" : "C"} width={30} /><ChartTooltip formatter={(value, _name, item) => <div className="grid gap-1 max-w-56"><strong>{item.payload.codigo} ({value})</strong><span>{formatarData(item.payload.data)}</span>{item.payload.profissional_nome && <span>{item.payload.profissional_nome}</span>}{item.payload.observacao && <span className="text-muted-foreground truncate">{item.payload.observacao}</span>}</div>} /><Line dataKey="valor" stroke="var(--color-valor)" strokeWidth={3} dot={{ r: 4 }} /></LineChart></ChartContainer>}</CardContent></Card>

    <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <Card><CardHeader><CardTitle className="text-base flex gap-2"><Award className="size-4 text-primary" />Habilidades adquiridas</CardTitle></CardHeader><CardContent className="space-y-3">{adquiridas.length === 0 ? <p className="text-sm text-muted-foreground">Nenhuma aquisição identificada no período.</p> : adquiridas.map((i) => <div key={i.habilidadeId} className="flex justify-between gap-3 rounded-xl bg-muted p-3"><span className="font-semibold">{porId.get(i.habilidadeId)?.habilidade.nome}</span><span className="text-xs text-muted-foreground">{i.indicador.adquiridaEm && formatarData(i.indicador.adquiridaEm)}</span></div>)}</CardContent></Card>
      <Card><CardHeader><CardTitle className="text-base flex gap-2"><AlertCircle className="size-4 text-amber-600" />Indicadores para atenção</CardTitle></CardHeader><CardContent className="space-y-3">{atencao.length === 0 ? <p className="text-sm text-muted-foreground">Nenhum indicador de atenção no período.</p> : atencao.map((i) => <div key={i.habilidadeId} className="rounded-xl border p-3"><p className="font-semibold text-sm">{porId.get(i.habilidadeId)?.habilidade.nome}</p><p className="text-xs text-muted-foreground mt-1">{i.indicador.tendencia === "queda" ? "As avaliações recentes apresentam desempenho inferior ao período anterior." : "Ainda há poucos dados para calcular uma tendência."}</p></div>)}</CardContent></Card>
    </section>

    <Card><CardHeader><CardTitle className="text-base flex gap-2"><CalendarDays className="size-4 text-primary" />Linha do tempo</CardTitle></CardHeader><CardContent className="space-y-3">{[...dados.filtradas].reverse().slice(0, 12).map((a) => <div key={a.id} className="grid grid-cols-[4rem_1fr] gap-3 border-l-2 border-primary/30 pl-3"><span className="text-xs text-muted-foreground">{formatarData(a.data).slice(0, 5)}</span><p className="text-sm">Atendimento registrado em <strong>{porId.get(a.habilidade_id)?.habilidade.nome ?? "habilidade"}</strong> · nota {a.codigo}</p></div>)}{dados.filtradas.length === 0 && <p className="text-sm text-muted-foreground">Nenhum acontecimento no período.</p>}</CardContent></Card>

    <PacienteHabilidades pacienteId={paciente.id} vinculos={vinculosDoEscopo} habilidades={habilidades} avaliacoes={avaliacoesDoEscopo} atendimentosVisiveis={atendimentosVisiveis} somenteLeitura={escopo === "equipe"} />
  </div>
}
