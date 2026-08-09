"use client"

import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { useMemo, useState } from "react"
import { Activity } from "@/lib/activities"
import { ActivitiesGrid } from "./activities-grid"

export function ActivitiesPageClient({ activities }: { activities: Activity[] }) {
  const [selectedTag, setSelectedTag] = useState("Todas")

  const tags = useMemo(() => {
    return ["Todas", ...new Set(activities.map((a) => a.tag))]
  }, [activities])

  const filtered =
    selectedTag === "Todas"
      ? activities
      : activities.filter((a) => a.tag === selectedTag)

  return (
    <main className="py-20">
      <div className="container mx-auto px-4 space-y-10">
        {/* Topo alinhado */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl border border-border bg-background hover:bg-muted transition-colors text-sm font-medium shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Retornar ao início
          </Link>

          <div className="text-left sm:text-right">
            <p className="text-sm text-muted-foreground">Biblioteca completa</p>
            <p className="font-semibold text-foreground">
              {activities.length} atividades disponíveis
            </p>
          </div>
        </div>

        {/* Cabeçalho */}
        <div className="text-center space-y-4">
          <h1 className="mt-2 text-4xl md:text-5xl font-extrabold text-foreground text-balance">
            Biblioteca de Atividades
          </h1>

          <p className="text-muted-foreground max-w-2xl mx-auto">
            Jogos e recursos interativos organizados por objetivos terapêuticos.
          </p>
        </div>

        {/* Filtros */}
        <div className="flex flex-wrap justify-center gap-3">
          {tags.map((tag) => (
            <button
              key={tag}
              onClick={() => setSelectedTag(tag)}
              className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
                selectedTag === tag
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted hover:bg-muted/80"
              }`}
            >
              {tag}
            </button>
          ))}
        </div>

        {/* Grid */}
        <ActivitiesGrid activities={filtered} />
      </div>
    </main>
  )
}