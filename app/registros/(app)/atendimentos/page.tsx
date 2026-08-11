import Link from "next/link"
import { Plus } from "lucide-react"
import { getAtendimentos, getAtendimentosExcluidos, getProfile } from "@/lib/registros/queries"
import { AtendimentoAcoes } from "@/components/registros/atendimento-acoes"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

export default async function AtendimentosPage() {
  const [atendimentos, excluidos, profile] = await Promise.all([getAtendimentos(), getAtendimentosExcluidos(), getProfile()])
  const excluidosProprios = excluidos.filter((a) => a.psicologo_id === profile?.id)
  return <div className="flex flex-col gap-6">
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"><div><h1 className="text-2xl font-bold">Atendimentos</h1><p className="text-sm text-muted-foreground mt-1">Registros de atendimento vinculados a você.</p></div><Button asChild className="rounded-xl font-bold gap-2"><Link href="/registros/atendimentos/novo"><Plus className="size-4" />Novo atendimento</Link></Button></div>
    <div className="rounded-2xl border bg-card overflow-x-auto"><Table><TableHeader><TableRow><TableHead>Data</TableHead><TableHead>Paciente</TableHead><TableHead>Habilidade</TableHead><TableHead>Avaliação</TableHead><TableHead>Observações</TableHead><TableHead><span className="sr-only">Ações</span></TableHead></TableRow></TableHeader><TableBody>{atendimentos.length === 0 && <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">Nenhum atendimento registrado ainda.</TableCell></TableRow>}{atendimentos.map((a) => <TableRow key={a.id}><TableCell className="text-muted-foreground whitespace-nowrap">{new Date(`${a.data}T12:00:00`).toLocaleDateString("pt-BR")}</TableCell><TableCell className="font-semibold">{a.paciente.nome_completo}</TableCell><TableCell className="text-muted-foreground">{a.habilidade.nome}</TableCell><TableCell><Badge variant={a.nivel_avaliacao.valor === 1 ? "default" : "outline"}>{a.nivel_avaliacao.codigo}</Badge></TableCell><TableCell className="text-muted-foreground max-w-xs truncate">{a.observacoes || "—"}</TableCell><TableCell>{a.psicologo_id === profile?.id && <AtendimentoAcoes id={a.id} pacienteId={a.paciente_id} />}</TableCell></TableRow>)}</TableBody></Table></div>
    {excluidosProprios.length > 0 && <details className="rounded-2xl border bg-card p-5"><summary className="cursor-pointer font-semibold">Atendimentos excluídos</summary><div className="mt-4 space-y-2">{excluidosProprios.map((a) => <div key={a.id} className="flex items-center justify-between gap-3 rounded-xl bg-muted p-3"><div><p className="text-sm font-semibold">{a.paciente.nome_completo} · {a.habilidade.nome}</p><p className="text-xs text-muted-foreground">Excluído em {a.deleted_at && new Date(a.deleted_at).toLocaleString("pt-BR")}</p></div><AtendimentoAcoes id={a.id} pacienteId={a.paciente_id} excluido /></div>)}</div></details>}
  </div>
}
