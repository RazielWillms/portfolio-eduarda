import{describe,expect,it}from"vitest";import{readFileSync}from"node:fs";import{join}from"node:path"
const sql=readFileSync(join(process.cwd(),"supabase/migrations/20260812550000_coordenacao_pode_atender.sql"),"utf8")
describe("coordenação também pode atender",()=>{
 it("reconhece somente papéis assistenciais ativos",()=>{expect(sql).toContain("papel in('profissional','coordenacao')and status='ativo'");expect(sql).toContain("perfil_pode_atender")})
 it("inclui coordenação nas opções de agenda e frequência",()=>{expect(sql.match(/papel in\('profissional','coordenacao'\)/g)?.length).toBeGreaterThanOrEqual(3);expect(sql).toContain("listar_opcoes_agendamento");expect(sql).toContain("opcoes_frequencia")})
 it("valida o papel no backend ao criar ou editar",()=>{expect(sql).toContain("not public.perfil_pode_atender(p_profissional_id)");expect(sql).toContain("create or replace function public.criar_agendamento");expect(sql).toContain("create or replace function public.editar_agendamento")})
 it("permite disponibilidade própria sem abrir para contas administrativas",()=>{expect(sql).toContain("create or replace function public.salvar_disponibilidade");expect(sql).toContain("auth.uid()=p_profissional_id");expect(sql).toContain("not public.perfil_pode_atender(p_profissional_id)")})
})
