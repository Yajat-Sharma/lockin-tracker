import { supabase } from './client'
import type { HabitDefinition, HabitEntry, AppSettings } from '@/types'
import { DEFAULT_SETTINGS } from '@/types'

// --- row <-> local type mapping -------------------------------------------------

interface HabitRow {
  id: string
  user_id: string
  name: string
  icon: string
  description: string
  frequency: string
  custom_days: number[] | null
  goal_type: string
  goal_target: number
  start_date: string
  color: string
  archived: boolean
  order: number
  reminder: boolean
  created_at: string
  updated_at: string
}

interface EntryRow {
  id: string
  user_id: string
  habit_id: string
  date: string
  completed: boolean
  created_at: string
  updated_at: string
}

interface SettingsRow {
  user_id: string
  theme: string
  start_of_week: number
  date_format: string
  animations: boolean
  reduced_motion: boolean
  updated_at: string
}

function habitToRow(h: HabitDefinition, userId: string): HabitRow {
  return {
    id: h.id,
    user_id: userId,
    name: h.name,
    icon: h.icon,
    description: h.description,
    frequency: h.frequency,
    custom_days: h.customDays ?? null,
    goal_type: h.goal.type,
    goal_target: h.goal.target,
    start_date: h.startDate,
    color: h.color,
    archived: h.archived,
    order: h.order,
    reminder: h.reminder,
    created_at: h.createdAt,
    updated_at: h.updatedAt,
  }
}

function rowToHabit(r: HabitRow): HabitDefinition {
  return {
    id: r.id,
    name: r.name,
    icon: r.icon,
    description: r.description,
    frequency: r.frequency as HabitDefinition['frequency'],
    customDays: r.custom_days ?? undefined,
    goal: { type: r.goal_type as HabitDefinition['goal']['type'], target: r.goal_target },
    startDate: r.start_date,
    color: r.color as HabitDefinition['color'],
    archived: r.archived,
    order: r.order,
    reminder: r.reminder,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }
}

function entryToRow(e: HabitEntry, userId: string): EntryRow {
  return {
    id: e.id,
    user_id: userId,
    habit_id: e.habitId,
    date: e.date,
    completed: e.completed,
    created_at: e.createdAt,
    updated_at: e.updatedAt,
  }
}

function rowToEntry(r: EntryRow): HabitEntry {
  return {
    id: r.id,
    habitId: r.habit_id,
    date: r.date,
    completed: r.completed,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }
}

function settingsToRow(s: AppSettings, userId: string): SettingsRow {
  return {
    user_id: userId,
    theme: s.theme,
    start_of_week: s.startOfWeek,
    date_format: s.dateFormat,
    animations: s.animations,
    reduced_motion: s.reducedMotion,
    updated_at: new Date().toISOString(),
  }
}

function rowToSettings(r: SettingsRow): AppSettings {
  return {
    theme: r.theme as AppSettings['theme'],
    startOfWeek: r.start_of_week as AppSettings['startOfWeek'],
    dateFormat: r.date_format,
    animations: r.animations,
    reducedMotion: r.reduced_motion,
  }
}

// --- pull / push -----------------------------------------------------------------

export async function pullRemote(): Promise<{
  habits: HabitDefinition[]
  entries: HabitEntry[]
  settings: AppSettings | null
}> {
  if (!supabase) return { habits: [], entries: [], settings: null }
  const [habitsRes, entriesRes, settingsRes] = await Promise.all([
    supabase.from('habits').select('*'),
    supabase.from('entries').select('*'),
    supabase.from('settings').select('*').maybeSingle(),
  ])
  if (habitsRes.error) throw habitsRes.error
  if (entriesRes.error) throw entriesRes.error

  return {
    habits: (habitsRes.data as HabitRow[]).map(rowToHabit),
    entries: (entriesRes.data as EntryRow[]).map(rowToEntry),
    settings: settingsRes.data ? rowToSettings(settingsRes.data as SettingsRow) : null,
  }
}

export async function pushHabit(habit: HabitDefinition, userId: string): Promise<void> {
  if (!supabase) return
  const { error } = await supabase.from('habits').upsert(habitToRow(habit, userId))
  if (error) throw error
}

export async function deleteRemoteHabit(id: string): Promise<void> {
  if (!supabase) return
  const { error } = await supabase.from('habits').delete().eq('id', id)
  if (error) throw error
}

export async function pushEntry(entry: HabitEntry, userId: string): Promise<void> {
  if (!supabase) return
  const { error } = await supabase.from('entries').upsert(entryToRow(entry, userId))
  if (error) throw error
}

export async function pushSettings(settings: AppSettings, userId: string): Promise<void> {
  if (!supabase) return
  const { error } = await supabase.from('settings').upsert(settingsToRow(settings, userId))
  if (error) throw error
}

export async function pushHabitsBulk(habits: HabitDefinition[], userId: string): Promise<void> {
  if (!supabase || habits.length === 0) return
  const { error } = await supabase.from('habits').upsert(habits.map((h) => habitToRow(h, userId)))
  if (error) throw error
}

export async function pushEntriesBulk(entries: HabitEntry[], userId: string): Promise<void> {
  if (!supabase || entries.length === 0) return
  // Supabase/Postgres upsert payloads are capped in practical size; chunk defensively.
  const CHUNK = 500
  for (let i = 0; i < entries.length; i += CHUNK) {
    const chunk = entries.slice(i, i + CHUNK)
    const { error } = await supabase.from('entries').upsert(chunk.map((e) => entryToRow(e, userId)))
    if (error) throw error
  }
}

// --- merge (last-write-wins by updatedAt) -----------------------------------------

export function mergeByUpdatedAt<T extends { id: string; updatedAt: string }>(
  local: T[],
  remote: T[]
): { merged: T[]; localOnly: T[] } {
  const remoteById = new Map(remote.map((r) => [r.id, r]))
  const localById = new Map(local.map((l) => [l.id, l]))
  const merged: T[] = []
  const localOnly: T[] = []

  for (const l of local) {
    const r = remoteById.get(l.id)
    if (!r) {
      merged.push(l)
      localOnly.push(l)
    } else {
      merged.push(new Date(l.updatedAt) >= new Date(r.updatedAt) ? l : r)
    }
  }
  for (const r of remote) {
    if (!localById.has(r.id)) merged.push(r)
  }
  return { merged, localOnly }
}

// --- realtime ----------------------------------------------------------------------

export function subscribeToChanges(
  userId: string,
  onHabitsChanged: () => void,
  onEntriesChanged: () => void
): () => void {
  if (!supabase) return () => {}
  const client = supabase
  const channel = client
    .channel(`lockin-sync-${userId}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'habits', filter: `user_id=eq.${userId}` },
      onHabitsChanged
    )
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'entries', filter: `user_id=eq.${userId}` },
      onEntriesChanged
    )
    .subscribe()

  return () => {
    client.removeChannel(channel)
  }
}

export { DEFAULT_SETTINGS }
