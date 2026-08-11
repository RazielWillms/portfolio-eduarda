"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, Users, Sparkles, ClipboardList, UserCog, X } from "lucide-react"
import { useAuth } from "@/lib/registros/auth-context"
import { cn } from "@/lib/utils"

const links = [
  { href: "/registros", label: "Painel", icon: LayoutDashboard },
  { href: "/registros/pacientes", label: "Pacientes", icon: Users },
  { href: "/registros/habilidades", label: "Habilidades", icon: Sparkles },
  { href: "/registros/atendimentos", label: "Atendimentos", icon: ClipboardList },
]

const linkAdmin = { href: "/registros/usuarios", label: "Usuários", icon: UserCog }

export function RegistrosSidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname()
  const { user } = useAuth()

  const itens = user?.papel === "admin" ? [...links, linkAdmin] : links

  return (
    <nav className="flex flex-col gap-1 p-4">
      {itens.map((item) => {
        const ativo = pathname === item.href
        const Icon = item.icon
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors",
              ativo
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            <Icon className="size-4.5" />
            {item.label}
          </Link>
        )
      })}
    </nav>
  )
}

export function RegistrosSidebarDesktop() {
  return (
    <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:border-r lg:border-border bg-card">
      <div className="flex items-center gap-2 px-5 py-5 border-b border-border">
        <div className="flex size-9 items-center justify-center rounded-full bg-primary font-bold text-primary-foreground text-sm">
          E
        </div>
        <div className="leading-tight">
          <p className="text-sm font-bold text-foreground">Registros ABA</p>
          <p className="text-xs text-muted-foreground">Área profissional</p>
        </div>
      </div>
      <RegistrosSidebar />
    </aside>
  )
}

export function RegistrosSidebarMobile({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) {
  if (!open) return null

  return (
    <div className="lg:hidden fixed inset-0 z-50">
      <div className="absolute inset-0 bg-foreground/40 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />
      <aside className="absolute left-0 top-0 h-full w-72 bg-card border-r border-border flex flex-col">
        <div className="flex items-center justify-between px-5 py-5 border-b border-border">
          <div className="flex items-center gap-2">
            <div className="flex size-9 items-center justify-center rounded-full bg-primary font-bold text-primary-foreground text-sm">
              E
            </div>
            <p className="text-sm font-bold text-foreground">Registros ABA</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-muted transition-colors" aria-label="Fechar menu">
            <X className="size-5" />
          </button>
        </div>
        <RegistrosSidebar onNavigate={onClose} />
      </aside>
    </div>
  )
}
