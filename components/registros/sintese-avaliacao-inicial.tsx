"use client"

import { useState, type FormEvent } from "react"
import { useRouter } from "next/navigation"
import { CheckCircle2, ClipboardCheck, Plus } from "lucide-react"
import { registrarSinteseAvaliacao } from "@/lib/registros/actions"
import type { SessaoClinicaComRegistros, SinteseAvaliacaoInicial } from "@/lib/registros/clinico/modelo"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

const finalidade:Record<string,string>={vinculo_acolhimento:"Vínculo e acolhimento",entrevista_responsaveis:"Entrevista com responsáveis",avaliacao_inicial:"Avaliação inicial",observacao_clinica:"Observação clínica",orientacao_equipe:"Orientação de equipe"}
const hoje=()=>new Date().toISOString().slice(0,10)

export function SinteseAvaliacaoInicial({pacienteId,sessoes,sinteses}:{pacienteId:string;sessoes:SessaoClinicaComRegistros[];sinteses:SinteseAvaliacaoInicial[]}){
  const router=useRouter();const atual=sinteses[0]
  const [aberto,setAberto]=useState(sinteses.length===0);const [inicio,setInicio]=useState(atual?.periodo_inicio??hoje());const [fim,setFim]=useState(atual?.periodo_fim??hoje())
  const [fontes,setFontes]=useState(atual?.fontes_informacao??"");const [potencialidades,setPotencialidades]=useState(atual?.potencialidades??"")
  const [necessidades,setNecessidades]=useState(atual?.necessidades_identificadas??"");const [prioridades,setPrioridades]=useState(atual?.prioridades_recomendadas??"")
  const [recomendacoes,setRecomendacoes]=useState(atual?.recomendacoes_iniciais??"");const [conclusao,setConclusao]=useState(atual?.conclusao??"")
  const [selecionadas,setSelecionadas]=useState<string[]>(atual?.sessoes_consideradas??[]);const [erro,setErro]=useState("");const [salvando,setSalvando]=useState(false)
  const sessoesIniciais=sessoes.filter((s)=>finalidade[s.finalidade])
  function alternar(id:string,marcada:boolean){setSelecionadas((ids)=>marcada?[...new Set([...ids,id])]:ids.filter((x)=>x!==id))}
  async function salvar(status:"rascunho"|"concluida"){setSalvando(true);setErro("");const r=await registrarSinteseAvaliacao({pacienteId,status,periodoInicio:inicio,periodoFim:fim,fontesInformacao:fontes,potencialidades,necessidadesIdentificadas:necessidades,prioridadesRecomendadas:prioridades,recomendacoesIniciais:recomendacoes||null,conclusao:conclusao||null,sessoesConsideradas:selecionadas});if(r&&"error"in r)setErro(r.error);else{setAberto(false);router.refresh()}setSalvando(false)}
  function enviar(e:FormEvent){e.preventDefault();void salvar("concluida")}
  return <div className="space-y-6">
    <section className="rounded-2xl border bg-card p-5"><div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div><div className="flex items-center gap-2"><ClipboardCheck className="size-5 text-primary"/><h2 className="text-lg font-bold">Síntese da avaliação inicial</h2></div><p className="mt-1 max-w-2xl text-sm text-muted-foreground">Organize evidências das sessões iniciais antes de definir prioridades, objetivos e alvos. Cada salvamento preserva uma nova versão.</p></div>{!aberto&&<Button onClick={()=>setAberto(true)}><Plus className="size-4"/>{atual?"Nova versão":"Criar síntese"}</Button>}</div></section>
    {aberto&&<form onSubmit={enviar} className="space-y-5 rounded-2xl border bg-card p-5"><div className="grid gap-4 sm:grid-cols-2"><div className="space-y-2"><Label>Início do período avaliado</Label><Input type="date" value={inicio} onChange={(e)=>setInicio(e.target.value)} required/></div><div className="space-y-2"><Label>Fim do período avaliado</Label><Input type="date" value={fim} min={inicio} onChange={(e)=>setFim(e.target.value)} required/></div></div>
      <div className="space-y-2"><Label>Sessões consideradas</Label>{sessoesIniciais.length===0?<p className="rounded-xl bg-muted p-3 text-sm text-muted-foreground">Nenhuma sessão inicial registrada ainda. A síntese pode ser salva, mas registre vínculo, entrevista, avaliação ou observação para fortalecer sua fundamentação.</p>:<div className="grid gap-2 sm:grid-cols-2">{sessoesIniciais.map((s)=><label key={s.id} className="flex items-start gap-3 rounded-xl border p-3 text-sm"><Checkbox checked={selecionadas.includes(s.id)} onCheckedChange={(v)=>alternar(s.id,v===true)}/><span><strong>{finalidade[s.finalidade]}</strong><span className="block text-xs text-muted-foreground">{new Date(`${s.data}T12:00:00`).toLocaleDateString("pt-BR")}{s.contexto?` · ${s.contexto}`:""}</span></span></label>)}</div>}</div>
      <div className="space-y-2"><Label>Fontes de informação</Label><Textarea value={fontes} onChange={(e)=>setFontes(e.target.value)} placeholder="Ex.: entrevista com responsáveis, observação direta e documentos consultados" minLength={3} required/></div>
      <div className="grid gap-4 sm:grid-cols-2"><div className="space-y-2"><Label>Potencialidades e repertórios presentes</Label><Textarea value={potencialidades} onChange={(e)=>setPotencialidades(e.target.value)} minLength={3} required rows={5}/></div><div className="space-y-2"><Label>Necessidades identificadas</Label><Textarea value={necessidades} onChange={(e)=>setNecessidades(e.target.value)} minLength={3} required rows={5}/></div></div>
      <div className="space-y-2"><Label>Prioridades recomendadas</Label><Textarea value={prioridades} onChange={(e)=>setPrioridades(e.target.value)} placeholder="Ordene por relevância funcional, segurança e impacto na qualidade de vida" minLength={3} required/></div>
      <div className="space-y-2"><Label>Recomendações iniciais</Label><Textarea value={recomendacoes} onChange={(e)=>setRecomendacoes(e.target.value)} placeholder="Avaliações adicionais, adaptações, participação da equipe ou próximos passos"/></div>
      <div className="space-y-2"><Label>Conclusão clínica</Label><Textarea value={conclusao} onChange={(e)=>setConclusao(e.target.value)} placeholder="Obrigatória para concluir; pode ficar vazia no rascunho"/></div>
      {erro&&<p className="text-sm text-destructive">{erro}</p>}<div className="flex flex-wrap gap-3"><Button type="submit" disabled={salvando}>{salvando?"Salvando...":"Concluir avaliação"}</Button><Button type="button" className="bg-slate-200 text-slate-700 hover:bg-slate-300 hover:text-slate-900" disabled={salvando} onClick={()=>void salvar("rascunho")}>Salvar rascunho</Button>{atual&&<Button type="button" className="bg-slate-200 text-slate-700 hover:bg-slate-300 hover:text-slate-900" onClick={()=>setAberto(false)}>Cancelar</Button>}</div>
    </form>}
    {sinteses.length>0&&<section className="space-y-3"><h2 className="text-lg font-bold">Histórico de versões</h2>{sinteses.map((s)=><Card key={s.id}><CardHeader className="pb-3"><div className="flex flex-wrap items-center justify-between gap-2"><CardTitle className="text-base">Versão {s.versao} · {new Date(`${s.periodo_inicio}T12:00:00`).toLocaleDateString("pt-BR")} a {new Date(`${s.periodo_fim}T12:00:00`).toLocaleDateString("pt-BR")}</CardTitle><Badge variant={s.status==="concluida"?"default":"secondary"}>{s.status==="concluida"?<><CheckCircle2 className="mr-1 size-3"/>Concluída</>:"Rascunho"}</Badge></div></CardHeader><CardContent className="grid gap-3 text-sm sm:grid-cols-2"><p><strong>Potencialidades:</strong> {s.potencialidades}</p><p><strong>Necessidades:</strong> {s.necessidades_identificadas}</p><p><strong>Prioridades:</strong> {s.prioridades_recomendadas}</p><p><strong>Sessões consideradas:</strong> {s.sessoes_consideradas.length}</p>{s.conclusao&&<p className="sm:col-span-2"><strong>Conclusão:</strong> {s.conclusao}</p>}</CardContent></Card>)}</section>}
  </div>
}
