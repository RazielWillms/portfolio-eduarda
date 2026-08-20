"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { calcularIdade, type Paciente } from "@/lib/registros/types"

export function PacientesBusca({ pacientes }: { pacientes: Paciente[] }) {
  const [busca, setBusca] = useState("")

  const pacientesFiltrados = useMemo(() => {
    const termo = busca.trim().toLowerCase()
    if (!termo) return pacientes
    return pacientes.filter(
      (p) =>
        p.nome_completo.toLowerCase().includes(termo) ||
        (p.nome_responsavel ?? "").toLowerCase().includes(termo),
    )
  }, [pacientes, busca])

  return (
    <div className="flex flex-col gap-6">
      <div className="relative w-full sm:max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por paciente ou responsável..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          className="pl-9"
        />
      </div>
      <div className="space-y-3 md:hidden">
        {pacientesFiltrados.map((p) => { const idade=calcularIdade(p.data_nascimento); return <Link key={p.id} href={`/registros/pacientes/${p.id}`} className="block rounded-2xl border bg-card p-4 transition-colors active:bg-muted"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="break-words font-semibold">{p.nome_completo}</p><p className="mt-1 text-sm text-muted-foreground">Responsável: {p.nome_responsavel??"—"}</p><p className="text-sm text-muted-foreground">{idade!==null?`${idade} anos`:"Idade não informada"}</p></div><Badge variant={p.status==="ativo"?"default":"outline"}>{p.status==="ativo"?"Ativo":"Inativo"}</Badge></div></Link> })}
        {pacientesFiltrados.length===0&&<div className="rounded-2xl border border-dashed p-8 text-center text-sm text-muted-foreground">Nenhum paciente encontrado.</div>}
      </div>
      <div className="hidden overflow-hidden rounded-2xl border border-border bg-card md:block">
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
            {pacientesFiltrados.map((p) => {
              const idade = calcularIdade(p.data_nascimento)
              return (
                <TableRow key={p.id} className="cursor-pointer">
                  <TableCell>
                    <Link
                      href={`/registros/pacientes/${p.id}`}
                      className="font-semibold text-foreground hover:text-primary"
                    >
                      {p.nome_completo}
                    </Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{p.nome_responsavel ?? "—"}</TableCell>
                  <TableCell className="text-muted-foreground">{idade !== null ? `${idade} anos` : "—"}</TableCell>
                  <TableCell>
                    <Badge variant={p.status === "ativo" ? "default" : "outline"}>
                      {p.status === "ativo" ? "Ativo" : "Inativo"}
                    </Badge>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
