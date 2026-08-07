import type React from "react"
import type { Metadata } from "next"
import { Nunito } from "next/font/google"
import "./globals.css"

const nunito = Nunito({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-nunito",
})

export const metadata: Metadata = {
  title: "Eduarda — Psicóloga Infantil | Especialista em TEA",
  description:
    "Psicóloga infantil especializada em Transtorno do Espectro Autista (TEA) e desenvolvimento infantil. Atendimento acolhedor e humanizado para crianças e famílias.",
  generator: "v0.app",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-BR" className={`${nunito.variable} bg-background`}>
      <body className="font-sans antialiased">{children}</body>
    </html>
  )
}
