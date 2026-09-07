import { create } from 'zustand'
import type { Habit, HabitLog } from '../types'
import { defaultHabits } from '../utils/seedData'
import { format, getDaysInMonth as getDays } from 'date-fns'
import { supabase } from '../lib/supabase'

interface HabitStore {
  habits: Habit[]
  logs: HabitLog[]
  hydrate: (habits: Habit[], logs: HabitLog[]) => void
  addHabit: (habit: Omit<Habit, 'id'>) => Promise<void>
  updateHabit: (id: string, updates: Partial<Omit<Habit, 'id'>>) => Promise<void>
  deleteHabit: (id: string) => Promise<void>
  toggleHabit: (habitId: string, date: string) => Promise<void>
  getLogForDate: (date: string) => HabitLog[]
  getDailyScore: (date: string) => number
  getMonthlyScore: (month: string) => number
  getPerfectDays: (month: string) => number
  getStreak: (habitId: string) => number
}

export const useHabitStore = create<HabitStore>((set, get) => ({
  habits: [],
  logs: [],

  hydrate: (habits, logs) => set({ habits, logs }),

  addHabit: async (habit) => {
    const id = crypto.randomUUID()
    set(s => ({ habits: [...s.habits, { ...habit, id }] }))
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return
    await supabase.from('habits').insert({
      id, user_id: session.user.id,
      name: habit.name, category: habit.category, icon: habit.icon,
      target_frequency: habit.targetFrequency, custom_days: habit.customDays,
      color: habit.color, order: habit.order, active: habit.active,
    })
  },

  updateHabit: async (id, updates) => {
    set(s => ({ habits: s.habits.map(h => h.id === id ? { ...h, ...updates } : h) }))
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return
    const h = { ...useHabitStore.getState().habits.find(h => h.id === id)! }
    await supabase.from('habits').update({
      name: h.name, category: h.category, icon: h.icon,
      target_frequency: h.targetFrequency, custom_days: h.customDays ?? null,
      color: h.color, order: h.order, active: h.active,
    }).eq('id', id)
  },

  deleteHabit: async (id) => {
    set(s => ({ habits: s.habits.filter(h => h.id !== id) }))
    await supabase.from('habits').delete().eq('id', id)
  },

  toggleHabit: async (habitId, date) => {
    const existing = get().logs.find(l => l.habitId === habitId && l.date === date)
    const newCompleted = existing ? !existing.completed : true

    if (existing) {
      set(s => ({ logs: s.logs.map(l => l.habitId === habitId && l.date === date ? { ...l, completed: newCompleted } : l) }))
    } else {
      set(s => ({ logs: [...s.logs, { date, habitId, completed: true }] }))
    }

    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return
    await supabase.from('habit_logs').upsert({
      user_id: session.user.id, habit_id: habitId, date, completed: newCompleted,
    }, { onConflict: 'user_id,habit_id,date' })
  },

  getLogForDate: (date) => get().logs.filter(l => l.date === date),

  getDailyScore: (date) => {
    const activeHabits = get().habits.filter(h => h.active)
    if (!activeHabits.length) return 0
    const done = get().logs.filter(l => l.date === date && l.completed).length
    return Math.round((done / activeHabits.length) * 100)
  },

  getMonthlyScore: (month) => {
    const [y, m] = month.split('-').map(Number)
    const days = getDays(new Date(y, m - 1))
    const activeHabits = get().habits.filter(h => h.active)
    if (!activeHabits.length || !days) return 0
    const total = activeHabits.length * days
    const done = get().logs.filter(l => l.date.startsWith(month) && l.completed).length
    return Math.round((done / total) * 100)
  },

  getPerfectDays: (month) => {
    const [y, m] = month.split('-').map(Number)
    const daysInMonth = new Date(y, m, 0).getDate()
    const activeHabits = get().habits.filter(h => h.active)
    let perfect = 0
    for (let day = 1; day <= daysInMonth; day++) {
      const date = format(new Date(y, m - 1, day), 'yyyy-MM-dd')
      const done = get().logs.filter(l => l.date === date && l.completed).length
      if (done === activeHabits.length && activeHabits.length > 0) perfect++
    }
    return perfect
  },

  getStreak: (habitId) => {
    const logs = get().logs.filter(l => l.habitId === habitId && l.completed)
    if (!logs.length) return 0
    const dates = logs.map(l => l.date).sort().reverse()
    let streak = 0
    const checkDate = new Date()
    for (const d of dates) {
      const check = format(checkDate, 'yyyy-MM-dd')
      if (d === check) {
        streak++
        checkDate.setDate(checkDate.getDate() - 1)
      } else break
    }
    return streak
  },
}))

// ── Seed helpers ─────────────────────────────────────────────────────────
export async function seedHabitsIfEmpty(userId: string) {
  const { data } = await supabase.from('habits').select('id').eq('user_id', userId).limit(1)
  if (data && data.length > 0) return
  const rows = defaultHabits.map(h => ({
    id: h.id, user_id: userId,
    name: h.name, category: h.category, icon: h.icon,
    target_frequency: h.targetFrequency, custom_days: h.customDays ?? null,
    color: h.color, order: h.order, active: h.active,
  }))
  await supabase.from('habits').insert(rows)
}
