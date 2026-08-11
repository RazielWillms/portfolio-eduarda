"use client"

import { useState } from "react"
import { Check, Copy, Link2, ShieldOff } from "lucide-react"
import { criarAcessoResponsavel, revogarAcessoResponsavel } from "@/lib/registros/actions"
import type { AcessoResponsavel } from "@/lib/registros/responsavel/types"
import { calcularStatusAcesso } from "@/lib/registros/responsavel/status-acesso"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export function CompartilhamentoResponsavel({ pacienteId, acessos }: { pacienteId: string; acessos: AcessoResponsavel[] }) {
  const [acessosLocais, setAcessosLocais] = useState(acessos)
  const [validade, setValidade] = useState("30")
  const [escopo, setEscopo] = useState<"profissional" | "equipe">("profissional")
  const [descricao, setDescricao] = useState("Responsável")
  const [novoLink, setNovoLink] = useState<string | null>(null)
  const [copiado, setCopiado] = useState(false)
  const [processando, setProcessando] = useState(false)
  const [erro, setErro] = useState("")
  const formatar = (data: string) => new Date(data).toLocaleString("pt-BR")

  async function gerar() {
    setProcessando(true); setErro(""); setNovoLink(null)
    const resultado = await criarAcessoResponsavel({ pacienteId, descricao, escopo, validadeDias: validade === "sem_prazo" ? null : Number(validade) as 7 | 30 | 90 })
    if (resultado && "error" in resultado) setErro(resultado.error)
    else if (resultado && "acesso" in resultado) {
      setNovoLink(`${window.location.origin}/acompanhamento/${resultado.acesso.token}`)
      const revogadoEm = new Date().toISOString()
      setAcessosLocais((atuais) => [{
        id: resultado.acesso.id,
        descricao: descricao.trim() || "Responsável",
        criado_em: resultado.acesso.criado_em,
        expira_em: resultado.acesso.expira_em,
        revogado_em: null,
        ultimo_acesso_em: null,
        ativo: true,
        escopo,
      }, ...atuais.map((acesso) => calcularStatusAcesso(acesso) === "ativo"
        ? { ...acesso, ativo: false, revogado_em: revogadoEm }
        : acesso)])
    }
    setProcessando(false)
  }
  async function copiar() {
    if (!novoLink) return
    await navigator.clipboard.writeText(novoLink); setCopiado(true); setTimeout(() => setCopiado(false), 2500)
  }
  async function revogar(id: string) {
    setProcessando(true); const resultado = await revogarAcessoResponsavel({ acessoId: id, pacienteId })
    if (resultado && "error" in resultado) setErro(resultado.error)
    else setAcessosLocais((atuais) => atuais.map((acesso) => acesso.id === id
      ? { ...acesso, ativo: false, revogado_em: new Date().toISOString() }
      : acesso))
    setProcessando(false)
  }

  const acessosAtivos = acessosLocais.filter((acesso) => calcularStatusAcesso(acesso) === "ativo")
  const acessosEncerrados = acessosLocais.filter((acesso) => calcularStatusAcesso(acesso) !== "ativo")

  function renderAcesso(a: AcessoResponsavel) {
    const ativo = calcularStatusAcesso(a) === "ativo"
    return <div key={a.id} className="rounded-xl border p-4 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3"><div><div className="flex items-center gap-2"><p className="font-semibold text-sm">{a.descricao}</p><Badge variant={ativo ? "outline" : "secondary"}>{ativo ? "Ativo" : a.revogado_em ? "Revogado" : "Expirado"}</Badge></div><div className="mt-2 grid sm:grid-cols-3 gap-x-5 gap-y-1 text-xs text-muted-foreground"><span>Criado: {formatar(a.criado_em)}</span><span>Expira: {a.expira_em ? formatar(a.expira_em) : "Sem prazo"}</span><span>Último acesso: {a.ultimo_acesso_em ? formatar(a.ultimo_acesso_em) : "Nunca"}</span></div></div>{ativo && <Button size="sm" variant="outline" disabled={processando} onClick={() => revogar(a.id)}><ShieldOff className="size-4" />Revogar</Button>}</div>
  }

  return <section className="rounded-2xl border border-border bg-card p-5 flex flex-col gap-5">
    <div><h2 className="text-lg font-bold flex items-center gap-2"><Link2 className="size-5 text-primary" />Compartilhamento com responsáveis</h2><p className="text-sm text-muted-foreground">Links externos somente leitura. O token completo é mostrado apenas na geração.</p></div>
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-[1fr_13rem_11rem_auto] gap-3 items-end"><div><Label>Identificação do acesso</Label><Input className="mt-2" value={descricao} onChange={(e) => setDescricao(e.target.value)} maxLength={80} /></div><div><Label>Dados compartilhados</Label><Select value={escopo} onValueChange={(valor) => setEscopo(valor as "profissional" | "equipe")}><SelectTrigger className="mt-2 w-full"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="profissional">Somente meus registros</SelectItem><SelectItem value="equipe">Equipe vinculada</SelectItem></SelectContent></Select></div><div><Label>Validade</Label><Select value={validade} onValueChange={setValidade}><SelectTrigger className="mt-2"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="7">7 dias</SelectItem><SelectItem value="30">30 dias</SelectItem><SelectItem value="90">90 dias</SelectItem><SelectItem value="sem_prazo">Sem prazo</SelectItem></SelectContent></Select></div><Button onClick={gerar} disabled={processando}>Gerar acesso</Button></div>
    {novoLink && <div className="rounded-xl border border-primary/30 bg-primary/5 p-4"><p className="text-sm font-semibold">Copie este link agora</p><p className="text-xs text-muted-foreground mt-1">Por segurança, ele não poderá ser recuperado depois.</p><div className="flex flex-col sm:flex-row gap-2 mt-3"><Input readOnly value={novoLink} /><Button onClick={copiar} className="shrink-0">{copiado ? <Check className="size-4" /> : <Copy className="size-4" />}{copiado ? "Link copiado" : "Copiar link"}</Button></div></div>}
    {erro && <p className="text-sm text-destructive">{erro}</p>}
    <div className="space-y-3"><h3 className="font-semibold text-sm">Acesso externo ativo</h3>{acessosAtivos.length === 0 ? <p className="text-sm text-muted-foreground">Nenhum acesso externo ativo.</p> : acessosAtivos.map(renderAcesso)}</div>
    {acessosEncerrados.length > 0 && <details className="rounded-xl border p-4"><summary className="cursor-pointer text-sm font-semibold">Acessos revogados e expirados ({acessosEncerrados.length})</summary><div className="mt-3 space-y-3">{acessosEncerrados.map(renderAcesso)}</div></details>}
  </section>
}
