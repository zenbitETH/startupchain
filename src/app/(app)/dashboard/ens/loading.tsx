import { DashboardHeader } from '@/app/(app)/dashboard/components/dashboard-header'

export default function EnsDashboardLoading() {
  return (
    <div className="bg-background text-foreground">
      <DashboardHeader title="ENS Company Names" />
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 pt-6 pb-12 md:px-6">
        <div className="bg-muted/40 h-16 animate-pulse rounded-2xl motion-reduce:animate-none" />
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="bg-muted/40 h-52 animate-pulse rounded-2xl motion-reduce:animate-none lg:col-span-2" />
          <div className="bg-muted/40 h-52 animate-pulse rounded-2xl motion-reduce:animate-none" />
        </div>
        <div className="bg-muted/40 h-52 animate-pulse rounded-2xl motion-reduce:animate-none" />
        <div className="grid gap-4 xl:grid-cols-2">
          <div className="bg-muted/40 h-64 animate-pulse rounded-2xl motion-reduce:animate-none" />
          <div className="bg-muted/40 h-64 animate-pulse rounded-2xl motion-reduce:animate-none" />
        </div>
      </div>
    </div>
  )
}
