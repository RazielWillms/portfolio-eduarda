import { ShieldAlert, UserPlus } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { getProfile, getProfissoes, getUsuariosAdminPaginados } from "@/lib/registros/queries"
import { UsuariosTabela } from "@/components/registros/usuarios-tabela"
import { UsuariosFiltros } from "@/components/registros/usuarios-filtros"
import { temPermissao } from "@/lib/registros/permissoes"

export default async function UsuariosPage({searchParams}:{searchParams:Promise<{busca?:string;profissao?:string;papel?:string;status?:string;pagina?:string}>}) {
  const filtros=await searchParams
  const profile = await getProfile()

  if (!profile || !temPermissao(profile,"usuarios.visualizar")) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-border bg-card py-16 text-center">
        <ShieldAlert className="size-8 text-muted-foreground" />
        <p className="text-sm font-semibold text-foreground">Acesso restrito</p>
        <p className="text-sm text-muted-foreground max-w-sm">
          Somente administradores podem visualizar e cadastrar novos usuários.
        </p>
      </div>
    )
  }

  const limite=20,pagina=Math.max(0,(Number(filtros.pagina)||1)-1),papel=["admin","coordenacao","profissional"].includes(filtros.papel??"")?filtros.papel!:"todos",status=["ativo","inativo"].includes(filtros.status??"")?filtros.status!:"todos"
  const profissoes=await getProfissoes(true),usuarios=await getUsuariosAdminPaginados({busca:filtros.busca??"",profissaoId:filtros.profissao,papel,status,limite,offset:pagina*limite})
  if(!usuarios)return <p className="rounded-2xl border border-dashed p-8 text-sm text-muted-foreground">Aplique a migration da listagem paginada de usuários para acessar esta área.</p>
  const total=Number(usuarios[0]?.total??0),paginas=Math.max(1,Math.ceil(total/limite));function hrefPagina(indice:number){const p=new URLSearchParams();if(filtros.busca)p.set("busca",filtros.busca);if(filtros.profissao)p.set("profissao",filtros.profissao);if(papel!=="todos")p.set("papel",papel);if(status!=="todos")p.set("status",status);p.set("pagina",String(indice+1));return`/registros/usuarios?${p}`}

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-start justify-between gap-3">
       <div>
        <h1 className="text-2xl font-bold text-foreground">Usuários</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Gerencie os profissionais com acesso ao sistema. Somente administradores podem criar novos usuários.
        </p>
       </div>{temPermissao(profile,"usuarios.criar")&&<Button asChild size="icon" className="shrink-0 sm:!h-9 sm:!w-auto sm:px-4"><Link href="/registros/usuarios/novo" aria-label="Novo usuário" title="Novo usuário"><UserPlus className="size-4"/><span className="hidden sm:inline">Novo usuário</span></Link></Button>}
      </div>

      <UsuariosFiltros busca={filtros.busca??""} profissao={filtros.profissao??""} papel={papel} status={status} profissoes={profissoes} />

      <UsuariosTabela usuarios={usuarios} profissoes={profissoes} usuarioAtualId={profile.id} podeRedefinirSenha={profile.admin_principal} />
      <div className="flex items-center justify-between"><p className="text-xs text-muted-foreground">{total} usuário(s)</p><div className="flex items-center gap-2"><Button asChild variant="secondary" size="sm" className={pagina===0?"pointer-events-none opacity-50":""}><Link href={hrefPagina(Math.max(0,pagina-1))}>Anterior</Link></Button><span className="text-sm">{pagina+1} de {paginas}</span><Button asChild variant="secondary" size="sm" className={pagina+1>=paginas?"pointer-events-none opacity-50":""}><Link href={hrefPagina(Math.min(paginas-1,pagina+1))}>Próxima</Link></Button></div></div>
    </div>
  )
}
