import { notFound } from "next/navigation"
import { getPaciente, getAtendimentosPorPaciente } from "@/lib/registros/queries"
import { PacienteForm } from "@/components/registros/paciente-form"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

export default async function EditarPacientePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const [paciente, atendimentos] = await Promise.all([getPaciente(id), getAtendimentosPorPaciente(id)])

  if (!paciente) {
    notFound()
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">{paciente.nome_completo}</h1>
        <p className="text-sm text-muted-foreground mt-1">Editar dados do paciente.</p>
      </div>

      <PacienteForm pacienteExistente={paciente} />

      <div className="flex flex-col gap-4">
        <h2 className="text-lg font-bold text-foreground">Histórico de atendimentos</h2>
        <div className="rounded-2xl border border-border bg-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Habilidade</TableHead>
                <TableHead>Avaliação</TableHead>
                <TableHead>Observações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {atendimentos.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                    Nenhum atendimento registrado para este paciente ainda.
                  </TableCell>
                </TableRow>
              )}
              {atendimentos.map((a) => (
                <TableRow key={a.id}>
                  <TableCell className="text-muted-foreground whitespace-nowrap">
                    {new Date(a.data).toLocaleDateString("pt-BR")}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{a.habilidade.nome}</TableCell>
                  <TableCell>
                    <Badge variant={a.nivel_avaliacao.valor === 1 ? "default" : "outline"}>
                      {a.nivel_avaliacao.codigo}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground max-w-xs truncate">{a.observacoes || "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  )
}
