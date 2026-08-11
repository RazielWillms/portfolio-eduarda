"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { Plus, Search } from "lucide-react"
import { useRegistrosData } from "@/lib/registros/data-context"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

export default function HabilidadesPage() {
  const { habilidades } = useRegistrosData()
  const [busca, setBusca] = useState("")

  const habilidadesFiltradas = useMemo(() => {
    const termo = busca.trim().toLowerCase()
    if (!termo) return habilidades
    return habilidades.filter(
      (h) => h.nome.toLowerCase().includes(termo) || h.categoria.toLowerCase().includes(termo),
    )
  }, [habilidades, busca])

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

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por nome ou categoria..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          className="pl-9"
        />
      </div>

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
                <TableCell className="text-muted-foreground">{h.categoria}</TableCell>
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
    </div>
  )
}
