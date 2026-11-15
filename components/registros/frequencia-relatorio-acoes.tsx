"use client"

import { useState, type ReactNode } from "react"
import Link from "next/link"
import { ArrowLeft, Printer } from "lucide-react"
import { Button } from "@/components/ui/button"

const secoes = [
  { id: "cabecalho", titulo: "Cabeçalho" },
  { id: "resumo", titulo: "Resumo do período" },
  { id: "consecutivas", titulo: "Faltas consecutivas" },
  { id: "profissionais", titulo: "Consolidado por profissional" },
  { id: "pacientes", titulo: "Faltas por paciente — tabela" },
  { id: "grafico-pacientes", titulo: "Gráfico de faltas por paciente", grafico: true },
  { id: "grafico-profissionais", titulo: "Gráfico de ocorrências por responsável previsto", grafico: true },
  { id: "lancamentos", titulo: "Lançamentos do período" },
]

export function FrequenciaRelatorioAcoes({ voltar, children }: { voltar: string; children: ReactNode }) {
  const [selecionadas, setSelecionadas] = useState(() => secoes.map(secao => secao.id))
  const semSelecao = selecionadas.length === 0
  const primeira = secoes.find(secao => selecionadas.includes(secao.id))

  function imprimir() {
    if (semSelecao) return
    window.print()
  }

  function opcao(secao: (typeof secoes)[number]) {
    return (
      <label key={secao.id} className="flex cursor-pointer items-start gap-2 text-sm">
        <input
          type="checkbox"
          className="mt-1 size-4 accent-sky-700"
          checked={selecionadas.includes(secao.id)}
          onChange={event => setSelecionadas(atuais => event.target.checked
            ? [...atuais, secao.id]
            : atuais.filter(id => id !== secao.id))}
        />
        {secao.titulo}
      </label>
    )
  }

  return (
    <div data-frequency-export>
      <div className="mb-6 space-y-4 print:hidden">
        <div className="flex flex-wrap justify-between gap-2">
          <Button variant="secondary" asChild><Link href={voltar}><ArrowLeft className="size-4" />Voltar para Frequência</Link></Button>
          <Button onClick={imprimir} disabled={semSelecao} aria-describedby={semSelecao ? "pdf-selecao-aviso" : undefined}><Printer className="size-4" />Salvar como PDF / imprimir</Button>
        </div>
        <fieldset className="rounded-2xl border bg-card p-4">
          <legend className="px-1 font-semibold">Incluir no PDF</legend>
          <p className="mb-3 text-sm text-muted-foreground">A seleção altera apenas o PDF. Cada gráfico começa em uma página própria.</p>
          <div className="mb-4 flex flex-wrap gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setSelecionadas(secoes.map(secao => secao.id))}>Selecionar todos</Button>
            <Button type="button" variant="outline" size="sm" onClick={() => setSelecionadas([])}>Limpar seleção</Button>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">{secoes.filter(secao => !secao.grafico).map(opcao)}</div>
          <fieldset className="mt-4 border-t pt-3">
            <legend className="pr-2 text-sm font-semibold">Visão gráfica</legend>
            <div className="grid gap-3 sm:grid-cols-2">{secoes.filter(secao => secao.grafico).map(opcao)}</div>
          </fieldset>
          {semSelecao && <p id="pdf-selecao-aviso" role="alert" className="mt-4 text-sm font-medium text-destructive">Selecione pelo menos uma seção para gerar o PDF.</p>}
        </fieldset>
      </div>
      {/* IDs definidos localmente: o CSS não contém entradas do usuário. */}
      <style dangerouslySetInnerHTML={{ __html: `@media print {
        ${secoes.filter(secao => !selecionadas.includes(secao.id)).map(secao => `[data-frequency-export] [data-report-section="${secao.id}"] { display: none !important; }`).join("\n")}
        ${primeira ? `[data-frequency-export] [data-report-section="${primeira.id}"] { break-before: auto; margin-top: 0; }` : "[data-frequency-export] [data-frequency-report] { display: none !important; }"}
      }` }} />
      {children}
    </div>
  )
}
