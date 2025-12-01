import {
  BadgeCheck,
  Clock,
  FileCheck,
  Landmark,
  Milestone,
  Receipt,
  Shield,
  UserPlus,
} from 'lucide-react'

import { DashboardHeader } from '@/app/(app)/dashboard/components/dashboard-header'

const attestationTypes = [
  {
    icon: Landmark,
    title: 'Company Formation',
    description: 'Proof your company was registered on-chain with founders',
  },
  {
    icon: FileCheck,
    title: 'Governance Decisions',
    description: 'Record of votes, proposals, and board decisions',
  },
  {
    icon: Receipt,
    title: 'Financial Transactions',
    description: 'Verifiable receipts for treasury activity',
  },
  {
    icon: Milestone,
    title: 'Milestones',
    description: 'Company progress markers and achievements',
  },
  {
    icon: UserPlus,
    title: 'Membership Changes',
    description: 'Track founder and team member additions/removals',
  },
  {
    icon: Shield,
    title: 'Contract Deployments',
    description: 'Record of smart contracts deployed by your company',
  },
]

export default function AttestationsDashboardPage() {
  return (
    <div className="bg-background text-foreground">
      <DashboardHeader title="EAS Attestations" />

      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 pt-6 pb-12 md:px-6">
        <div className="flex flex-col gap-2">
          <p className="text-muted-foreground text-sm">
            Create verifiable, on-chain proofs of your company&apos;s activities
            using the Ethereum Attestation Service (EAS).
          </p>
        </div>

        {/* Coming Soon Banner */}
        <section className="bg-card border-border rounded-2xl border p-8 text-center shadow-sm">
          <div className="bg-primary/10 mx-auto w-fit rounded-full p-4">
            <Clock className="text-primary h-8 w-8" />
          </div>
          <h2 className="text-foreground mt-4 text-xl font-semibold">
            Coming Soon
          </h2>
          <p className="text-muted-foreground mx-auto mt-2 max-w-lg">
            Attestations will allow you to create immutable, verifiable proofs
            of your company&apos;s history. Perfect for investor due diligence,
            audit trails, and building credibility.
          </p>
          <div className="mt-4 flex items-center justify-center gap-2">
            <BadgeCheck className="text-primary h-4 w-4" />
            <span className="text-muted-foreground text-sm">
              Powered by Ethereum Attestation Service
            </span>
          </div>
        </section>

        {/* Attestation Types Preview */}
        <section className="bg-card border-border rounded-2xl border p-6 shadow-sm">
          <h3 className="text-foreground text-lg font-semibold">
            Attestation Types
          </h3>
          <p className="text-muted-foreground mt-1 text-sm">
            Six types of on-chain attestations for comprehensive company records
          </p>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {attestationTypes.map((type) => (
              <div
                key={type.title}
                className="bg-muted/40 border-border/70 rounded-xl border p-4"
              >
                <type.icon className="text-primary h-5 w-5" />
                <p className="text-foreground mt-2 font-medium">{type.title}</p>
                <p className="text-muted-foreground mt-1 text-sm">
                  {type.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Why Attestations */}
        <section className="bg-card border-border rounded-2xl border p-6 shadow-sm">
          <h3 className="text-foreground text-lg font-semibold">
            Why Use Attestations?
          </h3>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <p className="text-foreground font-medium">
                🔍 Investor Due Diligence
              </p>
              <p className="text-muted-foreground text-sm">
                Prove your company history on-chain for fundraising
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-foreground font-medium">📋 Audit Trail</p>
              <p className="text-muted-foreground text-sm">
                Immutable record of treasury and governance decisions
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-foreground font-medium">✅ Credibility</p>
              <p className="text-muted-foreground text-sm">
                Verifiable milestones build trust with stakeholders
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-foreground font-medium">⚖️ Compliance</p>
              <p className="text-muted-foreground text-sm">
                On-chain evidence for legal and regulatory needs
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
