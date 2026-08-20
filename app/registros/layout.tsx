import type { Metadata } from "next"
import type { ReactNode } from "react"

export const metadata: Metadata = {
  title: { default: "Conexão ABA", template: "%s | Conexão ABA" },
  description: "Gestão clínica integrada para acompanhamento ABA.",
}

export default function RegistrosRootLayout({ children }: { children: ReactNode }) {
  return children
}
