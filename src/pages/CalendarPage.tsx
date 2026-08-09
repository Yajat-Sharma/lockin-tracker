import { useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { useActiveHabits, useEntryMap } from '@/hooks/useDerivedData'
import { calculateDailyCompletion, isHabitScheduledOn, isCompletedOn } from '@/lib/calculations'
import { getDaysInMonth, dayOfWeek, formatDisplay, formatShort, isTodayISO, isFutureISO, MONTH_NAMES } from '@/lib/date'
import { cn } from '@/utils/cn'

function intensityBg(rate: number, scheduled: number): string {
  if (scheduled === 0) return 'transparent'
  if (rate === 0) return 'var(--cell-empty)'
  if (rate < 40) return 'color-mix(in oklab, var(--accent-green) 25%, var(--cell-empty))'
  if (rate < 75) return 'color-mix(in oklab, var(--accent-green) 55%, var(--cell-empty))'
  return 'color-mix(in oklab, var(--accent-green) 85%, var(--cell-empty))'
}

export function CalendarPage() {
  const habits = useActiveHabits()
  const entryMap = useEntryMap()
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth())
  const [selectedDay, setSelectedDay] = useState<string | null>(null)

  const days = useMemo(() => getDaysInMonth(year, month), [year, month])
  const leadingBlanks = dayOfWeek(days[0])

  function goPrev() {
    if (month === 0) {
      setYear((y) => y - 1)
      setMonth(11)
    } else {
      setMonth((m) => m - 1)
    }
    setSelectedDay(null)
  }
  function goNext() {
    if (month === 11) {
      setYear((y) => y + 1)
      setMonth(0)
    } else {
      setMonth((m) => m + 1)
    }
    setSelectedDay(null)
  }

  const dayHabits = useMemo(() => {
    if (!selectedDay) return []
    return habits
      .filter((h) => isHabitScheduledOn(h, selectedDay))
      .map((h) => ({ habit: h, completed: isCompletedOn(entryMap, h.id, selectedDay) }))
  }, [selectedDay, habits, entryMap])

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-[20px] font-semibold text-primary">Calendar</h1>
        <p className="text-[13px] text-secondary mt-0.5">Browse any month and see exactly what got done.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-4">
        <Card>
          <CardHeader>
            <CardTitle>
              {MONTH_NAMES[month]} {year}
            </CardTitle>
            <div className="flex items-center gap-1">
              <Button size="sm" variant="ghost" onClick={goPrev} aria-label="Previous month">
                <ChevronLeft size={14} />
              </Button>
              <Button size="sm" variant="ghost" onClick={goNext} aria-label="Next month">
                <ChevronRight size={14} />
              </Button>
            </div>
          </CardHeader>

          <div className="p-4">
            <div className="grid grid-cols-7 gap-1.5 mb-2">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
                <div key={d} className="text-center text-[10px] font-semibold uppercase tracking-wide text-tertiary">
                  {d}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1.5">
              {Array.from({ length: leadingBlanks }).map((_, i) => (
                <div key={`b-${i}`} />
              ))}
              {days.map((day) => {
                const stats = calculateDailyCompletion(habits, entryMap, day)
                const future = isFutureISO(day)
                return (
                  <button
                    key={day}
                    onClick={() => setSelectedDay(day)}
                    disabled={future && stats.scheduled === 0}
                    className={cn(
                      'aspect-square rounded-[4px] flex flex-col items-center justify-center gap-0.5 border transition-colors',
                      selectedDay === day ? 'border-cyan' : 'border-hairline hover:border-hairline-strong',
                      isTodayISO(day) && 'ring-1 ring-cyan/60'
                    )}
                    style={{ backgroundColor: future ? 'transparent' : intensityBg(stats.rate, stats.scheduled) }}
                  >
                    <span className={cn('text-[11px] font-mono-tabular', future ? 'text-tertiary' : 'text-primary')}>
                      {formatShort(day)}
                    </span>
                    {!future && stats.scheduled > 0 && (
                      <span className="text-[8px] text-secondary font-mono-tabular">{stats.rate}%</span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{selectedDay ? formatDisplay(selectedDay, 'MMM d, yyyy') : 'Select a day'}</CardTitle>
          </CardHeader>
          <div className="p-3 flex flex-col gap-1.5 max-h-[360px] overflow-y-auto">
            {!selectedDay ? (
              <div className="text-[12px] text-tertiary p-3 text-center">Click a day to see its habits.</div>
            ) : dayHabits.length === 0 ? (
              <div className="text-[12px] text-tertiary p-3 text-center">Nothing scheduled this day.</div>
            ) : (
              dayHabits.map(({ habit, completed }) => (
                <div key={habit.id} className="flex items-center gap-2.5 px-2 py-1.5 rounded-[3px] hover:bg-elevated/60">
                  <span className="text-[13px]">{habit.icon}</span>
                  <span className="text-[12px] text-primary flex-1 truncate">{habit.name}</span>
                  <span className={cn('text-[10px] font-medium uppercase tracking-wide', completed ? 'text-green' : 'text-tertiary')}>
                    {completed ? 'Done' : 'Missed'}
                  </span>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}
