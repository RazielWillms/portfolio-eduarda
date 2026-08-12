import Link from "next/link"
import { ArrowRight, Check, Circle, ClipboardList } from "lucide-react"
import type { PlanoClinicoCompleto } from "@/lib/registros/clinico/modelo"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

export function FluxoClinicoPaciente({ pacienteId, profissionalAtualId, planos }: { pacienteId: string; profissionalAtualId: string; planos: PlanoClinicoCompleto[] }) {
  const planosProprios = planos.filter((plano) => plano.profissional_responsavel_id === profissionalAtualId)
  const todosObjetivos = planos.flatMap((plano) => plano.objetivos)
  const todosAlvos = todosObjetivos.flatMap((objetivo) => objetivo.alvos).filter((alvo) => alvo.ativo)
  const objetivos = planosProprios.flatMap((plano) => plano.objetivos)
  const alvos = objetivos.flatMap((objetivo) => objetivo.alvos).filter((alvo) => alvo.profissional_id === profissionalAtualId && alvo.ativo)
  const comCriterio = alvos.filter((alvo) => alvo.criterios.length > 0)
  const comProtocolo = alvos.filter((alvo) => alvo.protocolos.length > 0)
  const emColeta = alvos.filter((alvo) => !["rascunho", "pausado", "encerrado"].includes(alvo.fase))
  const prontos = alvos.filter((alvo) => alvo.medicoes.length > 0 && (alvo.fase === "linha_de_base" || alvo.protocolos.length > 0) && !["rascunho", "pausado", "encerrado"].includes(alvo.fase))
  const etapas = [
    { nome: "Plano", concluida: planosProprios.length > 0, detalhe: `${planos.length} no paciente · ${planosProprios.length} sob sua responsabilidade` },
    { nome: "Objetivos", concluida: objetivos.length > 0, detalhe: `${todosObjetivos.length} no paciente · ${objetivos.length} seus` },
    { nome: "Alvos e medição", concluida: alvos.length > 0, detalhe: `${todosAlvos.length} no paciente · ${alvos.length} seus` },
    { nome: "Critérios", concluida: alvos.length > 0 && comCriterio.length === alvos.length, detalhe: `${comCriterio.length}/${alvos.length || 0} configurado(s)` },
    { nome: "Protocolos", concluida: alvos.length > 0 && comProtocolo.length === alvos.length, detalhe: `${comProtocolo.length}/${alvos.length || 0} configurado(s)` },
    { nome: "Fase de coleta", concluida: alvos.length > 0 && emColeta.length === alvos.length, detalhe: `${emColeta.length}/${alvos.length || 0} ativo(s)` },
  ]

  return <section className="rounded-2xl border bg-card p-5">
    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
      <div><div className="flex items-center gap-2"><ClipboardList className="size-5 text-primary"/><h2 className="text-lg font-bold">Preparação para sessões com alvos</h2></div><p className="mt-1 max-w-2xl text-sm text-muted-foreground">Sessões de vínculo, entrevista e avaliação já podem ser registradas. O percurso abaixo prepara alvos para linha de base e intervenção.</p></div>
      <div className="flex flex-wrap items-center gap-2">{prontos.length === 0 && <Badge variant="secondary">Alvos em preparação</Badge>}<Button asChild><Link href={`/registros/sessoes/nova?paciente=${pacienteId}`}>Registrar sessão<ArrowRight className="size-4"/></Link></Button></div>
    </div>
    <ol className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{etapas.map((etapa, indice) => <li key={etapa.nome} className="flex items-center gap-3 rounded-xl border p-3">{etapa.concluida ? <span className="grid size-7 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground"><Check className="size-4"/></span> : <span className="grid size-7 shrink-0 place-items-center rounded-full border text-xs font-bold text-muted-foreground">{indice + 1}</span>}<div><p className="text-sm font-semibold">{etapa.nome}</p><p className="text-xs text-muted-foreground">{etapa.detalhe}</p></div></li>)}</ol>
    {planos.length > 0 && planosProprios.length === 0 && <div className="mt-4 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">O paciente possui planejamento, mas ele pertence a outro profissional e está disponível somente para leitura. Para registrar suas próprias sessões, crie um plano e alvos sob sua responsabilidade.</div>}
    {alvos.length > 0 && prontos.length === 0 && <div className="mt-4 flex flex-wrap items-center gap-2 rounded-xl bg-muted p-4 text-sm"><Circle className="size-3 fill-current text-amber-600"/><span>Próximo passo: configure o protocolo na aba Intervenção e depois altere a fase do alvo nesta página.</span><Button asChild size="sm" variant="outline"><Link href={`/registros/pacientes/${pacienteId}/intervencao`}>Ir para Intervenção</Link></Button></div>}
  </section>
}
