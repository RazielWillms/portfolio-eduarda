"use client"

import { useEffect,useState } from "react"
import Link from "next/link"
import { Check,ChevronLeft,ChevronRight,Clock,Search,X } from "lucide-react"
import { aprovarSolicitacaoAcesso,buscarSolicitacoesAcesso,negarSolicitacaoAcesso } from "@/lib/registros/actions"
import type { SolicitacaoAcessoPaginada,StatusSolicitacaoAcesso } from "@/lib/registros/types"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select,SelectContent,SelectItem,SelectTrigger,SelectValue } from "@/components/ui/select"
import { Tabs,TabsContent,TabsList,TabsTrigger } from "@/components/ui/tabs"

function Status({status}:{status:StatusSolicitacaoAcesso}){return status==="pendente"?<Badge variant="outline">Pendente</Badge>:status==="aprovado"?<Badge>Aprovada</Badge>:<Badge variant="destructive">Negada</Badge>}

function Lista({direcao}:{direcao:"recebidas"|"enviadas"}){
 const [busca,setBusca]=useState(""),[status,setStatus]=useState(direcao==="recebidas"?"pendente":"todos"),[pagina,setPagina]=useState(0),[itens,setItens]=useState<SolicitacaoAcessoPaginada[]>([]),[carregando,setCarregando]=useState(true),[erro,setErro]=useState(""),[processando,setProcessando]=useState<string|null>(null),[versao,setVersao]=useState(0)
 const limite=10,total=Number(itens[0]?.total??0),paginas=Math.max(1,Math.ceil(total/limite))
 useEffect(()=>{let ativo=true;setCarregando(true);setErro("");const timer=setTimeout(async()=>{const resultado=await buscarSolicitacoesAcesso({direcao,busca,status,limite,offset:pagina*limite});if(!ativo)return;if("error"in resultado){setErro(resultado.error);setItens([])}else setItens(resultado.data as SolicitacaoAcessoPaginada[]);setCarregando(false)},250);return()=>{ativo=false;clearTimeout(timer)}},[busca,direcao,pagina,status,versao])
 async function decidir(id:string,aprovar:boolean){setProcessando(id);const resultado=aprovar?await aprovarSolicitacaoAcesso(id):await negarSolicitacaoAcesso(id);setProcessando(null);if(!(resultado&&"error"in resultado)){if(itens.length===1&&pagina>0)setPagina(p=>p-1);else setVersao(v=>v+1)}}
 return <div className="space-y-4">
  <div className="flex flex-col gap-3 rounded-2xl border bg-card p-4 sm:flex-row"><div className="relative flex-1"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"/><Input value={busca} onChange={e=>{setBusca(e.target.value);setPagina(0)}} placeholder="Buscar por paciente ou profissional..." className="pl-9"/></div>{direcao==="enviadas"&&<Select value={status} onValueChange={v=>{setStatus(v);setPagina(0)}}><SelectTrigger className="w-full sm:w-44"><SelectValue/></SelectTrigger><SelectContent><SelectItem value="todos">Todos os status</SelectItem><SelectItem value="pendente">Pendentes</SelectItem><SelectItem value="aprovado">Aprovadas</SelectItem><SelectItem value="negado">Negadas</SelectItem></SelectContent></Select>}</div>
  <div className="space-y-3">{carregando?<p className="rounded-2xl border border-dashed p-8 text-center text-sm text-muted-foreground">Carregando solicitações...</p>:itens.map(s=><div key={s.id} className="flex flex-col gap-3 rounded-2xl border bg-card p-4"><div className="flex items-start justify-between gap-3"><div><Link href={`/registros/pacientes/${s.paciente_id}`} className="font-semibold hover:text-primary">{s.paciente_nome}</Link><p className="mt-0.5 text-xs text-muted-foreground">Solicitado por {s.solicitante_nome} · {new Date(s.created_at).toLocaleDateString("pt-BR")}</p></div><Status status={s.status}/></div>{s.mensagem&&<p className="rounded-lg bg-muted px-3 py-2 text-sm text-muted-foreground">{s.mensagem}</p>}{direcao==="recebidas"&&s.status==="pendente"&&<div className="flex gap-2"><Button size="sm" disabled={processando===s.id} onClick={()=>decidir(s.id,true)}><Check className="size-3.5"/>Aprovar acesso</Button><Button size="sm" variant="secondary" disabled={processando===s.id} onClick={()=>decidir(s.id,false)}><X className="size-3.5"/>Negar</Button></div>}</div>)}{!carregando&&!itens.length&&!erro&&<div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed p-8 text-center text-sm text-muted-foreground"><Clock className="size-5"/>{direcao==="recebidas"?"Nenhuma solicitação pendente para você.":"Nenhuma solicitação enviada encontrada."}</div>}{erro&&<p className="rounded-2xl border p-6 text-sm text-destructive">{erro}</p>}</div>
  <div className="flex items-center justify-between"><p className="text-xs text-muted-foreground">{total} solicitação(ões)</p><div className="flex items-center gap-2"><Button size="icon" variant="secondary" disabled={pagina===0||carregando} onClick={()=>setPagina(p=>p-1)}><ChevronLeft className="size-4"/></Button><span className="text-sm">{pagina+1} de {paginas}</span><Button size="icon" variant="secondary" disabled={pagina+1>=paginas||carregando} onClick={()=>setPagina(p=>p+1)}><ChevronRight className="size-4"/></Button></div></div>
 </div>
}

export function SolicitacoesLista(){return <Tabs defaultValue="recebidas" className="flex flex-col gap-5"><TabsList className="w-fit"><TabsTrigger value="recebidas">Recebidas</TabsTrigger><TabsTrigger value="enviadas">Enviadas</TabsTrigger></TabsList><TabsContent value="recebidas"><Lista direcao="recebidas"/></TabsContent><TabsContent value="enviadas"><Lista direcao="enviadas"/></TabsContent></Tabs>}
