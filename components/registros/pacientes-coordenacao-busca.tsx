"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { ChevronLeft, ChevronRight, Search, Users } from "lucide-react"
import { buscarPacientesCoordenacao } from "@/lib/registros/actions"
import type { PacienteCoordenacaoResumo } from "@/lib/registros/types"
import { SolicitarAcessoLista } from "@/components/registros/solicitar-acesso-lista"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export function PacientesCoordenacaoBusca() {
  const [busca, setBusca] = useState("")
  const [status, setStatus] = useState("ativo")
  const [pagina, setPagina] = useState(0)
  const [itens, setItens] = useState<PacienteCoordenacaoResumo[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState("")
  const limite = 20
  const total = Number(itens[0]?.total ?? 0)
  const paginas = Math.max(1, Math.ceil(total / limite))

  useEffect(() => {
    let ativo = true
    setCarregando(true)
    setErro("")
    const timer = setTimeout(async () => {
      const resultado = await buscarPacientesCoordenacao({ busca, status, limite, offset: pagina * limite })
      if (!ativo) return
      if ("error" in resultado) { setErro(resultado.error); setItens([]) }
      else setItens(resultado.data as PacienteCoordenacaoResumo[])
      setCarregando(false)
    }, 250)
    return () => { ativo = false; clearTimeout(timer) }
  }, [busca, status, pagina])

  return <div className="space-y-4">
    <div className="flex flex-col gap-3 rounded-2xl border bg-card p-4 sm:flex-row">
      <div className="relative flex-1"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input value={busca} onChange={(event) => { setBusca(event.target.value); setPagina(0) }} placeholder="Buscar por paciente ou responsável..." className="pl-9" /></div>
      <Select value={status} onValueChange={(valor) => { setStatus(valor); setPagina(0) }}><SelectTrigger className="w-full sm:w-40"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="ativo">Ativos</SelectItem><SelectItem value="inativo">Inativos</SelectItem><SelectItem value="todos">Todos</SelectItem></SelectContent></Select>
    </div>
    <div className="overflow-hidden rounded-2xl border bg-card">
      {carregando ? <p className="p-10 text-center text-sm text-muted-foreground">Carregando pacientes...</p> : itens.map((item) => <div key={item.id} className="flex flex-col gap-3 border-b px-5 py-4 last:border-0 sm:flex-row sm:items-center sm:justify-between"><div className="min-w-0">{item.vinculado_usuario ? <Link href={`/registros/pacientes/${item.id}`} className="font-semibold text-primary hover:underline">{item.nome}</Link> : <p className="font-semibold">{item.nome}</p>}<p className="truncate text-xs text-muted-foreground">{item.responsavel ? `Responsável: ${item.responsavel} · ` : ""}{item.vinculado_usuario ? "Prontuário disponível" : "Prontuário não disponível"}</p></div><div className="flex flex-wrap items-center gap-2"><span className={item.profissionais_vinculados === 0 ? "rounded-full bg-amber-100 px-2 py-1 text-xs text-amber-800" : "inline-flex items-center gap-1 rounded-full bg-muted px-2 py-1 text-xs text-muted-foreground"}><Users className="size-3" />{item.profissionais_vinculados === 0 ? "Sem profissional" : `${item.profissionais_vinculados} profissional(is)`}</span>{!item.vinculado_usuario && <SolicitarAcessoLista pacienteId={item.id} />}</div></div>)}
      {!carregando && !itens.length && !erro && <p className="p-10 text-center text-sm text-muted-foreground">Nenhum paciente encontrado.</p>}
      {erro && <p className="p-6 text-sm text-destructive">{erro}</p>}
    </div>
    <div className="flex items-center justify-between"><p className="text-xs text-muted-foreground">{total} paciente(s)</p><div className="flex items-center gap-2"><Button type="button" size="icon" variant="secondary" disabled={pagina === 0 || carregando} onClick={() => setPagina((atual) => atual - 1)}><ChevronLeft className="size-4" /></Button><span className="text-sm">{pagina + 1} de {paginas}</span><Button type="button" size="icon" variant="secondary" disabled={pagina + 1 >= paginas || carregando} onClick={() => setPagina((atual) => atual + 1)}><ChevronRight className="size-4" /></Button></div></div>
  </div>
}
