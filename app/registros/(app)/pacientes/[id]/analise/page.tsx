import Link from "next/link"
import { getCapacitacoesPaciente, getConcordanciasPaciente, getPlanosClinicosPaciente, getProfile, getProfissionaisVinculadosPaciente, getSessoesClinicasPacienteDesde, getValidadeSocialPaciente } from "@/lib/registros/queries"
import { AnaliseAlvosClinicos } from "@/components/registros/analise-alvos-clinicos"
import { RevisoesClinicas } from "@/components/registros/revisoes-clinicas"
import { ConcordanciaObservadores } from "@/components/registros/concordancia-observadores"

const periodos = { "3": "3 meses", "6": "6 meses", "12": "12 meses", "24": "24 meses", todos: "Todo o histórico" } as const
type Periodo = keyof typeof periodos

export default async function AnalisePage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ periodo?: string }> }) {
  const { id } = await params
  const busca = await searchParams
  const periodo: Periodo = busca.periodo && busca.periodo in periodos ? busca.periodo as Periodo : "12"
  let inicio: string | undefined
  if (periodo !== "todos") { const data = new Date(); data.setMonth(data.getMonth() - Number(periodo)); inicio = data.toISOString().slice(0, 10) }
  const [planos, profile, sessoes, profissionais, solicitacoes, validadeSocial, capacitacoes] = await Promise.all([getPlanosClinicosPaciente(id), getProfile(), getSessoesClinicasPacienteDesde(id, inicio), getProfissionaisVinculadosPaciente(id), getConcordanciasPaciente(id), getValidadeSocialPaciente(id), getCapacitacoesPaciente(id)])
  return <div className="space-y-8">
    <div className="flex flex-wrap items-end justify-between gap-3"><div><h2 className="text-xl font-bold">Análise e revisão</h2><p className="text-sm text-muted-foreground">Evolução, qualidade dos dados, decisões clínicas e concordância entre observadores.</p></div><div className="flex flex-wrap gap-1 rounded-xl border bg-background p-1" aria-label="Período dos dados">{Object.entries(periodos).map(([valor, rotulo]) => <Link key={valor} href={`?periodo=${valor}`} className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${periodo === valor ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}>{rotulo}</Link>)}</div></div>
    <p className="-mt-6 text-xs text-muted-foreground">Dados carregados: {periodos[periodo]}.</p>
    <AnaliseAlvosClinicos planos={planos} sessoes={sessoes} profissionalAtualId={profile?.id??""} validadeSocial={validadeSocial} concordancias={solicitacoes} capacitacoes={capacitacoes}/>
    <RevisoesClinicas pacienteId={id} profissionalAtualId={profile?.id??""} planos={planos} sessoes={sessoes}/>
    <ConcordanciaObservadores pacienteId={id} profissionalAtualId={profile?.id??""} profissionais={profissionais} sessoes={sessoes} solicitacoes={solicitacoes}/>
  </div>
}
