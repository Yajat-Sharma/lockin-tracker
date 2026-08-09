import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, Pencil, Archive, ArchiveRestore, Trash2 } from 'lucide-react'
import type { HabitDefinition, HabitStats } from '@/types'
import { Button } from '@/components/ui/Button'
import { cn } from '@/utils/cn'

interface HabitCardProps {
  habit: HabitDefinition
  stats: HabitStats
  onEdit: () => void
  onArchiveToggle: () => void
  onDelete: () => void
}

export function HabitCard({ habit, stats, onEdit, onArchiveToggle, onDelete }: HabitCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: habit.id,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'flex items-center gap-3 px-3 py-3 bg-surface border border-hairline rounded-[4px]',
        isDragging && 'opacity-50 z-10'
      )}
    >
      <button
        {...attributes}
        {...listeners}
        aria-label={`Reorder ${habit.name}`}
        className="text-tertiary hover:text-secondary cursor-grab active:cursor-grabbing shrink-0"
      >
        <GripVertical size={15} />
      </button>

      <span
        className="w-9 h-9 flex items-center justify-center rounded-[4px] text-[16px] shrink-0"
        style={{ backgroundColor: `color-mix(in oklab, var(--accent-${habit.color}) 16%, transparent)` }}
      >
        {habit.icon}
      </span>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[13px] font-medium text-primary truncate">{habit.name}</span>
          {habit.archived && (
            <span className="text-[9px] uppercase tracking-wide text-tertiary bg-elevated px-1.5 py-0.5 rounded-[2px] shrink-0">
              Archived
            </span>
          )}
          {stats.totalCompleted >= habit.goal.target && (
            <span className="text-[9px] uppercase tracking-wide text-void bg-green px-1.5 py-0.5 rounded-[2px] shrink-0">
              Achieved
            </span>
          )}
        </div>
        <div className="text-[11px] text-tertiary truncate">
          Goal: {Math.min(stats.totalCompleted, habit.goal.target)}/{habit.goal.target} · {habit.frequency}
        </div>
      </div>

      <div className="hidden sm:flex items-center gap-5 shrink-0 font-mono-tabular text-[12px]">
        <Stat label="Streak" value={stats.currentStreak} />
        <Stat label="Best" value={stats.bestStreak} />
        <Stat label="Rate" value={`${stats.completionRate}%`} />
      </div>

      <div className="flex items-center gap-1 shrink-0">
        <Button size="sm" variant="ghost" onClick={onEdit} aria-label="Edit habit">
          <Pencil size={13} />
        </Button>
        <Button size="sm" variant="ghost" onClick={onArchiveToggle} aria-label={habit.archived ? 'Restore habit' : 'Archive habit'}>
          {habit.archived ? <ArchiveRestore size={13} /> : <Archive size={13} />}
        </Button>
        <Button size="sm" variant="danger" onClick={onDelete} aria-label="Delete habit">
          <Trash2 size={13} />
        </Button>
      </div>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="text-right">
      <div className="text-primary font-semibold leading-none">{value}</div>
      <div className="text-tertiary text-[9px] uppercase tracking-wide mt-0.5">{label}</div>
    </div>
  )
}
