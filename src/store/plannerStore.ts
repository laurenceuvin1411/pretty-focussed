import { create } from 'zustand'
import type { PlannerEvent, Goal, WeekBlock } from '../types'
import { seedGoals, seedPlannerEvents, idealWeekPreset } from '../utils/seedData'
import { supabase } from '../lib/supabase'
import { showSaved } from '../components/SaveToast'

interface PlannerStore {
  events: PlannerEvent[]
  goals: Goal[]
  weekBlocks: WeekBlock[]
  hydrate: (events: PlannerEvent[], goals: Goal[], weekBlocks: WeekBlock[]) => void
  addEvent: (event: Omit<PlannerEvent, 'id'>) => Promise<void>
  updateEvent: (id: string, updates: Partial<PlannerEvent>) => Promise<void>
  deleteEvent: (id: string) => Promise<void>
  getEventsForMonth: (month: string) => PlannerEvent[]
  addGoal: (goal: Omit<Goal, 'id'>) => Promise<void>
  updateGoal: (id: string, updates: Partial<Goal>) => Promise<void>
  deleteGoal: (id: string) => Promise<void>
  loadIdealWeek: () => void
  updateWeekBlock: (id: string, updates: Partial<WeekBlock>) => Promise<void>
  addWeekBlock: (block: Omit<WeekBlock, 'id'>) => Promise<void>
  deleteWeekBlock: (id: string) => Promise<void>
}

async function uid() {
  const { data: { session } } = await supabase.auth.getSession()
  return session?.user.id
}

export const usePlannerStore = create<PlannerStore>((set, get) => ({
  events: [],
  goals: [],
  weekBlocks: [],

  hydrate: (events, goals, weekBlocks) => set({ events, goals, weekBlocks }),

  addEvent: async (event) => {
    const id = crypto.randomUUID()
    set(s => ({ events: [...s.events, { ...event, id }] }))
    const userId = await uid(); if (!userId) return
    await supabase.from('planner_events').insert({
      id, user_id: userId, date: event.date, title: event.title,
      type: event.type, color: event.color,
      start_time: event.startTime ?? null, end_time: event.endTime ?? null, notes: event.notes ?? null,
    })
  },

  updateEvent: async (id, updates) => {
    set(s => ({ events: s.events.map(e => e.id === id ? { ...e, ...updates } : e) }))
    const ev = get().events.find(e => e.id === id); if (!ev) return
    const { error } = await supabase.from('planner_events').update({
      date: ev.date, title: ev.title, type: ev.type, color: ev.color,
      start_time: ev.startTime ?? null, end_time: ev.endTime ?? null, notes: ev.notes ?? null,
    }).eq('id', id)
    if (!error) showSaved()
  },

  deleteEvent: async (id) => {
    set(s => ({ events: s.events.filter(e => e.id !== id) }))
    await supabase.from('planner_events').delete().eq('id', id)
  },

  getEventsForMonth: (month) => get().events.filter(e => e.date.startsWith(month)),

  addGoal: async (goal) => {
    const id = crypto.randomUUID()
    set(s => ({ goals: [...s.goals, { ...goal, id }] }))
    const userId = await uid(); if (!userId) return
    await supabase.from('goals').insert({
      id, user_id: userId, title: goal.title, area: goal.area,
      category: goal.category, icon: goal.icon, business: goal.business ?? null,
      horizon: goal.horizon, quarter: goal.quarter ?? null,
      target_number: goal.targetNumber, current_number: goal.currentNumber,
      unit: goal.unit, target_date: goal.targetDate ?? null, status: goal.status,
      why_it_matters: goal.whyItMatters, milestones: goal.milestones,
      xp_reward: goal.xpReward, color: goal.color,
    })
  },

  updateGoal: async (id, updates) => {
    set(s => ({ goals: s.goals.map(g => g.id === id ? { ...g, ...updates } : g) }))
    const g = get().goals.find(g => g.id === id); if (!g) return
    const { error } = await supabase.from('goals').update({
      title: g.title, area: g.area, category: g.category, icon: g.icon,
      business: g.business ?? null, horizon: g.horizon, quarter: g.quarter ?? null,
      target_number: g.targetNumber, current_number: g.currentNumber,
      unit: g.unit, target_date: g.targetDate ?? null, status: g.status,
      why_it_matters: g.whyItMatters, milestones: g.milestones,
      xp_reward: g.xpReward, color: g.color,
    }).eq('id', id)
    if (!error) showSaved()
  },

  deleteGoal: async (id) => {
    set(s => ({ goals: s.goals.filter(g => g.id !== id) }))
    await supabase.from('goals').delete().eq('id', id)
  },

  loadIdealWeek: () => set({ weekBlocks: idealWeekPreset }),

  addWeekBlock: async (block) => {
    const id = crypto.randomUUID()
    set(s => ({ weekBlocks: [...s.weekBlocks, { ...block, id }] }))
    const userId = await uid(); if (!userId) return
    await supabase.from('week_blocks').insert({
      id, user_id: userId, day: block.day,
      start_time: block.start, end_time: block.end,
      type: block.type, label: block.label,
      notes: block.notes ?? null, business: block.business ?? null,
    })
  },

  updateWeekBlock: async (id, updates) => {
    set(s => ({ weekBlocks: s.weekBlocks.map(b => b.id === id ? { ...b, ...updates } : b) }))
    const b = get().weekBlocks.find(b => b.id === id); if (!b) return
    const { error } = await supabase.from('week_blocks').update({
      day: b.day, start_time: b.start, end_time: b.end,
      type: b.type, label: b.label, notes: b.notes ?? null, business: b.business ?? null,
    }).eq('id', id)
    if (!error) showSaved()
  },

  deleteWeekBlock: async (id) => {
    set(s => ({ weekBlocks: s.weekBlocks.filter(b => b.id !== id) }))
    await supabase.from('week_blocks').delete().eq('id', id)
  },
}))

export async function seedPlannerIfEmpty(userId: string) {
  const { data } = await supabase.from('goals').select('id').eq('user_id', userId).limit(1)
  if (data && data.length > 0) return

  await supabase.from('goals').insert(seedGoals.map(g => ({
    id: g.id, user_id: userId, title: g.title, area: g.area,
    category: g.category, icon: g.icon, business: g.business ?? null,
    horizon: g.horizon, quarter: g.quarter ?? null,
    target_number: g.targetNumber, current_number: g.currentNumber,
    unit: g.unit, target_date: g.targetDate ?? null, status: g.status,
    why_it_matters: g.whyItMatters, milestones: g.milestones,
    xp_reward: g.xpReward, color: g.color,
  })))

  await supabase.from('planner_events').insert(seedPlannerEvents.map(e => ({
    id: e.id, user_id: userId, date: e.date, title: e.title,
    type: e.type, color: e.color,
    start_time: e.startTime ?? null, end_time: e.endTime ?? null, notes: e.notes ?? null,
  })))

  await supabase.from('week_blocks').insert(idealWeekPreset.map(b => ({
    id: b.id, user_id: userId, day: b.day,
    start_time: b.start, end_time: b.end,
    type: b.type, label: b.label, notes: b.notes ?? null, business: b.business ?? null,
  })))
}
