'use client'

import { useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'

import {
  type CompanyData,
  getCompanyAction,
} from '@/app/(app)/dashboard/actions'
import { AccountInfo } from '@/app/(app)/dashboard/components/account-info'
import { CompanyDashboard } from '@/app/(app)/dashboard/components/company-dashboard'
import { EnsSearch } from '@/app/(app)/dashboard/components/ens-search'
import { QuickActions } from '@/app/(app)/dashboard/components/quick-actions'
import { WalletBalance } from '@/app/(app)/dashboard/components/wallet-balance'
import { useWalletAuth } from '@/hooks/use-wallet-auth'

export default function Dashboard() {
  const searchParams = useSearchParams()
  const { authenticated, ready, primaryAddress } = useWalletAuth()
  const [ensName, setEnsName] = useState('')
  const [company, setCompany] = useState<CompanyData | null>(null)
  const [loadingCompany, setLoadingCompany] = useState(false)

  // Handle ENS name from URL params
  useEffect(() => {
    const ensParam = searchParams.get('ens')
    if (ensParam) {
      setEnsName(ensParam)
    }
  }, [searchParams])

  // Fetch company data
  useEffect(() => {
    async function fetchCompany() {
      if (primaryAddress) {
        setLoadingCompany(true)
        try {
          const data = await getCompanyAction(primaryAddress)
          setCompany(data)
        } catch (error) {
          console.error('Error fetching company:', error)
        } finally {
          setLoadingCompany(false)
        }
      }
    }

    if (ready && authenticated) {
      fetchCompany()
    }
  }, [primaryAddress, ready, authenticated])

  if (!authenticated || !ready || loadingCompany) {
    return (
      <div className="bg-background flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="border-primary mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-t-transparent" />
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="from-background via-background to-primary/5 min-h-screen bg-gradient-to-br">
      {/* Dashboard Content */}
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-foreground mb-2 text-3xl font-bold">
            Welcome back!
          </h1>
          <p className="text-muted-foreground">
            Manage your on-chain business and track your progress
          </p>
        </div>

        {/* ENS Search Section or Company Dashboard */}
        {company ? (
          <CompanyDashboard company={company} />
        ) : (
          <EnsSearch initialEnsName={ensName} />
        )}

        <div className="grid gap-6 lg:grid-cols-3">
          {/* User Info Card */}
          <div className="lg:col-span-2">
            <AccountInfo />
          </div>

          {/* Wallet Balance Card */}
          <div className="space-y-6">
            <WalletBalance />

            {/* Quick Actions */}
            <QuickActions />
          </div>
        </div>
      </div>
    </div>
  )
}
