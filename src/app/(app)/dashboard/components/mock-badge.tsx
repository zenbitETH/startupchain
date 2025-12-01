import { cn } from '@/lib/utils'

export function MockBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        'border-border/70 bg-muted/30 text-muted-foreground inline-flex items-center rounded-full border border-dashed px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide',
        className
      )}
    >
      Mock
    </span>
  )
}
