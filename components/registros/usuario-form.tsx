"use client"

import { useState, type FormEvent } from "react"
import { RefreshCw } from "lucide-react"
import { createUsuario } from "@/lib/registros/actions"
import type { Papel } from "@/lib/registros/types"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { FieldHelp } from "@/components/registros/field-help"

function gerarSenhaProvisoria() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789"
  let senha = ""
  for (let i = 0; i < 10; i++) {
    senha += chars[Math.floor(Math.random() * chars.length)]
  }
  return senha
}

export function UsuarioForm() {
  const [nome, setNome] = useState("")
  const [email, setEmail] = useState("")
  const [papel, setPapel] = useState<Papel>("profissional")
  const [senhaProvisoria, setSenhaProvisoria] = useState(gerarSenhaProvisoria)
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState("")
  const [sucesso, setSucesso] = useState("")

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setErro("")
    setSucesso("")
    setEnviando(true)

    const resultado = await createUsuario({
      nome: nome.trim(),
      email: email.trim().toLowerCase(),
      papel,
      senhaProvisoria,
    })

    if (resultado && "error" in resultado) {
      setErro(resultado.error)
      setEnviando(false)
      return
    }

    setSucesso(
      `Usuário "${nome.trim()}" criado com sucesso. Senha provisória: ${senhaProvisoria} — compartilhe com segurança e oriente a troca no primeiro acesso.`,
    )
    setNome("")
    setEmail("")
    setPapel("profissional")
    setSenhaProvisoria(gerarSenhaProvisoria())
    setEnviando(false)
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5 max-w-xl">
      {erro && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-2.5 text-sm text-destructive">
          {erro}
        </div>
      )}
      {sucesso && (
        <div className="rounded-xl border border-primary/30 bg-primary/10 px-4 py-2.5 text-sm text-foreground">
          {sucesso}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div className="flex flex-col gap-2">
          <Label htmlFor="nome">Nome completo</Label>
          <Input id="nome" value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Nome do profissional" required />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="email">E-mail de acesso</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="nome@exemplo.com"
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div className="flex flex-col gap-2">
          <Label htmlFor="papel" className="flex items-center gap-1.5">
            Papel no sistema
            <FieldHelp text="Administradores gerenciam usuários e configurações. Profissionais acessam somente os pacientes vinculados e os próprios registros privados." />
          </Label>
          <Select value={papel} onValueChange={(v) => setPapel(v as Papel)}>
            <SelectTrigger id="papel" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="profissional">Profissional</SelectItem>
              <SelectItem value="coordenacao">Coordenação</SelectItem>
              <SelectItem value="admin">Administrador</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="senhaProvisoria" className="flex items-center gap-1.5">
            Senha provisória
            <FieldHelp text="Gerada automaticamente. Compartilhe com o profissional por um canal seguro; ele poderá trocá-la depois do primeiro acesso." />
          </Label>
          <div className="flex items-center gap-2">
            <Input
              id="senhaProvisoria"
              value={senhaProvisoria}
              onChange={(e) => setSenhaProvisoria(e.target.value)}
              className="font-mono"
              required
              minLength={8}
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => setSenhaProvisoria(gerarSenhaProvisoria())}
              aria-label="Gerar nova senha provisória"
            >
              <RefreshCw className="size-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 mt-2">
        <Button type="submit" disabled={enviando} className="rounded-xl font-bold w-fit">
          {enviando ? "Criando..." : "Criar usuário"}
        </Button>
      </div>
    </form>
  )
}
