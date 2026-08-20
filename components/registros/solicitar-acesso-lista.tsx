"use client"

import { useState } from "react"
import { UserRoundPlus } from "lucide-react"
import { solicitarAcessoPaciente } from "@/lib/registros/actions"
import { Button } from "@/components/ui/button"

export function SolicitarAcessoLista({ pacienteId }: { pacienteId: string }) {
  const [processando, setProcessando] = useState(false)
  const [resultado, setResultado] = useState("")
  async function solicitar() {
    setProcessando(true); setResultado("")
    const resposta = await solicitarAcessoPaciente({ pacienteId, mensagem: "Solicitação enviada pela listagem operacional de pacientes.", papelNoCaso: null })
    setResultado(resposta && "error" in resposta ? resposta.error : "Solicitação enviada")
    setProcessando(false)
  }
  return <div className="flex flex-col items-end gap-1"><Button type="button" size="sm" variant="secondary" disabled={processando || resultado === "Solicitação enviada"} onClick={solicitar}><UserRoundPlus className="size-4" />{processando ? "Enviando..." : resultado === "Solicitação enviada" ? "Solicitado" : "Solicitar acesso"}</Button>{resultado && resultado !== "Solicitação enviada" && <p className="max-w-64 text-right text-xs text-destructive">{resultado}</p>}</div>
}
