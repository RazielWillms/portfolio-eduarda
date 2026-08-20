"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Clock } from "lucide-react"
import type { Agendamento, DisponibilidadeProfissional, OpcoesAgenda, Papel, Profissao } from "@/lib/registros/types"
import { SeletorBuscaOperacional } from "@/components/registros/seletor-busca-operacional"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"

const ALTURA_HORA = 60
const MARGEM_VERTICAL = 16
const statusLabel: Record<string, string> = { agendado: "Agendado", confirmado: "Confirmado", realizado: "Realizado", cancelado: "Cancelado", falta: "Falta", reagendado: "Reagendado" }
const statusCor: Record<string, string> = {
  agendado: "border-sky-300 bg-sky-100 text-sky-950",
  confirmado: "border-cyan-400 bg-cyan-100 text-cyan-950",
  realizado: "border-emerald-300 bg-emerald-100 text-emerald-950",
  falta: "border-amber-300 bg-amber-100 text-amber-950",
  cancelado: "border-rose-300 bg-rose-100 text-rose-950",
  reagendado: "border-slate-300 bg-slate-100 text-slate-800",
}

function chaveData(data: Date) { return data.toLocaleDateString("en-CA") }
function horario(data: string) { return new Date(data).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }) }
function minutosNoDia(data: string) { const d = new Date(data); return d.getHours() * 60 + d.getMinutes() }
function minutosHorario(horario: string) { const [h, m] = horario.slice(0, 5).split(":").map(Number); return h * 60 + m }
function posicionarEventos(eventos: Agendamento[]) {
  const ordenados = [...eventos].sort((a, b) => new Date(a.inicio).getTime() - new Date(b.inicio).getTime() || new Date(a.fim).getTime() - new Date(b.fim).getTime())
  const resultado: { evento: Agendamento; coluna: number; colunas: number }[] = []
  let grupo: { evento: Agendamento; coluna: number }[] = [], fimGrupo = 0, finaisColunas: number[] = []
  const concluirGrupo = () => { const colunas = Math.max(1, finaisColunas.length); grupo.forEach(item => resultado.push({ ...item, colunas })); grupo = []; finaisColunas = [] }
  for (const evento of ordenados) {
    const inicio = new Date(evento.inicio).getTime(), fim = new Date(evento.fim).getTime()
    if (grupo.length && inicio >= fimGrupo) concluirGrupo()
    let coluna = finaisColunas.findIndex(final => final <= inicio)
    if (coluna < 0) { coluna = finaisColunas.length; finaisColunas.push(fim) } else finaisColunas[coluna] = fim
    grupo.push({ evento, coluna }); fimGrupo = Math.max(fimGrupo, fim)
  }
  if (grupo.length) concluirGrupo()
  return resultado
}

export function AgendaTimeline({ agendamentos, disponibilidades, opcoes, profissoes, papel, referencia, visao }: { agendamentos: Agendamento[]; disponibilidades: DisponibilidadeProfissional[]; opcoes: OpcoesAgenda | null; profissoes: Profissao[]; papel: Papel; referencia: string; visao: "dia" | "semana" }) {
  const router = useRouter()
  const podeGerir = papel !== "profissional"
  const [profissional, setProfissional] = useState("todos")
  const [profissionalNome, setProfissionalNome] = useState("")
  const [status, setStatus] = useState("todos")
  const referenciaData = new Date(`${referencia}T12:00:00`)
  const inicio = new Date(referenciaData)
  if (visao === "semana") inicio.setDate(inicio.getDate() - inicio.getDay())
  const dias = Array.from({ length: visao === "semana" ? 7 : 1 }, (_, indice) => { const d = new Date(inicio); d.setDate(inicio.getDate() + indice); return d })
  const eventos = useMemo(() => agendamentos.filter(a => (profissional === "todos" || a.profissional_id === profissional) && (status === "todos" || a.status === status)), [agendamentos, profissional, status])
  const jornadasVisiveis = disponibilidades.filter(d => (profissional === "todos" || d.profissional_id === profissional) && dias.some(dia => dia.getDay() === d.dia_semana))
  const limitesInicio = [...jornadasVisiveis.map(d => minutosHorario(d.hora_inicio)), ...eventos.map(e => minutosNoDia(e.inicio))]
  const limitesFim = [...jornadasVisiveis.map(d => minutosHorario(d.hora_fim)), ...eventos.map(e => minutosNoDia(e.fim))]
  const inicioDia = Math.max(0, Math.floor(Math.min(...(limitesInicio.length ? limitesInicio : [480])) / 60) - 1)
  const fimDia = Math.min(24, Math.ceil(Math.max(...(limitesFim.length ? limitesFim : [1080])) / 60) + 1)
  const alturaGrade = (fimDia - inicioDia) * ALTURA_HORA + MARGEM_VERTICAL * 2
  const horas = Array.from({ length: fimDia - inicioDia + 1 }, (_, i) => inicioDia + i)

  function navegar(dias: number) { const d = new Date(referenciaData); d.setDate(d.getDate() + dias); router.push(`/registros/agenda?data=${chaveData(d)}&visao=${visao}&formato=timeline`) }
  function mudarVisao(valor: string) { router.push(`/registros/agenda?data=${referencia}&visao=${valor}&formato=timeline`) }

  return <div className="space-y-4">
    <div className="flex flex-col gap-4 rounded-2xl border bg-card p-4 xl:flex-row xl:items-end xl:justify-between">
      <div className="space-y-2"><Label>Ir para uma data</Label><div className="grid grid-cols-4 items-center gap-2 sm:flex sm:flex-wrap">
        <Button className="w-full" size="icon" variant="secondary" onClick={() => navegar(-7)} aria-label="Voltar uma semana"><ChevronsLeft className="size-4" /></Button>
        <Button className="w-full" size="icon" variant="secondary" onClick={() => navegar(-1)} aria-label="Voltar um dia"><ChevronLeft className="size-4" /></Button>
        <Input type="date" value={referencia} onChange={e => router.push(`/registros/agenda?data=${e.target.value}&visao=${visao}&formato=timeline`)} className="order-first col-span-4 w-full sm:order-none sm:w-40" />
        <Button className="w-full" size="icon" variant="secondary" onClick={() => navegar(1)} aria-label="Avançar um dia"><ChevronRight className="size-4" /></Button>
        <Button className="w-full" size="icon" variant="secondary" onClick={() => navegar(7)} aria-label="Avançar uma semana"><ChevronsRight className="size-4" /></Button>
      </div></div>
      <div className="flex flex-wrap gap-3">
        <div className="space-y-2"><Label>Exibição</Label><Select value={visao} onValueChange={mudarVisao}><SelectTrigger className="w-36"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="dia">Um dia</SelectItem><SelectItem value="semana">Uma semana</SelectItem></SelectContent></Select></div>
        {podeGerir && opcoes && <div className="w-full space-y-2 sm:w-64"><Label>Responsável</Label><SeletorBuscaOperacional tipo="profissional" value={profissional === "todos" ? "" : profissional} label={profissionalNome || "Toda a equipe"} profissoes={profissoes} allowClear onSelect={(item) => { setProfissional(item.id); setProfissionalNome(item.nome) }} onClear={() => { setProfissional("todos"); setProfissionalNome("") }} /></div>}
        <div className="w-full space-y-2 sm:w-auto"><Label>Status</Label><Select value={status} onValueChange={setStatus}><SelectTrigger className={cn("w-full sm:w-44", status !== "todos" && statusCor[status])}><SelectValue /></SelectTrigger><SelectContent><SelectItem value="todos">Todos os status</SelectItem>{Object.entries(statusLabel).map(([v, l]) => <SelectItem key={v} value={v} className={cn("my-1 border", statusCor[v])}>{l}</SelectItem>)}</SelectContent></Select></div>
      </div>
    </div>

    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-xl border bg-card px-4 py-3 text-xs" aria-label="Legenda de status da agenda">
      <span className="font-semibold text-muted-foreground">Legenda:</span>
      {Object.entries(statusLabel).map(([valor, label]) => <span key={valor} className="inline-flex items-center gap-1.5"><span className={cn("size-3 rounded-sm border", statusCor[valor])} aria-hidden="true" />{label}</span>)}
    </div>

    <div className="mobile-tab-scroll overflow-x-auto rounded-2xl border bg-card">
      <div className={cn("min-w-[760px]", visao === "dia" && "min-w-[320px] sm:min-w-[520px]")}>
        <div className="grid border-b bg-muted/40" style={{ gridTemplateColumns: `64px repeat(${dias.length}, minmax(0, 1fr))` }}>
          <div className="border-r p-3" />{dias.map(d => <div key={chaveData(d)} className={cn("border-r p-3 text-center last:border-r-0", chaveData(d) === referencia && "bg-primary/10")}><p className="text-xs font-medium uppercase text-muted-foreground">{d.toLocaleDateString("pt-BR", { weekday: "short" })}</p><p className="font-bold">{d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })}</p></div>)}
        </div>
        <div className="grid" style={{ gridTemplateColumns: `64px repeat(${dias.length}, minmax(0, 1fr))` }}>
          <div className="relative border-r" style={{ height: alturaGrade }}>{horas.map((h, i) => <div key={h} className="absolute right-2 -translate-y-1/2 text-xs text-muted-foreground" style={{ top: MARGEM_VERTICAL + i * ALTURA_HORA }}>{String(h).padStart(2, "0")}:00</div>)}</div>
          {dias.map(d => { const doDia = eventos.filter(a => chaveData(new Date(a.inicio)) === chaveData(d)); const posicionados = posicionarEventos(doDia); return <div key={chaveData(d)} className={cn("relative border-r last:border-r-0", chaveData(d) === referencia && "bg-primary/[0.06]")} style={{ height: alturaGrade }}>
            {Array.from({ length: (fimDia - inicioDia) * 2 + 1 }, (_, indice) => <div key={indice} aria-hidden="true" className={cn("pointer-events-none absolute inset-x-0 border-t", indice % 2 === 0 ? "border-border/70" : "border-border/30")} style={{ top: MARGEM_VERTICAL + indice * ALTURA_HORA / 2 }} />)}
            {posicionados.map(({ evento: a, coluna, colunas }, indice) => { const inicioMin = minutosNoDia(a.inicio); const fimMin = minutosNoDia(a.fim); const top = MARGEM_VERTICAL + Math.max(0, (inicioMin - inicioDia * 60) / 60 * ALTURA_HORA); const height = Math.max(26, (fimMin - inicioMin) / 60 * ALTURA_HORA); const largura = 100 / colunas; return <div key={a.id} title={`${a.paciente_nome} — ${a.profissional_nome}`} className={cn("absolute overflow-hidden rounded-md border px-1.5 py-0.5 text-[11px] leading-tight shadow-sm", statusCor[a.status] ?? statusCor.agendado)} style={{ top: top + 1, height: height - 2, left: `calc(${coluna * largura}% + 3px)`, width: `calc(${largura}% - 6px)`, zIndex: indice + 1 }}><p className="truncate font-bold">{a.paciente_nome}</p><p className="truncate">{horario(a.inicio)}–{horario(a.fim)}</p>{height >= 54 && <p className="truncate opacity-80">{a.profissional_nome}</p>}</div> })}
          </div> })}
        </div>
      </div>
    </div>
    <p className="flex items-center gap-1.5 text-xs text-muted-foreground"><Clock className="size-3.5" />A altura de cada bloco representa a duração do compromisso. Use a lista para executar ações.</p>
  </div>
}
