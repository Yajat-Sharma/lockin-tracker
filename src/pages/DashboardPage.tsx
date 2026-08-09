import { lazy, Suspense } from 'react'
import { TodayProgress } from '@/features/dashboard/TodayProgress'
import { TodayChecklist } from '@/features/dashboard/TodayChecklist'
import { DeferredView } from '@/components/ui/DeferredView'

const HabitMatrix = lazy(() => import('@/features/dashboard/HabitMatrix').then(m => ({ default: m.HabitMatrix })))
const WeeklyPerformance = lazy(() => import('@/features/dashboard/WeeklyPerformance').then(m => ({ default: m.WeeklyPerformance })))
const TopHabits = lazy(() => import('@/features/dashboard/TopHabits').then(m => ({ default: m.TopHabits })))
const YearlyChart = lazy(() => import('@/features/dashboard/YearlyChart').then(m => ({ default: m.YearlyChart })))
const Heatmap = lazy(() => import('@/features/dashboard/Heatmap').then(m => ({ default: m.Heatmap })))
const DisciplineInsights = lazy(() => import('@/features/dashboard/DisciplineInsights').then(m => ({ default: m.DisciplineInsights })))

function CardSkeleton({ height = 200 }: { height?: number }) {
  return (
    <div
      className="bg-surface border border-hairline rounded-[4px] animate-pulse"
      style={{ minHeight: height }}
    />
  )
}

export function DashboardPage() {
  return (
    <div className="flex flex-col gap-4">
      {/* Above the fold — renders immediately */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-4">
        <TodayProgress />
        <TodayChecklist />
      </div>

      {/* Below the fold — deferred until scrolled into view */}
      <DeferredView minHeight={520} fallback={<CardSkeleton height={520} />}>
        <Suspense fallback={<CardSkeleton height={520} />}>
          <HabitMatrix />
        </Suspense>
      </DeferredView>

      <DeferredView minHeight={220} fallback={
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <CardSkeleton height={220} />
          <CardSkeleton height={220} />
        </div>
      }>
        <Suspense fallback={
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <CardSkeleton height={220} />
            <CardSkeleton height={220} />
          </div>
        }>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <WeeklyPerformance />
            <TopHabits />
          </div>
        </Suspense>
      </DeferredView>

      <DeferredView minHeight={260} fallback={<CardSkeleton height={260} />}>
        <Suspense fallback={<CardSkeleton height={260} />}>
          <YearlyChart />
        </Suspense>
      </DeferredView>

      <DeferredView minHeight={200} fallback={<CardSkeleton height={200} />}>
        <Suspense fallback={<CardSkeleton height={200} />}>
          <Heatmap />
        </Suspense>
      </DeferredView>

      <DeferredView minHeight={160} fallback={<CardSkeleton height={160} />}>
        <Suspense fallback={<CardSkeleton height={160} />}>
          <DisciplineInsights />
        </Suspense>
      </DeferredView>
    </div>
  )
}
