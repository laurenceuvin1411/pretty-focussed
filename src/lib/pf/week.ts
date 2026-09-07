// Week- en kwartaalhelpers voor Pretty Focused.
// Weken starten op maandag (ISO). Sleutels: '2026-W36', '2026-Q3', '2026-09'.
import {
  startOfWeek, addDays, addWeeks, format, getISOWeek, getISOWeekYear,
  parseISO, startOfQuarter, endOfQuarter, startOfMonth, endOfMonth, startOfYear, endOfYear, differenceInCalendarDays, setISOWeek, setISOWeekYear,
} from 'date-fns'
import { enGB } from 'date-fns/locale'

export const WEEK_OPTS = { weekStartsOn: 1 as const }
export const DAY_SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
export const DAY_LONG = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

export function todayStr(): string {
  return format(new Date(), 'yyyy-MM-dd')
}

export function weekKey(d: Date = new Date()): string {
  return `${getISOWeekYear(d)}-W${String(getISOWeek(d)).padStart(2, '0')}`
}

export function weekStart(d: Date = new Date()): Date {
  return startOfWeek(d, WEEK_OPTS)
}

// Maandag van de week die bij een sleutel hoort
export function weekStartFromKey(key: string): Date {
  const [y, w] = key.split('-W').map(Number)
  let d = setISOWeekYear(new Date(y, 5, 1), y)
  d = setISOWeek(d, w)
  return weekStart(d)
}

export function weekDates(d: Date = new Date()): string[] {
  const s = weekStart(d)
  return Array.from({ length: 7 }, (_, i) => format(addDays(s, i), 'yyyy-MM-dd'))
}

export function weekDatesFromKey(key: string): string[] {
  return weekDates(weekStartFromKey(key))
}

export function prevWeekKey(key: string): string {
  return weekKey(addWeeks(weekStartFromKey(key), -1))
}

export function nextWeekKey(key: string): string {
  return weekKey(addWeeks(weekStartFromKey(key), 1))
}

// 0 = maandag ... 6 = zondag
export function dayIndex(dateStr: string): number {
  const d = parseISO(dateStr).getDay()
  return (d + 6) % 7
}

export function weekLabel(key: string): string {
  const s = weekStartFromKey(key)
  const e = addDays(s, 6)
  const sameMonth = s.getMonth() === e.getMonth()
  return sameMonth
    ? `${format(s, 'd', { locale: enGB })} to ${format(e, 'd MMMM', { locale: enGB })}`
    : `${format(s, 'd MMM', { locale: enGB })} to ${format(e, 'd MMM', { locale: enGB })}`
}

export function weekNumber(key: string): number {
  return Number(key.split('-W')[1])
}

export function monthKey(d: Date = new Date()): string {
  return format(d, 'yyyy-MM')
}

export function quarterKey(d: Date = new Date()): string {
  return `${d.getFullYear()}-Q${Math.floor(d.getMonth() / 3) + 1}`
}

export function quarterInfo(d: Date = new Date()) {
  const start = startOfQuarter(d)
  const end = endOfQuarter(d)
  const total = differenceInCalendarDays(end, start) + 1
  const dayN = differenceInCalendarDays(d, start) + 1
  return {
    key: quarterKey(d),
    start, end, total,
    day: Math.min(total, Math.max(1, dayN)),
    daysLeft: Math.max(0, total - dayN),
    pct: Math.round((Math.min(total, Math.max(1, dayN)) / total) * 100),
  }
}

function span(start: Date, end: Date, d: Date) {
  const total = differenceInCalendarDays(end, start) + 1
  const dayN = differenceInCalendarDays(d, start) + 1
  const day = Math.min(total, Math.max(1, dayN))
  return { start, end, total, day, daysLeft: Math.max(0, total - dayN), pct: Math.round((day / total) * 100) }
}

export function yearKey(d: Date = new Date()): string { return String(d.getFullYear()) }

export function yearInfo(d: Date = new Date()) {
  return { key: yearKey(d), ...span(startOfYear(d), endOfYear(d), d) }
}

export function monthInfo(month: string = monthKey(), today: Date = new Date()) {
  const first = parseISO(`${month}-01`)
  const inMonth = monthKey(today) === month
  const ref = inMonth ? today : today < first ? first : endOfMonth(first)
  return { key: month, name: format(first, 'MMMM', { locale: enGB }), ...span(startOfMonth(first), endOfMonth(first), ref), inMonth }
}

export function shiftMonth(month: string, by: number): string {
  const [y, m] = month.split('-').map(Number)
  return monthKey(new Date(y, m - 1 + by, 1))
}

// Every ISO week that touches the month, Monday first.
export function weeksInMonth(month: string): string[] {
  const first = parseISO(`${month}-01`)
  const last = endOfMonth(first)
  const keys: string[] = []
  for (let d = weekStart(first); d <= last; d = addWeeks(d, 1)) keys.push(weekKey(d))
  return keys
}

export function fmtDay(dateStr: string, pattern = 'EEEE d MMMM'): string {
  return format(parseISO(dateStr), pattern, { locale: enGB })
}

// Zondag- en maandagmomenten: wanneer is het "sessietijd"?
export function isSessionWindow(d: Date = new Date()): boolean {
  const day = d.getDay() // 0 = zondag
  return day === 0 || day === 1
}

export function isRecapWindow(d: Date = new Date()): boolean {
  const day = d.getDay()
  return day === 5 || day === 6
}

export function money(n: number): string {
  return new Intl.NumberFormat('en-IE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n)
}
