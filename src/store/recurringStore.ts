import { create } from 'zustand'
import type { RecurringTask } from '../types'
import { supabase } from '../lib/supabase'

const seedRecurring: RecurringTask[] = [
  { id: 'r1', title: 'Mealprep', business: 'personal', category: 'health', priority: 2, needleMover: false, frequency: 'weekly', days: [0, 3], active: true, estimatedMinutes: 90, tags: ['mealprep'] },
  { id: 'r2', title: 'Gym', business: 'personal', category: 'health', priority: 2, needleMover: false, frequency: 'weekly', days: [1, 4], active: true, estimatedMinutes: 75, tags: ['gym', 'training'] },
  { id: 'r3', title: 'Zwemmen of lopen', business: 'personal', category: 'health', priority: 2, needleMover: false, frequency: 'weekly', days: [2], active: true, estimatedMinutes: 60, tags: ['cardio', 'training'] },
  { id: 'r4', title: 'Sales gesprekken voeren + leads opvolgen', business: 'ceo-lifestyle', category: 'revenue', priority: 1, needleMover: true, frequency: 'weekly', days: [1, 2, 3, 4, 5], active: true, estimatedMinutes: 60, tags: ['sales', 'outreach'] },
  { id: 'r5', title: 'Finance & boekhouding', business: 'ceo-lifestyle', category: 'finance', priority: 2, needleMover: false, frequency: 'weekly', days: [5], active: true, estimatedMinutes: 45, tags: ['finance', 'admin'] },
  { id: 'r6', title: 'Bora coworking backup (8u–17u)', business: 'bora', category: 'operations', priority: 1, needleMover: false, frequency: 'weekly', days: [2, 4], active: true, estimatedMinutes: 540, tags: ['bora', 'backup'] },
]

function toDbRow(r: RecurringTask, userId?: string) {
  const base = {
    title: r.title, business: r.business, category: r.category,
    priority: r.priority, needle_mover: r.needleMover,
    frequency: r.frequency, days: r.days,
    monthly_day: r.monthlyDay ?? null,
    active: r.active,
    estimated_minutes: r.estimatedMinutes ?? null, tags: r.tags,
  }
  return userId ? { id: r.id, user_id: userId, ...base } : base
}

interface RecurringStore {
  recurring: RecurringTask[]
  generatedDates: string[]
  hydrate: (recurring: RecurringTask[], generatedDates: string[]) => void
  addRecurring: (task: Omit<RecurringTask, 'id'>) => Promise<void>
  updateRecurring: (id: string, updates: Partial<RecurringTask>) => Promise<void>
  deleteRecurring: (id: string) => Promise<void>
  markDateGenerated: (date: string) => Promise<void>
  isDateGenerated: (date: string) => boolean
}

export const useRecurringStore = create<RecurringStore>((set, get) => ({
  recurring: [],
  generatedDates: [],

  hydrate: (recurring, generatedDates) => set({ recurring, generatedDates }),

  addRecurring: async (task) => {
    const id = crypto.randomUUID()
    set(s => ({ recurring: [...s.recurring, { ...task, id }] }))
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return
    await supabase.from('recurring_tasks').insert(toDbRow({ ...task, id }, session.user.id))
  },

  updateRecurring: async (id, updates) => {
    set(s => ({ recurring: s.recurring.map(r => r.id === id ? { ...r, ...updates } : r) }))
    const r = get().recurring.find(r => r.id === id); if (!r) return
    await supabase.from('recurring_tasks').update(toDbRow(r)).eq('id', id)
  },

  deleteRecurring: async (id) => {
    set(s => ({ recurring: s.recurring.filter(r => r.id !== id) }))
    await supabase.from('recurring_tasks').delete().eq('id', id)
  },

  markDateGenerated: async (date) => {
    set(s => ({ generatedDates: [...s.generatedDates.filter(d => d >= getKeepFrom()), date] }))
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return
    await supabase.from('recurring_generated_dates').upsert({ user_id: session.user.id, date })
  },

  isDateGenerated: (date) => get().generatedDates.includes(date),
}))

function getKeepFrom() {
  const d = new Date()
  d.setDate(d.getDate() - 14)
  return d.toISOString().split('T')[0]
}

export async function seedRecurringIfEmpty(userId: string) {
  const { data } = await supabase.from('recurring_tasks').select('id').eq('user_id', userId).limit(1)
  if (data && data.length > 0) return
  await supabase.from('recurring_tasks').insert(seedRecurring.map(r => toDbRow(r, userId)))
}
