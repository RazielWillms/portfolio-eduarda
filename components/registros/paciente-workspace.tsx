"use client"

import { useMemo, useState, type ReactNode } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Activity, AlertCircle, CalendarDays, ClipboardList, Plus, Share2, Sparkles, Users, type LucideIcon } from "lucide-react"
import { calcularIdade, type AtendimentoComRelacoes, type Habilidade, type Paciente, type PacienteHabilidade, type ProfissionalResumo } from "@/lib/registros/types"
import { calcularIndicadoresPorHabilidade, calcularProgressoGeral, type AvaliacaoClinica } from "@/lib/registros/clinico"
import { PacienteDashboard } from "@/components/registros/paciente-dashboard"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

const ABAS = ["resumo", "atendimentos", "habilidades", "equipe", "compartilhamento"]
const formatarData = (data: string) => new Date(`${data}T12:00:00`).toLocaleDateString("pt-BR")

export function PacienteWorkspace({ paciente, profissionais, vinculos, habilidades, avaliacoes, atendimentos, profissionalAtualId, atendimentosConteudo, compartilhamentoConteudo, cadastroConteudo }: {
  paciente: Paciente
  profissionais: ProfissionalResumo[]
  vinculos: PacienteHabilidade[]
  habilidades: Habilidade[]
  avaliacoes: AvaliacaoClinica[]
  atendimentos: AtendimentoComRelacoes[]
  profissionalAtualId: string
  atendimentosConteudo: ReactNode
  compartilhamentoConteudo: ReactNode
  cadastroConteudo: ReactNode
}) {
  const searchParams = useSearchParams()
  const informada = searchParams.get("aba") ?? "resumo"
  const [aba, setAba] = useState(ABAS.includes(informada) ? informada : "resumo")
  const meusVinculos = useMemo(() => vinculos.filter((v) => v.profissional_id === profissionalAtualId), [vinculos, profissionalAtualId])
  const minhasAvaliacoes = useMemo(() => avaliacoes.filter((a) => Boolean(a.profissional_nome)), [avaliacoes])
  const indicadores = calcularIndicadoresPorHabilidade(minhasAvaliacoes, meusVinculos.map((v) => ({ habilidadeId: v.habilidade_id, peso: Number(v.peso), ativo: v.ativo })))
  const progresso = calcularProgressoGeral(indicadores.map((i) => ({ progresso: i.indicador.percentual, peso: i.peso, ativo: i.ativo })))
  const ultimaSessao = minhasAvaliacoes.length ? [...minhasAvaliacoes].sort((a, b) => b.data.localeCompare(a.data))[0].data : null
  const pontosAtencao = indicadores.filter((i) => i.indicador.tendencia === "queda").length
  const recentes = [...minhasAvaliacoes].sort((a, b) => b.data.localeCompare(a.data)).slice(0, 3)
  const cardsResumo: { rotulo: string; valor: string | number; Icon: LucideIcon }[] = [
    { rotulo: "Progresso geral", valor: progresso === null ? "Sem dados" : `${progresso}%`, Icon: Activity },
    { rotulo: "Última sessão", valor: ultimaSessao ? formatarData(ultimaSessao) : "Sem sessões", Icon: CalendarDays },
    { rotulo: "Habilidades ativas", valor: meusVinculos.filter((v) => v.ativo).length, Icon: Sparkles },
    { rotulo: "Pontos de atenção", valor: pontosAtencao, Icon: AlertCircle },
  ]

  function trocarAba(valor: string) {
    setAba(valor)
    const url = new URL(window.location.href)
    url.searchParams.set("aba", valor)
    window.history.replaceState(null, "", url)
  }

  return <div className="flex flex-col gap-6">
    <header className="rounded-2xl border border-border bg-card p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div><p className="text-sm text-muted-foreground">Paciente</p><h1 className="text-2xl font-bold">{paciente.nome_completo}</h1><p className="mt-1 text-sm text-muted-foreground">{calcularIdade(paciente.data_nascimento) ?? "—"} anos · Responsável: {paciente.nome_responsavel ?? "não informado"}</p></div>
        <Button asChild><Link href={`/registros/atendimentos/novo?paciente=${paciente.id}`}><Plus className="size-4" />Registrar atendimento</Link></Button>
      </div>
    </header>

    <Tabs value={aba} onValueChange={trocarAba} className="gap-5">
      <div className="overflow-x-auto pb-1"><TabsList className="h-11 min-w-max"><TabsTrigger value="resumo">Resumo</TabsTrigger><TabsTrigger value="atendimentos"><ClipboardList />Atendimentos</TabsTrigger><TabsTrigger value="habilidades"><Sparkles />Habilidades</TabsTrigger><TabsTrigger value="equipe"><Users />Equipe</TabsTrigger><TabsTrigger value="compartilhamento"><Share2 />Compartilhamento</TabsTrigger></TabsList></div>

      <TabsContent value="resumo" className="space-y-5">
        <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {cardsResumo.map(({ rotulo, valor, Icon }) => <Card key={rotulo}><CardContent className="p-4"><Icon className="mb-2 size-4 text-primary" /><p className="text-xl font-bold">{valor}</p><p className="text-xs text-muted-foreground">{rotulo}</p></CardContent></Card>)}
        </section>
        <Card><CardContent className="p-5"><div className="mb-4 flex items-center justify-between"><div><h2 className="font-bold">Atividade recente</h2><p className="text-sm text-muted-foreground">Seus últimos registros neste paciente.</p></div><Button variant="outline" size="sm" onClick={() => trocarAba("atendimentos")}>Ver histórico</Button></div>{recentes.length === 0 ? <p className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">Você ainda não registrou atendimentos para este paciente.</p> : <div className="space-y-3">{recentes.map((a) => <div key={a.id} className="flex items-center justify-between gap-3 rounded-xl bg-muted p-3"><span className="text-sm font-medium">{meusVinculos.find((v) => v.habilidade_id === a.habilidade_id)?.habilidade.nome ?? "Habilidade"}</span><span className="text-xs text-muted-foreground">{formatarData(a.data)} · {a.codigo}</span></div>)}</div>}</CardContent></Card>
      </TabsContent>

      <TabsContent value="atendimentos">{atendimentosConteudo}</TabsContent>
      <TabsContent value="habilidades"><PacienteDashboard paciente={paciente} profissionais={profissionais} vinculos={vinculos} habilidades={habilidades} avaliacoes={avaliacoes} atendimentosVisiveis={atendimentos} profissionalAtualId={profissionalAtualId} ocultarCabecalho /></TabsContent>
      <TabsContent value="equipe" className="space-y-5"><Card><CardContent className="p-5"><h2 className="font-bold">Profissionais vinculados</h2><p className="mb-4 text-sm text-muted-foreground">A equipe pode visualizar a evolução geral, respeitando a privacidade dos atendimentos.</p><div className="grid gap-3 sm:grid-cols-2">{profissionais.map((p) => <div key={p.id} className="rounded-xl border p-3"><p className="font-semibold">{p.nome}</p><p className="text-xs text-muted-foreground">{p.id === profissionalAtualId ? "Você" : "Profissional vinculado"}</p></div>)}</div></CardContent></Card>{cadastroConteudo}</TabsContent>
      <TabsContent value="compartilhamento">{compartilhamentoConteudo}</TabsContent>
    </Tabs>
  </div>
}
