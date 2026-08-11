import type { Metadata } from "next"
import { Link2Off } from "lucide-react"
import { obterPortalResponsavel } from "@/lib/registros/responsavel/portal-service"
import { PortalResponsavel } from "@/components/registros/portal-responsavel"

export const metadata: Metadata = { title: "Acompanhamento", robots: { index: false, follow: false } }

export default async function AcompanhamentoPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const dados = await obterPortalResponsavel(token)
  if (!dados) return <main className="min-h-screen bg-background flex items-center justify-center p-4"><div className="max-w-md rounded-2xl border bg-card p-8 text-center"><Link2Off className="size-8 text-muted-foreground mx-auto mb-4" /><h1 className="text-xl font-bold">Acesso indisponível</h1><p className="text-sm text-muted-foreground mt-2">Este link não está disponível. Solicite um novo acesso ao profissional responsável.</p></div></main>
  return <PortalResponsavel dados={dados} />
}
