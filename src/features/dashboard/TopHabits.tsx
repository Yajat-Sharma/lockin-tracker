import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import { useActiveHabits, useEntryMap } from '@/hooks/useDerivedData'
import { calculateHabitRanking } from '@/lib/calculations'

export function TopHabits() {
  const habits = useActiveHabits()
  const entryMap = useEntryMap()

  const ranking = useMemo(() => calculateHabitRanking(habits, entryMap).slice(0, 10), [habits, entryMap])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Top Daily Habits</CardTitle>
      </CardHeader>
      <div className="p-2">
        {ranking.length === 0 ? (
          <div className="p-8 text-center text-[12px] text-tertiary">No habits to rank yet.</div>
        ) : (
          <ul>
            {ranking.map((entry, i) => (
              <motion.li
                key={entry.habit.id}
                layout
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.2 }}
                className="flex items-center gap-3 px-2.5 py-2 rounded-[3px] hover:bg-elevated transition-colors"
              >
                <span className="w-5 text-[11px] font-mono-tabular text-tertiary shrink-0">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <span className="text-[14px] shrink-0">{entry.habit.icon}</span>
                <span className="text-[12.5px] text-primary flex-1 truncate">{entry.habit.name}</span>
                <div className="w-16 h-1 rounded-full bg-elevated-2 overflow-hidden hidden sm:block">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${entry.stats.completionRate}%`,
                      backgroundColor: `var(--accent-${entry.habit.color})`,
                    }}
                  />
                </div>
                <span className="font-mono-tabular text-[12px] text-secondary w-9 text-right shrink-0">
                  {entry.stats.completionRate}%
                </span>
              </motion.li>
            ))}
          </ul>
        )}
      </div>
    </Card>
  )
}
