"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Activity, ClipboardList, Handshake, Home, Network, ShieldCheck, Target } from "lucide-react"
import { cn } from "@/lib/utils"

const itens = [
  ["", "Visão geral", Home],
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
  return <nav className="flex gap-1 overflow-x-auto rounded-xl border bg-card p-1">{itens.map(([sufixo, label, Icon]) => {const href=base+sufixo; const ativo=sufixo?pathname.startsWith(href):pathname===href; return <Link key={href} href={href} className={cn("flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold",ativo?"bg-primary text-primary-foreground":"text-muted-foreground hover:bg-muted hover:text-foreground")}><Icon className="size-4" />{label}</Link>})}</nav>
}

