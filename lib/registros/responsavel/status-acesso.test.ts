import { describe, expect, it } from "vitest"
import { calcularStatusAcesso } from "./status-acesso"

const agora = new Date("2026-08-11T12:00:00Z")
describe("status do acesso externo", () => {
  it("mantém um token válido ativo", () => expect(calcularStatusAcesso({ ativo: true, expira_em: "2026-09-01T00:00:00Z", revogado_em: null }, agora)).toBe("ativo"))
  it("identifica token expirado", () => expect(calcularStatusAcesso({ ativo: true, expira_em: "2026-08-10T00:00:00Z", revogado_em: null }, agora)).toBe("expirado"))
  it("identifica token revogado", () => expect(calcularStatusAcesso({ ativo: false, expira_em: null, revogado_em: "2026-08-10T00:00:00Z" }, agora)).toBe("revogado"))
})
