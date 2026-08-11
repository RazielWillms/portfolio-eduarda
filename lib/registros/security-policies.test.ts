import { readFileSync } from "node:fs"
import { join } from "node:path"
import { describe, expect, it } from "vitest"

const sql = readFileSync(join(process.cwd(), "supabase/migrations/20260812010000_etapa_6_seguranca_auditoria.sql"), "utf8")
describe("contratos de autorização do banco", () => {
  it("mantém edição de atendimento restrita ao autor ativo", () => {
    expect(sql).toContain("psicologo_id = auth.uid()")
    expect(sql).toContain("create policy atendimentos_update")
    expect(sql).toContain("immutable_attendance_fields")
  })
  it("não concede mutação direta dos logs", () => {
    expect(sql).toContain("alter table public.audit_logs force row level security")
    expect(sql).toContain("create policy audit_logs_admin_select")
    expect(sql).not.toMatch(/create policy audit_logs_(insert|update|delete)/)
  })
  it("remove observações e dados pessoais da auditoria", () => {
    expect(sql).toContain("p_dados - array['observacoes']")
    expect(sql).toContain("'cpf_responsavel'")
  })
  it("restringe o catálogo global a administradores", () => {
    expect(sql).toContain("create policy habilidades_update")
    expect(sql).toContain("using (public.usuario_admin())")
  })
})
