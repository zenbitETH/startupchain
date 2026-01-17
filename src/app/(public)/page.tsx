import { Suspense } from 'react'

import { AutoAuthRedirect } from '@/app/(public)/components/auto-auth-redirect'
import { FeaturesSection } from '@/app/(public)/components/features-section'
import { Footer } from '@/app/(public)/components/footer'

import { HeroSection } from './components/hero-section'

export default function Home() {
  return (
    <div className="from-background via-background to-primary/5 relative min-h-screen overflow-hidden bg-linear-to-br">
      <Suspense>
        <AutoAuthRedirect />
      </Suspense>
      <HeroSection />
      <FeaturesSection />
      <Footer />
    </div>
  )
}
