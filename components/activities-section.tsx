import { ExternalLink } from "lucide-react"

const MATEUS_PSI = {
  name: "@omateuspsi",
  url: "https://www.instagram.com/omateuspsi",
};

const activities = [
  {
    emoji: "🦊",
    title: "Trilha das Habilidades Sociais",
    description:
      "Jogo de tabuleiro interativo para praticar comunicação, empatia e resolução de conflitos de forma lúdica e divertida.",
    author: MATEUS_PSI,
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
    author: MATEUS_PSI,
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
    author: MATEUS_PSI,
    href: "/atividades/balao-enchendo.html",
    color: "bg-[oklch(0.93_0.05_220)]",
    badgeColor: "bg-[oklch(0.87_0.07_220)] text-[oklch(0.28_0.1_220)]",
    tag: "Regulação Emocional",
  },
  {
    emoji: "🐵",
    title: "Zoo das Carinhas",
    description:
      "Jogo lúdico para reconhecer emoções como feliz, triste, bravo, assustado e surpreso, estimulando a percepção emocional, a atenção e a comunicação de sentimentos.",
    href: "/atividades/zoo-das-carinhas.html",
    color: "bg-[oklch(0.96_0.03_45)]",
    badgeColor:
      "bg-[oklch(0.90_0.05_45)] text-[oklch(0.38_0.12_35)]",
    tag: "Emoções",
  },
  {
    emoji: "🧺",
    title: "Caixa de Guardar",
    description:
      "Atividade interativa de arrastar e guardar objetos na caixa correta, desenvolvendo organização, categorização, atenção, coordenação motora e habilidades de seguir instruções.",
    href: "/atividades/caixa-de-guardar.html",
    color: "bg-[oklch(0.95_0.03_160)]",
    badgeColor:
      "bg-[oklch(0.89_0.05_160)] text-[oklch(0.34_0.11_160)]",
    tag: "Organização e Atenção",
  },
  {
    emoji: "🤖",
    title: "Robozinho Ajudante",
    description:
      "Jogo interativo de seguir comandos em sequência, estimulando atenção sustentada, memória de trabalho, planejamento, controle inibitório e outras funções executivas de forma divertida.",
    href: "/atividades/robozinho-ajudante.html",
    color: "bg-[oklch(0.95_0.03_250)]",
    badgeColor:
      "bg-[oklch(0.88_0.05_250)] text-[oklch(0.32_0.10_250)]",
    tag: "Funções Executivas",
  },
];

export function ActivitiesSection() {
  return (
    <section id="atividades" className="py-20 bg-[oklch(0.985_0.01_95)]">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
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
          {activities.map(
            ({ emoji, title, description, author, href, color, badgeColor, tag }) => (
              <div
                key={title}
                className={`${color} rounded-3xl p-6 border border-white/60 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 flex flex-col gap-4 flex-1`}
              >
                {/* Icon + badge */}
                <div className="flex items-start justify-between">
                  <div className="w-14 h-14 bg-white/70 rounded-2xl flex items-center justify-center text-3xl shadow-sm">
                    {emoji}
                  </div>

                  <span className={`text-xs font-bold px-3 py-1 rounded-full ${badgeColor}`}>
                    {tag}
                  </span>
                </div>

                {/* Text */}
                <div className="flex-1">
                  <h3 className="font-bold text-lg text-foreground mb-1">{title}</h3>

                  <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                    {description}
                  </p>

                  {author && (
                    <p className="text-xs text-muted-foreground">
                      Criado por{" "}
                      <a
                        href={author.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-semibold text-primary hover:underline"
                      >
                        {author.name}
                      </a>
                    </p>
                  )}
                </div>

                {/* Button */}
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
            )
          )}
        </div>

        {/* Note */}
        <div className="mt-10">
          <p className="text-center text-xs text-muted-foreground">
            As atividades abrem em uma nova guia. Em breve mais conteúdos serão adicionados.
          </p>
        </div>
      </div>
    </section>
  )
}
