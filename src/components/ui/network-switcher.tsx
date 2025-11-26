'use client'

import { useAccount, useSwitchChain } from 'wagmi'
import { Loader2, AlertCircle, ChevronDown, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import { useEffect, useState } from 'react'

export function NetworkSwitcher() {
  const { chain, isConnected } = useAccount()
  const { chains, switchChain, isPending } = useSwitchChain()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted || !isConnected) return null

  const isSupported = chain && chains.some((c) => c.id === chain.id)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            "gap-2 font-normal",
            "px-2 h-9", // Compact on mobile
            "sm:min-w-[100px] sm:justify-between sm:px-3", // Wider on desktop
            "hover:bg-white/5",
            "text-muted-foreground hover:text-foreground",
            !isSupported &&
              "text-destructive hover:text-destructive hover:bg-destructive/10"
          )}
        >
          <div className="flex items-center gap-2">
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : !isSupported ? (
              <AlertCircle className="h-4 w-4" />
            ) : (
              <div className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-500 opacity-75"></span>
                <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500"></span>
              </div>
            )}
            <span className="hidden truncate sm:inline">
              {isSupported ? chain?.name : 'Wrong Network'}
            </span>
          </div>
          <ChevronDown className="hidden h-4 w-4 opacity-50 sm:block" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[200px]">
        {chains.map((c) => (
          <DropdownMenuItem
            key={c.id}
            onClick={() => switchChain({ chainId: c.id })}
            className="gap-2 cursor-pointer justify-between"
          >
            <span className={cn(chain?.id === c.id && "font-medium")}>
              {c.name}
            </span>
            {chain?.id === c.id && (
              <div className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-green-500" />
                <Check className="h-4 w-4" />
              </div>
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
