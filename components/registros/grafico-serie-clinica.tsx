"use client"
import { Bar, CartesianGrid, ComposedChart, Line, ReferenceLine, XAxis, YAxis } from "recharts"
import type { SerieClinica } from "@/lib/registros/clinico/serie-clinica"
import { ChartContainer, ChartTooltip } from "@/components/ui/chart"

const formatar=(data:string)=>new Date(`${data}T12:00:00`).toLocaleDateString("pt-BR")
const fase:Record<string,string>={linha_de_base:"Linha de base",ensino:"Ensino",generalizacao:"Generalização",manutencao:"Manutenção"}

export function GraficoSerieClinica({serie}:{serie:SerieClinica}){
  const barras=serie.tipo==="frequencia"||serie.tipo==="intensidade",temIntegridade=serie.pontos.some(p=>p.integridade!==null)
  const mudancasFase=serie.pontos.filter((p,i,pontos)=>p.fase&&p.fase!==pontos[i-1]?.fase)
  if(!serie.pontos.length)return <p className="rounded-xl border border-dashed py-12 text-center text-sm text-muted-foreground">Ainda não há dados para os filtros selecionados.</p>
  return <ChartContainer config={{valor:{label:serie.nome,color:"var(--primary)"},integridade:{label:"Integridade",color:"#64748b"}}} className="h-64 w-full aspect-auto sm:h-80">
    <ComposedChart data={serie.pontos} margin={{left:0,right:temIntegridade?4:8,top:18,bottom:4}}>
      <CartesianGrid vertical={false}/><XAxis dataKey="data" minTickGap={28} tickFormatter={v=>formatar(v).slice(0,5)}/><YAxis yAxisId="valor" width={44} domain={serie.unidade==="%"?[0,100]:["auto","auto"]}/>
      {temIntegridade&&<YAxis yAxisId="integridade" orientation="right" width={36} domain={[0,100]} tickFormatter={v=>`${v}%`}/>}<ChartTooltip formatter={(value,name,item)=><div className="grid min-w-40 gap-1"><strong>{name==="integridade"?`Integridade: ${value}%`:`${value} ${serie.unidade}`}</strong><span>{formatar(item.payload.data)}{item.payload.fase?` · ${fase[item.payload.fase]??item.payload.fase}`:""}</span>{item.payload.denominador&&<span>{item.payload.numerador}/{item.payload.denominador}</span>}{item.payload.ambiente&&<span>{item.payload.ambiente} · {item.payload.aplicador}</span>}{item.payload.protocoloVersao&&<span>Protocolo v{item.payload.protocoloVersao}</span>}</div>}/>
      {serie.criterioValor!==null&&<ReferenceLine yAxisId="valor" y={serie.criterioValor} stroke="#0f766e" strokeDasharray="6 4" label={{value:`Critério ${serie.direcao==="reduzir"?"≤":"≥"} ${serie.criterioValor}`,position:"insideTopRight",fill:"#0f766e",fontSize:10}}/>}
      {mudancasFase.map(p=><ReferenceLine key={`${p.id}-fase`} yAxisId="valor" x={p.data} stroke="#94a3b8" strokeDasharray="2 4"/>)}
      {barras?<Bar yAxisId="valor" dataKey="valor" fill="var(--color-valor)" radius={[4,4,0,0]}/>:<Line yAxisId="valor" dataKey="valor" stroke="var(--color-valor)" strokeWidth={3} dot={{r:3}} connectNulls={false}/>} {temIntegridade&&<Line yAxisId="integridade" dataKey="integridade" stroke="var(--color-integridade)" strokeWidth={1.5} strokeDasharray="4 4" dot={false} connectNulls={false}/>} 
    </ComposedChart>
  </ChartContainer>
}
