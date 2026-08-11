import { UserCheck, Brain, Layers, Building2, HeartHandshake } from "lucide-react"

const differentials = [
  {
    icon: UserCheck,
    title: "Atendimento individualizado",
    description:
      "Cada criança é acompanhada de forma individualizada, considerando suas necessidades, características, potencialidades e objetivos terapêuticos.",
    color: "text-[oklch(0.45_0.13_230)]",
    bg: "bg-[oklch(0.86_0.07_230)]",
  },
  {
    icon: Brain,
    title: "Experiência com crianças neurodivergentes",
    description:
      "Experiência no atendimento de crianças com TEA e outras condições do neurodesenvolvimento, respeitando as particularidades de cada criança.",
    color: "text-[oklch(0.42_0.13_295)]",
    bg: "bg-[oklch(0.82_0.07_295)]",
  },
  {
    icon: Layers,
    title: "Abordagem integrada",
    description:
      "Olhar para os aspectos emocionais, sociais, comportamentais e do desenvolvimento, considerando a criança de forma ampla.",
    color: "text-[oklch(0.4_0.12_175)]",
    bg: "bg-[oklch(0.86_0.07_175)]",
  },
  {
    icon: Building2,
    title: "Vivência multidisciplinar",
    description:
      "Experiência em clínicas com atuação conjunta de profissionais de diferentes áreas, como fonoaudiologia, terapia ocupacional e psicopedagogia.",
    color: "text-[oklch(0.45_0.12_55)]",
    bg: "bg-[oklch(0.88_0.08_55)]",
  },
  {
    icon: HeartHandshake,
    title: "Vivência em equoterapia",
    description:
      "Experiência prática em equoterapia, ampliando o repertório de estratégias utilizadas no acompanhamento e desenvolvimento infantil.",
    color: "text-[oklch(0.4_0.12_175)]",
    bg: "bg-[oklch(0.88_0.07_175)]",
  },
]

export function DifferentialsSection() {
  return (
    <section className="py-24 bg-gradient-to-br from-[oklch(0.94_0.05_220)] to-[oklch(0.93_0.06_175)]">
      <div className="max-w-6xl mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-16">
          <span className="text-sm font-bold uppercase tracking-widest text-primary">Por que me escolher</span>
          <h2 className="mt-2 text-4xl md:text-5xl font-extrabold text-foreground text-balance">
            Meus diferenciais
          </h2>
        </div>

        {/* Horizontal scroll on mobile, grid on desktop */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-5">
          {differentials.map(({ icon: Icon, title, description, color, bg }) => (
            <div
              key={title}
              className="bg-white/80 backdrop-blur-sm rounded-3xl p-6 border border-white/60 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 flex flex-col gap-4"
            >
              <div className={`${bg} w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm`}>
                <Icon className={`w-6 h-6 ${color}`} />
              </div>
              <div>
                <h3 className="font-bold text-base text-foreground leading-snug mb-2">{title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
