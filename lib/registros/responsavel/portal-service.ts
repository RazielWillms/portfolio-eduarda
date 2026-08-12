import "server-only"
import {createClient as createSupabaseClient}from"@supabase/supabase-js"
import type{SharedClinicalDashboard,SharedClinicalTarget}from"./types"
import{reportServerError}from"@/lib/server-log"
type Raw={primeiro_nome:string;periodo_inicio:string;periodo_fim:string;ultima_atualizacao:string|null;configuracao:SharedClinicalDashboard["configuracao"];alvos:SharedClinicalTarget[]}
export async function obterPortalResponsavel(token:string):Promise<SharedClinicalDashboard|null>{
 const supabase=createSupabaseClient(process.env.NEXT_PUBLIC_SUPABASE_URL!,process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,{auth:{persistSession:false,autoRefreshToken:false}});const{data,error}=await supabase.rpc("obter_acompanhamento_responsavel_v2",{p_token:token});if(error){reportServerError("obterPortalResponsavel",error);return null}if(!data)return null;const r=data as Raw
 return{primeiroNome:r.primeiro_nome,periodoInicio:r.periodo_inicio,periodoFim:r.periodo_fim,ultimaAtualizacao:r.ultima_atualizacao,configuracao:r.configuracao,alvos:r.alvos??[]}
}
