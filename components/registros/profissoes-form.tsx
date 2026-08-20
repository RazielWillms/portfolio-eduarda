"use client"

import { useState, useTransition } from "react"
import { salvarProfissao } from "@/lib/registros/actions"
import type { Profissao } from "@/lib/registros/types"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function ProfissoesForm({ profissoes }: { profissoes: Profissao[] }) {
  const [pendente, iniciar] = useTransition()
  const [erro, setErro] = useState("")

  function enviar(form: FormData, profissao: Profissao, ativo = profissao.ativo) {
    setErro("")
    iniciar(async () => {
      const resultado = await salvarProfissao({ id: profissao.id, nome: String(form.get("nome")), conselhoSigla: String(form.get("conselho") || ""), ordem: Number(form.get("ordem") || 0), ativo })
      if ("error" in resultado) setErro(resultado.error)
    })
  }

  return <div className="space-y-4">{erro && <p className="text-sm text-destructive">{erro}</p>}{profissoes.map((profissao) => <Card key={profissao.id} className={!profissao.ativo ? "opacity-60" : undefined}><CardContent className="p-4"><form action={(form) => enviar(form, profissao)} className="grid gap-3 md:grid-cols-[1fr_180px_100px_auto] md:items-end"><Campo label="Profissão"><Input name="nome" defaultValue={profissao.nome} required /></Campo><Campo label="Conselho"><Input name="conselho" defaultValue={profissao.conselho_sigla ?? ""} /></Campo><Campo label="Ordem"><Input name="ordem" type="number" defaultValue={profissao.ordem} /></Campo><div className="flex gap-2"><Button disabled={pendente}>Salvar</Button><Button type="button" variant="secondary" disabled={pendente} onClick={() => { const form = new FormData(); form.set("nome", profissao.nome); form.set("conselho", profissao.conselho_sigla ?? ""); form.set("ordem", String(profissao.ordem)); enviar(form, profissao, !profissao.ativo) }}>{profissao.ativo ? "Desativar" : "Ativar"}</Button></div></form></CardContent></Card>)}</div>
}

export function NovaProfissaoForm() {
  const [pendente, iniciar] = useTransition()
  const [erro, setErro] = useState("")
  const [sucesso, setSucesso] = useState(false)

  function enviar(form: FormData) {
    setErro("")
    setSucesso(false)
    iniciar(async () => {
      const resultado = await salvarProfissao({ id: null, nome: String(form.get("nome")), conselhoSigla: String(form.get("conselho") || ""), ordem: Number(form.get("ordem") || 0), ativo: true })
      if ("error" in resultado) setErro(resultado.error)
      else setSucesso(true)
    })
  }

  return <form action={enviar} className="max-w-2xl space-y-5 rounded-2xl border bg-card p-5 sm:p-6"><div className="grid gap-4 sm:grid-cols-2"><Campo label="Nome da profissão"><Input name="nome" required minLength={2} /></Campo><Campo label="Conselho profissional"><Input name="conselho" placeholder="Ex.: CRP" /></Campo><Campo label="Ordem de exibição"><Input name="ordem" type="number" defaultValue={100} /></Campo></div>{erro && <p className="text-sm text-destructive">{erro}</p>}{sucesso && <p className="text-sm font-medium text-primary">Profissão cadastrada.</p>}<Button disabled={pendente}>{pendente ? "Salvando..." : "Cadastrar profissão"}</Button></form>
}

function Campo({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-2"><Label>{label}</Label>{children}</div>
}
