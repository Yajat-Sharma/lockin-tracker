import { useCallback, useMemo, useRef, useState, type KeyboardEvent } from 'react'
import { getWeeksInYear, isTodayISO, isFutureISO, todayISO, formatShort, formatDisplay } from '@/lib/date'
import { isHabitScheduledOn, isCompletedOn } from '@/lib/calculations'
import { useActiveHabits, useEntryMap } from '@/hooks/useDerivedData'
import { useLockinStore } from '@/store/useLockinStore'
import { HabitCell } from './HabitCell'
import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import { cn } from '@/utils/cn'

const CELL_SIZE = 28
const NAME_COL_WIDTH = 188

export function HabitMatrix() {
  const habits = useActiveHabits()
  const entryMap = useEntryMap()
  const toggleEntry = useLockinStore((s) => s.toggleEntry)
  const year = useLockinStore((s) => s.selectedYear)
  const [focused, setFocused] = useState<{ row: number; col: number }>({ row: 0, col: 0 })
  const [hovered, setHovered] = useState<{ habit: string; date: string; completed: boolean } | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  const weeks = useMemo(() => getWeeksInYear(year), [year])
  const allDays = useMemo(() => weeks.flatMap((w) => w.days), [weeks])
  const today = todayISO()

  // scroll to current week/today on first paint of the current year
  const didScroll = useRef(false)
  const scrollToToday = useCallback(
    (node: HTMLDivElement | null) => {
      scrollRef.current = node
      if (node && !didScroll.current) {
        const idx = allDays.indexOf(today)
        if (idx >= 0) {
          node.scrollLeft = Math.max(0, idx * CELL_SIZE - node.clientWidth / 2)
          didScroll.current = true
        }
      }
    },
    [allDays, today]
  )

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      const maxRow = habits.length - 1
      const maxCol = allDays.length - 1
      let { row, col } = focused
      switch (e.key) {
        case 'ArrowRight':
          col = Math.min(maxCol, col + 1)
          break
        case 'ArrowLeft':
          col = Math.max(0, col - 1)
          break
        case 'ArrowDown':
          row = Math.min(maxRow, row + 1)
          break
        case 'ArrowUp':
          row = Math.max(0, row - 1)
          break
        case ' ':
        case 'Spacebar': {
          e.preventDefault()
          const habit = habits[row]
          const date = allDays[col]
          if (habit && date && isHabitScheduledOn(habit, date) && !isFutureISO(date)) {
            toggleEntry(habit.id, date)
          }
          return
        }
        default:
          return
      }
      e.preventDefault()
      setFocused({ row, col })
    },
    [focused, habits, allDays, toggleEntry]
  )

  if (habits.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Yearly Habit Matrix</CardTitle>
        </CardHeader>
        <div className="p-10 text-center text-secondary text-[13px]">
          No habits yet. Add your first habit to start building the matrix.
        </div>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Yearly Habit Matrix — {year}</CardTitle>
        <div className="flex items-center gap-3 text-[10px] text-tertiary">
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-[2px] bg-green inline-block" /> Completed
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-[2px] border border-hairline-strong inline-block" /> Missed
          </span>
        </div>
      </CardHeader>

      <div
        ref={scrollToToday}
        role="grid"
        aria-label="Yearly habit completion matrix"
        onKeyDown={handleKeyDown}
        className="overflow-auto max-h-[520px] relative"
      >
        <div style={{ width: NAME_COL_WIDTH + allDays.length * CELL_SIZE }}>
          {/* Header: week labels */}
          <div className="flex sticky top-0 z-20 bg-surface">
            <div
              className="sticky left-0 z-30 bg-surface shrink-0 border-r border-b border-hairline flex items-end px-3 pb-1.5"
              style={{ width: NAME_COL_WIDTH, height: 26 }}
            >
              <span className="text-[9px] font-semibold uppercase tracking-wider text-tertiary">Habit</span>
            </div>
            {weeks.map((w) => (
              <div
                key={w.weekIndex}
                className={cn(
                  'flex items-center justify-center border-r border-b border-hairline text-[9px] font-semibold tracking-wider uppercase shrink-0',
                  w.days.includes(today) ? 'text-cyan bg-cyan/[0.06]' : 'text-tertiary'
                )}
                style={{ width: CELL_SIZE * 7, height: 26 }}
              >
                {w.label}
              </div>
            ))}
          </div>
          {/* Header: date numbers */}
          <div className="flex sticky z-20 bg-surface" style={{ top: 26 }}>
            <div
              className="sticky left-0 z-30 bg-surface shrink-0 border-r border-b border-hairline"
              style={{ width: NAME_COL_WIDTH, height: 30 }}
            />
            {allDays.map((day) => (
              <div
                key={day}
                className={cn(
                  'flex flex-col items-center justify-center border-r border-b border-hairline shrink-0',
                  isTodayISO(day) ? 'bg-cyan/10' : ''
                )}
                style={{ width: CELL_SIZE, height: 30 }}
                title={formatDisplay(day)}
              >
                <span className={cn('text-[9px] font-mono-tabular', isTodayISO(day) ? 'text-cyan font-semibold' : 'text-tertiary')}>
                  {formatShort(day)}
                </span>
              </div>
            ))}
          </div>

          {/* Rows */}
          {habits.map((habit, rowIdx) => {
            return (
              <div key={habit.id} className="flex">
                <div
                  className="sticky left-0 z-10 bg-surface shrink-0 border-r border-b border-hairline flex items-center gap-2 px-3"
                  style={{ width: NAME_COL_WIDTH, height: CELL_SIZE }}
                >
                  <span className="text-[13px] leading-none">{habit.icon}</span>
                  <span className="text-[12px] text-primary truncate font-medium">{habit.name}</span>
                </div>
                {allDays.map((day, colIdx) => {
                  const scheduled = isHabitScheduledOn(habit, day)
                  const completed = isCompletedOn(entryMap, habit.id, day)
                  return (
                    <div
                      key={day}
                      onMouseEnter={() => setHovered({ habit: habit.name, date: day, completed })}
                      onMouseLeave={() => setHovered((h) => (h?.date === day && h.habit === habit.name ? null : h))}
                    >
                      <HabitCell
                        completed={completed}
                        scheduled={scheduled}
                        isToday={isTodayISO(day)}
                        isFuture={isFutureISO(day)}
                        isFocused={focused.row === rowIdx && focused.col === colIdx}
                        color={`var(--accent-${habit.color})`}
                        habitName={habit.name}
                        dateLabel={formatDisplay(day)}
                        cellSize={CELL_SIZE}
                        onFocus={() => setFocused({ row: rowIdx, col: colIdx })}
                        onToggle={() => toggleEntry(habit.id, day)}
                      />
                    </div>
                  )
                })}
              </div>
            )
          })}
        </div>
      </div>

      <div className="px-4 py-2 border-t border-hairline text-[11px] text-secondary h-8 flex items-center">
        {hovered ? (
          <span>
            <span className="text-primary font-medium">{hovered.habit}</span> · {formatDisplay(hovered.date)} ·{' '}
            <span className={hovered.completed ? 'text-green' : 'text-tertiary'}>
              {hovered.completed ? 'Completed' : 'Not completed'}
            </span>
          </span>
        ) : (
          <span className="text-tertiary">
            Click a cell to toggle · Arrow keys to navigate · Space to toggle focused cell
          </span>
        )}
      </div>
    </Card>
  )
}
