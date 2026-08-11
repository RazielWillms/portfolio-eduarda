export interface ProgressoPonderado { progresso: number | null; peso: number; ativo: boolean }

export function calcularProgressoGeral(habilidades: ProgressoPonderado[]): number | null {
  const calculaveis = habilidades.filter(
    (item): item is ProgressoPonderado & { progresso: number } =>
      item.ativo && item.progresso !== null && item.peso > 0,
  )
  if (calculaveis.length === 0) return null
  const pesos = calculaveis.reduce((total, item) => total + item.peso, 0)
  return Math.round(calculaveis.reduce((total, item) => total + item.progresso * item.peso, 0) / pesos)
}
