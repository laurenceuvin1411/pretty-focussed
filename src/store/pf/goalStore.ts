// 90-dagen doelen in twee banen: business en leven. Maximum drie per baan per kwartaal.
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { scopedKey } from '../../lib/workspace'
import { quarterKey } from '../../lib/pf/week'

export type Lane = 'business' | 'life'
export const LANE_LABEL: Record<Lane, string> = { business: 'Business', life: 'Life' }
export const MAX_PER_LANE = 3

export interface Goal90 {
  id: string
  quarter: string       // '2026-Q3'
  lane: Lane
  title: string
  why?: string          // waarom dit doel, in haar woorden
  measure?: string      // hoe ze weet dat het gelukt is
  target?: number       // optioneel meetbaar: doelwaarde
  current?: number      // optioneel meetbaar: huidige waarde
  unit?: string         // bv. 'klanten', 'km', 'euro'
  yearId?: string       // the year outcome this goal serves
  milestones: string[]  // drie tot vier stappen, mag leeg
  done: boolean
  createdAt: string
}

interface GoalStore {
  goals: Goal90[]
  addGoal: (lane: Lane, title: string, extra?: Partial<Goal90>) => string | null
  updateGoal: (id: string, patch: Partial<Goal90>) => void
  deleteGoal: (id: string) => void
  toggleDone: (id: string) => void
  setProgress: (id: string, current: number) => void
  goalsFor: (quarter?: string, lane?: Lane) => Goal90[]
}

export const useGoalStore = create<GoalStore>()(
  persist(
    (set, get) => ({
      goals: [],

      addGoal: (lane, title, extra = {}) => {
        const quarter = extra.quarter ?? quarterKey()
        const inLane = get().goals.filter(g => g.quarter === quarter && g.lane === lane)
        if (inLane.length >= MAX_PER_LANE) return null
        const id = crypto.randomUUID()
        set(s => ({
          goals: [...s.goals, {
            id, quarter, lane, title: title.trim(),
            milestones: [], done: false, createdAt: new Date().toISOString(),
            ...extra,
          }],
        }))
        return id
      },

      updateGoal: (id, patch) => set(s => ({
        goals: s.goals.map(g => g.id === id ? { ...g, ...patch } : g),
      })),

      deleteGoal: (id) => set(s => ({ goals: s.goals.filter(g => g.id !== id) })),

      toggleDone: (id) => set(s => ({
        goals: s.goals.map(g => g.id === id ? { ...g, done: !g.done } : g),
      })),

      setProgress: (id, current) => set(s => ({
        goals: s.goals.map(g => g.id === id ? { ...g, current } : g),
      })),

      goalsFor: (quarter = quarterKey(), lane) =>
        get().goals.filter(g => g.quarter === quarter && (!lane || g.lane === lane)),
    }),
    { name: scopedKey('pf-goals-v1') }
  )
)

export function goalProgress(g: Goal90): number | null {
  if (g.done) return 100
  if (g.target && g.target > 0) return Math.min(100, Math.round(((g.current ?? 0) / g.target) * 100))
  return null
}
