import { describe,expect,it } from "vitest"
import fs from "node:fs"
import path from "node:path"

const sql=fs.readFileSync(path.join(process.cwd(),"supabase/migrations/20260812500000_cpf_paciente_demo_compatibilidade.sql"),"utf8")

describe("CPF opcional do paciente",()=>{
  it("é único quando informado",()=>{expect(sql).toContain("pacientes_cpf_paciente_uidx");expect(sql).toContain("where public.normalizar_cpf(cpf_paciente) is not null")})
  it("tem prioridade na busca sem ser retornado",()=>{expect(sql).toContain("public.normalizar_cpf(p.cpf_paciente)=public.normalizar_cpf(p_cpf_paciente)");expect(sql).not.toMatch(/returns table\([^)]*cpf_paciente/i)})
  it("é removido da auditoria",()=>{expect(sql).toContain("'cpf_paciente','diagnostico'")})
})
