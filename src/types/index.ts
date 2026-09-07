export interface Habit {
  id: string
  name: string
  category: 'physical' | 'mental' | 'professional' | 'financial' | 'relationships' | 'persoonlijk' | 'professioneel' | 'lifestyle'
  icon: string
  targetFrequency: 'daily' | 'weekdays' | 'custom'
  customDays?: number[]
  color: string
  order: number
  active: boolean
}

export interface HabitLog {
  date: string
  habitId: string
  completed: boolean
  note?: string
}

export type Business = 'ceo-lifestyle' | 'bora' | 'personal' | 'all'
export type TaskStatus = 'backlog' | 'this-week' | 'today' | 'in-progress' | 'done' | 'cancelled'

export interface Task {
  id: string
  title: string
  description?: string
  business: Business
  category: 'revenue' | 'content' | 'operations' | 'admin' | 'health' | 'finance'
  priority: 1 | 2 | 3 | 4
  needleMover: boolean
  status: TaskStatus
  dueDate?: string
  scheduledDate?: string
  estimatedMinutes?: number
  completedAt?: string
  createdAt: string
  tags: string[]
}

export interface RevenueEntry {
  id: string
  date: string
  amount: number
  business: 'ceo-lifestyle' | 'bora'
  type: 'coaching' | 'retainer' | 'project' | 'membership' | 'event' | 'digital' | 'other'
  offer: string
  clientName?: string
  status: 'pending' | 'received' | 'refunded'
  notes?: string
}

export interface ExpenseEntry {
  id: string
  date: string
  amount: number
  business: 'ceo-lifestyle' | 'bora' | 'personal'
  category: 'software' | 'team' | 'marketing' | 'rent' | 'equipment' | 'education' | 'travel' | 'food' | 'insurance' | 'tax' | 'other'
  description: string
  recurring: boolean
  vatDeductible: boolean
}

export interface Account {
  id: string
  name: string
  type: 'business' | 'personal' | 'tax' | 'emergency' | 'investment' | 'savings'
  balance: number
  lastUpdated: string
}

export interface PlannerEvent {
  id: string
  date: string
  title: string
  type: 'bora' | 'business' | 'sport' | 'personal' | 'admin' | 'rest'
  color: string
  startTime?: string
  endTime?: string
  notes?: string
}

export type GoalCategory =
  | 'health' | 'relationships' | 'travel'                            // personal
  | 'revenue' | 'sales' | 'brand' | 'community'                      // professional
  | 'personal-finance' | 'business-savings' | 'real-estate' | 'stocks' // investments

export interface GoalMilestone {
  value: number
  label: string
  emoji: string
  unlocked?: boolean
}

export interface Goal {
  id: string
  title: string
  area: 'business' | 'finance' | 'health' | 'relationships' | 'lifestyle'
  category: GoalCategory
  icon: string
  business?: string
  horizon: '10-year' | '3-year' | 'annual' | 'quarterly' | 'monthly'
  quarter?: 'Q1' | 'Q2' | 'Q3' | 'Q4'
  targetNumber: number
  currentNumber: number
  unit: string
  targetDate?: string
  status: 'active' | 'complete' | 'paused'
  whyItMatters: string
  milestones: GoalMilestone[]
  xpReward: number
  color: string
}

export interface RecurringTask {
  id: string
  title: string
  business: Business
  category: 'revenue' | 'content' | 'operations' | 'admin' | 'health' | 'finance'
  priority: 1 | 2 | 3 | 4
  needleMover: boolean
  frequency: 'weekly' | 'monthly'  // weekly = specific weekdays, monthly = specific day of month
  days: number[]  // weekly: 0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat
  monthlyDay?: number  // monthly: 1–31
  active: boolean
  estimatedMinutes?: number
  tags: string[]
}

export type WeekBlockType = 'deep-work' | 'meeting' | 'sales' | 'content' | 'operator' | 'recovery' | 'training'

export interface WeekBlock {
  id: string
  day: 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun'
  start: string
  end: string
  type: WeekBlockType
  label: string
  notes?: string
  business?: string
}
