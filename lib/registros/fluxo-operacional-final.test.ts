import{describe,expect,it}from"vitest";import{readFileSync}from"node:fs";import{join}from"node:path"
const ler=(arquivo:string)=>readFileSync(join(process.cwd(),arquivo),"utf8")
describe("fluxo operacional final",()=>{
 it("mantém agenda e recursos clínicos acessíveis para a coordenação híbrida",()=>{const sidebar=ler("components/registros/sidebar.tsx");expect(sidebar).toContain('{ href: "/registros/agenda", label: "Agenda"');expect(sidebar).toContain("...linksClinicos")})
 it("leva o compromisso autorizado até uma sessão atômica",()=>{const agenda=ler("components/registros/agenda-operacional.tsx"),acao=ler("lib/registros/actions.ts");expect(agenda).toContain("/registros/sessoes/nova?paciente=");expect(agenda).toContain("agendamento=");expect(acao).toContain('rpc("registrar_sessao_clinica_v8"');expect(acao).toContain("p_agendamento_id: input.agendamentoId ?? null")})
 it("explica aceite, disponibilidade, duplicidade e histórico no guia",()=>{const guia=ler("components/registros/guia-conteudo.tsx");for(const termo of["Aceitar paciente","disponibilidade semanal","evitando registro duplicado","histórico anterior"])expect(guia).toContain(termo)})
})
