import { Navbar } from "@/components/navbar"
import { HeroSection } from "@/components/hero-section"
import { AboutSection } from "@/components/about-section"
import { SpecialtiesSection } from "@/components/specialties-section"
import { ActivitiesSection } from "@/components/activities-section"
import { DifferentialsSection } from "@/components/differentials-section"
import { ContactSection } from "@/components/contact-section"
import { Footer } from "@/components/footer"
import { ActivitiesPreview } from "@/components/activities-preview"

export default function HomePage() {
  return (
    <main>
      <Navbar />
      <HeroSection />
      <AboutSection />
      <SpecialtiesSection />
      <ActivitiesPreview />
      <DifferentialsSection />
      <ContactSection />
      <Footer />
    </main>
  )
}
