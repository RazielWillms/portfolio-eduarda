import { notFound } from "next/navigation"
import { getHabilidade, getProfile } from "@/lib/registros/queries"
import { HabilidadeForm } from "@/components/registros/habilidade-form"
import { HabilidadeExclusao } from "@/components/registros/habilidade-exclusao"

export default async function EditarHabilidadePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const [habilidade, profile] = await Promise.all([getHabilidade(id), getProfile()])

  if (!habilidade || profile?.papel !== "admin") {
    notFound()
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Editar habilidade</h1>
        <p className="text-sm text-muted-foreground mt-1">{habilidade.nome}</p>
      </div>
      <HabilidadeForm habilidadeExistente={habilidade} />
      <HabilidadeExclusao id={habilidade.id} />
    </div>
  )
}
