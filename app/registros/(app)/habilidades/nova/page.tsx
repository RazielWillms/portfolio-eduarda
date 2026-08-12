import { HabilidadeForm } from "@/components/registros/habilidade-form"
import { notFound } from "next/navigation"
import { getProfile } from "@/lib/registros/queries"

export default async function NovaHabilidadePage() {
  const profile = await getProfile()
  if (profile?.papel !== "admin") notFound()
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Nova habilidade</h1>
        <p className="text-sm text-muted-foreground mt-1">Cadastre uma habilidade ou recurso clínico.</p>
      </div>
      <HabilidadeForm />
    </div>
  )
}
