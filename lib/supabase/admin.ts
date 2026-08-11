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
  return createSupabaseClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}
