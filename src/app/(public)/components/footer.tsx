import Link from 'next/link'

import { ChainLogo } from '@/components/ui/chain-logo'

export function Footer() {
  return (
    <footer className="border-border bg-card/50 border-t py-12 backdrop-blur-sm">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-between gap-8 md:flex-row">
          <div className="flex flex-col items-center md:items-start">
            <Link href="/" className="flex items-center space-x-2">
              <ChainLogo width={40} height={40} className="text-primary" />
              <span className="text-foreground text-2xl font-bold tracking-tight">
                StartupChain
              </span>
            </Link>
            <p className="text-muted-foreground mt-2 text-sm">
              The onchain operating system for modern companies.
            </p>
          </div>

          <div className="text-muted-foreground flex flex-wrap items-center justify-center gap-6 text-sm md:justify-end">
            <Link
              href="#privacy"
              className="hover:text-primary transition-colors"
            >
              Privacy
            </Link>
            <Link
              href="#terms"
              className="hover:text-primary transition-colors"
            >
              Terms
            </Link>
            <a
              href="https://twitter.com"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-primary transition-colors"
            >
              Twitter
            </a>
            <a
              href="https://discord.com"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-primary transition-colors"
            >
              Discord
            </a>
          </div>
        </div>

        <div className="border-border/50 text-muted-foreground mt-8 border-t pt-8 text-center text-sm md:text-left">
          <p>
            &copy; {new Date().getFullYear()} StartupChain. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
