import { ClipboardCheck, FileSearch, Lightbulb, ShieldCheck } from "lucide-react"
import { getCenarioDemonstracao } from "@/lib/registros/queries"
import { formatarData } from "@/lib/registros/demonstracao"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default async function AvaliacaoDemonstracaoPage() {
  const dados = await getCenarioDemonstracao()
  if (!dados) return null
  const evidencias = [...dados.sessoes].sort((a, b) => a.data.localeCompare(b.data)).slice(0, 4)
  return <div className="space-y-6"><div><h2 className="text-xl font-bold">Avaliação inicial</h2><p className="text-sm text-muted-foreground">Exemplo somente leitura de como observações e sessões iniciais fundamentam o planejamento clínico.</p></div>
    <Card><CardHeader><CardTitle className="flex items-center gap-2 text-base"><FileSearch className="size-4 text-primary" />Evidências consideradas</CardTitle></CardHeader><CardContent className="space-y-3">{evidencias.map((sessao, indice) => <div key={sessao.id} className="flex flex-col gap-2 rounded-xl border p-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-semibold">{indice === 0 ? "Acolhimento e vínculo" : indice === 1 ? "Entrevista e observação" : "Sessão de avaliação"}</p><p className="text-sm text-muted-foreground">{formatarData(sessao.data)} · {sessao.contexto || "Contexto estruturado"}</p></div><Badge variant="secondary">{sessao.registros.length} registro(s)</Badge></div>)}</CardContent></Card>
    <div className="grid gap-4 lg:grid-cols-2"><Card><CardHeader><CardTitle className="flex items-center gap-2 text-base"><ShieldCheck className="size-4 text-primary" />Potencialidades observadas</CardTitle></CardHeader><CardContent><ul className="list-disc space-y-2 pl-5 text-sm"><li>Responde melhor quando há previsibilidade e apoio visual.</li><li>Demonstra interesse por interação mediada por itens preferidos.</li><li>Apresenta repertórios que podem apoiar comunicação funcional.</li></ul></CardContent></Card><Card><CardHeader><CardTitle className="flex items-center gap-2 text-base"><ClipboardCheck className="size-4 text-primary" />Necessidades prioritárias</CardTitle></CardHeader><CardContent><ul className="list-disc space-y-2 pl-5 text-sm"><li>Ampliar pedidos de ajuda de forma funcional.</li><li>Desenvolver tolerância gradual à espera.</li><li>Verificar generalização com pessoas e ambientes diferentes.</li></ul></CardContent></Card></div>
    <Card className="border-primary/30 bg-primary/5"><CardContent className="flex gap-3 p-5"><Lightbulb className="mt-0.5 size-5 shrink-0 text-primary" /><div><p className="font-bold">Síntese e encaminhamento demonstrativo</p><p className="mt-1 text-sm text-muted-foreground">As evidências indicam prioridade para comunicação funcional e tolerância à espera. A síntese orienta os objetivos do plano demonstrativo, mas não substitui avaliação individualizada, decisão clínica ou revisão continuada.</p><p className="mt-3 text-xs font-semibold text-primary">Modo demonstração · nenhum dado pode ser alterado</p></div></CardContent></Card>
  </div>
}
