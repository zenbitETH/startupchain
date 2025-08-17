'use client'

import { Plus, Trash2, X } from 'lucide-react'
import React, { useEffect, useState } from 'react'
import { usePrivy } from '@privy-io/react-auth'
import { useSmartWallet } from '@/hooks/use-smart-wallet'

interface Founder {
  id: string
  address: string
  equity: string
}

interface BusinessSetupModalProps {
  isOpen: boolean
  onClose: () => void
  ensName: string
}

export function BusinessSetupModal({ isOpen, onClose, ensName }: BusinessSetupModalProps) {
  const { login, authenticated, user } = usePrivy()
  const { createBusinessAccount, isCreating, error } = useSmartWallet()
  
  const [isMultipleFounders, setIsMultipleFounders] = useState(false)
  const [founders, setFounders] = useState<Founder[]>([
    { id: '1', address: '', equity: '100' }
  ])

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setIsMultipleFounders(false)
      setFounders([{ id: '1', address: '', equity: '100' }])
    }
  }, [isOpen])

  // Handle keyboard events for modal
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, onClose])

  const handleFounderModeChange = (isMultiple: boolean) => {
    setIsMultipleFounders(isMultiple)
    if (!isMultiple) {
      setFounders([{ id: '1', address: '', equity: '100' }])
    } else {
      setFounders([
        { id: '1', address: '', equity: '50' },
        { id: '2', address: '', equity: '50' }
      ])
    }
  }

  const addFounder = () => {
    const newFounder: Founder = {
      id: Date.now().toString(),
      address: '',
      equity: '0'
    }
    setFounders([...founders, newFounder])
  }

  const removeFounder = (id: string) => {
    if (founders.length > 1) {
      setFounders(founders.filter(founder => founder.id !== id))
    }
  }

  const updateFounder = (id: string, field: 'address' | 'equity', value: string) => {
    setFounders(founders.map(founder =>
      founder.id === id ? { ...founder, [field]: value } : founder
    ))
  }

  const totalEquity = founders.reduce((sum, founder) => sum + (parseFloat(founder.equity) || 0), 0)

  const handleCreateBusiness = async () => {
    // Check if user is authenticated
    if (!authenticated) {
      // Trigger Privy login flow
      await login()
      return
    }

    try {
      // Create business account with smart wallet
      await createBusinessAccount(ensName, founders)
      
      // Success - close modal and redirect to dashboard
      onClose()
      // TODO: Navigate to dashboard
      window.location.href = '/dashboard'
    } catch (err) {
      console.error('Failed to create business:', err)
      // Error is handled by the hook
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop with blur effect */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-md"
        onClick={onClose}
      />

      {/* Modal Content */}
      <div className="relative mx-4 w-full max-w-2xl">
        <div className="bg-card border-border relative overflow-hidden rounded-2xl border shadow-2xl">
          {/* Header */}
          <div className="border-border flex items-center justify-between border-b px-6 py-4">
            <h2 className="text-foreground text-2xl font-bold">Set your business</h2>
            <button
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground rounded-lg p-2 transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Content */}
          <div className="max-h-[80vh] overflow-y-auto p-6">
            {/* Business Name Display */}
            <div className="mb-8">
              <div className="bg-primary/10 border-primary/20 rounded-xl border p-4">
                <div className="flex items-center gap-3">
                  <div className="from-primary to-accent flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br">
                    <div className="text-primary-foreground text-lg font-bold">
                      {ensName.charAt(0).toUpperCase()}
                    </div>
                  </div>
                  <div>
                    <p className="text-foreground text-lg font-semibold">{ensName}.eth</p>
                    <p className="text-muted-foreground text-sm">Your ENS business name</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Founder Mode Toggle */}
            <div className="mb-8">
              <div className="bg-muted/20 flex rounded-xl p-1">
                <button
                  onClick={() => handleFounderModeChange(false)}
                  className={`flex-1 rounded-lg py-3 px-4 text-sm font-medium transition-all duration-200 ${
                    !isMultipleFounders
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Solo founder
                </button>
                <button
                  onClick={() => handleFounderModeChange(true)}
                  className={`flex-1 rounded-lg py-3 px-4 text-sm font-medium transition-all duration-200 ${
                    isMultipleFounders
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Multiple founders
                </button>
              </div>
            </div>

            {/* Founders Section */}
            <div className="mb-8">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-foreground text-lg font-semibold">
                  {isMultipleFounders ? 'Add business founders and equity share' : 'Set founder details'}
                </h3>
                {isMultipleFounders && (
                  <div className={`text-sm font-medium ${
                    Math.abs(totalEquity - 100) < 0.01
                      ? 'text-primary'
                      : 'text-destructive'
                  }`}>
                    Total: {totalEquity.toFixed(1)}%
                  </div>
                )}
              </div>

              <div className="space-y-3">
                {founders.map((founder) => (
                  <div key={founder.id} className="bg-muted/10 border-border rounded-xl border p-4">
                    <div className="flex items-center gap-3">
                      {/* Address Input */}
                      <div className="flex-1">
                        <input
                          type="text"
                          placeholder="Mail or ETH address"
                          value={founder.address}
                          onChange={(e) => updateFounder(founder.id, 'address', e.target.value)}
                          className="bg-background border-border focus:ring-primary focus:border-primary placeholder:text-muted-foreground w-full rounded-lg border px-4 py-3 text-sm transition-all duration-200 focus:ring-2"
                        />
                      </div>

                      {/* Equity Input */}
                      {isMultipleFounders && (
                        <div className="w-20">
                          <div className="relative">
                            <input
                              type="number"
                              min="0"
                              max="100"
                              step="0.1"
                              value={founder.equity}
                              onChange={(e) => updateFounder(founder.id, 'equity', e.target.value)}
                              className="bg-background border-border focus:ring-primary focus:border-primary w-full rounded-lg border px-3 py-3 pr-8 text-center text-sm transition-all duration-200 focus:ring-2"
                            />
                            <div className="text-muted-foreground absolute right-2 top-1/2 -translate-y-1/2 text-xs">
                              %
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Remove Button */}
                      {isMultipleFounders && founders.length > 1 && (
                        <button
                          onClick={() => removeFounder(founder.id)}
                          className="text-muted-foreground hover:text-destructive rounded-lg p-2 transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}

                {/* Add Founder Button */}
                {isMultipleFounders && (
                  <button
                    onClick={addFounder}
                    className="border-border hover:bg-muted/20 flex w-full items-center justify-center gap-2 rounded-xl border border-dashed py-4 text-sm font-medium transition-colors"
                  >
                    <Plus className="h-4 w-4" />
                    Add Owner
                  </button>
                )}
              </div>

              {/* Equity Warning */}
              {isMultipleFounders && Math.abs(totalEquity - 100) > 0.01 && (
                <div className="bg-destructive/10 border-destructive/20 mt-4 rounded-lg border p-3">
                  <p className="text-destructive text-sm font-medium">
                    Equity must total 100%. Currently: {totalEquity.toFixed(1)}%
                  </p>
                </div>
              )}
            </div>

            {/* Additional Info */}
            <div className="bg-muted/10 border-border mb-8 rounded-xl border p-4">
              <h4 className="text-foreground mb-2 text-sm font-semibold">What happens next?</h4>
              <ul className="text-muted-foreground space-y-1 text-sm">
                <li>• You'll sign in with email to create your account</li>
                <li>• A Smart Wallet (Safe) will be created for your business</li>
                <li>• Your ENS name will be registered to the Smart Wallet</li>
                {isMultipleFounders && (
                  <li>• Co-founders can be added as signers to the Safe</li>
                )}
                <li>• All transactions will be gasless (we pay the fees)</li>
                <li>• You can start receiving payments immediately</li>
              </ul>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-destructive/10 border-destructive/20 mb-4 rounded-lg border p-3">
                <p className="text-destructive text-sm font-medium">{error}</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-border border-t px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="text-muted-foreground text-sm">
                {isMultipleFounders ? 'Multisig setup' : 'Single owner setup'}
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={onClose}
                  className="border-border hover:bg-muted/20 rounded-lg border px-4 py-2 text-sm font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateBusiness}
                  disabled={
                    isCreating ||
                    (!authenticated && founders.some(f => !f.address.trim())) ||
                    (isMultipleFounders && Math.abs(totalEquity - 100) > 0.01)
                  }
                  className="bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg px-6 py-2 text-sm font-semibold transition-all duration-200"
                >
                  {isCreating ? 'Creating...' : !authenticated ? 'Sign in & Create' : 'Create business'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
