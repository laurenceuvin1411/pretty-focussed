// Finance: what comes in, what goes out, what she keeps. No accounting, no VAT, no invoices.
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { scopedKey } from '../../lib/workspace'

export type ExpenseKind = 'space' | 'tools' | 'team' | 'marketing' | 'travel' | 'other'
export const EXPENSE_LABEL: Record<ExpenseKind, string> = {
  space: 'Space', tools: 'Tools', team: 'Team', marketing: 'Marketing', travel: 'Travel', other: 'Other',
}

export interface Expense {
  id: string
  date: string        // 'yyyy-MM-dd'
  label: string
  amount: number      // eur
  kind: ExpenseKind
  monthly: boolean    // a fixed cost that repeats every month
  createdAt: string
}

interface FinanceStore {
  expenses: Expense[]
  payTarget: number                     // what she wants to pay herself a month, eur
  setPayTarget: (n: number) => void
  addExpense: (input: { date?: string; label: string; amount: number; kind?: ExpenseKind; monthly?: boolean }) => string | null
  updateExpense: (id: string, patch: Partial<Expense>) => void
  deleteExpense: (id: string) => void
  monthOut: (month: string) => number   // one-off expenses in the month plus every monthly cost
  fixedMonthly: () => number
  expensesIn: (month: string) => Expense[]
}

export const useFinanceStore = create<FinanceStore>()(
  persist(
    (set, get) => ({
      expenses: [],
      payTarget: 0,
      setPayTarget: (n) => set({ payTarget: Math.max(0, n) }),

      addExpense: ({ date, label, amount, kind = 'other', monthly = false }) => {
        const l = label.trim(); if (!l || !(amount > 0)) return null
        const id = crypto.randomUUID()
        set(s => ({ expenses: [...s.expenses, { id, date: date ?? new Date().toISOString().slice(0, 10), label: l, amount, kind, monthly, createdAt: new Date().toISOString() }] }))
        return id
      },

      updateExpense: (id, patch) => set(s => ({ expenses: s.expenses.map(e => e.id === id ? { ...e, ...patch } : e) })),
      deleteExpense: (id) => set(s => ({ expenses: s.expenses.filter(e => e.id !== id) })),

      fixedMonthly: () => get().expenses.filter(e => e.monthly).reduce((a, e) => a + e.amount, 0),

      expensesIn: (month) => get().expenses
        .filter(e => e.monthly ? e.date.slice(0, 7) <= month : e.date.startsWith(month))
        .sort((a, b) => b.date.localeCompare(a.date)),

      monthOut: (month) => get().expensesIn(month).reduce((a, e) => a + e.amount, 0),
    }),
    { name: scopedKey('pf-finance-v1') }
  )
)
