"use client"

import { useEffect, useState } from "react"
import { ChevronLeft, ChevronRight, Clock3 } from "lucide-react"
import { buscarHorariosDisponiveisAgenda } from "@/lib/registros/actions"
import type { HorarioDisponivelAgenda, OpcoesAgenda, Profissao } from "@/lib/registros/types"
import { SeletorBuscaOperacional } from "@/components/registros/seletor-busca-operacional"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"

function dataLocal(data: Date) { return data.toLocaleDateString("en-CA") }
function chaveData(valor: string) { return dataLocal(new Date(valor)) }
function inicioSemana(valor: string) { const data = new Date(`${valor}T12:00:00`); data.setDate(data.getDate() - data.getDay()); return data }

export function BuscaHorariosProfissional({ opcoes, profissoes, pacienteId, duracao, selecionadoInicio, onSelecionar, onLimpar }: { opcoes: OpcoesAgenda; profissoes: Profissao[]; pacienteId: string; duracao: number; selecionadoInicio: string; onSelecionar: (horario: HorarioDisponivelAgenda, profissional: OpcoesAgenda["profissionais"][number]) => void; onLimpar: () => void }) {
  const [profissionalId, setProfissionalId] = useState("")
  const [referencia, setReferencia] = useState(dataLocal(new Date()))
  const [horarios, setHorarios] = useState<HorarioDisponivelAgenda[]>([])
  const [consultando, setConsultando] = useState(false)
  const [erro, setErro] = useState("")
  const [turno, setTurno] = useState<"manha" | "tarde" | "noite">("manha")
  const [profissionalNome, setProfissionalNome] = useState("")
  const profissional = opcoes.profissionais.find(p => p.id === profissionalId)??(profissionalId?{id:profissionalId,nome:profissionalNome,profissao:null}:undefined)
  const domingo = inicioSemana(referencia)
  const dias = Array.from({ length: 7 }, (_, indice) => { const dia = new Date(domingo); dia.setDate(domingo.getDate() + indice); return dia })

  useEffect(() => {
    if (!pacienteId || !profissionalId) { setHorarios([]); return }
    let ativo = true
    setConsultando(true); setErro("")
    buscarHorariosDisponiveisAgenda({ profissionalId, pacienteId, inicio: dataLocal(inicioSemana(referencia)), dias: 7, duracao }).then(resultado => {
      if (!ativo) return
      if ("error" in resultado) { setErro(resultado.error); setHorarios([]) } else setHorarios(resultado.data as HorarioDisponivelAgenda[])
      setConsultando(false)
    })
    return () => { ativo = false }
  }, [pacienteId, profissionalId, referencia, duracao])

  function mudarProfissional(valor: string,nome: string) { setProfissionalId(valor);setProfissionalNome(nome);onLimpar() }
  function mudarReferencia(valor: string) { setReferencia(valor); onLimpar() }
  function navegar(semanas: number) { const data = new Date(`${referencia}T12:00:00`); data.setDate(data.getDate() + semanas * 7); mudarReferencia(dataLocal(data)) }
  function mudarTurno(valor: "manha" | "tarde" | "noite") { setTurno(valor); onLimpar() }
  function pertenceAoTurno(item: HorarioDisponivelAgenda) { const hora = new Date(item.inicio).getHours(); return turno === "manha" ? hora < 12 : turno === "tarde" ? hora < 18 && hora >= 12 : hora >= 18 }

  const fim = dias[6]
  return <div className="grid gap-5 lg:grid-cols-[280px_minmax(0,1fr)]">
    <aside className="space-y-4 rounded-xl border bg-muted/20 p-4">
      <div><h3 className="font-semibold">Escolha o profissional</h3><p className="text-sm text-muted-foreground">A disponibilidade da semana aparecerá ao lado.</p></div>
      <div className="space-y-2"><Label>Profissional</Label><SeletorBuscaOperacional tipo="profissional"value={profissionalId}label={profissionalNome}profissoes={profissoes}onSelect={item=>mudarProfissional(item.id,item.nome)}/></div>
      <div className="space-y-2"><Label>Data de referência</Label><Input type="date" min={dataLocal(new Date())} value={referencia} onChange={e => mudarReferencia(e.target.value)} /></div>
      {profissional && <div className="rounded-lg border bg-card p-3 text-sm"><p className="font-semibold">{profissional.nome}</p><p className="text-muted-foreground">{profissional.profissao || "Atendimento"} · {duracao} minutos</p></div>}
    </aside>

    <section className="min-w-0 space-y-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div><h3 className="font-semibold">Horários livres na semana</h3><p className="text-sm text-muted-foreground">{domingo.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })} a {fim.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" })}</p></div>
        <div className="flex items-center gap-2"><Select value={turno} onValueChange={v => mudarTurno(v as "manha" | "tarde" | "noite")}><SelectTrigger className="w-32" aria-label="Filtrar por turno"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="manha">Manhã</SelectItem><SelectItem value="tarde">Tarde</SelectItem><SelectItem value="noite">Noite</SelectItem></SelectContent></Select><Button type="button" size="icon" variant="secondary" onClick={() => navegar(-1)} aria-label="Semana anterior"><ChevronLeft className="size-4" /></Button><Button type="button" size="icon" variant="secondary" onClick={() => navegar(1)} aria-label="Próxima semana"><ChevronRight className="size-4" /></Button></div>
      </div>

      {!profissionalId ? <div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">Selecione um profissional para visualizar sua semana.</div> : consultando ? <div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">Consultando horários livres...</div> : erro ? <p className="rounded-xl bg-destructive/10 p-4 text-sm text-destructive">{erro}</p> : <div className="overflow-x-auto rounded-xl border"><div className="grid min-w-[760px] grid-cols-7 divide-x">
        {dias.map(dia => { const chave = dataLocal(dia), itens = horarios.filter(item => chaveData(item.inicio) === chave && pertenceAoTurno(item)); return <div key={chave} className={cn("min-h-48 p-3", chave === referencia && "bg-primary/[0.04]")}><div className="mb-3 border-b pb-2 text-center"><p className="text-xs font-medium uppercase text-muted-foreground">{dia.toLocaleDateString("pt-BR", { weekday: "short" })}</p><p className="font-semibold">{dia.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })}</p></div><div className="space-y-2">{itens.map(item => { const escolhido = item.inicio === selecionadoInicio; return <button key={item.inicio} type="button" aria-pressed={escolhido} onClick={() => profissional && onSelecionar(item, profissional)} className={cn("flex w-full items-center justify-center gap-1 rounded-lg border px-2 py-2 text-sm font-medium transition-colors", escolhido ? "border-primary bg-primary text-primary-foreground shadow-sm" : "bg-card hover:border-primary/50 hover:bg-primary/5")}><Clock3 className="size-3.5" />{new Date(item.inicio).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</button>})}{!itens.length && <p className="py-4 text-center text-xs text-muted-foreground">Sem horários neste turno</p>}</div></div> })}
      </div></div>}
    </section>
  </div>
}
