import { Shield } from 'lucide-react'
import Image from 'next/image'

import { EnsNameChecker } from '../../../components/ens-name-checker'

export function HeroSection() {
  return (
    <section
      id="start"
      className="relative flex min-h-[calc(100vh-4rem)] items-center justify-center overflow-hidden pt-60 pb-20 lg:pt-20"
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
          <div className="mt-8 flex w-full max-w-xl gap-4 lg:mt-10 lg:gap-8">
            {/* Built at */}
            <div className="flex flex-col items-center gap-2">
              <div className="flex h-14 items-center lg:h-24">
                <Image
                  src="/eth-global-logo.png"
                  alt="ETHGlobal New York"
                  width={460}
                  height={50}
                  className="h-14 w-auto lg:h-24"
                />
              </div>
              <p className="text-muted-foreground text-xs font-medium tracking-widest uppercase">
                Built at
              </p>
            </div>

            <div className="bg-muted-foreground/30 w-px self-stretch" />

            {/* Powered by */}
            <div className="flex flex-1 flex-col items-center gap-2">
              <div className="flex h-14 w-full items-center justify-between lg:h-24">
                <div className="flex items-center gap-1 lg:gap-1.5">
                  <Image
                    src="/ens-logo.png"
                    alt="ENS"
                    width={40}
                    height={40}
                    className="h-5 w-5 object-contain lg:h-8 lg:w-8"
                  />
                  <span className="text-sm font-semibold lg:text-lg">ENS</span>
                </div>
                <div className="flex h-full items-center">
                  <Image
                    src="/privy-logo.png"
                    alt="Privy"
                    width={120}
                    height={32}
                    className="h-10 w-auto object-contain lg:h-16"
                  />
                </div>
                <div className="flex items-center gap-1 lg:gap-1.5">
                  <Shield className="h-5 w-5 opacity-80 lg:h-7 lg:w-7" />
                  <span className="text-sm font-semibold opacity-80 lg:text-lg">
                    Safe
                  </span>
                </div>
              </div>
              <p className="text-muted-foreground text-xs font-medium tracking-widest uppercase">
                Powered by
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
