import type { ReactNode } from "react"
import { redirect } from "next/navigation"
import { getProfile } from "@/lib/registros/queries"
import { RegistrosShell } from "@/components/registros/registros-shell"

export default async function RegistrosLayout({ children }: { children: ReactNode }) {
  const profile = await getProfile()

  // middleware.ts já protege /registros exigindo sessão; aqui garantimos
  // que exista um profile válido e ativo antes de renderizar o app.
  if (!profile) {
    redirect("/registros/login")
  }
  if (profile.status !== "ativo") redirect("/registros/bloqueado")

  return <RegistrosShell profile={profile}>{children}</RegistrosShell>
}
