import{describe,expect,it}from"vitest";import{readFileSync}from"node:fs";import{join}from"node:path"
const sql=readFileSync(join(process.cwd(),"supabase/migrations/20260812870000_sequencias_faltas_nao_justificadas.sql"),"utf8")
describe("sequências de faltas não justificadas",()=>{
 it("registra continuidade e referência rastreável",()=>{expect(sql).toContain("continuidade_falta text");expect(sql).toContain("ocorrencia_anterior_id uuid references");expect(sql).toContain("sequencia_quantidade integer")})
 it("prepara ocorrências antigas sem presumir que eram consecutivas",()=>{expect(sql).toContain("set continuidade_falta='inicio_sequencia',sequencia_quantidade=1");expect(sql).toContain("where tipo='falta_nao_justificada'and continuidade_falta is null")})
 it("serializa lançamentos e rejeita histórico desatualizado",()=>{expect(sql).toContain("pg_advisory_xact_lock");expect(sql).toContain("stale_previous_occurrence")})
 it("pode ser reaplicada após uma execução parcial",()=>{expect(sql).toContain("create or replace function public.registrar_ocorrencia_frequencia")})
 it("não transforma incerteza em alerta confirmado",()=>{expect(sql).toContain("'nao_confirmada' and sequencia_quantidade is null");expect(sql).toContain("o.sequencia_quantidade>=3")})
 it("invalida sequência dependente ao excluir a anterior",()=>{expect(sql).toContain("where ocorrencia_anterior_id=o.id");expect(sql).toContain("continuidade_falta='nao_confirmada',sequencia_quantidade=null")})
})
