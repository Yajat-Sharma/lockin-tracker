import type { HabitDefinition, HabitEntry, Frequency, HabitColorName } from '@/types'
import { toISODate, subDays } from '@/lib/date'
import { isHabitScheduledOn } from '@/lib/calculations'

interface DemoHabitSeed {
  name: string
  icon: string
  description: string
  frequency: Frequency
  color: HabitColorName
  goal: number
  targetRate: number // rough completion probability, 0-1
  volatility: number // how streaky/inconsistent, 0-1
}

const SEEDS: DemoHabitSeed[] = [
  { name: 'Deep Work', icon: '🔥', description: '2+ hours of focused, distraction-free work.', frequency: 'weekdays', color: 'cyan', goal: 90, targetRate: 0.88, volatility: 0.15 },
  { name: 'Gym', icon: '🏋️', description: 'Strength training or conditioning session.', frequency: 'custom', color: 'green', goal: 45, targetRate: 0.7, volatility: 0.35 },
  { name: 'Reading', icon: '📚', description: 'At least 20 pages of a book.', frequency: 'daily', color: 'amber', goal: 110, targetRate: 0.82, volatility: 0.2 },
  { name: 'Meditation', icon: '🧘', description: '10 minutes of mindfulness practice.', frequency: 'daily', color: 'cyan', goal: 110, targetRate: 0.75, volatility: 0.25 },
  { name: 'Wake Up Early', icon: '☀️', description: 'Out of bed before 6:30 AM.', frequency: 'daily', color: 'amber', goal: 100, targetRate: 0.65, volatility: 0.3 },
  { name: 'Cold Shower', icon: '🚿', description: '60 seconds of cold water to close the shower.', frequency: 'daily', color: 'cyan', goal: 100, targetRate: 0.6, volatility: 0.4 },
  { name: 'Learning', icon: '🧠', description: 'Study a new technical skill.', frequency: 'weekdays', color: 'green', goal: 80, targetRate: 0.78, volatility: 0.2 },
  { name: 'Journaling', icon: '✍️', description: 'Write a short daily reflection.', frequency: 'daily', color: 'amber', goal: 90, targetRate: 0.55, volatility: 0.45 },
  { name: 'No Alcohol', icon: '🚫', description: 'Zero alcoholic drinks today.', frequency: 'daily', color: 'red', goal: 100, targetRate: 0.9, volatility: 0.1 },
  { name: 'Goal Tracking', icon: '🎯', description: 'Review weekly goals and log progress.', frequency: 'weekdays', color: 'green', goal: 70, targetRate: 0.68, volatility: 0.3 },
]

function mulberry32(seed: number) {
  return function () {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = seed
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const CUSTOM_DAYS_GYM = [1, 3, 5] // Mon / Wed / Fri

export function generateDemoData(daysBack = 120): {
  habits: HabitDefinition[]
  entries: HabitEntry[]
} {
  const rand = mulberry32(42)
  const now = new Date()
  const startDate = toISODate(subDays(now, daysBack))
  const createdAt = new Date().toISOString()

  const habits: HabitDefinition[] = SEEDS.map((seed, i) => ({
    id: `demo-habit-${i}`,
    name: seed.name,
    icon: seed.icon,
    description: seed.description,
    frequency: seed.frequency,
    customDays: seed.frequency === 'custom' ? CUSTOM_DAYS_GYM : undefined,
    goal: { type: 'count', target: seed.goal },
    startDate,
    color: seed.color,
    archived: false,
    order: i,
    reminder: i % 3 === 0,
    createdAt,
    updatedAt: createdAt,
  }))

  const entries: HabitEntry[] = []

  for (const habit of habits) {
    const seed = SEEDS.find((s) => s.name === habit.name)!
    // Simple streaky simulation: a running "momentum" value nudges the
    // probability of completion up or down day-to-day so patterns look real
    // rather than uniformly random.
    let momentum = 0
    for (let d = daysBack; d >= 0; d--) {
      const date = subDays(now, d)
      const iso = toISODate(date)
      if (!isHabitScheduledOn(habit, iso)) continue

      const noise = (rand() - 0.5) * seed.volatility
      momentum = momentum * 0.7 + noise
      const prob = Math.min(0.98, Math.max(0.05, seed.targetRate + momentum))
      const completed = rand() < prob

      entries.push({
        id: `${habit.id}-${iso}`,
        habitId: habit.id,
        date: iso,
        completed,
        createdAt: date.toISOString(),
        updatedAt: date.toISOString(),
      })
    }
  }

  return { habits, entries }
}
