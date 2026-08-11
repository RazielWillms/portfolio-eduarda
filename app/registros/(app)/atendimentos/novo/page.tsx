import { getPacientes, getHabilidades, getNiveisAvaliacao } from "@/lib/registros/queries"
import { AtendimentoForm } from "@/components/registros/atendimento-form"

export default async function NovoAtendimentoPage({ searchParams }: { searchParams: Promise<{ paciente?: string }> }) {
  const { paciente: pacienteInicialId } = await searchParams
  const [pacientes, habilidades, niveis] = await Promise.all([
    getPacientes(),
    getHabilidades(),
    getNiveisAvaliacao(),
  ])

  const pacientesAtivos = pacientes.filter((p) => p.status === "ativo")
  const habilidadesAtivas = habilidades.filter((h) => h.status === "ativa")

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Novo atendimento</h1>
        <p className="text-sm text-muted-foreground mt-1">Registre uma sessão realizada com um paciente.</p>
      </div>
      <AtendimentoForm pacientes={pacientesAtivos} habilidades={habilidadesAtivas} niveis={niveis} pacienteInicialId={pacienteInicialId} />
    </div>
  )
}
