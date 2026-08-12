import Link from "next/link"
import { ArrowRight, Users } from "lucide-react"
import { getCenarioDemonstracao } from "@/lib/registros/queries"
import { Card, CardContent } from "@/components/ui/card"

export default async function DemonstracaoPacientesPage(){
 const dados=await getCenarioDemonstracao()
 if(!dados)return <p className="rounded-2xl border border-dashed p-8 text-center text-sm text-muted-foreground">Demonstração indisponível.</p>
 const alvos=dados.planos.flatMap((p)=>p.objetivos.flatMap((o)=>o.alvos))
 return <div className="space-y-5"><div><h1 className="text-2xl font-bold">Pacientes</h1><p className="text-sm text-muted-foreground">Lista de pacientes vinculados ao profissional demonstrativo.</p></div><Link href={`/registros/demonstracao/pacientes/${dados.paciente.id}`}><Card className="hover:border-primary/40"><CardContent className="flex items-center gap-4 p-5"><div className="rounded-xl bg-primary/10 p-3"><Users className="size-5 text-primary"/></div><div className="flex-1"><p className="font-bold">{dados.paciente.nome}</p><p className="text-sm text-muted-foreground">{alvos.length} alvos ativos · {dados.sessoes.length} sessões</p></div><ArrowRight className="size-5 text-muted-foreground"/></CardContent></Card></Link></div>
}

