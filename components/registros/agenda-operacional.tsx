"use client";
import { Fragment, useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Clock } from "lucide-react";
import { aceitarAtribuicaoAgendamento, atualizarStatusAgendamento, cancelarAgendamento, editarAgendamento, reagendarAgendamento, registrarOcorrenciaFrequencia, cancelarOcorrenciaFrequencia } from "@/lib/registros/actions";
import type { Agendamento, OpcoesAgenda, Papel, Profissao, TipoOcorrenciaFrequencia } from "@/lib/registros/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { SeletorBuscaOperacional } from "@/components/registros/seletor-busca-operacional";
import { AgendaCabecalho } from "@/components/registros/agenda-cabecalho";
const statusLabel = { agendado: "Agendado", confirmado: "Confirmado", realizado: "Realizado", cancelado: "Cancelado", falta: "Falta", reagendado: "Reagendado" };
const finalidades: Record<string, string> = { vinculo_acolhimento: "Vínculo e acolhimento", entrevista_responsaveis: "Entrevista", avaliacao_inicial: "Avaliação", observacao_clinica: "Observação", linha_de_base: "Linha de base", intervencao: "Intervenção", generalizacao: "Generalização", manutencao: "Manutenção", orientacao_equipe: "Orientação" };
type Acao = {
    tipo: "editar" | "reagendar" | "cancelar" | "falta" | "desfazer_falta";
    item: Agendamento;
} | null;
function dataLocalIso(valor: Date | string) { const d = new Date(valor); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; }
function podeRegistrarFalta(inicio: string) { return dataLocalIso(inicio) <= dataLocalIso(new Date()); }
const TOLERANCIA_INICIO_SESSAO_MS = 10 * 60 * 1000;
function podeRegistrarSessao(inicio: string) { return new Date(inicio).getTime() - TOLERANCIA_INICIO_SESSAO_MS <= Date.now(); }
export function AgendaOperacional({ agendamentos, opcoes, profissoes, papel, usuarioId, referencia, visao, destaqueId }: {
    agendamentos: Agendamento[];
    opcoes: OpcoesAgenda | null;
    profissoes: Profissao[];
    papel: Papel;
    usuarioId: string;
    referencia: string;
    visao: "dia" | "semana";
    destaqueId?: string;
}) {
    const router = useRouter(), podeGerir = papel !== "profissional", [profissionalFiltro, setProfissionalFiltro] = useState("todos"), [profissionalFiltroNome, setProfissionalFiltroNome] = useState(""), [statusFiltro, setStatusFiltro] = useState(destaqueId ? "todos" : "proximos"), [acao, setAcao] = useState<Acao>(null), [erro, setErro] = useState(""), [salvando, setSalvando] = useState(false);
    const filtrados = useMemo(() => agendamentos.filter(a => destaqueId ? a.id === destaqueId : (profissionalFiltro === "todos" || a.profissional_id === profissionalFiltro) && (statusFiltro === "todos" || (statusFiltro === "proximos" ? ["agendado", "confirmado"].includes(a.status) : a.status === statusFiltro))), [agendamentos, profissionalFiltro, statusFiltro, destaqueId]), dataReferencia = new Date(`${referencia}T12:00:00`), inicioSemana = new Date(dataReferencia), fimSemana = new Date(dataReferencia);
    inicioSemana.setDate(inicioSemana.getDate() - inicioSemana.getDay());
    fimSemana.setDate(inicioSemana.getDate() + 6);
    const periodo = visao === "semana" ? `${inicioSemana.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })} até ${fimSemana.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" })}` : dataReferencia.toLocaleDateString("pt-BR", { dateStyle: "long" });
    useEffect(() => { if (destaqueId)
        document.getElementById(`compromisso-${destaqueId}`)?.scrollIntoView({ behavior: "smooth", block: "center" }); }, [destaqueId]);
    async function mudar(id: string) { const r = await atualizarStatusAgendamento(id, "confirmado"); if ("error" in r)
        setErro(r.error);
    else
        router.refresh(); }
    async function aceitar(id: string) { const r = await aceitarAtribuicaoAgendamento(id); if ("error" in r)
        setErro(r.error);
    else
        router.refresh(); }
    async function enviar(e: FormEvent<HTMLFormElement>) { e.preventDefault(); if (!acao)
        return; setSalvando(true); setErro(""); const f = new FormData(e.currentTarget), a = acao.item; let r; if (acao.tipo === "desfazer_falta")
        r = await cancelarOcorrenciaFrequencia(a.ocorrencia_frequencia_id ?? "", String(f.get("motivo") || ""));
    else if (acao.tipo === "falta")
        r = await registrarOcorrenciaFrequencia({ pacienteId: a.paciente_id, profissionalId: a.profissional_id, data: dataLocalIso(a.inicio), tipo: String(f.get("tipo")) as TipoOcorrenciaFrequencia, motivo: String(f.get("motivo") || ""), observacao: String(f.get("observacao") || ""), agendamentoId: a.id });
    else if (acao.tipo === "cancelar")
        r = await cancelarAgendamento({ id: a.id, motivo: String(f.get("motivo")), updatedAt: a.updated_at });
    else if (acao.tipo === "reagendar") {
        const inicio = new Date(String(f.get("inicio"))).toISOString(), fim = new Date(new Date(inicio).getTime() + Number(f.get("duracao")) * 60000).toISOString();
        r = await reagendarAgendamento({ id: a.id, inicio, fim, motivo: String(f.get("motivo")) });
    }
    else
        r = await editarAgendamento({ id: a.id, profissionalId: String(f.get("profissional")), finalidade: String(f.get("finalidade")), modalidade: String(f.get("modalidade")), local: String(f.get("local") || ""), observacao: String(f.get("observacao") || ""), motivo: String(f.get("motivo")), updatedAt: a.updated_at }); if ("error" in r)
        setErro(r.error);
    else {
        setAcao(null);
        router.refresh();
    } setSalvando(false); }
    return <div className="space-y-5">{destaqueId && <div className="flex flex-col gap-3 rounded-xl border border-primary/30 bg-primary/5 p-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-semibold">Compromisso localizado pela Frequência</p><p className="text-sm text-muted-foreground">A lista está mostrando somente o compromisso vinculado ao lançamento.</p></div><Button type="button" variant="secondary" onClick={() => router.push(`/registros/agenda?data=${referencia}&visao=dia&formato=lista`)}>Remover filtro</Button></div>}<AgendaCabecalho referencia={referencia} visao={visao} formato="lista" periodo={periodo} podeGerir={podeGerir && Boolean(opcoes)} profissoes={profissoes} profissional={profissionalFiltro} profissionalNome={profissionalFiltroNome} status={statusFiltro} onProfissional={(item) => { setProfissionalFiltro(item.id); setProfissionalFiltroNome(item.nome); }} onLimparProfissional={() => { setProfissionalFiltro("todos"); setProfissionalFiltroNome(""); }} onStatus={setStatusFiltro} />{erro && !acao && <p className="text-sm text-destructive">{erro}</p>}
    <div className="space-y-3">{filtrados.map(a => <Fragment key={a.id}><Card id={`compromisso-${a.id}`} className={destaqueId === a.id ? "border-primary ring-2 ring-primary/20" : undefined}><CardContent className="grid gap-4 p-4 lg:grid-cols-[170px_minmax(220px,1fr)_minmax(280px,auto)] lg:items-center"><div><p className="font-bold">{new Date(a.inicio).toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit", month: "2-digit" })}</p><p className="flex items-center gap-1 text-sm"><Clock className="size-3.5"/>{new Date(a.inicio).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}–{new Date(a.fim).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</p><Badge className="mt-2" variant={a.status === "cancelado" || a.status === "falta" ? "secondary" : "default"}>{statusLabel[a.status]}</Badge></div><div><p className="font-semibold">{a.paciente_nome}</p><p className="text-sm text-muted-foreground">{a.profissional_nome} · {finalidades[a.finalidade] ?? a.finalidade}</p></div><div className="space-y-1 lg:text-right"><p className="text-xs font-medium text-muted-foreground">Ações</p><div className="flex flex-wrap gap-2 lg:justify-end">{a.profissional_id === usuarioId && !a.pode_iniciar && ["agendado", "confirmado"].includes(a.status) && <Button size="sm" onClick={() => aceitar(a.id)}>Aceitar paciente</Button>}{a.profissional_id === usuarioId && a.pode_iniciar && ["agendado", "confirmado"].includes(a.status) && podeRegistrarSessao(a.inicio) && <Button size="sm" asChild><Link href={`/registros/sessoes/nova?paciente=${a.paciente_id}&agendamento=${a.id}`}>Registrar sessão</Link></Button>}{a.profissional_id === usuarioId && a.pode_iniciar && ["agendado", "confirmado"].includes(a.status) && !podeRegistrarSessao(a.inicio) && <Button size="sm" variant="secondary" disabled title="A sessão poderá ser registrada até 10 minutos antes do início do compromisso.">Sessão — disponível 10 min antes</Button>}{a.status === "agendado" && a.profissional_id === usuarioId && <Button size="sm" variant="secondary" onClick={() => mudar(a.id)}>Confirmar</Button>}{["agendado", "confirmado"].includes(a.status) && a.profissional_id === usuarioId && podeRegistrarFalta(a.inicio) && <Button size="sm" variant="secondary" onClick={() => { setErro(""); setAcao({ tipo: "falta", item: a }); }}>Registrar falta</Button>}{["agendado", "confirmado"].includes(a.status) && a.profissional_id === usuarioId && !podeRegistrarFalta(a.inicio) && <Button size="sm" variant="secondary" disabled title="A falta poderá ser registrada na data do compromisso.">Falta — disponível no dia</Button>}{podeGerir && ["agendado", "confirmado"].includes(a.status) && <Button size="sm" variant="secondary" onClick={() => setAcao({ tipo: "editar", item: a })}>Editar</Button>}{podeGerir && ["agendado", "confirmado"].includes(a.status) && <Button size="sm" variant="secondary" onClick={() => setAcao({ tipo: "reagendar", item: a })}>Reagendar</Button>}{podeGerir && ["agendado", "confirmado"].includes(a.status) && <Button size="sm" variant="secondary" onClick={() => setAcao({ tipo: "cancelar", item: a })}>Cancelar</Button>}{a.status === "falta" && a.ocorrencia_frequencia_id && (podeGerir || a.profissional_id === usuarioId) && <Button size="sm" variant="secondary" onClick={() => { setErro(""); setAcao({ tipo: "desfazer_falta", item: a }); }}>Desfazer falta</Button>}</div></div></CardContent></Card>{acao?.item.id === a.id && <AcaoForm acao={acao} opcoes={opcoes} salvando={salvando} erro={erro} onSubmit={enviar} onClose={() => setAcao(null)}/>}</Fragment>)}{!filtrados.length && <div className="rounded-2xl border border-dashed p-10 text-center text-sm text-muted-foreground">Nenhum compromisso encontrado. Ajuste o período ou os filtros.</div>}</div></div>;
}
function AcaoForm({ acao, opcoes, salvando, erro, onSubmit, onClose }: {
    acao: NonNullable<Acao>;
    opcoes: OpcoesAgenda | null;
    salvando: boolean;
    erro: string;
    onSubmit: (e: FormEvent<HTMLFormElement>) => void;
    onClose: () => void;
}) {
    const a = acao.item;
    if (acao.tipo === "desfazer_falta")
        return <form onSubmit={onSubmit} className="space-y-4 rounded-2xl border border-destructive/30 bg-card p-5"><div><h3 className="font-bold">Desfazer falta de {a.paciente_nome}</h3><p className="text-sm text-muted-foreground">O lançamento vinculado será retirado da Frequência e o compromisso voltará ao status anterior.</p>{a.ocorrencia_frequencia_tipo && <p className="mt-2 text-sm">Registro: {a.ocorrencia_frequencia_tipo === "falta_justificada" ? "Falta justificada" : "Falta não justificada"}{a.ocorrencia_frequencia_motivo ? ` · ${a.ocorrencia_frequencia_motivo}` : ""}</p>}</div><Campo label="Motivo da correção"><Textarea name="motivo" minLength={5} required/></Campo>{erro && <p className="text-sm text-destructive">{erro}</p>}<Botoes texto="Desfazer falta e reabrir compromisso" salvando={salvando} onClose={onClose} destructive/></form>;
    if (acao.tipo === "falta")
        return <form onSubmit={onSubmit} className="space-y-4 rounded-2xl border border-primary/30 bg-card p-5"><div><h3 className="font-bold">Registrar falta de {a.paciente_nome}</h3><p className="text-sm text-muted-foreground">Será criado um lançamento na Frequência. Ao excluir esse lançamento, o compromisso voltará ao status anterior.</p></div><div className="grid gap-4 md:grid-cols-2"><Campo label="Situação"><Select name="tipo" defaultValue="falta_nao_justificada"><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="falta_nao_justificada">Falta não justificada</SelectItem><SelectItem value="falta_justificada">Falta justificada</SelectItem></SelectContent></Select></Campo><Campo label="Motivo ou justificativa"><Input name="motivo" placeholder="Obrigatório para falta justificada"/></Campo></div><Campo label="Observação administrativa"><Textarea name="observacao" placeholder="Não inclua informações clínicas."/></Campo>{erro && <p className="text-sm text-destructive">{erro}</p>}<Botoes texto="Registrar falta" salvando={salvando} onClose={onClose}/></form>;
    if (acao.tipo === "cancelar")
        return <form onSubmit={onSubmit} className="space-y-4 rounded-2xl border border-destructive/30 bg-card p-5"><h3 className="font-bold">Cancelar {a.paciente_nome}</h3><Campo label="Motivo"><Textarea name="motivo" minLength={5} required/></Campo>{erro && <p className="text-sm text-destructive">{erro}</p>}<Botoes texto="Confirmar cancelamento" salvando={salvando} onClose={onClose} destructive/></form>;
    if (acao.tipo === "reagendar")
        return <form onSubmit={onSubmit} className="space-y-4 rounded-2xl border border-primary/30 bg-card p-5"><h3 className="font-bold">Reagendar {a.paciente_nome}</h3><div className="grid gap-4 md:grid-cols-3"><Campo label="Novo início"><Input name="inicio" type="datetime-local" required/></Campo><Campo label="Duração"><Select name="duracao" defaultValue="50"><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{[30, 40, 50, 60, 90, 120].map(v => <SelectItem key={v} value={String(v)}>{v} minutos</SelectItem>)}</SelectContent></Select></Campo><Campo label="Motivo"><Input name="motivo" minLength={5} required/></Campo></div>{erro && <p className="text-sm text-destructive">{erro}</p>}<Botoes texto="Confirmar" salvando={salvando} onClose={onClose}/></form>;
    return <EditarAgendamentoForm agendamento={a} opcoes={opcoes} salvando={salvando} erro={erro} onSubmit={onSubmit} onClose={onClose}/>;
}
function EditarAgendamentoForm({ agendamento: a, opcoes, salvando, erro, onSubmit, onClose }: { agendamento: Agendamento; opcoes: OpcoesAgenda | null; salvando: boolean; erro: string; onSubmit: (e: FormEvent<HTMLFormElement>) => void; onClose: () => void; }) {
    const [profissionalId, setProfissionalId] = useState(a.profissional_id);
    const [profissionalNome, setProfissionalNome] = useState(a.profissional_nome || opcoes?.profissionais.find(item => item.id === a.profissional_id)?.nome || "Responsável atual");
    return <form onSubmit={onSubmit} className="space-y-4 rounded-2xl border border-primary/30 bg-card p-5"><h3 className="font-bold">Editar {a.paciente_nome}</h3><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4"><Campo label="Responsável"><SeletorBuscaOperacional tipo="profissional" name="profissional" value={profissionalId} label={profissionalNome} onSelect={item => { setProfissionalId(item.id); setProfissionalNome(item.nome); }}/></Campo><Campo label="Finalidade"><Select name="finalidade" defaultValue={a.finalidade}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{Object.entries(finalidades).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}</SelectContent></Select></Campo><Campo label="Modalidade"><Select name="modalidade" defaultValue={a.modalidade}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{["presencial", "domiciliar", "escola", "teleatendimento", "outro"].map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent></Select></Campo><Campo label="Local"><Input name="local" defaultValue={a.local ?? ""}/></Campo></div><Campo label="Observação administrativa"><Textarea name="observacao" defaultValue={a.observacao_administrativa ?? ""}/></Campo><Campo label="Motivo da alteração"><Input name="motivo" minLength={5} required/></Campo>{erro && <p className="text-sm text-destructive">{erro}</p>}<Botoes texto="Salvar" salvando={salvando} onClose={onClose}/></form>;
}
function Campo({ label, children }: {
    label: string;
    children: ReactNode;
}) { return <div className="space-y-2"><Label>{label}</Label>{children}</div>; }
function Botoes({ texto, salvando, onClose, destructive = false }: {
    texto: string;
    salvando: boolean;
    onClose: () => void;
    destructive?: boolean;
}) { return <div className="flex gap-2"><Button variant={destructive ? "destructive" : "default"} disabled={salvando}>{salvando ? "Salvando..." : texto}</Button><Button type="button" variant="secondary" onClick={onClose}>Voltar</Button></div>; }
