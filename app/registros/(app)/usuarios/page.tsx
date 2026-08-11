import { ShieldAlert } from "lucide-react"
import { getProfile, getProfiles } from "@/lib/registros/queries"
import { UsuarioForm } from "@/components/registros/usuario-form"
import { UsuariosTabela } from "@/components/registros/usuarios-tabela"

export default async function UsuariosPage() {
  const profile = await getProfile()

  if (!profile || profile.papel !== "admin") {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-border bg-card py-16 text-center">
        <ShieldAlert className="size-8 text-muted-foreground" />
        <p className="text-sm font-semibold text-foreground">Acesso restrito</p>
        <p className="text-sm text-muted-foreground max-w-sm">
          Somente administradores podem visualizar e cadastrar novos usuários.
        </p>
      </div>
    )
  }

  const usuarios = await getProfiles()

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Usuários</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Gerencie os profissionais com acesso ao sistema. Somente administradores podem criar novos usuários.
        </p>
      </div>

      <UsuariosTabela usuarios={usuarios} usuarioAtualId={profile.id} />

      <div className="flex flex-col gap-4 max-w-xl">
        <h2 className="text-lg font-bold text-foreground">Novo usuário</h2>
        <UsuarioForm />
      </div>
    </div>
  )
}
