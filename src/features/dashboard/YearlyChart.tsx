import { useMemo } from 'react'
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from 'recharts'
import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import { useActiveHabits, useEntryMap } from '@/hooks/useDerivedData'
import { calculateYearlyTrend } from '@/lib/calculations'
import { useLockinStore } from '@/store/useLockinStore'
import { formatDisplay } from '@/lib/date'

export function YearlyChart() {
  const habits = useActiveHabits()
  const entryMap = useEntryMap()
  const year = useLockinStore((s) => s.selectedYear)

  const data = useMemo(() => calculateYearlyTrend(habits, entryMap, year), [habits, entryMap, year])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Yearly Consistency — {year}</CardTitle>
      </CardHeader>
      <div className="p-4 h-[260px]">
        {data.length < 2 ? (
          <div className="h-full flex items-center justify-center text-[12px] text-tertiary">
            Not enough data yet — keep checking in to see your trend.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="yearlyFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--accent-cyan)" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="var(--accent-cyan)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="var(--border-hairline)" vertical={false} />
              <XAxis
                dataKey="date"
                tickFormatter={(d: string) => formatDisplay(d, 'MMM')}
                tick={{ fill: 'var(--text-tertiary)', fontSize: 10 }}
                axisLine={{ stroke: 'var(--border-hairline)' }}
                tickLine={false}
                minTickGap={30}
              />
              <YAxis
                domain={[0, 100]}
                tick={{ fill: 'var(--text-tertiary)', fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                width={30}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null
                  const d = payload[0].payload as (typeof data)[number]
                  return (
                    <div className="bg-elevated-2 border border-hairline-strong rounded-[3px] px-3 py-2 text-[11px] shadow-lg">
                      <p className="text-primary font-semibold mb-1">{formatDisplay(d.date)}</p>
                      <p className="text-cyan font-mono-tabular">{d.rate}% completion</p>
                      <p className="text-secondary">{d.completed} / {d.scheduled} habits</p>
                    </div>
                  )
                }}
              />
              <Area
                type="monotone"
                dataKey="rate"
                stroke="var(--accent-cyan)"
                strokeWidth={2}
                fill="url(#yearlyFill)"
                dot={false}
                activeDot={{ r: 4, fill: 'var(--accent-cyan)', stroke: 'var(--bg-surface)', strokeWidth: 2 }}
                animationDuration={800}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </Card>
  )
}
