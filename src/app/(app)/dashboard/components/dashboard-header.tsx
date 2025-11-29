'use client'

import { Copy, Globe2, Menu, WalletMinimal } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

import { appNavItems } from '@/app/(app)/dashboard/config/navigation'
import { Button } from '@/components/ui/button'
import { useWalletAuth } from '@/hooks/use-wallet-auth'
import { shortenAddress } from '@/lib/utils'

const chainNames: Record<number, string> = {
  1: 'Ethereum',
  10: 'Optimism',
  8453: 'Base',
  11155111: 'Sepolia',
  11155420: 'Optimism Sepolia',
  84532: 'Base Sepolia',
}

type DashboardHeaderProps = {
  title: string
}

export function DashboardHeader({ title }: DashboardHeaderProps) {
  const { primaryAddress, chainId, user } = useWalletAuth()
  const router = useRouter()
  const [showMobileNav, setShowMobileNav] = useState(false)

  const formattedAddress = primaryAddress
    ? shortenAddress(primaryAddress)
    : 'No wallet connected'

  const networkLabel = chainId
    ? (chainNames[chainId] ?? 'Unknown network')
    : 'Network unavailable'

  const handleCopy = async () => {
    if (!primaryAddress) return
    try {
      await navigator.clipboard.writeText(primaryAddress)
    } catch (error) {
      console.error('Failed to copy address', error)
    }
  }

  const avatarFallback =
    user?.email?.address?.[0]?.toUpperCase() ??
    user?.id?.[0]?.toUpperCase() ??
    'U'

  const handleNavChange = (value: string) => {
    if (!value) return
    router.push(value)
    setShowMobileNav(false)
  }

  return (
    <div className="border-border bg-background/90 sticky top-0 z-10 border-b px-4 py-3 backdrop-blur md:px-6">
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2 md:hidden">
          <Link href="/" className="flex flex-1 items-center gap-3">
            <Image
              src="/logo.svg"
              alt="StartUpChain logo"
              width={40}
              height={40}
              className="h-10 w-10 rounded-2xl"
              priority
            />
            <div className="leading-tight">
              <p className="text-foreground text-lg font-semibold">
                StartUpChain
              </p>
              <p className="text-muted-foreground text-xs">Onchain OS</p>
            </div>
          </Link>
          <Button variant="outline" size="sm" className="rounded-full px-3">
            <Globe2 className="h-4 w-4" />
            <span className="text-sm font-medium">{networkLabel}</span>
          </Button>
          <Button
            variant="outline"
            size="icon-sm"
            className="rounded-full"
            aria-label="Open navigation"
            onClick={() => setShowMobileNav((prev) => !prev)}
          >
            <Menu className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex items-center justify-end gap-2 md:hidden">
          <Button
            variant="outline"
            size="sm"
            className="rounded-full px-3 font-mono"
            onClick={handleCopy}
            disabled={!primaryAddress}
          >
            <WalletMinimal className="h-4 w-4" />
            <span className="text-sm">{formattedAddress}</span>
            <Copy className="h-4 w-4" />
          </Button>
        </div>

        <div className="hidden md:flex md:items-center md:justify-between">
          <div>
            <p className="text-foreground text-2xl leading-tight font-semibold">
              {title}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 md:justify-end">
            <Button variant="outline" size="sm" className="rounded-full px-3">
              <Globe2 className="h-4 w-4" />
              <span className="text-sm font-medium">{networkLabel}</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="rounded-full px-3 font-mono"
              onClick={handleCopy}
              disabled={!primaryAddress}
            >
              <WalletMinimal className="h-4 w-4" />
              <span className="text-sm">{formattedAddress}</span>
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {showMobileNav && (
          <div className="bg-card border-border absolute top-[72px] right-4 flex w-48 flex-col rounded-xl border p-2 shadow-md md:hidden">
            {appNavItems.map((item) => (
              <button
                key={item.url}
                className="text-foreground hover:bg-muted rounded-lg px-3 py-2 text-left text-sm font-medium"
                onClick={() => handleNavChange(item.url)}
              >
                {item.title}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
