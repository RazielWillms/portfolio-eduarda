"use client"

import { useEffect, useState, type ReactNode } from "react"
import { usePathname, useRouter } from "next/navigation"
import { useAuth } from "@/lib/registros/auth-context"
import { RegistrosSidebarDesktop, RegistrosSidebarMobile } from "@/components/registros/sidebar"
import { RegistrosTopbar } from "@/components/registros/topbar"

const LOGIN_PATH = "/registros/login"

export function RegistrosGate({ children }: { children: ReactNode }) {
  const { user, carregando } = useAuth()
  const [menuAberto, setMenuAberto] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const isLoginPage = pathname === LOGIN_PATH

  useEffect(() => {
    if (carregando) return
    if (!user && !isLoginPage) {
      router.replace(LOGIN_PATH)
    }
    if (user && isLoginPage) {
      router.replace("/registros")
    }
  }, [carregando, user, isLoginPage, router])

  if (carregando) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-sm text-muted-foreground">Carregando...</p>
      </div>
    )
  }

  // Página de login: sem sidebar/topbar, layout próprio.
  if (isLoginPage) {
    return <>{children}</>
  }

  // Ainda não logado e a navegação para o login está em andamento.
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-sm text-muted-foreground">Redirecionando para o login...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex bg-background">
      <RegistrosSidebarDesktop />
      <RegistrosSidebarMobile open={menuAberto} onClose={() => setMenuAberto(false)} />
      <div className="flex-1 flex flex-col min-w-0">
        <RegistrosTopbar onOpenMenu={() => setMenuAberto(true)} />
        <main className="flex-1 p-4 lg:p-8">{children}</main>
      </div>
    </div>
  )
}
