import { HabilidadeForm } from "@/components/registros/habilidade-form"

export default function NovaHabilidadePage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Nova habilidade</h1>
        <p className="text-sm text-muted-foreground mt-1">Cadastre uma habilidade ou recurso a ser trabalhado nos atendimentos.</p>
      </div>
      <HabilidadeForm />
    </div>
  )
}
