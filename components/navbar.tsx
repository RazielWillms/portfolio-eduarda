"use client"

import { useState } from "react"
import { Menu, X } from "lucide-react"

export function Navbar() {
  const [open, setOpen] = useState(false)

  const links = [
    { label: "Sobre", href: "#sobre" },
    { label: "Especialidades", href: "#especialidades" },
    { label: "Atividades Lúdicas", href: "#atividades-preview" },
    { label: "Contato", href: "#contato" },
  ]

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-card/80 backdrop-blur-md border-b border-border/40 shadow-sm">
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
        {/* Desktop nav */}
        <nav className="hidden items-center gap-8 md:flex">
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm font-semibold text-muted-foreground hover:text-primary transition-colors"
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* CTA + acesso profissional */}
        <div className="hidden md:flex items-center gap-4">
          <a
            href="#contato"
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground text-sm font-bold px-5 py-2.5 rounded-2xl hover:opacity-90 transition-opacity shadow-sm"
          >
            Agendar Atendimento
          </a>
          <a
            href="/registros/login"
            className="text-xs font-semibold text-muted-foreground/70 hover:text-muted-foreground transition-colors"
          >
            Acesso Profissional
          </a>
        </div>

        {/* Navegação mobile: acesso profissional permanece sempre visível. */}
        <div className="flex w-full items-center justify-between md:hidden">
          <button
            className="rounded-xl p-2 transition-colors hover:bg-muted/50"
            onClick={() => setOpen(!open)}
            aria-label={open ? "Fechar menu" : "Abrir menu"}
            aria-expanded={open}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
          <a
            href="/registros/login"
            className="inline-flex min-h-10 items-center rounded-xl border border-border bg-card px-3 text-xs font-bold text-foreground shadow-sm transition-colors hover:bg-muted"
          >
            Acesso profissional
          </a>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <nav className="md:hidden border-t border-border/40 bg-card/95 backdrop-blur-md px-6 py-4 flex flex-col gap-4">
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className="text-sm font-semibold text-foreground hover:text-primary transition-colors"
            >
              {link.label}
            </a>
          ))}
          <a
            href="#contato"
            onClick={() => setOpen(false)}
            className="inline-flex items-center justify-center bg-primary text-primary-foreground text-sm font-bold px-5 py-3 rounded-2xl hover:opacity-90 transition-opacity"
          >
            Agendar Atendimento
          </a>
        </nav>
      )}
    </header>
  )
}
