import { create } from 'zustand'
import type { Task } from '../types'
import { seedTasks } from '../utils/seedData'
import { format, endOfWeek } from 'date-fns'
import { supabase } from '../lib/supabase'
import { showSaved } from '../components/SaveToast'

interface TaskStore {
  tasks: Task[]
  hydrate: (tasks: Task[]) => void
  addTask: (task: Omit<Task, 'id' | 'createdAt'>) => Promise<void>
  updateTask: (id: string, updates: Partial<Task>) => Promise<void>
  deleteTask: (id: string) => Promise<void>
  toggleTask: (id: string) => Promise<void>
  getTasksForDate: (date: string) => Task[]
  getTasksForWeek: (weekStart: string) => Task[]
  getNeedleMovers: () => Task[]
  getOverdueTasks: () => Task[]
}

function toRow(t: Task, userId: string) {
  return {
    id: t.id, user_id: userId,
    title: t.title, description: t.description ?? null,
    business: t.business, category: t.category,
    priority: t.priority, needle_mover: t.needleMover,
    status: t.status, due_date: t.dueDate ?? null,
    scheduled_date: t.scheduledDate ?? null,
    estimated_minutes: t.estimatedMinutes ?? null,
    completed_at: t.completedAt ?? null,
    created_at: t.createdAt, tags: t.tags,
  }
}

export const useTaskStore = create<TaskStore>((set, get) => ({
  tasks: [],

  hydrate: (tasks) => set({ tasks }),

  addTask: async (task) => {
    const id = crypto.randomUUID()
    const createdAt = new Date().toISOString()
    const full: Task = { ...task, id, createdAt }
    set(s => ({ tasks: [...s.tasks, full] }))
    const { data: { session } } = await supabase.auth.getSession()
    const userId = session?.user?.id
    if (!userId) return
    await supabase.from('tasks').insert(toRow(full, userId))
  },

  updateTask: async (id, updates) => {
    set(s => ({ tasks: s.tasks.map(t => t.id === id ? { ...t, ...updates } : t) }))
    const task = get().tasks.find(t => t.id === id)
    if (!task) return
    // Omit id and user_id — RLS handles auth, no need to re-assert them
    const { id: _id, user_id: _uid, ...row } = toRow(task, '')
    const { error } = await supabase.from('tasks').update(row).eq('id', id)
    if (!error) showSaved()
  },

  deleteTask: async (id) => {
    set(s => ({ tasks: s.tasks.filter(t => t.id !== id) }))
    await supabase.from('tasks').delete().eq('id', id)
  },

  toggleTask: async (id) => {
    const task = get().tasks.find(t => t.id === id)
    if (!task) return
    const done = task.status === 'done'
    const updates: Partial<Task> = {
      status: done ? 'today' : 'done',
      completedAt: done ? undefined : new Date().toISOString(),
    }
    set(s => ({ tasks: s.tasks.map(t => t.id === id ? { ...t, ...updates } : t) }))
    const { error } = await supabase.from('tasks').update({
      status: updates.status,
      completed_at: updates.completedAt ?? null,
    }).eq('id', id)
    if (!error) showSaved(updates.status === 'done' ? 'Taak afgevinkt' : 'Taak heropend')
  },

  getTasksForDate: (date) => get().tasks.filter(t => t.dueDate === date || t.scheduledDate === date),

  getTasksForWeek: (weekStart) => {
    const start = new Date(weekStart)
    const end = endOfWeek(start, { weekStartsOn: 1 })
    return get().tasks.filter(t => {
      const d = t.dueDate || t.scheduledDate
      if (!d) return false
      const dt = new Date(d)
      return dt >= start && dt <= end
    })
  },

  getNeedleMovers: () => get().tasks.filter(t => t.needleMover && t.status !== 'done' && t.status !== 'cancelled'),

  getOverdueTasks: () => {
    const today = format(new Date(), 'yyyy-MM-dd')
    return get().tasks.filter(t => t.dueDate && t.dueDate < today && t.status !== 'done' && t.status !== 'cancelled')
  },
}))

export async function seedTasksIfEmpty(userId: string) {
  const { data } = await supabase.from('tasks').select('id').eq('user_id', userId).limit(1)
  if (data && data.length > 0) return
  const rows = seedTasks.map(t => ({
    id: t.id, user_id: userId,
    title: t.title, description: t.description ?? null,
    business: t.business, category: t.category,
    priority: t.priority, needle_mover: t.needleMover,
    status: t.status, due_date: t.dueDate ?? null,
    scheduled_date: t.scheduledDate ?? null,
    estimated_minutes: t.estimatedMinutes ?? null,
    completed_at: t.completedAt ?? null,
    created_at: t.createdAt, tags: t.tags,
  }))
  await supabase.from('tasks').insert(rows)
}
