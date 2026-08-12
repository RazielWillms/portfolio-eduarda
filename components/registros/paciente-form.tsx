"use client"

import { useState, type FormEvent } from "react"
import { useRouter } from "next/navigation"
import { createPaciente, solicitarAcessoPaciente, updatePaciente } from "@/lib/registros/actions"
import type { CandidatoDuplicataPaciente, Paciente, StatusPaciente } from "@/lib/registros/types"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { FieldHelp } from "@/components/registros/field-help"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { UserRoundCheck } from "lucide-react"

interface PacienteFormProps {
  pacienteExistente?: Paciente
}

export function PacienteForm({ pacienteExistente }: PacienteFormProps) {
  const router = useRouter()

  const [nomeCompleto, setNomeCompleto] = useState(pacienteExistente?.nome_completo ?? "")
  const [nomeResponsavel, setNomeResponsavel] = useState(pacienteExistente?.nome_responsavel ?? "")
  const [cpfResponsavel, setCpfResponsavel] = useState(pacienteExistente?.cpf_responsavel ?? "")
  const [cpfPaciente, setCpfPaciente] = useState(pacienteExistente?.cpf_paciente ?? "")
  const [dataNascimento, setDataNascimento] = useState(pacienteExistente?.data_nascimento ?? "")
  const [diagnostico, setDiagnostico] = useState(pacienteExistente?.diagnostico ?? "")
  const [contatos, setContatos] = useState(pacienteExistente?.contatos ?? "")
  const [observacoes, setObservacoes] = useState(pacienteExistente?.observacoes ?? "")
  const [status, setStatus] = useState<StatusPaciente>(pacienteExistente?.status ?? "ativo")
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState("")

  const [candidatos, setCandidatos] = useState<CandidatoDuplicataPaciente[]>([])
  const [modalAberto, setModalAberto] = useState(false)
  const [solicitandoId, setSolicitandoId] = useState<string | null>(null)
  const [mensagemSolicitacao, setMensagemSolicitacao] = useState<Record<string, string>>({})
  const [statusSolicitacao, setStatusSolicitacao] = useState<Record<string, string>>({})

  function montarDados() {
    return {
      nome_completo: nomeCompleto.trim(),
      nome_responsavel: nomeResponsavel.trim() || null,
      cpf_responsavel: cpfResponsavel.trim() || null,
      cpf_paciente: cpfPaciente.trim() || null,
      data_nascimento: dataNascimento || null,
      diagnostico: diagnostico.trim() || null,
      contatos: contatos.trim() || null,
      observacoes: observacoes.trim() || null,
    }
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setErro("")
    setEnviando(true)

    const dados = montarDados()

    const resultado = pacienteExistente
      ? await updatePaciente(pacienteExistente.id, { ...dados, status })
      : await createPaciente(dados)

    // As actions fazem redirect() em caso de sucesso; se retornar, houve erro ou duplicidade.
    if (resultado && "duplicidade" in resultado) {
      setCandidatos(resultado.duplicidade)
      setModalAberto(true)
      setEnviando(false)
      return
    }

    if (resultado && "error" in resultado) {
      setErro(resultado.error)
      setEnviando(false)
    }
  }

  async function handleSolicitarAcesso(pacienteId: string) {
    setSolicitandoId(pacienteId)
    const resultado = await solicitarAcessoPaciente({
      pacienteId,
      mensagem: mensagemSolicitacao[pacienteId]?.trim() || null,
      papelNoCaso: null,
    })
    setSolicitandoId(null)
    setStatusSolicitacao((prev) => ({
      ...prev,
      [pacienteId]: resultado && "error" in resultado ? resultado.error : "enviada",
    }))
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="flex flex-col gap-5 max-w-2xl">
        {erro && (
          <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-2.5 text-sm text-destructive">
            {erro}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div className="flex flex-col gap-2">
            <Label htmlFor="nomeCompleto">Nome completo</Label>
            <Input
              id="nomeCompleto"
              value={nomeCompleto}
              onChange={(e) => setNomeCompleto(e.target.value)}
              placeholder="Nome do paciente"
              required
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="nomeResponsavel">Nome do responsável</Label>
            <Input
              id="nomeResponsavel"
              value={nomeResponsavel}
              onChange={(e) => setNomeResponsavel(e.target.value)}
              placeholder="Nome do responsável"
              required
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="cpfResponsavel" className="flex items-center gap-1.5">
              CPF do responsável (opcional)
              <FieldHelp text="Ajuda a identificar quando o mesmo paciente já foi cadastrado por outro profissional, evitando duplicidade." />
            </Label>
            <Input
              id="cpfResponsavel"
              value={cpfResponsavel ?? ""}
              onChange={(e) => setCpfResponsavel(e.target.value)}
              placeholder="000.000.000-00"
              inputMode="numeric"
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="dataNascimento">Data de nascimento</Label>
            <Input
              id="dataNascimento"
              type="date"
              value={dataNascimento ?? ""}
              onChange={(e) => setDataNascimento(e.target.value)}
              required
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="cpfPaciente" className="flex items-center gap-1.5">
              CPF do paciente (opcional)
              <FieldHelp text="Quando informado, é o identificador mais forte para prevenir cadastros duplicados. Este dado não é revelado na busca de possíveis correspondências." />
            </Label>
            <Input id="cpfPaciente" value={cpfPaciente} onChange={(e)=>setCpfPaciente(e.target.value)} placeholder="000.000.000-00" inputMode="numeric" />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="diagnostico" className="flex items-center gap-1.5">
              Diagnóstico (opcional)
              <FieldHelp text="Diagnóstico clínico do paciente, se já houver. Pode ser deixado em branco e preenchido depois." />
            </Label>
            <Input
              id="diagnostico"
              value={diagnostico ?? ""}
              onChange={(e) => setDiagnostico(e.target.value)}
              placeholder="Ex.: TEA nível 1"
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="contatos">Contatos relevantes</Label>
            <Input
              id="contatos"
              value={contatos ?? ""}
              onChange={(e) => setContatos(e.target.value)}
              placeholder="Telefone, e-mail..."
              required
            />
          </div>

          {pacienteExistente && (
            <div className="flex flex-col gap-2">
              <Label htmlFor="status" className="flex items-center gap-1.5">
                Status
                <FieldHelp text="Pacientes inativos deixam de aparecer nas listagens padrão, mas o histórico é mantido." />
              </Label>
              <Select value={status} onValueChange={(v) => setStatus(v as StatusPaciente)}>
                <SelectTrigger id="status" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ativo">Ativo</SelectItem>
                  <SelectItem value="inativo">Inativo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="observacoes" className="flex items-center gap-1.5">
            Observações gerais
            <FieldHelp text="Informações úteis para a condução das sessões: preferências, sensibilidades, rotina, etc." />
          </Label>
          <Textarea
            id="observacoes"
            value={observacoes ?? ""}
            onChange={(e) => setObservacoes(e.target.value)}
            placeholder="Observações sobre o paciente..."
            rows={4}
          />
        </div>

        <div className="flex items-center gap-3 mt-2">
          <Button type="submit" disabled={enviando} className="rounded-xl font-bold">
            {enviando ? "Salvando..." : pacienteExistente ? "Salvar alterações" : "Cadastrar paciente"}
          </Button>
          <Button type="button" variant="secondary" className="bg-slate-200 text-slate-700 hover:bg-slate-300 hover:text-slate-900" onClick={() => router.push("/registros/pacientes")}>
            Cancelar
          </Button>
        </div>
      </form>

      <Dialog open={modalAberto} onOpenChange={setModalAberto}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Paciente possivelmente já cadastrado</DialogTitle>
            <DialogDescription>
              Encontramos {candidatos.length === 1 ? "um paciente" : "pacientes"} com nome, data de nascimento, CPF ou
              responsável parecidos. Por privacidade, os dados abaixo estão parcialmente ocultos. Se for o mesmo
              paciente, solicite acesso ao profissional responsável em vez de criar um novo cadastro.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-3 max-h-80 overflow-y-auto">
            {candidatos.map((c) => (
              <div key={c.paciente_id} className="rounded-xl border border-border p-3 flex flex-col gap-2">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="font-semibold text-foreground text-sm">{c.nome_mascarado}</p>
                    <p className="text-xs text-muted-foreground">
                      {c.responsavel_mascarado ? `Responsável: ${c.responsavel_mascarado}` : "Sem responsável informado"}
                    </p>
                  </div>
                  {c.ja_vinculado && (
                    <Badge variant="secondary" className="gap-1">
                      <UserRoundCheck className="size-3" />
                      Você já atende
                    </Badge>
                  )}
                </div>

                {!c.ja_vinculado && (
                  <div className="flex flex-col gap-2">
                    <Input
                      placeholder="Mensagem para quem atende (opcional)"
                      value={mensagemSolicitacao[c.paciente_id] ?? ""}
                      onChange={(e) =>
                        setMensagemSolicitacao((prev) => ({ ...prev, [c.paciente_id]: e.target.value }))
                      }
                      className="text-sm"
                    />
                    <Button
                      type="button"
                      size="sm"
                      disabled={solicitandoId === c.paciente_id || statusSolicitacao[c.paciente_id] === "enviada"}
                      onClick={() => handleSolicitarAcesso(c.paciente_id)}
                    >
                      {statusSolicitacao[c.paciente_id] === "enviada"
                        ? "Solicitação enviada"
                        : solicitandoId === c.paciente_id
                          ? "Enviando..."
                          : "Solicitar acesso a este paciente"}
                    </Button>
                    {statusSolicitacao[c.paciente_id] && statusSolicitacao[c.paciente_id] !== "enviada" && (
                      <p className="text-xs text-destructive">{statusSolicitacao[c.paciente_id]}</p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button type="button" variant="secondary" className="bg-slate-200 text-slate-700 hover:bg-slate-300 hover:text-slate-900" onClick={() => setModalAberto(false)}>
              Voltar e revisar
            </Button>
            <Button type="button" onClick={() => setModalAberto(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
