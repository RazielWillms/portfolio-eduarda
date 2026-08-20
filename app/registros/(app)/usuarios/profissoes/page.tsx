import { redirect } from "next/navigation"
import Link from "next/link"
import { Plus } from "lucide-react"
import { ProfissoesForm } from "@/components/registros/profissoes-form"
import { Button } from "@/components/ui/button"
import { getProfile, getProfissoes } from "@/lib/registros/queries"

export default async function ProfissoesPage() {
  const profile = await getProfile()
  if (!profile?.admin_principal) redirect("/registros/usuarios")
  const profissoes = await getProfissoes(true)
  return <div className="space-y-6"><header className="flex items-start justify-between gap-3"><div><h1 className="text-2xl font-bold">Profissões</h1><p className="mt-1 text-sm text-muted-foreground">Padronize áreas profissionais e conselhos sem alterar papéis ou permissões.</p></div><Button asChild size="icon" className="shrink-0 sm:!h-9 sm:!w-auto sm:px-4"><Link href="/registros/usuarios/profissoes/nova" aria-label="Nova profissão" title="Nova profissão"><Plus className="size-4" /><span className="hidden sm:inline">Nova profissão</span></Link></Button></header><ProfissoesForm profissoes={profissoes} /></div>
}
