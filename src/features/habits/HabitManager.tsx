import { useMemo, useState } from 'react'
import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy,
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { HabitCard } from './HabitCard'
import { HabitForm, type HabitFormValues } from './HabitForm'
import { useEntryMap } from '@/hooks/useDerivedData'
import { useLockinStore } from '@/store/useLockinStore'
import { useKeyboardShortcut } from '@/hooks/useKeyboardShortcut'
import { calculateHabitStats } from '@/lib/calculations'
import type { HabitDefinition } from '@/types'

export function HabitManager() {
  const habits = useLockinStore((s) => s.habits)
  const entryMap = useEntryMap()
  const addHabit = useLockinStore((s) => s.addHabit)
  const updateHabit = useLockinStore((s) => s.updateHabit)
  const deleteHabit = useLockinStore((s) => s.deleteHabit)
  const archiveHabit = useLockinStore((s) => s.archiveHabit)
  const reorderHabits = useLockinStore((s) => s.reorderHabits)

  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<HabitDefinition | undefined>(undefined)
  const [confirmDelete, setConfirmDelete] = useState<HabitDefinition | undefined>(undefined)

  useKeyboardShortcut('n', () => {
    setEditing(undefined)
    setFormOpen(true)
  })

  const sorted = useMemo(() => [...habits].sort((a, b) => a.order - b.order), [habits])
  const active = sorted.filter((h) => !h.archived)
  const archived = sorted.filter((h) => h.archived)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  function handleDragEnd(e: DragEndEvent) {
    const { active: a, over } = e
    if (!over || a.id === over.id) return
    const ids = active.map((h) => h.id)
    const oldIndex = ids.indexOf(String(a.id))
    const newIndex = ids.indexOf(String(over.id))
    if (oldIndex === -1 || newIndex === -1) return
    const reordered = [...ids]
    reordered.splice(oldIndex, 1)
    reordered.splice(newIndex, 0, String(a.id))
    reorderHabits(reordered)
  }

  function handleSubmit(values: HabitFormValues) {
    if (editing) {
      updateHabit({
        ...editing,
        name: values.name,
        icon: values.icon,
        description: values.description,
        frequency: values.frequency,
        customDays: values.frequency === 'custom' ? values.customDays : undefined,
        goal: { type: 'count', target: values.goalTarget },
        startDate: values.startDate,
        color: values.color,
        reminder: values.reminder,
      })
    } else {
      addHabit({
        name: values.name,
        icon: values.icon,
        description: values.description,
        frequency: values.frequency,
        customDays: values.frequency === 'custom' ? values.customDays : undefined,
        goalTarget: values.goalTarget,
        startDate: values.startDate,
        color: values.color,
        reminder: values.reminder,
      })
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[20px] font-semibold text-primary">Habits</h1>
          <p className="text-[13px] text-secondary mt-0.5">
            Manage what you track. Drag to reorder — press <kbd className="px-1 py-0.5 bg-elevated rounded-[2px] text-[11px]">N</kbd> for a new habit.
          </p>
        </div>
        <Button
          variant="primary"
          onClick={() => {
            setEditing(undefined)
            setFormOpen(true)
          }}
        >
          <Plus size={14} /> New habit
        </Button>
      </div>

      {active.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-hairline rounded-[4px] text-[13px] text-tertiary">
          No habits yet. Create your first one to start tracking.
        </div>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={active.map((h) => h.id)} strategy={verticalListSortingStrategy}>
            <div className="flex flex-col gap-2">
              {active.map((habit) => (
                <HabitCard
                  key={habit.id}
                  habit={habit}
                  stats={calculateHabitStats(habit, entryMap)}
                  onEdit={() => {
                    setEditing(habit)
                    setFormOpen(true)
                  }}
                  onArchiveToggle={() => archiveHabit(habit.id, !habit.archived)}
                  onDelete={() => setConfirmDelete(habit)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {archived.length > 0 && (
        <div>
          <h2 className="text-[11px] font-semibold tracking-[0.08em] uppercase text-secondary mb-2">
            Archived
          </h2>
          <div className="flex flex-col gap-2">
            {archived.map((habit) => (
              <HabitCard
                key={habit.id}
                habit={habit}
                stats={calculateHabitStats(habit, entryMap)}
                onEdit={() => {
                  setEditing(habit)
                  setFormOpen(true)
                }}
                onArchiveToggle={() => archiveHabit(habit.id, !habit.archived)}
                onDelete={() => setConfirmDelete(habit)}
              />
            ))}
          </div>
        </div>
      )}

      <HabitForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSubmit={handleSubmit}
        habit={editing}
      />

      {confirmDelete && (
        <ConfirmDeleteModal
          habitName={confirmDelete.name}
          onCancel={() => setConfirmDelete(undefined)}
          onConfirm={() => {
            deleteHabit(confirmDelete.id)
            setConfirmDelete(undefined)
          }}
        />
      )}
    </div>
  )
}

function ConfirmDeleteModal({
  habitName,
  onCancel,
  onConfirm,
}: {
  habitName: string
  onCancel: () => void
  onConfirm: () => void
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onCancel} />
      <div className="relative bg-surface border border-hairline-strong rounded-[6px] p-5 w-full max-w-[360px]">
        <h2 className="text-[14px] font-semibold text-primary mb-2">Delete "{habitName}"?</h2>
        <p className="text-[12px] text-secondary mb-4">
          This permanently removes the habit and all of its check-in history. This can't be undone.
        </p>
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
          <Button variant="danger" onClick={onConfirm}>
            Delete
          </Button>
        </div>
      </div>
    </div>
  )
}
