import { memo } from 'react'
import { motion } from 'framer-motion'
import { Check } from 'lucide-react'
import { cn } from '@/utils/cn'

interface HabitCellProps {
  completed: boolean
  scheduled: boolean
  isToday: boolean
  isFuture: boolean
  isFocused: boolean
  color: string
  habitName: string
  dateLabel: string
  onToggle: () => void
  onFocus: () => void
  cellSize: number
}

function HabitCellInner({
  completed,
  scheduled,
  isToday,
  isFuture,
  isFocused,
  color,
  habitName,
  dateLabel,
  onToggle,
  onFocus,
  cellSize,
}: HabitCellProps) {
  const disabled = !scheduled || isFuture

  return (
    <div
      className="flex items-center justify-center shrink-0 border-r border-b border-hairline/60"
      style={{ width: cellSize, height: cellSize }}
    >
      <button
        type="button"
        disabled={disabled}
        tabIndex={isFocused ? 0 : -1}
        onFocus={onFocus}
        onClick={onToggle}
        aria-label={`${habitName}, ${dateLabel}, ${
          disabled ? 'not scheduled' : completed ? 'completed' : 'incomplete'
        }`}
        aria-pressed={completed}
        className={cn(
          'group relative flex items-center justify-center rounded-[2px] transition-colors duration-100',
          'disabled:cursor-default cursor-pointer',
          isToday && 'ring-1 ring-cyan/70'
        )}
        style={{
          width: cellSize - 6,
          height: cellSize - 6,
          backgroundColor: !scheduled ? 'transparent' : completed ? color : 'var(--cell-empty)',
          border: !scheduled
            ? 'none'
            : completed
              ? 'none'
              : `1px solid var(--cell-empty-border)`,
        }}
      >
        {scheduled && completed && (
          <motion.span
            initial={{ scale: 0.4, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 500, damping: 22 }}
            className="flex items-center justify-center text-void"
          >
            <Check size={Math.max(9, cellSize * 0.4)} strokeWidth={3} />
          </motion.span>
        )}
        {scheduled && !completed && !isFuture && (
          <span className="opacity-0 group-hover:opacity-100 transition-opacity w-1 h-1 rounded-full bg-tertiary" />
        )}
      </button>
    </div>
  )
}

export const HabitCell = memo(HabitCellInner)
