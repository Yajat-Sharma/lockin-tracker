import { type ButtonHTMLAttributes, forwardRef } from 'react'
import { cn } from '@/utils/cn'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md'
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'secondary', size = 'md', ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center gap-1.5 rounded-[3px] font-medium transition-colors duration-150 disabled:opacity-40 disabled:pointer-events-none whitespace-nowrap',
          size === 'sm' ? 'h-7 px-2.5 text-[12px]' : 'h-9 px-3.5 text-[13px]',
          variant === 'primary' &&
            'bg-cyan text-void hover:brightness-110 active:brightness-95 font-semibold',
          variant === 'secondary' &&
            'bg-elevated text-primary border border-hairline hover:bg-elevated-2 hover:border-hairline-strong',
          variant === 'ghost' && 'text-secondary hover:text-primary hover:bg-elevated',
          variant === 'danger' &&
            'bg-elevated text-red border border-hairline hover:bg-red/10 hover:border-red/40',
          className
        )}
        {...props}
      />
    )
  }
)
Button.displayName = 'Button'
