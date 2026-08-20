import{describe,expect,it}from"vitest";import{readFileSync}from"node:fs";import{join}from"node:path"
const sql=readFileSync(join(process.cwd(),"supabase/migrations/20260812540000_controle_frequencia.sql"),"utf8")
describe("controle administrativo de frequência",()=>{
 it("separa frequência do prontuário e bloqueia escrita direta",()=>{expect(sql).toContain("create table if not exists public.ocorrencias_frequencia");expect(sql).toContain("force row level security");expect(sql).not.toMatch(/create policy ocorrencias_frequencia_(insert|update|delete)/);expect(sql).toContain("revoke all on table public.ocorrencias_frequencia")})
 it("limita profissionais aos próprios registros e pacientes vinculados",()=>{expect(sql).toContain("profissional_id=auth.uid()");expect(sql).toContain("p_profissional_id=auth.uid()and public.usuario_vinculado(p_paciente_id)");expect(sql).toContain("if not public.usuario_coordenacao()then p_profissional_id:=auth.uid()")})
 it("valida e audita criação e correção",()=>{expect(sql).toContain("invalid_occurrence");expect(sql).toContain("OCORRENCIA_FREQUENCIA_CRIADA");expect(sql).toContain("OCORRENCIA_FREQUENCIA_CANCELADA");expect(sql).toContain("motivo_cancelamento")})
 it("integra a agenda opcionalmente e evita vínculo duplicado",()=>{expect(sql).toContain("ocorrencias_frequencia_agendamento_uidx");expect(sql).toContain("agendamento_status_anterior");expect(sql).toContain("status='falta'");expect(sql).toContain("duplicate_schedule_occurrence")})
 it("não retorna conteúdo clínico nos relatórios",()=>{const relatorio=sql.slice(sql.indexOf("create or replace function public.relatorio_frequencia"));expect(relatorio).not.toContain("observacoes_privadas");expect(relatorio).not.toContain("diagnostico")})
})
