"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useRef } from "react"
import { Activity, BookOpenCheck, ClipboardCheck, ClipboardList, HeartHandshake, Home, Share2, Target, UserRoundCog, Users } from "lucide-react"
import { cn } from "@/lib/utils"

const itens=[
  ["","Visão geral",Home],["/sessoes","Sessões",ClipboardList],["/avaliacao","Avaliação",ClipboardCheck],["/planejamento","Planejamento",Target],
  ["/intervencao","Intervenção",BookOpenCheck],["/analise","Análise",Activity],["/participacao","Participação",HeartHandshake],
  ["/equipe","Equipe",Users],["/compartilhamento","Compartilhamento",Share2],["/cadastro","Cadastro",UserRoundCog],
] as const
export function PacienteNav({pacienteId}:{pacienteId:string}){const pathname=usePathname();const base=`/registros/pacientes/${pacienteId}`,navRef=useRef<HTMLElement>(null);useEffect(()=>{navRef.current?.querySelector('[aria-current="page"]')?.scrollIntoView({behavior:"smooth",block:"nearest",inline:"center"})},[pathname]);return <nav ref={navRef} aria-label="Navegação do paciente" className="mobile-tab-scroll -mx-3 overflow-x-auto px-3 pb-1 sm:-mx-4 sm:px-4 lg:mx-0 lg:px-0"><div className="flex min-w-max gap-1 rounded-xl border bg-card p-1">{itens.map(([sufixo,label,Icon])=>{const href=`${base}${sufixo}`;const ativo=sufixo===""?pathname===base:pathname.startsWith(href);return <Link key={href} href={href} aria-current={ativo?"page":undefined} className={cn("flex min-h-11 snap-start items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition-colors md:min-h-0",ativo?"bg-primary text-primary-foreground":"text-muted-foreground hover:bg-muted hover:text-foreground")}><Icon className="size-4"/>{label}</Link>})}</div></nav>}
