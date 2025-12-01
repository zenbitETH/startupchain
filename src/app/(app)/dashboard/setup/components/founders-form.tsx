'use client'

import { Plus, Trash2 } from 'lucide-react'

import { type Shareholder } from '@/lib/store/draft'

interface FoundersFormProps {
  shareholders: Shareholder[]
  isMultipleFounders: boolean
  registerToDifferentAddress: boolean
  customAddress: string
  onFounderModeChange: (isMultiple: boolean) => void
  onAddFounder: () => void
  onRemoveFounder: (id: string) => void
  onUpdateFounder: (
    id: string,
    field: 'walletAddress' | 'equityPercentage',
    value: string
  ) => void
  onRegisterToDifferentAddressChange: (checked: boolean) => void
  onCustomAddressChange: (value: string) => void
}

export function FoundersForm({
  shareholders,
  isMultipleFounders,
  registerToDifferentAddress,
  customAddress,
  onFounderModeChange,
  onAddFounder,
  onRemoveFounder,
  onUpdateFounder,
  onRegisterToDifferentAddressChange,
  onCustomAddressChange,
}: FoundersFormProps) {
  const totalEquity = shareholders.reduce(
    (sum, founder) => sum + founder.equityPercentage,
    0
  )

  return (
    <>
      {/* Company Structure Toggle */}
      <div className="border-border bg-card rounded-xl border p-4">
        <h3 className="mb-3 text-base font-semibold">Company Structure</h3>
        <div className="bg-background flex rounded-xl p-1">
          <button
            type="button"
            onClick={() => onFounderModeChange(false)}
            className={`flex-1 cursor-pointer rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200 ${
              !isMultipleFounders
                ? 'bg-primary text-white shadow-sm'
                : 'text-muted-foreground hover:text-white'
            }`}
          >
            Solo founder
          </button>
          <button
            type="button"
            onClick={() => onFounderModeChange(true)}
            className={`flex-1 cursor-pointer rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200 ${
              isMultipleFounders
                ? 'bg-primary text-white shadow-sm'
                : 'text-muted-foreground hover:text-white'
            }`}
          >
            Multiple founders
          </button>
        </div>
      </div>

      {/* Different Address Option (Solo founder only) */}
      {!isMultipleFounders && (
        <div className="border-border bg-card rounded-xl border p-4">
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="different-address"
              checked={registerToDifferentAddress}
              onChange={(event) =>
                onRegisterToDifferentAddressChange(event.currentTarget.checked)
              }
              className="border-border text-primary focus:ring-primary rounded border"
            />
            <label
              htmlFor="different-address"
              className="text-foreground text-sm"
            >
              Register ENS to a different address
            </label>
          </div>
          {registerToDifferentAddress && (
            <div className="mt-3">
              <input
                type="text"
                placeholder="Enter ETH address (0x...)"
                value={customAddress}
                onChange={(event) => onCustomAddressChange(event.target.value)}
                className="border-border bg-background placeholder:text-muted-foreground focus:border-primary focus:ring-primary w-full rounded-xl border px-3 py-2 text-sm transition-all duration-200 focus:ring-2"
              />
              <p className="text-muted-foreground mt-1 text-xs">
                The ENS name will be registered to this address instead of
                your wallet.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Founders List */}
      <div className="border-border bg-card rounded-xl border p-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-base font-semibold">
            {isMultipleFounders ? 'Founders & Equity' : 'Your Details'}
          </h3>
          {isMultipleFounders && (
            <div
              className={`text-sm font-medium ${
                Math.abs(totalEquity - 100) < 0.01
                  ? 'text-primary'
                  : 'text-destructive'
              }`}
            >
              Total: {totalEquity.toFixed(1)}%
            </div>
          )}
        </div>

        <div className="space-y-2">
          {shareholders.map((founder, index) => (
            <div
              key={founder.id}
              className="border-border rounded-lg border p-3"
            >
              <div className="flex items-center gap-2">
                <div className="flex-1">
                  <input
                    type="text"
                    placeholder="Email or ETH address"
                    value={founder.walletAddress}
                    disabled={!isMultipleFounders && index === 0}
                    onChange={(event) =>
                      onUpdateFounder(
                        founder.id,
                        'walletAddress',
                        event.target.value
                      )
                    }
                    className="border-border bg-background placeholder:text-muted-foreground focus:border-primary focus:ring-primary disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed w-full rounded-lg border px-3 py-2 text-sm transition-all duration-200 focus:ring-2"
                  />
                </div>

                {isMultipleFounders && (
                  <div className="w-20">
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.1"
                        value={founder.equityPercentage}
                        onChange={(event) =>
                          onUpdateFounder(
                            founder.id,
                            'equityPercentage',
                            event.target.value
                          )
                        }
                        className="border-border bg-background focus:border-primary focus:ring-primary w-full rounded-lg border px-2 py-2 pr-6 text-center text-sm transition-all duration-200 focus:ring-2"
                      />
                      <div className="text-muted-foreground absolute top-1/2 right-2 -translate-y-1/2 text-xs">
                        %
                      </div>
                    </div>
                  </div>
                )}

                {isMultipleFounders && shareholders.length > 1 && (
                  <button
                    type="button"
                    onClick={() => onRemoveFounder(founder.id)}
                    className="text-muted-foreground hover:text-destructive rounded-lg p-2 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          ))}

          {isMultipleFounders && (
            <button
              type="button"
              onClick={onAddFounder}
              className="hover:bg-primary hover:text-background mx-auto flex items-center justify-center gap-2 rounded-lg border border-dashed px-4 py-3 text-sm font-medium transition-colors"
            >
              <Plus className="h-4 w-4" />
              Add Founder
            </button>
          )}
        </div>

        {isMultipleFounders && Math.abs(totalEquity - 100) > 0.01 && (
          <div className="border-destructive/20 bg-destructive/10 mt-3 rounded-xl border p-2">
            <p className="text-destructive text-xs font-medium">
              Equity must total 100%. Currently: {totalEquity.toFixed(1)}%
            </p>
          </div>
        )}
      </div>
    </>
  )
}
