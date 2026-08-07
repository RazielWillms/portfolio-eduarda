import { Baby, Puzzle, SmilePlus, Users, HeartHandshake, Gamepad2 } from "lucide-react"

const specialties = [
  {
    icon: Baby,
    title: "Atendimento Psicológico Infantil",
    description:
      "Acompanhamento clínico individualizado para crianças em diferentes fases do desenvolvimento, com foco no bem-estar emocional.",
    color: "bg-[oklch(0.93_0.05_230)]",
    iconColor: "text-[oklch(0.45_0.13_230)]",
    iconBg: "bg-[oklch(0.86_0.07_230)]",
  },
  {
    icon: Puzzle,
    title: "Transtorno do Espectro Autista (TEA)",
    description:
      "Intervenção especializada com abordagens baseadas em evidências, respeitando as singularidades e o potencial de cada criança.",
    color: "bg-[oklch(0.93_0.04_295)]",
    iconColor: "text-[oklch(0.42_0.13_295)]",
    iconBg: "bg-[oklch(0.82_0.07_295)]",
  },
  {
    icon: SmilePlus,
    title: "Desenvolvimento Emocional",
    description:
      "Estímulo ao reconhecimento e à expressão saudável das emoções, fortalecendo a inteligência emocional desde cedo.",
    color: "bg-[oklch(0.94_0.05_55)]",
    iconColor: "text-[oklch(0.45_0.12_55)]",
    iconBg: "bg-[oklch(0.88_0.08_55)]",
  },
  {
    icon: Users,
    title: "Habilidades Sociais",
    description:
      "Desenvolvimento de competências relacionais como comunicação, empatia, cooperação e resolução de conflitos.",
    color: "bg-[oklch(0.93_0.05_175)]",
    iconColor: "text-[oklch(0.4_0.12_175)]",
    iconBg: "bg-[oklch(0.86_0.07_175)]",
  },
  {
    icon: HeartHandshake,
    title: "Orientação Parental",
    description:
      "Suporte e orientação para famílias, fortalecendo vínculos e oferecendo estratégias para lidar com desafios do dia a dia.",
    color: "bg-[oklch(0.94_0.04_10)]",
    iconColor: "text-[oklch(0.45_0.12_10)]",
    iconBg: "bg-[oklch(0.88_0.07_10)]",
  },
  {
    icon: Gamepad2,
    title: "Estimulação Lúdica e Terapêutica",
    description:
      "Uso do brincar como linguagem terapêutica, potencializando aprendizado, criatividade e desenvolvimento global.",
    color: "bg-[oklch(0.93_0.04_270)]",
    iconColor: "text-[oklch(0.42_0.12_270)]",
    iconBg: "bg-[oklch(0.84_0.07_270)]",
  },
]

export function SpecialtiesSection() {
  return (
    <section id="especialidades" className="py-24 bg-muted/30">
      <div className="max-w-6xl mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-16">
          <span className="text-sm font-bold uppercase tracking-widest text-primary">Especialidades</span>
          <h2 className="mt-2 text-4xl md:text-5xl font-extrabold text-foreground text-balance">
            Áreas de atuação
          </h2>
          <p className="mt-4 text-base text-muted-foreground max-w-xl mx-auto text-pretty">
            Cada criança é única. Por isso, o atendimento é adaptado às necessidades individuais, sempre com base
            científica e cuidado humanizado.
          </p>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {specialties.map(({ icon: Icon, title, description, color, iconColor, iconBg }) => (
            <div
              key={title}
              className={`${color} rounded-3xl p-7 border border-white/60 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 group`}
            >
              <div className={`${iconBg} w-12 h-12 rounded-2xl flex items-center justify-center mb-5 shadow-sm`}>
                <Icon className={`w-6 h-6 ${iconColor}`} />
              </div>
              <h3 className="font-bold text-lg text-foreground mb-2 leading-snug">{title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
