import Link from "next/link"
import { Button } from "@/components/ui/button"
export default function NotFound() { return <main className="min-h-[60vh] flex items-center justify-center p-4"><div className="text-center"><h1 className="text-xl font-bold">Conteúdo indisponível</h1><p className="text-sm text-muted-foreground mt-2 mb-5">O recurso não existe ou você não possui acesso.</p><Button asChild><Link href="/registros">Voltar</Link></Button></div></main> }
