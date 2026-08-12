import type { TipoMedicao } from "./modelo"

export function valorMedicao(tipo: TipoMedicao, dados: Record<string, unknown>): number | null {
  const numero = (chave: string) => typeof dados[chave] === "number" && Number.isFinite(dados[chave]) ? Number(dados[chave]) : null
  if (tipo === "frequencia") return numero("contagem")
  if (tipo === "taxa") {
    const contagem = numero("contagem"); const segundos = numero("duracao_observacao_segundos")
    return contagem !== null && segundos && segundos > 0 ? Number(((contagem / segundos) * 60).toFixed(2)) : null
  }
  if (tipo === "duracao" || tipo === "latencia") return numero("segundos")
  if (tipo === "percentual_oportunidades" || tipo === "tentativas_discretas") {
    const parte = numero("respostas_independentes"); const total = numero("oportunidades")
    return parte !== null && total && total > 0 ? Number(((parte / total) * 100).toFixed(2)) : null
  }
  if (tipo === "intervalo_parcial" || tipo === "intervalo_total" || tipo === "amostragem_momentanea") {
    const parte = numero("intervalos_com_ocorrencia"); const total = numero("intervalos")
    return parte !== null && total && total > 0 ? Number(((parte / total) * 100).toFixed(2)) : null
  }
  if (tipo === "escala_independencia") return ({ A: 100, "B+": 70, "B-": 50, C: 0 } as Record<string, number>)[String(dados.codigo)] ?? null
  if (tipo === "intensidade") return numero("nivel")
  return null
}

export function unidadeMedicao(tipo: TipoMedicao) {
  if (tipo === "taxa") return "por minuto"
  if (tipo === "duracao" || tipo === "latencia") return "segundos"
  if (["percentual_oportunidades", "tentativas_discretas", "intervalo_parcial", "intervalo_total", "amostragem_momentanea", "escala_independencia"].includes(tipo)) return "%"
  if (tipo === "frequencia") return "ocorrências"
  return "nível"
}
