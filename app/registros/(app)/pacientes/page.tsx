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
  return <div className="flex flex-col gap-6"><div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div><h1 className="text-2xl font-bold">Pacientes</h1><p className="mt-1 text-sm text-muted-foreground">{coordenacao ? "Cadastros administrativos; pacientes aceitos também permitem acesso clínico." : "Pacientes vinculados a você."}</p></div><Button asChild><Link href="/registros/pacientes/novo"><Plus className="size-4" />Novo paciente</Link></Button></div>{coordenacao ? <PacientesCoordenacaoBusca /> : <PacientesBusca pacientes={pacientes} />}</div>
}
