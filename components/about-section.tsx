import { GraduationCap, Puzzle, Leaf, HeartHandshake, Stethoscope, Heart } from "lucide-react"

const credentials = [
  {
    icon: GraduationCap,
    label: "Formação em Psicologia",
    color: "bg-[oklch(0.86_0.07_230)] text-[oklch(0.25_0.1_230)]",
  },
  {
    icon: Puzzle,
    label: "Especialização em TEA",
    color: "bg-[oklch(0.82_0.07_295)] text-[oklch(0.25_0.1_295)]",
  },
  {
    icon: HeartHandshake,
    label: "Equoterapia",
    color: "bg-[oklch(0.88_0.07_175)] text-[oklch(0.25_0.1_175)]",
  },
  {
    icon: Stethoscope,
    label: "Atendimento Clínico Infantil",
    color: "bg-[oklch(0.88_0.08_55)] text-[oklch(0.28_0.08_55)]",
  },
]

export function AboutSection() {
  return (
    <section id="sobre" className="py-24 bg-background">
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Photo side */}
          <div className="hidden lg:block relative">
            <div
              className="absolute inset-0 rounded-[3rem] translate-x-4 translate-y-4"
              style={{ background: "oklch(0.88 0.07 175)", opacity: 0.4 }}
            />
            <div className="relative w-full aspect-[3/4] max-w-sm mx-auto rounded-[3rem] overflow-hidden shadow-xl border-4 border-white">
              <img
                src="/eduarda.jpg"
                alt="Eduarda — Psicóloga Infantil"
                className="w-full h-full object-cover object-top"
              />
            </div>
          </div>

          {/* Text side */}
          <div className="space-y-8">
            <div>
              <span className="text-sm font-bold uppercase tracking-widest text-primary">Sobre mim</span>
              <h2 className="mt-2 text-4xl md:text-5xl font-extrabold leading-tight text-foreground text-balance">
                Um cuidado com propósito
              </h2>
            </div>

            <p className="text-base text-muted-foreground leading-relaxed">
              Psicóloga formada, com especializações voltadas ao atendimento de crianças com Transtorno do Espectro
              Autista (TEA) e desenvolvimento infantil. Possuo experiência em acompanhamento clínico infantil, atuação
              em clínicas multidisciplinares e vivência profissional em equoterapia, utilizando abordagens que
              valorizam o vínculo, a comunicação e o desenvolvimento global da criança.
            </p>

            <p className="text-base text-muted-foreground leading-relaxed">
              A abordagem ABA é utilizada de forma individualizada para favorecer o desenvolvimento global da criança, 
              respeitando suas necessidades, potencialidades e seu ritmo de crescimento, em um ambiente acolhedor, seguro e estruturado.
            </p>

            {/* Credential chips */}
            <div className="flex flex-wrap gap-3">
              {credentials.map(({ icon: Icon, label, color }) => (
                <div
                  key={label}
                  className={`inline-flex items-center gap-2 ${color} rounded-2xl px-4 py-2.5 text-sm font-semibold`}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  {label}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
