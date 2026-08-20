import { redirect } from "next/navigation"
import { NovaProfissaoForm } from "@/components/registros/profissoes-form"
import { getProfile } from "@/lib/registros/queries"

export default async function NovaProfissaoPage() {
  const profile = await getProfile()
  if (!profile?.admin_principal) redirect("/registros/usuarios")
  return <div className="space-y-6"><header><h1 className="text-2xl font-bold">Nova profissão</h1><p className="mt-1 text-sm text-muted-foreground">Inclua uma profissão no catálogo utilizado pelos cadastros e buscas.</p></header><NovaProfissaoForm /></div>
}
