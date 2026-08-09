import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { Card } from '@/components/ui/Card'
import { useActiveHabits, useEntryMap } from '@/hooks/useDerivedData'
import { calculateHabitStats } from '@/lib/calculations'
import { cn } from '@/utils/cn'

export function GoalsPage() {
  const habits = useActiveHabits()
  const entryMap = useEntryMap()

  const rows = useMemo(
    () =>
      habits
        .map((habit) => ({ habit, stats: calculateHabitStats(habit, entryMap) }))
        .sort((a, b) => b.stats.totalCompleted / b.habit.goal.target - a.stats.totalCompleted / a.habit.goal.target),
    [habits, entryMap]
  )

  const achieved = rows.filter((r) => r.stats.totalCompleted >= r.habit.goal.target).length

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[20px] font-semibold text-primary">Goals</h1>
          <p className="text-[13px] text-secondary mt-0.5">Progress toward each habit's target.</p>
        </div>
        <div className="text-[12px] text-secondary font-mono-tabular">
          <span className="text-primary font-semibold">{achieved}</span> / {rows.length} achieved
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-hairline rounded-[4px] text-[13px] text-tertiary">
          No habits yet. Add one from the Habits page to set a goal.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {rows.map(({ habit, stats }) => {
            const target = habit.goal.target
            const pct = Math.min(100, Math.round((stats.totalCompleted / target) * 100))
            const done = stats.totalCompleted >= target
            return (
              <Card key={habit.id} className="p-4">
                <div className="flex items-center gap-2.5 mb-3">
                  <span
                    className="w-8 h-8 flex items-center justify-center rounded-[4px] text-[15px] shrink-0"
                    style={{ backgroundColor: `color-mix(in oklab, var(--accent-${habit.color}) 16%, transparent)` }}
                  >
                    {habit.icon}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-medium text-primary truncate">{habit.name}</div>
                    <div className="text-[11px] text-tertiary">
                      Complete {target} times
                    </div>
                  </div>
                  {done && (
                    <span className="text-[9px] uppercase tracking-wide font-semibold text-void bg-green px-1.5 py-0.5 rounded-[2px]">
                      Achieved
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: 'var(--cell-empty)' }}>
                    <motion.div
                      className={cn('h-full rounded-full', done ? 'bg-green' : 'bg-cyan')}
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                    />
                  </div>
                  <span className="font-mono-tabular text-[12px] text-secondary shrink-0">
                    {Math.min(stats.totalCompleted, target)}/{target}
                  </span>
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
