"use client"

import { useState, type FormEvent } from "react"
import { useRouter } from "next/navigation"
import { BookOpenCheck } from "lucide-react"
import { criarProtocoloIntervencaoAlvo } from "@/lib/registros/actions"
import type { PlanoClinicoCompleto } from "@/lib/registros/clinico/modelo"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"

const nomes: Record<string, string> = { tentativas_discretas: "Tentativas discretas", ensino_naturalistico: "Ensino naturalístico", encadeamento: "Encadeamento", modelacao: "Modelação", treino_comunicacao_funcional: "Treino de comunicação funcional", outro: "Outro" }

function FormProtocolo({ pacienteId, alvoId, fechar }: { pacienteId: string; alvoId: string; fechar: () => void }) {
  const router = useRouter(); const [estrategia, setEstrategia] = useState("ensino_naturalistico"); const [ajuda, setAjuda] = useState(""); const [esvanecimento, setEsvanecimento] = useState(""); const [reforcadores, setReforcadores] = useState(""); const [esquema, setEsquema] = useState(""); const [correcao, setCorrecao] = useState(""); const [instrucoes, setInstrucoes] = useState(""); const [erro, setErro] = useState(""); const [salvando, setSalvando] = useState(false)
  async function salvar(e: FormEvent) { e.preventDefault(); setSalvando(true); setErro(""); const r = await criarProtocoloIntervencaoAlvo({ pacienteId, alvoId, estrategiaEnsino: estrategia, hierarquiaAjuda: ajuda, procedimentoEsvanecimento: esvanecimento || null, reforcadores, esquemaReforcamento: esquema, correcaoErro: correcao, instrucoesAplicacao: instrucoes || null }); if (r && "error" in r) setErro(r.error); else { fechar(); router.refresh() } setSalvando(false) }
  return <form onSubmit={salvar} className="space-y-4 rounded-xl border p-4"><div className="space-y-2"><Label>Estratégia de ensino</Label><Select value={estrategia} onValueChange={setEstrategia}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{Object.entries(nomes).map(([valor, nome]) => <SelectItem key={valor} value={valor}>{nome}</SelectItem>)}</SelectContent></Select></div><div className="grid gap-4 sm:grid-cols-2"><Campo label="Hierarquia de ajuda" value={ajuda} setValue={setAjuda} required /><Campo label="Procedimento de esvanecimento" value={esvanecimento} setValue={setEsvanecimento} /><Campo label="Reforçadores previstos" value={reforcadores} setValue={setReforcadores} required /><Campo label="Esquema de reforçamento" value={esquema} setValue={setEsquema} required /><Campo label="Correção de erro" value={correcao} setValue={setCorrecao} required /><Campo label="Instruções de aplicação" value={instrucoes} setValue={setInstrucoes} /></div>{erro && <p className="text-sm text-destructive">{erro}</p>}<div className="flex gap-2"><Button disabled={salvando}>{salvando ? "Salvando..." : "Salvar nova versão"}</Button><Button type="button" variant="secondary" onClick={fechar}>Cancelar</Button></div></form>
}
function Campo({ label, value, setValue, required = false }: { label: string; value: string; setValue: (v: string) => void; required?: boolean }) { return <div className="space-y-2"><Label>{label}</Label><Textarea value={value} onChange={(e) => setValue(e.target.value)} required={required} minLength={required ? 2 : undefined} /></div> }

export function ProtocolosIntervencao({ pacienteId, profissionalAtualId, planos }: { pacienteId: string; profissionalAtualId: string; planos: PlanoClinicoCompleto[] }) {
  const [editando, setEditando] = useState<string | null>(null); const alvos = planos.flatMap((p) => p.objetivos.flatMap((o) => o.alvos)).filter((a) => a.profissional_id === profissionalAtualId)
  if (!alvos.length) return null
  return <section className="space-y-4"><div><h2 className="flex items-center gap-2 text-lg font-bold"><BookOpenCheck className="size-5 text-primary" />Protocolos de intervenção</h2><p className="text-sm text-muted-foreground">Procedimentos versionados para orientar aplicação consistente e rastreável.</p></div>{alvos.map((alvo) => { const atual = [...alvo.protocolos].sort((a,b) => b.versao-a.versao)[0]; return <Card key={alvo.id}><CardHeader><CardTitle className="text-base">{alvo.nome}</CardTitle></CardHeader><CardContent className="space-y-3">{atual ? <div className="grid gap-2 text-sm sm:grid-cols-2"><p><strong>Estratégia:</strong> {nomes[atual.estrategia_ensino]}</p><p><strong>Versão:</strong> {atual.versao}</p><p><strong>Ajuda:</strong> {atual.hierarquia_ajuda}</p><p><strong>Reforçamento:</strong> {atual.esquema_reforcamento}</p><p><strong>Reforçadores:</strong> {atual.reforcadores}</p><p><strong>Correção de erro:</strong> {atual.correcao_erro}</p></div> : <p className="text-sm text-muted-foreground">Nenhum protocolo configurado.</p>}{editando === alvo.id ? <FormProtocolo pacienteId={pacienteId} alvoId={alvo.id} fechar={() => setEditando(null)} /> : <Button size="sm" variant="outline" className="hover:border-primary hover:bg-primary hover:text-primary-foreground" onClick={() => setEditando(alvo.id)}>{atual ? "Nova versão" : "Configurar protocolo"}</Button>}</CardContent></Card>})}</section>
}
