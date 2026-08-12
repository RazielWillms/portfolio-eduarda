"use client"

import { useEffect, useRef, useState, type ChangeEvent } from "react"
import { Camera, Crop, Minus, Plus, Trash2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { atualizarEnquadramentoFoto, atualizarFotoPaciente, atualizarMinhaFoto, removerFotoPaciente, removerMinhaFoto } from "@/lib/registros/actions"
import { FotoAvatar } from "@/components/registros/foto-avatar"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Slider } from "@/components/ui/slider"

type Props={tipo:"profile"|"paciente";id:string;nome:string;fotoUrl?:string|null;fotoZoom?:number;fotoPosX?:number;fotoPosY?:number}

export function FotoCadastroForm({tipo,id,nome,fotoUrl,fotoZoom=1,fotoPosX=0,fotoPosY=0}:Props){
  const router=useRouter(),input=useRef<HTMLInputElement>(null)
  const[arquivo,setArquivo]=useState<File|null>(null),[preview,setPreview]=useState<string|null>(null),[aberto,setAberto]=useState(false)
  const[zoom,setZoom]=useState(fotoZoom),[posX,setPosX]=useState(fotoPosX),[posY,setPosY]=useState(fotoPosY)
  const[processando,setProcessando]=useState(false),[erro,setErro]=useState("")
  const arraste=useRef<{x:number;y:number;posX:number;posY:number}|null>(null)

  useEffect(()=>()=>{if(preview)URL.revokeObjectURL(preview)},[preview])
  function escolher(e:ChangeEvent<HTMLInputElement>){const novo=e.target.files?.[0];e.target.value="";if(!novo)return;if(preview)URL.revokeObjectURL(preview);setArquivo(novo);setPreview(URL.createObjectURL(novo));setZoom(1);setPosX(0);setPosY(0);setErro("");setAberto(true)}
  function editar(){setArquivo(null);setPreview(null);setZoom(fotoZoom);setPosX(fotoPosX);setPosY(fotoPosY);setErro("");setAberto(true)}
  async function salvar(){setProcessando(true);setErro("");let resultado;if(arquivo){const fd=new FormData();fd.set("foto",arquivo);fd.set("zoom",String(zoom));fd.set("posX",String(posX));fd.set("posY",String(posY));resultado=tipo==="profile"?await atualizarMinhaFoto(fd):await atualizarFotoPaciente(id,fd)}else resultado=await atualizarEnquadramentoFoto(tipo,id,zoom,posX,posY);if(resultado&&"error"in resultado)setErro(resultado.error);else{setAberto(false);router.refresh()}setProcessando(false)}
  async function remover(){setProcessando(true);setErro("");const resultado=tipo==="profile"?await removerMinhaFoto():await removerFotoPaciente(id);if(resultado&&"error"in resultado)setErro(resultado.error);else router.refresh();setProcessando(false)}
  const imagem=preview??fotoUrl
  function iniciarArraste(event:React.PointerEvent<HTMLDivElement>){event.currentTarget.setPointerCapture(event.pointerId);arraste.current={x:event.clientX,y:event.clientY,posX,posY}}
  function moverImagem(event:React.PointerEvent<HTMLDivElement>){if(!arraste.current)return;const largura=event.currentTarget.clientWidth||256,altura=event.currentTarget.clientHeight||256;setPosX(Math.max(-50,Math.min(50,arraste.current.posX+(event.clientX-arraste.current.x)*100/largura)));setPosY(Math.max(-50,Math.min(50,arraste.current.posY+(event.clientY-arraste.current.y)*100/altura)))}
  function pararArraste(event:React.PointerEvent<HTMLDivElement>){if(event.currentTarget.hasPointerCapture(event.pointerId))event.currentTarget.releasePointerCapture(event.pointerId);arraste.current=null}
  return <>
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
      <FotoAvatar nome={nome} src={fotoUrl} zoom={fotoZoom} posX={fotoPosX} posY={fotoPosY} className="size-20" fallbackClassName="text-lg"/>
      <div className="space-y-2"><input ref={input} className="sr-only" type="file" accept="image/jpeg,image/png,image/webp" onChange={escolher}/><div className="flex flex-wrap gap-2"><Button type="button" size="sm" disabled={processando} onClick={()=>input.current?.click()}><Camera className="size-4"/>{fotoUrl?"Substituir foto":"Adicionar foto"}</Button>{fotoUrl&&<Button type="button" size="sm" variant="secondary" disabled={processando} onClick={editar}><Crop className="size-4"/>Ajustar enquadramento</Button>}{fotoUrl&&<Button type="button" size="sm" variant="secondary" className="bg-slate-200 text-slate-700 hover:bg-slate-300" disabled={processando} onClick={remover}><Trash2 className="size-4"/>Remover</Button>}</div><p className="text-xs text-muted-foreground">JPEG, PNG ou WebP, com no máximo 2 MB.</p>{erro&&!aberto&&<p role="alert" className="text-sm text-destructive">{erro}</p>}</div>
    </div>
    <Dialog open={aberto} onOpenChange={valor=>{if(!processando)setAberto(valor)}}><DialogContent className="sm:max-w-md"><DialogHeader><DialogTitle>Ajustar enquadramento</DialogTitle><DialogDescription>Arraste a imagem dentro da moldura e ajuste o zoom. O arquivo original é preservado.</DialogDescription></DialogHeader><div className="mx-auto size-64 cursor-grab touch-none select-none overflow-hidden rounded-full border-4 border-background bg-muted shadow-inner active:cursor-grabbing" onPointerDown={iniciarArraste} onPointerMove={moverImagem} onPointerUp={pararArraste} onPointerCancel={pararArraste}><FotoAvatar nome={nome} src={imagem} zoom={zoom} posX={posX} posY={posY} className="pointer-events-none size-full rounded-none border-0"/></div><p className="text-center text-xs text-muted-foreground">Arraste para reposicionar</p><div className="mx-auto flex w-full max-w-64 items-center gap-3"><Button type="button" size="icon" variant="ghost" className="size-8 rounded-full" aria-label="Diminuir zoom" onClick={()=>setZoom(valor=>Math.max(1,valor-.1))}><Minus className="size-4"/></Button><Slider aria-label="Zoom da foto" value={[zoom]} min={1} max={2.5} step={0.01} onValueChange={valores=>setZoom(valores[0])}/><Button type="button" size="icon" variant="ghost" className="size-8 rounded-full" aria-label="Aumentar zoom" onClick={()=>setZoom(valor=>Math.min(2.5,valor+.1))}><Plus className="size-4"/></Button><span className="w-10 text-right text-xs tabular-nums text-muted-foreground">{Math.round(zoom*100)}%</span></div>{erro&&<p role="alert" className="text-sm text-destructive">{erro}</p>}<DialogFooter><Button type="button" variant="secondary" disabled={processando} onClick={()=>setAberto(false)}>Cancelar</Button><Button type="button" disabled={processando} onClick={salvar}>{processando?"Salvando...":"Salvar enquadramento"}</Button></DialogFooter></DialogContent></Dialog>
  </>
}
