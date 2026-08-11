"use client"

import { useState, type FormEvent } from "react"
import { useRouter } from "next/navigation"
import { createPaciente, updatePaciente } from "@/lib/registros/actions"
import type { Paciente, StatusPaciente } from "@/lib/registros/types"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { FieldHelp } from "@/components/registros/field-help"

interface PacienteFormProps {
  pacienteExistente?: Paciente
}

export function PacienteForm({ pacienteExistente }: PacienteFormProps) {
  const router = useRouter()

  const [nomeCompleto, setNomeCompleto] = useState(pacienteExistente?.nome_completo ?? "")
  const [nomeResponsavel, setNomeResponsavel] = useState(pacienteExistente?.nome_responsavel ?? "")
  const [dataNascimento, setDataNascimento] = useState(pacienteExistente?.data_nascimento ?? "")
  const [diagnostico, setDiagnostico] = useState(pacienteExistente?.diagnostico ?? "")
  const [contatos, setContatos] = useState(pacienteExistente?.contatos ?? "")
  const [observacoes, setObservacoes] = useState(pacienteExistente?.observacoes ?? "")
  const [status, setStatus] = useState<StatusPaciente>(pacienteExistente?.status ?? "ativo")
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState("")

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setErro("")
    setEnviando(true)

    const dados = {
      nome_completo: nomeCompleto.trim(),
      nome_responsavel: nomeResponsavel.trim() || null,
      data_nascimento: dataNascimento || null,
      diagnostico: diagnostico.trim() || null,
      contatos: contatos.trim() || null,
      observacoes: observacoes.trim() || null,
    }

    const resultado = pacienteExistente
      ? await updatePaciente(pacienteExistente.id, { ...dados, status })
      : await createPaciente(dados)

    // As actions fazem redirect() em caso de sucesso; se retornar, houve erro.
    if (resultado && "error" in resultado) {
      setErro(resultado.error)
      setEnviando(false)
    }
  }

  return (
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
          <FieldHelp text="Informações úteis para a condução dos atendimentos: preferências, sensibilidades, rotina, etc." />
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
        <Button type="button" variant="ghost" onClick={() => router.push("/registros/pacientes")}>
          Cancelar
        </Button>
      </div>
    </form>
  )
}
