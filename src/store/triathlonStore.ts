import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { scopedKey } from '../lib/workspace'

interface DayOverride {
  training?: string
  details?: string
}

interface TriathlonStore {
  overrides: Record<string, DayOverride> // keyed by date 'yyyy-MM-dd'
  setOverride: (date: string, override: DayOverride) => void
  clearOverride: (date: string) => void
}

export const useTriathlonStore = create<TriathlonStore>()(
  persist(
    (set) => ({
      overrides: {},
      setOverride: (date, override) =>
        set(s => ({ overrides: { ...s.overrides, [date]: override } })),
      clearOverride: (date) =>
        set(s => {
          const { [date]: _, ...rest } = s.overrides
          return { overrides: rest }
        }),
    }),
    { name: scopedKey('triathlon-overrides-v1') }
  )
)
