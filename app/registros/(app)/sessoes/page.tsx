import Link from "next/link"
import { ArrowRight,ChevronLeft,ChevronRight,ClipboardList,Search } from "lucide-react"
import { getSessoesProfissionalPaginadas } from "@/lib/registros/queries"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card,CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

function dataValida(valor?:string){return valor&&/^\d{4}-\d{2}-\d{2}$/.test(valor)?valor:""}

export default async function SessoesPage({searchParams}:{searchParams:Promise<{busca?:string;inicio?:string;fim?:string;pagina?:string}>}){
 const q=await searchParams,busca=(q.busca??"").slice(0,100),inicio=dataValida(q.inicio),fim=dataValida(q.fim),pagina=Math.max(1,Number.parseInt(q.pagina??"1")||1),limite=20
 const sessoes=await getSessoesProfissionalPaginadas({busca,inicio,fim,limite,offset:(pagina-1)*limite})
 if(!sessoes)return <p className="rounded-2xl border border-dashed p-8 text-sm text-muted-foreground">Aplique a migration do histórico paginado para visualizar as sessões.</p>
 const total=Number(sessoes[0]?.total??0),paginas=Math.max(1,Math.ceil(total/limite))
 function href(destino:number){const p=new URLSearchParams();if(busca)p.set("busca",busca);if(inicio)p.set("inicio",inicio);if(fim)p.set("fim",fim);p.set("pagina",String(destino));return`/registros/sessoes?${p}`}
 return <div className="space-y-6"><div><h1 className="text-2xl font-bold">Sessões</h1><p className="mt-1 text-sm text-muted-foreground">Histórico das sessões clínicas registradas por você.</p></div>
  <form className="grid gap-3 rounded-2xl border bg-card p-4 md:grid-cols-[minmax(14rem,1fr)_11rem_11rem_auto] md:items-end"><div className="space-y-2"><Label htmlFor="busca-sessao">Paciente</Label><div className="relative"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"/><Input id="busca-sessao"name="busca"defaultValue={busca}placeholder="Buscar por paciente..."className="pl-9"/></div></div><div className="space-y-2"><Label htmlFor="inicio-sessao">Início</Label><Input id="inicio-sessao"name="inicio"type="date"defaultValue={inicio}/></div><div className="space-y-2"><Label htmlFor="fim-sessao">Fim</Label><Input id="fim-sessao"name="fim"type="date"defaultValue={fim}/></div><Button type="submit">Aplicar filtros</Button></form>
  {sessoes.length===0?<Card><CardContent className="flex flex-col items-center gap-3 p-10 text-center"><ClipboardList className="size-8 text-muted-foreground"/><div><p className="font-semibold">Nenhuma sessão encontrada</p><p className="text-sm text-muted-foreground">Ajuste os filtros ou abra um paciente para registrar uma sessão.</p></div><Link href="/registros/pacientes"className="inline-flex items-center gap-1 text-sm font-semibold text-primary">Escolher paciente <ArrowRight className="size-4"/></Link></CardContent></Card>:<div className="space-y-3">{sessoes.map(sessao=><Link key={sessao.id}href={`/registros/pacientes/${sessao.paciente_id}/sessoes`}className="block"><Card className="transition-colors hover:border-primary/40"><CardContent className="flex flex-col items-start gap-3 p-4 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:p-5"><div className="min-w-0"><p className="break-words font-bold sm:truncate">{sessao.paciente_nome}</p><p className="text-sm text-muted-foreground">{new Date(`${sessao.data}T12:00:00`).toLocaleDateString("pt-BR")} · {sessao.contexto}</p></div><Badge variant="secondary"className="shrink-0">{sessao.total_alvos} alvos</Badge></CardContent></Card></Link>)}</div>}
  <div className="flex items-center justify-between"><p className="text-xs text-muted-foreground">{total} sessão(ões)</p><div className="flex items-center gap-2"><Button asChild size="icon"variant="secondary"disabled={pagina<=1}>{pagina<=1?<span><ChevronLeft className="size-4"/></span>:<Link href={href(pagina-1)}aria-label="Página anterior"><ChevronLeft className="size-4"/></Link>}</Button><span className="text-sm">{pagina} de {paginas}</span><Button asChild size="icon"variant="secondary"disabled={pagina>=paginas}>{pagina>=paginas?<span><ChevronRight className="size-4"/></span>:<Link href={href(pagina+1)}aria-label="Próxima página"><ChevronRight className="size-4"/></Link>}</Button></div></div>
 </div>
}
