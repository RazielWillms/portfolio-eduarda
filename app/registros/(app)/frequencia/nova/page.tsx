import { redirect } from "next/navigation"
import { getAgendamentos, getOpcoesFrequencia, getProfile, getProfissoes } from "@/lib/registros/queries"
import { FrequenciaOcorrenciaForm } from "@/components/registros/frequencia-ocorrencia-form"

export default async function NovaOcorrenciaPage() {
  const profile = await getProfile()
  if (!profile) redirect("/registros/login")
  const hoje = new Date()
  const inicio = new Date(hoje.getFullYear(), hoje.getMonth() - 1, 1)
  const fim = new Date(hoje.getFullYear(), hoje.getMonth() + 2, 1)
  const [opcoes, agenda, profissoes] = await Promise.all([
    getOpcoesFrequencia(),
    getAgendamentos(inicio.toISOString(), fim.toISOString()),
    getProfissoes(),
  ])
  if (!opcoes) return <p className="text-sm text-muted-foreground">O módulo de frequência ainda não está disponível no banco.</p>

  return <div className="w-full max-w-4xl space-y-6"><div><h1 className="text-2xl font-bold">Nova ocorrência</h1><p className="mt-1 text-sm text-muted-foreground">Registre faltas e cancelamentos sem incluir informações clínicas.</p></div><FrequenciaOcorrenciaForm opcoes={opcoes} agenda={agenda} papel={profile.papel} usuarioId={profile.id} profissoes={profissoes} /></div>
}
