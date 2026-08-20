"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Activity, ClipboardCheck, ClipboardList, Handshake, Home, Network, ShieldCheck, Target } from "lucide-react"
import { cn } from "@/lib/utils"

const itens = [
  ["", "Visão geral", Home],
  ["/avaliacao", "Avaliação", ClipboardCheck],
  ["/planejamento", "Planejamento", Target],
  ["/intervencao", "Intervenção", ShieldCheck],
  ["/sessoes", "Sessões", ClipboardList],
  ["/analise", "Análise", Activity],
  ["/participacao", "Participação", Handshake],
  ["/equipe", "Equipe", Network],
] as const

export function DemonstracaoPacienteNav({ pacienteId }: { pacienteId: string }) {
  const pathname = usePathname()
  const base = `/registros/demonstracao/pacientes/${pacienteId}`
  return <nav className="mobile-tab-scroll -mx-3 flex gap-1 overflow-x-auto px-3 sm:-mx-4 sm:px-4 lg:mx-0 lg:rounded-xl lg:border lg:bg-card lg:p-1">{itens.map(([sufixo, label, Icon]) => {const href=base+sufixo; const ativo=sufixo?pathname.startsWith(href):pathname===href; return <Link key={href} href={href} aria-current={ativo?"page":undefined} className={cn("flex min-h-11 shrink-0 snap-start items-center gap-2 rounded-lg border bg-card px-3 py-2 text-sm font-semibold lg:min-h-0 lg:border-0",ativo?"bg-primary text-primary-foreground":"text-muted-foreground hover:bg-muted hover:text-foreground")}><Icon className="size-4" />{label}</Link>})}</nav>
}
