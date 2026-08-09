import { useMemo } from 'react'
import { Sparkles } from 'lucide-react'
import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import { useActiveHabits, useEntryMap } from '@/hooks/useDerivedData'
import {
  calculateHabitRanking,
  calculateCompletionByDayOfWeek,
  calculateWeeklyStats,
} from '@/lib/calculations'
import { daysAgoISO } from '@/lib/calculations'
import { useLockinStore } from '@/store/useLockinStore'

export function DisciplineInsights() {
  const habits = useActiveHabits()
  const entryMap = useEntryMap()
  const year = useLockinStore((s) => s.selectedYear)

  const insights = useMemo(() => {
    const list: string[] = []
    const ranking = calculateHabitRanking(habits, entryMap)

    if (ranking.length > 0) {
      const best = ranking[0]
      if (best.stats.totalScheduled > 0) {
        list.push(`Your strongest habit is ${best.habit.name} at ${best.stats.completionRate}% completion.`)
      }
      const worst = ranking[ranking.length - 1]
      if (worst.stats.totalScheduled >= 5 && worst.habit.id !== best.habit.id) {
        list.push(`${worst.habit.name} is your most inconsistent habit at ${worst.stats.completionRate}%.`)
      }
      const longest = ranking.reduce((a, b) => (b.stats.bestStreak > a.stats.bestStreak ? b : a))
      if (longest.stats.bestStreak > 0) {
        list.push(`Your longest streak is ${longest.stats.bestStreak} days, set on ${longest.habit.name}.`)
      }
    }

    const byDow = calculateCompletionByDayOfWeek(habits, entryMap, daysAgoISO(60))
    const weekdayRates = byDow.filter((d) => d.dow >= 1 && d.dow <= 5 && d.scheduled > 0)
    const weekendRates = byDow.filter((d) => (d.dow === 0 || d.dow === 6) && d.scheduled > 0)
    if (weekdayRates.length > 0 && weekendRates.length > 0) {
      const wdAvg = weekdayRates.reduce((s, d) => s + d.rate, 0) / weekdayRates.length
      const weAvg = weekendRates.reduce((s, d) => s + d.rate, 0) / weekendRates.length
      const diff = Math.round(wdAvg - weAvg)
      if (Math.abs(diff) >= 8) {
        list.push(
          diff > 0
            ? `You complete ${diff}% more habits on weekdays than weekends.`
            : `You complete ${Math.abs(diff)}% more habits on weekends than weekdays.`
        )
      }
    }

    const weeklyStats = calculateWeeklyStats(habits, entryMap, year).filter((w) => w.scheduled > 0)
    if (weeklyStats.length >= 2) {
      const last = weeklyStats[weeklyStats.length - 1]
      const prev = weeklyStats[weeklyStats.length - 2]
      const delta = last.rate - prev.rate
      if (Math.abs(delta) >= 8) {
        list.push(
          delta > 0
            ? `Your consistency rose by ${delta}% this week compared to last.`
            : `Your consistency dropped by ${Math.abs(delta)}% this week compared to last.`
        )
      }
    }

    return list.slice(0, 5)
  }, [habits, entryMap, year])

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-1.5">
          <Sparkles size={12} className="text-cyan" /> Discipline Insights
        </CardTitle>
      </CardHeader>
      <div className="p-4">
        {insights.length === 0 ? (
          <p className="text-[12px] text-tertiary">
            Keep checking in — insights appear once there's enough data to be meaningful.
          </p>
        ) : (
          <ul className="space-y-2.5">
            {insights.map((text, i) => (
              <li key={i} className="text-[12.5px] text-secondary leading-relaxed flex gap-2">
                <span className="text-cyan mt-0.5 shrink-0">·</span>
                {text}
              </li>
            ))}
          </ul>
        )}
      </div>
    </Card>
  )
}
