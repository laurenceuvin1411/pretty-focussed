import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { scopedKey } from '../lib/workspace'

// Eigen trainingsschema's en wedstrijden. Elke gebruiker bouwt hier
// haar eigen plan; niets is vastgezet in de code.

export interface PlanDay {
  id: string
  date: string          // YYYY-MM-DD
  title: string         // bv. "Loop intervallen"
  details: string
  done?: boolean
}

export interface TrainingPlan {
  id: string
  name: string          // bv. "1/8 Triathlon opbouw"
  raceId?: string       // gekoppelde wedstrijd
  days: PlanDay[]
  createdAt: string
}

export interface Race {
  id: string
  name: string          // bv. "1/8 Triathlon Oostende"
  date: string          // YYYY-MM-DD
  notes?: string
  result?: string       // ingevuld na afloop
  createdAt: string
}

interface SportsStore {
  plans: TrainingPlan[]
  races: Race[]
  activePlanId: string | null

  addPlan: (name: string, raceId?: string) => string
  updatePlan: (id: string, updates: Partial<Omit<TrainingPlan, 'id' | 'createdAt'>>) => void
  deletePlan: (id: string) => void
  setActivePlan: (id: string | null) => void

  addDay: (planId: string, day: Omit<PlanDay, 'id'>) => void
  updateDay: (planId: string, dayId: string, updates: Partial<Omit<PlanDay, 'id'>>) => void
  deleteDay: (planId: string, dayId: string) => void
  toggleDayDone: (planId: string, dayId: string) => void

  addRace: (name: string, date: string, notes?: string) => string
  updateRace: (id: string, updates: Partial<Omit<Race, 'id' | 'createdAt'>>) => void
  deleteRace: (id: string) => void
}

export const useSportsStore = create<SportsStore>()(
  persist(
    (set, get) => ({
      plans: [],
      races: [],
      activePlanId: null,

      addPlan: (name, raceId) => {
        const id = crypto.randomUUID()
        set(s => ({
          plans: [...s.plans, { id, name, raceId, days: [], createdAt: new Date().toISOString() }],
          activePlanId: s.activePlanId ?? id,
        }))
        return id
      },

      updatePlan: (id, updates) => set(s => ({
        plans: s.plans.map(p => p.id === id ? { ...p, ...updates } : p),
      })),

      deletePlan: (id) => set(s => ({
        plans: s.plans.filter(p => p.id !== id),
        activePlanId: s.activePlanId === id ? (s.plans.find(p => p.id !== id)?.id ?? null) : s.activePlanId,
      })),

      setActivePlan: (id) => set({ activePlanId: id }),

      addDay: (planId, day) => set(s => ({
        plans: s.plans.map(p => p.id === planId
          ? { ...p, days: [...p.days, { ...day, id: crypto.randomUUID() }].sort((a, b) => a.date.localeCompare(b.date)) }
          : p),
      })),

      updateDay: (planId, dayId, updates) => set(s => ({
        plans: s.plans.map(p => p.id === planId
          ? { ...p, days: p.days.map(d => d.id === dayId ? { ...d, ...updates } : d).sort((a, b) => a.date.localeCompare(b.date)) }
          : p),
      })),

      deleteDay: (planId, dayId) => set(s => ({
        plans: s.plans.map(p => p.id === planId ? { ...p, days: p.days.filter(d => d.id !== dayId) } : p),
      })),

      toggleDayDone: (planId, dayId) => set(s => ({
        plans: s.plans.map(p => p.id === planId
          ? { ...p, days: p.days.map(d => d.id === dayId ? { ...d, done: !d.done } : d) }
          : p),
      })),

      addRace: (name, date, notes) => {
        const id = crypto.randomUUID()
        set(s => ({ races: [...s.races, { id, name, date, notes, createdAt: new Date().toISOString() }].sort((a, b) => a.date.localeCompare(b.date)) }))
        return id
      },

      updateRace: (id, updates) => set(s => ({
        races: s.races.map(r => r.id === id ? { ...r, ...updates } : r).sort((a, b) => a.date.localeCompare(b.date)),
      })),

      deleteRace: (id) => set(s => ({
        races: s.races.filter(r => r.id !== id),
        plans: s.plans.map(p => p.raceId === id ? { ...p, raceId: undefined } : p),
      })),
    }),
    { name: scopedKey('sports-v1') }
  )
)

// ── Afgeleide helpers ────────────────────────────────────────────
const MONDAY_OFFSET = (d: Date) => (d.getDay() + 6) % 7

export function weekLabel(dateStr: string, planStart?: string): string {
  if (!planStart) return ''
  const start = new Date(planStart + 'T12:00:00')
  start.setDate(start.getDate() - MONDAY_OFFSET(start))
  const d = new Date(dateStr + 'T12:00:00')
  const weeks = Math.floor((d.getTime() - start.getTime()) / (7 * 86400000))
  return `Week ${weeks + 1}`
}

export function groupByWeek(days: PlanDay[]): [string, PlanDay[]][] {
  if (!days.length) return []
  const start = days[0].date
  const map = new Map<string, PlanDay[]>()
  for (const d of days) {
    const key = weekLabel(d.date, start)
    map.set(key, [...(map.get(key) ?? []), d])
  }
  return [...map.entries()]
}

export function nextRace(races: Race[], today: string): Race | undefined {
  return races.filter(r => r.date >= today).sort((a, b) => a.date.localeCompare(b.date))[0]
}
