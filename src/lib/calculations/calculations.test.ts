import { describe, it, expect } from 'vitest'
import type { HabitDefinition, HabitEntry } from '@/types'
import {
  isHabitScheduledOn,
  buildEntryMap,
  calculateStreak,
  calculateBestStreak,
  calculateCompletionRate,
  calculateDailyCompletion,
  calculateHabitRanking,
} from '@/lib/calculations'
import { toISODate, subDays, addISODays } from '@/lib/date'

function makeHabit(overrides: Partial<HabitDefinition> = {}): HabitDefinition {
  return {
    id: 'h1',
    name: 'Test Habit',
    icon: '🔥',
    description: '',
    frequency: 'daily',
    goal: { type: 'count', target: 30 },
    startDate: toISODate(subDays(new Date(), 30)),
    color: 'cyan',
    archived: false,
    order: 0,
    reminder: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  }
}

function makeEntries(habitId: string, dates: string[], completed = true): HabitEntry[] {
  return dates.map((date) => ({
    id: `${habitId}-${date}`,
    habitId,
    date,
    completed,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }))
}

describe('isHabitScheduledOn', () => {
  it('daily habits are scheduled every day after start', () => {
    const habit = makeHabit({ frequency: 'daily', startDate: '2026-01-01' })
    expect(isHabitScheduledOn(habit, '2026-01-01')).toBe(true)
    expect(isHabitScheduledOn(habit, '2026-06-15')).toBe(true)
    expect(isHabitScheduledOn(habit, '2025-12-31')).toBe(false)
  })

  it('weekday habits skip Saturday and Sunday', () => {
    const habit = makeHabit({ frequency: 'weekdays', startDate: '2026-01-01' })
    // 2026-08-08 is a Saturday, 2026-08-10 is a Monday
    expect(isHabitScheduledOn(habit, '2026-08-08')).toBe(false)
    expect(isHabitScheduledOn(habit, '2026-08-09')).toBe(false)
    expect(isHabitScheduledOn(habit, '2026-08-10')).toBe(true)
  })

  it('weekend habits only run Saturday and Sunday', () => {
    const habit = makeHabit({ frequency: 'weekends', startDate: '2026-01-01' })
    expect(isHabitScheduledOn(habit, '2026-08-08')).toBe(true)
    expect(isHabitScheduledOn(habit, '2026-08-10')).toBe(false)
  })

  it('custom frequency only runs on specified days', () => {
    const habit = makeHabit({ frequency: 'custom', customDays: [1, 3, 5], startDate: '2026-01-01' })
    expect(isHabitScheduledOn(habit, '2026-08-10')).toBe(true) // Monday
    expect(isHabitScheduledOn(habit, '2026-08-11')).toBe(false) // Tuesday
  })

  it('archived habits are never scheduled', () => {
    const habit = makeHabit({ archived: true })
    expect(isHabitScheduledOn(habit, toISODate(new Date()))).toBe(false)
  })
})

describe('calculateStreak', () => {
  it('counts consecutive completed days walking back from today', () => {
    const today = toISODate(new Date())
    const habit = makeHabit({ startDate: toISODate(subDays(new Date(), 10)) })
    const dates = [0, 1, 2, 3].map((n) => toISODate(subDays(new Date(), n)))
    const entryMap = buildEntryMap(makeEntries(habit.id, dates))
    expect(calculateStreak(habit, entryMap, today)).toBe(4)
  })

  it('breaks the streak on a missed scheduled day', () => {
    const habit = makeHabit({ startDate: toISODate(subDays(new Date(), 10)) })
    // completed today and yesterday, but missed 2 days ago -> streak of 2
    const dates = [0, 1].map((n) => toISODate(subDays(new Date(), n)))
    const entryMap = buildEntryMap(makeEntries(habit.id, dates))
    expect(calculateStreak(habit, entryMap)).toBe(2)
  })

  it('does not break an in-progress streak just because today is unchecked yet', () => {
    const habit = makeHabit({ startDate: toISODate(subDays(new Date(), 10)) })
    // yesterday and the day before are completed, today has no entry yet
    const dates = [1, 2].map((n) => toISODate(subDays(new Date(), n)))
    const entryMap = buildEntryMap(makeEntries(habit.id, dates))
    expect(calculateStreak(habit, entryMap)).toBe(2)
  })

  it('only counts scheduled days for weekday habits', () => {
    const habit = makeHabit({ frequency: 'weekdays', startDate: '2026-08-01' })
    // Mon 8/3 - Fri 8/7 all completed; weekend 8/8-8/9 has no entries (not scheduled, shouldn't break streak)
    const dates = ['2026-08-03', '2026-08-04', '2026-08-05', '2026-08-06', '2026-08-07']
    const entryMap = buildEntryMap(makeEntries(habit.id, dates))
    expect(calculateStreak(habit, entryMap, '2026-08-09')).toBe(5)
  })
})

describe('calculateBestStreak', () => {
  it('finds the longest run even if it is not the current one', () => {
    const habit = makeHabit({ startDate: '2026-08-01' })
    // 5-day streak early on, then a gap, then a 2-day streak
    const longRun = ['2026-08-01', '2026-08-02', '2026-08-03', '2026-08-04', '2026-08-05']
    const shortRun = ['2026-08-08', '2026-08-09']
    const entryMap = buildEntryMap(makeEntries(habit.id, [...longRun, ...shortRun]))
    expect(calculateBestStreak(habit, entryMap, '2026-08-09')).toBe(5)
  })
})

describe('calculateCompletionRate', () => {
  it('computes rate only over scheduled, past-or-today days', () => {
    const habit = makeHabit({ startDate: '2026-08-01' })
    const entries = makeEntries(habit.id, ['2026-08-01', '2026-08-02', '2026-08-03'])
    const entryMap = buildEntryMap(entries)
    const { rate, completed, scheduled } = calculateCompletionRate(habit, entryMap, '2026-08-01', '2026-08-05')
    expect(scheduled).toBe(5)
    expect(completed).toBe(3)
    expect(rate).toBe(60)
  })

  it('returns 0 rate with no scheduled days rather than dividing by zero', () => {
    const habit = makeHabit({ startDate: '2026-08-01' })
    const entryMap = buildEntryMap([])
    const { rate } = calculateCompletionRate(habit, entryMap, '2026-08-01', '2026-08-01')
    expect(Number.isFinite(rate)).toBe(true)
  })
})

describe('calculateDailyCompletion', () => {
  it('only counts habits scheduled on that day', () => {
    const daily = makeHabit({ id: 'daily', frequency: 'daily', startDate: '2026-08-01' })
    const weekend = makeHabit({ id: 'weekend', frequency: 'weekends', startDate: '2026-08-01' })
    const entryMap = buildEntryMap(makeEntries('daily', ['2026-08-10'])) // Monday
    const result = calculateDailyCompletion([daily, weekend], entryMap, '2026-08-10')
    expect(result.scheduled).toBe(1) // only the daily habit is scheduled on a Monday
    expect(result.completed).toBe(1)
    expect(result.rate).toBe(100)
  })
})

describe('calculateHabitRanking', () => {
  it('sorts habits by completion rate descending and excludes archived', () => {
    const strong = makeHabit({ id: 'strong', name: 'Strong', startDate: '2026-08-01' })
    const weak = makeHabit({ id: 'weak', name: 'Weak', startDate: '2026-08-01' })
    const archived = makeHabit({ id: 'gone', name: 'Gone', archived: true, startDate: '2026-08-01' })

    const entries = [
      ...makeEntries('strong', ['2026-08-01', '2026-08-02', '2026-08-03']),
      ...makeEntries('weak', ['2026-08-01']),
    ]
    const entryMap = buildEntryMap(entries)
    const ranking = calculateHabitRanking([strong, weak, archived], entryMap)

    expect(ranking.map((r) => r.habit.id)).toEqual(['strong', 'weak'])
    expect(ranking[0].stats.completionRate).toBeGreaterThan(ranking[1].stats.completionRate)
  })
})

describe('date boundary handling', () => {
  it('addISODays correctly crosses month boundaries', () => {
    expect(addISODays('2026-01-31', 1)).toBe('2026-02-01')
  })

  it('addISODays correctly crosses year boundaries', () => {
    expect(addISODays('2026-12-31', 1)).toBe('2027-01-01')
  })

  it('handles leap year Feb 29 correctly', () => {
    // 2028 is a leap year
    expect(addISODays('2028-02-28', 1)).toBe('2028-02-29')
    expect(addISODays('2028-02-29', 1)).toBe('2028-03-01')
  })

  it('non-leap year Feb has 28 days', () => {
    expect(addISODays('2026-02-28', 1)).toBe('2026-03-01')
  })
})
