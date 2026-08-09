import { useMemo } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  Cell,
  RadialBarChart,
  RadialBar,
  PolarAngleAxis,
} from 'recharts'
import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import { useActiveHabits, useEntryMap } from '@/hooks/useDerivedData'
import {
  calculateHabitRanking,
  calculateCompletionByDayOfWeek,
  calculateCompletionRate,
  daysAgoISO,
} from '@/lib/calculations'
import { todayISO } from '@/lib/date'
import { DisciplineInsights } from '@/features/dashboard/DisciplineInsights'
import { YearlyChart } from '@/features/dashboard/YearlyChart'
import { Heatmap } from '@/features/dashboard/Heatmap'

const DOW_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export function AnalyticsPage() {
  const habits = useActiveHabits()
  const entryMap = useEntryMap()
  const today = todayISO()

  const overall = useMemo(() => {
    let completed = 0
    let scheduled = 0
    for (const h of habits) {
      const r = calculateCompletionRate(h, entryMap)
      completed += r.completed
      scheduled += r.scheduled
    }
    return scheduled === 0 ? 0 : Math.round((completed / scheduled) * 100)
  }, [habits, entryMap])

  const last30 = useMemo(() => {
    let completed = 0
    let scheduled = 0
    for (const h of habits) {
      const r = calculateCompletionRate(h, entryMap, daysAgoISO(29), today)
      completed += r.completed
      scheduled += r.scheduled
    }
    return scheduled === 0 ? 0 : Math.round((completed / scheduled) * 100)
  }, [habits, entryMap, today])

  const ranking = useMemo(() => calculateHabitRanking(habits, entryMap), [habits, entryMap])
  const best = ranking.slice(0, 3)
  const worst = ranking.slice(-3).reverse()

  const dow = useMemo(
    () => calculateCompletionByDayOfWeek(habits, entryMap, daysAgoISO(90)).map((d) => ({ ...d, label: DOW_LABELS[d.dow] })),
    [habits, entryMap]
  )

  const longestCurrent = useMemo(() => Math.max(0, ...ranking.map((r) => r.stats.currentStreak)), [ranking])
  const longestEver = useMemo(() => Math.max(0, ...ranking.map((r) => r.stats.bestStreak)), [ranking])

  const radialData = [{ name: 'overall', value: overall, fill: 'var(--accent-cyan)' }]

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-[20px] font-semibold text-primary">Analytics</h1>
        <p className="text-[13px] text-secondary mt-0.5">
          A deeper look at your consistency, trends, and where the gaps are.
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Overall consistency" value={`${overall}%`} />
        <StatCard label="Last 30 days" value={`${last30}%`} />
        <StatCard label="Current best streak" value={String(longestCurrent)} suffix="days" />
        <StatCard label="Longest streak ever" value={String(longestEver)} suffix="days" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-1 flex flex-col items-center justify-center py-6">
          <CardHeader className="w-full">
            <CardTitle>Overall Consistency</CardTitle>
          </CardHeader>
          <div className="h-[180px] w-full flex items-center justify-center relative">
            <ResponsiveContainer width="100%" height="100%">
              <RadialBarChart
                innerRadius="70%"
                outerRadius="100%"
                data={radialData}
                startAngle={90}
                endAngle={-270}
              >
                <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
                <RadialBar dataKey="value" cornerRadius={8} background={{ fill: 'var(--cell-empty)' }} />
              </RadialBarChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="font-mono-tabular text-[28px] font-semibold text-primary">{overall}%</span>
            </div>
          </div>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Best Habits</CardTitle>
          </CardHeader>
          <div className="p-3 flex flex-col gap-2">
            {best.length === 0 && <EmptyRow />}
            {best.map((r) => (
              <RankRow key={r.habit.id} icon={r.habit.icon} name={r.habit.name} rate={r.stats.completionRate} tone="positive" />
            ))}
          </div>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Weakest Habits</CardTitle>
          </CardHeader>
          <div className="p-3 flex flex-col gap-2">
            {worst.length === 0 && <EmptyRow />}
            {worst.map((r) => (
              <RankRow key={r.habit.id} icon={r.habit.icon} name={r.habit.name} rate={r.stats.completionRate} tone="negative" />
            ))}
          </div>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Completion by Day of Week</CardTitle>
        </CardHeader>
        <div className="p-4 h-[220px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={dow} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <XAxis
                dataKey="label"
                tick={{ fill: 'var(--text-tertiary)', fontSize: 10 }}
                axisLine={{ stroke: 'var(--border-hairline)' }}
                tickLine={false}
              />
              <YAxis domain={[0, 100]} tick={{ fill: 'var(--text-tertiary)', fontSize: 10 }} axisLine={false} tickLine={false} width={30} />
              <Tooltip
                cursor={{ fill: 'var(--bg-elevated)' }}
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null
                  const d = payload[0].payload as (typeof dow)[number]
                  return (
                    <div className="bg-elevated-2 border border-hairline-strong rounded-[3px] px-3 py-2 text-[11px] shadow-lg">
                      <p className="text-primary font-semibold mb-1">{d.label}</p>
                      <p className="text-secondary">{d.completed}/{d.scheduled} completed</p>
                      <p className="text-cyan font-mono-tabular">{d.rate}%</p>
                    </div>
                  )
                }}
              />
              <Bar dataKey="rate" radius={[2, 2, 0, 0]} maxBarSize={36}>
                {dow.map((d) => (
                  <Cell key={d.dow} fill={d.rate >= 70 ? 'var(--accent-green)' : d.rate >= 40 ? 'var(--accent-cyan)' : 'var(--accent-red)'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <YearlyChart />
      <Heatmap />
      <DisciplineInsights />
    </div>
  )
}

function StatCard({ label, value, suffix }: { label: string; value: string; suffix?: string }) {
  return (
    <div className="bg-surface border border-hairline rounded-[4px] p-4">
      <div className="text-[10px] font-semibold uppercase tracking-wide text-tertiary mb-1.5">{label}</div>
      <div className="font-mono-tabular text-[24px] font-semibold text-primary leading-none">
        {value} {suffix && <span className="text-[12px] font-normal text-tertiary">{suffix}</span>}
      </div>
    </div>
  )
}

function RankRow({ icon, name, rate, tone }: { icon: string; name: string; rate: number; tone: 'positive' | 'negative' }) {
  return (
    <div className="flex items-center gap-2.5 px-1">
      <span className="text-[14px]">{icon}</span>
      <span className="text-[12px] text-primary flex-1 truncate">{name}</span>
      <span className={`font-mono-tabular text-[12px] font-semibold ${tone === 'positive' ? 'text-green' : 'text-red'}`}>
        {rate}%
      </span>
    </div>
  )
}

function EmptyRow() {
  return <div className="text-[12px] text-tertiary px-1 py-2">No data yet.</div>
}
