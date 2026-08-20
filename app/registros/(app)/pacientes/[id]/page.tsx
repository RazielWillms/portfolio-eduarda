import Link from "next/link"
import { Activity, AlertCircle, ArrowRight, CalendarDays, ClipboardList, Target } from "lucide-react"
import { getResumoClinicoPaciente } from "@/lib/registros/queries"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default async function ResumoPacientePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const resumo = await getResumoClinicoPaciente(id)
  if (!resumo) return <Card><CardContent className="p-6 text-sm text-muted-foreground">O resumo clínico está indisponível. Aplique a migration 20260812850000_resumo_clinico_paciente_agregado.sql no Supabase.</CardContent></Card>
  const pendencias = [
    resumo.alvos_sem_protocolo > 0 && { texto: `${resumo.alvos_sem_protocolo} alvo(s) sem protocolo`, href: `/registros/pacientes/${id}/intervencao` },
    resumo.concordancias_pendentes > 0 && { texto: `${resumo.concordancias_pendentes} concordância(s) aguardando resposta`, href: `/registros/pacientes/${id}/analise` },
    resumo.revisoes_vencidas > 0 && { texto: `${resumo.revisoes_vencidas} revisão(ões) vencida(s)`, href: `/registros/pacientes/${id}/analise` },
  ].filter(Boolean) as { texto: string; href: string }[]
  const atalhos = [["Sessões", "Histórico e nova coleta", ClipboardList, "sessoes"], ["Planejamento", "Planos, objetivos e alvos", Target, "planejamento"], ["Análise", "Evolução e decisões", Activity, "analise"], ["Participação", "Validade social e capacitação", CalendarDays, "participacao"]] as const
  return <div className="space-y-6">
    <section className="grid gap-3 sm:grid-cols-3">
      <Card><CardContent className="p-4"><Target className="mb-2 size-4 text-primary"/><p className="text-2xl font-bold">{resumo.alvos_ativos}</p><p className="text-xs text-muted-foreground">Alvos ativos</p></CardContent></Card>
      <Card><CardContent className="p-4"><CalendarDays className="mb-2 size-4 text-primary"/><p className="text-lg font-bold">{resumo.ultima_sessao ? new Date(`${resumo.ultima_sessao.data}T12:00:00`).toLocaleDateString("pt-BR") : "Sem sessões"}</p><p className="text-xs text-muted-foreground">Última sessão</p></CardContent></Card>
      <Card><CardContent className="p-4"><AlertCircle className="mb-2 size-4 text-primary"/><p className="text-2xl font-bold">{pendencias.length}</p><p className="text-xs text-muted-foreground">Pendências</p></CardContent></Card>
    </section>
    {pendencias.length > 0 && <Card><CardHeader><CardTitle className="text-base">Atenção necessária</CardTitle></CardHeader><CardContent className="space-y-2">{pendencias.map((p) => <Link key={p.texto} href={p.href} className="flex items-center justify-between rounded-xl border p-3 text-sm font-semibold hover:bg-muted"><span>{p.texto}</span><ArrowRight className="size-4"/></Link>)}</CardContent></Card>}
    <section><h2 className="mb-3 text-lg font-bold">Áreas de trabalho</h2><div className="grid gap-3 sm:grid-cols-2">{atalhos.map(([titulo, descricao, Icon, rota]) => <Link key={rota} href={`/registros/pacientes/${id}/${rota}`}><Card className="h-full transition-colors hover:bg-muted/40"><CardContent className="flex items-center gap-4 p-5"><div className="rounded-xl bg-primary/10 p-3"><Icon className="size-5 text-primary"/></div><div className="flex-1"><p className="font-bold">{titulo}</p><p className="text-sm text-muted-foreground">{descricao}</p></div><ArrowRight className="size-4 text-muted-foreground"/></CardContent></Card></Link>)}</div></section>
    {resumo.ultima_sessao && <Card><CardHeader><div className="flex items-center justify-between"><CardTitle className="text-base">Última sessão</CardTitle><Button asChild size="sm" variant="ghost"><Link href={`/registros/pacientes/${id}/sessoes`}>Ver histórico</Link></Button></div></CardHeader><CardContent><div className="flex flex-wrap gap-2">{resumo.ultima_sessao.alvos.map((alvo) => <Badge key={alvo.id} variant="secondary">{alvo.nome}</Badge>)}</div></CardContent></Card>}
  </div>
}
