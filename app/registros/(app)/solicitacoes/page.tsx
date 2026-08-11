import { getSolicitacoesEnviadas, getSolicitacoesRecebidas } from "@/lib/registros/queries"
import { SolicitacoesLista } from "@/components/registros/solicitacoes-lista"

export default async function SolicitacoesPage() {
  const [recebidas, enviadas] = await Promise.all([getSolicitacoesRecebidas(), getSolicitacoesEnviadas()])

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Solicitações de acesso</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Pedidos de acesso a pacientes que possivelmente já foram cadastrados por outro profissional.
        </p>
      </div>

      <SolicitacoesLista recebidas={recebidas} enviadas={enviadas} />
    </div>
  )
}
