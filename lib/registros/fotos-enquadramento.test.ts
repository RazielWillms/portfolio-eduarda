import { describe, expect, it } from "vitest"
import fs from "node:fs"
import path from "node:path"

const raiz=process.cwd()
const migration=fs.readFileSync(path.join(raiz,"supabase/migrations/20260812490000_enquadramento_dados_profissionais.sql"),"utf8")
const actions=fs.readFileSync(path.join(raiz,"lib/registros/actions.ts"),"utf8")

describe("enquadramento e dados profissionais",()=>{
  it("persiste apenas limites seguros de enquadramento",()=>{
    expect(migration).toContain("foto_zoom between 1 and 2.5")
    expect(migration).toContain("foto_pos_x between -50 and 50")
    expect(actions).toContain('if(!Number.isFinite(zoom)||zoom<1||zoom>2.5')
  })

  it("mantém atualização protegida por identidade e vínculo",()=>{
    expect(migration).toContain("auth.uid()is null or not public.usuario_ativo()")
    expect(migration).toContain("not public.usuario_vinculado(p_paciente_id)")
    expect(migration).toContain("security definer")
  })

  it("mantém profissão separada do papel de autorização",()=>{
    expect(migration).toContain("atualizar_meus_dados_profissionais")
    expect(migration).not.toMatch(/set\s+papel\s*=/i)
    expect(migration).toContain("profiles_dados_profissionais_check")
  })
})
