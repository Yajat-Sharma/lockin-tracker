import { NavLink, Outlet } from 'react-router-dom'
import { Flame, Settings as SettingsIcon, Cloud, CloudOff, RefreshCw, AlertCircle } from 'lucide-react'
import { cn } from '@/utils/cn'
import { useActiveHabits, useEntryMap } from '@/hooks/useDerivedData'
import { calculateDailyCompletion, calculateHabitStats } from '@/lib/calculations'
import { todayISO } from '@/lib/date'
import { useLockinStore } from '@/store/useLockinStore'
import { useMemo } from 'react'

const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', end: true },
  { to: '/habits', label: 'Habits' },
  { to: '/analytics', label: 'Analytics' },
  { to: '/calendar', label: 'Calendar' },
  { to: '/goals', label: 'Goals' },
]

export function AppLayout() {
  const habits = useActiveHabits()
  const entryMap = useEntryMap()
  const today = todayISO()
  const syncEnabled = useLockinStore((s) => s.syncEnabled)
  const syncStatus = useLockinStore((s) => s.syncStatus)

  const todayStats = useMemo(
    () => calculateDailyCompletion(habits, entryMap, today),
    [habits, entryMap, today]
  )

  const bestCurrentStreak = useMemo(() => {
    let max = 0
    for (const h of habits) {
      max = Math.max(max, calculateHabitStats(h, entryMap).currentStreak)
    }
    return max
  }, [habits, entryMap])

  return (
    <div className="min-h-screen bg-void flex flex-col">
      <header className="sticky top-0 z-40 bg-void/95 backdrop-blur border-b border-hairline">
        <div className="max-w-[1400px] mx-auto px-6 h-14 flex items-center gap-8">
          <div className="flex items-center gap-2 shrink-0">
            <LockinMark />
            <span className="font-semibold text-[15px] tracking-tight text-primary">LOCKIN</span>
          </div>

          <nav className="hidden md:flex items-center gap-1" aria-label="Primary">
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  cn(
                    'px-3 h-8 flex items-center rounded-[3px] text-[13px] font-medium transition-colors',
                    isActive ? 'text-primary bg-elevated' : 'text-secondary hover:text-primary'
                  )
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-4 shrink-0">
            <div className="hidden sm:flex items-center gap-1.5 text-secondary" title="Best active streak">
              <Flame size={14} className="text-amber" />
              <span className="font-mono-tabular text-[13px] text-primary">{bestCurrentStreak}</span>
              <span className="text-[11px]">day streak</span>
            </div>
            <div className="hidden sm:block w-px h-4 bg-hairline-strong" />
            <div className="hidden sm:flex items-center gap-1.5 text-secondary" title="Today's completion">
              <span className="font-mono-tabular text-[13px] text-primary">
                {todayStats.completed}/{todayStats.scheduled}
              </span>
              <span className="text-[11px]">today · {todayStats.rate}%</span>
            </div>
            {syncEnabled && (
              <>
                <div className="hidden sm:block w-px h-4 bg-hairline-strong" />
                <SyncGlyph status={syncStatus} />
              </>
            )}
            <NavLink
              to="/settings"
              aria-label="Settings"
              className={({ isActive }) =>
                cn(
                  'w-8 h-8 flex items-center justify-center rounded-[3px] transition-colors',
                  isActive ? 'text-primary bg-elevated' : 'text-secondary hover:text-primary hover:bg-elevated'
                )
              }
            >
              <SettingsIcon size={16} />
            </NavLink>
          </div>
        </div>
        <nav className="md:hidden flex items-center gap-1 px-4 pb-2 overflow-x-auto" aria-label="Primary mobile">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                cn(
                  'px-2.5 h-7 flex items-center rounded-[3px] text-[12px] font-medium whitespace-nowrap transition-colors',
                  isActive ? 'text-primary bg-elevated' : 'text-secondary'
                )
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </header>

      <main className="flex-1 max-w-[1400px] w-full mx-auto px-4 sm:px-6 py-6">
        <Outlet />
      </main>
    </div>
  )
}

function LockinMark() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <rect x="1" y="1" width="8" height="8" fill="var(--accent-green)" />
      <rect x="11" y="1" width="8" height="8" fill="none" stroke="var(--border-hairline-strong)" />
      <rect x="1" y="11" width="8" height="8" fill="none" stroke="var(--border-hairline-strong)" />
      <rect x="11" y="11" width="8" height="8" fill="var(--accent-cyan)" />
    </svg>
  )
}

function SyncGlyph({ status }: { status: string }) {
  if (status === 'synced') return <Cloud size={14} className="text-cyan" aria-label="Synced" />
  if (status === 'syncing') return <RefreshCw size={14} className="text-cyan animate-spin" aria-label="Syncing" />
  if (status === 'error') return <AlertCircle size={14} className="text-red" aria-label="Sync error" />
  return <CloudOff size={14} className="text-tertiary" aria-label="Not signed in" />
}
