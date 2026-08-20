"use client"

import { useMemo, useState, type FormEvent, type ReactNode } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, Plus } from "lucide-react"
import { registrarOcorrenciaFrequencia } from "@/lib/registros/actions"
import type { Agendamento, OpcoesFrequencia, Papel, Profissao, TipoOcorrenciaFrequencia } from "@/lib/registros/types"
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

  const sugestoes = useMemo(() => agenda.filter((item) =>
    item.paciente_id === paciente && item.profissional_id === profissional &&
    new Date(item.inicio).toLocaleDateString("en-CA") === data &&
    ["agendado", "confirmado"].includes(item.status)
  ), [agenda, paciente, profissional, data])

  function limpar(form: HTMLFormElement) {
    form.reset()
    setPaciente("")
    setPacienteNome("")
    setProfissional(podeGerir ? "" : usuarioId)
    setProfissionalNome(podeGerir ? "" : opcoes.profissionais.find((item) => item.id === usuarioId)?.nome ?? "Você")
    setData(hoje)
    setTipo("falta_nao_justificada")
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
    <form onSubmit={salvar} className="space-y-5 rounded-2xl border border-primary/30 bg-card p-5">
      <div className="grid items-end gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Campo label="Paciente"><SeletorBuscaOperacional tipo="paciente" value={paciente} label={pacienteNome} onSelect={(item) => { setPaciente(item.id); setPacienteNome(item.nome) }} /></Campo>
        <Campo label="Responsável previsto">{podeGerir ? <SeletorBuscaOperacional tipo="profissional" value={profissional} label={profissionalNome} profissoes={profissoes} onSelect={(item) => { setProfissional(item.id); setProfissionalNome(item.nome) }} /> : <Input value={profissionalNome} disabled />}</Campo>
        <div className="-translate-y-2"><Campo label="Data"><Input type="date" value={data} max={hoje} onChange={(event) => setData(event.target.value)} /></Campo></div>
        <Campo label="Situação"><Select value={tipo} onValueChange={(valor) => setTipo(valor as TipoOcorrenciaFrequencia)}><SelectTrigger className="w-full"><SelectValue /></SelectTrigger><SelectContent>{Object.entries(rotulos).map(([valor, label]) => <SelectItem key={valor} value={valor}>{label}</SelectItem>)}</SelectContent></Select></Campo>
      </div>
      {sugestoes.length > 0 && <Campo label="Agendamento correspondente (opcional)"><Select name="agendamento"><SelectTrigger className="w-full"><SelectValue placeholder="Não vincular" /></SelectTrigger><SelectContent>{sugestoes.map((item) => <SelectItem key={item.id} value={item.id}>{new Date(item.inicio).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</SelectItem>)}</SelectContent></Select></Campo>}
      <div className="grid gap-4 md:grid-cols-2">
        <Campo label={tipo === "falta_justificada" ? "Motivo da justificativa" : "Motivo (opcional)"}><Textarea name="motivo" minLength={tipo === "falta_justificada" ? 3 : undefined} required={tipo === "falta_justificada"} className="min-h-24 resize-y" /></Campo>
        <Campo label="Observação administrativa"><Textarea name="observacao" placeholder="Não inclua informações clínicas." className="min-h-24 resize-y" /></Campo>
      </div>
      {erro && <p role="alert" className="text-sm text-destructive">{erro}</p>}
      {mensagem && <p role="status" className="rounded-xl bg-teal-50 p-3 text-sm font-medium text-teal-800">{mensagem}</p>}
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
        <Button type="button" variant="secondary" asChild><Link href="/registros/frequencia"><ArrowLeft className="size-4" />Cancelar</Link></Button>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button type="submit" name="acao" value="nova" variant="secondary" disabled={salvando || !paciente || !profissional}><Plus className="size-4" />{salvando ? "Salvando..." : "Registrar e cadastrar outra"}</Button>
          <Button type="submit" disabled={salvando || !paciente || !profissional}>{salvando ? "Salvando..." : "Registrar ocorrência"}</Button>
        </div>
      </div>
    </form>
  )
}

