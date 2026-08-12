import { describe, expect, it } from "vitest"
import { readFileSync } from "node:fs"
import { join } from "node:path"

const sql=readFileSync(join(process.cwd(),"supabase/migrations/20260812360000_sintese_avaliacao_inicial.sql"),"utf8")

describe("síntese da avaliação inicial",()=>{
  it("isola leitura exclusivamente por autor vinculado",()=>{
    expect(sql).toContain("profissional_id=auth.uid()")
    expect(sql).not.toContain("public.usuario_admin() or")
    expect(sql).toContain("force row level security")
  })
  it("aceita somente sessões iniciais próprias e vinculadas ao paciente",()=>{
    expect(sql).toContain("s.profissional_id=auth.uid()")
    expect(sql).toContain("s.paciente_id=p_paciente_id")
    expect(sql).toContain("'vinculo_acolhimento','entrevista_responsaveis','avaliacao_inicial','observacao_clinica','orientacao_equipe'")
  })
  it("preserva versões e exige conclusão ao finalizar",()=>{
    expect(sql).toContain("unique (paciente_id, profissional_id, versao)")
    expect(sql).toContain("p_status='concluida'")
    expect(sql).toContain("max(versao),0)+1")
  })
  it("audita somente metadados, sem conteúdo clínico",()=>{
    expect(sql).toContain("SINTESE_AVALIACAO_INSERT")
    expect(sql).not.toContain("'potencialidades',new.potencialidades")
    expect(sql).not.toContain("'conclusao',new.conclusao")
  })
})
