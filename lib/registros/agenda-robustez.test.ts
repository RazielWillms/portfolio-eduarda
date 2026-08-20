import{describe,expect,it}from"vitest";import{readFileSync}from"node:fs";import{join}from"node:path"
const sql=readFileSync(join(process.cwd(),"supabase/migrations/20260812530000_robustez_operacional_agenda.sql"),"utf8")
describe("robustez operacional da agenda",()=>{
 it("exige justificativa e controle de concorrência para editar ou cancelar",()=>{expect(sql).toContain("length(trim(coalesce(p_motivo,'')))<5");expect(sql.match(/stale_schedule/g)?.length).toBeGreaterThanOrEqual(2);expect(sql).toContain("AGENDAMENTO_CANCELADO");expect(sql).toContain("AGENDAMENTO_EDITADO")})
 it("restringe transições do profissional",()=>{expect(sql).toContain("a.profissional_id<>auth.uid()");expect(sql).toContain("a.status='agendado'and p_status in('confirmado','falta')");expect(sql).toContain("invalid_transition")})
 it("torna sessão e conclusão do compromisso atômicas",()=>{expect(sql).toContain("registrar_sessao_clinica_v7");expect(sql).toContain("for update");expect(sql).toContain("unauthorized_or_duplicate_session");expect(sql).toContain("agendamentos_sessao_unica_uidx");expect(sql).toContain("revoke execute on function public.vincular_sessao_agendamento")})
 it("expõe a pendência de vínculo para a coordenação",()=>{expect(sql).toContain("profissionais_vinculados");expect(sql).toContain("paciente_psicologos")})
})
