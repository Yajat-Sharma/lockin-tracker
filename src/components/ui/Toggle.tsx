import { motion } from 'framer-motion'
import { cn } from '@/utils/cn'

interface ToggleProps {
  checked: boolean
  onChange: (checked: boolean) => void
  label?: string
  id?: string
}

export function Toggle({ checked, onChange, label, id }: ToggleProps) {
  return (
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label || 'Toggle switch'}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative w-9 h-5 rounded-full transition-colors duration-150 shrink-0',
        checked ? 'bg-cyan' : 'bg-elevated-2 border border-hairline-strong'
      )}
    >
      <motion.span
        className="absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-void"
        animate={{ x: checked ? 16 : 0 }}
        transition={{ type: 'spring', stiffness: 500, damping: 32 }}
      />
    </button>
  )
}

interface SegmentedControlProps<T extends string> {
  options: { value: T; label: string }[]
  value: T
  onChange: (value: T) => void
  label?: string
}

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  label,
}: SegmentedControlProps<T>) {
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className="inline-flex p-0.5 bg-elevated border border-hairline rounded-[4px]"
    >
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          role="radio"
          aria-checked={value === opt.value}
          onClick={() => onChange(opt.value)}
          className={cn(
            'relative px-3 min-h-[32px] text-[12px] font-medium rounded-[3px] transition-colors duration-150',
            value === opt.value ? 'bg-elevated-2 text-primary' : 'text-secondary hover:text-primary'
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}
