// Focus over longer horizons: one word for the year, three outcomes per lane, one focus per month.
// The quarter goals live in goalStore and can serve a year outcome; a month picks which goals get it.
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { scopedKey } from '../../lib/workspace'
import type { Lane } from './goalStore'

export const MAX_OUTCOMES = 3

export interface YearOutcome {
  id: string
  year: string          // '2026'
  lane: Lane
  title: string
  done: boolean
  createdAt: string
}

export interface YearPlan { word?: string; line?: string; values?: string[]; who?: string }
export interface Obstacle { id: string; text: string; on: boolean; createdAt: string }
export interface MonthPlan { focus?: string; goalIds: string[] }

interface FocusStore {
  years: Record<string, YearPlan>
  outcomes: YearOutcome[]
  months: Record<string, MonthPlan>
  obstacles: Obstacle[]
  setObstacles: (o: Obstacle[]) => void
  setYear: (year: string, patch: Partial<YearPlan>) => void
  addOutcome: (year: string, lane: Lane, title: string) => string | null
  updateOutcome: (id: string, patch: Partial<YearOutcome>) => void
  deleteOutcome: (id: string) => void
  outcomesFor: (year: string, lane?: Lane) => YearOutcome[]
  setMonthFocus: (month: string, focus: string) => void
  toggleMonthGoal: (month: string, goalId: string) => void
}

export const useFocusStore = create<FocusStore>()(
  persist(
    (set, get) => ({
      years: {},
      outcomes: [],
      months: {},
      obstacles: [],
      setObstacles: (obstacles) => set({ obstacles }),

      setYear: (year, patch) => set(s => ({ years: { ...s.years, [year]: { ...s.years[year], ...patch } } })),

      addOutcome: (year, lane, title) => {
        const t = title.trim(); if (!t) return null
        if (get().outcomesFor(year, lane).length >= MAX_OUTCOMES) return null
        const id = crypto.randomUUID()
        set(s => ({ outcomes: [...s.outcomes, { id, year, lane, title: t, done: false, createdAt: new Date().toISOString() }] }))
        return id
      },
      updateOutcome: (id, patch) => set(s => ({ outcomes: s.outcomes.map(o => o.id === id ? { ...o, ...patch } : o) })),
      deleteOutcome: (id) => set(s => ({ outcomes: s.outcomes.filter(o => o.id !== id) })),
      outcomesFor: (year, lane) => get().outcomes.filter(o => o.year === year && (!lane || o.lane === lane)),

      setMonthFocus: (month, focus) => set(s => ({ months: { ...s.months, [month]: { goalIds: [], ...s.months[month], focus: focus.trim() || undefined } } })),
      toggleMonthGoal: (month, goalId) => set(s => {
        const m = s.months[month] ?? { goalIds: [] }
        const ids = m.goalIds.includes(goalId) ? m.goalIds.filter(x => x !== goalId) : [...m.goalIds, goalId]
        return { months: { ...s.months, [month]: { ...m, goalIds: ids } } }
      }),
    }),
    { name: scopedKey('pf-focus-v1') }
  )
)
