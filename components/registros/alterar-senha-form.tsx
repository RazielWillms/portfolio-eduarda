"use client"

import { useState, type FormEvent } from "react"
import { CheckCircle2 } from "lucide-react"
import { alterarMinhaSenha } from "@/lib/registros/actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function AlterarSenhaForm() {
  const [novaSenha, setNovaSenha] = useState("")
  const [confirmacao, setConfirmacao] = useState("")
  const [processando, setProcessando] = useState(false)
  const [erro, setErro] = useState("")
  const [sucesso, setSucesso] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setErro("")
    setSucesso(false)
    setProcessando(true)
    const resultado = await alterarMinhaSenha(novaSenha, confirmacao)
    setProcessando(false)
    if (resultado && "error" in resultado) {
      setErro(resultado.error)
      return
    }
    setNovaSenha("")
    setConfirmacao("")
    setSucesso(true)
  }

  return <form method="post" onSubmit={handleSubmit} className="flex max-w-md flex-col gap-5">
    {erro && <p role="alert" className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">{erro}</p>}
    {sucesso && <p role="status" className="flex items-center gap-2 rounded-xl border border-primary/30 bg-primary/5 px-4 py-3 text-sm font-semibold"><CheckCircle2 className="size-4 text-primary" />Senha alterada com sucesso.</p>}
    <div className="flex flex-col gap-2">
      <Label htmlFor="novaSenha">Nova senha</Label>
      <Input id="novaSenha" type="password" autoComplete="new-password" minLength={8} value={novaSenha} onChange={(event) => setNovaSenha(event.target.value)} required />
      <p className="text-xs text-muted-foreground">Use pelo menos 8 caracteres.</p>
    </div>
    <div className="flex flex-col gap-2">
      <Label htmlFor="confirmacaoSenha">Confirmar nova senha</Label>
      <Input id="confirmacaoSenha" type="password" autoComplete="new-password" minLength={8} value={confirmacao} onChange={(event) => setConfirmacao(event.target.value)} required />
    </div>
    <Button type="submit" disabled={processando} className="w-fit rounded-xl font-bold">{processando ? "Alterando..." : "Alterar senha"}</Button>
  </form>
}
