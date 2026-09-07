import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type WorkoutType = 'strength' | 'cardio' | 'yoga' | 'walk' | 'run' | 'cycle' | 'swim' | 'sport' | 'rest'

export interface DailyHealthLog {
  date: string              // 'yyyy-MM-dd'
  sleepHours: number        // 0–12
  sleepQuality: number      // 1–5 (1=terrible, 5=perfect)
  workout: boolean
  workoutType?: WorkoutType
  workoutMinutes?: number
  steps: number
  waterGlasses: number      // target: 8
  energyLevel: number       // 1–10 (self-reported morning energy)
  stressLevel: number       // 1–10 (1=no stress, 10=overwhelmed)
  mood: number              // 1–10
  weight?: number           // kg, optional
  notes?: string
}

export const WORKOUT_LABEL: Record<WorkoutType, string> = {
  strength: 'Krachttraining',
  cardio:   'Cardio',
  yoga:     'Yoga',
  walk:     'Wandelen',
  run:      'Lopen',
  cycle:    'Fietsen',
  swim:     'Zwemmen',
  sport:    'Sport',
  rest:     'Rust',
}

export const WORKOUT_EMOJI: Record<WorkoutType, string> = {
  strength: '🏋️',
  cardio:   '🫀',
  yoga:     '🧘',
  walk:     '🚶',
  run:      '🏃',
  cycle:    '🚴',
  swim:     '🏊',
  sport:    '⚽',
  rest:     '😴',
}

function emptyLog(date: string): DailyHealthLog {
  return {
    date,
    sleepHours: 0,
    sleepQuality: 3,
    workout: false,
    steps: 0,
    waterGlasses: 0,
    energyLevel: 5,
    stressLevel: 3,
    mood: 7,
  }
}

interface HealthStore {
  logs: DailyHealthLog[]
  getLog: (date: string) => DailyHealthLog
  upsertLog: (date: string, updates: Partial<DailyHealthLog>) => void
  getWeekAvg: (endDate: string, days?: number) => {
    avgSleep: number
    avgEnergy: number
    avgStress: number
    avgMood: number
    workoutDays: number
    avgSteps: number
    avgWater: number
  }
  // Health score 0–100 for a given date
  getDayScore: (date: string) => number
}

export const useHealthStore = create<HealthStore>()(
  persist(
    (set, get) => ({
      logs: [],

      getLog: (date) => {
        return get().logs.find(l => l.date === date) ?? emptyLog(date)
      },

      upsertLog: (date, updates) => {
        set(s => {
          const existing = s.logs.find(l => l.date === date)
          if (existing) {
            return { logs: s.logs.map(l => l.date === date ? { ...l, ...updates } : l) }
          }
          return { logs: [...s.logs, { ...emptyLog(date), ...updates }] }
        })
      },

      getWeekAvg: (endDate, days = 7) => {
        const end = new Date(endDate)
        const logs: DailyHealthLog[] = []
        for (let i = 0; i < days; i++) {
          const d = new Date(end)
          d.setDate(d.getDate() - i)
          const dateStr = d.toISOString().split('T')[0]
          const log = get().logs.find(l => l.date === dateStr)
          if (log) logs.push(log)
        }
        if (!logs.length) return { avgSleep: 0, avgEnergy: 0, avgStress: 0, avgMood: 0, workoutDays: 0, avgSteps: 0, avgWater: 0 }
        const n = logs.length
        return {
          avgSleep:    Math.round((logs.reduce((s, l) => s + l.sleepHours, 0) / n) * 10) / 10,
          avgEnergy:   Math.round((logs.reduce((s, l) => s + l.energyLevel, 0) / n) * 10) / 10,
          avgStress:   Math.round((logs.reduce((s, l) => s + l.stressLevel, 0) / n) * 10) / 10,
          avgMood:     Math.round((logs.reduce((s, l) => s + l.mood, 0) / n) * 10) / 10,
          workoutDays: logs.filter(l => l.workout).length,
          avgSteps:    Math.round(logs.reduce((s, l) => s + l.steps, 0) / n),
          avgWater:    Math.round((logs.reduce((s, l) => s + l.waterGlasses, 0) / n) * 10) / 10,
        }
      },

      getDayScore: (date) => {
        const log = get().logs.find(l => l.date === date)
        if (!log) return 0

        // Sleep: optimal 7-9h = 100, <5h or >10h = 20
        const sleepScore = log.sleepHours >= 7 && log.sleepHours <= 9 ? 100
          : log.sleepHours >= 6 ? 75
          : log.sleepHours >= 5 ? 45
          : log.sleepHours > 0 ? 20 : 0

        // Energy: 1–10 → 0–100
        const energyScore = (log.energyLevel / 10) * 100

        // Workout: yes = 100, no = 40 (rest days are OK)
        const workoutScore = log.workout ? 100 : 40

        // Stress: inverted, 1=low stress=good
        const stressScore = Math.max(0, 100 - (log.stressLevel - 1) * 11)

        // Water: 8 glasses = 100
        const waterScore = Math.min(100, (log.waterGlasses / 8) * 100)

        // Weighted
        return Math.round(
          sleepScore   * 0.30 +
          energyScore  * 0.25 +
          workoutScore * 0.20 +
          stressScore  * 0.15 +
          waterScore   * 0.10
        )
      },
    }),
    {
      name: 'health-store-v1',
      partialize: (s) => ({ logs: s.logs }),
    }
  )
)
