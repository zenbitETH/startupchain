import { Shield } from 'lucide-react'
import Image from 'next/image'

import { EnsNameChecker } from '../../../components/ens-name-checker'

export function HeroSection() {
  return (
    <section
      id="start"
      className="relative flex min-h-[calc(100vh-4rem)] items-center justify-center overflow-hidden pt-20 pb-20"
    >
      {/* Background Effects */}
      <div className="absolute inset-0 -z-10 h-full w-full bg-[linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] bg-[size:24px_24px] opacity-20" />
      <div className="bg-primary/20 absolute top-0 right-0 left-0 h-[500px] w-full rounded-full opacity-20 blur-[100px]" />

      <div className="relative mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center text-center lg:items-start lg:text-left">
          {/* Main Headline */}
          <h1 className="text-foreground mx-auto max-w-4xl text-5xl font-bold tracking-tight md:text-7xl lg:mx-0 lg:text-8xl">
            Build your business
            <br />
            <span className="from-primary via-accent to-secondary animate-gradient-x bg-gradient-to-r bg-clip-text pb-2 text-transparent">
              onchain
            </span>
          </h1>

          {/* Subheadline */}
          <p className="text-muted-foreground mt-6 max-w-2xl text-lg leading-relaxed md:text-xl">
            The all-in-one operating system for your company. Secure your
            identity, manage treasury, and issue tokens in minutes.
          </p>

          <div className="mt-12 w-full max-w-xl">
            <EnsNameChecker />
          </div>

          {/* Trust strip */}
          <div className="mt-12 flex flex-col items-center gap-4 lg:mt-16 lg:items-start">
            <p className="text-muted-foreground text-xs font-medium tracking-widest uppercase">
              Built at ETHGlobal &middot; Powered by
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <div className="bg-card/30 border-border/50 flex items-center gap-2.5 overflow-hidden rounded-xl border px-4 py-2.5 backdrop-blur-sm">
                <Image
                  src="/eth-global-logo.png"
                  alt="ETHGlobal New York"
                  width={120}
                  height={32}
                  className="h-6 w-auto"
                />
              </div>
              <div className="bg-border/50 hidden h-6 w-px sm:block" />
              <div className="bg-card/30 border-border/50 flex items-center gap-2 rounded-xl border px-4 py-2.5 backdrop-blur-sm">
                <div className="relative h-5 w-5">
                  <Image
                    src="/ens-logo.png"
                    alt="ENS"
                    fill
                    className="object-contain brightness-0 invert"
                  />
                </div>
                <span className="text-sm font-semibold">ENS</span>
              </div>
              <div className="bg-card/30 border-border/50 flex items-center gap-2 rounded-xl border px-4 py-2.5 backdrop-blur-sm">
                <Image
                  src="/privy-logo.png"
                  alt="Privy"
                  width={64}
                  height={18}
                  className="h-4 w-auto object-contain"
                />
              </div>
              <div className="bg-card/30 border-border/50 flex items-center gap-2 rounded-xl border px-4 py-2.5 backdrop-blur-sm">
                <Shield className="text-secondary h-4 w-4" />
                <span className="text-sm font-semibold">Safe</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
