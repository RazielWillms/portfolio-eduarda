import { ExternalLink } from "lucide-react"

const activities = [
  {
    emoji: "😊",
    title: "Jogo das Emoções",
    description: "Identificação e expressão das emoções básicas de forma divertida e interativa.",
    href: "/atividades/emocoes/index.html",
    color: "bg-[oklch(0.94_0.05_55)]",
    badgeColor: "bg-[oklch(0.88_0.08_55)] text-[oklch(0.28_0.1_55)]",
    tag: "Emoções",
  },
  {
    emoji: "🔢",
    title: "Sequência Lógica",
    description: "Estimulação do raciocínio lógico e ordenação por meio de sequências visuais.",
    href: "/atividades/sequencia/index.html",
    color: "bg-[oklch(0.93_0.04_270)]",
    badgeColor: "bg-[oklch(0.84_0.07_270)] text-[oklch(0.28_0.1_270)]",
    tag: "Cognição",
  },
  {
    emoji: "🧠",
    title: "Memória Visual",
    description: "Fortalecimento da memória e atenção por meio de jogos de associação de imagens.",
    href: "/atividades/memoria/index.html",
    color: "bg-[oklch(0.93_0.04_295)]",
    badgeColor: "bg-[oklch(0.82_0.07_295)] text-[oklch(0.28_0.1_295)]",
    tag: "Memória",
  },
  {
    emoji: "💭",
    title: "Identificando Sentimentos",
    description: "Reconhecimento de sentimentos em situações cotidianas para maior autoconhecimento.",
    href: "/atividades/sentimentos/index.html",
    color: "bg-[oklch(0.94_0.04_10)]",
    badgeColor: "bg-[oklch(0.88_0.07_10)] text-[oklch(0.28_0.1_10)]",
    tag: "Autoconhecimento",
  },
  {
    emoji: "🎯",
    title: "Atenção e Concentração",
    description: "Atividades de foco visual e concentração que estimulam a autorregulação.",
    href: "/atividades/atencao/index.html",
    color: "bg-[oklch(0.93_0.05_230)]",
    badgeColor: "bg-[oklch(0.86_0.07_230)] text-[oklch(0.28_0.1_230)]",
    tag: "Atenção",
  },
  {
    emoji: "🖐️",
    title: "Coordenação e Associação",
    description: "Atividades que desenvolvem coordenação motora fina e associação de conceitos.",
    href: "/atividades/coordenacao/index.html",
    color: "bg-[oklch(0.93_0.05_175)]",
    badgeColor: "bg-[oklch(0.86_0.07_175)] text-[oklch(0.28_0.1_175)]",
    tag: "Motor",
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
            Recursos interativos desenvolvidos para estimular atenção, linguagem, percepção, emoções e habilidades
            cognitivas de forma leve e divertida.
          </p>
        </div>

        {/* Cards grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {activities.map(({ emoji, title, description, href, color, badgeColor, tag }) => (
            <div
              key={title}
              className={`${color} rounded-3xl p-6 border border-white/60 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 flex flex-col gap-4`}
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

              {/* Button */}
              <a
                href={href}
                className="inline-flex items-center justify-center gap-2 bg-white/80 hover:bg-white text-foreground font-bold text-sm px-5 py-2.5 rounded-2xl border border-white/60 hover:shadow-md transition-all duration-200"
              >
                <ExternalLink className="w-4 h-4" />
                Abrir atividade
              </a>
            </div>
          ))}
        </div>

        {/* Note */}
        <p className="mt-10 text-center text-xs text-muted-foreground">
          As atividades são abertas em uma nova página. Em breve mais conteúdos serão adicionados.
        </p>
      </div>
    </section>
  )
}
