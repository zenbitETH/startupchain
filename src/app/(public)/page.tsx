import dynamic from 'next/dynamic'

import AnimatedRocket from '@/components/home/AnimatedRocket/AnimatedRocket'
import { FeaturesSection } from '@/components/home/features-section'
import { Footer } from '@/components/home/footer'
import { NavbarServer } from '@/components/navigation/navbar-server'

import { HeroSection } from '../../components/home/hero-section'

export default function Home() {
  return (
    <div className="from-background via-background to-primary/5 relative min-h-screen overflow-hidden bg-gradient-to-br">
      <NavbarServer />
      <AnimatedRocket
        animated={true}
        speedLines={true}
        scrollEffect={true}
        className="scroll-effect pointer-events-none fixed top-7 left-1/2 z-0 size-80 -translate-x-1/2 sm:size-150 lg:top-1/2 lg:right-0 lg:left-auto lg:size-160 lg:translate-x-15 lg:-translate-y-1/2 xl:size-200"
      />
      <HeroSection />
      <FeaturesSection />
      <Footer />
    </div>
  )
}
