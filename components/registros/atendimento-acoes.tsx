"use client"

import Link from "next/link"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Pencil, RotateCcw, Trash2 } from "lucide-react"
import { excluirAtendimento, restaurarAtendimento } from "@/lib/registros/actions"
import { Button } from "@/components/ui/button"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"

export function AtendimentoAcoes({ id, pacienteId, excluido = false }: { id: string; pacienteId: string; excluido?: boolean }) {
  const router = useRouter(); const [processando, setProcessando] = useState(false)
  if (excluido) return <Button size="sm" variant="outline" disabled={processando} onClick={async () => { setProcessando(true); await restaurarAtendimento({ id, pacienteId }); router.refresh(); setProcessando(false) }}><RotateCcw className="size-4" />Restaurar</Button>
  return <div className="flex gap-1"><Button asChild size="icon" variant="ghost" aria-label="Editar atendimento"><Link href={`/registros/atendimentos/${id}/editar`}><Pencil className="size-4" /></Link></Button><AlertDialog><AlertDialogTrigger asChild><Button size="icon" variant="ghost" aria-label="Excluir atendimento"><Trash2 className="size-4 text-destructive" /></Button></AlertDialogTrigger><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Excluir atendimento?</AlertDialogTitle><AlertDialogDescription>Este atendimento deixará de aparecer nas listagens e de participar dos cálculos de evolução do paciente. O registro será preservado para auditoria e poderá ser restaurado.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction disabled={processando} onClick={async () => { setProcessando(true); await excluirAtendimento({ id, pacienteId }); router.refresh() }}>Excluir atendimento</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog></div>
}
