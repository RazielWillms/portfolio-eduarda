"use client"

import Link from "next/link"
import { Users, Sparkles, ClipboardList, ArrowRight, BarChart3 } from "lucide-react"
import { useAuth } from "@/lib/registros/auth-context"
import { useRegistrosData } from "@/lib/registros/data-context"
import { nivelPorCodigo } from "@/lib/registros/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export default function DashboardPage() {
  const { user } = useAuth()
  const { pacientesDoUsuario, atendimentosDoUsuario, habilidades } = useRegistrosData()

  if (!user) return null

  const pacientes = pacientesDoUsuario(user.id)
  const atendimentos = atendimentosDoUsuario(user.id)
  const habilidadesAtivas = habilidades.filter((h) => h.status === "ativa")

  const ultimosAtendimentos = atendimentos.slice(0, 5)

  const contagemPorHabilidade = new Map<string, number>()
  for (const a of atendimentos) {
    contagemPorHabilidade.set(a.habilidadeId, (contagemPorHabilidade.get(a.habilidadeId) ?? 0) + 1)
  }
  const rankingHabilidades = [...contagemPorHabilidade.entries()]
    .map(([habilidadeId, total]) => ({
      habilidade: habilidades.find((h) => h.id === habilidadeId),
      total,
    }))
    .filter((item) => item.habilidade)
    .sort((a, b) => b.total - a.total)
    .slice(0, 5)

  const maiorContagem = rankingHabilidades[0]?.total ?? 1

  const cards = [
    { label: "Pacientes", valor: pacientes.length, icon: Users, href: "/registros/pacientes" },
    { label: "Habilidades cadastradas", valor: habilidadesAtivas.length, icon: Sparkles, href: "/registros/habilidades" },
    { label: "Atendimentos registrados", valor: atendimentos.length, icon: ClipboardList, href: "/registros/atendimentos" },
  ]

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Painel</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Resumo dos seus registros. Um painel visual com gráficos de evolução chega em uma próxima etapa.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {cards.map((card) => {
          const Icon = card.icon
          return (
            <Link key={card.label} href={card.href}>
              <Card className="hover:border-primary/40 transition-colors">
                <CardContent className="flex items-center gap-4">
                  <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <Icon className="size-5" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground leading-none">{card.valor}</p>
                    <p className="text-sm text-muted-foreground mt-1">{card.label}</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <ClipboardList className="size-4 text-primary" />
              Últimos atendimentos
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {ultimosAtendimentos.length === 0 && (
              <p className="text-sm text-muted-foreground">Nenhum atendimento registrado ainda.</p>
            )}
            {ultimosAtendimentos.map((a) => {
              const paciente = pacientes.find((p) => p.id === a.pacienteId)
              const habilidade = habilidades.find((h) => h.id === a.habilidadeId)
              const nivel = nivelPorCodigo(a.nota)
              return (
                <div key={a.id} className="flex items-center justify-between gap-3 rounded-xl border border-border p-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">
                      {paciente?.nomeCompleto ?? "Paciente"}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {habilidade?.nome} · {new Date(a.data).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                  <Badge variant="secondary" className="shrink-0">
                    {nivel?.codigo ?? a.nota}
                  </Badge>
                </div>
              )
            })}
            <Link
              href="/registros/atendimentos"
              className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline mt-1"
            >
              Ver todos os atendimentos
              <ArrowRight className="size-3.5" />
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <BarChart3 className="size-4 text-primary" />
              Habilidades com mais registros
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {rankingHabilidades.length === 0 && (
              <p className="text-sm text-muted-foreground">Registre atendimentos para ver este ranking.</p>
            )}
            {rankingHabilidades.map((item) => (
              <div key={item.habilidade!.id} className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-semibold text-foreground">{item.habilidade!.nome}</span>
                  <span className="text-muted-foreground">{item.total}</span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{ width: `${(item.total / maiorContagem) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
