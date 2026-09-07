import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { scopedKey } from '../lib/workspace'

export const PROTOCOL_START = '2026-06-24'

export type DoseKey = 'morning' | 'evening' | 'nightcream'

export interface ProtocolDay {
  phase: 'notstarted' | 'phase1' | 'phase2' | 'done'
  weekNum: number   // 1-6 in phase1, 7-12 in phase2
  dayNum: number    // 0-based from start
  required: DoseKey[]
  nightcreamGoalPerWeek: number
}

export function getProtocolDay(dateStr: string): ProtocolDay {
  const start = new Date(PROTOCOL_START + 'T00:00:00')
  const d = new Date(dateStr + 'T00:00:00')
  const dayNum = Math.round((d.getTime() - start.getTime()) / 86400000)

  if (dayNum < 0) return { phase: 'notstarted', weekNum: 0, dayNum, required: [], nightcreamGoalPerWeek: 2 }
  if (dayNum <= 41) return {
    phase: 'phase1',
    weekNum: Math.floor(dayNum / 7) + 1,
    dayNum,
    required: ['morning', 'evening', 'nightcream'],
    nightcreamGoalPerWeek: 2,
  }
  if (dayNum <= 83) return {
    phase: 'phase2',
    weekNum: Math.floor(dayNum / 7) + 1,
    dayNum,
    required: ['morning'],
    nightcreamGoalPerWeek: 0,
  }
  return { phase: 'done', weekNum: 12, dayNum, required: [], nightcreamGoalPerWeek: 0 }
}

// Returns Mon–Sun week containing a given date (yyyy-MM-dd)
export function getWeekDates(dateStr: string): string[] {
  const d = new Date(dateStr + 'T12:00:00')
  const day = d.getDay() === 0 ? 6 : d.getDay() - 1 // Mon=0
  const mon = new Date(d)
  mon.setDate(d.getDate() - day)
  return Array.from({ length: 7 }, (_, i) => {
    const x = new Date(mon)
    x.setDate(mon.getDate() + i)
    return x.toISOString().split('T')[0]
  })
}

interface SkinProtocolState {
  logs: Record<string, DoseKey[]>  // date -> doses taken
  toggleDose: (date: string, dose: DoseKey) => void
}

export const useSkinProtocolStore = create<SkinProtocolState>()(
  persist(
    (set) => ({
      logs: {},
      toggleDose: (date, dose) => set(s => {
        const current = s.logs[date] ?? []
        const next = current.includes(dose)
          ? current.filter(d => d !== dose)
          : [...current, dose]
        return { logs: { ...s.logs, [date]: next } }
      }),
    }),
    { name: scopedKey('skin-protocol-v1') }
  )
)
