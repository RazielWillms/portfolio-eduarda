import { calcularIndicadorHabilidade } from "./calcular-status"
import { calcularProgressoGeral } from "./calcular-progresso-geral"
import type { AvaliacaoClinica } from "./tipos"

export interface HabilidadePonderada { habilidadeId: string; peso: number; ativo: boolean }
export interface IntervaloData { inicio: string; fim: string }

export function filtrarAvaliacoesPorPeriodo(avaliacoes: AvaliacaoClinica[], periodo: IntervaloData) {
  return avaliacoes.filter((a) => a.data >= periodo.inicio && a.data <= periodo.fim)
}

export function calcularIndicadoresPorHabilidade(avaliacoes: AvaliacaoClinica[], habilidades: HabilidadePonderada[]) {
  return habilidades.map((h) => ({
    ...h,
    indicador: calcularIndicadorHabilidade(avaliacoes.filter((a) => a.habilidade_id === h.habilidadeId)),
  }))
}

export function calcularResumoPeriodo(avaliacoes: AvaliacaoClinica[], habilidades: HabilidadePonderada[]) {
  const itens = calcularIndicadoresPorHabilidade(avaliacoes, habilidades)
  return {
    progressoGeral: calcularProgressoGeral(itens.map((i) => ({
      progresso: i.indicador.percentual, peso: i.peso, ativo: i.ativo,
    }))),
    avaliacoes: avaliacoes.length,
    adquiridas: itens.filter((i) => i.indicador.status === "adquirida").length,
    melhora: itens.filter((i) => i.indicador.tendencia === "melhora").length,
    queda: itens.filter((i) => i.indicador.tendencia === "queda").length,
  }
}

export function calcularSerieProgressoGeral(avaliacoes: AvaliacaoClinica[], habilidades: HabilidadePonderada[]) {
  const datas = [...new Set(avaliacoes.map((a) => a.data))].sort()
  return datas.flatMap((data) => {
    const usadas = avaliacoes.filter((a) => a.data <= data)
    const resumo = calcularResumoPeriodo(usadas, habilidades)
    return resumo.progressoGeral === null ? [] : [{ data, percentual: resumo.progressoGeral, avaliacoes: usadas.length }]
  })
}

export function periodoAnterior(periodo: IntervaloData): IntervaloData {
  const inicio = new Date(`${periodo.inicio}T12:00:00`)
  const fim = new Date(`${periodo.fim}T12:00:00`)
  const dias = Math.max(1, Math.round((fim.getTime() - inicio.getTime()) / 86400000) + 1)
  const fimAnterior = new Date(inicio); fimAnterior.setDate(fimAnterior.getDate() - 1)
  const inicioAnterior = new Date(fimAnterior); inicioAnterior.setDate(inicioAnterior.getDate() - dias + 1)
  const iso = (d: Date) => d.toISOString().slice(0, 10)
  return { inicio: iso(inicioAnterior), fim: iso(fimAnterior) }
}
