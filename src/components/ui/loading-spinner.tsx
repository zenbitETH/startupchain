'use client'

import { cn } from '@/lib/utils'

interface LoadingSpinnerProps {
  size?: 'sm' | 'lg'
  className?: string
}

export function LoadingSpinner({
  size = 'sm',
  className,
}: LoadingSpinnerProps) {
  const dimensions = size === 'sm' ? 'w-4 h-4' : 'w-6 h-6'

  return (
    <div className={cn('inline-flex items-center justify-center', className)}>
      <svg
        className={cn('animate-spin text-current opacity-75', dimensions)}
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        aria-label="Loading"
        role="status"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
    </div>
  )
}
