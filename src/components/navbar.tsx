'use client'

import { usePrivy } from '@privy-io/react-auth'
import { Sparkles } from 'lucide-react'
import Link from 'next/link'

export function Navbar() {
  const { login, authenticated, user } = usePrivy()

  return (
    <nav className="border-border/40 bg-background/80 relative z-50 h-16 border-b backdrop-blur-xl">
      <div className="mx-auto h-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-full items-center justify-between">
          <Link href="/" className="flex items-center space-x-2">
            <div className="from-primary to-accent flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br">
              <Sparkles className="text-primary-foreground h-5 w-5" />
            </div>
            <span className="text-foreground text-xl font-bold tracking-tight" style={{ fontFamily: 'Orbitron, monospace' }}>
              StartupChain
            </span>
          </Link>
          
          <div className="hidden items-center space-x-8 md:flex">
            <a
              href="#features"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Features
            </a>
            <a
              href="#how-it-works"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              How it works
            </a>
            <a
              href="#pricing"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Pricing
            </a>
            {authenticated ? (
              <div className="flex items-center space-x-4">
                <span className="text-muted-foreground text-sm">
                  {user?.email?.address ||
                    user?.wallet?.address?.slice(0, 6) + '...'}
                </span>
                <Link
                  href="/dashboard"
                  className="bg-primary text-primary-foreground hover:bg-primary/90 inline-block rounded-lg px-4 py-2 font-medium transition-all duration-200"
                >
                  Dashboard
                </Link>
              </div>
            ) : (
              <button
                onClick={login}
                className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg px-4 py-2 font-medium transition-all duration-200"
              >
                Login
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}