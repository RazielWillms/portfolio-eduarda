import { BriefcaseMedical, ShieldAlert, Settings2 } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { getProfile, getProfissoes, getUsuariosAdminPaginados } from "@/lib/registros/queries"
import { Input } from "@/components/ui/input"
import { UsuarioForm } from "@/components/registros/usuario-form"
import { UsuariosTabela } from "@/components/registros/usuarios-tabela"
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
      <div className="flex items-start justify-between gap-4">
       <div>
        <h1 className="text-2xl font-bold text-foreground">Usuários</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Gerencie os profissionais com acesso ao sistema. Somente administradores podem criar novos usuários.
        </p>
       </div>{profile.admin_principal&&<div className="flex flex-wrap gap-2"><Button asChild variant="secondary"><Link href="/registros/usuarios/profissoes"><BriefcaseMedical className="size-4"/>Profissões</Link></Button><Button asChild><Link href="/registros/usuarios/papeis"><Settings2 className="size-4"/>Papéis e permissões</Link></Button></div>}
      </div>

      <form className="grid items-end gap-3 rounded-2xl border bg-card p-4 md:grid-cols-2 xl:grid-cols-[minmax(220px,1fr)_220px_180px_160px_auto]"><div className="space-y-2"><label className="text-sm font-medium" htmlFor="busca-usuario">Nome ou e-mail</label><Input id="busca-usuario" name="busca" defaultValue={filtros.busca??""} placeholder="Buscar usuário..."/></div><div className="space-y-2"><label className="text-sm font-medium" htmlFor="profissao-usuario">Profissão</label><select id="profissao-usuario" name="profissao" defaultValue={filtros.profissao??""} className="h-9 w-full rounded-md border border-input bg-card px-3 text-sm"><option value="">Todas</option>{profissoes.map(item=><option key={item.id} value={item.id}>{item.nome}{!item.ativo?" (inativa)":""}</option>)}</select></div><div className="space-y-2"><label className="text-sm font-medium" htmlFor="papel-usuario">Papel</label><select id="papel-usuario" name="papel" defaultValue={papel} className="h-9 w-full rounded-md border border-input bg-card px-3 text-sm"><option value="todos">Todos</option><option value="profissional">Profissional</option><option value="coordenacao">Coordenação</option><option value="admin">Administrador</option></select></div><div className="space-y-2"><label className="text-sm font-medium" htmlFor="status-usuario">Status</label><select id="status-usuario" name="status" defaultValue={status} className="h-9 w-full rounded-md border border-input bg-card px-3 text-sm"><option value="todos">Todos</option><option value="ativo">Ativo</option><option value="inativo">Inativo</option></select></div><Button>Aplicar filtros</Button></form>

      <UsuariosTabela usuarios={usuarios} profissoes={profissoes} usuarioAtualId={profile.id} podeRedefinirSenha={profile.admin_principal} />
      <div className="flex items-center justify-between"><p className="text-xs text-muted-foreground">{total} usuário(s)</p><div className="flex items-center gap-2"><Button asChild variant="secondary" size="sm" className={pagina===0?"pointer-events-none opacity-50":""}><Link href={hrefPagina(Math.max(0,pagina-1))}>Anterior</Link></Button><span className="text-sm">{pagina+1} de {paginas}</span><Button asChild variant="secondary" size="sm" className={pagina+1>=paginas?"pointer-events-none opacity-50":""}><Link href={hrefPagina(Math.min(paginas-1,pagina+1))}>Próxima</Link></Button></div></div>

      <div className="flex flex-col gap-4 max-w-xl">
        <h2 className="text-lg font-bold text-foreground">Novo usuário</h2>
        <UsuarioForm profissoes={profissoes} />
      </div>
    </div>
  )
}
