'use client'

import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 rounded-xl text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ring-offset-background',
  {
    variants: {
      variant: {
        default:
          'bg-primary text-background hover:bg-primary/90 focus-visible:ring-primary/80',
        secondary:
          'bg-muted text-foreground hover:bg-muted/80 focus-visible:ring-muted-foreground/40',
        outline:
          'border border-border bg-transparent text-foreground hover:bg-muted/60 focus-visible:ring-border',
        ghost:
          'bg-transparent text-foreground hover:bg-muted/50 focus-visible:ring-muted/70',
        link: 'text-primary underline-offset-4 hover:underline focus-visible:ring-transparent',
      },
      size: {
        sm: 'h-8 rounded-lg px-3 text-xs',
        md: 'h-10 px-4 text-sm',
        lg: 'h-12 rounded-2xl px-5 text-base',
        icon: 'h-10 w-10 rounded-full',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = 'Button'

export { Button, buttonVariants }
