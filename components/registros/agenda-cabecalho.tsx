"use client"

import { useRouter } from "next/navigation"
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, SlidersHorizontal } from "lucide-react"
import type { Profissao } from "@/lib/registros/types"
import { cn } from "@/lib/utils"
import { SeletorBuscaOperacional } from "@/components/registros/seletor-busca-operacional"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"

const statusLabel: Record<string, string> = { proximos: "Próximos", agendado: "Agendado", confirmado: "Confirmado", realizado: "Realizado", cancelado: "Cancelado", falta: "Falta", reagendado: "Reagendado" }

type Props = {
  referencia: string; visao: "dia" | "semana"; formato: "lista" | "timeline"; periodo: string; podeGerir: boolean; profissoes: Profissao[];
  profissional: string; profissionalNome: string; status: string; statusCor?: Record<string, string>;
  onProfissional: (item: { id: string; nome: string }) => void; onLimparProfissional: () => void; onStatus: (status: string) => void;
}

export function AgendaCabecalho(props: Props) {
  const { referencia, visao, formato, periodo, podeGerir, profissoes, profissional, profissionalNome, status, statusCor, onProfissional, onLimparProfissional, onStatus } = props
  const router = useRouter()
  const padraoStatus = formato === "lista" ? "proximos" : "todos"
  const filtrosAtivos = Number(profissional !== "todos") + Number(status !== padraoStatus)
  const destino = (data: string, novaVisao = visao) => `/registros/agenda?data=${data}&visao=${novaVisao}&formato=${formato}`
  function navegar(dias: number) { const data = new Date(`${referencia}T12:00:00`); data.setDate(data.getDate() + dias); router.push(destino(data.toLocaleDateString("en-CA"))) }

  const navegacao = <div className="space-y-2"><Label htmlFor={`agenda-data-${formato}`}>Ir para uma data</Label><div className="grid grid-cols-4 items-center gap-2 sm:flex sm:flex-wrap">
    <Button className="w-full" size="icon" variant="secondary" onClick={() => navegar(-7)} aria-label="Voltar uma semana"><ChevronsLeft className="size-4" /></Button>
    <Button className="w-full" size="icon" variant="secondary" onClick={() => navegar(-1)} aria-label="Voltar um dia"><ChevronLeft className="size-4" /></Button>
    <Input id={`agenda-data-${formato}`} type="date" value={referencia} onChange={(e) => router.push(destino(e.target.value))} className="order-first col-span-4 w-full sm:order-none sm:w-40" />
    <Button className="w-full" size="icon" variant="secondary" onClick={() => navegar(1)} aria-label="Avançar um dia"><ChevronRight className="size-4" /></Button>
    <Button className="w-full" size="icon" variant="secondary" onClick={() => navegar(7)} aria-label="Avançar uma semana"><ChevronsRight className="size-4" /></Button>
  </div></div>

  const exibicao = <div className="space-y-2"><Label>Exibição</Label><Select value={visao} onValueChange={(valor) => router.push(destino(referencia, valor as "dia" | "semana"))}><SelectTrigger className="w-full xl:w-36"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="dia">Um dia</SelectItem><SelectItem value="semana">Uma semana</SelectItem></SelectContent></Select></div>
  const responsavel = podeGerir && <div className="space-y-2"><Label>Responsável</Label><SeletorBuscaOperacional tipo="profissional" value={profissional === "todos" ? "" : profissional} label={profissionalNome || "Toda a equipe"} profissoes={profissoes} allowClear onSelect={onProfissional} onClear={onLimparProfissional} /></div>
  const situacao = <div className="space-y-2"><Label>Status</Label><Select value={status} onValueChange={onStatus}><SelectTrigger className={cn("w-full xl:w-44", statusCor && status !== "todos" && statusCor[status])}><SelectValue /></SelectTrigger><SelectContent>{formato === "lista" && <SelectItem value="proximos">Próximos</SelectItem>}<SelectItem value="todos">Todos os status</SelectItem>{Object.entries(statusLabel).filter(([valor]) => valor !== "proximos").map(([valor, label]) => <SelectItem key={valor} value={valor} className={cn(statusCor && "my-1 border", statusCor?.[valor])}>{label}</SelectItem>)}</SelectContent></Select></div>

  return <div className="rounded-2xl border bg-card p-4">
    <div className="space-y-4 xl:hidden">
      {navegacao}
      <p className="font-semibold capitalize">{periodo}</p>
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-2">
        {exibicao}
        <Sheet><SheetTrigger asChild><Button variant="secondary" className="relative px-3"><SlidersHorizontal className="size-4" /><span className="hidden min-[390px]:inline">Filtros</span>{filtrosAtivos > 0 && <span className="flex size-5 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground">{filtrosAtivos}</span>}</Button></SheetTrigger><SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto rounded-t-2xl bg-card"><SheetHeader><SheetTitle>Filtrar compromissos</SheetTitle><SheetDescription>Refine a agenda por responsável e situação.</SheetDescription></SheetHeader><div className="space-y-5 px-4">{responsavel}{situacao}{filtrosAtivos > 0 && <Button type="button" variant="secondary" className="w-full" onClick={() => { onLimparProfissional(); onStatus(padraoStatus) }}>Limpar filtros</Button>}</div><SheetFooter><SheetClose asChild><Button>Concluído</Button></SheetClose></SheetFooter></SheetContent></Sheet>
      </div>
    </div>
    <div className="hidden xl:flex xl:items-end xl:justify-between xl:gap-4">
      <div className="flex items-end gap-3">{navegacao}<p className="pb-2 font-semibold capitalize whitespace-nowrap">{periodo}</p></div>
      <div className="flex items-end gap-3"><div>{exibicao}</div>{podeGerir && <div className="w-64">{responsavel}</div>}<div>{situacao}</div></div>
    </div>
  </div>
}
