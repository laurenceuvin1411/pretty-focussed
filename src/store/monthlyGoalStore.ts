import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { scopedKey } from '../lib/workspace'

export type GoalSphere = 'personal' | 'professional'

export interface MonthlyGoal {
  id: string
  month: string        // YYYY-MM
  sphere: GoalSphere
  title: string
  done: boolean
  createdAt: string
}

interface MonthlyGoalStore {
  goals: MonthlyGoal[]
  addGoal: (month: string, sphere: GoalSphere, title: string) => void
  toggleGoal: (id: string) => void
  updateGoal: (id: string, title: string) => void
  deleteGoal: (id: string) => void
  moveGoal: (id: string, month: string) => void
}

export const useMonthlyGoalStore = create<MonthlyGoalStore>()(
  persist(
    (set) => ({
      goals: [],

      addGoal: (month, sphere, title) => set(s => ({
        goals: [...s.goals, {
          id: crypto.randomUUID(), month, sphere, title,
          done: false, createdAt: new Date().toISOString(),
        }],
      })),

      toggleGoal: (id) => set(s => ({
        goals: s.goals.map(g => g.id === id ? { ...g, done: !g.done } : g),
      })),

      updateGoal: (id, title) => set(s => ({
        goals: s.goals.map(g => g.id === id ? { ...g, title } : g),
      })),

      deleteGoal: (id) => set(s => ({ goals: s.goals.filter(g => g.id !== id) })),

      moveGoal: (id, month) => set(s => ({
        goals: s.goals.map(g => g.id === id ? { ...g, month } : g),
      })),
    }),
    { name: scopedKey('monthly-goals-v1') }
  )
)
