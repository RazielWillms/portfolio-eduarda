import "server-only"

export function reportServerError(operation: string, error: unknown) {
  const value = error as { code?: string; message?: string }
  if (process.env.NODE_ENV === "production") console.error(`[server] ${operation} failed`, { code: value?.code ?? "unknown" })
  else console.error(`[server] ${operation} failed`, { code: value?.code ?? "unknown", message: value?.message ?? "unknown" })
}
