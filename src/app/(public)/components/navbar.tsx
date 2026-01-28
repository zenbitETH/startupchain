'use client'

import { Menu } from 'lucide-react'
import Link from 'next/link'

import { useProvidersReady } from '@/components/providers/providers-shell'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { useWalletAuth } from '@/hooks/use-wallet-auth'

import { ChainLogo } from '../../../components/ui/chain-logo'
import { LoadingSpinner } from '../../../components/ui/loading-spinner'

const navLinks = [
  { label: 'Features', href: '#features' },
  { label: 'Get started', href: '#start' },
]

export function Navbar() {
  const { ready: providersReady } = useProvidersReady()

  return (
    <nav className="border-border/60 bg-background/75 sticky top-0 z-50 border-b backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-8">
          <Link
            href="/"
            className="group text-foreground hover:text-primary flex items-center space-x-2 transition-colors"
          >
            <ChainLogo className="text-foreground transition-all duration-200" />
            <span className="group-hover:text-primary text-2xl font-normal tracking-widest">
              StartUpChain
            </span>
          </Link>
          <div className="hidden items-center gap-6 md:flex">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="text-muted-foreground hover:text-foreground text-sm font-medium transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <NavbarActions providersReady={providersReady} />
          <MobileMenu />
        </div>
      </div>
    </nav>
  )
}

function MobileMenu() {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          aria-label="Open menu"
        >
          <Menu className="size-4" />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="border-border/70 bg-background/95">
        <SheetHeader className="border-border/60 border-b pb-4">
          <SheetTitle className="flex items-center gap-2 text-lg">
            <ChainLogo className="text-foreground" />
            <span className="text-foreground text-lg font-semibold tracking-wide">
              StartUpChain
            </span>
          </SheetTitle>
        </SheetHeader>
        <div className="mt-6 flex flex-col gap-3">
          {navLinks.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="hover:border-primary/60 border-border/60 bg-card/40 text-foreground flex items-center justify-between rounded-xl border px-4 py-3 text-sm font-medium transition"
            >
              {link.label}
            </Link>
          ))}
        </div>
        <div className="border-border/70 bg-card/40 text-muted-foreground mt-8 rounded-xl border p-4 text-sm">
          Launch your onchain company in minutes with ENS, Safe, and automated
          registration.
        </div>
      </SheetContent>
    </Sheet>
  )
}

function NavbarActions({ providersReady }: { providersReady: boolean }) {
  if (!providersReady) {
    return <NavbarLoadingState />
  }

  return <NavbarAuthControls />
}

function NavbarAuthControls() {
  const { connect, authenticated, displayLabel, ready } = useWalletAuth()

  return (
    <>
      <NavbarButtonRow
        className="flex items-center md:hidden"
        buttonSize="sm"
        ready={ready}
        authenticated={authenticated}
        onConnect={connect}
      />
      <NavbarButtonRow
        className="hidden items-center space-x-4 md:flex"
        buttonSize="lg"
        ready={ready}
        authenticated={authenticated}
        onConnect={connect}
        displayLabel={displayLabel}
      />
    </>
  )
}

function NavbarLoadingState() {
  return (
    <>
      <div className="flex items-center md:hidden">
        <Button size="sm" variant="ghost" disabled className="min-w-[90px]">
          <LoadingSpinner size="sm" className="text-foreground" />
        </Button>
      </div>
      <div className="hidden items-center space-x-4 md:flex">
        <Button size="lg" variant="ghost" disabled className="min-w-[140px]">
          <LoadingSpinner size="lg" className="text-foreground" />
        </Button>
      </div>
    </>
  )
}

interface NavbarButtonRowProps {
  className: string
  buttonSize: 'sm' | 'lg'
  ready: boolean
  authenticated: boolean
  onConnect: () => void
  displayLabel?: string
}

function NavbarButtonRow({
  className,
  buttonSize,
  ready,
  authenticated,
  onConnect,
  displayLabel,
}: NavbarButtonRowProps) {
  const spinnerSize = buttonSize === 'sm' ? 'sm' : 'lg'

  if (!ready) {
    return (
      <div className={className}>
        <Button
          size={buttonSize}
          variant="ghost"
          disabled
          className="min-w-[90px]"
        >
          <LoadingSpinner size={spinnerSize} className="text-foreground" />
        </Button>
      </div>
    )
  }

  if (!authenticated) {
    return (
      <div className={className}>
        <Button size={buttonSize} onClick={onConnect} className="min-w-[110px]">
          Connect wallet
        </Button>
      </div>
    )
  }

  return (
    <div className={className}>
      {displayLabel && (
        <span className="text-muted-foreground hidden text-base font-medium md:inline-block">
          {displayLabel}
        </span>
      )}
      <Button asChild size={buttonSize} className="min-w-[110px]">
        <Link href="/dashboard">Dashboard</Link>
      </Button>
    </div>
  )
}
