import Link from "next/link"
import { Plus } from "lucide-react"
import { getPacientes } from "@/lib/registros/queries"
import { Button } from "@/components/ui/button"
import { PacientesBusca } from "@/components/registros/pacientes-busca"

export default async function PacientesPage() {
  const pacientes = await getPacientes()

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Pacientes</h1>
          <p className="text-sm text-muted-foreground mt-1">Pacientes vinculados a você.</p>
        </div>
        <Link href="/registros/pacientes/novo">
          <Button className="rounded-xl font-bold gap-2">
            <Plus className="size-4" />
            Novo paciente
          </Button>
        </Link>
      </div>

      <PacientesBusca pacientes={pacientes} />
    </div>
  )
}
