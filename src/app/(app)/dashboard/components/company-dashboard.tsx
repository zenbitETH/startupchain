'use client'

import { Building2, Calendar, Copy, ExternalLink, Users } from 'lucide-react'
import { toast } from 'sonner'

import { type CompanyData } from '@/app/(app)/dashboard/actions'

interface CompanyDashboardProps {
  company: CompanyData
}

export function CompanyDashboard({ company }: CompanyDashboardProps) {
  const copyAddress = () => {
    navigator.clipboard
      .writeText(company.companyAddress)
      .then(() => {
        toast.success('Address copied to clipboard')
      })
      .catch(console.error)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  return (
    <div className="bg-card border-border mb-8 rounded-2xl border p-6">
      <div className="mb-6 flex items-center gap-4">
        <div className="bg-primary/10 flex h-12 w-12 items-center justify-center rounded-2xl">
          <Building2 className="text-primary h-6 w-6" />
        </div>
        <div>
          <h2 className="text-foreground text-xl font-semibold">
            Your Company
          </h2>
          <p className="text-muted-foreground text-sm">
            Manage your on-chain organization
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {/* Company Name */}
        <div className="bg-background flex items-center justify-between rounded-2xl p-4">
          <div className="flex items-center gap-3">
            <div className="from-secondary to-primary flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br text-white font-bold">
              {company.ensName.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-foreground font-medium text-lg">
                {company.ensName}.eth
              </p>
              <p className="text-muted-foreground text-xs">
                Company ID: {company.id}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="bg-green-100 text-green-800 rounded-full px-3 py-1 text-xs font-medium">
              Active
            </span>
          </div>
        </div>

        {/* Company Address */}
        <div className="bg-background flex items-center justify-between rounded-2xl p-4">
          <div className="flex items-center gap-3">
            <Building2 className="text-muted-foreground h-5 w-5" />
            <div>
              <p className="text-foreground font-medium">Company Address</p>
              <p className="text-muted-foreground font-mono text-sm">
                {formatAddress(company.companyAddress)}
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
              href={`https://sepolia.etherscan.io/address/${company.companyAddress}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <ExternalLink className="h-4 w-4" />
            </a>
          </div>
        </div>

        {/* Founders */}
        <div className="bg-background rounded-2xl p-4">
          <div className="mb-3 flex items-center gap-3">
            <Users className="text-muted-foreground h-5 w-5" />
            <p className="text-foreground font-medium">Founders</p>
          </div>
          <div className="space-y-2 pl-8">
            {company.founders.map((founder, index) => (
              <div
                key={index}
                className="text-muted-foreground font-mono text-sm flex items-center gap-2"
              >
                <div className="h-1.5 w-1.5 rounded-full bg-primary/50" />
                {formatAddress(founder)}
              </div>
            ))}
          </div>
        </div>

        {/* Creation Date */}
        <div className="bg-background flex items-center justify-between rounded-2xl p-4">
          <div className="flex items-center gap-3">
            <Calendar className="text-muted-foreground h-5 w-5" />
            <div>
              <p className="text-foreground font-medium">Established</p>
              <p className="text-muted-foreground text-sm">
                {formatDate(company.creationDate)}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
