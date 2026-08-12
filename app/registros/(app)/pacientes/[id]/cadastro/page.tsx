import { notFound } from "next/navigation"
import { getPaciente } from "@/lib/registros/queries"
import { PacienteForm } from "@/components/registros/paciente-form"
import { FotoCadastroForm } from "@/components/registros/foto-cadastro-form"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default async function CadastroPage({params}:{params:Promise<{id:string}>}){
  const{id}=await params,paciente=await getPaciente(id);if(!paciente)notFound()
  return <div className="space-y-5"><div><h2 className="text-xl font-bold">Dados cadastrais</h2><p className="text-sm text-muted-foreground">Consulte ou atualize somente quando necessário.</p></div><Card><CardHeader><CardTitle className="text-base">Foto do paciente</CardTitle></CardHeader><CardContent><FotoCadastroForm tipo="paciente" id={paciente.id} nome={paciente.nome_completo} fotoUrl={paciente.foto_url} fotoZoom={paciente.foto_zoom} fotoPosX={paciente.foto_pos_x} fotoPosY={paciente.foto_pos_y}/></CardContent></Card><PacienteForm pacienteExistente={paciente}/></div>
}
