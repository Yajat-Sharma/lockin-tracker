import { useMemo, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, Zap } from 'lucide-react'
import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { useActiveHabits, useEntryMap } from '@/hooks/useDerivedData'
import { useLockinStore } from '@/store/useLockinStore'
import { isHabitScheduledOn, isCompletedOn } from '@/lib/calculations'
import { todayISO } from '@/lib/date'
import { cn } from '@/utils/cn'

export function TodayChecklist() {
  const habits = useActiveHabits()
  const entryMap = useEntryMap()
  const toggleEntry = useLockinStore((s) => s.toggleEntry)
  const completeAllToday = useLockinStore((s) => s.completeAllToday)
  const today = todayISO()
  const [selected, setSelected] = useState(0)
  const listRef = useRef<HTMLDivElement>(null)

  const scheduled = useMemo(
    () => habits.filter((h) => isHabitScheduledOn(h, today)),
    [habits, today]
  )

  function onKeyDown(e: React.KeyboardEvent) {
    if (scheduled.length === 0) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelected((s) => Math.min(scheduled.length - 1, s + 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelected((s) => Math.max(0, s - 1))
    } else if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault()
      const h = scheduled[selected]
      if (h) toggleEntry(h.id, today)
    }
  }

  return (
    <Card className="flex flex-col">
      <CardHeader>
        <CardTitle>Today's Check-in</CardTitle>
        <Button size="sm" variant="ghost" onClick={() => completeAllToday()} disabled={scheduled.length === 0}>
          <Zap size={12} /> Complete all
        </Button>
      </CardHeader>

      <div
        ref={listRef}
        role="listbox"
        aria-label="Today's habits"
        tabIndex={0}
        onKeyDown={onKeyDown}
        className="flex-1 overflow-y-auto p-2 max-h-[260px] outline-none"
      >
        {scheduled.length === 0 ? (
          <div className="p-6 text-center text-[12px] text-tertiary">
            Nothing scheduled for today. Enjoy the rest.
          </div>
        ) : (
          scheduled.map((h, i) => {
            const completed = isCompletedOn(entryMap, h.id, today)
            return (
              <button
                key={h.id}
                role="option"
                aria-selected={i === selected}
                onClick={() => {
                  setSelected(i)
                  toggleEntry(h.id, today)
                }}
                onFocus={() => setSelected(i)}
                className={cn(
                  'w-full flex items-center gap-2.5 px-2.5 py-2 rounded-[3px] text-left transition-colors',
                  i === selected ? 'bg-elevated' : 'hover:bg-elevated/60'
                )}
              >
                <span
                  className={cn(
                    'flex items-center justify-center w-5 h-5 rounded-[3px] shrink-0 transition-colors',
                    completed ? 'bg-green' : 'border border-hairline-strong'
                  )}
                >
                  <AnimatePresence>
                    {completed && (
                      <motion.span
                        initial={{ scale: 0.4, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.4, opacity: 0 }}
                        className="text-void"
                      >
                        <Check size={12} strokeWidth={3} />
                      </motion.span>
                    )}
                  </AnimatePresence>
                </span>
                <span className="text-[13px]">{h.icon}</span>
                <span className={cn('text-[13px] flex-1 truncate', completed ? 'text-tertiary line-through' : 'text-primary')}>
                  {h.name}
                </span>
              </button>
            )
          })
        )}
      </div>

      <div className="px-4 py-2 border-t border-hairline text-[10px] text-tertiary">
        ↑↓ to navigate · Space or Enter to toggle
      </div>
    </Card>
  )
}
