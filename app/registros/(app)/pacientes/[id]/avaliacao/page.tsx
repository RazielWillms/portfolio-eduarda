import { SinteseAvaliacaoInicial } from "@/components/registros/sintese-avaliacao-inicial"
import { getProfile, getSessoesClinicasPaciente, getSintesesAvaliacaoPaciente } from "@/lib/registros/queries"

export default async function AvaliacaoPacientePage({params}:{params:Promise<{id:string}>}){
  const{id}=await params;const[sessoes,sinteses,profile]=await Promise.all([getSessoesClinicasPaciente(id),getSintesesAvaliacaoPaciente(id),getProfile()])
  const sessoesProprias=sessoes.filter((sessao)=>sessao.profissional_id===profile?.id)
  return <div className="space-y-6"><div><h2 className="text-xl font-bold">Avaliação inicial</h2><p className="text-sm text-muted-foreground">Consolide evidências das suas sessões iniciais e fundamente as prioridades do seu planejamento.</p></div><SinteseAvaliacaoInicial pacienteId={id} sessoes={sessoesProprias} sinteses={sinteses}/></div>
}
