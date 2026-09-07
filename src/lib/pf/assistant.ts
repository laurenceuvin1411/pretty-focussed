// The Studio assistant: four jobs, no chat.
// 1. propose the three priorities ("these three, not those six")
// 2. draft the week as time blocks
// 3. rebuild one day when it breaks (fast model, always proposed, never applied)
// 4. write the Friday recap
import { askClaude, extractJSON, STUDIO_SYSTEM } from '../ai'
import { useGoalStore } from '../../store/pf/goalStore'
import type { Goal90 } from '../../store/pf/goalStore'
import { useRevenueStore } from '../../store/pf/revenueStore'
import { useRitualStore, PHASE_LABEL, PHASE_HINT } from '../../store/pf/ritualStore'
import { useWeekStore } from '../../store/pf/weekStore'
import type { Priority, Block, DayPlan, Recap, WeekPlan } from '../../store/pf/weekStore'
import { useCalendarStore } from '../../store/calendarStore'
import { firstName } from '../workspace'
import { weekDatesFromKey, prevWeekKey, monthKey, money, quarterInfo, DAY_LONG, dayIndex, fmtDay } from './week'

// ── Context every job receives ────────────────────────────────────────

function goalLines(goals: Goal90[]): string {
  if (goals.length === 0) return '(no goals yet)'
  return goals.map(g => {
    const prog = g.target ? ` (${g.current ?? 0}/${g.target}${g.unit ? ' ' + g.unit : ''})` : ''
    return `- [${g.lane === 'business' ? 'BUSINESS' : 'LIFE'}] ${g.title}${prog}${g.why ? ' · why: ' + g.why : ''}${g.done ? ' · DONE' : ''}`
  }).join('\n')
}

function revenueLines(): string {
  const r = useRevenueStore.getState()
  const m = monthKey()
  const target = r.monthTarget(m)
  const revenue = r.monthRevenue(m)
  const gap = target - revenue
  const offers = r.offers.map(o => `${o.name} (${money(o.price)})`).join(', ') || '(no offers yet)'
  const now = new Date()
  const daysLeft = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate() - now.getDate()
  return `Monthly target: ${money(target)} · Logged so far: ${money(revenue)} · Gap: ${money(Math.max(0, gap))} · Days left in the month: ${daysLeft}\nOffers: ${offers}`
}

function ritualLines(week: WeekPlan): string {
  const r = useRitualStore.getState()
  if (r.rituals.length === 0) return '(no success habits set)'
  return r.rituals.map(x => {
    const days = week.ritualDays[x.id]
    const planned = days?.length ? ' · planned on ' + days.map(d => DAY_LONG[d]).join(', ') : ''
    return `- ${x.name}: ${x.timesPerWeek}x a week${planned}${x.cycleAware ? ' · cycle-aware' : ''}`
  }).join('\n')
}

function cycleLines(dates: string[]): string {
  const r = useRitualStore.getState()
  if (!r.cycleStart) return ''
  const phases = dates.map(d => `${DAY_LONG[dayIndex(d)]}: ${PHASE_LABEL[r.phaseOn(d)!]}`).join(', ')
  const first = r.phaseOn(dates[0])!
  return `\nCYCLE this week: ${phases}. ${PHASE_HINT[first]}`
}

function calendarLines(dates: string[]): string {
  const events = useCalendarStore.getState().events
    .filter(e => dates.includes(e.start.slice(0, 10)))
    .sort((a, b) => a.start.localeCompare(b.start))
  if (events.length === 0) return '(no calendar events known)'
  return events.map(e => {
    const allDay = !e.start.includes('T')
    const t = allDay ? 'all day' : `${e.start.slice(11, 16)} to ${e.end.slice(11, 16)}`
    return `- ${fmtDay(e.start.slice(0, 10), 'EEEE d/M')} ${t}: ${e.summary}`
  }).join('\n')
}

function reviewLines(week: WeekPlan): string {
  const prev = useWeekStore.getState().weeks[prevWeekKey(week.key)]
  const parts: string[] = []
  if (prev?.priorities.length) {
    parts.push('Last week priorities: ' + prev.priorities.map(p => `${p.title} (${p.done ? 'done' : 'not done'})`).join('; '))
  }
  const rv = week.review ?? prev?.review
  if (rv) parts.push(`Review: what worked: ${rv.wins || '-'} · what she is letting go: ${rv.drops || '-'} · lesson: ${rv.lesson || '-'} · energy ${rv.energy}/5`)
  return parts.join('\n') || '(first week, no review yet)'
}

function baseContext(week: WeekPlan): string {
  const dates = weekDatesFromKey(week.key)
  const q = quarterInfo()
  const goals = useGoalStore.getState().goalsFor()
  return `MEMBER: ${firstName() || 'she'}
WEEK: ${week.key}, ${fmtDay(dates[0], 'd MMMM')} to ${fmtDay(dates[6], 'd MMMM')}
QUARTER: ${q.key}, day ${q.day} of ${q.total}, ${q.daysLeft} days left

90-DAY GOALS
${goalLines(goals)}

REVENUE THIS MONTH
${revenueLines()}

SUCCESS HABITS
${ritualLines(week)}${cycleLines(dates)}

CALENDAR THIS WEEK
${calendarLines(dates)}

LAST WEEK
${reviewLines(week)}`
}

// ── 1. Priorities ─────────────────────────────────────────────────────

export interface PrioritySuggestion {
  priorities: { title: string; goalId?: string; why: string }[]
  drop: string
}

export async function suggestPriorities(week: WeekPlan): Promise<PrioritySuggestion> {
  const goals = useGoalStore.getState().goalsFor()
  const user = `${baseContext(week)}

TASK
Choose the three priorities for this week. At least one from BUSINESS and at least one from LIFE when both lanes have goals. Weigh the revenue gap: when the gap is large, one priority is about selling. Each priority is one concrete outcome that fits in one week, not a theme. Also say, plainly and kindly, what she can leave this week.

Valid goalId values: ${goals.map(g => `"${g.id}" (${g.title})`).join(', ') || 'none'}.

ANSWER AS JSON
{"priorities":[{"title":"...","goalId":"... or omit","why":"one sentence"}],"drop":"one or two sentences"}`
  const text = await askClaude({ system: STUDIO_SYSTEM, user, model: 'sonnet', maxTokens: 1200 })
  const out = extractJSON<PrioritySuggestion>(text)
  out.priorities = (out.priorities ?? []).slice(0, 3).map(p => ({
    ...p,
    goalId: goals.some(g => g.id === p.goalId) ? p.goalId : undefined,
  }))
  return out
}

// ── 2. Draft the week ─────────────────────────────────────────────────

interface DraftDay { date: string; intention: string; blocks: { start: string; end: string; title: string; kind: Block['kind']; priorityIndex?: number; ritualId?: string }[] }
interface DraftWeek { days: DraftDay[]; note: string; drop: string }

export interface WeekDraft {
  days: Record<string, DayPlan>
  note: string
  drop: string
}

export async function draftWeek(week: WeekPlan, prefs?: { workStart?: string; workEnd?: string; freeDays?: number[] }): Promise<WeekDraft> {
  const dates = weekDatesFromKey(week.key)
  const rituals = useRitualStore.getState().rituals
  const pr = week.priorities
  const workStart = prefs?.workStart ?? '09:00'
  const workEnd = prefs?.workEnd ?? '17:30'
  const free = (prefs?.freeDays ?? [5, 6]).map(d => DAY_LONG[d]).join(' and ')

  const user = `${baseContext(week)}

THREE PRIORITIES (index 0 to ${pr.length - 1})
${pr.map((p, i) => `${i}. ${p.title}${p.why ? ' · ' + p.why : ''}`).join('\n') || '(no priorities yet)'}

PREFERENCES
Working day ${workStart} to ${workEnd}. Days off: ${free || 'none'}. On days off only habits and rest, no work blocks.
Valid ritualId values: ${rituals.map(r => `"${r.id}" (${r.name})`).join(', ') || 'none'}.

TASK
Draft the week as time blocks per day, all seven days (${dates.join(', ')}).
- Each priority gets at least two deep work blocks of 90 to 120 minutes, early in the day, spread across the week. Priority 0 starts on Monday.
- Calendar events are fixed: plan around them and include them as kind "event".
- Success habits on their planned days as kind "ritual" with ritualId. Keep them, also on days off.
- Maximum five blocks on a working day, maximum three on a day off. Leave air between blocks. Nothing after 20:00.
- Tuesday and Thursday each get one "admin" block of 45 minutes for small things and mail.
- intention per day: one sentence, second person, declarative, no exclamation marks.
- note: one paragraph (60 words maximum) on why this week holds, naming the revenue gap or the cycle when relevant.
- drop: one sentence on what she is not doing this week.

ANSWER AS JSON
{"days":[{"date":"yyyy-MM-dd","intention":"...","blocks":[{"start":"HH:mm","end":"HH:mm","title":"...","kind":"priority|ritual|event|admin|rest","priorityIndex":0,"ritualId":"..."}]}],"note":"...","drop":"..."}`

  const text = await askClaude({ system: STUDIO_SYSTEM, user, model: 'sonnet', maxTokens: 6000 })
  const draft = extractJSON<DraftWeek>(text)
  const days: Record<string, DayPlan> = {}
  for (const date of dates) {
    const d = draft.days?.find(x => x.date === date)
    days[date] = {
      date,
      intention: d?.intention ?? '',
      blocks: (d?.blocks ?? []).map(b => ({
        id: crypto.randomUUID(),
        start: b.start, end: b.end, title: b.title,
        kind: b.kind ?? 'other',
        priorityId: b.priorityIndex !== undefined ? pr[b.priorityIndex]?.id : undefined,
        ritualId: rituals.some(r => r.id === b.ritualId) ? b.ritualId : undefined,
        done: false,
      })).sort((a, b) => a.start.localeCompare(b.start)),
    }
  }
  return { days, note: draft.note ?? '', drop: draft.drop ?? '' }
}

// ── 3. Rebuild one day ────────────────────────────────────────────────

export interface DayReplan { intention: string; blocks: Block[] }

export async function replanDay(week: WeekPlan, date: string, reason: string, fromTime?: string): Promise<DayReplan> {
  const day = week.days[date]
  const rituals = useRitualStore.getState().rituals
  const pr = week.priorities
  const now = fromTime ?? new Date().toTimeString().slice(0, 5)
  const remaining = pr.filter(p => !p.done)
  const user = `${baseContext(week)}

PRIORITIES (index 0 to ${pr.length - 1})
${pr.map((p, i) => `${i}. ${p.title} (${p.done ? 'done' : 'open'})`).join('\n')}

CURRENT PLAN FOR ${fmtDay(date)} (${date})
${day?.blocks.map(b => `- ${b.start} to ${b.end} ${b.title} [${b.kind}]${b.done ? ' · done' : ''}`).join('\n') || '(empty)'}

It is now ${now}. What happened: ${reason || 'the day went differently than planned'}.
Valid ritualId values: ${rituals.map(r => `"${r.id}" (${r.name})`).join(', ') || 'none'}.

TASK
Rebuild the rest of today from ${now}, without guilt. Blocks already done stay (leave them out of your answer). From the open priorities (${remaining.map(p => p.title).join(', ') || 'none'}) choose at most one deep work block and keep habits and rest. If little time is left, choose one small thing and free the rest. Maximum four blocks.

ANSWER AS JSON
{"intention":"one sentence for the rest of the day","blocks":[{"start":"HH:mm","end":"HH:mm","title":"...","kind":"priority|ritual|admin|rest|other","priorityIndex":0,"ritualId":"..."}]}`

  const text = await askClaude({ system: STUDIO_SYSTEM, user, model: 'haiku', maxTokens: 1200 })
  const out = extractJSON<{ intention: string; blocks: { start: string; end: string; title: string; kind: Block['kind']; priorityIndex?: number; ritualId?: string }[] }>(text)
  const kept = (day?.blocks ?? []).filter(b => b.done || b.end <= now)
  const fresh: Block[] = (out.blocks ?? []).filter(b => b.start >= now).map(b => ({
    id: crypto.randomUUID(),
    start: b.start, end: b.end, title: b.title, kind: b.kind ?? 'other',
    priorityId: b.priorityIndex !== undefined ? pr[b.priorityIndex]?.id : undefined,
    ritualId: rituals.some(r => r.id === b.ritualId) ? b.ritualId : undefined,
    done: false,
  }))
  return { intention: out.intention ?? day?.intention ?? '', blocks: [...kept, ...fresh].sort((a, b) => a.start.localeCompare(b.start)) }
}

// ── 4. The Friday recap ───────────────────────────────────────────────

export async function writeRecap(week: WeekPlan): Promise<Recap> {
  const dates = weekDatesFromKey(week.key)
  const r = useRitualStore.getState()
  const rev = useRevenueStore.getState()
  const ritualScore = r.rituals.map(x => `${x.name}: ${r.weekCount(x.id, dates)}/${x.timesPerWeek}`).join(', ') || 'no rituals'
  const weekSales = rev.salesBetween(dates[0], dates[6])
  const doneBlocks = Object.values(week.days).flatMap(d => d.blocks).filter(b => b.done).length
  const totalBlocks = Object.values(week.days).flatMap(d => d.blocks).length

  const user = `${baseContext(week)}

THIS WEEK
Priorities: ${week.priorities.map(p => `${p.title} (${p.done ? 'done' : 'not done'})`).join('; ') || 'none'}
Habits kept: ${ritualScore}
Sales this week: ${weekSales.length ? weekSales.map(s => `${s.label} ${money(s.amount)}`).join(', ') : 'none'} · total ${money(rev.revenueBetween(dates[0], dates[6]))}
Blocks completed: ${doneBlocks} of ${totalBlocks}
What she chose not to do: ${week.dropSuggestion || week.review?.drops || '-'}

TASK
Write the recap of this week for a card she can share. Honest and warm: name what moved, what she protected, what she let lie. No money figures on the card (that stays private); "revenue moved" is allowed when true. Headline eight words maximum, declarative, ending with a full stop. Each list three items maximum, eight words each. nextWeekHint: one sentence that leads into Sunday.

ANSWER AS JSON
{"headline":"...","moved":["..."],"protected":["..."],"dropped":["..."],"nextWeekHint":"..."}`

  const text = await askClaude({ system: STUDIO_SYSTEM, user, model: 'sonnet', maxTokens: 900 })
  const out = extractJSON<Omit<Recap, 'generatedAt'>>(text)
  return {
    headline: out.headline ?? 'This week held.',
    moved: (out.moved ?? []).slice(0, 3),
    protected: (out.protected ?? []).slice(0, 3),
    dropped: (out.dropped ?? []).slice(0, 3),
    nextWeekHint: out.nextWeekHint ?? '',
    generatedAt: new Date().toISOString(),
  }
}

// Without the assistant: an honest recap from the data itself.
export function localRecap(week: WeekPlan): Recap {
  const dates = weekDatesFromKey(week.key)
  const r = useRitualStore.getState()
  const done = week.priorities.filter(p => p.done)
  const kept = r.rituals.filter(x => r.weekCount(x.id, dates) >= x.timesPerWeek)
  return {
    headline: done.length === week.priorities.length && done.length > 0 ? 'Three of three. They stand.' : done.length > 0 ? `${done.length} of ${week.priorities.length} moved.` : 'A week to learn from.',
    moved: done.map(p => p.title),
    protected: kept.map(x => x.name),
    dropped: week.dropSuggestion ? [week.dropSuggestion] : [],
    nextWeekHint: 'Sunday, your next session is ready.',
    generatedAt: new Date().toISOString(),
  }
}

export type { Priority }
