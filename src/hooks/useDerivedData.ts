import { useMemo } from 'react'
import { useLockinStore } from '@/store/useLockinStore'
import { buildEntryMap } from '@/lib/calculations'

export function useEntryMap() {
  const entries = useLockinStore((s) => s.entries)
  return useMemo(() => buildEntryMap(entries), [entries])
}

export function useActiveHabits() {
  const habits = useLockinStore((s) => s.habits)
  return useMemo(() => habits.filter((h) => !h.archived).sort((a, b) => a.order - b.order), [habits])
}

export function useArchivedHabits() {
  const habits = useLockinStore((s) => s.habits)
  return useMemo(() => habits.filter((h) => h.archived), [habits])
}
