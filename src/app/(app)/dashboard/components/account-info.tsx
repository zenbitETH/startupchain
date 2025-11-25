'use client'

import { Copy, ExternalLink, Mail, Settings, User, Wallet } from 'lucide-react'

import { useWalletAuth } from '@/hooks/use-wallet-auth'

export function AccountInfo() {
  const { user, primaryAddress } = useWalletAuth()

  const copyAddress = () => {
    if (primaryAddress) {
      navigator.clipboard
        .writeText(primaryAddress)
        .then(() => {
          // TODO. Show success toast, just a tick animation 
        })
        .catch((err) => {
          console.error('Failed to copy address:', err)
          // Show error toast
        })
    }
  }

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  // Get email verification status from linkedAccounts
  const getEmailVerificationStatus = () => {
    if (!user?.linkedAccounts) return null

    const isEmailAccount = (
      account: (typeof user.linkedAccounts)[number]
    ): account is (typeof user.linkedAccounts)[number] & {
      type: 'email'
      firstVerifiedAt: string | null
    } => {
      return account.type === 'email' && 'firstVerifiedAt' in account
    }

    const emailAccount = user.linkedAccounts.find(isEmailAccount)

    if (!emailAccount) return null

    return {
      isVerified: emailAccount.firstVerifiedAt !== null,
      firstVerifiedAt: emailAccount.firstVerifiedAt,
    }
  }

  const emailVerification = getEmailVerificationStatus()

  return (
    <div className="bg-card border-border rounded-2xl border p-6">
      <div className="mb-6 flex items-center gap-4">
        <div className="bg-primary/10 flex h-12 w-12 items-center justify-center rounded-2xl">
          <User className="text-primary h-6 w-6" />
        </div>
        <div>
          <h2 className="text-foreground text-xl font-semibold">
            Account Information
          </h2>
          <p className="text-muted-foreground text-sm">
            Your profile and authentication details
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {/* Email */}
        {user?.email?.address && (
          <div className="bg-background flex items-center justify-between rounded-2xl p-4">
            <div className="flex items-center gap-3">
              <Mail className="text-muted-foreground h-5 w-5" />
              <div>
                <p className="text-foreground font-medium">Email</p>
                <p className="text-muted-foreground text-sm">
                  {user.email.address}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {emailVerification?.isVerified ? (
                <span className="rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800">
                  ✓ Verified
                </span>
              ) : (
                <span className="rounded-full bg-amber-100 px-2 py-1 text-xs font-medium text-amber-800">
                  ⚠ Unverified
                </span>
              )}
            </div>
          </div>
        )}

        {/* Wallet */}
        {primaryAddress && (
          <div className="bg-background flex items-center justify-between rounded-2xl p-4">
            <div className="flex items-center gap-3">
              <Wallet className="text-muted-foreground h-5 w-5" />
              <div>
                <p className="text-foreground font-medium">Connected Wallet</p>
                <p className="text-muted-foreground font-mono text-sm">
                  {formatAddress(primaryAddress)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={copyAddress}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <Copy className="h-4 w-4" />
              </button>
              <a
                href={`https://etherscan.io/address/${primaryAddress}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <ExternalLink className="h-4 w-4" />
              </a>
            </div>
          </div>
        )}

        {/* User ID */}
        <div className="bg-background flex items-center justify-between rounded-2xl p-4">
          <div className="flex items-center gap-3">
            <Settings className="text-muted-foreground h-5 w-5" />
            <div>
              <p className="text-foreground font-medium">User ID</p>
              <p className="text-muted-foreground font-mono text-sm">
                {user?.id?.slice(0, 20)}...
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
