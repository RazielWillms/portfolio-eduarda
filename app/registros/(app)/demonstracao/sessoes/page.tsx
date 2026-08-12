import Link from "next/link"
import { getCenarioDemonstracao } from "@/lib/registros/queries"
import { formatarData, percentual, rotulo } from "@/lib/registros/demonstracao"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"

export default async function DemonstracaoSessoesPage(){
 const dados=await getCenarioDemonstracao()
 if(!dados)return null
 const sessoes=[...dados.sessoes].sort((a,b)=>b.data.localeCompare(a.data))
 return <div className="space-y-5"><div><h1 className="text-2xl font-bold">Sessões</h1><p className="text-sm text-muted-foreground">Histórico do profissional fictício em todos os pacientes vinculados.</p></div><div className="space-y-3">{sessoes.map((s)=><Link key={s.id} href={`/registros/demonstracao/pacientes/${dados.paciente.id}/sessoes`}><Card className="hover:border-primary/40"><CardContent className="p-5"><div className="flex flex-wrap justify-between gap-3"><div><p className="font-bold">{dados.paciente.nome}</p><p className="text-sm text-muted-foreground">{formatarData(s.data)} · {s.contexto}</p></div><div className="flex gap-1"><Badge variant="outline">{rotulo(s.ambiente_tipo)}</Badge><Badge variant="secondary">{rotulo(s.aplicador_tipo)}</Badge></div></div><div className="mt-3 flex flex-wrap gap-2">{s.registros.map((r)=><span key={r.id} className="rounded-lg bg-muted px-2 py-1 text-xs"><strong>{r.alvo_nome}:</strong> {percentual(r.dados)??"—"}%</span>)}</div></CardContent></Card></Link>)}</div></div>
}

