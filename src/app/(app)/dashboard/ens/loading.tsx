import { DashboardHeader } from '@/app/(app)/dashboard/components/dashboard-header'

export default function EnsDashboardLoading() {
  return (
    <div className="bg-background text-foreground">
      <DashboardHeader title="ENS Company Names" />
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 pt-6 pb-12 md:px-6">
        <div className="bg-muted/40 h-16 animate-pulse rounded-2xl motion-reduce:animate-none" />
        <div className="bg-muted/40 h-56 animate-pulse rounded-2xl motion-reduce:animate-none" />
        <div className="bg-muted/40 h-12 animate-pulse rounded-xl motion-reduce:animate-none" />
        <div className="bg-muted/40 h-64 animate-pulse rounded-2xl motion-reduce:animate-none" />
      </div>
    </div>
  )
}
