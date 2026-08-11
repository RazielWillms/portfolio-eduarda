import Link from "next/link"
import { Plus } from "lucide-react"
import { getPacientes } from "@/lib/registros/queries"
import { calcularIdade } from "@/lib/registros/types"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { PacientesBusca } from "@/components/registros/pacientes-busca"

export default async function PacientesPage() {
  const pacientes = await getPacientes()

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

      <PacientesBusca pacientes={pacientes}>
        {(pacientesFiltrados) => (
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
                      <TableCell className="text-muted-foreground">
                        {idade !== null ? `${idade} anos` : "—"}
                      </TableCell>
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
        )}
      </PacientesBusca>
    </div>
  )
}
