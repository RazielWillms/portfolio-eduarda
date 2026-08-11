// Dados mockados da Etapa 1 — substituir por dados reais (Supabase) em etapa futura.
import type { Usuario, Paciente, Habilidade, RegistroAtendimento } from "./types"

export const USUARIOS_MOCK: Usuario[] = [
  { id: "u-admin", nome: "Eduarda Ramos", email: "eduarda@clinica.com", papel: "admin", ativo: true },
  { id: "u-psi-1", nome: "Camila Souza", email: "camila@clinica.com", papel: "psicologo", ativo: true },
  { id: "u-psi-2", nome: "Rafael Lima", email: "rafael@clinica.com", papel: "psicologo", ativo: true },
]

export const PACIENTES_MOCK: Paciente[] = [
  {
    id: "p-1",
    nomeCompleto: "Lucas Andrade Silva",
    nomeResponsavel: "Marina Andrade",
    dataNascimento: "2019-04-12",
    observacoes: "Prefere sessões pela manhã. Boa resposta a reforço positivo com elogios.",
    diagnostico: "TEA nível 1",
    contatos: "(11) 98888-1234",
    status: "ativo",
    psicologosIds: ["u-psi-1"],
  },
  {
    id: "p-2",
    nomeCompleto: "Beatriz Costa Ferreira",
    nomeResponsavel: "Juliana Costa",
    dataNascimento: "2018-09-03",
    observacoes: "Sensível a estímulos sonoros altos. Usar fones se necessário.",
    diagnostico: "TEA nível 2",
    contatos: "(11) 97777-5678",
    status: "ativo",
    psicologosIds: ["u-psi-1"],
  },
  {
    id: "p-3",
    nomeCompleto: "Enzo Martins Oliveira",
    nomeResponsavel: "Patrícia Martins",
    dataNascimento: "2020-01-20",
    observacoes: "Em fase de adaptação, atendimentos ainda curtos (20 min).",
    contatos: "(11) 96666-4321",
    status: "ativo",
    psicologosIds: ["u-psi-2"],
  },
  {
    id: "p-4",
    nomeCompleto: "Sofia Almeida Rocha",
    nomeResponsavel: "Fernanda Almeida",
    dataNascimento: "2017-11-08",
    observacoes: "Encerrou ciclo de atendimentos, retorno em avaliação.",
    diagnostico: "TEA nível 1",
    contatos: "(11) 95555-9012",
    status: "inativo",
    psicologosIds: ["u-psi-2"],
  },
]

export const HABILIDADES_MOCK: Habilidade[] = [
  {
    id: "h-1",
    nome: "Vínculo emocional",
    descricao: "Capacidade de estabelecer e manter conexão afetiva com o terapeuta.",
    categoria: "Socioemocional",
    peso: 1,
    status: "ativa",
  },
  {
    id: "h-2",
    nome: "Contato visual",
    descricao: "Manter contato visual apropriado durante a interação.",
    categoria: "Comunicação",
    peso: 0.8,
    status: "ativa",
  },
  {
    id: "h-3",
    nome: "Permanecer sentado",
    descricao: "Manter-se sentado durante a atividade proposta pelo tempo esperado.",
    categoria: "Autorregulação",
    peso: 0.6,
    status: "ativa",
  },
  {
    id: "h-4",
    nome: "Comunicação funcional",
    descricao: "Uso de fala, gestos ou recursos de comunicação para expressar necessidades.",
    categoria: "Comunicação",
    peso: 1,
    status: "ativa",
  },
  {
    id: "h-5",
    nome: "Imitação",
    descricao: "Reproduzir ações motoras ou vocais demonstradas pelo terapeuta.",
    categoria: "Aprendizagem",
    peso: 0.7,
    status: "ativa",
  },
]

export const ATENDIMENTOS_MOCK: RegistroAtendimento[] = [
  { id: "a-1", pacienteId: "p-1", psicologoId: "u-psi-1", data: "2025-05-02", habilidadeId: "h-1", nota: "A", observacoes: "Ótima resposta hoje." },
  { id: "a-2", pacienteId: "p-1", psicologoId: "u-psi-1", data: "2025-05-05", habilidadeId: "h-2", nota: "B+", observacoes: "Precisou de dica verbal." },
  { id: "a-3", pacienteId: "p-1", psicologoId: "u-psi-1", data: "2025-05-09", habilidadeId: "h-1", nota: "A", observacoes: "" },
  { id: "a-4", pacienteId: "p-1", psicologoId: "u-psi-1", data: "2025-05-12", habilidadeId: "h-4", nota: "B-", observacoes: "Cansado no início da sessão." },
  { id: "a-5", pacienteId: "p-2", psicologoId: "u-psi-1", data: "2025-05-03", habilidadeId: "h-3", nota: "B+", observacoes: "" },
  { id: "a-6", pacienteId: "p-2", psicologoId: "u-psi-1", data: "2025-05-10", habilidadeId: "h-3", nota: "A", observacoes: "Progresso consistente." },
  { id: "a-7", pacienteId: "p-3", psicologoId: "u-psi-2", data: "2025-05-04", habilidadeId: "h-5", nota: "C", observacoes: "Primeira sessão de adaptação." },
  { id: "a-8", pacienteId: "p-3", psicologoId: "u-psi-2", data: "2025-05-11", habilidadeId: "h-5", nota: "B-", observacoes: "Já imita gestos simples." },
]
