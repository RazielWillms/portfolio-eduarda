"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Trash2 } from "lucide-react"
import { excluirOuDesativarHabilidade } from "@/lib/registros/actions"
import { Button } from "@/components/ui/button"
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

export function HabilidadeExclusao({ id }: { id: string }) {
  const router = useRouter()
  const [erro, setErro] = useState("")
  async function confirmar() {
    const resultado = await excluirOuDesativarHabilidade(id)
    if (resultado && "error" in resultado) setErro(resultado.error)
    else router.push("/registros/habilidades")
  }
  return <div className="mt-6 border-t pt-5">
    <AlertDialog>
      <AlertDialogTrigger asChild><Button variant="outline"><Trash2 className="size-4" />Excluir definitivamente ou desativar</Button></AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader><AlertDialogTitle>Excluir ou desativar habilidade?</AlertDialogTitle><AlertDialogDescription>Se a habilidade possuir qualquer vínculo ou histórico clínico, ela será somente desativada. A exclusão definitiva ocorrerá apenas quando nunca tiver sido utilizada.</AlertDialogDescription></AlertDialogHeader>
        <AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={confirmar}>Continuar</AlertDialogAction></AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    {erro && <p className="text-sm text-destructive mt-2">{erro}</p>}
  </div>
}
