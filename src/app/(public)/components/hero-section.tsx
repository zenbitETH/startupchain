import { EnsNameChecker } from '../../../components/ens-name-checker'

export function HeroSection() {
  return (
    <section className="relative flex min-h-[calc(100vh-4rem)] items-end overflow-hidden lg:items-center">
      <div className="relative mx-auto w-full max-w-7xl px-4 py-12 pb-32 sm:px-6 sm:pb-36 md:pb-15 lg:px-8 lg:py-20">
        <div className="text-center lg:max-w-3xl lg:text-left">
          {/* Main Headline */}
          <h1 className="text-foreground mb-6 text-4xl font-semibold tracking-tight md:text-6xl lg:text-7xl">
            Build your business
            <br />
            <span className="from-primary via-secondary to-primary animate-gradient-x bg-gradient-to-r bg-clip-text text-transparent">
              onchain
            </span>
          </h1>

          <EnsNameChecker />

          {/* Social Proof */}
          <div className="flex flex-wrap items-center justify-center gap-8 opacity-60 lg:justify-start">
            <div className="text-muted-foreground text-sm">Powered by</div>
            <div className="flex items-center gap-6">
              <div className="text-lg font-semibold">ENS</div>
              <div className="text-lg font-semibold">Privy</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
