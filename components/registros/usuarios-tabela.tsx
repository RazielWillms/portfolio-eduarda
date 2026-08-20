"use client"

import { Fragment, useState } from "react"
import { KeyRound, RefreshCw } from "lucide-react"
import { redefinirSenhaUsuario, updateUsuarioPapel, updateUsuarioProfissao, updateUsuarioStatus } from "@/lib/registros/actions"
import type { Papel, Profissao, StatusUsuario, UsuarioResumo } from "@/lib/registros/types"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

const PAPEL_LABEL: Record<string, string> = {
  admin: "Administrador",
  profissional: "Profissional",
  coordenacao: "Coordenação",
}

function gerarSenhaProvisoria() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789"
  return Array.from({ length: 12 }, () => chars[Math.floor(Math.random() * chars.length)]).join("")
}

export function UsuariosTabela({ usuarios, profissoes, usuarioAtualId, podeRedefinirSenha }: { usuarios: UsuarioResumo[]; profissoes: Profissao[]; usuarioAtualId: string; podeRedefinirSenha: boolean }) {
  const [erro, setErro] = useState("")
  const [sucesso, setSucesso] = useState("")
  const [redefinindo, setRedefinindo] = useState<string | null>(null)
  const [senhaProvisoria, setSenhaProvisoria] = useState(gerarSenhaProvisoria)
  const [processando, setProcessando] = useState(false)

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

  async function handleProfissaoChange(id:string,profissaoId:string){setErro("");const resultado=await updateUsuarioProfissao(id,profissaoId==="nenhuma"?"":profissaoId);if(resultado&&"error"in resultado)setErro(resultado.error)}

  async function handleRedefinirSenha(usuario: UsuarioResumo) {
    setErro(""); setSucesso(""); setProcessando(true)
    const resultado = await redefinirSenhaUsuario({ usuarioId: usuario.id, senhaProvisoria })
    setProcessando(false)
    if (resultado && "error" in resultado) { setErro(resultado.error); return }
    setSucesso(`Senha de ${usuario.nome} redefinida. Senha provisória: ${senhaProvisoria} — compartilhe por um canal seguro.`)
    setRedefinindo(null); setSenhaProvisoria(gerarSenhaProvisoria())
  }

  return (
    <div className="flex flex-col gap-3">
      {erro && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-2.5 text-sm text-destructive">
          {erro}
        </div>
      )}
      {sucesso && <div className="rounded-xl border border-primary/30 bg-primary/10 px-4 py-2.5 text-sm text-foreground">{sucesso}</div>}
      <div className="space-y-3 md:hidden">
        {usuarios.map((u) => { const isAtual=u.id===usuarioAtualId,protegido=u.admin_principal;return <div key={u.id} className="space-y-4 rounded-2xl border bg-card p-4"><div><div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="break-words font-semibold">{u.nome}{isAtual&&<span className="font-normal text-muted-foreground"> (você)</span>}</p><p className="break-all text-sm text-muted-foreground">{u.email}</p></div>{(isAtual||protegido)&&<Badge>Ativo</Badge>}</div></div><div className="grid gap-3"><label className="space-y-1.5 text-sm font-medium"><span className="block">Profissão</span><Select value={u.profissao_id??"nenhuma"} onValueChange={(valor)=>handleProfissaoChange(u.id,valor)}><SelectTrigger className="w-full"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="nenhuma">Não informada</SelectItem>{profissoes.map((item)=><SelectItem key={item.id} value={item.id} disabled={!item.ativo}>{item.nome}{!item.ativo?" (inativa)":""}</SelectItem>)}</SelectContent></Select></label><label className="space-y-1.5 text-sm font-medium"><span className="block">Papel</span>{isAtual||protegido?<div className="rounded-lg border bg-muted px-3 py-2.5 font-normal text-muted-foreground">{protegido?"Administrador principal":PAPEL_LABEL[u.papel]}</div>:<Select value={u.papel} onValueChange={(valor)=>handlePapelChange(u.id,valor as Papel)}><SelectTrigger className="w-full"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="profissional">Profissional</SelectItem><SelectItem value="coordenacao">Coordenação</SelectItem><SelectItem value="admin">Administrador</SelectItem></SelectContent></Select>}</label>{!isAtual&&!protegido&&<label className="space-y-1.5 text-sm font-medium"><span className="block">Status</span><Select value={u.status} onValueChange={(valor)=>handleStatusChange(u.id,valor as StatusUsuario)}><SelectTrigger className="w-full"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="ativo">Ativo</SelectItem><SelectItem value="inativo">Inativo</SelectItem></SelectContent></Select></label>}</div>{podeRedefinirSenha&&!isAtual&&!protegido&&<Button className="w-full" variant="outline" onClick={()=>{setRedefinindo(u.id);setSenhaProvisoria(gerarSenhaProvisoria());setErro("");setSucesso("")}}><KeyRound className="size-4"/>Redefinir senha</Button>}{redefinindo===u.id&&<div className="space-y-3 rounded-xl bg-muted p-3"><p className="text-sm font-semibold">Nova senha provisória</p><div className="flex gap-2"><Input className="font-mono" minLength={8} value={senhaProvisoria} onChange={(e)=>setSenhaProvisoria(e.target.value)}/><Button type="button" size="icon" variant="outline" aria-label="Gerar outra senha" onClick={()=>setSenhaProvisoria(gerarSenhaProvisoria())}><RefreshCw className="size-4"/></Button></div><p className="text-xs text-muted-foreground">Oriente o usuário a alterá-la em Minha conta após entrar.</p><div className="grid grid-cols-2 gap-2"><Button variant="secondary" onClick={()=>setRedefinindo(null)}>Cancelar</Button><Button disabled={processando||senhaProvisoria.length<8} onClick={()=>handleRedefinirSenha(u)}>{processando?"Redefinindo...":"Confirmar"}</Button></div></div>}</div>})}
      </div>
      <div className="hidden overflow-hidden rounded-2xl border border-border bg-card md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>E-mail</TableHead>
              <TableHead>Profissão</TableHead>
              <TableHead>Papel</TableHead>
              <TableHead>Status</TableHead>
              {podeRedefinirSenha && <TableHead>Suporte</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {usuarios.map((u) => {
              const isAtual = u.id === usuarioAtualId
              const protegido = u.admin_principal
              return (
                <Fragment key={u.id}>
                <TableRow>
                  <TableCell className="font-semibold text-foreground">
                    {u.nome}
                    {isAtual && <span className="text-muted-foreground font-normal"> (você)</span>}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{u.email}</TableCell>
                  <TableCell><Select value={u.profissao_id??"nenhuma"} onValueChange={(valor)=>handleProfissaoChange(u.id,valor)}><SelectTrigger className="w-48"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="nenhuma">Não informada</SelectItem>{profissoes.map((item)=><SelectItem key={item.id} value={item.id} disabled={!item.ativo}>{item.nome}{!item.ativo?" (inativa)":""}</SelectItem>)}</SelectContent></Select></TableCell>
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
                          <SelectItem value="coordenacao">Coordenação</SelectItem>
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
                  {podeRedefinirSenha && <TableCell>{!isAtual && !protegido && <Button size="sm" variant="outline" className="hover:border-primary hover:bg-primary hover:text-primary-foreground" onClick={() => { setRedefinindo(u.id); setSenhaProvisoria(gerarSenhaProvisoria()); setErro(""); setSucesso("") }}><KeyRound className="size-4"/>Redefinir senha</Button>}</TableCell>}
                </TableRow>
                {redefinindo === u.id && <TableRow><TableCell colSpan={podeRedefinirSenha ? 5 : 4}><div className="flex flex-col gap-3 rounded-xl bg-muted p-4 sm:flex-row sm:items-end"><div className="flex-1"><p className="mb-2 text-sm font-semibold">Nova senha provisória para {u.nome}</p><div className="flex gap-2"><Input className="font-mono" minLength={8} value={senhaProvisoria} onChange={(e) => setSenhaProvisoria(e.target.value)}/><Button type="button" size="icon" variant="outline" aria-label="Gerar outra senha" onClick={() => setSenhaProvisoria(gerarSenhaProvisoria())}><RefreshCw className="size-4"/></Button></div><p className="mt-2 text-xs text-muted-foreground">A senha atual não é exibida. Oriente o usuário a alterá-la em Minha conta após entrar.</p></div><div className="flex gap-2"><Button disabled={processando || senhaProvisoria.length < 8} onClick={() => handleRedefinirSenha(u)}>{processando ? "Redefinindo..." : "Confirmar"}</Button><Button variant="secondary" className="bg-slate-200 text-slate-700 hover:bg-slate-300 hover:text-slate-900" onClick={() => setRedefinindo(null)}>Cancelar</Button></div></div></TableCell></TableRow>}
                </Fragment>
              )
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
