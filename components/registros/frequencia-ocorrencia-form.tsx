"use client"

import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, Plus } from "lucide-react"
import { consultarContextoFaltaAnterior, registrarOcorrenciaFrequencia } from "@/lib/registros/actions"
import type { Agendamento, ContinuidadeFalta, ContextoFaltaAnterior, OpcoesFrequencia, Papel, Profissao, TipoOcorrenciaFrequencia } from "@/lib/registros/types"
import { SeletorBuscaOperacional } from "@/components/registros/seletor-busca-operacional"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"

const rotulos: Record<TipoOcorrenciaFrequencia, string> = {
  falta_justificada: "Falta justificada",
  falta_nao_justificada: "Falta não justificada",
  cancelamento_clinica: "Cancelamento pela clínica",
  cancelamento_profissional: "Cancelamento pelo profissional",
}

function Campo({ label, children }: { label: string; children: ReactNode }) {
  return <div className="space-y-2"><Label>{label}</Label>{children}</div>
}

export function FrequenciaOcorrenciaForm({ opcoes, agenda, papel, usuarioId, profissoes }: { opcoes: OpcoesFrequencia; agenda: Agendamento[]; papel: Papel; usuarioId: string; profissoes: Profissao[] }) {
  const router = useRouter()
  const podeGerir = papel !== "profissional"
  const hoje = new Date().toISOString().slice(0, 10)
  const [paciente, setPaciente] = useState("")
  const [pacienteNome, setPacienteNome] = useState("")
  const [profissional, setProfissional] = useState(podeGerir ? "" : usuarioId)
  const [profissionalNome, setProfissionalNome] = useState(podeGerir ? "" : opcoes.profissionais.find((item) => item.id === usuarioId)?.nome ?? "Você")
  const [data, setData] = useState(hoje)
  const [tipo, setTipo] = useState<TipoOcorrenciaFrequencia>("falta_nao_justificada")
  const [erro, setErro] = useState("")
  const [mensagem, setMensagem] = useState("")
  const [salvando, setSalvando] = useState(false)
  const [consultandoHistorico, setConsultandoHistorico] = useState(false)
  const [faltaAnterior, setFaltaAnterior] = useState<ContextoFaltaAnterior | null>(null)
  const [continuidade, setContinuidade] = useState<ContinuidadeFalta | "">("")
  const [erroHistorico, setErroHistorico] = useState("")

  const sugestoes = useMemo(() => agenda.filter((item) =>
    item.paciente_id === paciente && item.profissional_id === profissional &&
    new Date(item.inicio).toLocaleDateString("en-CA") === data &&
    ["agendado", "confirmado"].includes(item.status)
  ), [agenda, paciente, profissional, data])

  useEffect(() => {
    let ativo = true
    setFaltaAnterior(null)
    setContinuidade("")
    setErroHistorico("")
    if (tipo !== "falta_nao_justificada" || !paciente || !profissional || !data) return
    setConsultandoHistorico(true)
    consultarContextoFaltaAnterior({ pacienteId: paciente, profissionalId: profissional, data })
      .then((resultado) => {
        if (!ativo) return
        if ("error" in resultado) return setErroHistorico(resultado.error)
        setFaltaAnterior(resultado.data)
        if (!resultado.data) setContinuidade("inicio_sequencia")
      })
      .catch(() => { if (ativo) setErroHistorico("Não foi possível consultar o histórico de faltas.") })
      .finally(() => { if (ativo) setConsultandoHistorico(false) })
    return () => { ativo = false }
  }, [paciente, profissional, data, tipo])

  function limpar(form: HTMLFormElement) {
    form.reset()
    setPaciente("")
    setPacienteNome("")
    setProfissional(podeGerir ? "" : usuarioId)
    setProfissionalNome(podeGerir ? "" : opcoes.profissionais.find((item) => item.id === usuarioId)?.nome ?? "Você")
    setData(hoje)
    setTipo("falta_nao_justificada")
    setFaltaAnterior(null)
    setContinuidade("")
    setErroHistorico("")
  }

  async function salvar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget
    const submitter = (event.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null
    const cadastrarOutra = submitter?.value === "nova"
    const dados = new FormData(form)
    setSalvando(true)
    setErro("")
    setMensagem("")
    const resultado = await registrarOcorrenciaFrequencia({
      pacienteId: paciente,
      profissionalId: profissional,
      data,
      tipo,
      motivo: String(dados.get("motivo") || ""),
      observacao: String(dados.get("observacao") || ""),
      agendamentoId: String(dados.get("agendamento") || "") || null,
      continuidadeFalta: tipo === "falta_nao_justificada" ? continuidade || null : null,
      ocorrenciaAnteriorId: faltaAnterior?.id ?? null,
    })
    setSalvando(false)
    if ("error" in resultado) return setErro(resultado.error)
    if (cadastrarOutra) {
      limpar(form)
      setMensagem("Ocorrência registrada. O formulário está pronto para um novo lançamento.")
      router.refresh()
      return
    }
    router.push("/registros/frequencia")
  }

  return (
    <form onSubmit={salvar} className="space-y-5 rounded-2xl border border-primary/30 bg-card p-5 sm:p-6">
      <div className="grid items-end gap-4 md:grid-cols-2">
        <Campo label="Paciente"><SeletorBuscaOperacional tipo="paciente" value={paciente} label={pacienteNome} onSelect={(item) => { setPaciente(item.id); setPacienteNome(item.nome) }} /></Campo>
        <Campo label="Responsável previsto">{podeGerir ? <SeletorBuscaOperacional tipo="profissional" value={profissional} label={profissionalNome} profissoes={profissoes} onSelect={(item) => { setProfissional(item.id); setProfissionalNome(item.nome) }} /> : <Input value={profissionalNome} disabled />}</Campo>
        <Campo label="Data"><Input type="date" value={data} max={hoje} onChange={(event) => setData(event.target.value)} /></Campo>
        <Campo label="Situação"><Select value={tipo} onValueChange={(valor) => setTipo(valor as TipoOcorrenciaFrequencia)}><SelectTrigger className="w-full"><SelectValue /></SelectTrigger><SelectContent>{Object.entries(rotulos).map(([valor, label]) => <SelectItem key={valor} value={valor}>{label}</SelectItem>)}</SelectContent></Select></Campo>
      </div>
      {sugestoes.length > 0 && <Campo label="Agendamento correspondente (opcional)"><Select name="agendamento"><SelectTrigger className="w-full"><SelectValue placeholder="Não vincular" /></SelectTrigger><SelectContent>{sugestoes.map((item) => <SelectItem key={item.id} value={item.id}>{new Date(item.inicio).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</SelectItem>)}</SelectContent></Select></Campo>}
      {tipo === "falta_nao_justificada" && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-950">
          {!paciente || !profissional ? <><p className="font-semibold">Continuidade da falta</p><p className="mt-1 text-sm">Selecione o paciente e o responsável previsto para consultar a falta anterior.</p></> : erroHistorico ? <><p className="font-semibold">Não foi possível verificar a continuidade</p><p role="alert" className="mt-1 text-sm">{erroHistorico} Atualize a página após confirmar que a migration foi aplicada por completo.</p></> : consultandoHistorico ? <p className="text-sm">Consultando histórico de faltas...</p> : faltaAnterior ? <>
            <p className="font-semibold">Continuidade da falta</p>
            <p className="mt-1 text-sm">A última falta não justificada foi em {new Date(`${faltaAnterior.data_ocorrencia}T12:00:00`).toLocaleDateString("pt-BR")}{faltaAnterior.sequencia_quantidade ? ` e estava na ${faltaAnterior.sequencia_quantidade}ª ocorrência da sequência` : ""}. Esta falta ocorreu em sequência?</p>
            <div className="mt-3"><Select value={continuidade} onValueChange={(valor) => setContinuidade(valor as ContinuidadeFalta)}><SelectTrigger className="w-full bg-white"><SelectValue placeholder="Selecione uma resposta" /></SelectTrigger><SelectContent><SelectItem value="consecutiva_confirmada">Sim, é consecutiva</SelectItem><SelectItem value="sequencia_interrompida">Não, houve atendimento entre elas</SelectItem><SelectItem value="nao_confirmada">Não foi possível confirmar</SelectItem></SelectContent></Select></div>
            {continuidade === "consecutiva_confirmada" && faltaAnterior.sequencia_quantidade && faltaAnterior.sequencia_quantidade + 1 >= 3 && <p role="alert" className="mt-3 font-semibold">Atenção: este registro atingirá {faltaAnterior.sequencia_quantidade + 1} faltas consecutivas não justificadas.</p>}
          </> : <p className="text-sm">Nenhuma falta não justificada anterior foi encontrada. Este registro iniciará uma nova sequência.</p>}
        </div>
      )}
      <div className="grid gap-4 md:grid-cols-2">
        <Campo label={tipo === "falta_justificada" ? "Motivo da justificativa" : "Motivo (opcional)"}><Textarea name="motivo" minLength={tipo === "falta_justificada" ? 3 : undefined} required={tipo === "falta_justificada"} className="min-h-24 resize-y" /></Campo>
        <Campo label="Observação administrativa"><Textarea name="observacao" placeholder="Não inclua informações clínicas." className="min-h-24 resize-y" /></Campo>
      </div>
      {erro && <p role="alert" className="text-sm text-destructive">{erro}</p>}
      {mensagem && <p role="status" className="rounded-xl bg-teal-50 p-3 text-sm font-medium text-teal-800">{mensagem}</p>}
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
        <Button type="button" variant="secondary" asChild><Link href="/registros/frequencia"><ArrowLeft className="size-4" />Cancelar</Link></Button>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button type="submit" name="acao" value="nova" variant="secondary" disabled={salvando || consultandoHistorico || !paciente || !profissional || (tipo === "falta_nao_justificada" && !continuidade)}><Plus className="size-4" />{salvando ? "Salvando..." : "Registrar e cadastrar outra"}</Button>
          <Button type="submit" disabled={salvando || consultandoHistorico || !paciente || !profissional || (tipo === "falta_nao_justificada" && !continuidade)}>{salvando ? "Salvando..." : "Registrar ocorrência"}</Button>
        </div>
      </div>
    </form>
  )
}

