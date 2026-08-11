import { PacienteForm } from "@/components/registros/paciente-form"

export default function NovoPacientePage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Novo paciente</h1>
        <p className="text-sm text-muted-foreground mt-1">Cadastre um novo paciente vinculado a você.</p>
      </div>
      <PacienteForm />
    </div>
  )
}
