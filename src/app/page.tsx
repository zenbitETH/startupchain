import { FeaturesSection } from '@/components/features-section'
import { Footer } from '@/components/footer'
import { HeroSection } from '@/components/hero-section'
import { Navbar } from '@/components/navbar'

export default function Home() {
  return (
    <div className="from-background via-background to-primary/5 min-h-screen bg-gradient-to-br">
      <Navbar />
      <HeroSection />
      <FeaturesSection />
      <Footer />
    </div>
  )
}
