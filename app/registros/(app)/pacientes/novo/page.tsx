import { PacienteForm } from "@/components/registros/paciente-form"
import { PacienteAdministrativoForm } from "@/components/registros/paciente-administrativo-form"
import { getProfile } from "@/lib/registros/queries"
import { temPermissao } from "@/lib/registros/permissoes"

export default async function NovoPacientePage() {
  const profile=await getProfile(),administrativo=!!profile&&temPermissao(profile,"pacientes.cadastrar_administrativo")
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Novo paciente</h1>
        <p className="text-sm text-muted-foreground mt-1">{administrativo?"Cadastre os dados administrativos sem conceder acesso ao prontuário.":"Cadastre um novo paciente vinculado a você."}</p>
      </div>
      {administrativo?<PacienteAdministrativoForm/>:<PacienteForm />}
    </div>
  )
}
