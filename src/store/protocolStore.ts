import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { scopedKey } from '../lib/workspace'

// Eigen protocollen: een reeks dagelijkse handelingen over een periode,
// eventueel in fases. Denk aan huidbehandeling, bleaching, supplementen,
// fysio-oefeningen of een medicatiekuur.

export interface ProtocolItem {
  id: string
  label: string          // bv. "Skin medication"
  sub?: string           // bv. "Ochtend"
  color: string
  perWeek?: number       // doel per week (bv. 2x nachtcrème); leeg = elke dag
}

export interface ProtocolPhase {
  id: string
  name: string           // bv. "Fase 1"
  days: number           // duur in dagen
  itemIds: string[]      // welke items in deze fase actief zijn
  note?: string
}

export interface Protocol {
  id: string
  name: string
  startDate: string      // YYYY-MM-DD
  items: ProtocolItem[]
  phases: ProtocolPhase[]
  rules?: string         // vrije tekst met aandachtspunten
  logs: Record<string, string[]>  // datum -> item-ids die gedaan zijn
  createdAt: string
}

export const PROTOCOL_COLORS = ['#7AACCF', '#6DB889', '#D4A96A', '#C4935A', '#A57A8B', '#4C6481']

interface ProtocolStore {
  protocols: Protocol[]
  addProtocol: (name: string, startDate: string) => string
  updateProtocol: (id: string, updates: Partial<Omit<Protocol, 'id' | 'createdAt'>>) => void
  deleteProtocol: (id: string) => void

  addItem: (protocolId: string, label: string, sub?: string) => void
  updateItem: (protocolId: string, itemId: string, updates: Partial<Omit<ProtocolItem, 'id'>>) => void
  deleteItem: (protocolId: string, itemId: string) => void

  addPhase: (protocolId: string, name: string, days: number) => void
  updatePhase: (protocolId: string, phaseId: string, updates: Partial<Omit<ProtocolPhase, 'id'>>) => void
  deletePhase: (protocolId: string, phaseId: string) => void

  toggleLog: (protocolId: string, date: string, itemId: string) => void
}

export const useProtocolStore = create<ProtocolStore>()(
  persist(
    (set) => ({
      protocols: [],

      addProtocol: (name, startDate) => {
        const id = crypto.randomUUID()
        set(s => ({
          protocols: [...s.protocols, {
            id, name, startDate, items: [], phases: [], logs: {},
            createdAt: new Date().toISOString(),
          }],
        }))
        return id
      },

      updateProtocol: (id, updates) => set(s => ({
        protocols: s.protocols.map(p => p.id === id ? { ...p, ...updates } : p),
      })),

      deleteProtocol: (id) => set(s => ({ protocols: s.protocols.filter(p => p.id !== id) })),

      addItem: (protocolId, label, sub) => set(s => ({
        protocols: s.protocols.map(p => p.id === protocolId
          ? { ...p, items: [...p.items, {
              id: crypto.randomUUID(), label, sub,
              color: PROTOCOL_COLORS[p.items.length % PROTOCOL_COLORS.length],
            }] }
          : p),
      })),

      updateItem: (protocolId, itemId, updates) => set(s => ({
        protocols: s.protocols.map(p => p.id === protocolId
          ? { ...p, items: p.items.map(i => i.id === itemId ? { ...i, ...updates } : i) }
          : p),
      })),

      deleteItem: (protocolId, itemId) => set(s => ({
        protocols: s.protocols.map(p => p.id === protocolId
          ? {
              ...p,
              items: p.items.filter(i => i.id !== itemId),
              phases: p.phases.map(ph => ({ ...ph, itemIds: ph.itemIds.filter(x => x !== itemId) })),
            }
          : p),
      })),

      addPhase: (protocolId, name, days) => set(s => ({
        protocols: s.protocols.map(p => p.id === protocolId
          ? { ...p, phases: [...p.phases, { id: crypto.randomUUID(), name, days, itemIds: p.items.map(i => i.id) }] }
          : p),
      })),

      updatePhase: (protocolId, phaseId, updates) => set(s => ({
        protocols: s.protocols.map(p => p.id === protocolId
          ? { ...p, phases: p.phases.map(ph => ph.id === phaseId ? { ...ph, ...updates } : ph) }
          : p),
      })),

      deletePhase: (protocolId, phaseId) => set(s => ({
        protocols: s.protocols.map(p => p.id === protocolId
          ? { ...p, phases: p.phases.filter(ph => ph.id !== phaseId) }
          : p),
      })),

      toggleLog: (protocolId, date, itemId) => set(s => ({
        protocols: s.protocols.map(p => {
          if (p.id !== protocolId) return p
          const done = p.logs[date] ?? []
          const next = done.includes(itemId) ? done.filter(x => x !== itemId) : [...done, itemId]
          return { ...p, logs: { ...p.logs, [date]: next } }
        }),
      })),
    }),
    { name: scopedKey('protocols-v1') }
  )
)

// ── Afgeleide info ───────────────────────────────────────────────
export interface ProtocolStatus {
  dayNum: number             // 1-based dag sinds start (0 of lager = nog niet begonnen)
  phase: ProtocolPhase | null
  phaseDay: number
  totalDays: number
  progressPct: number
  finished: boolean
  activeItems: ProtocolItem[]
}

export function getProtocolStatus(p: Protocol, dateStr: string): ProtocolStatus {
  const start = new Date(p.startDate + 'T00:00:00')
  const d = new Date(dateStr + 'T00:00:00')
  const dayNum = Math.floor((d.getTime() - start.getTime()) / 86400000) + 1
  const totalDays = p.phases.reduce((n, ph) => n + ph.days, 0)

  if (dayNum < 1) {
    return { dayNum, phase: null, phaseDay: 0, totalDays, progressPct: 0, finished: false, activeItems: [] }
  }

  // Zonder fases loopt het protocol gewoon door met alle items
  if (p.phases.length === 0) {
    return { dayNum, phase: null, phaseDay: dayNum, totalDays: 0, progressPct: 0, finished: false, activeItems: p.items }
  }

  let remaining = dayNum
  for (const ph of p.phases) {
    if (remaining <= ph.days) {
      return {
        dayNum, phase: ph, phaseDay: remaining, totalDays,
        progressPct: Math.min(100, Math.round((dayNum / totalDays) * 100)),
        finished: false,
        activeItems: p.items.filter(i => ph.itemIds.includes(i.id)),
      }
    }
    remaining -= ph.days
  }
  return { dayNum, phase: null, phaseDay: 0, totalDays, progressPct: 100, finished: true, activeItems: [] }
}

export function weekDates(dateStr: string): string[] {
  const d = new Date(dateStr + 'T12:00:00')
  const mon = new Date(d)
  mon.setDate(d.getDate() - ((d.getDay() + 6) % 7))
  return Array.from({ length: 7 }, (_, i) => {
    const x = new Date(mon)
    x.setDate(mon.getDate() + i)
    return x.toISOString().split('T')[0]
  })
}
