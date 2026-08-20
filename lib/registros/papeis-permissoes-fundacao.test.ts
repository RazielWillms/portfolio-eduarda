import { describe, expect, it } from "vitest"
import { readFileSync } from "node:fs"
import { join } from "node:path"

const sql = readFileSync(join(process.cwd(), "supabase/migrations/20260812640000_fundacao_papeis_permissoes.sql"), "utf8")

describe("fundação de papéis configuráveis", () => {
  it("mantém a relação nova separada do papel legado", () => {
    expect(sql).toContain("create table if not exists public.perfil_papel_acesso")
    expect(sql).not.toMatch(/alter table public\.profiles[\s\S]*papel_acesso_id/i)
    expect(sql).not.toMatch(/update public\.profiles\s+set papel=/i)
  })

  it("restringe a administração ao principal e não abre escrita no catálogo", () => {
    expect(sql).toContain("papeis_acesso_principal_all")
    expect(sql).toContain("public.usuario_admin_principal()")
    expect(sql).not.toMatch(/create policy permissoes_sistema_.*(insert|update|delete|all)/i)
    expect(sql).toContain("drop policy if exists permissoes_sistema_principal_select")
    expect(sql).toContain("drop policy if exists perfil_papel_acesso_principal_all")
  })

  it("mantém permissões como catálogo controlado", () => {
    expect(sql).toContain("permissoes_sistema_chave_check")
    expect(sql).toContain("on conflict (chave) do update")
    expect(sql).toContain("papeis.gerenciar")
  })

  it("centraliza consulta e audita as alterações", () => {
    expect(sql).toContain("function public.usuario_tem_permissao")
    expect(sql).toContain("function public.minhas_permissoes")
    expect(sql).toContain("function public.auditar_configuracao_papel")
    expect(sql).toContain("perfil_papel_acesso_auditoria")
    expect(sql).toContain("p_usuario_id<>auth.uid() and not public.usuario_admin_principal()")
    expect(sql).toContain("v_anterior->>'papel_id'")
  })
})
