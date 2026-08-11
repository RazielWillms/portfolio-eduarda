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
        {/* Logo */}
        <a href="#" className="flex items-center gap-2 group">
          <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm shadow-sm group-hover:scale-105 transition-transform">
            E
          </div>
          <span className="font-bold text-foreground text-lg leading-tight">
            Eduarda
            <span className="block text-xs font-normal text-muted-foreground leading-none">Psicóloga Infantil</span>
          </span>
        </a>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-8">
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
            href="/registros/login"
            className="text-xs font-semibold text-muted-foreground/70 hover:text-muted-foreground transition-colors"
          >
            Acesso Profissional
          </a>
          <a
            href="#contato"
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground text-sm font-bold px-5 py-2.5 rounded-2xl hover:opacity-90 transition-opacity shadow-sm"
          >
            Agendar Atendimento
          </a>
        </div>

        {/* Mobile toggle */}
        <button
          className="md:hidden p-2 rounded-xl hover:bg-muted/50 transition-colors"
          onClick={() => setOpen(!open)}
          aria-label={open ? "Fechar menu" : "Abrir menu"}
        >
          {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
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
          <a
            href="/registros/login"
            onClick={() => setOpen(false)}
            className="text-center text-xs font-semibold text-muted-foreground/70 hover:text-muted-foreground transition-colors"
          >
            Acesso Profissional
          </a>
        </nav>
      )}
    </header>
  )
}
