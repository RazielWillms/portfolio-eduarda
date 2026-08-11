import Link from "next/link"
import { Plus } from "lucide-react"
import { getHabilidades } from "@/lib/registros/queries"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
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

      <HabilidadesBusca habilidades={habilidades}>
        {(habilidadesFiltradas) => (
          <div className="rounded-2xl border border-border bg-card overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Habilidade</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Peso</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {habilidadesFiltradas.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                      Nenhuma habilidade encontrada.
                    </TableCell>
                  </TableRow>
                )}
                {habilidadesFiltradas.map((h) => (
                  <TableRow key={h.id}>
                    <TableCell>
                      <Link
                        href={`/registros/habilidades/${h.id}`}
                        className="font-semibold text-foreground hover:text-primary"
                      >
                        {h.nome}
                      </Link>
                      {h.descricao && <p className="text-xs text-muted-foreground mt-0.5 max-w-sm">{h.descricao}</p>}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{h.categoria ?? "—"}</TableCell>
                    <TableCell className="text-muted-foreground">{h.peso.toFixed(1)}</TableCell>
                    <TableCell>
                      <Badge variant={h.status === "ativa" ? "default" : "outline"}>
                        {h.status === "ativa" ? "Ativa" : "Inativa"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </HabilidadesBusca>
    </div>
  )
}
