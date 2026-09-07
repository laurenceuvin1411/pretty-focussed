import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { scopedKey } from '../lib/workspace'

export interface MonthRecord {
  month: string   // 'YYYY-MM'
  value: number
}

interface MonthlyResetStore {
  lastResetMonth: Record<string, string>                   // goalId → 'YYYY-MM'
  history: Record<string, MonthRecord[]>                   // goalId → past months
  markReset: (goalId: string, month: string, prevValue: number) => void
  getHistory: (goalId: string) => MonthRecord[]
}

export const useMonthlyResetStore = create<MonthlyResetStore>()(
  persist(
    (set, get) => ({
      lastResetMonth: {},
      history: {},

      markReset: (goalId, month, prevValue) =>
        set(s => ({
          lastResetMonth: { ...s.lastResetMonth, [goalId]: month },
          history: {
            ...s.history,
            [goalId]: [
              ...(s.history[goalId] ?? []).slice(-11),  // keep last 12 months
              { month, value: prevValue },
            ],
          },
        })),

      getHistory: (goalId) => get().history[goalId] ?? [],
    }),
    { name: scopedKey('monthly-reset-v1') }
  )
)
