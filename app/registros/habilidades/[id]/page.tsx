"use client"

import { useParams } from "next/navigation"
import { useRegistrosData } from "@/lib/registros/data-context"
import { HabilidadeForm } from "@/components/registros/habilidade-form"

export default function EditarHabilidadePage() {
  const { id } = useParams<{ id: string }>()
  const { habilidades } = useRegistrosData()
  const habilidade = habilidades.find((h) => h.id === id)

  if (!habilidade) {
    return <p className="text-sm text-muted-foreground">Habilidade não encontrada.</p>
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Editar habilidade</h1>
        <p className="text-sm text-muted-foreground mt-1">{habilidade.nome}</p>
      </div>
      <HabilidadeForm habilidadeExistente={habilidade} />
    </div>
  )
}
