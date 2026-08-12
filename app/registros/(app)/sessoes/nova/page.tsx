import { notFound } from "next/navigation"
import { getPaciente, getPlanosClinicosPaciente, getProfile } from "@/lib/registros/queries"
import { SessaoClinicaForm } from "@/components/registros/sessao-clinica-form"

export default async function NovaSessaoPage({ searchParams }: { searchParams: Promise<{ paciente?: string }> }) {
  const { paciente: pacienteId } = await searchParams
  if (!pacienteId) notFound()
  const [paciente, planos, profile] = await Promise.all([getPaciente(pacienteId), getPlanosClinicosPaciente(pacienteId), getProfile()])
  if (!paciente || !profile) notFound()
  const todosAlvos = planos.flatMap((p) => p.objetivos.flatMap((o) => o.alvos)).filter((a) => a.profissional_id === profile.id && a.ativo)
  const alvos = todosAlvos.filter((a) => !["rascunho","pausado","encerrado"].includes(a.fase) && a.medicoes.length > 0 && (a.fase === "linha_de_base" || a.protocolos.length > 0))
  return <div className="space-y-6"><div><h1 className="text-2xl font-bold">Nova sessão estruturada</h1><p className="text-sm text-muted-foreground">Registre vínculo, avaliação, linha de base ou intervenção conforme o momento clínico.</p></div><SessaoClinicaForm paciente={paciente} alvos={alvos} /></div>
}
