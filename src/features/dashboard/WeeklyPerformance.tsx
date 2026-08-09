import { useMemo } from 'react'
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Cell } from 'recharts'
import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import { useActiveHabits, useEntryMap } from '@/hooks/useDerivedData'
import { calculateWeeklyStats } from '@/lib/calculations'
import { useLockinStore } from '@/store/useLockinStore'
import { formatDisplay } from '@/lib/date'

export function WeeklyPerformance() {
  const habits = useActiveHabits()
  const entryMap = useEntryMap()
  const year = useLockinStore((s) => s.selectedYear)

  const data = useMemo(() => {
    const all = calculateWeeklyStats(habits, entryMap, year)
    const withData = all.filter((w) => w.scheduled > 0)
    return withData.slice(-8) // last 8 active weeks — keeps the chart legible
  }, [habits, entryMap, year])

  return (
    <Card className="flex flex-col">
      <CardHeader>
        <CardTitle>Weekly Performance</CardTitle>
      </CardHeader>
      <div className="p-4 h-[220px]">
        {data.length === 0 ? (
          <EmptyState />
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <XAxis
                dataKey="label"
                tickFormatter={(l: string) => l.replace('WEEK ', 'W')}
                tick={{ fill: 'var(--text-tertiary)', fontSize: 10 }}
                axisLine={{ stroke: 'var(--border-hairline)' }}
                tickLine={false}
              />
              <YAxis
                domain={[0, 100]}
                tick={{ fill: 'var(--text-tertiary)', fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                width={30}
              />
              <Tooltip
                cursor={{ fill: 'var(--bg-elevated)' }}
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null
                  const d = payload[0].payload as (typeof data)[number]
                  return (
                    <div className="bg-elevated-2 border border-hairline-strong rounded-[3px] px-3 py-2 text-[11px] shadow-lg">
                      <p className="text-primary font-semibold mb-1">{d.label}</p>
                      <p className="text-secondary">{formatDisplay(d.startDate, 'MMM d')} – {formatDisplay(d.endDate, 'MMM d')}</p>
                      <p className="text-green mt-1">{d.completed} completed</p>
                      <p className="text-red">{d.scheduled - d.completed} missed</p>
                      <p className="text-cyan font-mono-tabular">{d.rate}%</p>
                    </div>
                  )
                }}
              />
              <Bar dataKey="rate" radius={[2, 2, 0, 0]} maxBarSize={28}>
                {data.map((d) => (
                  <Cell key={d.weekIndex} fill={d.rate >= 70 ? 'var(--accent-green)' : d.rate >= 40 ? 'var(--accent-cyan)' : 'var(--accent-red)'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </Card>
  )
}

function EmptyState() {
  return (
    <div className="h-full flex items-center justify-center text-[12px] text-tertiary">
      No check-ins yet this year.
    </div>
  )
}
