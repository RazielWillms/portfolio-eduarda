import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY
const users = [
  { email: process.env.SEED_ADMIN_EMAIL, password: process.env.SEED_ADMIN_PASSWORD, nome: process.env.SEED_ADMIN_NAME || "Administrador", papel: "admin" },
  { email: process.env.SEED_PROFESSIONAL_EMAIL, password: process.env.SEED_PROFESSIONAL_PASSWORD, nome: process.env.SEED_PROFESSIONAL_NAME || "Profissional", papel: "profissional" },
]
if (!supabaseUrl || !serviceRoleKey || users.some((u) => !u.email || !u.password)) {
  console.error("Configure as variáveis do Supabase e todas as variáveis SEED_* obrigatórias.")
  process.exit(1)
}
const admin = createClient(supabaseUrl, serviceRoleKey, { auth: { autoRefreshToken: false, persistSession: false } })
async function ensureUser(user) {
  const { data: existing, error: listError } = await admin.auth.admin.listUsers()
  if (listError) throw new Error(`Falha ao consultar usuários (${listError.code || "unknown"}).`)
  if (existing.users.some((u) => u.email === user.email)) { console.log(`Conta ${user.papel} já configurada.`); return }
  const { error } = await admin.auth.admin.createUser({ email: user.email, password: user.password, email_confirm: true, user_metadata: { nome: user.nome }, app_metadata: { papel: user.papel, status: "ativo" } })
  if (error) throw new Error(`Falha ao criar conta ${user.papel} (${error.code || "unknown"}).`)
  console.log(`Conta ${user.papel} criada.`)
}
Promise.all(users.map(ensureUser)).then(() => console.log("Seed concluído sem exibir credenciais.")).catch((error) => { console.error(error.message); process.exit(1) })
