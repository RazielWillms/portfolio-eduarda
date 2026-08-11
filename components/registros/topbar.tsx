"use client"

import { Menu, LogOut } from "lucide-react"
import { useAuth } from "@/lib/registros/auth-context"

const PAPEL_LABEL: Record<string, string> = {
  admin: "Administrador",
  psicologo: "Psicólogo(a)",
}

export function RegistrosTopbar({ onOpenMenu }: { onOpenMenu: () => void }) {
  const { user, logout } = useAuth()

  return (
    <header className="flex items-center justify-between border-b border-border bg-card px-4 py-3 lg:px-6">
      <button
        className="lg:hidden p-2 rounded-lg hover:bg-muted transition-colors"
        onClick={onOpenMenu}
        aria-label="Abrir menu"
      >
        <Menu className="size-5" />
      </button>

      <div className="hidden lg:block">
        <p className="text-sm text-muted-foreground">Bem-vindo(a) de volta,</p>
        <p className="text-base font-bold text-foreground">{user?.nome}</p>
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden sm:block text-right">
          <p className="text-sm font-semibold text-foreground">{user?.nome}</p>
          <p className="text-xs text-muted-foreground">{user ? PAPEL_LABEL[user.papel] : ""}</p>
        </div>
        <button
          onClick={logout}
          className="flex items-center gap-2 rounded-xl border border-border px-3 py-2 text-sm font-semibold text-muted-foreground hover:text-destructive hover:border-destructive/40 transition-colors"
        >
          <LogOut className="size-4" />
          <span className="hidden sm:inline">Sair</span>
        </button>
      </div>
    </header>
  )
}
