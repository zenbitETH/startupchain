import { CheckCircle, ExternalLink, ArrowRight, Copy } from 'lucide-react'
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
  onContinue 
}: CongratulationsModalProps) {
  const [copiedAddress, setCopiedAddress] = useState(false)
  const [copiedName, setCopiedName] = useState(false)

  const isDevelopment = process.env.NODE_ENV === 'development'
  const etherscanBase = isDevelopment ? 'https://sepolia.etherscan.io' : 'https://etherscan.io'
  const ensAppBase = isDevelopment ? 'https://sepolia.app.ens.domains' : 'https://app.ens.domains'

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
      <div className="relative mx-4 w-full max-w-2xl">
        <div className="bg-card border-border relative overflow-hidden rounded-2xl border shadow-2xl">
          {/* Success Animation Background */}
          <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 via-emerald-500/5 to-teal-500/10" />
          
          {/* Header */}
          <div className="relative px-6 py-8 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-500/20">
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
            <h2 className="text-foreground text-3xl font-bold mb-2">
              🎉 Congratulations!
            </h2>
            <p className="text-muted-foreground text-lg">
              Your business account has been created successfully
            </p>
          </div>

          {/* Content */}
          <div className="relative px-6 pb-8">
            {/* ENS Name Card */}
            <div className="bg-primary/10 border-primary/20 rounded-xl border p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className="from-primary to-accent flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br">
                    <span className="text-primary-foreground text-xl font-bold">
                      {ensName.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-foreground text-xl font-semibold">{ensName}.eth</h3>
                    <p className="text-muted-foreground text-sm">Your ENS business name</p>
                  </div>
                </div>
                <button
                  onClick={() => copyToClipboard(`${ensName}.eth`, 'name')}
                  className="text-muted-foreground hover:text-foreground p-2 rounded-lg transition-colors"
                  title="Copy ENS name"
                >
                  {copiedName ? <CheckCircle className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                </button>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <a
                  href={`${ensAppBase}/${ensName}.eth`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 rounded-lg py-3 px-4 text-sm font-medium transition-colors"
                >
                  View on ENS App <ExternalLink className="h-4 w-4" />
                </a>
                <a
                  href={`${etherscanBase}/enslookup-search?search=${ensName}.eth`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 rounded-lg py-3 px-4 text-sm font-medium transition-colors"
                >
                  View on {isDevelopment ? 'Sepolia ' : ''}Etherscan <ExternalLink className="h-4 w-4" />
                </a>
              </div>
            </div>

            {/* Smart Wallet Card */}
            <div className="bg-muted/20 rounded-xl p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h4 className="text-foreground font-semibold">Business Wallet Address</h4>
                  <p className="text-muted-foreground text-sm">Your smart contract wallet</p>
                </div>
                <button
                  onClick={() => copyToClipboard(smartWalletAddress, 'address')}
                  className="text-muted-foreground hover:text-foreground p-2 rounded-lg transition-colors"
                  title="Copy wallet address"
                >
                  {copiedAddress ? <CheckCircle className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                </button>
              </div>
              
              <div className="bg-background/50 rounded-lg p-3 mb-4">
                <code className="text-sm font-mono break-all">{smartWalletAddress}</code>
              </div>
              
              <a
                href={`${etherscanBase}/address/${smartWalletAddress}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 bg-muted hover:bg-muted/80 rounded-lg py-3 px-4 text-sm font-medium transition-colors"
              >
                View Wallet on {isDevelopment ? 'Sepolia ' : ''}Etherscan <ExternalLink className="h-4 w-4" />
              </a>
            </div>

            {/* Transaction Links */}
            {(commitTxHash || registrationTxHash) && (
              <div className="bg-muted/10 rounded-xl p-6 mb-6">
                <h4 className="text-foreground font-semibold mb-4">Transaction History</h4>
                <div className="space-y-3">
                  {commitTxHash && (
                    <a
                      href={`${etherscanBase}/tx/${commitTxHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between bg-background/50 hover:bg-background/70 rounded-lg py-3 px-4 transition-colors"
                    >
                      <div>
                        <p className="text-sm font-medium">Commitment Transaction</p>
                        <p className="text-xs text-muted-foreground font-mono">{commitTxHash.slice(0, 20)}...</p>
                      </div>
                      <ExternalLink className="h-4 w-4 text-muted-foreground" />
                    </a>
                  )}
                  {registrationTxHash && (
                    <a
                      href={`${etherscanBase}/tx/${registrationTxHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between bg-background/50 hover:bg-background/70 rounded-lg py-3 px-4 transition-colors"
                    >
                      <div>
                        <p className="text-sm font-medium">Registration Transaction</p>
                        <p className="text-xs text-muted-foreground font-mono">{registrationTxHash.slice(0, 20)}...</p>
                      </div>
                      <ExternalLink className="h-4 w-4 text-muted-foreground" />
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* Development Notice */}
            {isDevelopment && (
              <div className="bg-amber-500/10 border-amber-500/20 rounded-xl border p-4 mb-6">
                <div className="flex items-start gap-3">
                  <div className="text-amber-500 mt-0.5">⚠️</div>
                  <div>
                    <p className="text-amber-700 dark:text-amber-300 font-medium text-sm">Development Mode</p>
                    <p className="text-amber-600 dark:text-amber-400 text-xs mt-1">
                      You&apos;re on Sepolia testnet. All transactions are using test ETH with no real value.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={onClose}
                className="flex-1 bg-muted hover:bg-muted/80 text-foreground py-4 px-6 rounded-xl font-medium transition-colors"
              >
                Close
              </button>
              <button
                onClick={onContinue}
                className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground py-4 px-6 rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
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