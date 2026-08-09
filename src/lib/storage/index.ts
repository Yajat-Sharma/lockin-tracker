import { openDB, type IDBPDatabase } from 'idb'
import type { HabitDefinition, HabitEntry, AppSettings } from '@/types'
import { DEFAULT_SETTINGS } from '@/types'

const DB_NAME = 'lockin-db'
const DB_VERSION = 1
const SETTINGS_KEY = 'lockin:settings'

let dbPromise: Promise<IDBPDatabase> | null = null

function getDB(): Promise<IDBPDatabase> {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('habits')) {
          const habitStore = db.createObjectStore('habits', { keyPath: 'id' })
          habitStore.createIndex('order', 'order')
        }
        if (!db.objectStoreNames.contains('entries')) {
          const entryStore = db.createObjectStore('entries', { keyPath: 'id' })
          entryStore.createIndex('habitId', 'habitId')
          entryStore.createIndex('date', 'date')
          entryStore.createIndex('habitDate', ['habitId', 'date'], { unique: true })
        }
      },
    })
  }
  return dbPromise
}

export interface Backup {
  version: number
  exportedAt: string
  habits: HabitDefinition[]
  entries: HabitEntry[]
  settings: AppSettings
}

export const StorageAdapter = {
  async getHabits(): Promise<HabitDefinition[]> {
    const db = await getDB()
    const all = await db.getAll('habits')
    return all.sort((a, b) => a.order - b.order)
  },

  async createHabit(habit: HabitDefinition): Promise<HabitDefinition> {
    const db = await getDB()
    await db.put('habits', habit)
    return habit
  },

  async updateHabit(habit: HabitDefinition): Promise<HabitDefinition> {
    const db = await getDB()
    await db.put('habits', habit)
    return habit
  },

  async deleteHabit(id: string): Promise<void> {
    const db = await getDB()
    const tx = db.transaction(['habits', 'entries'], 'readwrite')
    await tx.objectStore('habits').delete(id)
    const entryStore = tx.objectStore('entries')
    const index = entryStore.index('habitId')
    let cursor = await index.openCursor(IDBKeyRange.only(id))
    while (cursor) {
      await cursor.delete()
      cursor = await cursor.continue()
    }
    await tx.done
  },

  async reorderHabits(orderedIds: string[]): Promise<void> {
    const db = await getDB()
    const tx = db.transaction('habits', 'readwrite')
    const store = tx.objectStore('habits')
    for (let i = 0; i < orderedIds.length; i++) {
      const h = await store.get(orderedIds[i])
      if (h) {
        h.order = i
        await store.put(h)
      }
    }
    await tx.done
  },

  async getEntries(): Promise<HabitEntry[]> {
    const db = await getDB()
    return db.getAll('entries')
  },

  async setEntry(entry: HabitEntry): Promise<HabitEntry> {
    const db = await getDB()
    await db.put('entries', entry)
    return entry
  },

  async deleteEntry(id: string): Promise<void> {
    const db = await getDB()
    await db.delete('entries', id)
  },

  async bulkPutEntries(entries: HabitEntry[]): Promise<void> {
    const db = await getDB()
    const tx = db.transaction('entries', 'readwrite')
    for (const e of entries) await tx.objectStore('entries').put(e)
    await tx.done
  },

  async bulkPutHabits(habits: HabitDefinition[]): Promise<void> {
    const db = await getDB()
    const tx = db.transaction('habits', 'readwrite')
    for (const h of habits) await tx.objectStore('habits').put(h)
    await tx.done
  },

  async clearAll(): Promise<void> {
    const db = await getDB()
    const tx = db.transaction(['habits', 'entries'], 'readwrite')
    await tx.objectStore('habits').clear()
    await tx.objectStore('entries').clear()
    await tx.done
  },

  getSettings(): AppSettings {
    try {
      const raw = localStorage.getItem(SETTINGS_KEY)
      if (!raw) return DEFAULT_SETTINGS
      return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) }
    } catch {
      return DEFAULT_SETTINGS
    }
  },

  updateSettings(settings: Partial<AppSettings>): AppSettings {
    const merged = { ...StorageAdapter.getSettings(), ...settings }
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(merged))
    return merged
  },

  async exportBackup(): Promise<Backup> {
    const [habits, entries] = await Promise.all([
      StorageAdapter.getHabits(),
      StorageAdapter.getEntries(),
    ])
    return {
      version: 1,
      exportedAt: new Date().toISOString(),
      habits,
      entries,
      settings: StorageAdapter.getSettings(),
    }
  },

  async importBackup(backup: Backup): Promise<void> {
    if (!backup || !Array.isArray(backup.habits) || !Array.isArray(backup.entries)) {
      throw new Error('Invalid backup file: missing habits or entries arrays.')
    }
    await StorageAdapter.clearAll()
    await StorageAdapter.bulkPutHabits(backup.habits)
    await StorageAdapter.bulkPutEntries(backup.entries)
    if (backup.settings) StorageAdapter.updateSettings(backup.settings)
  },
}

export function validateBackup(data: unknown): data is Backup {
  if (typeof data !== 'object' || data === null) return false
  const b = data as Record<string, unknown>
  return Array.isArray(b.habits) && Array.isArray(b.entries)
}
