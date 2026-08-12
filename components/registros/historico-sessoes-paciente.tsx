import { SessaoCancelamento } from "@/components/registros/sessao-cancelamento"
import { Badge } from "@/components/ui/badge"
import type {
  FinalidadeSessao,
  SessaoClinicaComRegistros,
  TipoMedicao,
} from "@/lib/registros/clinico/modelo"

const finalidadeLabel: Record<FinalidadeSessao, string> = {
  vinculo_acolhimento: "Vínculo e acolhimento",
  entrevista_responsaveis: "Entrevista",
  avaliacao_inicial: "Avaliação inicial",
  observacao_clinica: "Observação clínica",
  linha_de_base: "Linha de base",
  intervencao: "Intervenção",
  generalizacao: "Generalização",
  manutencao: "Manutenção",
  orientacao_equipe: "Orientação de equipe",
}

const ajudaLabel = {
  independente: "Independente",
  gestual: "Ajuda gestual",
  verbal: "Ajuda verbal",
  modelo: "Modelo",
  fisica_parcial: "Ajuda física parcial",
  fisica_total: "Ajuda física total",
}

const resultadoLabel = {
  correta: "Correta",
  incorreta: "Incorreta",
  sem_resposta: "Sem resposta",
}

function resumo(tipo: TipoMedicao, dados: Record<string, unknown>) {
  if (tipo === "frequencia") return `${dados.contagem ?? 0} ocorrência(s)`
  if (tipo === "taxa") return `${dados.contagem ?? 0} em ${dados.duracao_observacao_segundos ?? 0}s`
  if (tipo === "duracao" || tipo === "latencia") return `${dados.segundos ?? 0}s`
  if (tipo === "percentual_oportunidades" || tipo === "tentativas_discretas") {
    return `${dados.respostas_independentes ?? 0}/${dados.oportunidades ?? 0}`
  }
  if (["intervalo_parcial", "intervalo_total", "amostragem_momentanea"].includes(tipo)) {
    return `${dados.intervalos_com_ocorrencia ?? 0}/${dados.intervalos ?? 0} intervalos`
  }
  return String(dados.codigo ?? dados.nivel ?? "—")
}

function Sessao({
  sessao,
  usuarioId,
  cancelada = false,
}: {
  sessao: SessaoClinicaComRegistros
  usuarioId: string
  cancelada?: boolean
}) {
  return (
    <article className={`rounded-2xl border bg-card p-5 ${cancelada ? "opacity-80" : ""}`}>
      <div className="flex flex-col justify-between gap-3 sm:flex-row">
        <div>
          <h3 className="font-bold">
            {new Date(`${sessao.data}T12:00:00`).toLocaleDateString("pt-BR")}
          </h3>
          <p className="text-sm text-muted-foreground">
            {sessao.contexto || sessao.ambiente_tipo || "Contexto não informado"}
          </p>
        </div>
        <div className="flex flex-wrap items-start justify-end gap-2">
          <Badge variant={cancelada ? "secondary" : "default"}>
            {cancelada ? "Cancelada" : finalidadeLabel[sessao.finalidade] ?? "Sessão clínica"}
          </Badge>
          {sessao.registros.length > 0 && (
            <Badge variant="secondary">{sessao.registros.length} alvos</Badge>
          )}
          {sessao.profissional_id === usuarioId && (
            <SessaoCancelamento
              sessaoId={sessao.id}
              pacienteId={sessao.paciente_id}
              cancelada={cancelada}
            />
          )}
        </div>
      </div>

      {cancelada && (
        <p className="mt-3 rounded-xl bg-muted p-3 text-sm">
          <strong>Motivo do cancelamento:</strong> {sessao.motivo_cancelamento}
        </p>
      )}

      {!cancelada && sessao.registros.length === 0 && (
        <p className="mt-4 rounded-xl bg-muted p-3 text-sm text-muted-foreground">
          Sessão registrada sem alvos por ser anterior ou complementar ao planejamento.
        </p>
      )}

      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        {sessao.registros.map((registro) => (
          <div key={registro.id} className="rounded-xl bg-muted p-3">
            <p className="text-sm font-semibold">{registro.alvo.nome}</p>
            <p className="text-xs text-muted-foreground">
              {resumo(registro.tipo_medicao, registro.dados)}
            </p>
            {registro.tentativas.length > 0 && (
              <details className="mt-3 rounded-lg border bg-background p-2">
                <summary className="cursor-pointer text-xs font-semibold">
                  Ver {registro.tentativas.length} tentativa(s)
                </summary>
                <ol className="mt-2 space-y-2">
                  {registro.tentativas.map((tentativa) => (
                    <li key={tentativa.id} className="rounded-md border p-2 text-xs">
                      <p className="font-medium">
                        {tentativa.ordem}. {resultadoLabel[tentativa.resultado]} · {ajudaLabel[tentativa.nivel_ajuda]}
                      </p>
                      {(tentativa.latencia_segundos !== null || tentativa.observacao) && (
                        <p className="mt-1 text-muted-foreground">
                          {tentativa.latencia_segundos !== null
                            ? `Latência: ${tentativa.latencia_segundos}s`
                            : ""}
                          {tentativa.latencia_segundos !== null && tentativa.observacao ? " · " : ""}
                          {tentativa.observacao ?? ""}
                        </p>
                      )}
                    </li>
                  ))}
                </ol>
              </details>
            )}
          </div>
        ))}
      </div>

      {!cancelada && sessao.observacoes_abc.length > 0 && (
        <details className="mt-3 rounded-xl border p-3">
          <summary className="cursor-pointer text-sm font-semibold">
            Observações ABC ({sessao.observacoes_abc.length})
          </summary>
          <div className="mt-3 space-y-2">
            {sessao.observacoes_abc.map((observacao) => (
              <p key={observacao.id} className="text-sm">
                <strong>ABC:</strong> {observacao.antecedente} → {observacao.comportamento_observado} → {observacao.consequencia}
              </p>
            ))}
          </div>
        </details>
      )}
    </article>
  )
}

export function HistoricoSessoesPaciente({
  sessoes,
  canceladas,
  usuarioId,
}: {
  sessoes: SessaoClinicaComRegistros[]
  canceladas: SessaoClinicaComRegistros[]
  usuarioId: string
}) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold">Sessões</h2>
        <p className="text-sm text-muted-foreground">
          Histórico clínico visível para seu perfil. Correções preservam o registro original.
        </p>
      </div>
      {sessoes.length === 0 ? (
        <p className="rounded-2xl border border-dashed p-8 text-center text-sm text-muted-foreground">
          Nenhuma sessão ativa registrada.
        </p>
      ) : (
        <div className="space-y-3">
          {sessoes.map((sessao) => (
            <Sessao key={sessao.id} sessao={sessao} usuarioId={usuarioId} />
          ))}
        </div>
      )}
      {canceladas.length > 0 && (
        <details className="rounded-2xl border p-4">
          <summary className="cursor-pointer font-semibold">
            Sessões canceladas ({canceladas.length})
          </summary>
          <div className="mt-4 space-y-3">
            {canceladas.map((sessao) => (
              <Sessao key={sessao.id} sessao={sessao} usuarioId={usuarioId} cancelada />
            ))}
          </div>
        </details>
      )}
    </div>
  )
}
