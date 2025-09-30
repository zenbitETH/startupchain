import { useState } from 'react'

interface EnsInputProps {
  ensName: string
  setEnsName: (name: string) => void
}

export function EnsInput({ ensName, setEnsName }: EnsInputProps) {
  const [isFocused, setIsFocused] = useState(false)

  return (
    <>
      {/* Title that disappears on focus */}
      <div
        className={`absolute top-4 right-6 left-6 transition-all duration-300 ${
          isFocused ? '-translate-y-2 opacity-0' : 'translate-y-0 opacity-100'
        }`}
      >
        <h3 className="text-foreground text-center text-xl font-medium">
          Enter your business name
        </h3>
      </div>

      {/* Input field that moves up when focused */}
      <div
        className={`relative transition-all duration-300 ${
          isFocused ? 'translate-y-0' : 'translate-y-12'
        }`}
      >
        <input
          type="text"
          placeholder="Your company name"
          value={ensName}
          onChange={(e) =>
            setEnsName(
              e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '')
            )
          }
          onFocus={() => setIsFocused(true)}
          onBlur={() => !ensName && setIsFocused(false)}
          className="text-primary border-border focus:ring-primary focus:border-primary placeholder:text-muted-foreground w-full rounded-2xl border bg-white px-6 py-4 pr-16 text-lg transition-all duration-200 focus:ring-2"
        />
        <div className="text-muted-foreground absolute top-1/2 right-4 -translate-y-1/2 font-medium">
          .eth
        </div>
      </div>
    </>
  )
}
