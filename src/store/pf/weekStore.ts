// De week zelf: de Weekly Session (review, omzetcheck, drie prioriteiten, rituelen, gegenereerde week),
// de dagplannen voor Today, en de Friday recap.
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { scopedKey } from '../../lib/workspace'
import { weekKey, prevWeekKey, weekDatesFromKey } from '../../lib/pf/week'

export type BlockKind = 'priority' | 'ritual' | 'event' | 'admin' | 'rest' | 'other'

export interface Priority {
  id: string
  title: string
  goalId?: string
  why?: string         // korte reden van de assistent of van haarzelf
  done: boolean
}

export interface Block {
  id: string
  start: string        // 'HH:mm'
  end: string          // 'HH:mm'
  title: string
  kind: BlockKind
  priorityId?: string
  ritualId?: string
  done: boolean
}

export interface DayPlan {
  date: string
  intention?: string   // één zin voor de dag
  blocks: Block[]
  replannedAt?: string
}

export interface Review {
  wins: string
  drops: string        // wat ze laat vallen of loslaat
  lesson: string
  energy: number       // 1 tot 5
}

export interface Recap {
  headline: string
  moved: string[]      // wat bewoog deze week
  protected: string[]  // wat ze beschermde (rituelen, rust)
  dropped: string[]    // wat ze bewust liet liggen
  nextWeekHint: string
  generatedAt: string
}

export type WeekStatus = 'draft' | 'planned' | 'recapped'

export interface WeekPlan {
  key: string                            // '2026-W36'
  status: WeekStatus
  step: number                           // voortgang in de sessie, 0 tot 5
  review?: Review
  priorities: Priority[]                 // maximum drie
  ritualDays: Record<string, number[]>   // ritual-id -> dagen 0..6
  days: Record<string, DayPlan>          // 'yyyy-MM-dd' -> plan
  assistantNote?: string                 // één alinea van de assistent bij de gegenereerde week
  dropSuggestion?: string                // "dit mag je laten vallen"
  sessionStartedAt?: string
  sessionCompletedAt?: string
  recap?: Recap
}

export const MAX_PRIORITIES = 3

function emptyWeek(key: string): WeekPlan {
  return { key, status: 'draft', step: 0, priorities: [], ritualDays: {}, days: {} }
}

interface WeekStore {
  weeks: Record<string, WeekPlan>
  ensureWeek: (key?: string) => WeekPlan
  getWeek: (key?: string) => WeekPlan | undefined
  setStep: (key: string, step: number) => void
  startSession: (key: string) => void
  setReview: (key: string, review: Review) => void
  setPriorities: (key: string, priorities: Priority[]) => void
  togglePriority: (key: string, id: string) => void
  setRitualDays: (key: string, ritualId: string, days: number[]) => void
  setDays: (key: string, days: Record<string, DayPlan>, note?: string, drop?: string) => void
  replaceDay: (key: string, date: string, blocks: Block[], intention?: string) => void
  toggleBlock: (key: string, date: string, blockId: string) => void
  updateBlock: (key: string, date: string, blockId: string, patch: Partial<Block>) => void
  setIntention: (key: string, date: string, intention: string) => void
  completeSession: (key: string) => void
  setRecap: (key: string, recap: Recap) => void
  sessionStreak: () => number
  completedSessions: () => number
}

export const useWeekStore = create<WeekStore>()(
  persist(
    (set, get) => ({
      weeks: {},

      ensureWeek: (key = weekKey()) => {
        const existing = get().weeks[key]
        if (existing) return existing
        const w = emptyWeek(key)
        set(s => ({ weeks: { ...s.weeks, [key]: w } }))
        return w
      },

      getWeek: (key = weekKey()) => get().weeks[key],

      setStep: (key, step) => patch(set, key, () => ({ step })),

      startSession: (key) => patch(set, key, w => ({ sessionStartedAt: w.sessionStartedAt ?? new Date().toISOString(), step: Math.max(w.step, 1) })),

      setReview: (key, review) => patch(set, key, () => ({ review })),

      setPriorities: (key, priorities) => patch(set, key, () => ({ priorities: priorities.slice(0, MAX_PRIORITIES) })),

      togglePriority: (key, id) => patch(set, key, w => ({
        priorities: w.priorities.map(p => p.id === id ? { ...p, done: !p.done } : p),
      })),

      setRitualDays: (key, ritualId, days) => patch(set, key, w => ({
        ritualDays: { ...w.ritualDays, [ritualId]: [...new Set(days)].sort() },
      })),

      setDays: (key, days, note, drop) => patch(set, key, () => ({ days, assistantNote: note, dropSuggestion: drop })),

      replaceDay: (key, date, blocks, intention) => patch(set, key, w => ({
        days: { ...w.days, [date]: { date, intention: intention ?? w.days[date]?.intention, blocks, replannedAt: new Date().toISOString() } },
      })),

      toggleBlock: (key, date, blockId) => patch(set, key, w => {
        const day = w.days[date]
        if (!day) return {}
        return { days: { ...w.days, [date]: { ...day, blocks: day.blocks.map(b => b.id === blockId ? { ...b, done: !b.done } : b) } } }
      }),

      updateBlock: (key, date, blockId, bp) => patch(set, key, w => {
        const day = w.days[date]
        if (!day) return {}
        return { days: { ...w.days, [date]: { ...day, blocks: day.blocks.map(b => b.id === blockId ? { ...b, ...bp } : b) } } }
      }),

      setIntention: (key, date, intention) => patch(set, key, w => ({
        days: { ...w.days, [date]: { ...(w.days[date] ?? { date, blocks: [] }), intention } },
      })),

      completeSession: (key) => patch(set, key, () => ({ status: 'planned', step: 5, sessionCompletedAt: new Date().toISOString() })),

      setRecap: (key, recap) => patch(set, key, () => ({ recap, status: 'recapped' })),

      // Aantal opeenvolgende weken (tot en met deze of vorige week) met een afgeronde sessie.
      sessionStreak: () => {
        const weeks = get().weeks
        let key = weekKey()
        if (!weeks[key]?.sessionCompletedAt) key = prevWeekKey(key)
        let n = 0
        while (weeks[key]?.sessionCompletedAt) { n++; key = prevWeekKey(key) }
        return n
      },

      completedSessions: () => Object.values(get().weeks).filter(w => w.sessionCompletedAt).length,
    }),
    { name: scopedKey('pf-week-v1') }
  )
)

type Setter = (fn: (s: { weeks: Record<string, WeekPlan> }) => { weeks: Record<string, WeekPlan> }) => void
function patch(set: Setter, key: string, fn: (w: WeekPlan) => Partial<WeekPlan>) {
  set(s => {
    const w = s.weeks[key] ?? emptyWeek(key)
    return { weeks: { ...s.weeks, [key]: { ...w, ...fn(w) } } }
  })
}

// Hulpfunctie voor pagina's: de drie prioriteiten en het dagplan van vandaag.
export function todayPlan(week: WeekPlan | undefined, date: string): DayPlan | undefined {
  return week?.days[date]
}

export function weekDatesOf(week: WeekPlan): string[] {
  return weekDatesFromKey(week.key)
}
