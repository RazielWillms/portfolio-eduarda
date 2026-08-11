"use client"

import { useMemo, useState, type ReactNode } from "react"
import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import type { Paciente } from "@/lib/registros/types"

export function PacientesBusca({
  pacientes,
  children,
}: {
  pacientes: Paciente[]
  children: (pacientesFiltrados: Paciente[]) => ReactNode
}) {
  const [busca, setBusca] = useState("")

  const pacientesFiltrados = useMemo(() => {
    const termo = busca.trim().toLowerCase()
    if (!termo) return pacientes
    return pacientes.filter(
      (p) =>
        p.nome_completo.toLowerCase().includes(termo) ||
        (p.nome_responsavel ?? "").toLowerCase().includes(termo),
    )
  }, [pacientes, busca])

  return (
    <div className="flex flex-col gap-6">
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por paciente ou responsável..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          className="pl-9"
        />
      </div>
      {children(pacientesFiltrados)}
    </div>
  )
}
