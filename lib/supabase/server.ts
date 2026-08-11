import { createServerClient } from "@supabase/ssr"
import { cookies, headers } from "next/headers"

/**
 * Especially important if using Fluid compute: Don't put this client in a
 * global variable. Always create a new client within each function when using
 * it.
 */
export async function createClient() {
  const cookieStore = await cookies()
  const headerStore = await headers()
  const forwardedProtocol = headerStore.get("x-forwarded-proto")?.split(",")[0]?.trim()
  const origin = headerStore.get("origin")
  const secureCookies = forwardedProtocol
    ? forwardedProtocol === "https"
    : origin?.startsWith("https://") ?? false

  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    // O cookie precisa acompanhar o protocolo real. NODE_ENV=production também
    // é usado pelo `next start` local, onde cookies Secure seriam descartados.
    cookieOptions: { secure: secureCookies },
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
        } catch {
          // The "setAll" method was called from a Server Component.
          // This can be ignored if you have middleware refreshing
          // user sessions.
        }
      },
    },
  })
}
