"use client"

import { ShieldAlert } from "lucide-react"
import { useAuth } from "@/lib/registros/auth-context"
import { UsuarioForm } from "@/components/registros/usuario-form"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

const PAPEL_LABEL: Record<string, string> = {
  admin: "Administrador",
  psicologo: "Psicólogo(a)",
}

export default function UsuariosPage() {
  const { user, usuarios } = useAuth()

  if (!user || user.papel !== "admin") {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-border bg-card py-16 text-center">
        <ShieldAlert className="size-8 text-muted-foreground" />
        <p className="text-sm font-semibold text-foreground">Acesso restrito</p>
        <p className="text-sm text-muted-foreground max-w-sm">
          Somente administradores podem visualizar e cadastrar novos usuários.
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Usuários</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Gerencie os profissionais com acesso ao sistema. Somente administradores podem criar novos usuários.
        </p>
      </div>

      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>E-mail</TableHead>
              <TableHead>Papel</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {usuarios.map((u) => (
              <TableRow key={u.id}>
                <TableCell className="font-semibold text-foreground">{u.nome}</TableCell>
                <TableCell className="text-muted-foreground">{u.email}</TableCell>
                <TableCell className="text-muted-foreground">{PAPEL_LABEL[u.papel]}</TableCell>
                <TableCell>
                  <Badge variant={u.ativo ? "default" : "outline"}>{u.ativo ? "Ativo" : "Inativo"}</Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="flex flex-col gap-4 max-w-xl">
        <h2 className="text-lg font-bold text-foreground">Novo usuário</h2>
        <UsuarioForm />
      </div>
    </div>
  )
}
