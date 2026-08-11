import { ShieldX } from "lucide-react"
import { signOut } from "@/lib/registros/actions"
import { Button } from "@/components/ui/button"
export default function BloqueadoPage() { return <main className="min-h-screen flex items-center justify-center bg-background p-4"><div className="max-w-md rounded-2xl border bg-card p-8 text-center"><ShieldX className="size-8 text-muted-foreground mx-auto mb-4" /><h1 className="text-xl font-bold">Conta sem acesso</h1><p className="text-sm text-muted-foreground mt-2 mb-5">Esta conta está inativa. Entre em contato com a administração responsável.</p><form action={signOut}><Button type="submit" variant="outline">Sair</Button></form></div></main> }
