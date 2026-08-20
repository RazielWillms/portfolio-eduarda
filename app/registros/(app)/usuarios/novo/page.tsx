import { redirect } from "next/navigation"
import { UsuarioForm } from "@/components/registros/usuario-form"
import { getProfile, getProfissoes } from "@/lib/registros/queries"
import { temPermissao } from "@/lib/registros/permissoes"

export default async function NovoUsuarioPage() {
  const profile = await getProfile()
  if (!profile || !temPermissao(profile, "usuarios.criar")) redirect("/registros/usuarios")

  const profissoes = await getProfissoes(true)
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold">Novo usuário</h1>
        <p className="mt-1 text-sm text-muted-foreground">Crie uma conta e defina seu acesso inicial ao sistema.</p>
      </header>
      <section className="max-w-2xl rounded-2xl border bg-card p-5 sm:p-6">
        <div className="mb-5">
          <h2 className="text-lg font-bold">Dados de acesso</h2>
          <p className="text-sm text-muted-foreground">A senha provisória deverá ser entregue ao novo usuário por um canal seguro.</p>
        </div>
        <UsuarioForm profissoes={profissoes} />
      </section>
    </div>
  )
}
