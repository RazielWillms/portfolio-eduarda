import Link from "next/link"
import { ArrowRight, BarChart3, CalendarDays, Target, Users } from "lucide-react"
import { getCenarioDemonstracao } from "@/lib/registros/queries"
import { formatarData } from "@/lib/registros/demonstracao"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default async function DemonstracaoPage() {
  const dados=await getCenarioDemonstracao()
  if(!dados)return <Indisponivel/>
  const alvos=dados.planos.flatMap((p)=>p.objetivos.flatMap((o)=>o.alvos))
  const ultima=[...dados.sessoes].sort((a,b)=>b.data.localeCompare(a.data))[0]
  return <div className="space-y-6">
    <div><p className="text-sm text-muted-foreground">Visualizando como</p><h1 className="text-2xl font-bold">{dados.profissional.nome}</h1><p className="mt-1 text-sm text-muted-foreground">Este painel reproduz a entrada do profissional fictício no sistema.</p></div>
    <section className="grid grid-cols-2 gap-3 lg:grid-cols-4"><Card><CardContent className="p-4"><Users className="mb-2 size-4 text-primary"/><p className="text-2xl font-bold">1</p><p className="text-xs text-muted-foreground">Paciente ativo</p></CardContent></Card><Card><CardContent className="p-4"><CalendarDays className="mb-2 size-4 text-primary"/><p className="text-2xl font-bold">{dados.sessoes.length}</p><p className="text-xs text-muted-foreground">Sessões registradas</p></CardContent></Card><Card><CardContent className="p-4"><Target className="mb-2 size-4 text-primary"/><p className="text-2xl font-bold">{alvos.length}</p><p className="text-xs text-muted-foreground">Alvos ativos</p></CardContent></Card><Card><CardContent className="p-4"><BarChart3 className="mb-2 size-4 text-primary"/><p className="text-lg font-bold">{ultima?formatarData(ultima.data):"—"}</p><p className="text-xs text-muted-foreground">Última sessão</p></CardContent></Card></section>
    <section><div className="mb-3 flex items-end justify-between"><div><h2 className="text-lg font-bold">Seus pacientes</h2><p className="text-sm text-muted-foreground">Abra o prontuário para navegar por todas as áreas.</p></div><Link href="/registros/demonstracao/pacientes" className="text-sm font-semibold text-primary">Ver lista</Link></div><Link href={`/registros/demonstracao/pacientes/${dados.paciente.id}`}><Card className="transition-colors hover:border-primary/40"><CardContent className="flex items-center justify-between gap-4 p-5"><div><h3 className="font-bold">{dados.paciente.nome}</h3><p className="mt-1 text-sm text-muted-foreground">{alvos.length} alvos · {dados.sessoes.length} sessões</p></div><ArrowRight className="size-5 text-muted-foreground"/></CardContent></Card></Link></section>
    <Card><CardHeader><CardTitle className="text-base">Sessões recentes</CardTitle></CardHeader><CardContent className="space-y-2">{[...dados.sessoes].sort((a,b)=>b.data.localeCompare(a.data)).slice(0,5).map((s)=><Link key={s.id} href="/registros/demonstracao/sessoes" className="flex items-center justify-between rounded-xl border p-3 hover:bg-muted"><div><p className="text-sm font-semibold">{dados.paciente.nome}</p><p className="text-xs text-muted-foreground">{formatarData(s.data)} · {s.contexto}</p></div><Badge variant="secondary">{s.registros.length} alvos</Badge></Link>)}</CardContent></Card>
  </div>
}
function Indisponivel(){return <div className="rounded-2xl border border-dashed p-10 text-center"><h1 className="text-xl font-bold">Cenário de demonstração indisponível</h1><p className="mt-2 text-sm text-muted-foreground">Não foi encontrado um profissional demo ativo com paciente e vínculo válidos. Aplique as migrations pendentes e execute novamente o comando de dados fictícios.</p></div>}
