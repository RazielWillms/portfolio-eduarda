import type { AcessoResponsavel } from "./types"

export type StatusAcessoResponsavel = "ativo" | "expirado" | "revogado"

export function calcularStatusAcesso(acesso: Pick<AcessoResponsavel, "ativo" | "expira_em" | "revogado_em">, agora = new Date()): StatusAcessoResponsavel {
  if (!acesso.ativo || acesso.revogado_em) return "revogado"
  if (acesso.expira_em && new Date(acesso.expira_em) <= agora) return "expirado"
  return "ativo"
}
