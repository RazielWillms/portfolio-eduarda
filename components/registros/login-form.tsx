"use client"

import { useState, type FormEvent } from "react"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { signIn } from "@/lib/registros/actions"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { LogoConexao } from "@/components/registros/logo-conexao"

export function LoginForm() {
  const [erro, setErro] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setErro(null)
    setEnviando(true)

    const formData = new FormData(event.currentTarget)
    const email = String(formData.get("email") ?? "")
    const senha = String(formData.get("senha") ?? "")

    const resultado = await signIn(email, senha)
    // signIn faz redirect() em caso de sucesso; se retornar, houve erro.
    if (resultado && "error" in resultado) {
      setErro(resultado.error)
    }
    setEnviando(false)
  }

  return (
    <div className="registros-form-scope min-h-screen flex items-center justify-center bg-background px-4 py-12">
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
            <LogoConexao className="size-12" />
            <div>
              <h1 className="text-lg font-bold text-foreground">Conexão ABA</h1>
              <p className="text-sm text-muted-foreground">Gestão clínica integrada</p>
            </div>
          </div>

          <form method="post" onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="seu.email@clinica.com"
                required
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="senha">Senha</Label>
              <Input id="senha" name="senha" type="password" autoComplete="current-password" placeholder="••••••••" required />
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
            <p className="font-semibold text-foreground mb-1">Acesso restrito</p>
            <p>Sua conta é criada por um administrador do sistema. Caso ainda não tenha acesso, solicite o cadastro.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
