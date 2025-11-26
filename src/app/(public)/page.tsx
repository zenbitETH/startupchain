import AnimatedRocket from '@/app/(public)/components/AnimatedRocket/AnimatedRocket'
import { FeaturesSection } from '@/app/(public)/components/features-section'
import { Footer } from '@/app/(public)/components/footer'

import { Suspense } from 'react'

import { HeroSection } from './components/hero-section'
import { AutoAuthRedirect } from '@/app/(public)/components/auto-auth-redirect'

export default function Home() {
  return (
    <div className="from-background via-background to-primary/5 relative min-h-screen overflow-hidden bg-linear-to-br">
      <Suspense>
        <AutoAuthRedirect />
      </Suspense>
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
