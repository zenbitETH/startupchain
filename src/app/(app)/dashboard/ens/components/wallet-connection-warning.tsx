'use client'

import { ShieldAlert } from 'lucide-react'

export function WalletConnectionWarning() {
  return (
    <div className="mt-4 flex items-start gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-700">
      <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
      <p>Wallet connection required to submit Safe proposals.</p>
    </div>
  )
}
