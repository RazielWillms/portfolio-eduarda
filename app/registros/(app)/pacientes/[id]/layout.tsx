import type { ReactNode } from "react"
import Link from "next/link"
import { notFound } from "next/navigation"
import { Plus } from "lucide-react"
import { getPaciente } from "@/lib/registros/queries"
import { calcularIdade } from "@/lib/registros/types"
import { FotoAvatar } from "@/components/registros/foto-avatar"
import { PacienteNav } from "@/components/registros/paciente-nav"
import { Button } from "@/components/ui/button"

export default async function PacienteLayout({children,params}:{children:ReactNode;params:Promise<{id:string}>}){
  const{id}=await params,paciente=await getPaciente(id);if(!paciente)notFound()
  return <div className="space-y-5"><header className="rounded-2xl border bg-card p-4 sm:p-5"><div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"><div className="flex min-w-0 items-center gap-3 sm:gap-4"><FotoAvatar nome={paciente.nome_completo} src={paciente.foto_url} zoom={paciente.foto_zoom} posX={paciente.foto_pos_x} posY={paciente.foto_pos_y} className="size-14 shrink-0 sm:size-16"/><div className="min-w-0"><p className="text-sm text-muted-foreground">Paciente</p><h1 className="break-words text-xl font-bold sm:text-2xl">{paciente.nome_completo}</h1><p className="mt-1 text-sm text-muted-foreground">{calcularIdade(paciente.data_nascimento)??"—"} anos · Responsável: {paciente.nome_responsavel??"não informado"}</p></div></div><Button asChild className="w-full sm:w-auto"><Link href={`/registros/sessoes/nova?paciente=${id}`}><Plus className="size-4"/>Registrar sessão</Link></Button></div></header><PacienteNav pacienteId={id}/>{children}</div>
}
