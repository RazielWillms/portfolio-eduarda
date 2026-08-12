import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

const sql = readFileSync("supabase/migrations/20260812310000_corrigir_trigger_criacao_profiles.sql", "utf8").toLowerCase()
const reconciliacaoLegada = readFileSync("supabase/migrations/20260812320000_remover_protecao_profile_legada.sql", "utf8").toLowerCase()
const criacaoExplicita = readFileSync("supabase/migrations/20260812330000_criacao_profile_explicita.sql", "utf8").toLowerCase()
const limpezaIdentidades = readFileSync("supabase/migrations/20260812340000_limpar_identidades_auth_orfas.sql", "utf8").toLowerCase()

describe("provisionamento de profiles", () => {
  it("aceita somente os papéis atuais e define profissional como padrão", () => {
    expect(sql).toContain("('admin', 'profissional')")
    expect(sql).toContain("'profissional'")
    expect(sql).not.toContain("'psicologo'")
  })

  it("reinstala um único trigger na tabela de usuários do Auth", () => {
    expect(sql).toContain("t.tgrelid = 'auth.users'::regclass")
    expect(sql).toContain("drop trigger %i on auth.users")
    expect(sql).toContain("create trigger on_auth_user_created")
  })

  it("cria o perfil com os campos obrigatórios do schema atual", () => {
    expect(sql).toContain("id, nome, email, papel, status, admin_principal")
    expect(sql).toContain("set row_security = off")
  })

  it("remove somente a proteção de autoelevação legada que interceptava inserts", () => {
    expect(reconciliacaoLegada).toContain("p.proname = 'prevent_self_privilege_escalation'")
    expect(reconciliacaoLegada).toContain("drop trigger %i on public.profiles")
    expect(reconciliacaoLegada).not.toContain("profiles_proteger_admin_principal")
  })

  it("desativa o provisionamento implícito para a aplicação criar o perfil explicitamente", () => {
    expect(criacaoExplicita).toContain("drop trigger %i on auth.users")
    expect(criacaoExplicita).not.toContain("create trigger on_auth_user_created")
  })

  it("limpa somente identidades sem usuário correspondente", () => {
    expect(limpezaIdentidades).toContain("delete from auth.identities")
    expect(limpezaIdentidades).toContain("where usuario.id = identidade.user_id")
    expect(limpezaIdentidades).toContain("where not exists")
    expect(limpezaIdentidades).not.toContain("delete from auth.users")
  })
})
