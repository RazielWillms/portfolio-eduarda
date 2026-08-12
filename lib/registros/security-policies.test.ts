import { readFileSync } from "node:fs"
import { join } from "node:path"
import { describe, expect, it } from "vitest"

const auditoriaSql = readFileSync(join(process.cwd(), "supabase/migrations/20260812010000_etapa_6_seguranca_auditoria.sql"), "utf8")
const sessoesSql = readFileSync(join(process.cwd(), "supabase/migrations/20260812150000_sessoes_clinicas_estruturadas.sql"), "utf8")
const remocaoLegadoSql = readFileSync(join(process.cwd(), "supabase/migrations/20260812260000_remover_atendimentos_legados.sql"), "utf8")
const demonstracaoSql = readFileSync(join(process.cwd(), "supabase/migrations/20260812280000_modo_demonstracao_leitura.sql"), "utf8")
const descobertaDemonstracaoSql = readFileSync(join(process.cwd(), "supabase/migrations/20260812300000_corrigir_descoberta_demonstracao.sql"), "utf8")

describe("contratos de autorização do banco", () => {
  it("isola sessões por autor e não permite escrita clínica direta", () => {
    expect(sessoesSql).toContain("profissional_id=auth.uid()")
    expect(sessoesSql).toContain("create policy sessoes_clinicas_select")
    expect(sessoesSql).not.toMatch(/create policy sessoes_clinicas_(insert|update|delete)/)
    expect(remocaoLegadoSql).toContain("drop table public.atendimentos")
  })

  it("não concede mutação direta dos logs", () => {
    expect(auditoriaSql).toContain("alter table public.audit_logs force row level security")
    expect(auditoriaSql).toContain("create policy audit_logs_admin_select")
    expect(auditoriaSql).not.toMatch(/create policy audit_logs_(insert|update|delete)/)
  })

  it("remove observações e dados pessoais da auditoria", () => {
    expect(auditoriaSql).toContain("p_dados - array['observacoes']")
    expect(auditoriaSql).toContain("'cpf_responsavel'")
  })

  it("restringe o catálogo global a administradores", () => {
    expect(auditoriaSql).toContain("create policy habilidades_update")
    expect(auditoriaSql).toContain("using (public.usuario_admin())")
  })

  it("expõe a demonstração sem impersonação ou operação de escrita", () => {
    expect(demonstracaoSql).toContain("create or replace function public.obter_cenario_demonstracao()")
    expect(demonstracaoSql).toContain("auth.uid() is null or not public.usuario_ativo()")
    expect(demonstracaoSql).toContain("grant execute on function public.obter_cenario_demonstracao() to authenticated")
    expect(demonstracaoSql).not.toMatch(/\b(insert|update|delete)\s+(into|public\.)/i)
    expect(descobertaDemonstracaoSql).toContain("where p.criado_por=v_demo_id")
    expect(descobertaDemonstracaoSql).not.toContain("p.nome_completo like")
  })
})
