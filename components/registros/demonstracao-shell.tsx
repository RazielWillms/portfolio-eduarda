"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { ArrowLeft, BarChart3, Eye, LayoutDashboard, LockKeyhole, Users } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const links = [
  { href: "/registros/demonstracao", label: "Painel", icon: LayoutDashboard },
  { href: "/registros/demonstracao/pacientes", label: "Pacientes", icon: Users },
  { href: "/registros/demonstracao/sessoes", label: "Sessões", icon: BarChart3 },
]

export function DemonstracaoShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  return <div className="space-y-5">
    <header className="rounded-2xl border border-primary/30 bg-primary/5 p-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div><div className="mb-1 flex flex-wrap gap-2"><Badge><Eye className="mr-1 size-3" />Modo demonstração</Badge><Badge variant="outline"><LockKeyhole className="mr-1 size-3" />Somente leitura</Badge></div><p className="text-sm text-muted-foreground">Navegação simulada com dados exclusivamente fictícios.</p></div>
        <Button asChild variant="outline" size="sm"><Link href="/registros/guia"><ArrowLeft className="size-4" />Sair da demonstração</Link></Button>
      </div>
      <nav className="mt-4 flex gap-1 overflow-x-auto border-t pt-3">{links.map((item) => { const Icon=item.icon; const ativo=item.href==="/registros/demonstracao"?pathname===item.href:pathname.startsWith(item.href); return <Link key={item.href} href={item.href} className={cn("flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold",ativo?"bg-primary text-primary-foreground":"text-muted-foreground hover:bg-muted hover:text-foreground")}><Icon className="size-4" />{item.label}</Link> })}</nav>
    </header>
    {children}
  </div>
}

