import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useHabitStore, seedHabitsIfEmpty } from '../store/habitStore'
import { useTaskStore, seedTasksIfEmpty } from '../store/taskStore'
import { useLeadStore, seedLeadsIfEmpty } from '../store/leadStore'
import { useFinanceStore, seedFinanceIfEmpty } from '../store/financeStore'
import { useSalesFinanceStore, fromRow, seedSalesFinanceIfEmpty } from '../store/salesFinanceStore'
import { usePlannerStore, seedPlannerIfEmpty } from '../store/plannerStore'
import { useRecurringStore, seedRecurringIfEmpty } from '../store/recurringStore'
import { useVisionStore } from '../store/visionStore'
import type { Habit, HabitLog, Task, RevenueEntry, ExpenseEntry, Account, PlannerEvent, Goal, WeekBlock } from '../types'
import type { Lead, LeadActivity } from '../store/leadStore'
import type { RecurringTask } from '../types'

export function useDataSync(userId: string | undefined) {
  const [ready, setReady] = useState(false)

  const hydrateHabits   = useHabitStore(s => s.hydrate)
  const hydrateTasks    = useTaskStore(s => s.hydrate)
  const hydrateLeads    = useLeadStore(s => s.hydrate)
  const hydrateFinance      = useFinanceStore(s => s.hydrate)
  const hydrateSalesFinance = useSalesFinanceStore(s => s.hydrate)
  const hydratePlanner  = usePlannerStore(s => s.hydrate)
  const hydrateRecurring = useRecurringStore(s => s.hydrate)
  const hydrateVision   = useVisionStore(s => s.hydrate)

  useEffect(() => {
    if (!userId) return

    async function fetchAll() {
      // Seed default data if first-time user
      await Promise.all([
        seedHabitsIfEmpty(userId!),
        seedTasksIfEmpty(userId!),
        seedLeadsIfEmpty(userId!),
        seedFinanceIfEmpty(userId!),
        seedSalesFinanceIfEmpty(userId!),
        seedPlannerIfEmpty(userId!),
        seedRecurringIfEmpty(userId!),
      ])

      // Fetch all data in parallel
      const [
        habitsRes, logsRes, tasksRes, leadsRes,
        revenueRes, expensesRes, accountsRes,
        eventsRes, goalsRes, weekBlocksRes,
        recurringRes, generatedRes, visionRes, activitiesRes, salesFinanceRes,
      ] = await Promise.all([
        supabase.from('habits').select('*').eq('user_id', userId).order('"order"'),
        supabase.from('habit_logs').select('*').eq('user_id', userId),
        supabase.from('tasks').select('*').eq('user_id', userId),
        supabase.from('leads').select('*').eq('user_id', userId).order('created_at', { ascending: false }),

        supabase.from('revenue_entries').select('*').eq('user_id', userId),
        supabase.from('expense_entries').select('*').eq('user_id', userId),
        supabase.from('accounts').select('*').eq('user_id', userId),
        supabase.from('planner_events').select('*').eq('user_id', userId),
        supabase.from('goals').select('*').eq('user_id', userId),
        supabase.from('week_blocks').select('*').eq('user_id', userId),
        supabase.from('recurring_tasks').select('*').eq('user_id', userId),
        supabase.from('recurring_generated_dates').select('date').eq('user_id', userId),
        supabase.from('user_vision').select('data').eq('user_id', userId).single(),
        supabase.from('lead_activities').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
        supabase.from('sales_finance_records').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
      ])

      // Map snake_case → camelCase and hydrate stores
      let habits: Habit[] = (habitsRes.data ?? []).map((r: any) => ({
        id: r.id, name: r.name, category: r.category, icon: r.icon,
        targetFrequency: r.target_frequency, customDays: r.custom_days,
        color: r.color, order: r.order, active: r.active,
      }))

      let logs: HabitLog[] = (logsRes.data ?? []).map((r: any) => ({
        date: r.date, habitId: r.habit_id, completed: r.completed, note: r.note,
      }))

      // Eenmalige dedupe: actieve habits met identieke naam samenvoegen.
      // De habit met de meeste logs blijft; logs van de dubbele worden overgezet, daarna wordt die verwijderd.
      const byName = new Map<string, Habit[]>()
      habits.filter(h => h.active).forEach(h => {
        const key = h.name.trim().toLowerCase()
        byName.set(key, [...(byName.get(key) ?? []), h])
      })
      for (const dupes of byName.values()) {
        if (dupes.length < 2) continue
        const logCount = (id: string) => logs.filter(l => l.habitId === id && l.completed).length
        const sorted = [...dupes].sort((a, b) => logCount(b.id) - logCount(a.id))
        const keep = sorted[0]
        for (const dupe of sorted.slice(1)) {
          const movable = logs.filter(l =>
            l.habitId === dupe.id &&
            !logs.some(k => k.habitId === keep.id && k.date === l.date)
          )
          if (movable.length > 0) {
            await supabase.from('habit_logs').upsert(movable.map(l => ({
              user_id: userId, habit_id: keep.id, date: l.date, completed: l.completed, note: l.note ?? null,
            })), { onConflict: 'user_id,habit_id,date' })
            logs = logs.map(l => l.habitId === dupe.id && movable.includes(l) ? { ...l, habitId: keep.id } : l)
          }
          await supabase.from('habit_logs').delete().eq('habit_id', dupe.id)
          await supabase.from('habits').delete().eq('id', dupe.id)
          logs = logs.filter(l => l.habitId !== dupe.id)
          habits = habits.filter(h => h.id !== dupe.id)
        }
      }

      const tasks: Task[] = (tasksRes.data ?? []).map((r: any) => ({
        id: r.id, title: r.title, description: r.description,
        business: r.business, category: r.category, priority: r.priority,
        needleMover: r.needle_mover, status: r.status,
        dueDate: r.due_date, scheduledDate: r.scheduled_date,
        estimatedMinutes: r.estimated_minutes, completedAt: r.completed_at,
        createdAt: r.created_at, tags: r.tags ?? [],
      }))

      const leads: Lead[] = (leadsRes.data ?? []).map((r: any) => ({
        id: r.id, name: r.name, channel: r.channel, temperature: r.temperature,
        program: r.program, status: r.status, lastContact: r.last_contact,
        nextFollowUp: r.next_follow_up, value: r.value,
        probability: r.probability ?? 10, notes: r.notes,
        wonAt: r.won_at, lostAt: r.lost_at, createdAt: r.created_at,
        photoUrl: r.photo_url ?? undefined,
        instagramHandle: r.instagram_handle ?? undefined,
        nextAction: r.next_action ?? undefined,
        nextActionPriority: r.next_action_priority ?? undefined,
        paidAt: r.paid_at ?? undefined,
      }))

      const activities: LeadActivity[] = (activitiesRes.data ?? []).map((r: any) => ({
        id: r.id, leadId: r.lead_id, type: r.type, content: r.content, createdAt: r.created_at,
      }))

      const revenue: RevenueEntry[] = (revenueRes.data ?? []).map((r: any) => ({
        id: r.id, date: r.date, amount: r.amount, business: r.business,
        type: r.type, offer: r.offer, clientName: r.client_name,
        status: r.status, notes: r.notes,
      }))

      const expenses: ExpenseEntry[] = (expensesRes.data ?? []).map((r: any) => ({
        id: r.id, date: r.date, amount: r.amount, business: r.business,
        category: r.category, description: r.description,
        recurring: r.recurring, vatDeductible: r.vat_deductible,
      }))

      const accounts: Account[] = (accountsRes.data ?? []).map((r: any) => ({
        id: r.id, name: r.name, type: r.type, balance: r.balance, lastUpdated: r.last_updated,
      }))

      const events: PlannerEvent[] = (eventsRes.data ?? []).map((r: any) => ({
        id: r.id, date: r.date, title: r.title, type: r.type, color: r.color,
        startTime: r.start_time, endTime: r.end_time, notes: r.notes,
      }))

      const goals: Goal[] = (goalsRes.data ?? []).map((r: any) => ({
        id: r.id, title: r.title, area: r.area, category: r.category,
        icon: r.icon, business: r.business, horizon: r.horizon, quarter: r.quarter,
        targetNumber: r.target_number, currentNumber: r.current_number,
        unit: r.unit, targetDate: r.target_date, status: r.status,
        whyItMatters: r.why_it_matters, milestones: r.milestones ?? [],
        xpReward: r.xp_reward, color: r.color,
      }))

      const weekBlocks: WeekBlock[] = (weekBlocksRes.data ?? []).map((r: any) => ({
        id: r.id, day: r.day, start: r.start_time, end: r.end_time,
        type: r.type, label: r.label, notes: r.notes, business: r.business,
      }))

      const recurring: RecurringTask[] = (recurringRes.data ?? []).map((r: any) => ({
        id: r.id, title: r.title, business: r.business, category: r.category,
        priority: r.priority, needleMover: r.needle_mover,
        frequency: r.frequency ?? 'weekly', days: r.days ?? [],
        monthlyDay: r.monthly_day ?? undefined,
        active: r.active, estimatedMinutes: r.estimated_minutes, tags: r.tags ?? [],
      }))

      const generatedDates: string[] = (generatedRes.data ?? []).map((r: any) => r.date)

      hydrateHabits(habits, logs)
      hydrateTasks(tasks)
      hydrateLeads(leads, activities)
      hydrateFinance(revenue, expenses, accounts)
      hydrateSalesFinance((salesFinanceRes.data ?? []).map(fromRow))
      hydratePlanner(events, goals, weekBlocks)
      hydrateRecurring(recurring, generatedDates)

      if (visionRes.data?.data) {
        hydrateVision(visionRes.data.data)
      }

      setReady(true)
    }

    fetchAll().catch(err => {
      console.error('[useDataSync] fetchAll failed:', err)
      setReady(true) // still unblock the UI
    })
  }, [userId])

  return ready
}
