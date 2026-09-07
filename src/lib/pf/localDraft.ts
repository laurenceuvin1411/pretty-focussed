// A week drafted without the studio: habits first, the three in the mornings of working days, admin after lunch, air.
// Used when the assistant is not connected, so the session always ends with a week she can hold.
import type { WeekPlan, Block, DayPlan } from '../../store/pf/weekStore'
import type { Ritual } from '../../store/pf/ritualStore'
import { weekDatesFromKey } from './week'

interface Prefs { workStart: string; workEnd: string; freeDays: number[] }

const addMin = (t: string, m: number) => { const [h, mm] = t.split(':').map(Number); const x = h * 60 + mm + m; return `${String(Math.floor(x / 60)).padStart(2, '0')}:${String(x % 60).padStart(2, '0')}` }

export function localDraft(week: WeekPlan, prefs: Prefs, rituals: Ritual[]): { days: Record<string, DayPlan>; note: string; drop: string } {
  const dates = weekDatesFromKey(week.key)
  const days: Record<string, DayPlan> = {}
  const ps = week.priorities.filter(p => p.title.trim())
  const workdays = dates.map((d, i) => ({ d, i })).filter(x => !prefs.freeDays.includes(x.i))
  const id = () => crypto.randomUUID()
  const B = (start: string, end: string, title: string, kind: Block['kind'], extra: Partial<Block> = {}): Block => ({ id: id(), start, end, title, kind, done: false, ...extra })

  dates.forEach((d, i) => {
    const blocks: Block[] = []
    for (const r of rituals) {
      const planned = week.ritualDays[r.id] ?? r.preferredDays
      if (planned.includes(i)) blocks.push(B('07:00', '07:45', r.name, 'ritual', { ritualId: r.id }))
    }
    days[d] = { date: d, blocks }
  })

  // Each priority gets two mornings, spread over the working days; the first priority leads Monday.
  workdays.forEach((w, k) => {
    const p = ps[k % Math.max(1, ps.length)]
    const blocks = days[w.d].blocks
    if (p) blocks.push(B(prefs.workStart, addMin(prefs.workStart, 120), p.title, 'priority', { priorityId: p.id }))
    if (k % 2 === 1 && ps.length > 1) {
      const q = ps[(k + 1) % ps.length]
      blocks.push(B(addMin(prefs.workStart, 150), addMin(prefs.workStart, 240), q.title, 'priority', { priorityId: q.id }))
    }
    blocks.push(B('14:00', '14:45', 'Mail and admin', 'admin'))
    if (k === workdays.length - 1) blocks.push(B(addMin(prefs.workEnd, -60), prefs.workEnd, 'Close the week', 'admin'))
    days[w.d].intention = p ? `${p.title}. The rest can wait.` : 'Air.'
    blocks.sort((a, b) => a.start.localeCompare(b.start))
  })
  dates.forEach((d, i) => { if (prefs.freeDays.includes(i) && !days[d].intention) days[d].intention = 'Off.' })

  const first = ps[0]?.title
  return {
    days,
    note: first ? `Mornings carry the three, ${first.toLowerCase()} first. Admin after lunch, the habits before nine.` : 'Habits before nine, admin after lunch, and air.',
    drop: 'Anything new that is not one of the three.',
  }
}
