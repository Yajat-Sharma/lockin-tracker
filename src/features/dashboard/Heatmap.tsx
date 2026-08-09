import { useMemo, useState } from 'react'
import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import { useActiveHabits, useEntryMap } from '@/hooks/useDerivedData'
import { calculateDailyCompletion, isHabitScheduledOn, isCompletedOn } from '@/lib/calculations'
import { getWeeksInYear, formatDisplay, isFutureISO, isTodayISO } from '@/lib/date'
import { useLockinStore } from '@/store/useLockinStore'
import { cn } from '@/utils/cn'

const CELL = 11
const GAP = 3

function intensityColor(rate: number, scheduled: number): string {
  if (scheduled === 0) return 'var(--cell-empty)'
  if (rate === 0) return 'var(--cell-empty)'
  if (rate < 30) return 'color-mix(in oklab, var(--accent-green) 25%, var(--cell-empty))'
  if (rate < 60) return 'color-mix(in oklab, var(--accent-green) 55%, var(--cell-empty))'
  if (rate < 90) return 'color-mix(in oklab, var(--accent-green) 80%, var(--cell-empty))'
  return 'var(--accent-green)'
}

export function Heatmap() {
  const habits = useActiveHabits()
  const entryMap = useEntryMap()
  const year = useLockinStore((s) => s.selectedYear)
  const [selected, setSelected] = useState<string | null>(null)

  const weeks = useMemo(() => getWeeksInYear(year), [year])

  const dayStats = useMemo(() => {
    const map = new Map<string, { completed: number; scheduled: number; rate: number }>()
    for (const w of weeks) {
      for (const day of w.days) {
        if (isFutureISO(day)) continue
        map.set(day, calculateDailyCompletion(habits, entryMap, day))
      }
    }
    return map
  }, [weeks, habits, entryMap])

  const selectedHabits = useMemo(() => {
    if (!selected) return []
    return habits
      .filter((h) => isHabitScheduledOn(h, selected))
      .map((h) => ({ habit: h, completed: isCompletedOn(entryMap, h.id, selected) }))
  }, [selected, habits, entryMap])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Yearly Consistency Heatmap</CardTitle>
      </CardHeader>
      <div className="p-4 overflow-x-auto">
        <div className="flex gap-[3px]" style={{ width: weeks.length * (CELL + GAP) }}>
          {weeks.map((w) => (
            <div key={w.weekIndex} className="flex flex-col gap-[3px]">
              {w.days.map((day) => {
                const stat = dayStats.get(day)
                const future = isFutureISO(day)
                return (
                  <button
                    key={day}
                    type="button"
                    disabled={future}
                    onClick={() => setSelected(day)}
                    title={
                      future
                        ? formatDisplay(day)
                        : `${formatDisplay(day)} · ${stat?.completed ?? 0}/${stat?.scheduled ?? 0} habits · ${stat?.rate ?? 0}%`
                    }
                    aria-label={`${formatDisplay(day)}, ${stat ? `${stat.completed} of ${stat.scheduled} habits, ${stat.rate}%` : 'no data'}`}
                    className={cn(
                      'rounded-[2px] transition-transform hover:scale-125 disabled:hover:scale-100 disabled:opacity-30',
                      isTodayISO(day) && 'ring-1 ring-cyan',
                      selected === day && 'ring-1 ring-primary'
                    )}
                    style={{
                      width: CELL,
                      height: CELL,
                      backgroundColor: future ? 'transparent' : intensityColor(stat?.rate ?? 0, stat?.scheduled ?? 0),
                      border: future ? '1px dashed var(--border-hairline)' : 'none',
                    }}
                  />
                )
              })}
            </div>
          ))}
        </div>
        <div className="flex items-center gap-1.5 mt-3 text-[10px] text-tertiary">
          <span>Less</span>
          {[0, 20, 45, 75, 100].map((r) => (
            <span key={r} className="w-2.5 h-2.5 rounded-[2px]" style={{ backgroundColor: intensityColor(r, 1) }} />
          ))}
          <span>More</span>
        </div>

        {selected && (
          <div className="mt-4 pt-4 border-t border-hairline">
            <p className="text-[12px] text-primary font-medium mb-2">{formatDisplay(selected)}</p>
            {selectedHabits.length === 0 ? (
              <p className="text-[11px] text-tertiary">No habits scheduled this day.</p>
            ) : (
              <ul className="flex flex-wrap gap-2">
                {selectedHabits.map(({ habit, completed }) => (
                  <li
                    key={habit.id}
                    className={cn(
                      'flex items-center gap-1.5 px-2 py-1 rounded-[3px] text-[11px] border',
                      completed ? 'border-green/30 bg-green/[0.08] text-green' : 'border-hairline text-tertiary'
                    )}
                  >
                    <span>{habit.icon}</span>
                    {habit.name}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </Card>
  )
}
