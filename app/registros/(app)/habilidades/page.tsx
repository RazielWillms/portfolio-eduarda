import Link from "next/link"
import { Plus } from "lucide-react"
import { getHabilidades } from "@/lib/registros/queries"
import { Button } from "@/components/ui/button"
import { HabilidadesBusca } from "@/components/registros/habilidades-busca"

export default async function HabilidadesPage() {
  const habilidades = await getHabilidades()

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Habilidades</h1>
          <p className="text-sm text-muted-foreground mt-1">Habilidades e recursos trabalhados nos atendimentos.</p>
        </div>
        <Link href="/registros/habilidades/nova">
          <Button className="rounded-xl font-bold gap-2">
            <Plus className="size-4" />
            Nova habilidade
          </Button>
        </Link>
      </div>

      <HabilidadesBusca habilidades={habilidades} />
    </div>
  )
}
