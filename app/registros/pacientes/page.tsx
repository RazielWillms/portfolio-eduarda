"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { Plus, Search } from "lucide-react"
import { useAuth } from "@/lib/registros/auth-context"
import { useRegistrosData } from "@/lib/registros/data-context"
import { calcularIdade } from "@/lib/registros/types"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

export default function PacientesPage() {
  const { user } = useAuth()
  const { pacientesDoUsuario } = useRegistrosData()
  const [busca, setBusca] = useState("")

  const pacientes = user ? pacientesDoUsuario(user.id) : []

  const pacientesFiltrados = useMemo(() => {
    const termo = busca.trim().toLowerCase()
    if (!termo) return pacientes
    return pacientes.filter(
      (p) =>
        p.nomeCompleto.toLowerCase().includes(termo) || p.nomeResponsavel.toLowerCase().includes(termo),
    )
  }, [pacientes, busca])

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Pacientes</h1>
          <p className="text-sm text-muted-foreground mt-1">Pacientes vinculados a você.</p>
        </div>
        <Link href="/registros/pacientes/novo">
          <Button className="rounded-xl font-bold gap-2">
            <Plus className="size-4" />
            Novo paciente
          </Button>
        </Link>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por paciente ou responsável..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          className="pl-9"
        />
      </div>

      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Paciente</TableHead>
              <TableHead>Responsável</TableHead>
              <TableHead>Idade</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pacientesFiltrados.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                  Nenhum paciente encontrado.
                </TableCell>
              </TableRow>
            )}
            {pacientesFiltrados.map((p) => (
              <TableRow key={p.id} className="cursor-pointer">
                <TableCell>
                  <Link href={`/registros/pacientes/${p.id}`} className="font-semibold text-foreground hover:text-primary">
                    {p.nomeCompleto}
                  </Link>
                </TableCell>
                <TableCell className="text-muted-foreground">{p.nomeResponsavel}</TableCell>
                <TableCell className="text-muted-foreground">{calcularIdade(p.dataNascimento)} anos</TableCell>
                <TableCell>
                  <Badge variant={p.status === "ativo" ? "default" : "outline"}>
                    {p.status === "ativo" ? "Ativo" : "Inativo"}
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
