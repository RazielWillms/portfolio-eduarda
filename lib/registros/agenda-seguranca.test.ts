import{describe,expect,it}from"vitest";import{readFileSync}from"node:fs";import{join}from"node:path"
const sql=readFileSync(join(process.cwd(),"supabase/migrations/20260812510000_agenda_coordenacao.sql"),"utf8")
describe("agenda e coordenação",()=>{
 it("não concede vínculo ao criar agendamento",()=>{const criar=sql.slice(sql.indexOf("create or replace function public.criar_agendamento"),sql.indexOf("create or replace function public.atualizar_status_agendamento"));expect(criar).not.toContain("paciente_psicologos")})
 it("exige aceite do profissional atribuído para criar vínculo",()=>{expect(sql).toContain("a.profissional_id<>auth.uid()");expect(sql).toContain("ATRIBUICAO_AGENDAMENTO_ACEITA");expect(sql).toContain("on conflict do nothing")})
 it("não permite escrita direta e limita leitura",()=>{expect(sql).toContain("alter table public.agendamentos enable row level security");expect(sql).toContain("public.usuario_coordenacao() or profissional_id=auth.uid()");expect(sql).not.toMatch(/create policy agendamentos_(insert|update|delete)/)})
 it("vincula sessão somente por autoria e mesmo paciente",()=>{expect(sql).toContain("s.profissional_id<>auth.uid()");expect(sql).toContain("a.paciente_id<>s.paciente_id")})
})
