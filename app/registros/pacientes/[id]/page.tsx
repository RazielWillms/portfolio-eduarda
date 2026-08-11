"use client"

import { useParams } from "next/navigation"
import { useRegistrosData } from "@/lib/registros/data-context"
import { PacienteForm } from "@/components/registros/paciente-form"

export default function EditarPacientePage() {
  const params = useParams<{ id: string }>()
  const { pacientes } = useRegistrosData()
  const paciente = pacientes.find((p) => p.id === params.id)

  if (!paciente) {
    return (
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold text-foreground">Paciente não encontrado</h1>
        <p className="text-sm text-muted-foreground">Verifique se o link está correto.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">{paciente.nomeCompleto}</h1>
        <p className="text-sm text-muted-foreground mt-1">Editar dados do paciente.</p>
      </div>
      <PacienteForm pacienteExistente={paciente} />
    </div>
  )
}
