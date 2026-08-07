import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Decorative blob shapes */}
      <div className="blob-shape w-[600px] h-[600px] -top-48 -left-48" />
      <div className="blob-shape w-[500px] h-[500px] -bottom-32 -right-32" />
      <div className="blob-shape w-[400px] h-[400px] top-1/2 -right-48" />

      <div className="relative z-10 p-4 md:p-8">
        {/* Header */}
        <header className="bg-card/80 backdrop-blur-sm rounded-2xl p-4 mb-4 md:mb-6 border border-border/50">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
              <ArrowLeft className="h-5 w-5" />
              <span className="text-sm font-medium">Back to Portfolio</span>
            </Link>
            <nav className="flex items-center gap-8">
              <Link href="/about" className="text-sm font-medium text-primary">
                About
              </Link>
              <Link href="/contact" className="text-sm font-medium hover:text-primary transition-colors">
                Contact
              </Link>
            </nav>
          </div>
        </header>

        <div className="max-w-4xl mx-auto">
          <div className="bg-card/60 backdrop-blur-sm rounded-2xl p-8 md:p-12 border border-border/50 space-y-8">
            <div className="flex flex-col md:flex-row items-start gap-8">
              <Avatar className="h-32 w-32 flex-shrink-0">
                <AvatarImage src="/placeholder.svg?height=128&width=128" alt="Fons Mans" />
                <AvatarFallback className="text-4xl">FM</AvatarFallback>
              </Avatar>
              <div className="space-y-4">
                <h1 className="text-4xl md:text-5xl font-bold text-balance">About Me</h1>
                <p className="text-xl text-muted-foreground">Designer based in Rotterdam, The Netherlands</p>
              </div>
            </div>

            <div className="space-y-6 text-base leading-relaxed">
              <p>
                Hi, I'm Fons Mans, a multidisciplinary designer passionate about creating beautiful and functional
                digital experiences. With over 8 years of experience in the design industry, I specialize in web design,
                product design, and visual identity.
              </p>

              <p>
                My work is driven by a deep curiosity for how design can solve complex problems and create meaningful
                connections between people and technology. I believe in the power of simplicity, attention to detail,
                and thoughtful interactions.
              </p>

              <p>
                Based in Rotterdam, I work with clients worldwide, helping startups and established companies bring
                their visions to life through design. When I'm not designing, you can find me exploring new creative
                techniques, experimenting with generative art, or enjoying the vibrant culture of The Netherlands.
              </p>

              <div className="pt-6 border-t border-border/50">
                <h2 className="text-2xl font-semibold mb-4">Skills & Expertise</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-medium mb-2">Design</h3>
                    <ul className="space-y-1 text-muted-foreground">
                      <li>UI/UX Design</li>
                      <li>Visual Design</li>
                      <li>Brand Identity</li>
                      <li>Design Systems</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-medium mb-2">Tools</h3>
                    <ul className="space-y-1 text-muted-foreground">
                      <li>Figma</li>
                      <li>Adobe Creative Suite</li>
                      <li>Framer</li>
                      <li>Webflow</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-border/50">
                <h2 className="text-2xl font-semibold mb-4">Experience</h2>
                <div className="space-y-6">
                  <div>
                    <h3 className="font-medium">Senior Product Designer</h3>
                    <p className="text-sm text-muted-foreground mb-2">Tech Startup • 2022 - Present</p>
                    <p className="text-sm">
                      Leading design initiatives for a fast-growing SaaS platform, focusing on user experience and
                      product strategy.
                    </p>
                  </div>
                  <div>
                    <h3 className="font-medium">Freelance Designer</h3>
                    <p className="text-sm text-muted-foreground mb-2">Self-employed • 2018 - Present</p>
                    <p className="text-sm">
                      Working with diverse clients on web design, branding, and digital product design projects.
                    </p>
                  </div>
                  <div>
                    <h3 className="font-medium">UI Designer</h3>
                    <p className="text-sm text-muted-foreground mb-2">Creative Agency • 2017 - 2022</p>
                    <p className="text-sm">
                      Designed user interfaces for web and mobile applications across various industries.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
