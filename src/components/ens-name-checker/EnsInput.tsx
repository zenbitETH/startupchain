import type { ChangeEvent } from 'react'

import { Input } from '@/components/ui/input'

export const ENS_NAME_INPUT_ID = 'ens-name-input'

interface EnsInputProps {
  ensName: string
  setEnsName: (name: string) => void
}

export function EnsInput({ ensName, setEnsName }: EnsInputProps) {
  return (
    <div className="ens-input-shell relative w-full rounded-xl">
      <Input
        id={ENS_NAME_INPUT_ID}
        type="text"
        placeholder=""
        value={ensName}
        onChange={(event: ChangeEvent<HTMLInputElement>) =>
          setEnsName(
            event.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '')
          )
        }
        className="placeholder:text-muted-foreground/50 focus-visible:ring-primary/30 relative z-10 h-16 w-full rounded-[11px] border-0 bg-transparent px-6 pr-20 text-xl transition-colors focus-visible:ring-1 md:text-2xl"
      />
      <div className="pointer-events-none absolute inset-y-0 right-6 z-20 flex items-center">
        <span className="text-muted-foreground text-xl font-medium md:text-2xl">
          .eth
        </span>
      </div>
    </div>
  )
}
