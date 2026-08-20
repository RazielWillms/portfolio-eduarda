import { describe, expect, it } from "vitest"
import { readFileSync } from "node:fs"
import { join } from "node:path"

const sql = readFileSync(join(process.cwd(), "supabase/migrations/20260812650000_migrar_papeis_atuais.sql"), "utf8")

describe("migração compatível dos papéis atuais", () => {
  it("cria equivalentes para os três papéis legados", () => {
    expect(sql).toContain("('Administrador','administrador'")
    expect(sql).toContain("('Coordenação','coordenacao'")
    expect(sql).toContain("('Profissional','profissional'")
  })

  it("não substitui nem reescreve o campo legado", () => {
    expect(sql).toContain("profiles.papel continua soberano")
    expect(sql).not.toMatch(/update\s+public\.profiles\s+set\s+papel/i)
    expect(sql).not.toMatch(/alter\s+table\s+public\.profiles[\s\S]*drop\s+column\s+papel/i)
  })

  it("mantém capacidades exclusivas fora do administrador comum", () => {
    const matrizAdmin = sql.slice(sql.indexOf("('administrador','usuarios.visualizar')"), sql.indexOf("-- Coordenação"))
    expect(matrizAdmin).not.toContain("papeis.gerenciar")
    expect(matrizAdmin).not.toContain("usuarios.redefinir_senha")
  })

  it("sincroniza perfis existentes e futuros", () => {
    expect(sql).toContain("function public.sincronizar_papel_legado_configuravel")
    expect(sql).toContain("profiles_sincronizar_papel_configuravel")
    expect(sql).toContain("insert into public.perfil_papel_acesso(profile_id,papel_id,atribuido_por)")
  })

  it("protege os papéis de compatibilidade", () => {
    expect(sql).toContain("function public.proteger_papel_sistema")
    expect(sql).toContain("system_role_is_protected")
    expect(sql).toContain("papeis_acesso_proteger_sistema")
  })
})
