export function formatarData(data: string) { return new Date(`${data}T12:00:00`).toLocaleDateString("pt-BR") }
export function rotulo(valor: string | null | undefined) { return valor ? valor.replaceAll("_", " ") : "não informado" }
export function percentual(dados: Record<string, unknown>) {
  const oportunidades=Number(dados.oportunidades); const independentes=Number(dados.respostas_independentes)
  if(!Number.isFinite(oportunidades)||oportunidades<=0||!Number.isFinite(independentes))return null
  return Math.round(independentes*100/oportunidades)
}

