import { redirect } from "next/navigation"
import { LoginForm } from "@/components/registros/login-form"
import { getProfile } from "@/lib/registros/queries"

export default async function LoginPage() {
  const profile = await getProfile()
  if (profile) {
    redirect("/registros")
  }

  return <LoginForm />
}
