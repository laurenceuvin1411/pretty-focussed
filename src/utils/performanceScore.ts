import { useHabitStore } from '../store/habitStore'
import { useHealthStore } from '../store/healthStore'
import { useTaskStore } from '../store/taskStore'
import { useSalesFinanceStore } from '../store/salesFinanceStore'

export interface PerformanceBreakdown {
  total: number          // 0–100
  health: number         // 0–100
  habits: number         // 0–100
  execution: number      // 0–100
  business: number       // 0–100
  energy: number         // 0–100
}

export function computePerformanceScore(dateStr: string): PerformanceBreakdown {
  // ── Health (25%) ─────────────────────────────────────────────────────────
  const health = useHealthStore.getState().getDayScore(dateStr)

  // ── Habits (25%) ──────────────────────────────────────────────────────────
  const habits = useHabitStore.getState().getDailyScore(dateStr)

  // ── Execution / Tasks (20%) ───────────────────────────────────────────────
  const allTasks = useTaskStore.getState().tasks
  const todayTasks = allTasks.filter(t => t.scheduledDate === dateStr || t.dueDate === dateStr)
  const completedToday = todayTasks.filter(t => t.status === 'done')
  const execution = todayTasks.length === 0
    ? 70  // neutral when no tasks scheduled
    : Math.round((completedToday.length / todayTasks.length) * 100)

  // ── Business / Revenue momentum (20%) ─────────────────────────────────────
  const records = useSalesFinanceStore.getState().records
  const now = new Date(dateStr)
  const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
  const mtdRevenue = records
    .filter(r => r.wonAt >= monthStart && r.wonAt <= dateStr)
    .reduce((s, r) => s + r.amountExclVat, 0)

  // Score based on revenue this month — calibrated for €5k+ monthly target
  const TARGET_MONTHLY = 5000
  const business = Math.min(100, Math.round((mtdRevenue / TARGET_MONTHLY) * 100))

  // ── Energy (self-reported, 10%) ───────────────────────────────────────────
  const healthLog = useHealthStore.getState().getLog(dateStr)
  const energy = healthLog.energyLevel > 0
    ? Math.round((healthLog.energyLevel / 10) * 100)
    : 60  // neutral default

  // ── Weighted total ─────────────────────────────────────────────────────────
  const total = Math.round(
    health    * 0.25 +
    habits    * 0.25 +
    execution * 0.20 +
    business  * 0.20 +
    energy    * 0.10
  )

  return { total, health, habits, execution, business, energy }
}

export function scoreLabel(score: number): { label: string; color: string } {
  if (score >= 90) return { label: 'Elite',       color: '#7A9E8A' }
  if (score >= 75) return { label: 'High',         color: '#6DB889' }
  if (score >= 60) return { label: 'Steady',       color: '#B8956A' }
  if (score >= 40) return { label: 'Below par',    color: '#C4935A' }
  return              { label: 'Recovery day',  color: '#C4736A' }
}
