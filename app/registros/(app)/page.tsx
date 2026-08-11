import Link from "next/link"
import { AlertCircle, ArrowRight, Award, CalendarDays, ClipboardList, UserRoundPlus, Users } from "lucide-react"
import { calcularIndicadoresPorHabilidade, calcularProgressoGeral } from "@/lib/registros/clinico"
import { getAtendimentos, getAvaliacoesClinicasProfissional, getPacienteHabilidadesTodos, getPacientes, getSolicitacoesRecebidas } from "@/lib/registros/queries"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default async function DashboardPage() {
  const [pacientes, atendimentos, vinculos, avaliacoes, solicitacoesPendentes] = await Promise.all([
    getPacientes(), getAtendimentos(), getPacienteHabilidadesTodos(), getAvaliacoesClinicasProfissional(), getSolicitacoesRecebidas(),
  ])
  const hoje = new Date()
  const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1).toISOString().slice(0, 10)
  const limiteRecente = new Date(hoje); limiteRecente.setDate(limiteRecente.getDate() - 30)
  const limiteISO = limiteRecente.toISOString().slice(0, 10)

  const pacientesResumo = pacientes.map((paciente) => {
    const pv = vinculos.filter((v) => v.paciente_id === paciente.id)
    const pa = avaliacoes.filter((a) => a.paciente_id === paciente.id)
    const itens = calcularIndicadoresPorHabilidade(pa, pv.map((v) => ({ habilidadeId: v.habilidade_id, peso: Number(v.peso), ativo: v.ativo })))
    const progresso = calcularProgressoGeral(itens.map((i) => ({ progresso: i.indicador.percentual, peso: i.peso, ativo: i.ativo })))
    return {
      paciente, progresso,
      ultimaSessao: pa.length ? [...pa].sort((a, b) => b.data.localeCompare(a.data))[0].data : null,
      adquiridas: itens.filter((i) => i.indicador.adquirida).length,
      atencao: itens.some((i) => i.indicador.tendencia === "queda"),
      adquiridasRecentes: itens.filter((i) => i.indicador.adquiridaEm && i.indicador.adquiridaEm >= limiteISO).length,
    }
  })
  const recentes = atendimentos.slice(0, 5)
  const formatar = (data: string) => new Date(`${data}T12:00:00`).toLocaleDateString("pt-BR")
  const cards = [
    ["Pacientes ativos", pacientes.filter((p) => p.status === "ativo").length, Users],
    ["Atendimentos no mês", atendimentos.filter((a) => a.data >= inicioMes).length, CalendarDays],
    ["Aquisições nos últimos 30 dias", pacientesResumo.reduce((t, p) => t + p.adquiridasRecentes, 0), Award],
    ["Pacientes com atenção", pacientesResumo.filter((p) => p.atencao).length, AlertCircle],
  ] as const

  return <div className="flex flex-col gap-6">
    <div><h1 className="text-2xl font-bold">Painel</h1><p className="text-sm text-muted-foreground mt-1">Resumo operacional dos pacientes vinculados a você.</p></div>
    {solicitacoesPendentes.length > 0 && (
      <Card className="border-primary/30 bg-primary/5">
        <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <UserRoundPlus className="size-4" />
            </div>
            <div>
              <p className="font-bold">
                {solicitacoesPendentes.length === 1
                  ? "1 solicitação de acesso pendente"
                  : `${solicitacoesPendentes.length} solicitações de acesso pendentes`}
              </p>
              <p className="text-sm text-muted-foreground">Revise as solicitações recebidas para aprovar ou negar o vínculo.</p>
            </div>
          </div>
          <Link href="/registros/solicitacoes" className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-primary">
            Ver solicitações <ArrowRight className="size-3.5" />
          </Link>
        </CardContent>
      </Card>
    )}
    <section className="grid grid-cols-2 lg:grid-cols-4 gap-3">{cards.map(([label, valor, Icon]) => <Card key={label}><CardContent className="p-4"><Icon className="size-4 text-primary mb-2" /><p className="text-2xl font-bold">{valor}</p><p className="text-xs text-muted-foreground">{label}</p></CardContent></Card>)}</section>

    <section><div className="flex items-end justify-between mb-3"><div><h2 className="text-lg font-bold">Seus pacientes</h2><p className="text-sm text-muted-foreground">Indicadores calculados em uma única leitura agregada autorizada.</p></div><Link href="/registros/pacientes" className="text-sm font-semibold text-primary">Ver lista</Link></div>
      {pacientesResumo.length === 0 ? <div className="rounded-2xl border border-dashed p-8 text-center text-sm text-muted-foreground">Nenhum paciente vinculado.</div> : <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">{pacientesResumo.map((item) => <Link key={item.paciente.id} href={`/registros/pacientes/${item.paciente.id}`}><Card className="h-full hover:border-primary/40 transition-colors"><CardContent className="p-5"><div className="flex justify-between gap-3"><h3 className="font-bold truncate">{item.paciente.nome_completo}</h3>{item.atencao && <Badge variant="outline" className="text-amber-700">Atenção</Badge>}</div><div className="grid grid-cols-2 gap-3 mt-4 text-sm"><div><span className="text-xs text-muted-foreground">Progresso geral</span><p className="font-bold">{item.progresso === null ? "Sem dados" : `${item.progresso}%`}</p></div><div><span className="text-xs text-muted-foreground">Adquiridas</span><p className="font-bold">{item.adquiridas}</p></div></div><p className="text-xs text-muted-foreground mt-4">Última sessão: {item.ultimaSessao ? formatar(item.ultimaSessao) : "sem sessões"}</p></CardContent></Card></Link>)}</div>}
    </section>

    <Card><CardHeader><CardTitle className="text-base flex items-center gap-2"><ClipboardList className="size-4 text-primary" />Atendimentos recentes</CardTitle></CardHeader><CardContent className="space-y-3">{recentes.length === 0 ? <p className="text-sm text-muted-foreground">Nenhum atendimento registrado.</p> : recentes.map((a) => <div key={a.id} className="flex items-center justify-between gap-3 rounded-xl border p-3"><div className="min-w-0"><p className="text-sm font-semibold truncate">{a.paciente.nome_completo}</p><p className="text-xs text-muted-foreground truncate">{a.habilidade.nome} · {formatar(a.data)}</p></div><Badge variant="secondary">{a.nivel_avaliacao.codigo}</Badge></div>)}<Link href="/registros/atendimentos" className="inline-flex items-center gap-1 text-sm font-semibold text-primary">Ver histórico <ArrowRight className="size-3.5" /></Link></CardContent></Card>
  </div>
}
