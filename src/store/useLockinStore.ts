import { create } from 'zustand'
import type { HabitDefinition, HabitEntry, AppSettings, Frequency, HabitColorName } from '@/types'
import { DEFAULT_SETTINGS } from '@/types'
import { StorageAdapter, type Backup } from '@/lib/storage'
import { generateDemoData } from '@/lib/demo'
import { todayISO } from '@/lib/date'
import { isSyncConfigured } from '@/lib/sync/client'
import { getSession, onAuthStateChange, signInWithEmail, signOut as syncSignOut } from '@/lib/sync/auth'
import {
  pullRemote,
  pushHabit,
  pushEntry,
  pushSettings,
  pushHabitsBulk,
  pushEntriesBulk,
  deleteRemoteHabit,
  mergeByUpdatedAt,
  subscribeToChanges,
} from '@/lib/sync/engine'
import type { Session } from '@supabase/supabase-js'

interface NewHabitInput {
  name: string
  icon: string
  description: string
  frequency: Frequency
  customDays?: number[]
  goalTarget: number
  startDate: string
  color: HabitColorName
  reminder: boolean
}

export type SyncStatus = 'unconfigured' | 'signed-out' | 'syncing' | 'synced' | 'error'

interface LockinState {
  habits: HabitDefinition[]
  entries: HabitEntry[]
  settings: AppSettings
  loaded: boolean
  selectedYear: number
  selectedMonth: number

  // sync
  syncEnabled: boolean
  session: Session | null
  syncStatus: SyncStatus
  syncError: string | null
  authEmailSent: string | null

  init: () => Promise<void>
  addHabit: (input: NewHabitInput) => Promise<void>
  updateHabit: (habit: HabitDefinition) => Promise<void>
  deleteHabit: (id: string) => Promise<void>
  archiveHabit: (id: string, archived: boolean) => Promise<void>
  reorderHabits: (orderedIds: string[]) => Promise<void>
  toggleEntry: (habitId: string, date: string) => Promise<void>
  setEntryCompleted: (habitId: string, date: string, completed: boolean) => Promise<void>
  completeAllToday: () => Promise<void>
  updateSettings: (partial: Partial<AppSettings>) => void
  setSelectedYear: (year: number) => void
  setSelectedMonth: (month: number) => void
  exportData: () => Promise<Backup>
  importData: (backup: Backup) => Promise<void>
  resetDemoData: () => Promise<void>
  clearAllData: () => Promise<void>

  requestSignIn: (email: string) => Promise<void>
  signOutOfSync: () => Promise<void>
}

let realtimeUnsubscribe: (() => void) | null = null

async function fullResync(get: () => LockinState, set: (partial: Partial<LockinState>) => void) {
  const session = get().session
  if (!session) return
  set({ syncStatus: 'syncing', syncError: null })
  try {
    const remote = await pullRemote()
    const local = get()

    const { merged: mergedHabits, localOnly: localOnlyHabits } = mergeByUpdatedAt(local.habits, remote.habits)
    const { merged: mergedEntries, localOnly: localOnlyEntries } = mergeByUpdatedAt(local.entries, remote.entries)

    await StorageAdapter.clearAll()
    await StorageAdapter.bulkPutHabits(mergedHabits)
    await StorageAdapter.bulkPutEntries(mergedEntries)

    // push anything that only existed locally (e.g. created while signed out / offline)
    await pushHabitsBulk(localOnlyHabits, session.user.id)
    await pushEntriesBulk(localOnlyEntries, session.user.id)

    const settings = remote.settings ?? local.settings
    if (!remote.settings) await pushSettings(local.settings, session.user.id)
    else StorageAdapter.updateSettings(settings)

    set({ habits: mergedHabits, entries: mergedEntries, settings, syncStatus: 'synced' })
  } catch (err) {
    set({ syncStatus: 'error', syncError: err instanceof Error ? err.message : 'Sync failed.' })
  }
}

export const useLockinStore = create<LockinState>((set, get) => ({
  habits: [],
  entries: [],
  settings: DEFAULT_SETTINGS,
  loaded: false,
  selectedYear: new Date().getFullYear(),
  selectedMonth: new Date().getMonth(),

  syncEnabled: isSyncConfigured,
  session: null,
  syncStatus: isSyncConfigured ? 'signed-out' : 'unconfigured',
  syncError: null,
  authEmailSent: null,

  init: async () => {
    const settings = StorageAdapter.getSettings()
    let habits = await StorageAdapter.getHabits()
    let entries = await StorageAdapter.getEntries()

    if (habits.length === 0) {
      const demo = generateDemoData(120)
      await StorageAdapter.bulkPutHabits(demo.habits)
      await StorageAdapter.bulkPutEntries(demo.entries)
      habits = demo.habits
      entries = demo.entries
    }

    set({ habits, entries, settings, loaded: true })

    if (isSyncConfigured) {
      const session = await getSession()
      set({ session, syncStatus: session ? 'syncing' : 'signed-out' })
      if (session) {
        await fullResync(get, set)
        realtimeUnsubscribe = subscribeToChanges(
          session.user.id,
          () => refreshHabitsFromRemote(set),
          () => refreshEntriesFromRemote(set)
        )
      }
      onAuthStateChange(async (newSession) => {
        const hadSession = !!get().session
        set({ session: newSession })
        if (newSession && !hadSession) {
          set({ syncStatus: 'syncing' })
          await fullResync(get, set)
          realtimeUnsubscribe?.()
          realtimeUnsubscribe = subscribeToChanges(
            newSession.user.id,
            () => refreshHabitsFromRemote(set),
            () => refreshEntriesFromRemote(set)
          )
        } else if (!newSession && hadSession) {
          realtimeUnsubscribe?.()
          realtimeUnsubscribe = null
          set({ syncStatus: 'signed-out' })
        }
      })
    }
  },

  addHabit: async (input) => {
    const id = crypto.randomUUID()
    const now = new Date().toISOString()
    const habit: HabitDefinition = {
      id,
      name: input.name,
      icon: input.icon,
      description: input.description,
      frequency: input.frequency,
      customDays: input.customDays,
      goal: { type: 'count', target: input.goalTarget },
      startDate: input.startDate,
      color: input.color,
      archived: false,
      order: get().habits.length,
      reminder: input.reminder,
      createdAt: now,
      updatedAt: now,
    }
    await StorageAdapter.createHabit(habit)
    set((s) => ({ habits: [...s.habits, habit] }))
    void syncPushHabit(get, habit)
  },

  updateHabit: async (habit) => {
    const updated = { ...habit, updatedAt: new Date().toISOString() }
    await StorageAdapter.updateHabit(updated)
    set((s) => ({ habits: s.habits.map((h) => (h.id === updated.id ? updated : h)) }))
    void syncPushHabit(get, updated)
  },

  deleteHabit: async (id) => {
    await StorageAdapter.deleteHabit(id)
    set((s) => ({
      habits: s.habits.filter((h) => h.id !== id),
      entries: s.entries.filter((e) => e.habitId !== id),
    }))
    const session = get().session
    if (session) void deleteRemoteHabit(id).catch(() => set({ syncStatus: 'error' }))
  },

  archiveHabit: async (id, archived) => {
    const habit = get().habits.find((h) => h.id === id)
    if (!habit) return
    const updated = { ...habit, archived, updatedAt: new Date().toISOString() }
    await StorageAdapter.updateHabit(updated)
    set((s) => ({ habits: s.habits.map((h) => (h.id === id ? updated : h)) }))
    void syncPushHabit(get, updated)
  },

  reorderHabits: async (orderedIds) => {
    await StorageAdapter.reorderHabits(orderedIds)
    set((s) => {
      const byId = new Map(s.habits.map((h) => [h.id, h]))
      const now = new Date().toISOString()
      const reordered = orderedIds
        .map((id, i) => {
          const h = byId.get(id)
          return h ? { ...h, order: i, updatedAt: now } : undefined
        })
        .filter((h): h is HabitDefinition => !!h)
      const session = get().session
      if (session) void pushHabitsBulk(reordered, session.user.id).catch(() => set({ syncStatus: 'error' }))
      return { habits: reordered }
    })
  },

  toggleEntry: async (habitId, date) => {
    const existing = get().entries.find((e) => e.habitId === habitId && e.date === date)
    await get().setEntryCompleted(habitId, date, !(existing?.completed ?? false))
  },

  setEntryCompleted: async (habitId, date, completed) => {
    const existing = get().entries.find((e) => e.habitId === habitId && e.date === date)
    const now = new Date().toISOString()
    const entry: HabitEntry = existing
      ? { ...existing, completed, updatedAt: now }
      : { id: crypto.randomUUID(), habitId, date, completed, createdAt: now, updatedAt: now }
    await StorageAdapter.setEntry(entry)
    set((s) => ({
      entries: existing
        ? s.entries.map((e) => (e.id === entry.id ? entry : e))
        : [...s.entries, entry],
    }))
    const session = get().session
    if (session) void pushEntry(entry, session.user.id).catch(() => set({ syncStatus: 'error' }))
  },

  completeAllToday: async () => {
    const today = todayISO()
    const { habits } = get()
    for (const h of habits) {
      if (h.archived) continue
      await get().setEntryCompleted(h.id, today, true)
    }
  },

  updateSettings: (partial) => {
    const merged = StorageAdapter.updateSettings(partial)
    set({ settings: merged })
    const session = get().session
    if (session) void pushSettings(merged, session.user.id).catch(() => set({ syncStatus: 'error' }))
  },

  setSelectedYear: (year) => set({ selectedYear: year }),
  setSelectedMonth: (month) => set({ selectedMonth: month }),

  exportData: async () => StorageAdapter.exportBackup(),

  importData: async (backup) => {
    await StorageAdapter.importBackup(backup)
    const habits = await StorageAdapter.getHabits()
    const entries = await StorageAdapter.getEntries()
    const settings = StorageAdapter.getSettings()
    set({ habits, entries, settings })
    const session = get().session
    if (session) {
      void pushHabitsBulk(habits, session.user.id).catch(() => set({ syncStatus: 'error' }))
      void pushEntriesBulk(entries, session.user.id).catch(() => set({ syncStatus: 'error' }))
      void pushSettings(settings, session.user.id).catch(() => set({ syncStatus: 'error' }))
    }
  },

  resetDemoData: async () => {
    await StorageAdapter.clearAll()
    const demo = generateDemoData(120)
    await StorageAdapter.bulkPutHabits(demo.habits)
    await StorageAdapter.bulkPutEntries(demo.entries)
    set({ habits: demo.habits, entries: demo.entries })
    const session = get().session
    if (session) {
      void pushHabitsBulk(demo.habits, session.user.id).catch(() => set({ syncStatus: 'error' }))
      void pushEntriesBulk(demo.entries, session.user.id).catch(() => set({ syncStatus: 'error' }))
    }
  },

  clearAllData: async () => {
    await StorageAdapter.clearAll()
    set({ habits: [], entries: [] })
    // Deliberately does not delete remote data — clearing the local device
    // shouldn't nuke your synced history without an explicit separate action.
  },

  requestSignIn: async (email) => {
    set({ syncError: null })
    await signInWithEmail(email)
    set({ authEmailSent: email })
  },

  signOutOfSync: async () => {
    await syncSignOut()
    realtimeUnsubscribe?.()
    realtimeUnsubscribe = null
    set({ session: null, syncStatus: 'signed-out', authEmailSent: null })
  },
}))

async function syncPushHabit(get: () => LockinState, habit: HabitDefinition) {
  const session = get().session
  if (!session) return
  try {
    await pushHabit(habit, session.user.id)
  } catch {
    useLockinStore.setState({ syncStatus: 'error' })
  }
}

async function refreshHabitsFromRemote(set: (partial: Partial<LockinState>) => void) {
  try {
    const remote = await pullRemote()
    await StorageAdapter.bulkPutHabits(remote.habits)
    set({ habits: remote.habits, syncStatus: 'synced' })
  } catch {
    set({ syncStatus: 'error' })
  }
}

async function refreshEntriesFromRemote(set: (partial: Partial<LockinState>) => void) {
  try {
    const remote = await pullRemote()
    await StorageAdapter.bulkPutEntries(remote.entries)
    set({ entries: remote.entries, syncStatus: 'synced' })
  } catch {
    set({ syncStatus: 'error' })
  }
}
