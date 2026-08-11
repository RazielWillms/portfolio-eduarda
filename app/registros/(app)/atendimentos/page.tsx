import Link from "next/link"
import { Plus } from "lucide-react"
import { getAtendimentos } from "@/lib/registros/queries"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

export default async function AtendimentosPage() {
  const atendimentos = await getAtendimentos()

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
            {atendimentos.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                  Nenhum atendimento registrado ainda.
                </TableCell>
              </TableRow>
            )}
            {atendimentos.map((a) => (
              <TableRow key={a.id}>
                <TableCell className="text-muted-foreground whitespace-nowrap">
                  {new Date(a.data).toLocaleDateString("pt-BR")}
                </TableCell>
                <TableCell className="font-semibold text-foreground">{a.paciente.nome_completo}</TableCell>
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
  )
}
