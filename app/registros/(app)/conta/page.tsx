import { BadgeCheck, KeyRound, UserRound } from "lucide-react"
import { getProfile, getProfissoes } from "@/lib/registros/queries"
import { AlterarSenhaForm } from "@/components/registros/alterar-senha-form"
import { DadosProfissionaisForm } from "@/components/registros/dados-profissionais-form"
import { FotoCadastroForm } from "@/components/registros/foto-cadastro-form"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default async function ContaPage() {
  const [profile,profissoes]=await Promise.all([getProfile(),getProfissoes()])
  return <div className="flex max-w-2xl flex-col gap-6">
    <div><h1 className="text-2xl font-bold">Minha conta</h1><p className="mt-1 text-sm text-muted-foreground">Gerencie seu perfil e suas credenciais de acesso.</p></div>
    {profile&&<Card><CardHeader><CardTitle className="flex items-center gap-2"><UserRound className="size-5 text-primary"/>Foto de perfil</CardTitle><CardDescription>Ajuda a identificar você na equipe dos pacientes.</CardDescription></CardHeader><CardContent><FotoCadastroForm tipo="profile" id={profile.id} nome={profile.nome} fotoUrl={profile.foto_url} fotoZoom={profile.foto_zoom} fotoPosX={profile.foto_pos_x} fotoPosY={profile.foto_pos_y}/></CardContent></Card>}
    {profile&&<Card><CardHeader><CardTitle className="flex items-center gap-2"><BadgeCheck className="size-5 text-primary"/>Dados profissionais</CardTitle><CardDescription>Informações opcionais de identificação profissional. Elas não alteram suas permissões de acesso.</CardDescription></CardHeader><CardContent><DadosProfissionaisForm profissaoId={profile.profissao_id} profissoes={profissoes} conselhoNumero={profile.conselho_numero} conselhoUf={profile.conselho_uf}/></CardContent></Card>}
    <Card><CardHeader><CardTitle className="flex items-center gap-2"><KeyRound className="size-5 text-primary"/>Alterar senha</CardTitle><CardDescription>A nova senha será aplicada somente à sua própria conta.</CardDescription></CardHeader><CardContent><AlterarSenhaForm/></CardContent></Card>
  </div>
}
