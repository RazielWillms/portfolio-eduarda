import Link from "next/link"
import { AlertCircle, ArrowRight, CalendarDays, ClipboardList, Target, UserRoundPlus, Users } from "lucide-react"
import { getPacientes, getPlanosClinicosPaciente, getSessoesClinicasProfissional, getSolicitacoesRecebidas } from "@/lib/registros/queries"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default async function DashboardPage() {
  const [pacientes, sessoes, solicitacoesPendentes] = await Promise.all([
    getPacientes(), getSessoesClinicasProfissional(), getSolicitacoesRecebidas(),
  ])
  const planosPorPaciente = await Promise.all(pacientes.map(async (paciente) => ({ pacienteId: paciente.id, planos: await getPlanosClinicosPaciente(paciente.id) })))
  const hoje = new Date()
  const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1).toISOString().slice(0, 10)
  const pacientesResumo = pacientes.map((paciente) => {
    const sessoesPaciente = sessoes.filter((s) => s.paciente_id === paciente.id)
    const planos = planosPorPaciente.find((item) => item.pacienteId === paciente.id)?.planos ?? []
    const alvosAtivos = planos.flatMap((p) => p.objetivos.flatMap((o) => o.alvos)).filter((a) => a.ativo && !["pausado", "encerrado"].includes(a.fase)).length
    return { paciente, alvosAtivos, ultimaSessao: sessoesPaciente[0]?.data ?? null, sessoesNoMes: sessoesPaciente.filter((s) => s.data >= inicioMes).length }
  })
  const recentes = sessoes.slice(0, 5)
  const formatar = (data: string) => new Date(`${data}T12:00:00`).toLocaleDateString("pt-BR")
  const cards = [
    ["Pacientes ativos", pacientes.filter((p) => p.status === "ativo").length, Users],
    ["Sessões no mês", sessoes.filter((s) => s.data >= inicioMes).length, CalendarDays],
    ["Alvos ativos", pacientesResumo.reduce((total, p) => total + p.alvosAtivos, 0), Target],
    ["Solicitações pendentes", solicitacoesPendentes.length, AlertCircle],
  ] as const

  return <div className="flex flex-col gap-6">
    <div><h1 className="text-2xl font-bold">Painel</h1><p className="mt-1 text-sm text-muted-foreground">Resumo operacional dos pacientes vinculados a você.</p></div>
    {solicitacoesPendentes.length > 0 && <Card className="border-primary/30 bg-primary/5"><CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-start gap-3"><div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground"><UserRoundPlus className="size-4" /></div><div><p className="font-bold">{solicitacoesPendentes.length === 1 ? "1 solicitação de acesso pendente" : `${solicitacoesPendentes.length} solicitações de acesso pendentes`}</p><p className="text-sm text-muted-foreground">Revise as solicitações recebidas para aprovar ou negar o vínculo.</p></div></div><Link href="/registros/solicitacoes" className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-primary">Ver solicitações <ArrowRight className="size-3.5" /></Link></CardContent></Card>}
    <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">{cards.map(([label, valor, Icon]) => <Card key={label}><CardContent className="p-4"><Icon className="mb-2 size-4 text-primary" /><p className="text-2xl font-bold">{valor}</p><p className="text-xs text-muted-foreground">{label}</p></CardContent></Card>)}</section>
    <section><div className="mb-3 flex items-end justify-between"><div><h2 className="text-lg font-bold">Seus pacientes</h2><p className="text-sm text-muted-foreground">Atividade baseada exclusivamente nas sessões estruturadas.</p></div><Link href="/registros/pacientes" className="text-sm font-semibold text-primary">Ver lista</Link></div>{pacientesResumo.length === 0 ? <div className="rounded-2xl border border-dashed p-8 text-center text-sm text-muted-foreground">Nenhum paciente vinculado.</div> : <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">{pacientesResumo.map((item) => <Link key={item.paciente.id} href={`/registros/pacientes/${item.paciente.id}`}><Card className="h-full transition-colors hover:border-primary/40"><CardContent className="p-5"><h3 className="truncate font-bold">{item.paciente.nome_completo}</h3><div className="mt-4 grid grid-cols-2 gap-3 text-sm"><div><span className="text-xs text-muted-foreground">Alvos ativos</span><p className="font-bold">{item.alvosAtivos}</p></div><div><span className="text-xs text-muted-foreground">Sessões no mês</span><p className="font-bold">{item.sessoesNoMes}</p></div></div><p className="mt-4 text-xs text-muted-foreground">Última sessão: {item.ultimaSessao ? formatar(item.ultimaSessao) : "sem sessões"}</p></CardContent></Card></Link>)}</div>}</section>
    <Card><CardHeader><CardTitle className="flex items-center gap-2 text-base"><ClipboardList className="size-4 text-primary" />Sessões recentes</CardTitle></CardHeader><CardContent className="space-y-3">{recentes.length === 0 ? <p className="text-sm text-muted-foreground">Nenhuma sessão registrada.</p> : recentes.map((s) => <Link key={s.id} href={`/registros/pacientes/${s.paciente_id}/sessoes`} className="flex items-center justify-between gap-3 rounded-xl border p-3 hover:bg-muted"><div className="min-w-0"><p className="truncate text-sm font-semibold">{s.paciente.nome_completo}</p><p className="truncate text-xs text-muted-foreground">{s.contexto || s.ambiente_tipo || "Contexto não informado"} · {formatar(s.data)}</p></div><Badge variant="secondary">{s.registros.length} alvos</Badge></Link>)}<Link href="/registros/sessoes" className="inline-flex items-center gap-1 text-sm font-semibold text-primary">Ver histórico <ArrowRight className="size-3.5" /></Link></CardContent></Card>
  </div>
}
