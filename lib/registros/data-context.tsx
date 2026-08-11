"use client"

// Dados mockados de Pacientes, Habilidades e Atendimentos — Etapa 1.
// Persistidos em localStorage apenas para manter o estado durante a sessão do navegador.
// TODO: substituir por consultas reais a um banco (ex.: Supabase) em etapa futura,
// aplicando as mesmas regras de isolamento por psicólogo via RLS.

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import { PACIENTES_MOCK, HABILIDADES_MOCK, ATENDIMENTOS_MOCK } from "./mock-data"
import type { Paciente, Habilidade, RegistroAtendimento } from "./types"

const PACIENTES_KEY = "registros_pacientes"
const HABILIDADES_KEY = "registros_habilidades"
const ATENDIMENTOS_KEY = "registros_atendimentos"

function lerOuInicializar<T>(key: string, inicial: T): T {
  if (typeof window === "undefined") return inicial
  try {
    const raw = window.localStorage.getItem(key)
    if (!raw) return inicial
    return JSON.parse(raw) as T
  } catch {
    return inicial
  }
}

interface DataContextValue {
  pacientes: Paciente[]
  habilidades: Habilidade[]
  atendimentos: RegistroAtendimento[]
  carregando: boolean
  pacientesDoUsuario: (userId: string) => Paciente[]
  addPaciente: (dados: Omit<Paciente, "id" | "psicologosIds">, autorId: string) => Paciente
  updatePaciente: (id: string, dados: Partial<Paciente>) => void
  addHabilidade: (dados: Omit<Habilidade, "id">) => Habilidade
  updateHabilidade: (id: string, dados: Partial<Habilidade>) => void
  atendimentosDoUsuario: (userId: string) => RegistroAtendimento[]
  addAtendimento: (dados: Omit<RegistroAtendimento, "id">) => RegistroAtendimento
}

const DataContext = createContext<DataContextValue | null>(null)

export function DataProvider({ children }: { children: ReactNode }) {
  const [pacientes, setPacientes] = useState<Paciente[]>(PACIENTES_MOCK)
  const [habilidades, setHabilidades] = useState<Habilidade[]>(HABILIDADES_MOCK)
  const [atendimentos, setAtendimentos] = useState<RegistroAtendimento[]>(ATENDIMENTOS_MOCK)
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    setPacientes(lerOuInicializar(PACIENTES_KEY, PACIENTES_MOCK))
    setHabilidades(lerOuInicializar(HABILIDADES_KEY, HABILIDADES_MOCK))
    setAtendimentos(lerOuInicializar(ATENDIMENTOS_KEY, ATENDIMENTOS_MOCK))
    setCarregando(false)
  }, [])

  function persistirPacientes(lista: Paciente[]) {
    setPacientes(lista)
    window.localStorage.setItem(PACIENTES_KEY, JSON.stringify(lista))
  }

  function persistirHabilidades(lista: Habilidade[]) {
    setHabilidades(lista)
    window.localStorage.setItem(HABILIDADES_KEY, JSON.stringify(lista))
  }

  function persistirAtendimentos(lista: RegistroAtendimento[]) {
    setAtendimentos(lista)
    window.localStorage.setItem(ATENDIMENTOS_KEY, JSON.stringify(lista))
  }

  // Cada psicólogo só vê os pacientes vinculados a ele.
  // psicologosIds já é um array pensando na partilha futura, mas nesta etapa
  // cada paciente cadastrado é vinculado apenas ao autor do registro.
  function pacientesDoUsuario(userId: string): Paciente[] {
    return pacientes.filter((p) => p.psicologosIds.includes(userId))
  }

  function addPaciente(dados: Omit<Paciente, "id" | "psicologosIds">, autorId: string): Paciente {
    const novo: Paciente = { ...dados, id: `p-${Date.now()}`, psicologosIds: [autorId] }
    persistirPacientes([...pacientes, novo])
    return novo
  }

  function updatePaciente(id: string, dados: Partial<Paciente>) {
    persistirPacientes(pacientes.map((p) => (p.id === id ? { ...p, ...dados } : p)))
  }

  function addHabilidade(dados: Omit<Habilidade, "id">): Habilidade {
    const nova: Habilidade = { ...dados, id: `h-${Date.now()}` }
    persistirHabilidades([...habilidades, nova])
    return nova
  }

  function updateHabilidade(id: string, dados: Partial<Habilidade>) {
    persistirHabilidades(habilidades.map((h) => (h.id === id ? { ...h, ...dados } : h)))
  }

  function atendimentosDoUsuario(userId: string): RegistroAtendimento[] {
    return atendimentos
      .filter((a) => a.psicologoId === userId)
      .sort((a, b) => (a.data < b.data ? 1 : -1))
  }

  function addAtendimento(dados: Omit<RegistroAtendimento, "id">): RegistroAtendimento {
    const novo: RegistroAtendimento = { ...dados, id: `a-${Date.now()}` }
    persistirAtendimentos([...atendimentos, novo])
    return novo
  }

  return (
    <DataContext.Provider
      value={{
        pacientes,
        habilidades,
        atendimentos,
        carregando,
        pacientesDoUsuario,
        addPaciente,
        updatePaciente,
        addHabilidade,
        updateHabilidade,
        atendimentosDoUsuario,
        addAtendimento,
      }}
    >
      {children}
    </DataContext.Provider>
  )
}

export function useRegistrosData() {
  const ctx = useContext(DataContext)
  if (!ctx) throw new Error("useRegistrosData deve ser usado dentro de <DataProvider>")
  return ctx
}
