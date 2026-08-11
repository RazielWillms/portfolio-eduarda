"use client"

import { useState } from "react"
import { updateUsuarioPapel, updateUsuarioStatus } from "@/lib/registros/actions"
import type { Papel, Profile, StatusUsuario } from "@/lib/registros/types"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

const PAPEL_LABEL: Record<string, string> = {
  admin: "Administrador",
  profissional: "Profissional",
}

export function UsuariosTabela({ usuarios, usuarioAtualId }: { usuarios: Profile[]; usuarioAtualId: string }) {
  const [erro, setErro] = useState("")

  async function handlePapelChange(id: string, papel: Papel) {
    setErro("")
    const resultado = await updateUsuarioPapel(id, papel)
    if (resultado && "error" in resultado) setErro(resultado.error)
  }

  async function handleStatusChange(id: string, status: StatusUsuario) {
    setErro("")
    const resultado = await updateUsuarioStatus(id, status)
    if (resultado && "error" in resultado) setErro(resultado.error)
  }

  return (
    <div className="flex flex-col gap-3">
      {erro && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-2.5 text-sm text-destructive">
          {erro}
        </div>
      )}
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
            {usuarios.map((u) => {
              const isAtual = u.id === usuarioAtualId
              const protegido = u.admin_principal
              return (
                <TableRow key={u.id}>
                  <TableCell className="font-semibold text-foreground">
                    {u.nome}
                    {isAtual && <span className="text-muted-foreground font-normal"> (você)</span>}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{u.email}</TableCell>
                  <TableCell>
                    {isAtual || protegido ? (
                      <span className="text-muted-foreground">{protegido ? "Administrador principal" : PAPEL_LABEL[u.papel]}</span>
                    ) : (
                      <Select value={u.papel} onValueChange={(v) => handlePapelChange(u.id, v as Papel)}>
                        <SelectTrigger className="w-40">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="profissional">Profissional</SelectItem>
                          <SelectItem value="admin">Administrador</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  </TableCell>
                  <TableCell>
                    {isAtual || protegido ? (
                      <Badge variant="default">Ativo</Badge>
                    ) : (
                      <Select value={u.status} onValueChange={(v) => handleStatusChange(u.id, v as StatusUsuario)}>
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ativo">Ativo</SelectItem>
                          <SelectItem value="inativo">Inativo</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
