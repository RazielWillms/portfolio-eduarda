"use client"

import { useState, type FormEvent } from "react"
import Link from "next/link"
import { ArrowLeft, Lock } from "lucide-react"
import { useAuth } from "@/lib/registros/auth-context"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"

export function LoginForm() {
  const { login } = useAuth()
  const [email, setEmail] = useState("")
  const [senha, setSenha] = useState("")
  const [erro, setErro] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setErro(null)
    setEnviando(true)
    const resultado = login(email, senha)
    setEnviando(false)
    if (!resultado.ok) {
      setErro(resultado.erro ?? "Não foi possível entrar.")
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-sm">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-primary transition-colors mb-8"
        >
          <ArrowLeft className="size-4" />
          Voltar ao site
        </Link>

        <div className="bg-card border border-border rounded-3xl shadow-sm p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="flex size-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
              <Lock className="size-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-foreground">Acesso profissional</h1>
              <p className="text-sm text-muted-foreground">Sistema de registros ABA</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="seu.email@clinica.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="senha">Senha</Label>
              <Input
                id="senha"
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                required
              />
            </div>

            {erro && (
              <p role="alert" className="text-sm text-destructive font-medium">
                {erro}
              </p>
            )}

            <Button type="submit" disabled={enviando} className="mt-2 rounded-xl font-bold">
              {enviando ? "Entrando..." : "Entrar"}
            </Button>
          </form>

          <div className="mt-6 rounded-xl bg-muted p-3 text-xs text-muted-foreground leading-relaxed">
            <p className="font-semibold text-foreground mb-1">Ambiente de demonstração</p>
            <p>
              Use <span className="font-mono">eduarda@clinica.com</span> (admin) ou{" "}
              <span className="font-mono">camila@clinica.com</span> (psicóloga) com qualquer senha de 4+
              caracteres.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
