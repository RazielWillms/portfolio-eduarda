"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Activity, BookOpenCheck, ClipboardCheck, ClipboardList, HeartHandshake, Home, Share2, Target, UserRoundCog, Users } from "lucide-react"
import { cn } from "@/lib/utils"

const itens=[
  ["","Visão geral",Home],["/sessoes","Sessões",ClipboardList],["/avaliacao","Avaliação",ClipboardCheck],["/planejamento","Planejamento",Target],
  ["/intervencao","Intervenção",BookOpenCheck],["/analise","Análise",Activity],["/participacao","Participação",HeartHandshake],
  ["/equipe","Equipe",Users],["/compartilhamento","Compartilhamento",Share2],["/cadastro","Cadastro",UserRoundCog],
] as const
export function PacienteNav({pacienteId}:{pacienteId:string}){const pathname=usePathname();const base=`/registros/pacientes/${pacienteId}`;return <nav aria-label="Navegação do paciente" className="overflow-x-auto pb-1"><div className="flex min-w-max gap-1 rounded-xl border bg-card p-1">{itens.map(([sufixo,label,Icon])=>{const href=`${base}${sufixo}`;const ativo=sufixo===""?pathname===base:pathname.startsWith(href);return <Link key={href} href={href} className={cn("flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition-colors",ativo?"bg-primary text-primary-foreground":"text-muted-foreground hover:bg-muted hover:text-foreground")}><Icon className="size-4"/>{label}</Link>})}</div></nav>}
