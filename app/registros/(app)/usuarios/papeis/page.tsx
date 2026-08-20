import { redirect } from "next/navigation"
import { PapeisAcessoForm } from "@/components/registros/papeis-acesso-form"
import { getConfiguracaoPapeis, getProfile } from "@/lib/registros/queries"

export default async function PapeisPage() {
  const profile = await getProfile()
  if (!profile?.admin_principal) redirect("/registros/usuarios")
  const config = await getConfiguracaoPapeis()
  return config ? <PapeisAcessoForm config={config} /> : <p>Não foi possível carregar a configuração.</p>
}
