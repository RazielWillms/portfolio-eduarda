"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import type { Habilidade } from "@/lib/registros/types"

export function HabilidadesBusca({ habilidades, podeGerenciar = false }: { habilidades: Habilidade[]; podeGerenciar?: boolean }) {
  const [busca, setBusca] = useState("")

  const habilidadesFiltradas = useMemo(() => {
    const termo = busca.trim().toLowerCase()
    if (!termo) return habilidades
    return habilidades.filter(
      (h) => h.nome.toLowerCase().includes(termo) || (h.categoria ?? "").toLowerCase().includes(termo),
    )
  }, [habilidades, busca])

  return (
    <div className="flex flex-col gap-6">
      <div className="relative w-full sm:max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por nome ou categoria..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          className="pl-9"
        />
      </div>
      <div className="space-y-3 md:hidden">
        {habilidadesFiltradas.map((h)=><div key={h.id} className="rounded-2xl border bg-card p-4"><div className="flex items-start justify-between gap-3"><div className="min-w-0">{podeGerenciar?<Link href={`/registros/habilidades/${h.id}`} className="break-words font-semibold text-foreground">{h.nome}</Link>:<p className="break-words font-semibold">{h.nome}</p>}<p className="mt-1 text-sm text-muted-foreground">{h.categoria??"Sem categoria"} · Peso {h.peso.toFixed(1)}</p>{h.descricao&&<p className="mt-2 text-xs text-muted-foreground">{h.descricao}</p>}</div><Badge variant={h.status==="ativa"?"default":"outline"}>{h.status==="ativa"?"Ativa":"Inativa"}</Badge></div></div>)}
        {habilidadesFiltradas.length===0&&<div className="rounded-2xl border border-dashed p-8 text-center text-sm text-muted-foreground">Nenhuma habilidade encontrada.</div>}
      </div>
      <div className="hidden overflow-hidden rounded-2xl border border-border bg-card md:block">
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
                  {podeGerenciar ? <Link
                    href={`/registros/habilidades/${h.id}`}
                    className="font-semibold text-foreground hover:text-primary"
                  >
                    {h.nome}
                  </Link> : <span className="font-semibold text-foreground">{h.nome}</span>}
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
    </div>
  )
}
