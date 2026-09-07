// Rituelen: maximum vijf, wekelijkse frequentie, optioneel cyclusbewust ingepland.
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { differenceInCalendarDays, parseISO } from 'date-fns'
import { scopedKey } from '../../lib/workspace'

export const MAX_RITUALS = 5

export type CyclePhase = 'menstrual' | 'follicular' | 'ovulatory' | 'luteal'
export const PHASE_LABEL: Record<CyclePhase, string> = {
  menstrual: 'Menstrual', follicular: 'Follicular', ovulatory: 'Ovulatory', luteal: 'Luteal',
}
// Wat elke fase vraagt van een weekplanning, in gewone taal.
export const PHASE_HINT: Record<CyclePhase, string> = {
  menstrual:  'Low energy. Rest and gentle movement. No launches.',
  follicular: 'Energy rising. New projects, thinking, hard training.',
  ovulatory:  'Peak. Visibility, conversations, sales, people.',
  luteal:     'Finishing. Details, admin, earlier nights.',
}

export interface Ritual {
  id: string
  name: string
  emoji: string
  timesPerWeek: number      // 1 tot 7
  preferredDays: number[]   // 0 = maandag ... 6 = zondag, mag leeg
  cycleAware: boolean       // laat de assistent dit ritueel schuiven met de cyclusfase
  createdAt: string
}

interface RitualStore {
  rituals: Ritual[]
  logs: Record<string, string[]>       // 'yyyy-MM-dd' -> ritual-ids
  cycleStart: string | null            // eerste dag van de laatste menstruatie
  cycleLength: number                  // dagen, standaard 28
  addRitual: (name: string, timesPerWeek: number, opts?: Partial<Ritual>) => string | null
  updateRitual: (id: string, patch: Partial<Ritual>) => void
  deleteRitual: (id: string) => void
  toggleLog: (ritualId: string, date: string) => void
  isDone: (ritualId: string, date: string) => boolean
  weekCount: (ritualId: string, dates: string[]) => number
  setCycle: (start: string | null, length?: number) => void
  phaseOn: (date: string) => CyclePhase | null
}

export const useRitualStore = create<RitualStore>()(
  persist(
    (set, get) => ({
      rituals: [],
      logs: {},
      cycleStart: null,
      cycleLength: 28,

      addRitual: (name, timesPerWeek, opts = {}) => {
        if (get().rituals.length >= MAX_RITUALS) return null
        const id = crypto.randomUUID()
        set(s => ({
          rituals: [...s.rituals, {
            id, name: name.trim(), emoji: opts.emoji ?? '✦',
            timesPerWeek: Math.min(7, Math.max(1, timesPerWeek)),
            preferredDays: opts.preferredDays ?? [],
            cycleAware: opts.cycleAware ?? false,
            createdAt: new Date().toISOString(),
          }],
        }))
        return id
      },

      updateRitual: (id, patch) => set(s => ({ rituals: s.rituals.map(r => r.id === id ? { ...r, ...patch } : r) })),

      deleteRitual: (id) => set(s => ({ rituals: s.rituals.filter(r => r.id !== id) })),

      toggleLog: (ritualId, date) => set(s => {
        const day = s.logs[date] ?? []
        const next = day.includes(ritualId) ? day.filter(x => x !== ritualId) : [...day, ritualId]
        return { logs: { ...s.logs, [date]: next } }
      }),

      isDone: (ritualId, date) => (get().logs[date] ?? []).includes(ritualId),

      weekCount: (ritualId, dates) => dates.filter(d => (get().logs[d] ?? []).includes(ritualId)).length,

      setCycle: (start, length) => set(s => ({ cycleStart: start, cycleLength: length ?? s.cycleLength })),

      phaseOn: (date) => {
        const { cycleStart, cycleLength } = get()
        if (!cycleStart) return null
        const diff = differenceInCalendarDays(parseISO(date), parseISO(cycleStart))
        const day = ((diff % cycleLength) + cycleLength) % cycleLength + 1
        if (day <= 5) return 'menstrual'
        if (day <= 13) return 'follicular'
        if (day <= 16) return 'ovulatory'
        return 'luteal'
      },
    }),
    { name: scopedKey('pf-rituals-v1') }
  )
)
