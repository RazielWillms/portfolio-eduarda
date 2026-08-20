import type { Papel, Profile } from "./types"

export type Permissao =
  | "usuarios.visualizar" | "usuarios.criar" | "usuarios.editar" | "usuarios.redefinir_senha"
  | "papeis.atribuir" | "papeis.gerenciar"
  | "agenda.visualizar_propria" | "agenda.visualizar_equipe" | "agenda.gerenciar"
  | "disponibilidade.gerenciar"
  | "frequencia.registrar_propria" | "frequencia.visualizar_equipe" | "frequencia.gerenciar"
  | "pacientes.cadastrar" | "pacientes.cadastrar_administrativo" | "pacientes.editar_cadastro" | "pacientes.visualizar_todos"
  | "acessos.solicitar" | "acessos.aprovar" | "acessos.aprovar_global"
  | "sessoes.registrar" | "sessoes.editar_proprias"
  | "clinico.visualizar" | "clinico.visualizar_todos" | "clinico.planejar" | "compartilhamento.gerenciar"
  | "habilidades.gerenciar" | "auditoria.visualizar"

const comuns: Permissao[] = ["agenda.visualizar_propria","frequencia.registrar_propria","pacientes.cadastrar","pacientes.editar_cadastro","acessos.solicitar","acessos.aprovar","sessoes.registrar","sessoes.editar_proprias","clinico.visualizar","clinico.planejar","compartilhamento.gerenciar","habilidades.gerenciar"]
const operacionais: Permissao[] = ["agenda.visualizar_equipe","agenda.gerenciar","disponibilidade.gerenciar","frequencia.visualizar_equipe","frequencia.gerenciar","pacientes.cadastrar_administrativo"]
const administrativas: Permissao[] = ["usuarios.visualizar","usuarios.criar","usuarios.editar","papeis.atribuir","auditoria.visualizar","pacientes.visualizar_todos","acessos.aprovar_global","clinico.visualizar_todos"]

export function permissoesLegadas(papel: Papel, principal=false): Permissao[] {
  const base = papel === "profissional" ? comuns : papel === "coordenacao" ? [...comuns,...operacionais] : [...comuns,...operacionais,...administrativas]
  return principal ? [...base,"usuarios.redefinir_senha","papeis.gerenciar"] : base
}

export function temPermissao(profile: Pick<Profile,"papel"|"admin_principal"|"permissoes">, permissao: Permissao) {
  return (profile.permissoes ?? permissoesLegadas(profile.papel,profile.admin_principal)).includes(permissao)
}
