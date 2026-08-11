"use client"

// Autenticação mockada da Etapa 1 — sessão salva em localStorage.
// TODO: substituir por Supabase Auth (ou outro provedor real) em etapa futura.

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import { USUARIOS_MOCK } from "./mock-data"
import type { Usuario } from "./types"

const SESSION_KEY = "registros_session"
const USERS_KEY = "registros_usuarios"

interface AuthContextValue {
  user: Usuario | null
  usuarios: Usuario[]
  carregando: boolean
  login: (email: string, senha: string) => { ok: boolean; erro?: string }
  logout: () => void
  addUsuario: (dados: { nome: string; email: string; papel: Usuario["papel"] }) => { ok: boolean; erro?: string }
}

const AuthContext = createContext<AuthContextValue | null>(null)

function lerUsuarios(): Usuario[] {
  if (typeof window === "undefined") return USUARIOS_MOCK
  try {
    const raw = window.localStorage.getItem(USERS_KEY)
    if (!raw) return USUARIOS_MOCK
    return JSON.parse(raw) as Usuario[]
  } catch {
    return USUARIOS_MOCK
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Usuario | null>(null)
  const [usuarios, setUsuarios] = useState<Usuario[]>(USUARIOS_MOCK)
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    const listaUsuarios = lerUsuarios()
    setUsuarios(listaUsuarios)

    try {
      const raw = window.localStorage.getItem(SESSION_KEY)
      if (raw) {
        const sessionUser = JSON.parse(raw) as Usuario
        // Revalida contra a lista atual (caso o usuário tenha sido desativado)
        const atual = listaUsuarios.find((u) => u.id === sessionUser.id && u.ativo)
        setUser(atual ?? null)
      }
    } catch {
      setUser(null)
    } finally {
      setCarregando(false)
    }
  }, [])

  function login(email: string, senha: string): { ok: boolean; erro?: string } {
    // Mock: qualquer senha com 4+ caracteres é aceita para um e-mail cadastrado e ativo.
    if (senha.trim().length < 4) {
      return { ok: false, erro: "A senha precisa ter pelo menos 4 caracteres." }
    }
    const encontrado = usuarios.find((u) => u.email.toLowerCase() === email.trim().toLowerCase())
    if (!encontrado) {
      return { ok: false, erro: "E-mail não encontrado." }
    }
    if (!encontrado.ativo) {
      return { ok: false, erro: "Este usuário está inativo." }
    }
    setUser(encontrado)
    window.localStorage.setItem(SESSION_KEY, JSON.stringify(encontrado))
    return { ok: true }
  }

  function logout() {
    setUser(null)
    window.localStorage.removeItem(SESSION_KEY)
  }

  function addUsuario(dados: { nome: string; email: string; papel: Usuario["papel"] }): { ok: boolean; erro?: string } {
    if (!user || user.papel !== "admin") {
      return { ok: false, erro: "Apenas administradores podem adicionar novos usuários." }
    }
    const emailJaExiste = usuarios.some((u) => u.email.toLowerCase() === dados.email.trim().toLowerCase())
    if (emailJaExiste) {
      return { ok: false, erro: "Já existe um usuário com este e-mail." }
    }
    const novo: Usuario = {
      id: `u-${Date.now()}`,
      nome: dados.nome.trim(),
      email: dados.email.trim().toLowerCase(),
      papel: dados.papel,
      ativo: true,
    }
    const proximaLista = [...usuarios, novo]
    setUsuarios(proximaLista)
    window.localStorage.setItem(USERS_KEY, JSON.stringify(proximaLista))
    return { ok: true }
  }

  return (
    <AuthContext.Provider value={{ user, usuarios, carregando, login, logout, addUsuario }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth deve ser usado dentro de <AuthProvider>")
  return ctx
}
