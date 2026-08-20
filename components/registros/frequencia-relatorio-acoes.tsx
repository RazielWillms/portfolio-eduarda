"use client"
import Link from"next/link";import{ArrowLeft,Printer}from"lucide-react";import{Button}from"@/components/ui/button"
export function FrequenciaRelatorioAcoes({voltar}:{voltar:string}){return <div className="mb-6 flex flex-wrap justify-between gap-2 print:hidden"><Button variant="secondary"asChild><Link href={voltar}><ArrowLeft className="size-4"/>Voltar para Frequência</Link></Button><Button onClick={()=>window.print()}><Printer className="size-4"/>Salvar como PDF / imprimir</Button></div>}
