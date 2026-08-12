import Link from "next/link"
import { ClipboardCheck } from "lucide-react"
import { getPlanosClinicosPaciente, getProfile, getSintesesAvaliacaoPaciente } from "@/lib/registros/queries"
import { FundacaoClinica } from "@/components/registros/fundacao-clinica"
import { GestaoAlvosClinicos } from "@/components/registros/gestao-alvos-clinicos"
import { FluxoClinicoPaciente } from "@/components/registros/fluxo-clinico-paciente"
import { Button } from "@/components/ui/button"

export default async function PlanejamentoPage({params}:{params:Promise<{id:string}>}){
  const{id}=await params
  const[planos,profile,sinteses]=await Promise.all([getPlanosClinicosPaciente(id),getProfile(),getSintesesAvaliacaoPaciente(id)])
  const profissionalAtualId=profile?.id??""
  const avaliacao=sinteses.find((item)=>item.status==="concluida")
  return <div className="space-y-8">
    <div><h2 className="text-xl font-bold">Planejamento clínico</h2><p className="text-sm text-muted-foreground">Planos, objetivos, alvos, critérios e fases.</p></div>
    {avaliacao?<section className="rounded-2xl border bg-card p-4"><div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div><div className="flex items-center gap-2"><ClipboardCheck className="size-4 text-primary"/><h3 className="font-bold">Avaliação concluída · versão {avaliacao.versao}</h3></div><p className="mt-1 text-sm text-muted-foreground">Use as prioridades abaixo para justificar o plano e desdobrar objetivos funcionais.</p><p className="mt-2 text-sm"><strong>Prioridades:</strong> {avaliacao.prioridades_recomendadas}</p></div><Button asChild variant="outline" className="shrink-0 border-slate-300 bg-slate-100 text-slate-700 hover:bg-slate-200"><Link href={`/registros/pacientes/${id}/avaliacao`}>Ver avaliação</Link></Button></div></section>:<section className="rounded-2xl border border-dashed p-4"><p className="text-sm text-muted-foreground">Ainda não há uma síntese de avaliação concluída. O planejamento pode ser iniciado, mas registrar a fundamentação ajuda a tornar as prioridades rastreáveis.</p><Button asChild size="sm" variant="outline" className="mt-3 border-slate-300 bg-slate-100 text-slate-700 hover:bg-slate-200"><Link href={`/registros/pacientes/${id}/avaliacao`}>Abrir avaliação</Link></Button></section>}
    <FluxoClinicoPaciente pacienteId={id} profissionalAtualId={profissionalAtualId} planos={planos}/>
    <FundacaoClinica pacienteId={id} profissionalAtualId={profissionalAtualId} planos={planos}/>
    <GestaoAlvosClinicos pacienteId={id} profissionalAtualId={profissionalAtualId} planos={planos}/>
  </div>
}
