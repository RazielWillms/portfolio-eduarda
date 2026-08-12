import Link from "next/link"
import { ArrowRight, ClipboardList } from "lucide-react"
import { getSessoesClinicasProfissional } from "@/lib/registros/queries"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"

export default async function SessoesPage() {
  const sessoes = await getSessoesClinicasProfissional()
  return <div className="space-y-6"><div><h1 className="text-2xl font-bold">Sessões</h1><p className="mt-1 text-sm text-muted-foreground">Histórico das sessões clínicas registradas por você.</p></div>{sessoes.length === 0 ? <Card><CardContent className="flex flex-col items-center gap-3 p-10 text-center"><ClipboardList className="size-8 text-muted-foreground" /><div><p className="font-semibold">Nenhuma sessão registrada</p><p className="text-sm text-muted-foreground">Abra um paciente e use “Registrar sessão” para iniciar a coleta.</p></div><Link href="/registros/pacientes" className="inline-flex items-center gap-1 text-sm font-semibold text-primary">Escolher paciente <ArrowRight className="size-4" /></Link></CardContent></Card> : <div className="space-y-3">{sessoes.map((sessao) => <Link key={sessao.id} href={`/registros/pacientes/${sessao.paciente_id}/sessoes`} className="block"><Card className="transition-colors hover:border-primary/40"><CardContent className="flex items-center justify-between gap-4 p-5"><div className="min-w-0"><p className="truncate font-bold">{sessao.paciente.nome_completo}</p><p className="text-sm text-muted-foreground">{new Date(`${sessao.data}T12:00:00`).toLocaleDateString("pt-BR")} · {sessao.contexto || sessao.ambiente_tipo || "Contexto não informado"}</p></div><Badge variant="secondary" className="shrink-0">{sessao.registros.length} alvos</Badge></CardContent></Card></Link>)}</div>}</div>
}
