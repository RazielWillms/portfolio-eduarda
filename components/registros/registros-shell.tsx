"use client"

import { useEffect, useState, type ReactNode } from "react"
import { RegistrosSidebarDesktop, RegistrosSidebarMobile } from "@/components/registros/sidebar"
import { RegistrosTopbar } from "@/components/registros/topbar"
import type { Profile } from "@/lib/registros/types"

export function RegistrosShell({ profile, children }: { profile: Profile; children: ReactNode }) {
  const [menuAberto, setMenuAberto] = useState(false)
  const [sidebarRecolhida,setSidebarRecolhida]=useState(false)
  useEffect(()=>{setSidebarRecolhida(localStorage.getItem("registros-sidebar-recolhida")==="1")},[])
  function alternarSidebar(){setSidebarRecolhida(valor=>{const novo=!valor;localStorage.setItem("registros-sidebar-recolhida",novo?"1":"0");return novo})}
  useEffect(()=>{if(!menuAberto)return;const anterior=document.body.style.overflow;document.body.style.overflow="hidden";return()=>{document.body.style.overflow=anterior}},[menuAberto])

  return (
    <div className="registros-form-scope flex min-h-screen items-stretch bg-background">
      <RegistrosSidebarDesktop papel={profile.papel} permissoes={profile.permissoes} recolhida={sidebarRecolhida} onAlternar={alternarSidebar}/>
      <RegistrosSidebarMobile papel={profile.papel} permissoes={profile.permissoes} open={menuAberto} onClose={() => setMenuAberto(false)} />
      <div className="flex min-w-0 flex-1 flex-col overflow-x-hidden">
        <div className="print:hidden"><RegistrosTopbar profile={profile} onOpenMenu={() => setMenuAberto(true)} /></div>
        <main className="min-w-0 flex-1 px-3 py-4 print:p-0 sm:px-4 lg:px-6 lg:py-8 lg:print:p-0">{children}</main>
      </div>
    </div>
  )
}
