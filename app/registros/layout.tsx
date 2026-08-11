import type { ReactNode } from "react"
import { AuthProvider } from "@/lib/registros/auth-context"
import { DataProvider } from "@/lib/registros/data-context"
import { RegistrosGate } from "@/components/registros/registros-gate"

export default function RegistrosLayout({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <DataProvider>
        <RegistrosGate>{children}</RegistrosGate>
      </DataProvider>
    </AuthProvider>
  )
}
