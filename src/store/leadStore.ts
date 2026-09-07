import { create } from 'zustand'
import { supabase } from '../lib/supabase'
import { showSaved } from '../components/SaveToast'
import { useSalesFinanceStore, calcVat } from './salesFinanceStore'
import { emit } from '../engine/automationEngine'

export type LeadTemperature = 'Hot' | 'Warm' | 'Cold'
export type LeadChannel = 'WhatsApp' | 'Instagram DM' | 'In-person' | 'Email' | 'LinkedIn'
// Diensten zijn bewerkbaar (zie serviceStore); een lead bewaart de naam als tekst.
export type LeadProgram = string
export type LeadStatus = 'new' | 'contacted' | 'discovery' | 'proposal' | 'negotiation' | 'won' | 'lost'
export type ActivityType = 'note' | 'contact' | 'call' | 'email' | 'meeting' | 'status_change'

export const STAGE_ORDER: LeadStatus[] = ['new', 'contacted', 'discovery', 'proposal', 'negotiation', 'won', 'lost']

export const STAGE_PROBABILITY: Record<LeadStatus, number> = {
  new:         10,
  contacted:   20,
  discovery:   35,
  proposal:    50,
  negotiation: 70,
  won:         100,
  lost:        0,
}

// Legacy fallback; de bewerkbare lijst staat in serviceStore.
export const PROGRAM_VALUE: Record<string, number> = {
  'CEO Club':              2500,
  '1:1 Business Coaching': 5000,
  'CMO':                   6000,
  'Website / app':         3500,
  'Andere':                0,
}

export const PROGRAM_LABEL: Record<string, string> = {
  'CEO Club':              '€2.500 / 3mnd',
  '1:1 Business Coaching': '€5.000 / 3mnd',
  'CMO':                   '€2.000 / mnd',
  'Website / app':         'op maat',
  'Andere':                '',
}

export interface LeadActivity {
  id: string
  leadId: string
  type: ActivityType
  content: string
  createdAt: string // ISO timestamptz
}

export type NextActionPriority = 'high' | 'medium' | 'low'

export interface Lead {
  id: string
  name: string
  channel: LeadChannel
  temperature: LeadTemperature
  program: LeadProgram
  status: LeadStatus
  lastContact: string
  nextFollowUp?: string
  value: number
  probability: number
  notes: string
  nextAction?: string
  nextActionPriority?: NextActionPriority
  wonAt?: string
  lostAt?: string
  createdAt: string
  photoUrl?: string
  instagramHandle?: string
  paidAt?: string
}

const seedLeads: Lead[] = [
  { id: 'l1', name: 'Michelle Desmet',        channel: 'WhatsApp',     temperature: 'Hot',  program: 'CEO Club',              status: 'discovery',   lastContact: '2026-06-05', value: 2500, probability: 35, notes: '', createdAt: '2026-06-01' },
  { id: 'l2', name: 'Armelle De Vyvere',      channel: 'Instagram DM', temperature: 'Hot',  program: '1:1 Business Coaching', status: 'negotiation', lastContact: '2026-06-05', value: 5000, probability: 70, notes: '', createdAt: '2026-06-01' },
  { id: 'l3', name: 'Dimitri Dhondt',         channel: 'WhatsApp',     temperature: 'Hot',  program: 'Website / app',         status: 'proposal',    lastContact: '2026-06-08', value: 3500, probability: 50, notes: '', createdAt: '2026-06-05' },
  { id: 'l4', name: 'Jo De Cock',             channel: 'Instagram DM', temperature: 'Hot',  program: 'Website / app',         status: 'contacted',   lastContact: '2026-06-05', value: 3500, probability: 20, notes: '', createdAt: '2026-06-03' },
  { id: 'l5', name: 'Katrien Wybouw',         channel: 'WhatsApp',     temperature: 'Warm', program: 'CEO Club',              status: 'contacted',   lastContact: '2026-06-05', value: 2500, probability: 20, notes: '', createdAt: '2026-05-28' },
  { id: 'l6', name: 'Julie Small Habits',     channel: 'Instagram DM', temperature: 'Warm', program: 'CEO Club',              status: 'new',         lastContact: '2026-06-10', value: 2500, probability: 10, notes: '', createdAt: '2026-06-10' },
  { id: 'l7', name: 'Biovita',                channel: 'Instagram DM', temperature: 'Warm', program: 'CEO Club',              status: 'contacted',   lastContact: '2026-06-08', value: 2500, probability: 20, notes: '', createdAt: '2026-06-04' },
  { id: 'l8', name: 'Johan Uvin - CareCoach', channel: 'In-person',    temperature: 'Warm', program: 'CMO',                   status: 'proposal',    lastContact: '2026-06-04', value: 6000, probability: 50, notes: 'CMO retainer besproken', createdAt: '2026-05-20' },
]

function toRow(l: Lead, userId: string) {
  return {
    id: l.id, user_id: userId,
    name: l.name, channel: l.channel, temperature: l.temperature,
    program: l.program, status: l.status,
    last_contact: l.lastContact, next_follow_up: l.nextFollowUp ?? null,
    value: l.value, probability: l.probability,
    notes: l.notes, created_at: l.createdAt,
    won_at: l.wonAt ?? null, lost_at: l.lostAt ?? null,
    photo_url: l.photoUrl ?? null, instagram_handle: l.instagramHandle ?? null,
    paid_at: l.paidAt ?? null,
  }
}

// Only maps fields that are present in updates — safe even if columns don't exist yet
function toPartialRow(updates: Partial<Lead>): Record<string, unknown> {
  const map: Record<keyof Lead, string> = {
    id: 'id', name: 'name', channel: 'channel', temperature: 'temperature',
    program: 'program', status: 'status', lastContact: 'last_contact',
    nextFollowUp: 'next_follow_up', value: 'value', probability: 'probability',
    notes: 'notes', createdAt: 'created_at', wonAt: 'won_at', lostAt: 'lost_at',
    nextAction: 'next_action', nextActionPriority: 'next_action_priority',
    photoUrl: 'photo_url', instagramHandle: 'instagram_handle',
    paidAt: 'paid_at',
  }
  const row: Record<string, unknown> = {}
  for (const [k, col] of Object.entries(map)) {
    if (k in updates) row[col] = (updates as Record<string, unknown>)[k] ?? null
  }
  return row
}

function activityToRow(a: LeadActivity, userId: string) {
  return {
    id: a.id, user_id: userId, lead_id: a.leadId,
    type: a.type, content: a.content, created_at: a.createdAt,
  }
}

interface LeadStore {
  leads: Lead[]
  activities: LeadActivity[]
  hydrate: (leads: Lead[], activities?: LeadActivity[]) => void
  addLead: (lead: Omit<Lead, 'id' | 'createdAt' | 'probability'>) => Promise<void>
  updateLead: (id: string, updates: Partial<Lead>) => Promise<void>
  deleteLead: (id: string) => Promise<void>
  markContacted: (id: string) => Promise<void>
  advanceStage: (id: string, status: LeadStatus) => Promise<void>
  wonLead: (id: string) => Promise<void>
  lostLead: (id: string) => Promise<void>
  setFollowUp: (id: string, date: string) => Promise<void>
  addActivity: (leadId: string, type: ActivityType, content: string) => Promise<void>
  getLeadActivities: (leadId: string) => LeadActivity[]
}

export const useLeadStore = create<LeadStore>((set, get) => ({
  leads: [],
  activities: [],

  hydrate: (leads, activities = []) => set({ leads, activities }),

  getLeadActivities: (leadId) => get().activities
    .filter(a => a.leadId === leadId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),

  addLead: async (lead) => {
    const id = crypto.randomUUID()
    const createdAt = new Date().toISOString().split('T')[0]
    const probability = STAGE_PROBABILITY[lead.status] ?? 10
    const full: Lead = { ...lead, id, createdAt, probability }
    set(s => ({ leads: [...s.leads, full] }))
    const { data: { session } } = await supabase.auth.getSession()
    const userId = session?.user?.id
    if (!userId) return
    await supabase.from('leads').insert(toRow(full, userId))
  },

  updateLead: async (id, updates) => {
    set(s => ({ leads: s.leads.map(l => l.id === id ? { ...l, ...updates } : l) }))
    const row = toPartialRow(updates)
    if (Object.keys(row).length === 0) return
    const { error } = await supabase.from('leads').update(row).eq('id', id)
    if (error) console.error('[leadStore] updateLead failed:', error.message, row)
    else showSaved()
  },

  deleteLead: async (id) => {
    set(s => ({ leads: s.leads.filter(l => l.id !== id) }))
    await supabase.from('leads').delete().eq('id', id)
  },

  markContacted: async (id) => {
    const today = new Date().toISOString().split('T')[0]
    set(s => ({ leads: s.leads.map(l => l.id === id ? { ...l, status: 'contacted', lastContact: today, probability: STAGE_PROBABILITY['contacted'] } : l) }))
    await supabase.from('leads').update({ status: 'contacted', last_contact: today, probability: STAGE_PROBABILITY['contacted'] }).eq('id', id)
    await get().addActivity(id, 'contact', 'Gecontacteerd')
  },

  advanceStage: async (id, status) => {
    const probability = STAGE_PROBABILITY[status]
    const today = new Date().toISOString().split('T')[0]
    set(s => ({ leads: s.leads.map(l => l.id === id ? { ...l, status, probability, lastContact: today } : l) }))
    await supabase.from('leads').update({ status, probability, last_contact: today }).eq('id', id)
    const labels: Record<LeadStatus, string> = { new: 'Nieuw', contacted: 'Gecontacteerd', discovery: 'Discovery', proposal: 'Voorstel verstuurd', negotiation: 'Onderhandeling', won: 'Gewonnen', lost: 'Verloren' }
    await get().addActivity(id, 'status_change', `Stage → ${labels[status]}`)
    showSaved(`Stage: ${labels[status]}`)
  },

  wonLead: async (id) => {
    const now = new Date().toISOString()
    set(s => ({ leads: s.leads.map(l => l.id === id ? { ...l, status: 'won', wonAt: now, probability: 100 } : l) }))
    await supabase.from('leads').update({ status: 'won', won_at: now, probability: 100 }).eq('id', id)
    await get().addActivity(id, 'status_change', '🎉 Deal gewonnen!')
    showSaved('Deal gewonnen!')

    // Emit automation event — triggers any matching workflows (e.g. onboarding-1on1)
    const wonLead = get().leads.find(l => l.id === id)
    if (wonLead) {
      emit('deal.won', {
        leadId: id,
        leadName: wonLead.name,
        companyName: '',
        email: '',
        phone: '',
        vatNumber: '',
        program: wonLead.program,
        value: wonLead.value,
        channel: wonLead.channel,
        notes: wonLead.notes ?? '',
        wonAt: now,
      })
    }

    // Auto-create finance record (skip if one already exists for this lead)
    const lead = get().leads.find(l => l.id === id)
    if (lead) {
      const existing = useSalesFinanceStore.getState().records.find(r => r.leadId === id)
      if (!existing) {
        const vatRate = 21
        const { vatAmount, totalInclVat } = calcVat(lead.value, vatRate)
        await useSalesFinanceStore.getState().addRecord({
          leadId: id,
          clientName: lead.name,
          companyName: '',
          email: '',
          vatNumber: '',
          vatRegime: 'normaal',
          service: lead.program,
          channel: lead.channel,
          invoiceNumber: '',
          amountExclVat: lead.value,
          vatRate,
          vatAmount,
          totalInclVat,
          invoiced: false,
          paid: false,
          vatReceived: false,
          kmoRequested: false,
          kmoApproved: false,
          kmoReceived: false,
          kmoAmount: 0,
          wonAt: now,
          notes: lead.notes ?? '',
        })
      }
    }
  },

  lostLead: async (id) => {
    const now = new Date().toISOString()
    set(s => ({ leads: s.leads.map(l => l.id === id ? { ...l, status: 'lost', lostAt: now, probability: 0 } : l) }))
    await supabase.from('leads').update({ status: 'lost', lost_at: now, probability: 0 }).eq('id', id)
    await get().addActivity(id, 'status_change', 'Deal verloren')
    showSaved('Deal verloren')
  },

  setFollowUp: async (id, date) => {
    set(s => ({ leads: s.leads.map(l => l.id === id ? { ...l, nextFollowUp: date } : l) }))
    await supabase.from('leads').update({ next_follow_up: date }).eq('id', id)
    showSaved('Follow-up opgeslagen')
  },

  addActivity: async (leadId, type, content) => {
    const { data: { session } } = await supabase.auth.getSession()
    const userId = session?.user?.id
    if (!userId) return
    const id = crypto.randomUUID()
    const createdAt = new Date().toISOString()
    const activity: LeadActivity = { id, leadId, type, content, createdAt }
    set(s => ({ activities: [activity, ...s.activities] }))
    await supabase.from('lead_activities').insert(activityToRow(activity, userId))
  },
}))

export async function seedLeadsIfEmpty(userId: string) {
  const { data } = await supabase.from('leads').select('id').eq('user_id', userId).limit(1)
  if (data && data.length > 0) return
  await supabase.from('leads').insert(seedLeads.map(l => toRow(l, userId)))
}
