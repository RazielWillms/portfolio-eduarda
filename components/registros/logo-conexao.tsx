import { cn } from "@/lib/utils"

export function LogoConexao({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" role="img" aria-label="Conexão ABA" className={cn("size-10 shrink-0", className)}>
      <circle cx="25" cy="25" r="16" fill="none" className="stroke-primary" strokeWidth="8" strokeLinecap="round" strokeDasharray="78 23" transform="rotate(35 25 25)" />
      <circle cx="39" cy="39" r="16" fill="none" className="stroke-teal-400" strokeWidth="8" strokeLinecap="round" strokeDasharray="78 23" transform="rotate(215 39 39)" />
    </svg>
  )
}

export function MarcaConexao({ compacta = false }: { compacta?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <LogoConexao className={compacta ? "size-8" : "size-11"} />
      {!compacta && <div className="leading-tight"><p className="text-sm font-bold text-foreground">Conexão ABA</p><p className="text-xs text-muted-foreground">Gestão clínica integrada</p></div>}
    </div>
  )
}
