'use client'

import Link from 'next/link'

import { useProvidersReady } from '@/components/providers/providers-shell'
import { Button } from '@/components/ui/button'
import { useWalletAuth } from '@/hooks/use-wallet-auth'

import { ChainLogo } from '../ui/chain-logo'
import { LoadingSpinner } from '../ui/loading-spinner'

export function Navbar() {
  const providersReady = useProvidersReady()

  return (
    <nav className="sticky top-0 z-50 h-16 w-full py-4 backdrop-blur-sm">
      <div className="mx-auto h-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex h-full items-center justify-between">
          <Link
            href="/"
            className="hover:text-primary group flex items-center space-x-2 py-5 text-white"
          >
            <ChainLogo className="text-foreground transition-all duration-200" />
            <span className="text-foreground group-hover:text-primary text-3xl font-normal tracking-widest">
              StartUpChain
            </span>
          </Link>

          <NavbarActions providersReady={providersReady} />
        </div>
      </div>
    </nav>
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
