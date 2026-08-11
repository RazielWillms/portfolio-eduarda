import "server-only"
import { createClient as createSupabaseClient } from "@supabase/supabase-js"

/**
 * Admin client using the Service Role Key. Bypasses RLS entirely.
 *
 * SERVER-ONLY. Never import this from a Client Component or expose the
 * service role key to the browser. Used exclusively for privileged
 * operations that regular authenticated users cannot perform themselves,
 * such as an admin creating a new professional's account.
 */
export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const adminKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !adminKey) return null

  return createSupabaseClient(supabaseUrl, adminKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}
