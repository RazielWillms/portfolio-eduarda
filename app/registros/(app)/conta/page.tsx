import { KeyRound } from "lucide-react"
import { AlterarSenhaForm } from "@/components/registros/alterar-senha-form"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function ContaPage() {
  return <div className="flex max-w-2xl flex-col gap-6">
    <div><h1 className="text-2xl font-bold">Minha conta</h1><p className="mt-1 text-sm text-muted-foreground">Gerencie suas credenciais de acesso.</p></div>
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><KeyRound className="size-5 text-primary" />Alterar senha</CardTitle>
        <CardDescription>A nova senha será aplicada somente à sua própria conta.</CardDescription>
      </CardHeader>
      <CardContent><AlterarSenhaForm /></CardContent>
    </Card>
  </div>
}
