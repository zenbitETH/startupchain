'use client'

import { LogOut } from 'lucide-react'
import { useRouter } from 'next/navigation'

import { useWalletAuth } from '@/hooks/use-wallet-auth'

export function QuickActions() {
  const router = useRouter()
  const { disconnect } = useWalletAuth()

  const handleLogout = async () => {
    await disconnect()
    router.push('/')
  }

  return (
    <div className="bg-card border-border rounded-2xl border p-6">
      <h3 className="text-foreground mb-4 font-semibold">Quick Actions</h3>
      <div className="space-y-3">
        <button
          onClick={() => {
            const ensInput = document.querySelector(
              'input[placeholder="Enter your business name"]'
            ) as HTMLInputElement
            if (ensInput) {
              ensInput.focus()
              ensInput.scrollIntoView({
                behavior: 'smooth',
                block: 'center',
              })
            }
          }}
          className="bg-primary text-primary-foreground hover:bg-primary/90 w-full rounded-2xl px-4 py-3 font-medium transition-colors"
        >
          Register ENS Name
        </button>
        <button className="border-border text-foreground hover:bg-card/50 w-full rounded-2xl border px-4 py-3 font-medium transition-colors">
          Create Company
        </button>
        <button className="border-border text-foreground hover:bg-card/50 w-full rounded-2xl border px-4 py-3 font-medium transition-colors">
          Fund Wallet
        </button>
        <button
          onClick={handleLogout}
          className="flex w-full items-center justify-center gap-2 rounded-2xl border border-red-500/20 px-4 py-3 font-medium text-red-500 transition-colors hover:bg-red-500/10"
        >
          <LogOut className="h-4 w-4" />
          Log Out
        </button>
      </div>
    </div>
  )
}
