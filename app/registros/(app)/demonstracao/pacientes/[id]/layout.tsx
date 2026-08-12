import type { ReactNode } from "react"
import { notFound } from "next/navigation"
import { getCenarioDemonstracao } from "@/lib/registros/queries"
import { formatarData } from "@/lib/registros/demonstracao"
import { DemonstracaoPacienteNav } from "@/components/registros/demonstracao-paciente-nav"

export default async function DemonstracaoPacienteLayout({children,params}:{children:ReactNode;params:Promise<{id:string}>}){
 const {id}=await params;const dados=await getCenarioDemonstracao();if(!dados||dados.paciente.id!==id)notFound()
 return <div className="space-y-5"><header className="rounded-2xl border bg-card p-5"><p className="text-sm text-muted-foreground">Paciente fictício</p><h1 className="text-2xl font-bold">{dados.paciente.nome}</h1><p className="mt-1 text-sm text-muted-foreground">Nascimento: {formatarData(dados.paciente.data_nascimento)} · {dados.paciente.diagnostico}</p></header><DemonstracaoPacienteNav pacienteId={id}/>{children}</div>
}

