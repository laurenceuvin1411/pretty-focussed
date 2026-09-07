import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { scopedKey } from '../lib/workspace'

export type RecurringFrequency = 'monthly' | 'quarterly' | 'annual'

export interface RecurringInvoice {
  id: string
  clientName: string
  service: string
  amountExclVat: number
  vatRate: number
  frequency: RecurringFrequency
  nextDueDate: string   // ISO yyyy-MM-dd — when next invoice should go out
  active: boolean
  notes: string
}

interface RecurringInvoiceStore {
  items: RecurringInvoice[]
  add: (item: Omit<RecurringInvoice, 'id'>) => void
  update: (id: string, changes: Partial<RecurringInvoice>) => void
  remove: (id: string) => void
  advance: (id: string) => void  // mark invoiced → push nextDueDate forward
}

function advanceDate(iso: string, freq: RecurringFrequency): string {
  const d = new Date(iso)
  if (freq === 'monthly')    d.setMonth(d.getMonth() + 1)
  else if (freq === 'quarterly') d.setMonth(d.getMonth() + 3)
  else                       d.setFullYear(d.getFullYear() + 1)
  return d.toISOString().split('T')[0]
}

// Due if nextDueDate falls within the current calendar month (or is overdue)
export function isDueThisMonth(item: RecurringInvoice): boolean {
  const today = new Date()
  const due = new Date(item.nextDueDate)
  const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0)
  return due <= endOfMonth
}

export const useRecurringInvoiceStore = create<RecurringInvoiceStore>()(
  persist(
    (set) => ({
      items: [],
      add: (item) => set(s => ({ items: [...s.items, { ...item, id: crypto.randomUUID() }] })),
      update: (id, changes) => set(s => ({ items: s.items.map(i => i.id === id ? { ...i, ...changes } : i) })),
      remove: (id) => set(s => ({ items: s.items.filter(i => i.id !== id) })),
      advance: (id) => set(s => ({
        items: s.items.map(i => i.id === id
          ? { ...i, nextDueDate: advanceDate(i.nextDueDate, i.frequency) }
          : i)
      })),
    }),
    { name: scopedKey('recurring-invoices-v1') }
  )
)
