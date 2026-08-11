"use client"

import { useState, type FormEvent } from "react"
import { useRouter } from "next/navigation"
import { useRegistrosData } from "@/lib/registros/data-context"
import type { Habilidade, StatusHabilidade } from "@/lib/registros/types"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { FieldHelp } from "@/components/registros/field-help"

interface HabilidadeFormProps {
  habilidadeExistente?: Habilidade
}

export function HabilidadeForm({ habilidadeExistente }: HabilidadeFormProps) {
  const { addHabilidade, updateHabilidade } = useRegistrosData()
  const router = useRouter()

  const [nome, setNome] = useState(habilidadeExistente?.nome ?? "")
  const [descricao, setDescricao] = useState(habilidadeExistente?.descricao ?? "")
  const [categoria, setCategoria] = useState(habilidadeExistente?.categoria ?? "")
  const [peso, setPeso] = useState(String(habilidadeExistente?.peso ?? 1))
  const [status, setStatus] = useState<StatusHabilidade>(habilidadeExistente?.status ?? "ativa")
  const [enviando, setEnviando] = useState(false)

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setEnviando(true)

    const dados = {
      nome: nome.trim(),
      descricao: descricao.trim(),
      categoria: categoria.trim(),
      peso: Math.min(1, Math.max(0, Number(peso) || 0)),
      status,
    }

    if (habilidadeExistente) {
      updateHabilidade(habilidadeExistente.id, dados)
    } else {
      addHabilidade(dados)
    }

    router.push("/registros/habilidades")
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5 max-w-xl">
      <div className="flex flex-col gap-2">
        <Label htmlFor="nome">Nome da habilidade</Label>
        <Input
          id="nome"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          placeholder="Ex.: Contato visual"
          required
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="descricao">Descrição</Label>
        <Textarea
          id="descricao"
          value={descricao}
          onChange={(e) => setDescricao(e.target.value)}
          placeholder="O que esta habilidade avalia..."
          rows={3}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div className="flex flex-col gap-2">
          <Label htmlFor="categoria">Categoria</Label>
          <Input
            id="categoria"
            value={categoria}
            onChange={(e) => setCategoria(e.target.value)}
            placeholder="Ex.: Comunicação"
            required
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="peso" className="flex items-center gap-1.5">
            Peso da avaliação
            <FieldHelp text="Valor de 0 a 1 usado no cálculo de progresso do paciente. Pode ser ajustado depois sem afetar registros já lançados." />
          </Label>
          <Input
            id="peso"
            type="number"
            min={0}
            max={1}
            step={0.1}
            value={peso}
            onChange={(e) => setPeso(e.target.value)}
            required
          />
        </div>
      </div>

      <div className="flex flex-col gap-2 max-w-xs">
        <Label htmlFor="status" className="flex items-center gap-1.5">
          Status
          <FieldHelp text="Habilidades inativas deixam de aparecer nos formulários de novo atendimento." />
        </Label>
        <Select value={status} onValueChange={(v) => setStatus(v as StatusHabilidade)}>
          <SelectTrigger id="status" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ativa">Ativa</SelectItem>
            <SelectItem value="inativa">Inativa</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center gap-3 mt-2">
        <Button type="submit" disabled={enviando} className="rounded-xl font-bold">
          {enviando ? "Salvando..." : habilidadeExistente ? "Salvar alterações" : "Cadastrar habilidade"}
        </Button>
        <Button type="button" variant="ghost" onClick={() => router.push("/registros/habilidades")}>
          Cancelar
        </Button>
      </div>
    </form>
  )
}
