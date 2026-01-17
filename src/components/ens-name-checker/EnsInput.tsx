import { type ChangeEvent, useState } from 'react'

import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

interface EnsInputProps {
  ensName: string
  setEnsName: (name: string) => void
}

export function EnsInput({ ensName, setEnsName }: EnsInputProps) {
  const [isFocused, setIsFocused] = useState(false)

  return (
    <div className="group relative w-full">
      <div
        className={cn(
          'from-primary via-accent to-secondary absolute -inset-0.5 rounded-2xl bg-gradient-to-r opacity-30 blur transition duration-500 group-hover:opacity-60',
          isFocused && 'opacity-100 blur-md duration-200'
        )}
      />

      <div className="relative">
        <Input
          type="text"
          placeholder="search-your-name"
          value={ensName}
          onChange={(event: ChangeEvent<HTMLInputElement>) =>
            setEnsName(
              event.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '')
            )
          }
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          className="border-border/50 bg-background/80 placeholder:text-muted-foreground/80 h-16 w-full rounded-xl px-6 pr-20 text-xl shadow-xl backdrop-blur-xl transition-all focus-visible:border-transparent focus-visible:ring-0 md:text-2xl"
        />
        <div className="pointer-events-none absolute inset-y-0 right-6 flex items-center">
          <span className="text-muted-foreground text-xl font-medium md:text-2xl">
            .eth
          </span>
        </div>
      </div>
    </div>
  )
}
