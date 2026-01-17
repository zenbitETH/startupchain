import { Shield, Wallet } from 'lucide-react'
import Image from 'next/image'

import AnimatedRocket from '@/app/(public)/components/AnimatedRocket/AnimatedRocket'

import { EnsNameChecker } from '../../../components/ens-name-checker'

export function HeroSection() {
  return (
    <section
      id="start"
      className="relative flex min-h-[calc(100vh-4rem)] items-center justify-center overflow-hidden pt-14 pb-16 md:pt-20 md:pb-32"
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
          <p className="text-muted-foreground mt-4 max-w-2xl text-lg leading-relaxed md:mt-6 md:text-xl">
            The all-in-one operating system for your company. Secure your
            identity, manage treasury, and issue tokens in minutes.
          </p>

          <AnimatedRocket
            animated={true}
            speedLines={true}
            scrollEffect={true}
            className="pointer-events-none relative z-0 mt-10 size-80 sm:mt-12 sm:size-96 lg:fixed lg:top-1/2 lg:-right-[5%] lg:left-auto lg:mt-0 lg:size-160 lg:translate-x-15 lg:-translate-y-1/2 xl:size-200"
          />

          <div className="mt-8 w-full max-w-xl md:mt-12">
            <EnsNameChecker />
          </div>

          <div className="mt-12 flex flex-col gap-8 lg:mt-24">
            {/* Built at ETHGlobal */}
            <div className="flex flex-col items-center gap-4 lg:items-start">
              <p className="text-muted-foreground text-xs font-medium tracking-widest uppercase">
                Built at
              </p>
              <div className="relative h-14 w-48 opacity-80 transition-opacity hover:opacity-100">
                <Image
                  src="/eth-global.png"
                  alt="ETHGlobal"
                  fill
                  className="object-contain object-center invert lg:object-left"
                />
              </div>
            </div>

            {/* Partners */}
            <div className="flex flex-col items-center gap-4 lg:items-start">
              <p className="text-muted-foreground text-xs font-medium tracking-widest uppercase">
                Powered by industry leaders
              </p>
              <div className="flex flex-wrap items-center justify-center gap-12 lg:justify-start">
                <div className="relative h-6 w-20 opacity-80 transition-opacity hover:opacity-100 sm:h-7 sm:w-24">
                  <Image
                    src="/ens-logo.png"
                    alt="ENS"
                    fill
                    className="object-contain brightness-0 invert lg:object-left"
                  />
                </div>
                <div className="flex items-center gap-2 opacity-80 transition-opacity hover:opacity-100">
                  <Wallet className="h-6 w-6" />
                  <span className="text-xl font-semibold">Privy</span>
                </div>
                <div className="flex items-center gap-2 opacity-80 transition-opacity hover:opacity-100">
                  <Shield className="h-6 w-6" />
                  <span className="text-xl font-semibold">Safe</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
