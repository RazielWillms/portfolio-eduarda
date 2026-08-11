"use client"

import { useState } from "react"
import Link from "next/link"
import { Check, X, Clock } from "lucide-react"
import { aprovarSolicitacaoAcesso, negarSolicitacaoAcesso } from "@/lib/registros/actions"
import type { SolicitacaoAcessoComRelacoes } from "@/lib/registros/types"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

function statusBadge(status: SolicitacaoAcessoComRelacoes["status"]) {
  switch (status) {
    case "pendente":
      return <Badge variant="outline">Pendente</Badge>
    case "aprovado":
      return <Badge>Aprovada</Badge>
    case "negado":
      return <Badge variant="destructive">Negada</Badge>
  }
}

function SolicitacaoCard({
  solicitacao,
  acoes,
}: {
  solicitacao: SolicitacaoAcessoComRelacoes
  acoes?: React.ReactNode
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <Link
            href={solicitacao.paciente ? `/registros/pacientes/${solicitacao.paciente.id}` : "/registros/solicitacoes"}
            className="font-semibold text-foreground hover:text-primary"
          >
            {solicitacao.paciente?.nome_completo ?? "Paciente protegido"}
          </Link>
          <p className="text-xs text-muted-foreground mt-0.5">
            Solicitado por {solicitacao.solicitante.nome} · {new Date(solicitacao.created_at).toLocaleDateString("pt-BR")}
          </p>
        </div>
        {statusBadge(solicitacao.status)}
      </div>

      {solicitacao.mensagem && (
        <p className="text-sm text-muted-foreground rounded-lg bg-muted px-3 py-2">{solicitacao.mensagem}</p>
      )}

      {acoes}
    </div>
  )
}

export function SolicitacoesLista({
  recebidas,
  enviadas,
}: {
  recebidas: SolicitacaoAcessoComRelacoes[]
  enviadas: SolicitacaoAcessoComRelacoes[]
}) {
  const [processandoId, setProcessandoId] = useState<string | null>(null)
  const [itensRecebidos, setItensRecebidos] = useState(recebidas)

  async function handleAprovar(id: string) {
    setProcessandoId(id)
    const resultado = await aprovarSolicitacaoAcesso(id)
    setProcessandoId(null)
    if (!(resultado && "error" in resultado)) {
      setItensRecebidos((prev) => prev.filter((s) => s.id !== id))
    }
  }

  async function handleNegar(id: string) {
    setProcessandoId(id)
    const resultado = await negarSolicitacaoAcesso(id)
    setProcessandoId(null)
    if (!(resultado && "error" in resultado)) {
      setItensRecebidos((prev) => prev.filter((s) => s.id !== id))
    }
  }

  return (
    <Tabs defaultValue="recebidas" className="flex flex-col gap-5">
      <TabsList className="w-fit">
        <TabsTrigger value="recebidas" className="gap-1.5">
          Recebidas
          {itensRecebidos.length > 0 && (
            <Badge variant="secondary" className="ml-1 px-1.5">
              {itensRecebidos.length}
            </Badge>
          )}
        </TabsTrigger>
        <TabsTrigger value="enviadas">Enviadas</TabsTrigger>
      </TabsList>

      <TabsContent value="recebidas" className="flex flex-col gap-3">
        {itensRecebidos.length === 0 && (
          <div className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground flex flex-col items-center gap-2">
            <Clock className="size-5" />
            Nenhuma solicitação pendente para você.
          </div>
        )}
        {itensRecebidos.map((s) => (
          <SolicitacaoCard
            key={s.id}
            solicitacao={s}
            acoes={
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  className="gap-1.5"
                  disabled={processandoId === s.id}
                  onClick={() => handleAprovar(s.id)}
                >
                  <Check className="size-3.5" />
                  Aprovar acesso
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1.5"
                  disabled={processandoId === s.id}
                  onClick={() => handleNegar(s.id)}
                >
                  <X className="size-3.5" />
                  Negar
                </Button>
              </div>
            }
          />
        ))}
      </TabsContent>

      <TabsContent value="enviadas" className="flex flex-col gap-3">
        {enviadas.length === 0 && (
          <div className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
            Você ainda não solicitou acesso a nenhum paciente.
          </div>
        )}
        {enviadas.map((s) => (
          <SolicitacaoCard key={s.id} solicitacao={s} />
        ))}
      </TabsContent>
    </Tabs>
  )
}
