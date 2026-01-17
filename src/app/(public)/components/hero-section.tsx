import { Shield, Wallet } from 'lucide-react'
import Image from 'next/image'

import { EnsNameChecker } from '../../../components/ens-name-checker'

export function HeroSection() {
  return (
    <section
      id="start"
      className="relative flex min-h-[calc(100vh-4rem)] items-center justify-center overflow-hidden pt-20 pb-32"
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

          <div className="mt-20 flex flex-col gap-8 lg:mt-24">
            {/* Built at ETHGlobal */}
            <div className="flex flex-col items-center gap-3 lg:items-start">
              <p className="text-muted-foreground text-xs font-medium tracking-widest uppercase">
                Built at
              </p>
              <div className="bg-card/30 border-border/50 hover:bg-card/50 flex items-center gap-3 rounded-xl border p-3 backdrop-blur-sm transition-colors">
                <div className="relative h-10 w-10">
                  <Image
                    src="/eth-global.png"
                    alt="ETHGlobal"
                    fill
                    className="object-contain invert"
                  />
                </div>
                <span className="font-medium">ETHGlobal New York</span>
              </div>
            </div>

            {/* Partners */}
            <div className="flex flex-col items-center gap-4 lg:items-start">
              <p className="text-muted-foreground text-xs font-medium tracking-widest uppercase">
                Powered by industry leaders
              </p>
              <div className="flex flex-wrap items-center justify-center gap-4 lg:justify-start">
                <div className="bg-card/30 border-border/50 hover:bg-card/50 flex items-center gap-3 rounded-xl border px-5 py-3 backdrop-blur-sm transition-all hover:scale-105">
                  <div className="relative h-6 w-6">
                    <Image
                      src="/ens-logo.png"
                      alt="ENS"
                      fill
                      className="object-contain brightness-0 invert"
                    />
                  </div>
                  <span className="font-semibold">ENS</span>
                </div>
                <div className="bg-card/30 border-border/50 hover:bg-card/50 flex items-center gap-3 rounded-xl border px-5 py-3 backdrop-blur-sm transition-all hover:scale-105">
                  <Wallet className="text-accent h-5 w-5" />
                  <span className="font-semibold">Privy</span>
                </div>
                <div className="bg-card/30 border-border/50 hover:bg-card/50 flex items-center gap-3 rounded-xl border px-5 py-3 backdrop-blur-sm transition-all hover:scale-105">
                  <Shield className="text-secondary h-5 w-5" />
                  <span className="font-semibold">Safe</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
