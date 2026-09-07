import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { scopedKey } from '../lib/workspace'

export type SportType = 'strength' | 'run' | 'cycle' | 'swim' | 'triathlon' | 'cardio' | 'yoga' | 'walk' | 'sport' | 'rest' | 'off'

export interface TrainingDay {
  day: number         // 0=Mon ... 6=Sun
  sport: SportType
  label: string       // e.g. "Upper Body Kracht"
  durationMin: number
  notes?: string
}

export interface Competition {
  id: string
  name: string
  date: string        // 'yyyy-MM-dd'
  sport: SportType
  location?: string
  distance?: string   // e.g. "21.1 km"
  goal?: string       // e.g. "Sub 1:45"
  result?: string     // filled in after
}

export const SPORT_LABEL: Record<SportType, string> = {
  strength: 'Krachttraining',
  run:      'Lopen',
  cycle:    'Fietsen',
  swim:     'Zwemmen',
  triathlon: 'Triathlon',
  cardio:   'Cardio',
  yoga:     'Yoga',
  walk:     'Wandelen',
  sport:    'Sport',
  rest:     'Herstel',
  off:      'Vrij',
}

export const SPORT_EMOJI: Record<SportType, string> = {
  strength: '🏋️',
  run:      '🏃',
  cycle:    '🚴',
  swim:     '🏊',
  triathlon: '🏅',
  cardio:   '🫀',
  yoga:     '🧘',
  walk:     '🚶',
  sport:    '⚽',
  rest:     '😴',
  off:      '—',
}

export const SPORT_COLOR: Record<SportType, string> = {
  strength: '#7C7F84',
  run:      '#7C7F84',
  cycle:    '#7C7F84',
  swim:     '#7C7F84',
  triathlon: '#7C7F84',
  cardio:   '#7C7F84',
  yoga:     '#7C7F84',
  walk:     '#7C7F84',
  sport:    '#7C7F84',
  rest:     '#3C3E42',
  off:      '#3C3E42',
}

const DEFAULT_SCHEDULE: TrainingDay[] = [
  { day: 0, sport: 'strength', label: 'Upper Body Kracht',    durationMin: 60 },
  { day: 1, sport: 'run',      label: 'Easy Run',              durationMin: 45 },
  { day: 2, sport: 'strength', label: 'Lower Body Kracht',    durationMin: 60 },
  { day: 3, sport: 'rest',     label: 'Actief Herstel',        durationMin: 30 },
  { day: 4, sport: 'run',      label: 'Tempo Run',             durationMin: 50 },
  { day: 5, sport: 'strength', label: 'Full Body',             durationMin: 60 },
  { day: 6, sport: 'off',      label: 'Vrij',                  durationMin: 0  },
]

interface TrainingStore {
  schedule: TrainingDay[]
  competitions: Competition[]
  updateDay: (day: number, updates: Partial<TrainingDay>) => void
  addCompetition: (c: Omit<Competition, 'id'>) => void
  updateCompetition: (id: string, updates: Partial<Competition>) => void
  deleteCompetition: (id: string) => void
}

export const useTrainingStore = create<TrainingStore>()(
  persist(
    (set) => ({
      schedule: DEFAULT_SCHEDULE,
      competitions: [],

      updateDay: (day, updates) =>
        set(s => ({ schedule: s.schedule.map(d => d.day === day ? { ...d, ...updates } : d) })),

      addCompetition: (c) =>
        set(s => ({ competitions: [...s.competitions, { ...c, id: crypto.randomUUID() }] })),

      updateCompetition: (id, updates) =>
        set(s => ({ competitions: s.competitions.map(c => c.id === id ? { ...c, ...updates } : c) })),

      deleteCompetition: (id) =>
        set(s => ({ competitions: s.competitions.filter(c => c.id !== id) })),
    }),
    { name: scopedKey('training-store-v1') }
  )
)
