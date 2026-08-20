"use client"

import { Menu, LogOut } from "lucide-react"
import { signOut } from "@/lib/registros/actions"
import type { Profile } from "@/lib/registros/types"
import { FotoAvatar } from "@/components/registros/foto-avatar"
import { MarcaConexao } from "@/components/registros/logo-conexao"

const PAPEL_LABEL: Record<string, string> = {
  admin: "Administrador",
  profissional: "Profissional",
  coordenacao: "Coordenação",
}

export function RegistrosTopbar({ profile, onOpenMenu }: { profile: Profile; onOpenMenu: () => void }) {
  return (
    <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-border bg-card/95 px-3 backdrop-blur-sm sm:px-4 lg:static lg:h-20 lg:bg-card lg:px-6 lg:backdrop-blur-none">
      <div className="flex min-w-0 items-center gap-2 lg:hidden"><button className="shrink-0 rounded-lg p-2 transition-colors hover:bg-muted" onClick={onOpenMenu} aria-label="Abrir menu"><Menu className="size-5" /></button><MarcaConexao compacta/></div>

      <div className="hidden lg:block">
        <p className="text-sm text-muted-foreground">Bem-vindo(a) de volta,</p>
        <p className="text-base font-bold text-foreground">{profile.nome}</p>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        <FotoAvatar nome={profile.nome} src={profile.foto_url} zoom={profile.foto_zoom} posX={profile.foto_pos_x} posY={profile.foto_pos_y} className="size-8 sm:size-9" fallbackClassName="text-xs" />
        <div className="hidden sm:block text-right">
          <p className="text-sm font-semibold text-foreground">{profile.nome}</p>
          <p className="text-xs text-muted-foreground">{profile.admin_principal ? "Administrador principal" : PAPEL_LABEL[profile.papel]}</p>
        </div>
        <form action={signOut}>
          <button
            type="submit"
            className="flex size-9 items-center justify-center rounded-xl border border-border text-sm font-semibold text-muted-foreground transition-colors hover:border-destructive/40 hover:text-destructive sm:h-auto sm:w-auto sm:gap-2 sm:px-3 sm:py-2"
          >
            <LogOut className="size-4" />
            <span className="hidden sm:inline">Sair</span>
          </button>
        </form>
      </div>
    </header>
  )
}
