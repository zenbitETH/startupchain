import { Sparkles } from 'lucide-react'
import Link from 'next/link'

export function Footer() {
  return (
    <footer className="border-border bg-card/50 border-t py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-between md:flex-row">
          <Link href="/" className="mb-4 flex items-center space-x-2 md:mb-0">
            <div className="from-primary to-accent flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br">
              <Sparkles className="text-primary-foreground h-5 w-5" />
            </div>
            <span className="text-foreground text-xl font-bold tracking-tight">
              StartupChain
            </span>
          </Link>
          <div className="text-muted-foreground flex items-center space-x-6 text-sm">
            <a href="#" className="hover:text-foreground transition-colors">
              Privacy
            </a>
            <a href="#" className="hover:text-foreground transition-colors">
              Terms
            </a>
            <a href="#" className="hover:text-foreground transition-colors">
              Discord
            </a>
            <a href="#" className="hover:text-foreground transition-colors">
              Twitter
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}