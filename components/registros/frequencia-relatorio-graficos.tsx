import type { RelatorioFrequencia } from "@/lib/registros/types"

type ItemGrafico = { nome: string; total: number; detalhe: string }

function GraficoImpresso({ titulo, subtitulo, itens, cor }: { titulo: string; subtitulo: string; itens: ItemGrafico[]; cor: "azul" | "verde" }) {
  const exibidos = itens.filter((item) => item.total > 0).slice(0, 10)
  const maior = Math.max(1, ...exibidos.map((item) => item.total))

  return (
    <section className="break-inside-avoid">
      <h3 className="text-base font-bold">{titulo}</h3>
      <p className="mb-4 text-xs text-slate-500">{subtitulo}</p>
      {exibidos.length ? (
        <div className="space-y-3">
          {exibidos.map((item) => (
            <div key={item.nome} className="grid grid-cols-[minmax(110px,1fr)_minmax(180px,2fr)_2rem] items-center gap-3 text-xs">
              <span className="truncate font-semibold" title={item.nome}>{item.nome}</span>
              <div className="h-5 overflow-hidden rounded bg-slate-100">
                <div
                  className={`h-full min-w-1 rounded ${cor === "azul" ? "bg-sky-600" : "bg-teal-500"} [print-color-adjust:exact]`}
                  style={{ width: `${Math.max(3, (item.total / maior) * 100)}%` }}
                  title={item.detalhe}
                />
              </div>
              <strong className="text-right tabular-nums">{item.total}</strong>
            </div>
          ))}
        </div>
      ) : <p className="rounded-lg border border-dashed border-slate-300 px-4 py-8 text-center text-sm text-slate-500">Sem dados para o período.</p>}
      {itens.filter((item) => item.total > 0).length > 10 && <p className="mt-3 text-xs text-slate-500">Exibindo os 10 maiores resultados. O detalhamento completo permanece nas tabelas.</p>}
    </section>
  )
}

export function FrequenciaRelatorioGraficos({ relatorio }: { relatorio: RelatorioFrequencia }) {
  const pacientes = [...relatorio.pacientes]
    .sort((a, b) => b.total_faltas - a.total_faltas)
    .map((item) => ({ nome: item.nome, total: item.total_faltas, detalhe: `${item.justificadas} justificadas e ${item.nao_justificadas} não justificadas` }))
  const profissionais = [...relatorio.profissionais]
    .sort((a, b) => b.total - a.total)
    .map((item) => ({ nome: item.nome, total: item.total, detalhe: `${item.justificadas} justificadas, ${item.nao_justificadas} não justificadas e ${item.cancelamentos} cancelamentos` }))

  return (
    <section className="space-y-8 print:break-before-page">
      <header className="border-b border-slate-300 pb-3">
        <p className="text-sm font-semibold uppercase tracking-wide text-sky-700">Visão gráfica do período</p>
        <h2 className="mt-1 text-xl font-bold">Indicadores de frequência</h2>
      </header>
      <GraficoImpresso titulo="Faltas por paciente" subtitulo="Total de faltas justificadas e não justificadas." itens={pacientes} cor="azul" />
      <GraficoImpresso titulo="Ocorrências por responsável previsto" subtitulo="Faltas e cancelamentos associados a cada profissional." itens={profissionais} cor="verde" />
    </section>
  )
}
