import Link from "next/link"
import { Plus } from "lucide-react"
import { getHabilidades, getProfile } from "@/lib/registros/queries"
import { Button } from "@/components/ui/button"
import { HabilidadesBusca } from "@/components/registros/habilidades-busca"

export default async function HabilidadesPage() {
  const [habilidades, profile] = await Promise.all([getHabilidades(), getProfile()])
  const podeGerenciar = profile?.papel === "admin"

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Habilidades</h1>
          <p className="text-sm text-muted-foreground mt-1">Catálogo de habilidades e recursos clínicos.</p>
        </div>
        {podeGerenciar && <Link href="/registros/habilidades/nova" aria-label="Nova habilidade" title="Nova habilidade">
          <Button size="icon" className="shrink-0 rounded-xl font-bold sm:!h-9 sm:!w-auto sm:px-4">
            <Plus className="size-4" />
            <span className="hidden sm:inline">Nova habilidade</span>
          </Button>
        </Link>}
      </div>

      <HabilidadesBusca habilidades={habilidades} podeGerenciar={podeGerenciar} />
    </div>
  )
}
