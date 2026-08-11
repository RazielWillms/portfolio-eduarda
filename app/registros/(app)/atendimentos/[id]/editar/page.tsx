import { notFound } from "next/navigation"
import { AtendimentoForm } from "@/components/registros/atendimento-form"
import { getAtendimento, getHabilidades, getNiveisAvaliacao, getPacientes } from "@/lib/registros/queries"

export default async function EditarAtendimentoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const [atendimento, pacientes, habilidades, niveis] = await Promise.all([getAtendimento(id), getPacientes(), getHabilidades(), getNiveisAvaliacao()])
  if (!atendimento) notFound()
  return <div className="flex flex-col gap-6"><div><h1 className="text-2xl font-bold">Editar atendimento</h1><p className="text-sm text-muted-foreground mt-1">Somente o profissional que registrou pode alterar este atendimento.</p></div><AtendimentoForm atendimentoExistente={atendimento} pacientes={pacientes.filter((p) => p.status === "ativo")} habilidades={habilidades.filter((h) => h.status === "ativa" || h.id === atendimento.habilidade_id)} niveis={niveis} /></div>
}
