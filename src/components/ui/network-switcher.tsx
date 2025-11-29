'use client'

import { useWallets } from '@privy-io/react-auth'
import { Check, ChevronDown, Globe2 } from 'lucide-react'
import { useEffect, useState } from 'react'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useWalletAuth } from '@/hooks/use-wallet-auth'
import { cn } from '@/lib/utils'
import { wagmiConfig } from '@/lib/web3'

// Keep switchable networks in sync with wagmi/Privy configuration
const SUPPORTED_CHAINS = wagmiConfig.chains.map((chain) => ({
  id: chain.id,
  name: chain.name,
}))

export function NetworkSwitcher() {
  const { chainId } = useWalletAuth()
  const { wallets } = useWallets()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <Button variant="outline" size="sm" className="rounded-full px-3">
        <Globe2 className="h-4 w-4" />
        <span className="text-sm font-medium">Loading...</span>
      </Button>
    )
  }

  const currentChain = SUPPORTED_CHAINS.find((c) => c.id === chainId)
  const networkLabel = currentChain ? currentChain.name : 'Unknown Network'

  const handleSwitchNetwork = async (targetChainId: number) => {
    const wallet = wallets[0]
    if (!wallet) return

    try {
      await wallet.switchChain(targetChainId)
    } catch (error) {
      console.error('Failed to switch network:', error)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2 rounded-full px-3">
          <Globe2 className="h-4 w-4" />
          <span className="hidden text-sm font-medium sm:inline-block">
            {networkLabel}
          </span>
          <ChevronDown className="h-3 w-3 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[200px]">
        {SUPPORTED_CHAINS.map((chain) => (
          <DropdownMenuItem
            key={chain.id}
            onClick={() => handleSwitchNetwork(chain.id)}
            className="cursor-pointer justify-between gap-2"
          >
            <span className={cn(chainId === chain.id && 'font-medium')}>
              {chain.name}
            </span>
            {chainId === chain.id && (
              <div className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-sidebar-accent" />
              </div>
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
