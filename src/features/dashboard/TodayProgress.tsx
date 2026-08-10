import { useMemo } from 'react'
import { ProgressRing } from '@/components/ui/ProgressRing'
import { useActiveHabits, useEntryMap } from '@/hooks/useDerivedData'
import { calculateDailyCompletion, calculateHabitStats } from '@/lib/calculations'
import { formatDisplay, todayISO } from '@/lib/date'
import { Flame, Trophy } from 'lucide-react'

export function TodayProgress() {
  const habits = useActiveHabits()
  const entryMap = useEntryMap()
  const today = todayISO()

  const stats = useMemo(() => calculateDailyCompletion(habits, entryMap, today), [habits, entryMap, today])

  const { currentStreak, bestStreak } = useMemo(() => {
    let current = 0
    let best = 0
    for (const h of habits) {
      const s = calculateHabitStats(h, entryMap)
      current = Math.max(current, s.currentStreak)
      best = Math.max(best, s.bestStreak)
    }
    return { currentStreak: current, bestStreak: best }
  }, [habits, entryMap])

  return (
    <section className="bg-surface border border-hairline rounded-[4px] p-5 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center gap-6">
        <div className="flex items-center gap-5">
          <ProgressRing value={stats.rate} size={92} strokeWidth={7} color="var(--accent-cyan)" />
          <div>
            <p className="text-[11px] font-semibold tracking-[0.08em] uppercase text-secondary mb-1">
              Today · {formatDisplay(today, 'MMM d')}
            </p>
            <div className="flex items-baseline gap-1.5">
              <span
                key={stats.completed}
                className="font-mono-tabular text-[32px] sm:text-[40px] font-semibold text-primary leading-none transition-transform duration-200"
              >
                {stats.completed}
              </span>
              <span className="text-[18px] text-tertiary leading-none">/ {stats.scheduled}</span>
              <span className="text-[13px] text-secondary ml-1">habits completed</span>
            </div>
          </div>
        </div>

        <div className="flex-1 hidden lg:block">
          <div className="h-1.5 w-full bg-elevated rounded-full overflow-hidden">
            <div
              className="h-full bg-cyan rounded-full transition-all duration-700 ease-out"
              style={{ width: `${stats.rate}%` }}
            />
          </div>
        </div>

        <div className="flex items-center gap-6 sm:ml-auto">
          <StreakStat icon={<Flame size={15} className="text-amber" />} label="Current streak" value={currentStreak} />
          <div className="w-px h-9 bg-hairline" />
          <StreakStat icon={<Trophy size={15} className="text-cyan" />} label="Best streak" value={bestStreak} />
        </div>
      </div>
    </section>
  )
}

function StreakStat({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <div>
      <div className="flex items-center gap-1.5 text-[11px] text-secondary uppercase tracking-wide mb-1">
        {icon}
        {label}
      </div>
      <p className="font-mono-tabular text-[20px] font-semibold text-primary leading-none">
        {value} <span className="text-[12px] font-normal text-tertiary">days</span>
      </p>
    </div>
  )
}
