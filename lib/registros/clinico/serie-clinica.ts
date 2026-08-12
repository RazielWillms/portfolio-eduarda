import type { AlvoClinicoCompleto, CriterioDominioAlvo, FaseAlvo, SessaoClinicaComRegistros, TipoMedicao } from "./modelo"
import { unidadeMedicao, valorMedicao } from "./analise-medicao"

export type PontoSerieClinica={
  id:string;data:string;valor:number;tipo:TipoMedicao;unidade:string
  fase:FaseAlvo|null;ambiente:string|null;aplicador:string|null
  numerador:number|null;denominador:number|null;protocoloVersao:number|null;integridade:number|null
  tentativas?:ResumoTentativas|null
}
export type ResumoTentativas={total:number;independentes:number;corretasComAjuda:number;comAjuda:number;incorretas:number;semResposta:number;latenciaMedia:number|null;ajudas:Record<"gestual"|"verbal"|"modelo"|"fisica_parcial"|"fisica_total",number>}
export type SerieClinica={
  alvoId:string;nome:string;tipo:TipoMedicao;unidade:string;direcao:"aumentar"|"reduzir"|null
  criterioValor:number|null;criterioSessoes:number|null;pontos:PontoSerieClinica[]
}

const fasePorFinalidade:Record<string,FaseAlvo|null>={linha_de_base:"linha_de_base",intervencao:"ensino",generalizacao:"generalizacao",manutencao:"manutencao"}
function numero(dados:Record<string,unknown>,chave:string){const v=dados[chave];return typeof v==="number"&&Number.isFinite(v)?v:null}
function partes(tipo:TipoMedicao,dados:Record<string,unknown>){
  if(["percentual_oportunidades","tentativas_discretas"].includes(tipo))return{numerador:numero(dados,"respostas_independentes"),denominador:numero(dados,"oportunidades")}
  if(["intervalo_parcial","intervalo_total","amostragem_momentanea"].includes(tipo))return{numerador:numero(dados,"intervalos_com_ocorrencia"),denominador:numero(dados,"intervalos")}
  if(tipo==="taxa")return{numerador:numero(dados,"contagem"),denominador:numero(dados,"duracao_observacao_segundos")}
  return{numerador:null,denominador:null}
}
export function resumirTentativas(tentativas:SessaoClinicaComRegistros["registros"][number]["tentativas"]):ResumoTentativas|null{
  if(!tentativas.length)return null
  const latencias=tentativas.map(t=>t.latencia_segundos).filter((v):v is number=>v!==null)
  const ajuda=(nivel:Exclude<(typeof tentativas)[number]["nivel_ajuda"],"independente">)=>tentativas.filter(t=>t.nivel_ajuda===nivel).length
  return{total:tentativas.length,independentes:tentativas.filter(t=>t.resultado==="correta"&&t.nivel_ajuda==="independente").length,corretasComAjuda:tentativas.filter(t=>t.resultado==="correta"&&t.nivel_ajuda!=="independente").length,comAjuda:tentativas.filter(t=>t.nivel_ajuda!=="independente").length,incorretas:tentativas.filter(t=>t.resultado==="incorreta").length,semResposta:tentativas.filter(t=>t.resultado==="sem_resposta").length,latenciaMedia:latencias.length?Number((latencias.reduce((a,b)=>a+b,0)/latencias.length).toFixed(2)):null,ajudas:{gestual:ajuda("gestual"),verbal:ajuda("verbal"),modelo:ajuda("modelo"),fisica_parcial:ajuda("fisica_parcial"),fisica_total:ajuda("fisica_total")}}
}
export type TendenciaTentativas="aumentou"|"reduziu"|"estavel"|"dados_insuficientes"
export function analisarEvolucaoTentativas(pontos:PontoSerieClinica[]){
  const detalhados=pontos.filter((p):p is PontoSerieClinica&{tentativas:ResumoTentativas}=>Boolean(p.tentativas)).slice(-6)
  if(detalhados.length<4)return{independencia:"dados_insuficientes"as const,ajuda:"dados_insuficientes"as const,latencia:"dados_insuficientes"as const,cobertura:detalhados.length}
  const metade=Math.floor(detalhados.length/2),primeiro=detalhados.slice(0,metade),recente=detalhados.slice(metade)
  const proporcao=(grupo:typeof detalhados,campo:"independentes"|"comAjuda")=>grupo.reduce((a,p)=>a+p.tentativas[campo],0)/grupo.reduce((a,p)=>a+p.tentativas.total,0)*100
  const mediaLatencia=(grupo:typeof detalhados)=>{const valores=grupo.map(p=>p.tentativas.latenciaMedia).filter((v):v is number=>v!==null);return valores.length?valores.reduce((a,b)=>a+b,0)/valores.length:null}
  const classificar=(antes:number|null,depois:number|null,limiar:number):TendenciaTentativas=>antes===null||depois===null?"dados_insuficientes":depois-antes>limiar?"aumentou":antes-depois>limiar?"reduziu":"estavel"
  return{independencia:classificar(proporcao(primeiro,"independentes"),proporcao(recente,"independentes"),5),ajuda:classificar(proporcao(primeiro,"comAjuda"),proporcao(recente,"comAjuda"),5),latencia:classificar(mediaLatencia(primeiro),mediaLatencia(recente),0.5),cobertura:detalhados.length}
}
export function construirSerieClinica(alvo:AlvoClinicoCompleto,sessoes:SessaoClinicaComRegistros[]):SerieClinica{
  const medicao=[...alvo.medicoes].sort((a,b)=>b.versao-a.versao)[0]
  const criterio:CriterioDominioAlvo|undefined=[...alvo.criterios].sort((a,b)=>b.versao-a.versao)[0]
  const protocolos=new Map(alvo.protocolos.map((p)=>[p.id,p.versao]))
  const todosPontos=sessoes.flatMap((sessao)=>sessao.registros.filter((r)=>r.alvo_id===alvo.id).map((registro)=>{
    const valor=valorMedicao(registro.tipo_medicao,registro.dados);if(valor===null)return null
    const integridade=registro.integridade[0]
    const partesRegistro=partes(registro.tipo_medicao,registro.dados)
    return{id:registro.id,data:sessao.data,valor,tipo:registro.tipo_medicao,unidade:unidadeMedicao(registro.tipo_medicao),fase:fasePorFinalidade[sessao.finalidade]??null,ambiente:sessao.ambiente_tipo,aplicador:sessao.aplicador_tipo,...partesRegistro,protocoloVersao:registro.protocolo_intervencao_id?protocolos.get(registro.protocolo_intervencao_id)??null:null,integridade:integridade?Math.round((integridade.itens_realizados/integridade.itens_previstos)*100):null,tentativas:resumirTentativas(registro.tentativas)}
  })).filter((p):p is NonNullable<typeof p>=>p!==null).sort((a,b)=>a.data.localeCompare(b.data)||a.id.localeCompare(b.id))
  const tipo=medicao?.tipo??todosPontos.at(-1)?.tipo??"frequencia"
  const pontos=todosPontos.filter((p)=>p.tipo===tipo)
  return{alvoId:alvo.id,nome:alvo.nome,tipo,unidade:unidadeMedicao(tipo),direcao:criterio?.direcao??null,criterioValor:criterio?.valor_alvo??null,criterioSessoes:criterio?.sessoes_consecutivas??null,pontos}
}
export function resumirSerie(pontos:PontoSerieClinica[],direcao:"aumentar"|"reduzir"|null){
  if(!pontos.length)return{primeiro:null,ultimo:null,variacao:null,tendencia:"dados_insuficientes" as const}
  const primeiro=pontos[0].valor,ultimo=pontos.at(-1)!.valor,variacao=Number((ultimo-primeiro).toFixed(2))
  const melhora=direcao==="reduzir"?variacao<0:variacao>0
  const piora=direcao==="reduzir"?variacao>0:variacao<0
  return{primeiro,ultimo,variacao,tendencia:pontos.length<3?"dados_insuficientes" as const:melhora?"melhora" as const:piora?"queda" as const:"estavel" as const}
}
export type ComparacaoContextual={chave:string;rotulo:string;sessoes:number;media:number;ultimo:number}
export function compararContextos(pontos:PontoSerieClinica[],campo:"ambiente"|"aplicador"|"fase"):ComparacaoContextual[]{
  const grupos=new Map<string,PontoSerieClinica[]>()
  for(const ponto of pontos){const chave=ponto[campo];if(!chave)continue;grupos.set(chave,[...(grupos.get(chave)??[]),ponto])}
  return[...grupos.entries()].map(([chave,grupo])=>({chave,rotulo:chave,sessoes:grupo.length,media:Number((grupo.reduce((a,p)=>a+p.valor,0)/grupo.length).toFixed(2)),ultimo:grupo.at(-1)!.valor})).sort((a,b)=>b.sessoes-a.sessoes||a.rotulo.localeCompare(b.rotulo))
}
