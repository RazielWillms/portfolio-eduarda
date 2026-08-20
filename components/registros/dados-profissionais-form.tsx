"use client"

import { useState, useTransition } from "react"
import { atualizarMeusDadosProfissionais } from "@/lib/registros/actions"
import type { Profissao } from "@/lib/registros/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export function DadosProfissionaisForm({ profissaoId, profissoes, conselhoNumero, conselhoUf }: { profissaoId: string | null; profissoes: Profissao[]; conselhoNumero: string | null; conselhoUf: string | null }) {
  const [pendente, iniciar] = useTransition()
  const [profissao, setProfissao] = useState(profissaoId ?? "nenhuma")
  const [mensagem, setMensagem] = useState<{ tipo: "erro" | "sucesso"; texto: string } | null>(null)
  const selecionada = profissoes.find(item => item.id === profissao)
  function enviar(formData: FormData) {
    setMensagem(null)
    iniciar(async () => {
      const resultado = await atualizarMeusDadosProfissionais({ profissaoId: profissao === "nenhuma" ? "" : profissao, conselhoNumero: String(formData.get("conselhoNumero") ?? ""), conselhoUf: String(formData.get("conselhoUf") ?? "") })
      setMensagem("error" in resultado ? { tipo: "erro", texto: resultado.error } : { tipo: "sucesso", texto: "Dados profissionais atualizados." })
    })
  }
  return <form action={enviar} className="space-y-4">
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="space-y-2"><Label>Profissão</Label><Select value={profissao} onValueChange={setProfissao}><SelectTrigger><SelectValue placeholder="Selecione sua profissão" /></SelectTrigger><SelectContent><SelectItem value="nenhuma">Não informar</SelectItem>{profissoes.map(item => <SelectItem key={item.id} value={item.id}>{item.nome}</SelectItem>)}</SelectContent></Select>{selecionada?.conselho_sigla && <p className="text-xs text-muted-foreground">Conselho relacionado: {selecionada.conselho_sigla}</p>}</div>
      <Campo id="conselhoNumero" label="Número do registro" defaultValue={conselhoNumero} placeholder="Ex.: 00/123456" maxLength={40} />
      <Campo id="conselhoUf" label="UF do registro" defaultValue={conselhoUf} placeholder="Ex.: SC" maxLength={2} />
    </div>
    <p className="text-xs text-muted-foreground">A profissão é escolhida no catálogo do sistema e não altera suas permissões de acesso.</p>
    {mensagem && <p role="status" className={mensagem.tipo === "erro" ? "text-sm text-destructive" : "text-sm text-emerald-700"}>{mensagem.texto}</p>}
    <Button type="submit" disabled={pendente}>{pendente ? "Salvando..." : "Salvar dados profissionais"}</Button>
  </form>
}
function Campo({ id, label, defaultValue, ...props }: { id: string; label: string; defaultValue: string | null; placeholder: string; maxLength: number }) { return <div className="space-y-2"><Label htmlFor={id}>{label}</Label><Input id={id} name={id} defaultValue={defaultValue ?? ""} {...props} /></div> }
