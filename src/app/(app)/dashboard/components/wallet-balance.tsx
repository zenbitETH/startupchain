'use client'

import { Wallet } from 'lucide-react'
import { formatEther } from 'viem'
import { useBalance } from 'wagmi'

import { useEthPrice } from '@/hooks/use-eth-price'
import { useWalletAuth } from '@/hooks/use-wallet-auth'

export function WalletBalance() {
  const { primaryAddress } = useWalletAuth()
  const { data: ethPrice = 0 } = useEthPrice()

  // Get wallet balance
  const { data: balance } = useBalance({
    address: primaryAddress as `0x${string}`,
  })

  const balanceInEth = balance ? parseFloat(formatEther(balance.value)) : 0
  const balanceInUsd = balanceInEth * ethPrice

  return (
    <div className="bg-card border-border rounded-2xl border p-6">
      <div className="mb-6 flex items-center gap-4">
        <div className="bg-primary/10 flex h-12 w-12 items-center justify-center rounded-2xl">
          <Wallet className="text-primary h-6 w-6" />
        </div>
        <div>
          <h2 className="text-foreground text-xl font-semibold">
            Wallet Balance
          </h2>
          <p className="text-muted-foreground text-sm">Your current holdings</p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="from-primary/5 to-accent/5 rounded-2xl bg-gradient-to-r p-6 text-center">
          <div className="text-foreground mb-2 text-3xl font-bold">
            ${balanceInUsd.toFixed(2)}
          </div>
          <div className="text-muted-foreground">
            {balanceInEth.toFixed(6)} ETH
          </div>
          {ethPrice > 0 && (
            <div className="text-muted-foreground mt-2 text-xs">
              ETH @ ${ethPrice.toFixed(2)}
            </div>
          )}
        </div>

        {balance && balance.value === BigInt(0) && (
          <div className="bg-accent/10 border-accent/20 rounded-2xl border p-4 text-center">
            <p className="text-accent font-medium">Get started!</p>
            <p className="text-muted-foreground mt-1 text-sm">
              Fund your wallet to start building on-chain
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
