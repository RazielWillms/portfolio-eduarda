"use client"

import { useState, type FormEvent } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/registros/auth-context"
import { useRegistrosData } from "@/lib/registros/data-context"
import { ESCALA_AVALIACAO_PADRAO } from "@/lib/registros/types"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { FieldHelp } from "@/components/registros/field-help"

export function AtendimentoForm() {
  const { user } = useAuth()
  const { pacientesDoUsuario, habilidades, addAtendimento } = useRegistrosData()
  const router = useRouter()

  const pacientes = user ? pacientesDoUsuario(user.id) : []
  const habilidadesAtivas = habilidades.filter((h) => h.status === "ativa")

  const [pacienteId, setPacienteId] = useState(pacientes[0]?.id ?? "")
  const [habilidadeId, setHabilidadeId] = useState(habilidadesAtivas[0]?.id ?? "")
  const [data, setData] = useState(() => new Date().toISOString().slice(0, 10))
  const [nota, setNota] = useState(ESCALA_AVALIACAO_PADRAO[0]?.codigo ?? "")
  const [observacoes, setObservacoes] = useState("")
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState("")

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setErro("")

    if (!user) return
    if (!pacienteId || !habilidadeId || !nota) {
      setErro("Preencha paciente, habilidade e avaliação para continuar.")
      return
    }

    setEnviando(true)
    addAtendimento({
      pacienteId,
      psicologoId: user.id,
      data,
      habilidadeId,
      nota,
      observacoes: observacoes.trim(),
    })
    router.push("/registros/atendimentos")
  }

  if (pacientes.length === 0) {
    return (
      <p className="text-sm text-muted-foreground max-w-md">
        Você ainda não tem pacientes cadastrados. Cadastre um paciente antes de registrar um atendimento.
      </p>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5 max-w-xl">
      {erro && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-2.5 text-sm text-destructive">
          {erro}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div className="flex flex-col gap-2">
          <Label htmlFor="paciente">Paciente</Label>
          <Select value={pacienteId} onValueChange={setPacienteId}>
            <SelectTrigger id="paciente" className="w-full">
              <SelectValue placeholder="Selecione o paciente" />
            </SelectTrigger>
            <SelectContent>
              {pacientes.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.nomeCompleto}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="data">Data do atendimento</Label>
          <Input id="data" type="date" value={data} onChange={(e) => setData(e.target.value)} required />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="habilidade">Habilidade trabalhada</Label>
        <Select value={habilidadeId} onValueChange={setHabilidadeId}>
          <SelectTrigger id="habilidade" className="w-full">
            <SelectValue placeholder="Selecione a habilidade" />
          </SelectTrigger>
          <SelectContent>
            {habilidadesAtivas.map((h) => (
              <SelectItem key={h.id} value={h.id}>
                {h.nome}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-2 max-w-xs">
        <Label htmlFor="nota" className="flex items-center gap-1.5">
          Avaliação da sessão
          <FieldHelp text="Escala qualitativa usada para medir o desempenho do paciente na habilidade trabalhada. Nesta etapa a escala é fixa (A, B+, B-, C); em versões futuras poderá ser configurada." />
        </Label>
        <Select value={nota} onValueChange={setNota}>
          <SelectTrigger id="nota" className="w-full">
            <SelectValue placeholder="Selecione o nível" />
          </SelectTrigger>
          <SelectContent>
            {ESCALA_AVALIACAO_PADRAO.map((n) => (
              <SelectItem key={n.codigo} value={n.codigo}>
                {n.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="observacoes">Observações da sessão</Label>
        <Textarea
          id="observacoes"
          value={observacoes}
          onChange={(e) => setObservacoes(e.target.value)}
          placeholder="Anotações relevantes sobre o atendimento..."
          rows={4}
        />
      </div>

      <div className="flex items-center gap-3 mt-2">
        <Button type="submit" disabled={enviando} className="rounded-xl font-bold">
          {enviando ? "Salvando..." : "Registrar atendimento"}
        </Button>
        <Button type="button" variant="ghost" onClick={() => router.push("/registros/atendimentos")}>
          Cancelar
        </Button>
      </div>
    </form>
  )
}
