const mensagens: Record<string, string> = {
  invalid_occurrence_date: "Informe uma data válida, igual ou anterior a hoje.",
  invalid_occurrence_type: "Selecione uma situação válida para a ocorrência.",
  invalid_occurrence_reason: "Informe o motivo da falta justificada com pelo menos 3 caracteres.",
  invalid_occurrence_patient: "O paciente selecionado não está ativo ou não foi encontrado. Revise o cadastro.",
  invalid_occurrence_professional: "O responsável previsto não está habilitado para atender. Selecione um profissional ou coordenador ativo.",
  invalid_schedule_link: "O agendamento não corresponde ao paciente, responsável e data informados, ou já foi alterado. Revise o vínculo com a agenda.",
  stale_previous_occurrence: "O histórico de faltas mudou. Atualize a página e confirme novamente a continuidade.",
  invalid_sequence: "Não foi possível confirmar a sequência de faltas. Revise a continuidade; se não souber, selecione “Não foi possível confirmar”.",
  duplicate_schedule_occurrence: "Este agendamento já possui uma ocorrência de frequência.",
}

export function mensagemErroOcorrencia(error: { message: string; code?: string }) {
  const mensagem = Object.entries(mensagens).find(([identificador]) => error.message.includes(identificador))?.[1]
  if (mensagem) return mensagem
  if (error.code === "23505") return mensagens.duplicate_schedule_occurrence
  if (error.code === "42501") return "Você não possui permissão para registrar uma ocorrência para este paciente ou responsável."
  if (["42883", "PGRST202"].includes(error.code ?? "")) return "O cadastro de ocorrências precisa de uma atualização no banco. Solicite a aplicação da migration à administração."
  if (error.code === "22023") return "O banco rejeitou os dados da ocorrência. Revise paciente, responsável, data e situação. Se estiverem corretos, solicite à administração a verificação do cadastro e da versão do banco."
  return "Não foi possível registrar a ocorrência. Tente novamente; se o erro persistir, entre em contato com a administração."
}
