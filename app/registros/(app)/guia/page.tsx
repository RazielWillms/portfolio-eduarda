import Link from "next/link"
import { BookOpenCheck, Download, Eye, ShieldCheck } from "lucide-react"
import { GuiaConteudo } from "@/components/registros/guia-conteudo"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

export default function GuiaPage() {
  return <div className="mx-auto max-w-6xl space-y-7">
    <header className="rounded-2xl border bg-card p-6">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Badge variant="secondary" className="mb-3">Manual operacional e conceitual</Badge>
          <h1 className="text-3xl font-bold">Guia de utilização do sistema</h1>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground">Entenda o que cada etapa representa, por que ela existe, quando deve ser preenchida e como se conecta ao ciclo clínico. Use a busca para localizar um conceito ou abra os tópicos conforme a necessidade.</p>
        </div>
        <div className="flex flex-col gap-2 sm:items-stretch"><Button asChild><Link href="/registros/demonstracao"><Eye className="size-4" />Explorar demonstração</Link></Button><Button asChild variant="outline" className="border-slate-300 bg-slate-100 text-slate-700 hover:border-slate-400 hover:bg-slate-200 hover:text-slate-900"><a href="/guia-sistema-registros-aba.pdf" download><Download className="size-4" />Baixar manual em PDF</a></Button></div>
      </div>
    </header>

    <section className="grid gap-3 sm:grid-cols-2">
      <Card><CardContent className="p-4"><BookOpenCheck className="mb-2 size-5 text-primary" /><p className="font-bold">Consulte antes de preencher</p><p className="text-xs text-muted-foreground">Cada tópico explica propósito, momento de uso, preenchimento e relevância.</p></CardContent></Card>
      <Card><CardContent className="p-4"><ShieldCheck className="mb-2 size-5 text-primary" /><p className="font-bold">Apoio, não decisão automática</p><p className="text-xs text-muted-foreground">O sistema organiza evidências; decisões continuam sob responsabilidade profissional.</p></CardContent></Card>
    </section>

    <GuiaConteudo />

    <Card><CardContent className="flex flex-wrap gap-2 p-5"><Button asChild variant="outline"><Link href="/registros/pacientes">Pacientes</Link></Button><Button asChild variant="outline"><Link href="/registros/sessoes">Sessões</Link></Button><Button asChild variant="outline"><Link href="/registros/solicitacoes">Solicitações</Link></Button><Button asChild variant="outline"><Link href="/registros/conta">Minha conta</Link></Button></CardContent></Card>
    <p className="text-xs text-muted-foreground">Este material orienta o uso do software. Não substitui formação, supervisão, avaliação individualizada, consentimento, requisitos profissionais ou julgamento clínico.</p>
  </div>
}
