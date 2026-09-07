// Sales: the conversations that become revenue. Five stages, no automation, no CRM.
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { scopedKey } from '../../lib/workspace'

export type Stage = 'new' | 'conversation' | 'proposal' | 'won' | 'lost'
export const STAGES: Stage[] = ['new', 'conversation', 'proposal', 'won', 'lost']
export const STAGE_LABEL: Record<Stage, string> = {
  new: 'New', conversation: 'In conversation', proposal: 'Proposal out', won: 'Won', lost: 'Not now',
}
export const OPEN_STAGES: Stage[] = ['new', 'conversation', 'proposal']

export interface Lead {
  id: string
  name: string
  offerId?: string
  offerName?: string
  value?: number          // eur, expected
  stage: Stage
  nextStep?: string       // one line: what happens next
  nextDate?: string       // 'yyyy-MM-dd'
  note?: string
  source?: string         // where she came from
  createdAt: string
  updatedAt: string
  closedAt?: string
}

interface SalesStore {
  leads: Lead[]
  addLead: (input: { name: string; offerId?: string; offerName?: string; value?: number; stage?: Stage; nextStep?: string; nextDate?: string; source?: string; note?: string }) => string | null
  updateLead: (id: string, patch: Partial<Lead>) => void
  moveLead: (id: string, stage: Stage) => void
  deleteLead: (id: string) => void
  open: () => Lead[]
  pipelineValue: () => number
  wonBetween: (from: string, to: string) => Lead[]
}

export const useSalesStore = create<SalesStore>()(
  persist(
    (set, get) => ({
      leads: [],

      addLead: ({ name, offerId, offerName, value, stage = 'new', nextStep, nextDate, source, note }) => {
        const n = name.trim(); if (!n) return null
        const id = crypto.randomUUID()
        const now = new Date().toISOString()
        set(s => ({ leads: [{ id, name: n, offerId, offerName, value, stage, nextStep, nextDate, source, note, createdAt: now, updatedAt: now }, ...s.leads] }))
        return id
      },

      updateLead: (id, patch) => set(s => ({ leads: s.leads.map(l => l.id === id ? { ...l, ...patch, updatedAt: new Date().toISOString() } : l) })),

      moveLead: (id, stage) => set(s => ({
        leads: s.leads.map(l => l.id === id ? {
          ...l, stage, updatedAt: new Date().toISOString(),
          closedAt: stage === 'won' || stage === 'lost' ? new Date().toISOString().slice(0, 10) : undefined,
        } : l),
      })),

      deleteLead: (id) => set(s => ({ leads: s.leads.filter(l => l.id !== id) })),

      open: () => get().leads.filter(l => OPEN_STAGES.includes(l.stage)),

      pipelineValue: () => get().open().reduce((a, l) => a + (l.value ?? 0), 0),

      wonBetween: (from, to) => get().leads.filter(l => l.stage === 'won' && l.closedAt && l.closedAt >= from && l.closedAt <= to),
    }),
    { name: scopedKey('pf-sales-v1') }
  )
)
