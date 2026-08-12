import { getProfissionaisVinculadosPaciente } from "@/lib/registros/queries"
import { FotoAvatar } from "@/components/registros/foto-avatar"
import { Card, CardContent } from "@/components/ui/card"

export default async function EquipePage({params}:{params:Promise<{id:string}>}){
  const{id}=await params,profissionais=await getProfissionaisVinculadosPaciente(id)
  return <div className="space-y-5"><div><h2 className="text-xl font-bold">Equipe vinculada</h2><p className="text-sm text-muted-foreground">Profissionais com vínculo explícito ao paciente.</p></div><div className="grid gap-3 sm:grid-cols-2">{profissionais.map(p=>{const registro=[p.conselho_tipo,p.conselho_numero,p.conselho_uf].filter(Boolean).join(" · ");return <Card key={p.id}><CardContent className="flex items-center gap-3 p-4"><FotoAvatar nome={p.nome} src={p.foto_url} zoom={p.foto_zoom} posX={p.foto_pos_x} posY={p.foto_pos_y} className="size-11"/><div><p className="font-semibold">{p.nome}</p><p className="text-xs text-muted-foreground">{p.profissao??"Profissional vinculado"}</p>{registro&&<p className="text-xs text-muted-foreground">{registro}</p>}</div></CardContent></Card>})}</div>{profissionais.length===0&&<p className="rounded-2xl border border-dashed p-8 text-center text-sm text-muted-foreground">Nenhum profissional vinculado.</p>}</div>
}
