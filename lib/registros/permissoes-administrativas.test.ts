import{describe,expect,it}from"vitest";import{readFileSync}from"node:fs";import{join}from"node:path"
const sql=readFileSync(join(process.cwd(),"supabase/migrations/20260812660000_permissoes_modulos_administrativos.sql"),"utf8")
describe("permissões administrativas granulares",()=>{
 it("separa leitura e gestão da agenda",()=>{expect(sql).toContain("agenda.visualizar_equipe");expect(sql).toContain("agenda.gerenciar");expect(sql).toContain("disponibilidade.gerenciar")})
 it("separa frequência de agenda",()=>{expect(sql).toContain("frequencia.visualizar_equipe");expect(sql).toContain("frequencia.gerenciar")})
 it("protege usuários por capacidade",()=>{expect(sql).toContain("'public.usuario_admin()'");expect(sql).toContain("usuarios.editar")})
 it("atualiza RLS e remove a função transitória",()=>{expect(sql).toContain("drop policy if exists agendamentos_select");expect(sql).toContain("drop policy if exists ocorrencias_frequencia_select");expect(sql).toContain("drop function public.substituir_guarda_funcoes")})
})
