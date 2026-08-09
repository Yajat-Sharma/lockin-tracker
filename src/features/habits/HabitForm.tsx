import { useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Toggle, SegmentedControl } from '@/components/ui/Toggle'
import { HABIT_ICONS, HABIT_COLORS, type Frequency, type HabitColorName, type HabitDefinition } from '@/types'
import { todayISO } from '@/lib/date'
import { cn } from '@/utils/cn'

export interface HabitFormValues {
  name: string
  icon: string
  description: string
  frequency: Frequency
  customDays: number[]
  goalTarget: number
  startDate: string
  color: HabitColorName
  reminder: boolean
}

const DOW_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

const FREQUENCY_OPTIONS: { value: Frequency; label: string }[] = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekdays', label: 'Weekdays' },
  { value: 'weekends', label: 'Weekends' },
  { value: 'custom', label: 'Custom' },
]

function defaultsFromHabit(habit?: HabitDefinition): HabitFormValues {
  if (habit) {
    return {
      name: habit.name,
      icon: habit.icon,
      description: habit.description,
      frequency: habit.frequency,
      customDays: habit.customDays ?? [],
      goalTarget: habit.goal.target,
      startDate: habit.startDate,
      color: habit.color,
      reminder: habit.reminder,
    }
  }
  return {
    name: '',
    icon: HABIT_ICONS[0],
    description: '',
    frequency: 'daily',
    customDays: [],
    goalTarget: 30,
    startDate: todayISO(),
    color: 'cyan',
    reminder: false,
  }
}

interface HabitFormProps {
  open: boolean
  onClose: () => void
  onSubmit: (values: HabitFormValues) => void
  habit?: HabitDefinition
}

export function HabitForm({ open, onClose, onSubmit, habit }: HabitFormProps) {
  const [values, setValues] = useState<HabitFormValues>(() => defaultsFromHabit(habit))

  function reset() {
    setValues(defaultsFromHabit(habit))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!values.name.trim()) return
    onSubmit(values)
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={() => {
        onClose()
        reset()
      }}
      title={habit ? 'Edit habit' : 'New habit'}
      width={440}
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="block text-[11px] font-medium text-secondary mb-1.5" htmlFor="habit-name">
            Name
          </label>
          <input
            id="habit-name"
            autoFocus
            required
            value={values.name}
            onChange={(e) => setValues((v) => ({ ...v, name: e.target.value }))}
            placeholder="Deep Work"
            className="w-full h-9 px-3 rounded-[3px] bg-elevated border border-hairline text-[13px] text-primary placeholder:text-tertiary focus-visible:outline-2 focus-visible:outline-cyan"
          />
        </div>

        <div>
          <label className="block text-[11px] font-medium text-secondary mb-1.5">Icon</label>
          <div className="flex flex-wrap gap-1.5">
            {HABIT_ICONS.map((icon) => (
              <button
                key={icon}
                type="button"
                onClick={() => setValues((v) => ({ ...v, icon }))}
                aria-label={`Icon ${icon}`}
                aria-pressed={values.icon === icon}
                className={cn(
                  'w-8 h-8 flex items-center justify-center rounded-[3px] text-[15px] transition-colors',
                  values.icon === icon ? 'bg-elevated-2 ring-1 ring-cyan' : 'bg-elevated hover:bg-elevated-2'
                )}
              >
                {icon}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-[11px] font-medium text-secondary mb-1.5" htmlFor="habit-desc">
            Description
          </label>
          <textarea
            id="habit-desc"
            value={values.description}
            onChange={(e) => setValues((v) => ({ ...v, description: e.target.value }))}
            placeholder="2+ hours of focused, distraction-free work."
            rows={2}
            className="w-full px-3 py-2 rounded-[3px] bg-elevated border border-hairline text-[13px] text-primary placeholder:text-tertiary resize-none focus-visible:outline-2 focus-visible:outline-cyan"
          />
        </div>

        <div>
          <label className="block text-[11px] font-medium text-secondary mb-1.5">Frequency</label>
          <SegmentedControl
            options={FREQUENCY_OPTIONS}
            value={values.frequency}
            onChange={(frequency) => setValues((v) => ({ ...v, frequency }))}
          />
          {values.frequency === 'custom' && (
            <div className="flex gap-1 mt-2">
              {DOW_LABELS.map((label, dow) => {
                const active = values.customDays.includes(dow)
                return (
                  <button
                    key={label}
                    type="button"
                    onClick={() =>
                      setValues((v) => ({
                        ...v,
                        customDays: active ? v.customDays.filter((d) => d !== dow) : [...v.customDays, dow],
                      }))
                    }
                    className={cn(
                      'flex-1 h-7 rounded-[3px] text-[11px] font-medium transition-colors',
                      active ? 'bg-cyan text-void' : 'bg-elevated text-secondary hover:bg-elevated-2'
                    )}
                  >
                    {label}
                  </button>
                )
              })}
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-medium text-secondary mb-1.5" htmlFor="habit-goal">
              Goal (times)
            </label>
            <input
              id="habit-goal"
              type="number"
              min={1}
              value={values.goalTarget}
              onChange={(e) => setValues((v) => ({ ...v, goalTarget: Number(e.target.value) || 1 }))}
              className="w-full h-9 px-3 rounded-[3px] bg-elevated border border-hairline text-[13px] text-primary font-mono-tabular focus-visible:outline-2 focus-visible:outline-cyan"
            />
          </div>
          <div>
            <label className="block text-[11px] font-medium text-secondary mb-1.5" htmlFor="habit-start">
              Start date
            </label>
            <input
              id="habit-start"
              type="date"
              value={values.startDate}
              onChange={(e) => setValues((v) => ({ ...v, startDate: e.target.value }))}
              className="w-full h-9 px-3 rounded-[3px] bg-elevated border border-hairline text-[13px] text-primary font-mono-tabular focus-visible:outline-2 focus-visible:outline-cyan"
            />
          </div>
        </div>

        <div>
          <label className="block text-[11px] font-medium text-secondary mb-1.5">Accent color</label>
          <div className="flex gap-2">
            {HABIT_COLORS.map((c) => (
              <button
                key={c.name}
                type="button"
                aria-label={c.name}
                aria-pressed={values.color === c.name}
                onClick={() => setValues((v) => ({ ...v, color: c.name }))}
                className={cn(
                  'w-7 h-7 rounded-full transition-transform',
                  values.color === c.name && 'ring-2 ring-offset-2 ring-offset-surface ring-primary scale-105'
                )}
                style={{ backgroundColor: c.value }}
              />
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between py-1">
          <span className="text-[12px] text-secondary">Enable reminder</span>
          <Toggle checked={values.reminder} onChange={(reminder) => setValues((v) => ({ ...v, reminder }))} />
        </div>

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-hairline">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary">
            {habit ? 'Save changes' : 'Create habit'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
