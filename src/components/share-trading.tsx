'use client'

import React, { useState, useEffect } from 'react'
import { useBondingCurve } from '@/hooks/use-bonding-curve'
import { TrendingUp, TrendingDown, DollarSign, Activity, Users, ChevronUp, ChevronDown } from 'lucide-react'

interface ShareTradingProps {
  startupId: number
  companyName: string
}

export function ShareTrading({ startupId, companyName }: ShareTradingProps) {
  const {
    buyShares,
    sellShares,
    calculatePurchaseCost,
    calculateSaleReturn,
    getPriceInfo,
    isLoading,
    error
  } = useBondingCurve()

  const [tradeMode, setTradeMode] = useState<'buy' | 'sell'>('buy')
  const [amount, setAmount] = useState('')
  const [estimatedCost, setEstimatedCost] = useState<{ cost: string; fee: string } | null>(null)
  const [estimatedReturn, setEstimatedReturn] = useState<{ returnAmount: string; fee: string } | null>(null)
  const [priceInfo, setPriceInfo] = useState<any>(null)
  const [isCalculating, setIsCalculating] = useState(false)
  const [txStatus, setTxStatus] = useState<string | null>(null)

  // Fetch price info on mount and after trades
  useEffect(() => {
    fetchPriceInfo()
  }, [startupId])

  const fetchPriceInfo = async () => {
    try {
      const info = await getPriceInfo(startupId)
      setPriceInfo(info)
    } catch (err) {
      console.error('Failed to fetch price info:', err)
    }
  }

  // Calculate cost/return when amount changes
  useEffect(() => {
    if (!amount || !priceInfo) return

    const calculateEstimate = async () => {
      setIsCalculating(true)
      try {
        if (tradeMode === 'buy') {
          // For buy mode, amount is in ETH
          const shareAmount = Math.floor(parseFloat(amount) / parseFloat(priceInfo.currentPrice))
          if (shareAmount > 0) {
            const cost = await calculatePurchaseCost(
              parseInt(priceInfo.totalSupply),
              shareAmount
            )
            setEstimatedCost(cost)
            setEstimatedReturn(null)
          }
        } else {
          // For sell mode, amount is in shares
          const shareAmount = parseInt(amount)
          if (shareAmount > 0) {
            const returnInfo = await calculateSaleReturn(
              parseInt(priceInfo.totalSupply),
              shareAmount
            )
            setEstimatedReturn(returnInfo)
            setEstimatedCost(null)
          }
        }
      } catch (err) {
        console.error('Failed to calculate:', err)
      } finally {
        setIsCalculating(false)
      }
    }

    const timeoutId = setTimeout(calculateEstimate, 500)
    return () => clearTimeout(timeoutId)
  }, [amount, tradeMode, priceInfo])

  const handleTrade = async () => {
    if (!amount) return

    setTxStatus('Processing transaction...')
    try {
      if (tradeMode === 'buy') {
        const txHash = await buyShares(startupId, amount)
        setTxStatus(`✅ Shares purchased! Tx: ${txHash.slice(0, 10)}...`)
      } else {
        const shareAmount = parseInt(amount)
        const txHash = await sellShares(startupId, shareAmount, '0')
        setTxStatus(`✅ Shares sold! Tx: ${txHash.slice(0, 10)}...`)
      }
      
      // Refresh price info
      await fetchPriceInfo()
      setAmount('')
      
      // Clear status after 5 seconds
      setTimeout(() => setTxStatus(null), 5000)
    } catch (err) {
      setTxStatus(`❌ Transaction failed: ${err instanceof Error ? err.message : 'Unknown error'}`)
      setTimeout(() => setTxStatus(null), 5000)
    }
  }

  // Format large numbers
  const formatNumber = (num: string | number) => {
    const n = typeof num === 'string' ? parseFloat(num) : num
    if (n >= 1000000) return `${(n / 1000000).toFixed(2)}M`
    if (n >= 1000) return `${(n / 1000).toFixed(2)}K`
    return n.toFixed(4)
  }

  return (
    <div className="bg-card border-border rounded-2xl border p-6">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-foreground text-2xl font-bold mb-2">
          Trade {companyName} Shares
        </h2>
        <p className="text-muted-foreground text-sm">
          Buy and sell shares using our quadratic bonding curve
        </p>
      </div>

      {/* Price Stats */}
      {priceInfo && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-muted/20 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign className="h-4 w-4 text-primary" />
              <span className="text-muted-foreground text-xs">Price</span>
            </div>
            <p className="text-foreground text-lg font-semibold">
              {formatNumber(priceInfo.currentPrice)} ETH
            </p>
          </div>
          
          <div className="bg-muted/20 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <Activity className="h-4 w-4 text-primary" />
              <span className="text-muted-foreground text-xs">Market Cap</span>
            </div>
            <p className="text-foreground text-lg font-semibold">
              {formatNumber(priceInfo.marketCap)} ETH
            </p>
          </div>
          
          <div className="bg-muted/20 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <Users className="h-4 w-4 text-primary" />
              <span className="text-muted-foreground text-xs">Supply</span>
            </div>
            <p className="text-foreground text-lg font-semibold">
              {formatNumber(priceInfo.totalSupply)}
            </p>
          </div>
          
          <div className="bg-muted/20 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="h-4 w-4 text-primary" />
              <span className="text-muted-foreground text-xs">Volume</span>
            </div>
            <p className="text-foreground text-lg font-semibold">
              {formatNumber(priceInfo.tradingVolume)} ETH
            </p>
          </div>
        </div>
      )}

      {/* Trade Mode Toggle */}
      <div className="bg-muted/20 flex rounded-xl p-1 mb-6">
        <button
          onClick={() => setTradeMode('buy')}
          className={`flex-1 flex items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-medium transition-all duration-200 ${
            tradeMode === 'buy'
              ? 'bg-green-500 text-white shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <ChevronUp className="h-4 w-4" />
          Buy Shares
        </button>
        <button
          onClick={() => setTradeMode('sell')}
          className={`flex-1 flex items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-medium transition-all duration-200 ${
            tradeMode === 'sell'
              ? 'bg-red-500 text-white shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <ChevronDown className="h-4 w-4" />
          Sell Shares
        </button>
      </div>

      {/* Trade Input */}
      <div className="mb-6">
        <label className="text-foreground text-sm font-medium mb-2 block">
          {tradeMode === 'buy' ? 'ETH Amount' : 'Share Amount'}
        </label>
        <div className="relative">
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder={tradeMode === 'buy' ? '0.1' : '100'}
            className="bg-background border-border focus:ring-primary focus:border-primary placeholder:text-muted-foreground w-full rounded-lg border px-4 py-3 pr-16 text-lg transition-all duration-200 focus:ring-2"
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <span className="text-muted-foreground text-sm font-medium">
              {tradeMode === 'buy' ? 'ETH' : 'SHARES'}
            </span>
          </div>
        </div>
      </div>

      {/* Estimate Display */}
      {(estimatedCost || estimatedReturn) && !isCalculating && (
        <div className="bg-muted/10 border-border rounded-lg border p-4 mb-6">
          <h4 className="text-foreground text-sm font-semibold mb-2">
            Transaction Estimate
          </h4>
          {estimatedCost && (
            <>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-muted-foreground">Total Cost:</span>
                <span className="text-foreground font-medium">
                  {formatNumber(estimatedCost.cost)} ETH
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Trading Fee (0.3%):</span>
                <span className="text-foreground font-medium">
                  {formatNumber(estimatedCost.fee)} ETH
                </span>
              </div>
            </>
          )}
          {estimatedReturn && (
            <>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-muted-foreground">You Receive:</span>
                <span className="text-foreground font-medium">
                  {formatNumber(estimatedReturn.returnAmount)} ETH
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Trading Fee (0.3%):</span>
                <span className="text-foreground font-medium">
                  {formatNumber(estimatedReturn.fee)} ETH
                </span>
              </div>
            </>
          )}
        </div>
      )}

      {/* Transaction Status */}
      {txStatus && (
        <div className={`rounded-lg p-3 mb-4 ${
          txStatus.startsWith('✅') ? 'bg-green-500/10 text-green-500' :
          txStatus.startsWith('❌') ? 'bg-red-500/10 text-red-500' :
          'bg-primary/10 text-primary'
        }`}>
          <p className="text-sm font-medium">{txStatus}</p>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="bg-destructive/10 border-destructive/20 rounded-lg border p-3 mb-4">
          <p className="text-destructive text-sm font-medium">
            {error}
          </p>
        </div>
      )}

      {/* Trade Button */}
      <button
        onClick={handleTrade}
        disabled={!amount || isLoading || isCalculating}
        className={`w-full rounded-lg px-6 py-3 text-sm font-semibold transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50 ${
          tradeMode === 'buy'
            ? 'bg-green-500 text-white hover:bg-green-600'
            : 'bg-red-500 text-white hover:bg-red-600'
        }`}
      >
        {isLoading ? 'Processing...' : 
         isCalculating ? 'Calculating...' :
         tradeMode === 'buy' ? 'Buy Shares' : 'Sell Shares'}
      </button>

      {/* Info Footer */}
      <div className="mt-6 pt-4 border-t border-border">
        <p className="text-muted-foreground text-xs text-center">
          📈 Quadratic bonding curve: Price increases with supply
        </p>
        <p className="text-muted-foreground text-xs text-center mt-1">
          Formula: price = basePrice + (supply² × slope)
        </p>
      </div>
    </div>
  )
}