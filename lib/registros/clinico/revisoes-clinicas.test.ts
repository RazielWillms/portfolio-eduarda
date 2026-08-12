import { readFileSync } from "node:fs"
import { join } from "node:path"
import { describe, expect, it } from "vitest"
const sql=readFileSync(join(process.cwd(),"supabase/migrations/20260812220000_revisoes_clinicas_alvo.sql"),"utf8")
describe("revisões clínicas",()=>{
  it("calcula o snapshot no servidor e não aceita snapshot do cliente",()=>{
    expect(sql).toContain("jsonb_build_object('medicoes',v_medicoes")
    expect(sql).toContain("avg(case when i.itens_previstos>0")
    expect(sql).not.toMatch(/p_evidencias_snapshot/)
  })
  it("restringe autoria, valida período e não permite escrita direta",()=>{
    expect(sql).toContain("public.usuario_pode_editar_alvo")
    expect(sql).toContain("periodo_fim>=periodo_inicio")
    expect(sql).not.toMatch(/create policy .* for insert/)
  })
  it("não replica justificativa clínica na auditoria",()=>{
    const auditoria=sql.slice(sql.indexOf("create or replace function public.auditar_revisao_clinica"))
    expect(auditoria).not.toContain("new.justificativa")
    expect(auditoria).not.toContain("new.evidencias_snapshot")
  })
})
