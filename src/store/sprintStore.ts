import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { scopedKey } from '../lib/workspace'

export type TaskPriority = 'critical' | 'high' | 'medium'
export type TaskEnergy = 'deep' | 'medium' | 'light'
export type TaskCategory = 'sales' | 'content' | 'admin' | 'workout' | 'deep-work' | 'meetings' | 'personal' | 'learning'

export interface SprintTask {
  id: string
  title: string
  duration: number
  priority: TaskPriority
  energy: TaskEnergy
  reason: string
  category: TaskCategory
  completed: boolean
}

export interface DailyPlan {
  date: string
  mission: string
  top3: SprintTask[]
  coachInsight: string
  generatedAt: string
}

export interface WeekPlan {
  weekNumber: number
  theme: string
  focus: string
  milestones: string[]
}

export interface MonthOutcome {
  title: string
  focus: string
  keyResults: string[]
}

export interface SprintRoadmap {
  months: [MonthOutcome, MonthOutcome, MonthOutcome]
  weeks: WeekPlan[]
  kpiTargets: Record<string, number>
  initialCoachNote: string
}

export interface Sprint {
  id: string
  goal: string
  goalContext: string
  targetValue?: number
  targetUnit?: string
  currentValue?: number
  startDate: string
  endDate: string
  roadmap: SprintRoadmap | null
  dailyPlans: Record<string, DailyPlan>
  completedDates: string[]
  status: 'setup' | 'active' | 'completed'
  createdAt: string
}

interface SprintStore {
  sprints: Sprint[]
  activeSprint: () => Sprint | undefined
  createSprint: (goal: string, goalContext: string, targetValue?: number, targetUnit?: string) => string
  setRoadmap: (sprintId: string, roadmap: SprintRoadmap) => void
  activateSprint: (sprintId: string) => void
  setDailyPlan: (sprintId: string, plan: DailyPlan) => void
  completeTask: (sprintId: string, date: string, taskId: string) => void
  markDayComplete: (sprintId: string, date: string) => void
  updateCurrentValue: (sprintId: string, value: number) => void
  archiveSprint: (sprintId: string) => void
}

function addDays(date: string, days: number): string {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d.toISOString().split('T')[0]
}

export const useSprintStore = create<SprintStore>()(
  persist(
    (set, get) => ({
      sprints: [],

      activeSprint: () => get().sprints.find(s => s.status === 'active'),

      createSprint: (goal, goalContext, targetValue, targetUnit) => {
        const id = crypto.randomUUID()
        const startDate = new Date().toISOString().split('T')[0]
        const endDate = addDays(startDate, 89)
        const sprint: Sprint = {
          id, goal, goalContext, targetValue, targetUnit,
          startDate, endDate,
          roadmap: null,
          dailyPlans: {},
          completedDates: [],
          status: 'setup',
          createdAt: new Date().toISOString(),
        }
        set(s => ({ sprints: [...s.sprints, sprint] }))
        return id
      },

      setRoadmap: (sprintId, roadmap) => set(s => ({
        sprints: s.sprints.map(sp => sp.id === sprintId ? { ...sp, roadmap } : sp),
      })),

      activateSprint: (sprintId) => set(s => ({
        sprints: s.sprints.map(sp =>
          sp.id === sprintId ? { ...sp, status: 'active' }
          : sp.status === 'active' ? { ...sp, status: 'completed' }
          : sp
        ),
      })),

      setDailyPlan: (sprintId, plan) => set(s => ({
        sprints: s.sprints.map(sp =>
          sp.id === sprintId
            ? { ...sp, dailyPlans: { ...sp.dailyPlans, [plan.date]: plan } }
            : sp
        ),
      })),

      completeTask: (sprintId, date, taskId) => set(s => ({
        sprints: s.sprints.map(sp => {
          if (sp.id !== sprintId) return sp
          const plan = sp.dailyPlans[date]
          if (!plan) return sp
          return {
            ...sp,
            dailyPlans: {
              ...sp.dailyPlans,
              [date]: {
                ...plan,
                top3: plan.top3.map(t => t.id === taskId ? { ...t, completed: true } : t),
              },
            },
          }
        }),
      })),

      markDayComplete: (sprintId, date) => set(s => ({
        sprints: s.sprints.map(sp =>
          sp.id === sprintId && !sp.completedDates.includes(date)
            ? { ...sp, completedDates: [...sp.completedDates, date] }
            : sp
        ),
      })),

      updateCurrentValue: (sprintId, value) => set(s => ({
        sprints: s.sprints.map(sp => sp.id === sprintId ? { ...sp, currentValue: value } : sp),
      })),

      archiveSprint: (sprintId) => set(s => ({
        sprints: s.sprints.map(sp => sp.id === sprintId ? { ...sp, status: 'completed' } : sp),
      })),
    }),
    { name: scopedKey('sprint-v1') }
  )
)
