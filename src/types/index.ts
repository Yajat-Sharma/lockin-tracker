export type Frequency = 'daily' | 'weekdays' | 'weekends' | 'custom'

export type GoalType = 'count' | 'percentage'

export interface HabitGoal {
  type: GoalType
  target: number // count of completions, or percentage 0-100
}

export const HABIT_ICONS = [
  '🔥', '🏋️', '📚', '🧘', '☀️', '🚿', '🎯', '✍️', '🚫', '💧',
  '🧠', '💤', '🏃', '🎸', '🍎', '💻', '🌱', '🖋️', '🧩', '⏱️',
] as const

export const HABIT_COLORS = [
  { name: 'cyan', value: 'var(--accent-cyan)' },
  { name: 'green', value: 'var(--accent-green)' },
  { name: 'amber', value: 'var(--accent-amber)' },
  { name: 'red', value: 'var(--accent-red)' },
] as const

export type HabitColorName = (typeof HABIT_COLORS)[number]['name']

export interface HabitDefinition {
  id: string
  name: string
  icon: string
  description: string
  frequency: Frequency
  customDays?: number[] // 0=Sun..6=Sat, used when frequency === 'custom'
  goal: HabitGoal
  startDate: string // ISO yyyy-MM-dd
  color: HabitColorName
  archived: boolean
  order: number
  reminder: boolean
  createdAt: string
  updatedAt: string
}

export interface HabitEntry {
  id: string
  habitId: string
  date: string // ISO yyyy-MM-dd
  completed: boolean
  createdAt: string
  updatedAt: string
}

export type ThemeMode = 'dark' | 'light' | 'system'

export interface AppSettings {
  theme: ThemeMode
  startOfWeek: 0 | 1 // 0 = Sunday, 1 = Monday
  dateFormat: string
  animations: boolean
  reducedMotion: boolean
}

export const DEFAULT_SETTINGS: AppSettings = {
  theme: 'dark',
  startOfWeek: 1,
  dateFormat: 'MMM d, yyyy',
  animations: true,
  reducedMotion: false,
}

export interface HabitStats {
  habitId: string
  currentStreak: number
  bestStreak: number
  completionRate: number // 0-100, lifetime
  totalCompleted: number
  totalScheduled: number
}

export interface DayCompletion {
  date: string
  completed: number
  scheduled: number
  rate: number
}

export interface WeekStats {
  weekIndex: number
  label: string
  startDate: string
  endDate: string
  completed: number
  scheduled: number
  rate: number
}

export interface MonthStats {
  month: number
  year: number
  completed: number
  scheduled: number
  rate: number
  bestStreak: number
  habitsCompleted: number
}
