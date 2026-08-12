"use client"

import { useState, type FormEvent } from "react"
import { useRouter } from "next/navigation"
import { ClipboardCheck, Plus, Target } from "lucide-react"
import { criarAlvoClinico, criarObjetivoClinico, criarPlanoClinico } from "@/lib/registros/actions"
import type { HorizonteObjetivo, NaturezaAlvo, PlanoClinicoCompleto, TipoMedicao } from "@/lib/registros/clinico/modelo"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"

const MEDIDAS: { valor: TipoMedicao; label: string; unidade: string }[] = [
  { valor: "percentual_oportunidades", label: "Percentual de oportunidades", unidade: "%" },
  { valor: "tentativas_discretas", label: "Tentativas discretas", unidade: "tentativas" },
  { valor: "frequencia", label: "Frequência", unidade: "ocorrências" },
  { valor: "taxa", label: "Taxa", unidade: "ocorrências/minuto" },
  { valor: "duracao", label: "Duração", unidade: "segundos" },
  { valor: "latencia", label: "Latência", unidade: "segundos" },
  { valor: "intervalo_parcial", label: "Intervalo parcial", unidade: "% de intervalos" },
  { valor: "intervalo_total", label: "Intervalo total", unidade: "% de intervalos" },
  { valor: "amostragem_momentanea", label: "Amostragem momentânea", unidade: "% de amostras" },
  { valor: "escala_independencia", label: "Escala de independência", unidade: "nível" },
  { valor: "intensidade", label: "Intensidade", unidade: "nível" },
]

const STATUS_PLANO: Record<string, string> = {
  rascunho: "Rascunho", em_revisao: "Em revisão", aprovado: "Aprovado",
  em_execucao: "Em execução", encerrado: "Encerrado",
}

function Erro({ mensagem }: { mensagem: string }) {
  return mensagem ? <p className="text-sm text-destructive">{mensagem}</p> : null
}

function NovoPlano({ pacienteId }: { pacienteId: string }) {
  const router = useRouter(); const [aberto, setAberto] = useState(false); const [titulo, setTitulo] = useState("")
  const [justificativa, setJustificativa] = useState(""); const [erro, setErro] = useState(""); const [salvando, setSalvando] = useState(false)
  async function salvar(e: FormEvent) {
    e.preventDefault(); setSalvando(true); setErro("")
    const r = await criarPlanoClinico({ pacienteId, titulo, justificativa: justificativa || null })
    if (r && "error" in r) setErro(r.error); else { setTitulo(""); setJustificativa(""); setAberto(false); router.refresh() }
    setSalvando(false)
  }
  if (!aberto) return <Button onClick={() => setAberto(true)}><Plus className="size-4" />Novo plano clínico</Button>
  return <form onSubmit={salvar} className="rounded-2xl border bg-card p-4 space-y-4"><div><h3 className="font-bold">Novo plano clínico</h3><p className="text-sm text-muted-foreground">O plano será criado como rascunho.</p></div><div className="space-y-2"><Label htmlFor="plano-titulo">Título</Label><Input id="plano-titulo" value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Ex.: Plano de desenvolvimento de comunicação" required minLength={3} /></div><div className="space-y-2"><Label htmlFor="plano-justificativa">Justificativa inicial</Label><Textarea id="plano-justificativa" value={justificativa} onChange={(e) => setJustificativa(e.target.value)} rows={3} /></div><Erro mensagem={erro} /><div className="flex gap-2"><Button type="submit" disabled={salvando}>{salvando ? "Criando..." : "Criar plano"}</Button><Button type="button" variant="ghost" onClick={() => setAberto(false)}>Cancelar</Button></div></form>
}

function NovoObjetivo({ pacienteId, planoId }: { pacienteId: string; planoId: string }) {
  const router = useRouter(); const [aberto, setAberto] = useState(false); const [descricao, setDescricao] = useState("")
  const [horizonte, setHorizonte] = useState<HorizonteObjetivo>("curto_prazo"); const [erro, setErro] = useState(""); const [salvando, setSalvando] = useState(false)
  async function salvar(e: FormEvent) { e.preventDefault(); setSalvando(true); setErro(""); const r = await criarObjetivoClinico({ pacienteId, planoId, descricao, horizonte }); if (r && "error" in r) setErro(r.error); else { setDescricao(""); setAberto(false); router.refresh() } setSalvando(false) }
  if (!aberto) return <Button size="sm" onClick={() => setAberto(true)}><Plus className="size-3.5" />Adicionar objetivo</Button>
  return <form onSubmit={salvar} className="rounded-xl border p-4 space-y-3"><div className="space-y-2"><Label>Objetivo clínico</Label><Textarea value={descricao} onChange={(e) => setDescricao(e.target.value)} placeholder="Descreva o resultado funcional esperado" required /></div><div className="space-y-2 max-w-52"><Label>Horizonte</Label><Select value={horizonte} onValueChange={(v) => setHorizonte(v as HorizonteObjetivo)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="curto_prazo">Curto prazo</SelectItem><SelectItem value="longo_prazo">Longo prazo</SelectItem></SelectContent></Select></div><Erro mensagem={erro} /><div className="flex gap-2"><Button size="sm" type="submit" disabled={salvando}>Salvar objetivo</Button><Button size="sm" type="button" variant="ghost" onClick={() => setAberto(false)}>Cancelar</Button></div></form>
}

function NovoAlvo({ pacienteId, objetivoId }: { pacienteId: string; objetivoId: string }) {
  const router = useRouter(); const [aberto, setAberto] = useState(false); const [nome, setNome] = useState(""); const [categoria, setCategoria] = useState("")
  const [natureza, setNatureza] = useState<NaturezaAlvo>("aquisicao"); const [descricao, setDescricao] = useState(""); const [resposta, setResposta] = useState(""); const [tipo, setTipo] = useState<TipoMedicao>("percentual_oportunidades"); const [unidade, setUnidade] = useState("%")
  const [erro, setErro] = useState(""); const [salvando, setSalvando] = useState(false)
  async function salvar(e: FormEvent) { e.preventDefault(); setSalvando(true); setErro(""); const r = await criarAlvoClinico({ pacienteId, objetivoId, nome, categoria: categoria || null, natureza, descricaoObservavel: descricao, respostaEsperada: resposta || null, tipoMedicao: tipo, unidade }); if (r && "error" in r) setErro(r.error); else { setAberto(false); router.refresh() } setSalvando(false) }
  if (!aberto) return <Button size="sm" onClick={() => setAberto(true)}><Plus className="size-3.5" />Adicionar alvo</Button>
  return <form onSubmit={salvar} className="rounded-xl bg-muted/60 p-4 space-y-4"><div><h4 className="font-semibold">Novo alvo clínico</h4><p className="text-xs text-muted-foreground">A definição e a medição serão salvas juntas na versão 1.</p></div><div className="grid gap-4 sm:grid-cols-3"><div className="space-y-2"><Label>Nome do alvo</Label><Input value={nome} onChange={(e) => setNome(e.target.value)} required /></div><div className="space-y-2"><Label>Categoria</Label><Input value={categoria} onChange={(e) => setCategoria(e.target.value)} placeholder="Ex.: Comunicação" /></div><div className="space-y-2"><Label>Natureza</Label><Select value={natureza} onValueChange={(v) => setNatureza(v as NaturezaAlvo)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="aquisicao">Aquisição de habilidade</SelectItem><SelectItem value="reducao">Redução de comportamento</SelectItem></SelectContent></Select></div></div><div className="space-y-2"><Label>Definição observável</Label><Textarea value={descricao} onChange={(e) => setDescricao(e.target.value)} placeholder="Descreva exatamente o comportamento que pode ser observado e medido" minLength={10} required rows={3} /></div><div className="space-y-2"><Label>Resposta esperada</Label><Textarea value={resposta} onChange={(e) => setResposta(e.target.value)} rows={2} /></div><div className="grid gap-4 sm:grid-cols-2"><div className="space-y-2"><Label>Tipo de medida</Label><Select value={tipo} onValueChange={(v) => { const m = MEDIDAS.find((item) => item.valor === v)!; setTipo(v as TipoMedicao); setUnidade(m.unidade) }}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{MEDIDAS.map((m) => <SelectItem key={m.valor} value={m.valor}>{m.label}</SelectItem>)}</SelectContent></Select></div><div className="space-y-2"><Label>Unidade</Label><Input value={unidade} onChange={(e) => setUnidade(e.target.value)} required /></div></div><Erro mensagem={erro} /><div className="flex gap-2"><Button size="sm" type="submit" disabled={salvando}>{salvando ? "Salvando..." : "Criar alvo"}</Button><Button size="sm" type="button" variant="ghost" onClick={() => setAberto(false)}>Cancelar</Button></div></form>
}

export function FundacaoClinica({ pacienteId, profissionalAtualId, planos }: { pacienteId: string; profissionalAtualId: string; planos: PlanoClinicoCompleto[] }) {
  return <section className="space-y-4"><div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><h2 className="flex items-center gap-2 text-lg font-bold"><ClipboardCheck className="size-5 text-primary" />Planos e alvos clínicos</h2><p className="text-sm text-muted-foreground">Estrutura versionada para definições operacionais e medições objetivas.</p></div><NovoPlano pacienteId={pacienteId} /></div>
    {planos.length === 0 && <div className="rounded-2xl border border-dashed p-8 text-center text-sm text-muted-foreground">Nenhum plano clínico criado. Comece adicionando o primeiro plano.</div>}
    {planos.map((plano) => { const editavel = plano.profissional_responsavel_id === profissionalAtualId; return <Card key={plano.id}><CardHeader className="pb-3"><div className="flex flex-wrap items-center justify-between gap-2"><CardTitle className="text-base">{plano.titulo}</CardTitle><Badge variant="outline">{STATUS_PLANO[plano.status]}</Badge></div>{plano.justificativa && <p className="text-sm text-muted-foreground">{plano.justificativa}</p>}</CardHeader><CardContent className="space-y-4">{plano.objetivos.sort((a,b) => a.ordem-b.ordem).map((objetivo) => <div key={objetivo.id} className="rounded-xl border p-4 space-y-3"><div className="flex flex-wrap items-start justify-between gap-2"><div><p className="font-semibold">{objetivo.descricao}</p><p className="text-xs text-muted-foreground">{objetivo.horizonte === "curto_prazo" ? "Curto prazo" : "Longo prazo"}</p></div>{editavel && <NovoAlvo pacienteId={pacienteId} objetivoId={objetivo.id} />}</div>{objetivo.alvos.length === 0 ? <p className="text-sm text-muted-foreground">Nenhum alvo definido.</p> : <div className="grid gap-3 lg:grid-cols-2">{objetivo.alvos.map((alvo) => { const definicao = [...alvo.definicoes].sort((a,b) => b.versao-a.versao)[0]; const medicao = [...alvo.medicoes].sort((a,b) => b.versao-a.versao)[0]; return <div key={alvo.id} className="rounded-xl bg-muted p-3"><div className="flex items-center justify-between gap-2"><p className="flex items-center gap-2 font-semibold"><Target className="size-4 text-primary" />{alvo.nome}</p><Badge variant="secondary">{alvo.fase.replaceAll("_"," ")}</Badge></div><p className="mt-2 text-sm">{definicao?.descricao_observavel}</p><p className="mt-2 text-xs text-muted-foreground">Medição: {MEDIDAS.find((m) => m.valor === medicao?.tipo)?.label ?? medicao?.tipo} · {medicao?.unidade}</p></div> })}</div>}</div>)}{editavel && <NovoObjetivo pacienteId={pacienteId} planoId={plano.id} />}{!editavel && <p className="text-xs text-muted-foreground">Plano de outro profissional disponível em modo somente leitura.</p>}</CardContent></Card> })}
  </section>
}
