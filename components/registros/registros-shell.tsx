"use client"

import { useState, type ReactNode } from "react"
import { RegistrosSidebarDesktop, RegistrosSidebarMobile } from "@/components/registros/sidebar"
import { RegistrosTopbar } from "@/components/registros/topbar"
import type { Profile } from "@/lib/registros/types"

export function RegistrosShell({ profile, children }: { profile: Profile; children: ReactNode }) {
  const [menuAberto, setMenuAberto] = useState(false)

  return (
    <div className="registros-form-scope min-h-screen flex bg-background">
      <RegistrosSidebarDesktop papel={profile.papel} />
      <RegistrosSidebarMobile papel={profile.papel} open={menuAberto} onClose={() => setMenuAberto(false)} />
      <div className="flex-1 flex flex-col min-w-0">
        <RegistrosTopbar profile={profile} onOpenMenu={() => setMenuAberto(true)} />
        <main className="flex-1 p-4 lg:px-6 lg:py-8">{children}</main>
      </div>
    </div>
  )
}
