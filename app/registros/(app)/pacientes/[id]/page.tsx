import { notFound } from "next/navigation"
import { getPaciente, getAtendimentosPorPaciente, getPacienteHabilidades, getAvaliacoesClinicasPaciente, getHabilidades, getProfissionaisVinculadosPaciente, getAcessosResponsavel, getProfile } from "@/lib/registros/queries"
import { PacienteForm } from "@/components/registros/paciente-form"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { PacienteWorkspace } from "@/components/registros/paciente-workspace"
import { CompartilhamentoResponsavel } from "@/components/registros/compartilhamento-responsavel"
import { AtendimentoAcoes } from "@/components/registros/atendimento-acoes"

export default async function EditarPacientePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const [paciente, atendimentos, vinculos, avaliacoes, habilidades, profissionais, acessosResponsavel, profile] = await Promise.all([
    getPaciente(id), getAtendimentosPorPaciente(id), getPacienteHabilidades(id), getAvaliacoesClinicasPaciente(id),
    getHabilidades(), getProfissionaisVinculadosPaciente(id), getAcessosResponsavel(id), getProfile(),
  ])
  if (!paciente) notFound()

  const atendimentosConteudo = <div className="flex flex-col gap-4">
    <div><h2 className="text-lg font-bold">Histórico de atendimentos</h2><p className="text-sm text-muted-foreground">Registros visíveis para o seu perfil profissional.</p></div>
    <div className="overflow-hidden rounded-2xl border bg-card"><Table><TableHeader><TableRow><TableHead>Data</TableHead><TableHead>Habilidade</TableHead><TableHead>Avaliação</TableHead><TableHead>Observações</TableHead><TableHead><span className="sr-only">Ações</span></TableHead></TableRow></TableHeader><TableBody>
      {atendimentos.length === 0 && <TableRow><TableCell colSpan={5} className="py-8 text-center text-muted-foreground">Nenhum atendimento registrado por você para este paciente.</TableCell></TableRow>}
      {atendimentos.map((a) => <TableRow key={a.id}><TableCell className="whitespace-nowrap text-muted-foreground">{new Date(`${a.data}T12:00:00`).toLocaleDateString("pt-BR")}</TableCell><TableCell>{a.habilidade.nome}</TableCell><TableCell><Badge variant={a.nivel_avaliacao.valor === 1 ? "default" : "outline"}>{a.nivel_avaliacao.codigo}</Badge></TableCell><TableCell className="max-w-xs truncate text-muted-foreground">{a.observacoes || "—"}</TableCell><TableCell>{a.psicologo_id === profile?.id && <AtendimentoAcoes id={a.id} pacienteId={a.paciente_id} />}</TableCell></TableRow>)}
    </TableBody></Table></div>
  </div>

  const cadastroConteudo = <details className="rounded-2xl border bg-card p-5"><summary className="cursor-pointer font-bold">Dados cadastrais</summary><p className="mt-1 text-sm text-muted-foreground">Expanda somente quando precisar consultar ou editar o cadastro.</p><div className="mt-5"><PacienteForm pacienteExistente={paciente} /></div></details>

  return <PacienteWorkspace
    paciente={paciente} profissionais={profissionais} vinculos={vinculos} habilidades={habilidades}
    avaliacoes={avaliacoes} atendimentos={atendimentos} profissionalAtualId={profile?.id ?? ""}
    atendimentosConteudo={atendimentosConteudo}
    compartilhamentoConteudo={<CompartilhamentoResponsavel pacienteId={id} acessos={acessosResponsavel} />}
    cadastroConteudo={cadastroConteudo}
  />
}
