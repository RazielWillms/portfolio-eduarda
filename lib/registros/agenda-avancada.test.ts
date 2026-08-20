import{describe,expect,it}from"vitest";import{readFileSync}from"node:fs";import{join}from"node:path"
const sql=readFileSync(join(process.cwd(),"supabase/migrations/20260812520000_agenda_avancada.sql"),"utf8")
describe("agenda avançada",()=>{
 it("serializa a verificação e bloqueia conflitos de profissional e paciente",()=>{expect(sql.match(/pg_advisory_xact_lock/g)?.length).toBeGreaterThanOrEqual(4);expect(sql).toContain("professional_conflict_or_unavailable");expect(sql).toContain("patient_conflict")})
 it("valida disponibilidade no backend",()=>{expect(sql).toContain("create or replace function public.horario_disponivel");expect(sql).toContain("America/Sao_Paulo");expect(sql).toContain("not public.horario_disponivel")})
 it("preserva histórico ao reagendar",()=>{expect(sql).toContain("agendamentos_historico");expect(sql).toContain("inicio_anterior");expect(sql).toContain("AGENDAMENTO_REAGENDADO");expect(sql).toContain("length(trim(coalesce(p_motivo,'')))<5")})
 it("mantém escrita em disponibilidade e histórico somente por RPC",()=>{expect(sql).not.toMatch(/create policy (disponibilidades|agendamentos_historico)_(insert|update|delete)/);expect(sql).toContain("auth.uid()=p_profissional_id")})
})
