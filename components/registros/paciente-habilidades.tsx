"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowDown, ArrowRight, ArrowUp, CheckCircle2 } from "lucide-react"
import { atualizarPacienteHabilidade, vincularHabilidadePaciente } from "@/lib/registros/actions"
import {
  calcularIndicadorHabilidade,
  calcularProgressoGeral,
  obterAvaliacao,
  type AvaliacaoClinica,
  type TendenciaHabilidade,
} from "@/lib/registros/clinico"
import type { AtendimentoComRelacoes, Habilidade, PacienteHabilidade } from "@/lib/registros/types"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { FieldHelp } from "@/components/registros/field-help"

const STATUS_LABEL = {
  nao_iniciada: "Não iniciada",
  em_desenvolvimento: "Em desenvolvimento",
  adquirida: "Adquirida",
}

const TENDENCIA_LABEL: Record<TendenciaHabilidade, string> = {
  melhora: "Melhora nos registros",
  estavel: "Registros estáveis",
  queda: "Desempenho recente inferior",
  dados_insuficientes: "Dados insuficientes",
}

function IconeTendencia({ tendencia }: { tendencia: TendenciaHabilidade }) {
  if (tendencia === "melhora") return <ArrowUp className="size-3.5 text-emerald-600" />
  if (tendencia === "queda") return <ArrowDown className="size-3.5 text-amber-600" />
  return <ArrowRight className="size-3.5 text-muted-foreground" />
}

export function PacienteHabilidades({
  pacienteId,
  vinculos,
  habilidades,
  avaliacoes,
  atendimentosVisiveis,
  somenteLeitura = false,
}: {
  pacienteId: string
  vinculos: PacienteHabilidade[]
  habilidades: Habilidade[]
  avaliacoes: AvaliacaoClinica[]
  atendimentosVisiveis: AtendimentoComRelacoes[]
  somenteLeitura?: boolean
}) {
  const router = useRouter()
  const [habilidadeId, setHabilidadeId] = useState("")
  const [pesoNovo, setPesoNovo] = useState("1")
  const [processando, setProcessando] = useState(false)
  const [erro, setErro] = useState("")

  const itens = useMemo(() => vinculos.map((vinculo) => {
    const serie = avaliacoes.filter((a) => a.habilidade_id === vinculo.habilidade_id)
    return { vinculo, serie, indicador: calcularIndicadorHabilidade(serie) }
  }), [vinculos, avaliacoes])

  const progressoGeral = calcularProgressoGeral(itens.map(({ vinculo, indicador }) => ({
    progresso: indicador.percentual,
    peso: Number(vinculo.peso),
    ativo: vinculo.ativo,
  })))
  const disponiveis = habilidades.filter((h) => h.status === "ativa" && !vinculos.some((v) => v.habilidade_id === h.id))
  const observacoesPorAtendimento = new Map(atendimentosVisiveis.map((a) => [a.id, a.observacoes]))

  async function vincular() {
    if (!habilidadeId) return
    setProcessando(true)
    setErro("")
    const resultado = await vincularHabilidadePaciente({ pacienteId, habilidadeId, peso: Number(pesoNovo) })
    if (resultado && "error" in resultado) setErro(resultado.error)
    else { setHabilidadeId(""); router.refresh() }
    setProcessando(false)
  }

  async function atualizar(vinculo: PacienteHabilidade, dados: { peso?: number; ativo?: boolean }) {
    setProcessando(true)
    const resultado = await atualizarPacienteHabilidade({
      id: vinculo.id,
      pacienteId,
      peso: dados.peso ?? Number(vinculo.peso),
      ativo: dados.ativo ?? vinculo.ativo,
    })
    if (resultado && "error" in resultado) setErro(resultado.error)
    else router.refresh()
    setProcessando(false)
  }

  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-foreground">Habilidades trabalhadas</h2>
          <p className="text-sm text-muted-foreground">Indicadores calculados a partir dos registros, sem interpretação diagnóstica.</p>
        </div>
        <div className="rounded-xl bg-muted px-4 py-2 min-w-44">
          <span className="flex items-center gap-1 text-xs text-muted-foreground">Progresso geral <FieldHelp text="Média ponderada somente das habilidades ativas que possuem avaliações." /></span>
          <p className="text-xl font-bold">{progressoGeral === null ? "Sem dados" : `${progressoGeral}%`}</p>
        </div>
      </div>

      {!somenteLeitura && <div className="rounded-2xl border border-border bg-card p-4 grid grid-cols-1 sm:grid-cols-[1fr_7rem_auto] gap-3 items-end">
        <div className="flex flex-col gap-2">
          <Label>Vincular habilidade</Label>
          <Select value={habilidadeId} onValueChange={setHabilidadeId}>
            <SelectTrigger><SelectValue placeholder="Selecione uma habilidade" /></SelectTrigger>
            <SelectContent>{disponiveis.map((h) => <SelectItem key={h.id} value={h.id}>{h.nome}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-2">
          <Label className="flex items-center gap-1">Peso <FieldHelp text="Define a influência desta habilidade no indicador geral deste paciente; não é um valor clínico absoluto." /></Label>
          <Input type="number" min={0.01} max={100} step={0.1} value={pesoNovo} onChange={(e) => setPesoNovo(e.target.value)} />
        </div>
        <Button onClick={vincular} disabled={!habilidadeId || processando}>Vincular</Button>
      </div>}
      {erro && <p className="text-sm text-destructive">{erro}</p>}

      {itens.length === 0 && <div className="rounded-2xl border border-dashed p-8 text-center text-sm text-muted-foreground">Nenhuma habilidade vinculada.</div>}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {itens.map(({ vinculo, serie, indicador }) => (
          <details key={vinculo.id} className="group rounded-2xl border border-border bg-card p-4 open:shadow-sm">
            <summary className="cursor-pointer list-none">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-bold text-foreground">{vinculo.habilidade.nome}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant={indicador.status === "adquirida" ? "default" : "outline"}>{STATUS_LABEL[indicador.status]}</Badge>
                    {!vinculo.ativo && <Badge variant="secondary">Inativa</Badge>}
                  </div>
                </div>
                {indicador.status === "adquirida" && <CheckCircle2 className="size-5 text-primary" />}
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-muted-foreground flex items-center gap-1">Progresso <FieldHelp text="Média das últimas cinco avaliações válidas, ou das disponíveis quando houver menos de cinco." /></span><strong>{indicador.percentual === null ? "Sem dados suficientes" : `${indicador.percentual}%`}</strong></div>
                <div><span className="text-muted-foreground flex items-center gap-1">Tendência <FieldHelp text="Compara a média das três avaliações mais recentes com as três imediatamente anteriores." /></span><strong className="flex items-center gap-1"><IconeTendencia tendencia={indicador.tendencia} />{TENDENCIA_LABEL[indicador.tendencia]}</strong></div>
              </div>
              {indicador.percentual !== null && <Progress value={indicador.percentual} className="mt-3" />}
              <p className="mt-3 text-xs text-muted-foreground">
                Última avaliação: {indicador.ultimaAvaliacao?.codigo ?? "—"}
                {indicador.ultimaAvaliacao ? ` em ${new Date(`${indicador.ultimaAvaliacao.data}T12:00:00`).toLocaleDateString("pt-BR")}` : ""}
                {` · ${indicador.quantidadeAvaliacoes} avaliações`}
              </p>
            </summary>

            <div className="mt-5 border-t pt-4 flex flex-col gap-4">
              {!somenteLeitura && <div className="flex flex-wrap items-end gap-3">
                <div className="flex flex-col gap-1"><Label className="flex items-center gap-1">Peso <FieldHelp text="Influência no progresso geral deste paciente." /></Label><Input className="w-24" type="number" min={0.01} max={100} step={0.1} defaultValue={vinculo.peso} onBlur={(e) => atualizar(vinculo, { peso: Number(e.target.value) })} /></div>
                <Button size="sm" variant="outline" disabled={processando} onClick={() => atualizar(vinculo, { ativo: !vinculo.ativo })}>{vinculo.ativo ? "Desativar" : "Reativar"}</Button>
                {indicador.adquiridaEm && <p className="text-xs text-muted-foreground">Adquirida em {new Date(`${indicador.adquiridaEm}T12:00:00`).toLocaleDateString("pt-BR")}</p>}
              </div>}
              <div>
                <h4 className="text-sm font-semibold mb-2">Histórico de avaliações</h4>
                <div className="flex flex-col gap-2 max-h-64 overflow-y-auto">
                  {[...serie].reverse().map((avaliacao) => {
                    const escala = obterAvaliacao(avaliacao.codigo)
                    const observacao = observacoesPorAtendimento.get(avaliacao.id)
                    return <div key={avaliacao.id} className="rounded-lg bg-muted p-3 text-sm">
                      <div className="flex justify-between gap-2"><span>{new Date(`${avaliacao.data}T12:00:00`).toLocaleDateString("pt-BR")}</span><strong title={escala?.descricao}>{avaliacao.codigo}</strong></div>
                      {avaliacao.profissional_nome && <p className="text-xs text-muted-foreground">Registrado por {avaliacao.profissional_nome}</p>}
                      {observacao && <p className="mt-1 text-muted-foreground">{observacao}</p>}
                    </div>
                  })}
                  {serie.length === 0 && <p className="text-sm text-muted-foreground">Nenhuma avaliação registrada.</p>}
                </div>
              </div>
            </div>
          </details>
        ))}
      </div>
    </section>
  )
}
