import type{AlvoClinicoCompleto,RegistroValidadeSocial,SessaoClinicaComRegistros}from"./modelo"
import{avaliarDominio}from"./decisao-dominio"
import{construirSerieClinica,resumirSerie}from"./serie-clinica"
export type ItemProntidao={id:string;rotulo:string;estado:"atendido"|"atencao"|"sem_dados";detalhe:string}
export function avaliarProntidaoRevisao(alvo:AlvoClinicoCompleto,sessoes:SessaoClinicaComRegistros[],registrosValidade:RegistroValidadeSocial[]=[],profissionalId=alvo.profissional_id,agora=new Date()):ItemProntidao[]{
 const criterio=[...alvo.criterios].sort((a,b)=>b.versao-a.versao)[0],serie=construirSerieClinica(alvo,sessoes),resumo=resumirSerie(serie.pontos,serie.direcao),recentes=serie.pontos.slice(-6)
 const integridades=recentes.map(p=>p.integridade).filter((v):v is number=>v!==null),mediaIntegridade=integridades.length?Math.round(integridades.reduce((a,b)=>a+b,0)/integridades.length):null
 const ambientes=new Set(recentes.map(p=>p.ambiente).filter(Boolean)).size,aplicadores=new Set(recentes.map(p=>p.aplicador).filter(Boolean)).size,dominio=criterio?avaliarDominio(criterio,alvo.id,sessoes):null
 const validade=[...registrosValidade].filter(r=>r.profissional_id===profissionalId&&(r.alvo_id===alvo.id||r.alvo_id===null)).sort((a,b)=>{const escopo=Number(b.alvo_id===alvo.id)-Number(a.alvo_id===alvo.id);return escopo||b.registrado_em.localeCompare(a.registrado_em)})[0]
 const idadeDias=validade?Math.floor((agora.getTime()-new Date(`${validade.registrado_em}T12:00:00`).getTime())/86400000):null,atual=idadeDias!==null&&idadeDias<=180
 const percepcaoFavoravel=!!validade&&validade.objetivo_relevante&&validade.aceitabilidade>=4&&validade.viabilidade>=4&&validade.beneficio_percebido>=4
 const detalheValidade=!validade?"Registre relevância, aceitabilidade, viabilidade e benefício percebido.":!atual?`A última avaliação tem ${idadeDias} dias; confirme se ainda representa o contexto atual.`:percepcaoFavoravel?"Objetivo relevante e avaliações de aceitabilidade, viabilidade e benefício entre 4 e 5.":"Há aspectos de relevância, aceitabilidade, viabilidade ou benefício que precisam ser revistos."
 const detalheAssentimento=!validade?"Nenhuma observação de assentimento vinculada ao alvo ou ao plano geral.":validade.assentimento_observado==="aceite"?"Aceitação observável registrada.":validade.assentimento_observado==="recusa"?"Recusa observável registrada; reveja o objetivo, o procedimento e as adaptações.":validade.assentimento_observado==="ambivalente"?"Sinais ambivalentes registrados; investigue condições e adaptações.":"Assentimento não foi observado ou não se aplica ao registro mais recente."
 return[
  {id:"criterio",rotulo:"Critério vigente",estado:dominio?.estado==="criterio_atingido"?"atendido":dominio?"atencao":"sem_dados",detalhe:dominio?.mensagem??"Cadastre um critério mensurável antes de revisar a fase."},
  {id:"serie",rotulo:"Série recente",estado:recentes.length>=3?"atendido":recentes.length?"atencao":"sem_dados",detalhe:`${recentes.length}/3 medições mínimas para uma leitura descritiva.`},
  {id:"tendencia",rotulo:"Tendência",estado:resumo.tendencia==="melhora"?"atendido":resumo.tendencia==="dados_insuficientes"?"sem_dados":"atencao",detalhe:resumo.tendencia==="melhora"?"Evolução recente favorável.":resumo.tendencia==="estavel"?"Série recente estável.":resumo.tendencia==="queda"?"Série recente requer análise.":"Ainda não há dados suficientes."},
  {id:"integridade",rotulo:"Integridade",estado:mediaIntegridade===null?"sem_dados":mediaIntegridade>=80?"atendido":"atencao",detalhe:mediaIntegridade===null?"Sem integridade calculável nas sessões recentes.":`Média recente de ${mediaIntegridade}%.`},
  {id:"generalizacao",rotulo:"Diversidade contextual",estado:ambientes>=2&&aplicadores>=2?"atendido":ambientes||aplicadores?"atencao":"sem_dados",detalhe:`${ambientes} ambiente(s) e ${aplicadores} tipo(s) de aplicador nas sessões recentes.`},
  {id:"validade_social",rotulo:"Validade social",estado:!validade?"sem_dados":atual&&percepcaoFavoravel?"atendido":"atencao",detalhe:detalheValidade},
  {id:"assentimento",rotulo:"Assentimento",estado:!validade||validade.assentimento_observado==="nao_observado"||validade.assentimento_observado==="nao_aplicavel"?"sem_dados":atual&&validade.assentimento_observado==="aceite"?"atendido":"atencao",detalhe:detalheAssentimento},
 ]
}
