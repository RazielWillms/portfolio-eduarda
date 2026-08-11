"use client"
import { AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) { return <main className="min-h-[60vh] flex items-center justify-center p-4"><div className="max-w-md rounded-2xl border bg-card p-8 text-center"><AlertTriangle className="size-8 text-muted-foreground mx-auto mb-4" /><h1 className="text-xl font-bold">Não foi possível carregar esta página</h1><p className="text-sm text-muted-foreground mt-2 mb-5">Ocorreu uma falha temporária. Nenhuma informação foi alterada.</p><Button onClick={reset}>Tentar novamente</Button></div></main> }
