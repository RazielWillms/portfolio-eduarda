import Link from "next/link"
import { activities } from "@/lib/activities"
import { ActivitiesGrid } from "./activities-grid"

export function ActivitiesPreview() {
  const featured = activities.slice(0, 3)

  return (
    <section id="atividades-preview" className="py-20">
      <div className="container mx-auto px-4 space-y-8">
        <div className="text-center space-y-3">
          <span className="text-sm font-bold uppercase tracking-widest text-primary">Interatividade</span>
          <h2 className="mt-2 text-4xl md:text-5xl font-extrabold text-foreground text-balance">
            Atividades Lúdicas
          </h2>
          <p className="mt-4 text-base text-muted-foreground max-w-xl mx-auto text-pretty">
            Recursos interativos desenvolvidos para estimular emoções, habilidades sociais e autoconhecimento
            de forma leve e divertida.
          </p>
        </div>

        <ActivitiesGrid activities={featured} />

        <div className="text-center">
          <Link
            href="/atividades"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-primary text-primary-foreground font-semibold hover:opacity-90 transition-opacity"
          >
            Explorar biblioteca →
            {/*<span className="text-lg">+{activities.length - featured.length}</span>*/}
          </Link>
        </div>
      </div>
    </section>
  )
}