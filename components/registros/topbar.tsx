"use client"

import { Menu, LogOut } from "lucide-react"
import { signOut } from "@/lib/registros/actions"
import type { Profile } from "@/lib/registros/types"

const PAPEL_LABEL: Record<string, string> = {
  admin: "Administrador",
  profissional: "Profissional",
}

export function RegistrosTopbar({ profile, onOpenMenu }: { profile: Profile; onOpenMenu: () => void }) {
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
        <p className="text-base font-bold text-foreground">{profile.nome}</p>
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden sm:block text-right">
          <p className="text-sm font-semibold text-foreground">{profile.nome}</p>
          <p className="text-xs text-muted-foreground">{profile.admin_principal ? "Administrador principal" : PAPEL_LABEL[profile.papel]}</p>
        </div>
        <form action={signOut}>
          <button
            type="submit"
            className="flex items-center gap-2 rounded-xl border border-border px-3 py-2 text-sm font-semibold text-muted-foreground hover:text-destructive hover:border-destructive/40 transition-colors"
          >
            <LogOut className="size-4" />
            <span className="hidden sm:inline">Sair</span>
          </button>
        </form>
      </div>
    </header>
  )
}
