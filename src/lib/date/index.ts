import {
  format,
  parseISO,
  startOfDay,
  addDays,
  subDays,
  isSameDay,
  isAfter,
  isBefore,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  eachWeekOfInterval,
  startOfYear,
  endOfYear,
  startOfMonth,
  endOfMonth,
  getDay,
  differenceInCalendarDays,
} from 'date-fns'

/**
 * All dates in this app are represented as ISO "yyyy-MM-dd" strings once they
 * cross a storage or calculation boundary. We always normalize via startOfDay
 * on the *local* Date object before formatting, so DST shifts and timezone
 * offsets never change which calendar day a check-in belongs to.
 */

export const ISO_DATE_FORMAT = 'yyyy-MM-dd'

export function toISODate(date: Date): string {
  return format(startOfDay(date), ISO_DATE_FORMAT)
}

export function fromISODate(iso: string): Date {
  // parseISO on a date-only string yields local midnight, which is what we want.
  return startOfDay(parseISO(iso))
}

export function todayISO(): string {
  return toISODate(new Date())
}

export function isTodayISO(iso: string): boolean {
  return isSameDay(fromISODate(iso), startOfDay(new Date()))
}

export function isFutureISO(iso: string): boolean {
  return isAfter(fromISODate(iso), startOfDay(new Date()))
}

export function isPastOrTodayISO(iso: string): boolean {
  return !isFutureISO(iso)
}

export { addDays, subDays, isSameDay, isAfter, isBefore, differenceInCalendarDays }

export function addISODays(iso: string, amount: number): string {
  return toISODate(addDays(fromISODate(iso), amount))
}

export function dayOfWeek(iso: string): number {
  return getDay(fromISODate(iso))
}

export function formatDisplay(iso: string, fmt = 'MMM d, yyyy'): string {
  return format(fromISODate(iso), fmt)
}

export function formatShort(iso: string): string {
  return format(fromISODate(iso), 'dd')
}

export function formatWeekday(iso: string): string {
  return format(fromISODate(iso), 'EEE')
}

export function getWeekRange(iso: string, weekStartsOn: 0 | 1 = 1) {
  const d = fromISODate(iso)
  return {
    start: startOfWeek(d, { weekStartsOn }),
    end: endOfWeek(d, { weekStartsOn }),
  }
}

export function getDaysInYear(year: number): string[] {
  const start = startOfYear(new Date(year, 0, 1))
  const end = endOfYear(new Date(year, 0, 1))
  return eachDayOfInterval({ start, end }).map(toISODate)
}

export interface YearWeek {
  weekIndex: number
  label: string
  days: string[] // ISO dates, always 7, may spill into adjacent year at edges
  startDate: string
  endDate: string
}

export function getWeeksInYear(year: number, weekStartsOn: 0 | 1 = 1): YearWeek[] {
  const yearStart = startOfYear(new Date(year, 0, 1))
  const yearEnd = endOfYear(new Date(year, 0, 1))
  const weekStarts = eachWeekOfInterval({ start: yearStart, end: yearEnd }, { weekStartsOn })

  return weekStarts.map((weekStart, index) => {
    const days = Array.from({ length: 7 }, (_, i) => toISODate(addDays(weekStart, i)))
    return {
      weekIndex: index,
      label: `WEEK ${index + 1}`,
      days,
      startDate: days[0],
      endDate: days[6],
    }
  })
}

export function getMonthRange(year: number, month: number) {
  const start = startOfMonth(new Date(year, month, 1))
  const end = endOfMonth(new Date(year, month, 1))
  return { start: toISODate(start), end: toISODate(end) }
}

export function getDaysInMonth(year: number, month: number): string[] {
  const { start, end } = getMonthRange(year, month)
  return eachDayOfInterval({ start: fromISODate(start), end: fromISODate(end) }).map(toISODate)
}

export const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

export const WEEKDAY_LABELS_MON_START = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
export const WEEKDAY_LABELS_SUN_START = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
