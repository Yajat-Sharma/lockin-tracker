import type { HabitDefinition, HabitEntry, HabitStats, WeekStats, MonthStats } from '@/types'
import {
  dayOfWeek,
  fromISODate,
  isAfter,
  isPastOrTodayISO,
  subDays,
  toISODate,
  todayISO,
  getWeeksInYear,
  getDaysInMonth,
} from '@/lib/date'

/**
 * Whether a habit is *scheduled* to happen on a given date, based on its
 * frequency and start date. Streaks and completion rates are only computed
 * over scheduled days — a weekday-only habit isn't "missed" on a Saturday.
 */
export function isHabitScheduledOn(habit: HabitDefinition, iso: string): boolean {
  if (habit.archived) return false
  const date = fromISODate(iso)
  const start = fromISODate(habit.startDate)
  if (isAfter(start, date)) return false

  const dow = dayOfWeek(iso) // 0 Sun .. 6 Sat

  switch (habit.frequency) {
    case 'daily':
      return true
    case 'weekdays':
      return dow >= 1 && dow <= 5
    case 'weekends':
      return dow === 0 || dow === 6
    case 'custom':
      return (habit.customDays ?? []).includes(dow)
    default:
      return true
  }
}

export function buildEntryMap(entries: HabitEntry[]): Map<string, HabitEntry> {
  const map = new Map<string, HabitEntry>()
  for (const e of entries) map.set(`${e.habitId}|${e.date}`, e)
  return map
}

export function isCompletedOn(
  entryMap: Map<string, HabitEntry>,
  habitId: string,
  iso: string
): boolean {
  return entryMap.get(`${habitId}|${iso}`)?.completed ?? false
}

/**
 * Current streak: counts consecutive *scheduled* days, walking backward from
 * today (or the habit's most recent scheduled day if today isn't scheduled),
 * stopping at the first missed scheduled day. Only counts scheduled days that
 * are today or in the past.
 */
export function calculateStreak(
  habit: HabitDefinition,
  entryMap: Map<string, HabitEntry>,
  asOfISO: string = todayISO()
): number {
  const startDate = fromISODate(habit.startDate)
  let cursor = fromISODate(asOfISO)
  let streak = 0
  const today = todayISO()

  // Walk backward day by day; only scheduled days count toward or break the
  // streak. Bounded to avoid infinite loops on pathological custom schedules.
  for (let i = 0; i < 3660 && !isAfter(startDate, cursor); i++) {
    const iso = toISODate(cursor)
    if (isHabitScheduledOn(habit, iso)) {
      const done = isCompletedOn(entryMap, habit.id, iso)
      if (done) {
        streak++
      } else if (i === 0 && iso === today) {
        // Today not yet checked in doesn't break a streak in progress —
        // it simply hasn't been extended yet. Keep walking backward.
      } else {
        break
      }
    }
    cursor = subDays(cursor, 1)
  }
  return streak
}

/** Longest streak ever, scanning the habit's full scheduled history. */
export function calculateBestStreak(
  habit: HabitDefinition,
  entryMap: Map<string, HabitEntry>,
  todayOverride: string = todayISO()
): number {
  const start = fromISODate(habit.startDate)
  const end = fromISODate(todayOverride)
  let best = 0
  let running = 0
  let cursor = start
  let guard = 0
  while (!isAfter(cursor, end) && guard < 3660) {
    const iso = toISODate(cursor)
    if (isHabitScheduledOn(habit, iso)) {
      if (isCompletedOn(entryMap, habit.id, iso)) {
        running++
        best = Math.max(best, running)
      } else {
        running = 0
      }
    }
    cursor = new Date(cursor.getFullYear(), cursor.getMonth(), cursor.getDate() + 1)
    guard++
  }
  return best
}

export function calculateCompletionRate(
  habit: HabitDefinition,
  entryMap: Map<string, HabitEntry>,
  fromISO?: string,
  toISO: string = todayISO()
): { rate: number; completed: number; scheduled: number } {
  const start = fromISO ?? habit.startDate
  const startDate = isAfter(fromISODate(habit.startDate), fromISODate(start))
    ? fromISODate(habit.startDate)
    : fromISODate(start)
  const endDate = fromISODate(toISO)

  let completed = 0
  let scheduled = 0
  let cursor = startDate
  let guard = 0
  while (!isAfter(cursor, endDate) && guard < 3660) {
    const iso = toISODate(cursor)
    if (isHabitScheduledOn(habit, iso) && isPastOrTodayISO(iso)) {
      scheduled++
      if (isCompletedOn(entryMap, habit.id, iso)) completed++
    }
    cursor = new Date(cursor.getFullYear(), cursor.getMonth(), cursor.getDate() + 1)
    guard++
  }
  const rate = scheduled === 0 ? 0 : Math.round((completed / scheduled) * 100)
  return { rate, completed, scheduled }
}

export function calculateHabitStats(
  habit: HabitDefinition,
  entryMap: Map<string, HabitEntry>
): HabitStats {
  const { rate, completed, scheduled } = calculateCompletionRate(habit, entryMap)
  return {
    habitId: habit.id,
    currentStreak: calculateStreak(habit, entryMap),
    bestStreak: calculateBestStreak(habit, entryMap),
    completionRate: rate,
    totalCompleted: completed,
    totalScheduled: scheduled,
  }
}

export function calculateDailyCompletion(
  habits: HabitDefinition[],
  entryMap: Map<string, HabitEntry>,
  iso: string
): { completed: number; scheduled: number; rate: number } {
  const active = habits.filter((h) => isHabitScheduledOn(h, iso))
  const completed = active.filter((h) => isCompletedOn(entryMap, h.id, iso)).length
  const scheduled = active.length
  const rate = scheduled === 0 ? 0 : Math.round((completed / scheduled) * 100)
  return { completed, scheduled, rate }
}

export function calculateWeeklyStats(
  habits: HabitDefinition[],
  entryMap: Map<string, HabitEntry>,
  year: number,
  weekStartsOn: 0 | 1 = 1
): WeekStats[] {
  const weeks = getWeeksInYear(year, weekStartsOn)
  return weeks.map((w) => {
    let completed = 0
    let scheduled = 0
    for (const day of w.days) {
      if (!isPastOrTodayISO(day)) continue
      const d = calculateDailyCompletion(habits, entryMap, day)
      completed += d.completed
      scheduled += d.scheduled
    }
    const rate = scheduled === 0 ? 0 : Math.round((completed / scheduled) * 100)
    return {
      weekIndex: w.weekIndex,
      label: w.label,
      startDate: w.startDate,
      endDate: w.endDate,
      completed,
      scheduled,
      rate,
    }
  })
}

export function calculateMonthlyStats(
  habits: HabitDefinition[],
  entryMap: Map<string, HabitEntry>,
  year: number,
  month: number
): MonthStats {
  const days = getDaysInMonth(year, month).filter(isPastOrTodayISO)
  let completed = 0
  let scheduled = 0
  const habitsCompletedSet = new Set<string>()
  let bestStreakInMonth = 0

  for (const day of days) {
    const d = calculateDailyCompletion(habits, entryMap, day)
    completed += d.completed
    scheduled += d.scheduled
    for (const h of habits) {
      if (isHabitScheduledOn(h, day) && isCompletedOn(entryMap, h.id, day)) {
        habitsCompletedSet.add(h.id)
      }
    }
  }

  for (const h of habits) {
    bestStreakInMonth = Math.max(bestStreakInMonth, calculateBestStreak(h, entryMap))
  }

  const rate = scheduled === 0 ? 0 : Math.round((completed / scheduled) * 100)
  return {
    month,
    year,
    completed,
    scheduled,
    rate,
    bestStreak: bestStreakInMonth,
    habitsCompleted: habitsCompletedSet.size,
  }
}

export interface HabitRankingEntry {
  habit: HabitDefinition
  stats: HabitStats
}

export function calculateHabitRanking(
  habits: HabitDefinition[],
  entryMap: Map<string, HabitEntry>
): HabitRankingEntry[] {
  return habits
    .filter((h) => !h.archived)
    .map((habit) => ({ habit, stats: calculateHabitStats(habit, entryMap) }))
    .sort((a, b) => b.stats.completionRate - a.stats.completionRate)
}

export function calculateCompletionByDayOfWeek(
  habits: HabitDefinition[],
  entryMap: Map<string, HabitEntry>,
  sinceISO: string
): { dow: number; rate: number; completed: number; scheduled: number }[] {
  const buckets = Array.from({ length: 7 }, (_, dow) => ({ dow, completed: 0, scheduled: 0, rate: 0 }))
  let cursor = fromISODate(sinceISO)
  const end = fromISODate(todayISO())
  let guard = 0
  while (!isAfter(cursor, end) && guard < 3660) {
    const iso = toISODate(cursor)
    const dow = dayOfWeek(iso)
    for (const h of habits) {
      if (isHabitScheduledOn(h, iso)) {
        buckets[dow].scheduled++
        if (isCompletedOn(entryMap, h.id, iso)) buckets[dow].completed++
      }
    }
    cursor = new Date(cursor.getFullYear(), cursor.getMonth(), cursor.getDate() + 1)
    guard++
  }
  for (const b of buckets) {
    b.rate = b.scheduled === 0 ? 0 : Math.round((b.completed / b.scheduled) * 100)
  }
  return buckets
}

export function calculateYearlyTrend(
  habits: HabitDefinition[],
  entryMap: Map<string, HabitEntry>,
  year: number
): { date: string; rate: number; completed: number; scheduled: number }[] {
  const weeks = getWeeksInYear(year)
  return weeks
    .map((w) => {
      let completed = 0
      let scheduled = 0
      for (const day of w.days) {
        if (!isPastOrTodayISO(day)) continue
        const d = calculateDailyCompletion(habits, entryMap, day)
        completed += d.completed
        scheduled += d.scheduled
      }
      const rate = scheduled === 0 ? 0 : Math.round((completed / scheduled) * 100)
      return { date: w.startDate, completed, scheduled, rate }
    })
    .filter((w) => w.scheduled > 0)
}

export function daysAgoISO(n: number): string {
  return toISODate(subDays(new Date(), n))
}
