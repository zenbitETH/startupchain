import { ChevronRight } from 'lucide-react'

export function CTASection() {
  return (
    <section className="relative overflow-hidden py-24">
      <div className="from-primary/5 via-accent/5 to-primary/5 absolute inset-0 bg-gradient-to-r"></div>
      <div className="relative mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
        <h2 className="text-foreground mb-6 text-3xl font-bold md:text-5xl">
          Ready to build the future?
        </h2>
        <p className="text-muted-foreground mx-auto mb-12 max-w-2xl text-xl">
          Join thousands of builders creating unstoppable businesses on Ethereum
        </p>
        <div className="flex flex-col justify-center gap-4 sm:flex-row">
          <button className="bg-primary text-primary-foreground hover:bg-primary/90 flex items-center justify-center gap-2 rounded-xl px-8 py-4 text-lg font-semibold transition-all duration-200">
            Start building
            <ChevronRight className="h-5 w-5" />
          </button>
          <button className="border-border text-foreground hover:bg-background rounded-xl border px-8 py-4 text-lg font-semibold transition-all duration-200">
            View documentation
          </button>
        </div>
      </div>
    </section>
  )
}