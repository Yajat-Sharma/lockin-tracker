import { lazy, Suspense, useEffect } from 'react'
import { HashRouter, Routes, Route } from 'react-router-dom'
import { AppLayout } from '@/components/layout/AppLayout'
import { useTheme } from '@/hooks/useTheme'
import { useLockinStore } from '@/store/useLockinStore'
import { DashboardPage } from '@/pages/DashboardPage'

const HabitsPage = lazy(() => import('@/pages/HabitsPage').then(m => ({ default: m.HabitsPage })))
const AnalyticsPage = lazy(() => import('@/pages/AnalyticsPage').then(m => ({ default: m.AnalyticsPage })))
const CalendarPage = lazy(() => import('@/pages/CalendarPage').then(m => ({ default: m.CalendarPage })))
const GoalsPage = lazy(() => import('@/pages/GoalsPage').then(m => ({ default: m.GoalsPage })))
const SettingsPage = lazy(() => import('@/pages/SettingsPage').then(m => ({ default: m.SettingsPage })))

function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-void">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-hairline-strong border-t-cyan rounded-full animate-spin" />
        <span className="text-[12px] text-tertiary uppercase tracking-wide">Loading LOCKIN</span>
      </div>
    </div>
  )
}

function PageFallback() {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="w-5 h-5 border-2 border-hairline-strong border-t-cyan rounded-full animate-spin" />
    </div>
  )
}

function App() {
  const init = useLockinStore((s) => s.init)
  const loaded = useLockinStore((s) => s.loaded)
  useTheme()

  useEffect(() => {
    init()
  }, [init])

  if (!loaded) return <LoadingScreen />

  return (
    <HashRouter>
      <Suspense fallback={<PageFallback />}>
        <Routes>
          <Route element={<AppLayout />}>
            <Route index element={<DashboardPage />} />
            <Route path="habits" element={<HabitsPage />} />
            <Route path="analytics" element={<AnalyticsPage />} />
            <Route path="calendar" element={<CalendarPage />} />
            <Route path="goals" element={<GoalsPage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>
        </Routes>
      </Suspense>
    </HashRouter>
  )
}

export default App
