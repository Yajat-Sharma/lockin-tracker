import { useEffect } from 'react'
import { HashRouter, Routes, Route } from 'react-router-dom'
import { AppLayout } from '@/components/layout/AppLayout'
import { useTheme } from '@/hooks/useTheme'
import { useLockinStore } from '@/store/useLockinStore'
import { DashboardPage } from '@/pages/DashboardPage'
import { HabitsPage } from '@/pages/HabitsPage'
import { AnalyticsPage } from '@/pages/AnalyticsPage'
import { CalendarPage } from '@/pages/CalendarPage'
import { GoalsPage } from '@/pages/GoalsPage'
import { SettingsPage } from '@/pages/SettingsPage'

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
    </HashRouter>
  )
}

export default App
