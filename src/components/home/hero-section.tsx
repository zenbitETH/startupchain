import { GetStartedButton } from '../auth/get-started-button'

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

          {/* Call to Action */}
          <div className="mx-auto mb-13 max-w-2xl md:mb-15 lg:mx-0">
            <div className="bg-card border-border/50 rounded-2xl border p-8 shadow-2xl backdrop-blur-sm">
              <h3 className="text-foreground mb-4 text-xl font-medium">
                Ready to register your business name?
              </h3>
              <p className="text-muted-foreground mb-6 text-sm">
                Search for available ENS names and register your business on the Ethereum blockchain
              </p>
              <GetStartedButton />
            </div>
          </div>

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
