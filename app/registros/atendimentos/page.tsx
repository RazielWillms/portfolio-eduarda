"use client"

import { useMemo } from "react"
import Link from "next/link"
import { Plus } from "lucide-react"
import { useAuth } from "@/lib/registros/auth-context"
import { useRegistrosData } from "@/lib/registros/data-context"
import { nivelPorCodigo } from "@/lib/registros/types"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

export default function AtendimentosPage() {
  const { user } = useAuth()
  const { atendimentosDoUsuario, pacientes, habilidades } = useRegistrosData()

  const atendimentos = user ? atendimentosDoUsuario(user.id) : []

  const linhas = useMemo(
    () =>
      atendimentos.map((a) => ({
        atendimento: a,
        paciente: pacientes.find((p) => p.id === a.pacienteId),
        habilidade: habilidades.find((h) => h.id === a.habilidadeId),
        nivel: nivelPorCodigo(a.nota),
      })),
    [atendimentos, pacientes, habilidades],
  )

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Atendimentos</h1>
          <p className="text-sm text-muted-foreground mt-1">Registros de atendimento vinculados a você.</p>
        </div>
        <Link href="/registros/atendimentos/novo">
          <Button className="rounded-xl font-bold gap-2">
            <Plus className="size-4" />
            Novo atendimento
          </Button>
        </Link>
      </div>

      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data</TableHead>
              <TableHead>Paciente</TableHead>
              <TableHead>Habilidade</TableHead>
              <TableHead>Avaliação</TableHead>
              <TableHead>Observações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {linhas.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                  Nenhum atendimento registrado ainda.
                </TableCell>
              </TableRow>
            )}
            {linhas.map(({ atendimento, paciente, habilidade, nivel }) => (
              <TableRow key={atendimento.id}>
                <TableCell className="text-muted-foreground whitespace-nowrap">
                  {new Date(atendimento.data).toLocaleDateString("pt-BR")}
                </TableCell>
                <TableCell className="font-semibold text-foreground">{paciente?.nomeCompleto ?? "—"}</TableCell>
                <TableCell className="text-muted-foreground">{habilidade?.nome ?? "—"}</TableCell>
                <TableCell>
                  <Badge variant={nivel && nivel.valor === 1 ? "default" : "outline"}>
                    {nivel?.codigo ?? atendimento.nota}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground max-w-xs truncate">
                  {atendimento.observacoes || "—"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
