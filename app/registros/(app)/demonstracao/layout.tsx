import type { ReactNode } from "react"
import { DemonstracaoShell } from "@/components/registros/demonstracao-shell"

export default function DemonstracaoLayout({ children }: { children: ReactNode }) {
  return <DemonstracaoShell>{children}</DemonstracaoShell>
}

