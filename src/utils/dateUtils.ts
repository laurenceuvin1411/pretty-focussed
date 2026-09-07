import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, startOfWeek, endOfWeek, isSameDay, parseISO, isToday, isBefore } from 'date-fns'
import { nlBE } from 'date-fns/locale'

export const formatDate = (date: Date, fmt: string) => format(date, fmt, { locale: nlBE })
export const today = () => format(new Date(), 'yyyy-MM-dd')
export const getDaysInMonth = (year: number, month: number) => {
  const start = startOfMonth(new Date(year, month, 1))
  const end = endOfMonth(new Date(year, month, 1))
  return eachDayOfInterval({ start, end })
}
export const getWeekDays = (date: Date) => {
  const start = startOfWeek(date, { weekStartsOn: 1 })
  const end = endOfWeek(date, { weekStartsOn: 1 })
  return eachDayOfInterval({ start, end })
}
export const toDateStr = (d: Date) => format(d, 'yyyy-MM-dd')
export { isSameDay, parseISO, isToday, isBefore, getDay, format }
