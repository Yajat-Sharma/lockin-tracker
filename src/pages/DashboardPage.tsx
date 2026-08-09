import { TodayProgress } from '@/features/dashboard/TodayProgress'
import { TodayChecklist } from '@/features/dashboard/TodayChecklist'
import { HabitMatrix } from '@/features/dashboard/HabitMatrix'
import { WeeklyPerformance } from '@/features/dashboard/WeeklyPerformance'
import { TopHabits } from '@/features/dashboard/TopHabits'
import { YearlyChart } from '@/features/dashboard/YearlyChart'
import { Heatmap } from '@/features/dashboard/Heatmap'
import { DisciplineInsights } from '@/features/dashboard/DisciplineInsights'

export function DashboardPage() {
  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-4">
        <TodayProgress />
        <TodayChecklist />
      </div>

      <HabitMatrix />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <WeeklyPerformance />
        <TopHabits />
      </div>

      <YearlyChart />
      <Heatmap />
      <DisciplineInsights />
    </div>
  )
}
