'use client'

import { Copy, LogOut, Menu, WalletMinimal } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

import { appNavItems, footerItems } from '@/app/(app)/dashboard/config/navigation'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { NetworkSwitcher } from '@/components/ui/network-switcher'
import { useWalletAuth } from '@/hooks/use-wallet-auth'
import { shortenAddress } from '@/lib/utils'

type DashboardHeaderProps = {
  title: string
}

export function DashboardHeader({ title }: DashboardHeaderProps) {
  const { primaryAddress, disconnect, user } = useWalletAuth()
  const router = useRouter()
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const formattedAddress = primaryAddress
    ? shortenAddress(primaryAddress)
    : 'No wallet connected'

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
          <NetworkSwitcher />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="icon-sm"
                className="rounded-full"
                aria-label="Open navigation"
              >
                <Menu className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Navigation</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {appNavItems.map((item) => (
                <DropdownMenuItem key={item.url} asChild>
                  <Link href={item.url} className="cursor-pointer">
                    <item.icon className="mr-2 h-4 w-4" />
                    <span>{item.title}</span>
                  </Link>
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              {footerItems.map((item) => (
                <DropdownMenuItem key={item.url} asChild>
                  <Link href={item.url} className="cursor-pointer">
                    <item.icon className="mr-2 h-4 w-4" />
                    <span>{item.title}</span>
                  </Link>
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive focus:bg-destructive/10 cursor-pointer"
                disabled={isLoggingOut}
                onClick={async () => {
                  setIsLoggingOut(true)
                  try {
                    await disconnect()
                    router.replace('/')
                  } finally {
                    setIsLoggingOut(false)
                  }
                }}
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>{isLoggingOut ? 'Logging out...' : 'Log out'}</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
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
            <NetworkSwitcher />
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

      </div>
    </div>
  )
}
