import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { scopedKey } from '../lib/workspace'

export type TeamPriority = 'urgent' | 'week' | 'later'

export interface TeamTask {
  id: string
  title: string
  deadline?: string  // 'yyyy-MM-dd'
  priority: TeamPriority
  done: boolean
  notes?: string
}

interface TeamStore {
  tasks: TeamTask[]
  addTask: (task: Omit<TeamTask, 'id' | 'done'>) => void
  updateTask: (id: string, updates: Partial<TeamTask>) => void
  deleteTask: (id: string) => void
  toggleTask: (id: string) => void
  clearDone: () => void
}

export const useTeamStore = create<TeamStore>()(
  persist(
    (set) => ({
      tasks: [],
      addTask: (task) =>
        set(s => ({ tasks: [...s.tasks, { ...task, id: crypto.randomUUID(), done: false }] })),
      updateTask: (id, updates) =>
        set(s => ({ tasks: s.tasks.map(t => t.id === id ? { ...t, ...updates } : t) })),
      deleteTask: (id) =>
        set(s => ({ tasks: s.tasks.filter(t => t.id !== id) })),
      toggleTask: (id) =>
        set(s => ({ tasks: s.tasks.map(t => t.id === id ? { ...t, done: !t.done } : t) })),
      clearDone: () =>
        set(s => ({ tasks: s.tasks.filter(t => !t.done) })),
    }),
    { name: scopedKey('team-tasks-v1') }
  )
)
