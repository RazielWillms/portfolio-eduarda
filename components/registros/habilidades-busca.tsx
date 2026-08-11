"use client"

import { useMemo, useState, type ReactNode } from "react"
import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import type { Habilidade } from "@/lib/registros/types"

export function HabilidadesBusca({
  habilidades,
  children,
}: {
  habilidades: Habilidade[]
  children: (habilidadesFiltradas: Habilidade[]) => ReactNode
}) {
  const [busca, setBusca] = useState("")

  const habilidadesFiltradas = useMemo(() => {
    const termo = busca.trim().toLowerCase()
    if (!termo) return habilidades
    return habilidades.filter(
      (h) => h.nome.toLowerCase().includes(termo) || (h.categoria ?? "").toLowerCase().includes(termo),
    )
  }, [habilidades, busca])

  return (
    <div className="flex flex-col gap-6">
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por nome ou categoria..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          className="pl-9"
        />
      </div>
      {children(habilidadesFiltradas)}
    </div>
  )
}
