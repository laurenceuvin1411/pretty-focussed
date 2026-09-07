// Omzetzicht zonder boekhouding: maanddoel, aanbod, verkopen in seconden gelogd, gat tot doel.
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { scopedKey } from '../../lib/workspace'
import { monthKey } from '../../lib/pf/week'

export type OfferKind = 'one_on_one' | 'group' | 'digital' | 'service' | 'other'
export const OFFER_KIND_LABEL: Record<OfferKind, string> = {
  one_on_one: '1:1', group: 'Group', digital: 'Digital', service: 'Service', other: 'Other',
}

export interface Offer {
  id: string
  name: string
  price: number
  kind: OfferKind
  createdAt: string
}

export interface Sale {
  id: string
  date: string          // 'yyyy-MM-dd'
  offerId?: string
  label: string         // naam van het aanbod of vrije omschrijving
  amount: number
  createdAt: string
}

interface RevenueStore {
  targets: Record<string, number>   // per maand 'yyyy-MM'
  offers: Offer[]
  sales: Sale[]
  setTarget: (month: string, amount: number) => void
  addOffer: (name: string, price: number, kind?: OfferKind) => string
  updateOffer: (id: string, patch: Partial<Offer>) => void
  deleteOffer: (id: string) => void
  logSale: (input: { date?: string; offerId?: string; label?: string; amount?: number }) => string | null
  deleteSale: (id: string) => void
  monthTarget: (month?: string) => number
  monthRevenue: (month?: string) => number
  monthGap: (month?: string) => number
  salesBetween: (from: string, to: string) => Sale[]
  revenueBetween: (from: string, to: string) => number
}

export const useRevenueStore = create<RevenueStore>()(
  persist(
    (set, get) => ({
      targets: {},
      offers: [],
      sales: [],

      setTarget: (month, amount) => set(s => ({ targets: { ...s.targets, [month]: Math.max(0, amount) } })),

      addOffer: (name, price, kind = 'service') => {
        const id = crypto.randomUUID()
        set(s => ({ offers: [...s.offers, { id, name: name.trim(), price, kind, createdAt: new Date().toISOString() }] }))
        return id
      },

      updateOffer: (id, patch) => set(s => ({ offers: s.offers.map(o => o.id === id ? { ...o, ...patch } : o) })),

      deleteOffer: (id) => set(s => ({ offers: s.offers.filter(o => o.id !== id) })),

      logSale: ({ date, offerId, label, amount }) => {
        const offer = offerId ? get().offers.find(o => o.id === offerId) : undefined
        const finalAmount = amount ?? offer?.price
        const finalLabel = (label?.trim() || offer?.name || '').trim()
        if (!finalAmount || finalAmount <= 0 || !finalLabel) return null
        const id = crypto.randomUUID()
        set(s => ({
          sales: [...s.sales, {
            id, date: date ?? new Date().toISOString().slice(0, 10),
            offerId, label: finalLabel, amount: finalAmount, createdAt: new Date().toISOString(),
          }],
        }))
        return id
      },

      deleteSale: (id) => set(s => ({ sales: s.sales.filter(x => x.id !== id) })),

      monthTarget: (month = monthKey()) => {
        const t = get().targets
        if (t[month] !== undefined) return t[month]
        // Nog geen doel voor deze maand: neem het laatst ingestelde doel over.
        const keys = Object.keys(t).sort()
        const last = keys.filter(k => k < month).pop()
        return last ? t[last] : 0
      },

      monthRevenue: (month = monthKey()) =>
        get().sales.filter(x => x.date.startsWith(month)).reduce((a, x) => a + x.amount, 0),

      monthGap: (month = monthKey()) => get().monthTarget(month) - get().monthRevenue(month),

      salesBetween: (from, to) =>
        get().sales.filter(x => x.date >= from && x.date <= to).sort((a, b) => b.date.localeCompare(a.date)),

      revenueBetween: (from, to) => get().salesBetween(from, to).reduce((a, x) => a + x.amount, 0),
    }),
    { name: scopedKey('pf-revenue-v1') }
  )
)
