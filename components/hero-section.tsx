import { MessageCircle, Gamepad2, Star, Heart } from "lucide-react"

export function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden bg-gradient-to-br from-[oklch(0.94_0.05_220)] via-[oklch(0.95_0.04_200)] to-[oklch(0.93_0.06_175)]">
      {/* Decorative blobs */}
      <div
        className="absolute top-20 left-10 w-72 h-72 rounded-full opacity-30 pointer-events-none"
        style={{ background: "oklch(0.82 0.07 295)", filter: "blur(60px)" }}
      />
      <div
        className="absolute bottom-20 right-10 w-80 h-80 rounded-full opacity-25 pointer-events-none"
        style={{ background: "oklch(0.88 0.07 175)", filter: "blur(70px)" }}
      />
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full opacity-15 pointer-events-none"
        style={{ background: "oklch(0.86 0.07 230)", filter: "blur(80px)" }}
      />

      <div className="relative z-10 max-w-6xl mx-auto px-6 py-32 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        {/* Text content */}
        <div className="space-y-8 animate-fade-in-up">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-white/70 backdrop-blur-sm border border-border/40 rounded-full px-4 py-2 text-sm font-semibold text-primary shadow-sm">
            <Star className="w-4 h-4 fill-primary text-primary" />
            Especialista em TEA e Desenvolvimento Infantil
          </div>

          {/* Main heading */}
          <div>
            <h1 className="text-5xl md:text-6xl font-extrabold leading-tight text-foreground text-balance">
              Psicóloga{" "}
              <span
                className="relative inline-block"
                style={{
                  background: "linear-gradient(135deg, oklch(0.62 0.13 220), oklch(0.62 0.12 175))",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                Infantil
              </span>
            </h1>
            <p className="mt-4 text-lg md:text-xl text-muted-foreground leading-relaxed max-w-lg text-pretty">
              Cuidando do desenvolvimento emocional e social das crianças com acolhimento, respeito e evidências
              científicas.
            </p>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-wrap gap-4">
            <a
              href="#contato"
              className="inline-flex items-center gap-2 bg-primary text-primary-foreground font-bold px-6 py-3.5 rounded-2xl hover:opacity-90 transition-all hover:shadow-lg hover:-translate-y-0.5 shadow-md"
            >
              <MessageCircle className="w-5 h-5" />
              Agendar Atendimento
            </a>
            <a
              href="/atividades"
              className="inline-flex items-center gap-2 bg-white/80 text-foreground font-bold px-6 py-3.5 rounded-2xl border border-border/40 hover:bg-white transition-all hover:-translate-y-0.5 shadow-sm hover:shadow-md"
            >
              <Gamepad2 className="w-5 h-5 text-primary" />
              Atividades Lúdicas
            </a>
          </div>

          {/* Stats */}
          <div className="flex gap-8 pt-2">
            <div>
              <div className="text-3xl font-extrabold text-foreground">+3 anos</div>
              <p className="text-xs text-muted-foreground mt-1">de experiência {/*clínica*/}</p>
            </div>
            <div className="w-px bg-border" />
            <div>
              <div className="text-3xl font-extrabold text-foreground">TEA</div>
              <p className="text-xs text-muted-foreground mt-1">especialização em ABA</p>
            </div>
            <div className="w-px bg-border" />
            <div>
              <div className="text-3xl font-extrabold text-foreground">
                <Heart className="w-8 h-8 text-rose-400 inline" />
              </div>
              <p className="text-xs text-muted-foreground mt-1">atendimento humanizado</p>
            </div>
          </div>
        </div>

        {/* Photo card */}
        <div className="flex justify-center lg:justify-end animate-fade-in-up delay-200">
          <div className="relative">
            {/* Floating decorative elements */}
            <div className="animate-float absolute -top-4 -left-4 bg-white shadow-md rounded-2xl px-4 py-2 flex items-center gap-2 z-20">
              <span className="text-2xl">🧩</span>
              <div>
                <p className="text-xs font-bold text-foreground">Especialista</p>
                <p className="text-xs text-muted-foreground">em TEA</p>
              </div>
            </div>
            <div className="animate-float delay-200 absolute -bottom-4 -right-4 bg-white shadow-md rounded-2xl px-4 py-2 flex items-center gap-2 z-20">
              <span className="text-2xl">🧠</span>
              <div>
                <p className="text-xs font-bold text-foreground">ABA</p>
                <p className="text-xs text-muted-foreground">experiência</p>
              </div>
            </div>

            {/* Photo */}
            <div
              className="relative w-80 h-96 rounded-[2.5rem] overflow-hidden shadow-2xl border-4 border-white"
              style={{ background: "linear-gradient(145deg, oklch(0.86 0.07 230), oklch(0.88 0.07 175))" }}
            >
              <img
                src="/Eduarda-Hero-Section2.jpeg"
                alt="Eduarda, psicóloga infantil especialista em TEA"
                className="w-full h-full object-cover object-top"
              />
              {/* Name overlay */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/50 to-transparent p-6 pb-10">
                <p className="text-white font-extrabold text-xl">Eduarda</p>
                <p className="text-white/80 text-sm">Psicóloga Infantil · CRP 07/39525</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
