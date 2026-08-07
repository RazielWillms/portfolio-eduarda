import { ExternalLink } from "lucide-react"

const activities = [
  {
    emoji: "🦊",
    title: "Trilha das Habilidades Sociais",
    description:
      "Jogo de tabuleiro interativo para praticar comunicação, empatia e resolução de conflitos de forma lúdica e divertida.",
    href: "/atividades/trilha-habilidades-sociais-v2.html",
    color: "bg-[oklch(0.93_0.06_35)]",
    badgeColor: "bg-[oklch(0.87_0.09_35)] text-[oklch(0.28_0.1_35)]",
    tag: "Habilidades Sociais",
  },
  {
    emoji: "💗",
    title: "Como o Reforcinho se Sente?",
    description:
      "Jogo de identificação de emoções: a criança escolhe o sentimento do personagem Reforcinho em diferentes situações do cotidiano.",
    href: "/atividades/como-o-reforcinho-se-sente.html",
    color: "bg-[oklch(0.94_0.04_10)]",
    badgeColor: "bg-[oklch(0.88_0.07_10)] text-[oklch(0.28_0.1_10)]",
    tag: "Emoções",
  },
  {
    emoji: "🎈",
    title: "Balão Enchendo",
    description:
      "Atividade de tolerância à espera: a criança segura o balão enquanto ele enche, treinando o controle do impulso de forma lúdica.",
    href: "/atividades/balao-enchendo.html",
    color: "bg-[oklch(0.93_0.05_220)]",
    badgeColor: "bg-[oklch(0.87_0.07_220)] text-[oklch(0.28_0.1_220)]",
    tag: "Regulação Emocional",
  },
]

export function ActivitiesSection() {
  return (
    <section id="atividades" className="py-24 bg-background">
      <div className="max-w-6xl mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-16">
          <span className="text-sm font-bold uppercase tracking-widest text-primary">Interatividade</span>
          <h2 className="mt-2 text-4xl md:text-5xl font-extrabold text-foreground text-balance">
            Atividades Lúdicas
          </h2>
          <p className="mt-4 text-base text-muted-foreground max-w-xl mx-auto text-pretty">
            Recursos interativos desenvolvidos para estimular emoções, habilidades sociais e autoconhecimento
            de forma leve e divertida.
          </p>
        </div>

        {/* Cards grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {activities.map(({ emoji, title, description, href, color, badgeColor, tag }) => (
            <div
              key={title}
              className={`${color} rounded-3xl p-6 border border-white/60 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 flex flex-col gap-4 flex-1`}
            >
              {/* Icon + badge */}
              <div className="flex items-start justify-between">
                <div className="w-14 h-14 bg-white/70 rounded-2xl flex items-center justify-center text-3xl shadow-sm">
                  {emoji}
                </div>
                <span className={`text-xs font-bold px-3 py-1 rounded-full ${badgeColor}`}>{tag}</span>
              </div>

              {/* Text */}
              <div className="flex-1">
                <h3 className="font-bold text-lg text-foreground mb-1">{title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
              </div>

              {/* Button — opens in new tab */}
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 bg-white/80 hover:bg-white text-foreground font-bold text-sm px-5 py-2.5 rounded-2xl border border-white/60 hover:shadow-md transition-all duration-200"
              >
                <ExternalLink className="w-4 h-4" />
                Abrir atividade
              </a>
            </div>
          ))}
        </div>

        {/* Note + crédito */}
        <div className="mt-10 flex flex-col items-center gap-2">
          <p className="text-center text-xs text-muted-foreground">
            As atividades abrem em uma nova guia. Em breve mais conteúdos serão adicionados.
          </p>
          <p className="text-center text-xs text-muted-foreground">
            Atividades desenvolvidas por{" "}
            <a
              href="https://www.instagram.com/omateuspsi"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-primary hover:underline"
            >
              @omateuspsi
            </a>
            .
          </p>
        </div>
      </div>
    </section>
  )
}
