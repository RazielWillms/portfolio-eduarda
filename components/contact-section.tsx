import { MessageCircle, Mail, Instagram, MapPin, Clock } from "lucide-react"

export function ContactSection() {
  const whatsappUrl = "https://wa.me/5500000000000?text=Olá! Gostaria de agendar um atendimento."

  return (
    <section id="contato" className="py-24 bg-background">
      <div className="max-w-6xl mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-16">
          <span className="text-sm font-bold uppercase tracking-widest text-primary">Entre em contato</span>
          <h2 className="mt-2 text-4xl md:text-5xl font-extrabold text-foreground text-balance">
            Vamos conversar
          </h2>
          <p className="mt-4 text-base text-muted-foreground max-w-lg mx-auto text-pretty">
            Estou disponível para tirar dúvidas e agendar uma conversa inicial sem compromisso. O primeiro passo pode
            ser uma mensagem.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
          {/* Contact info */}
          <div className="space-y-5">
            {/* WhatsApp */}
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-4 bg-[oklch(0.93_0.05_175)] rounded-3xl p-5 border border-white/60 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group"
            >
              <div className="w-12 h-12 bg-[oklch(0.62_0.18_145)] rounded-2xl flex items-center justify-center shadow-sm flex-shrink-0">
                <MessageCircle className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">WhatsApp</p>
                <p className="font-bold text-foreground group-hover:text-primary transition-colors">
                  (00) 00000-0000
                </p>
              </div>
            </a>

            {/* E-mail */}
            <a
              href="mailto:contato@eduarda.psi.br"
              className="flex items-center gap-4 bg-[oklch(0.93_0.05_230)] rounded-3xl p-5 border border-white/60 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group"
            >
              <div className="w-12 h-12 bg-[oklch(0.62_0.13_220)] rounded-2xl flex items-center justify-center shadow-sm flex-shrink-0">
                <Mail className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">E-mail</p>
                <p className="font-bold text-foreground group-hover:text-primary transition-colors">
                  contato@eduarda.psi.br
                </p>
              </div>
            </a>

            {/* Instagram */}
            <a
              href="https://instagram.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-4 bg-[oklch(0.93_0.04_295)] rounded-3xl p-5 border border-white/60 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group"
            >
              <div className="w-12 h-12 bg-[oklch(0.55_0.18_310)] rounded-2xl flex items-center justify-center shadow-sm flex-shrink-0">
                <Instagram className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Instagram</p>
                <p className="font-bold text-foreground group-hover:text-primary transition-colors">
                  @eduarda.psi
                </p>
              </div>
            </a>

            {/* Endereço */}
            <div className="flex items-center gap-4 bg-[oklch(0.94_0.04_55)] rounded-3xl p-5 border border-white/60">
              <div className="w-12 h-12 bg-[oklch(0.65_0.14_55)] rounded-2xl flex items-center justify-center shadow-sm flex-shrink-0">
                <MapPin className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Endereço</p>
                <p className="font-bold text-foreground">Clínica — a definir</p>
                <p className="text-sm text-muted-foreground">Sua cidade, Estado</p>
              </div>
            </div>

            {/* Horário */}
            <div className="flex items-center gap-4 bg-muted/50 rounded-3xl p-5 border border-white/60">
              <div className="w-12 h-12 bg-muted rounded-2xl flex items-center justify-center shadow-sm flex-shrink-0">
                <Clock className="w-6 h-6 text-muted-foreground" />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Horário de atendimento</p>
                <p className="font-bold text-foreground">Segunda a Sexta</p>
                <p className="text-sm text-muted-foreground">08h às 18h</p>
              </div>
            </div>
          </div>

          {/* CTA Card */}
          <div className="bg-gradient-to-br from-[oklch(0.94_0.05_220)] to-[oklch(0.92_0.06_175)] rounded-3xl p-10 border border-white/60 shadow-md flex flex-col items-center text-center gap-6">
            <div className="text-6xl">🌿</div>
            <div>
              <h3 className="text-2xl font-extrabold text-foreground">Pronta para dar o primeiro passo?</h3>
              <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
                Agende uma conversa inicial e descubra como posso ajudar no desenvolvimento da sua criança. Não há
                compromisso — só cuidado.
              </p>
            </div>
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-3 bg-[oklch(0.62_0.18_145)] text-white font-extrabold text-base px-8 py-4 rounded-2xl hover:opacity-90 transition-all hover:-translate-y-0.5 shadow-lg hover:shadow-xl w-full justify-center"
            >
              <MessageCircle className="w-5 h-5" />
              Agendar pelo WhatsApp
            </a>
            <p className="text-xs text-muted-foreground">Responderei em até 24 horas úteis.</p>
          </div>
        </div>
      </div>
    </section>
  )
}
