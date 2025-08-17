import { ArrowRight, CheckCircle, Copy, ExternalLink } from 'lucide-react'
import { useState } from 'react'

interface CongratulationsModalProps {
  isOpen: boolean
  onClose: () => void
  ensName: string
  smartWalletAddress: string
  commitTxHash?: string
  registrationTxHash?: string
  onContinue: () => void
}

export function CongratulationsModal({
  isOpen,
  onClose,
  ensName,
  smartWalletAddress,
  commitTxHash,
  registrationTxHash,
  onContinue,
}: CongratulationsModalProps) {
  const [copiedAddress, setCopiedAddress] = useState(false)
  const [copiedName, setCopiedName] = useState(false)

  const isDevelopment = process.env.NODE_ENV === 'development'
  const etherscanBase = isDevelopment
    ? 'https://sepolia.etherscan.io'
    : 'https://etherscan.io'
  const ensAppBase = isDevelopment
    ? 'https://sepolia.app.ens.domains'
    : 'https://app.ens.domains'

  const copyToClipboard = async (text: string, type: 'address' | 'name') => {
    try {
      await navigator.clipboard.writeText(text)
      if (type === 'address') {
        setCopiedAddress(true)
        setTimeout(() => setCopiedAddress(false), 2000)
      } else {
        setCopiedName(true)
        setTimeout(() => setCopiedName(false), 2000)
      }
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-md" />

      {/* Modal */}
      <div className="relative mx-4 w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="bg-card border-border relative overflow-hidden rounded-2xl border shadow-2xl">
          {/* Success Animation Background */}
          <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 via-emerald-500/5 to-teal-500/10" />

          {/* Header */}
          <div className="relative px-4 py-4 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-green-500/20">
              <CheckCircle className="h-6 w-6 text-green-500" />
            </div>
            <h2 className="text-foreground mb-1 text-xl font-bold">
              🎉 Congratulations!
            </h2>
            <p className="text-muted-foreground text-sm">
              Your business account has been created successfully
            </p>
          </div>

          {/* Content */}
          <div className="relative px-4 pb-4">
            {/* ENS Name Card */}
            <div className="bg-primary/10 border-primary/20 mb-4 rounded-lg border p-4">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="from-primary to-accent flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br">
                    <span className="text-primary-foreground text-lg font-bold">
                      {ensName.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-foreground text-lg font-semibold">
                      {ensName}.eth
                    </h3>
                    <p className="text-muted-foreground text-xs">
                      Your ENS business name
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => copyToClipboard(`${ensName}.eth`, 'name')}
                  className="text-muted-foreground hover:text-foreground rounded-lg p-2 transition-colors"
                  title="Copy ENS name"
                >
                  {copiedName ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </button>
              </div>

              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <a
                  href={`${ensAppBase}/${ensName}.eth`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-1 rounded-lg bg-white/10 px-3 py-2 text-xs font-medium transition-colors hover:bg-white/20"
                >
                  ENS App <ExternalLink className="h-3 w-3" />
                </a>
                <a
                  href={`${etherscanBase}/enslookup-search?search=${ensName}.eth`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-1 rounded-lg bg-white/10 px-3 py-2 text-xs font-medium transition-colors hover:bg-white/20"
                >
                  {isDevelopment ? 'Sepolia ' : ''}Etherscan <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>

            {/* Smart Wallet Card */}
            <div className="bg-muted/20 mb-4 rounded-lg p-4">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h4 className="text-foreground text-sm font-semibold">
                    Business Wallet Address
                  </h4>
                  <p className="text-muted-foreground text-xs">
                    Your smart contract wallet
                  </p>
                </div>
                <button
                  onClick={() => copyToClipboard(smartWalletAddress, 'address')}
                  className="text-muted-foreground hover:text-foreground rounded-lg p-2 transition-colors"
                  title="Copy wallet address"
                >
                  {copiedAddress ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </button>
              </div>

              <div className="bg-background/50 mb-3 rounded-lg p-2">
                <code className="font-mono text-xs break-all">
                  {smartWalletAddress}
                </code>
              </div>

              <a
                href={`${etherscanBase}/address/${smartWalletAddress}`}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-muted hover:bg-muted/80 flex items-center justify-center gap-1 rounded-lg px-3 py-2 text-xs font-medium transition-colors"
              >
                View on {isDevelopment ? 'Sepolia ' : ''}Etherscan <ExternalLink className="h-3 w-3" />
              </a>
            </div>

            {/* Transaction Links */}
            {(commitTxHash || registrationTxHash) && (
              <div className="bg-muted/10 mb-4 rounded-lg p-4">
                <h4 className="text-foreground mb-3 text-sm font-semibold">
                  Transaction History
                </h4>
                <div className="space-y-2">
                  {commitTxHash && (
                    <a
                      href={`${etherscanBase}/tx/${commitTxHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-background/50 hover:bg-background/70 flex items-center justify-between rounded-lg px-3 py-2 transition-colors"
                    >
                      <div>
                        <p className="text-xs font-medium">
                          Commitment
                        </p>
                        <p className="text-muted-foreground font-mono text-xs">
                          {commitTxHash.slice(0, 16)}...
                        </p>
                      </div>
                      <ExternalLink className="text-muted-foreground h-3 w-3" />
                    </a>
                  )}
                  {registrationTxHash && (
                    <a
                      href={`${etherscanBase}/tx/${registrationTxHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-background/50 hover:bg-background/70 flex items-center justify-between rounded-lg px-3 py-2 transition-colors"
                    >
                      <div>
                        <p className="text-xs font-medium">
                          Registration
                        </p>
                        <p className="text-muted-foreground font-mono text-xs">
                          {registrationTxHash.slice(0, 16)}...
                        </p>
                      </div>
                      <ExternalLink className="text-muted-foreground h-3 w-3" />
                    </a>
                  )}
                </div>
              </div>
            )}



            {/* Action Buttons */}
            <div className="flex flex-col gap-2 sm:flex-row">
              <button
                onClick={onClose}
                className="bg-muted hover:bg-muted/80 text-foreground flex-1 rounded-lg px-4 py-3 text-sm font-medium transition-colors"
              >
                Close
              </button>
              <button
                onClick={onContinue}
                className="bg-primary hover:bg-primary/90 text-primary-foreground flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-medium transition-colors"
              >
                Continue to Dashboard <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
