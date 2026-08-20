import Link from "next/link"
import { Plus } from "lucide-react"
import { getPacientes, getProfile } from "@/lib/registros/queries"
import { Button } from "@/components/ui/button"
import { PacientesBusca } from "@/components/registros/pacientes-busca"
import { PacientesCoordenacaoBusca } from "@/components/registros/pacientes-coordenacao-busca"
import { temPermissao } from "@/lib/registros/permissoes"

export default async function PacientesPage() {
  const profile = await getProfile(), coordenacao = !!profile&&temPermissao(profile,"pacientes.cadastrar_administrativo")
  const pacientes = coordenacao ? [] : await getPacientes()
  return <div className="flex flex-col gap-6"><div className="flex items-start justify-between gap-3"><div><h1 className="text-2xl font-bold">Pacientes</h1><p className="mt-1 text-sm text-muted-foreground">{coordenacao ? "Cadastros administrativos; pacientes aceitos também permitem acesso clínico." : "Pacientes vinculados a você."}</p></div><Button asChild size="icon" className="shrink-0 sm:!h-9 sm:!w-auto sm:px-4"><Link href="/registros/pacientes/novo" aria-label="Novo paciente" title="Novo paciente"><Plus className="size-4" /><span className="hidden sm:inline">Novo paciente</span></Link></Button></div>{coordenacao ? <PacientesCoordenacaoBusca /> : <PacientesBusca pacientes={pacientes} />}</div>
}
