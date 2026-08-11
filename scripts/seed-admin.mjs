import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceRoleKey) {
  console.error("Faltam variáveis de ambiente do Supabase (URL ou service role key).")
  process.exit(1)
}

const admin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const ADMIN_EMAIL = "admin@keendesign.com.br"
const ADMIN_PASSWORD = "TrocarSenha123!"
const ADMIN_NOME = "Administrador"

const PSICOLOGO_EMAIL = "psicologa@keendesign.com.br"
const PSICOLOGO_PASSWORD = "TrocarSenha123!"
const PSICOLOGO_NOME = "Dra. Ana Beatriz"

async function ensureUser({ email, password, nome, papel }) {
  const { data: existing, error: listError } = await admin.auth.admin.listUsers()
  if (listError) throw listError

  const found = existing.users.find((u) => u.email === email)
  if (found) {
    console.log(`Usuário já existe: ${email} (${found.id})`)
    return found.id
  }

  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { nome },
    app_metadata: { papel, status: "ativo" },
  })

  if (error) throw error

  console.log(`Usuário criado: ${email} (${data.user.id})`)
  return data.user.id
}

async function main() {
  const adminId = await ensureUser({
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD,
    nome: ADMIN_NOME,
    papel: "admin",
  })

  const psicologoId = await ensureUser({
    email: PSICOLOGO_EMAIL,
    password: PSICOLOGO_PASSWORD,
    nome: PSICOLOGO_NOME,
    papel: "psicologo",
  })

  console.log("\nSeed concluído.")
  console.log(`Admin: ${ADMIN_EMAIL} / ${ADMIN_PASSWORD} (id ${adminId})`)
  console.log(`Psicólogo: ${PSICOLOGO_EMAIL} / ${PSICOLOGO_PASSWORD} (id ${psicologoId})`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
