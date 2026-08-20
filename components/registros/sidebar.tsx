"use client"

import Link from "next/link"
import { useEffect,useState } from "react"
import { usePathname } from "next/navigation"
import { CalendarCheck2, CalendarDays, CircleHelp, KeyRound, LayoutDashboard, LoaderCircle, Users, Sparkles, ClipboardList, PanelLeftClose, PanelLeftOpen, UserCog, UserRoundCheck, X } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Papel } from "@/lib/registros/types"
import type { Permissao } from "@/lib/registros/permissoes"
import { MarcaConexao } from "@/components/registros/logo-conexao"

const linksComuns = [
  { href: "/registros", label: "Painel", icon: LayoutDashboard },
  { href: "/registros/agenda", label: "Agenda", icon: CalendarDays },
  { href: "/registros/frequencia", label: "Frequência", icon: CalendarCheck2 },
  { href: "/registros/pacientes", label: "Pacientes", icon: Users },
]

const linksClinicos = [
  { href: "/registros/solicitacoes", label: "Solicitações", icon: UserRoundCheck },
  { href: "/registros/habilidades", label: "Habilidades", icon: Sparkles },
  { href: "/registros/sessoes", label: "Sessões", icon: ClipboardList },
]

const linksAjuda = [
  { href: "/registros/guia", label: "Guia de uso", icon: CircleHelp },
  { href: "/registros/conta", label: "Minha conta", icon: KeyRound },
]

const linkAdmin = { href: "/registros/usuarios", label: "Usuários", icon: UserCog }

export function RegistrosSidebar({ papel, permissoes, onNavigate, recolhida=false }: { papel: Papel; permissoes?:Permissao[]; onNavigate?: () => void; recolhida?: boolean }) {
  const pathname = usePathname()
  const [navegando,setNavegando]=useState<string|null>(null)
  useEffect(()=>setNavegando(null),[pathname])
  const itens = [...linksComuns, ...linksClinicos, ...linksAjuda, ...(permissoes?.includes("usuarios.visualizar") || (!permissoes&&papel === "admin") ? [linkAdmin] : [])]

  return (
    <nav className={cn("flex flex-col gap-1",recolhida?"px-2 py-4":"p-4")}>
      {itens.map((item) => {
        const ativo = item.href === "/registros" ? pathname === item.href : pathname === item.href || pathname.startsWith(`${item.href}/`)
        const Icon = item.icon
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={()=>{if(item.href!==pathname)setNavegando(item.href);onNavigate?.()}}
            className={cn(
              "flex items-center rounded-xl py-2.5 text-sm font-semibold transition-colors",
              recolhida?"justify-center px-2":"gap-3 px-3",
              ativo
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
            title={recolhida?item.label:undefined}
            aria-label={recolhida?item.label:undefined}
          >
            {navegando===item.href?<LoaderCircle className="size-4.5 shrink-0 animate-spin"/>:<Icon className="size-4.5 shrink-0" />}
            {!recolhida&&item.label}
          </Link>
        )
      })}
    </nav>
  )
}

export function RegistrosSidebarDesktop({ papel,permissoes,recolhida,onAlternar }: { papel: Papel;permissoes?:Permissao[];recolhida:boolean;onAlternar:()=>void }) {
  return (
    <aside className={cn("sticky top-0 hidden h-screen shrink-0 flex-col overflow-y-auto border-r border-border bg-card transition-[width] duration-200 print:hidden lg:flex",recolhida?"w-20":"w-64")}>
      <div className={cn("flex h-20 shrink-0 items-center justify-between border-b border-border",recolhida?"px-1":"gap-2 px-5")}>
        <MarcaConexao compacta={recolhida} />
        <button type="button"onClick={onAlternar}className={cn("flex items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-slate-200 hover:text-foreground",recolhida?"size-8":"size-9")}aria-label={recolhida?"Expandir menu lateral":"Recolher menu lateral"}title={recolhida?"Expandir menu":"Recolher menu"}>
          {recolhida?<PanelLeftOpen className="size-5"/>:<PanelLeftClose className="size-5"/>}
        </button>
      </div>
      <RegistrosSidebar papel={papel} permissoes={permissoes} recolhida={recolhida}/>
    </aside>
  )
}

export function RegistrosSidebarMobile({
  papel,
  permissoes,
  open,
  onClose,
}: {
  papel: Papel
  permissoes?:Permissao[]
  open: boolean
  onClose: () => void
}) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 print:hidden lg:hidden">
      <div className="absolute inset-0 bg-foreground/40 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />
      <aside className="absolute left-0 top-0 h-full w-72 bg-card border-r border-border flex flex-col">
        <div className="flex items-center justify-between px-5 py-5 border-b border-border">
          <MarcaConexao />
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-muted transition-colors" aria-label="Fechar menu">
            <X className="size-5" />
          </button>
        </div>
        <RegistrosSidebar papel={papel} permissoes={permissoes} onNavigate={onClose} />
      </aside>
    </div>
  )
}
