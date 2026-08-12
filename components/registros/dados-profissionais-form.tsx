"use client"

import { useState, useTransition } from "react"
import { atualizarMeusDadosProfissionais } from "@/lib/registros/actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function DadosProfissionaisForm({profissao,conselhoTipo,conselhoNumero,conselhoUf}:{profissao:string|null;conselhoTipo:string|null;conselhoNumero:string|null;conselhoUf:string|null}){
  const[pendente,iniciar]=useTransition(),[mensagem,setMensagem]=useState<{tipo:"erro"|"sucesso";texto:string}|null>(null)
  function enviar(formData:FormData){setMensagem(null);iniciar(async()=>{const resultado=await atualizarMeusDadosProfissionais({profissao:String(formData.get("profissao")??""),conselhoTipo:String(formData.get("conselhoTipo")??""),conselhoNumero:String(formData.get("conselhoNumero")??""),conselhoUf:String(formData.get("conselhoUf")??"")});setMensagem("error"in resultado?{tipo:"erro",texto:resultado.error}:{tipo:"sucesso",texto:"Dados profissionais atualizados."})})}
  return <form action={enviar} className="space-y-4"><div className="grid gap-4 sm:grid-cols-2"><Campo id="profissao" label="Profissão" defaultValue={profissao} placeholder="Ex.: Psicóloga, pedagoga" maxLength={100}/><Campo id="conselhoTipo" label="Conselho de classe" defaultValue={conselhoTipo} placeholder="Ex.: CRP, CREFONO" maxLength={30}/><Campo id="conselhoNumero" label="Número do registro" defaultValue={conselhoNumero} placeholder="Ex.: 00/123456" maxLength={40}/><Campo id="conselhoUf" label="UF do registro" defaultValue={conselhoUf} placeholder="Ex.: SC" maxLength={2}/></div><p className="text-xs text-muted-foreground">Todos os campos são opcionais. Informe apenas credenciais profissionais que possam ser exibidas à equipe.</p>{mensagem&&<p role="status" className={mensagem.tipo==="erro"?"text-sm text-destructive":"text-sm text-emerald-700"}>{mensagem.texto}</p>}<Button type="submit" disabled={pendente}>{pendente?"Salvando...":"Salvar dados profissionais"}</Button></form>
}
function Campo({id,label,defaultValue,...props}:{id:string;label:string;defaultValue:string|null;placeholder:string;maxLength:number}){return <div className="space-y-2"><Label htmlFor={id}>{label}</Label><Input id={id} name={id} defaultValue={defaultValue??""} {...props}/></div>}
