// Her room. She picks the ground; the instrument never changes.
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { scopedKey } from '../lib/workspace'

export type Ground = 'plaster' | 'travertine' | 'field' | 'air'

export const GROUNDS: { id: Ground; name: string; rest: string; note: string }[] = [
  { id: 'plaster',    name: 'Plaster',    rest: '#F4F2EE', note: 'Bone, unchanged. The room the brand was built in.' },
  { id: 'travertine', name: 'Travertine', rest: '#F0E7DB', note: 'The warmest. Sits naturally beside skin and print.' },
  { id: 'field',      name: 'Field',      rest: '#E9EFE2', note: 'A sage-tinted room, held well under the instrument.' },
  { id: 'air',        name: 'Air',        rest: '#E4EDF5', note: 'North light in a white room.' },
]

interface SettingsStore {
  ground: Ground
  setGround: (g: Ground) => void
  workStart: string
  workEnd: string
  freeDays: number[]
  setHours: (start: string, end: string) => void
  setFreeDays: (days: number[]) => void
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      ground: 'plaster',
      setGround: (ground) => set({ ground }),
      workStart: '09:00',
      workEnd: '17:30',
      freeDays: [5, 6],
      setHours: (workStart, workEnd) => set({ workStart, workEnd }),
      setFreeDays: (freeDays) => set({ freeDays: [...new Set(freeDays)].sort() }),
    }),
    { name: scopedKey('pf-settings-v1') }
  )
)
