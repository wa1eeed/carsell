import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors',
  {
    variants: {
      variant: {
        default:     'bg-cl-primary text-white',
        accent:      'bg-cl-accent-light text-cl-accent-hover',
        success:     'bg-cl-success-light text-cl-success',
        warning:     'bg-cl-warning-light text-cl-warning',
        destructive: 'bg-cl-danger-light text-cl-danger',
        outline:     'border border-cl-gray-200 text-cl-text-secondary bg-white',
        secondary:   'bg-cl-gray-100 text-cl-gray-600',
      },
    },
    defaultVariants: { variant: 'default' },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }
