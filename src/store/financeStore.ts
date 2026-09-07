import { create } from 'zustand'
import type { RevenueEntry, ExpenseEntry, Account } from '../types'
import { seedRevenue, seedExpenses, seedAccounts } from '../utils/seedData'
import { supabase } from '../lib/supabase'

interface FinanceStore {
  revenue: RevenueEntry[]
  expenses: ExpenseEntry[]
  accounts: Account[]
  hydrate: (revenue: RevenueEntry[], expenses: ExpenseEntry[], accounts: Account[]) => void
  addRevenue: (entry: Omit<RevenueEntry, 'id'>) => Promise<void>
  addExpense: (entry: Omit<ExpenseEntry, 'id'>) => Promise<void>
  updateAccount: (id: string, balance: number) => Promise<void>
  getMTDRevenue: (business?: string) => number
  getYTDRevenue: (business?: string) => number
  getMonthRevenue: (month: string, business?: string) => number
  getMonthExpenses: (month: string, business?: string) => number
  getNetWorth: () => number
  getMonthlyBreakdown: (year: number) => { month: string; revenue: number; expenses: number; net: number }[]
}

export const useFinanceStore = create<FinanceStore>((set, get) => ({
  revenue: [],
  expenses: [],
  accounts: [],

  hydrate: (revenue, expenses, accounts) => set({ revenue, expenses, accounts }),

  addRevenue: async (entry) => {
    const id = crypto.randomUUID()
    set(s => ({ revenue: [...s.revenue, { ...entry, id }] }))
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return
    await supabase.from('revenue_entries').insert({
      id, user_id: session.user.id, date: entry.date, amount: entry.amount,
      business: entry.business, type: entry.type, offer: entry.offer,
      client_name: entry.clientName ?? null, status: entry.status, notes: entry.notes ?? null,
    })
  },

  addExpense: async (entry) => {
    const id = crypto.randomUUID()
    set(s => ({ expenses: [...s.expenses, { ...entry, id }] }))
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return
    await supabase.from('expense_entries').insert({
      id, user_id: session.user.id, date: entry.date, amount: entry.amount,
      business: entry.business, category: entry.category,
      description: entry.description, recurring: entry.recurring,
      vat_deductible: entry.vatDeductible,
    })
  },

  updateAccount: async (id, balance) => {
    const lastUpdated = new Date().toISOString().split('T')[0]
    set(s => ({ accounts: s.accounts.map(a => a.id === id ? { ...a, balance, lastUpdated } : a) }))
    await supabase.from('accounts').update({ balance, last_updated: lastUpdated }).eq('id', id)
  },

  getMTDRevenue: (business) => {
    const month = new Date().toISOString().slice(0, 7)
    return get().revenue
      .filter(r => r.date.startsWith(month) && r.status === 'received' && (!business || r.business === business))
      .reduce((s, r) => s + r.amount, 0)
  },

  getYTDRevenue: (business) => {
    const year = new Date().getFullYear().toString()
    return get().revenue
      .filter(r => r.date.startsWith(year) && r.status === 'received' && (!business || r.business === business))
      .reduce((s, r) => s + r.amount, 0)
  },

  getMonthRevenue: (month, business) => get().revenue
    .filter(r => r.date.startsWith(month) && r.status === 'received' && (!business || r.business === business))
    .reduce((s, r) => s + r.amount, 0),

  getMonthExpenses: (month, business) => get().expenses
    .filter(e => e.date.startsWith(month) && (!business || e.business === business))
    .reduce((s, e) => s + e.amount, 0),

  getNetWorth: () => get().accounts.reduce((s, a) => s + a.balance, 0),

  getMonthlyBreakdown: (year) => Array.from({ length: 12 }, (_, i) => {
    const month = `${year}-${String(i + 1).padStart(2, '0')}`
    const revenue = get().getMonthRevenue(month)
    const expenses = get().getMonthExpenses(month)
    return { month, revenue, expenses, net: revenue - expenses }
  }),
}))

export async function seedFinanceIfEmpty(userId: string) {
  const { data } = await supabase.from('revenue_entries').select('id').eq('user_id', userId).limit(1)
  if (data && data.length > 0) return

  await supabase.from('revenue_entries').insert(
    seedRevenue.map(r => ({
      id: r.id, user_id: userId, date: r.date, amount: r.amount,
      business: r.business, type: r.type, offer: r.offer,
      client_name: r.clientName ?? null, status: r.status, notes: r.notes ?? null,
    }))
  )
  await supabase.from('expense_entries').insert(
    seedExpenses.map(e => ({
      id: e.id, user_id: userId, date: e.date, amount: e.amount,
      business: e.business, category: e.category, description: e.description,
      recurring: e.recurring, vat_deductible: e.vatDeductible,
    }))
  )
  await supabase.from('accounts').insert(
    seedAccounts.map(a => ({
      id: a.id, user_id: userId, name: a.name, type: a.type,
      balance: a.balance, last_updated: a.lastUpdated,
    }))
  )
}
