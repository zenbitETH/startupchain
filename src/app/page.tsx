import { FeaturesSection } from '@/components/features-section'
import { Footer } from '@/components/footer'
import { HeroSection } from '@/components/hero-section'
import { Navbar } from '@/components/navbar'
import AnimatedRocket from '../components/AnimatedRocket'

export default function Home() {
  return (
    <div className="from-background via-background to-primary/5 relative min-h-screen overflow-hidden bg-gradient-to-br">
      <Navbar />
       <AnimatedRocket
        animated={true}
        speedLines={true}
        className="scroll-effect pointer-events-none fixed top-7 left-1/2 z-0 size-80 -translate-x-1/2 opacity-90 sm:size-150 lg:top-0 lg:size-160 xl:top-1/2 xl:right-0 xl:left-auto xl:size-200 xl:translate-x-20 xl:-translate-y-1/2"
      />
      <HeroSection />
      <FeaturesSection />
      <Footer />
    </div>
  )
}
