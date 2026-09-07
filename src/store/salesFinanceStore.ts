import { create } from 'zustand'
import { supabase } from '../lib/supabase'
import { showSaved } from '../components/SaveToast'

export type VatRegime = 'normaal' | 'medecontractant' | 'vrijgesteld' | 'buiten-eu' | 'intracommunautair'

export const VAT_REGIME_LABEL: Record<VatRegime, string> = {
  'normaal':           'Normaal (21%/12%/6%)',
  'medecontractant':   'Medecontractant — klant verlegt btw',
  'vrijgesteld':       'Vrijgesteld van btw',
  'intracommunautair': 'Intracommunautair (EU)',
  'buiten-eu':         'Buiten de EU',
}

export interface SalesFinanceRecord {
  id: string
  leadId: string
  clientName: string
  companyName: string
  email: string
  vatNumber: string          // BTW-nummer klant, bv. BE0123456789
  vatRegime: VatRegime       // BTW-regime
  service: string
  channel: string
  invoiceNumber: string
  amountExclVat: number
  vatRate: number            // 0 | 6 | 12 | 21
  vatAmount: number
  totalInclVat: number
  invoiced: boolean
  invoicedAt?: string
  paid: boolean
  paidAt?: string
  vatReceived: boolean
  vatReceivedAt?: string
  kmoRequested: boolean
  kmoRequestedAt?: string
  kmoApproved: boolean
  kmoApprovedAt?: string
  kmoReceived: boolean
  kmoReceivedAt?: string
  kmoAmount: number
  wonAt: string
  notes: string
  createdAt: string
}

// Encode vatNumber + vatRegime into the notes field prefix so no DB migration is needed.
// Format: "##BTW|BE0123456789|medecontractant##\n" followed by actual notes.
const VAT_PREFIX_RE = /^##BTW\|([^|]*)\|([^#]*)##\n?/

function encodeNotes(r: SalesFinanceRecord): string {
  if (!r.vatNumber && r.vatRegime === 'normaal') return r.notes
  return `##BTW|${r.vatNumber}|${r.vatRegime}##\n${r.notes}`
}

function decodeNotes(raw: string): { vatNumber: string; vatRegime: VatRegime; notes: string } {
  const m = raw.match(VAT_PREFIX_RE)
  if (m) return { vatNumber: m[1], vatRegime: m[2] as VatRegime, notes: raw.slice(m[0].length) }
  return { vatNumber: '', vatRegime: 'normaal', notes: raw }
}

function toRow(r: SalesFinanceRecord, userId: string) {
  return {
    id: r.id, user_id: userId, lead_id: r.leadId || null,
    client_name: r.clientName, company_name: r.companyName,
    email: r.email, service: r.service, channel: r.channel,
    invoice_number: r.invoiceNumber,
    amount_excl_vat: r.amountExclVat, vat_rate: r.vatRate,
    vat_amount: r.vatAmount, total_incl_vat: r.totalInclVat,
    invoiced: r.invoiced, invoiced_at: r.invoicedAt ?? null,
    paid: r.paid, paid_at: r.paidAt ?? null,
    vat_received: r.vatReceived, vat_received_at: r.vatReceivedAt ?? null,
    kmo_requested: r.kmoRequested, kmo_requested_at: r.kmoRequestedAt ?? null,
    kmo_approved: r.kmoApproved, kmo_approved_at: r.kmoApprovedAt ?? null,
    kmo_received: r.kmoReceived, kmo_received_at: r.kmoReceivedAt ?? null,
    kmo_amount: r.kmoAmount, won_at: r.wonAt,
    notes: encodeNotes(r), created_at: r.createdAt,
  }
}

export function fromRow(r: any): SalesFinanceRecord {
  const { vatNumber, vatRegime, notes } = decodeNotes(r.notes ?? '')
  return {
    id: r.id, leadId: r.lead_id ?? '',
    clientName: r.client_name, companyName: r.company_name ?? '',
    email: r.email ?? '', vatNumber, vatRegime,
    service: r.service, channel: r.channel ?? '',
    invoiceNumber: r.invoice_number ?? '',
    amountExclVat: r.amount_excl_vat, vatRate: r.vat_rate ?? 21,
    vatAmount: r.vat_amount, totalInclVat: r.total_incl_vat,
    invoiced: r.invoiced ?? false, invoicedAt: r.invoiced_at ?? undefined,
    paid: r.paid ?? false, paidAt: r.paid_at ?? undefined,
    vatReceived: r.vat_received ?? false, vatReceivedAt: r.vat_received_at ?? undefined,
    kmoRequested: r.kmo_requested ?? false, kmoRequestedAt: r.kmo_requested_at ?? undefined,
    kmoApproved: r.kmo_approved ?? false, kmoApprovedAt: r.kmo_approved_at ?? undefined,
    kmoReceived: r.kmo_received ?? false, kmoReceivedAt: r.kmo_received_at ?? undefined,
    kmoAmount: r.kmo_amount ?? 0, wonAt: r.won_at,
    notes, createdAt: r.created_at,
  }
}

export function calcVat(amountExcl: number, vatRate: number) {
  const vatAmount    = Math.round(amountExcl * (vatRate / 100) * 100) / 100
  const totalInclVat = Math.round((amountExcl + vatAmount) * 100) / 100
  return { vatAmount, totalInclVat }
}

interface SalesFinanceStore {
  records: SalesFinanceRecord[]
  hydrate: (records: SalesFinanceRecord[]) => void
  addRecord: (record: Omit<SalesFinanceRecord, 'id' | 'createdAt'>) => Promise<SalesFinanceRecord>
  updateRecord: (id: string, updates: Partial<SalesFinanceRecord>) => Promise<void>
  deleteRecord: (id: string) => Promise<void>
  // Checkbox toggles with auto-timestamps
  toggleInvoiced:     (id: string, invoiceNumber?: string) => Promise<void>
  togglePaid:         (id: string) => Promise<void>
  toggleVatReceived:  (id: string) => Promise<void>
  toggleKmoRequested: (id: string) => Promise<void>
  toggleKmoApproved:  (id: string) => Promise<void>
  toggleKmoReceived:  (id: string) => Promise<void>
}

export const useSalesFinanceStore = create<SalesFinanceStore>((set, get) => ({
  records: [],

  hydrate: (records) => set({ records }),

  addRecord: async (record) => {
    const id = crypto.randomUUID()
    const createdAt = new Date().toISOString()
    const full: SalesFinanceRecord = { ...record, id, createdAt }
    set(s => ({ records: [full, ...s.records] }))
    const { data: { session } } = await supabase.auth.getSession()
    const userId = session?.user?.id
    if (userId) await supabase.from('sales_finance_records').insert(toRow(full, userId))
    return full
  },

  updateRecord: async (id, updates) => {
    set(s => ({ records: s.records.map(r => r.id === id ? { ...r, ...updates } : r) }))
    const record = get().records.find(r => r.id === id)
    if (!record) return
    const { data: { session } } = await supabase.auth.getSession()
    const userId = session?.user?.id
    if (!userId) return
    const { id: _id, user_id: _uid, ...row } = { ...toRow(record, userId) }
    const { error } = await supabase.from('sales_finance_records').update(row).eq('id', id)
    if (!error) showSaved()
  },

  deleteRecord: async (id) => {
    set(s => ({ records: s.records.filter(r => r.id !== id) }))
    await supabase.from('sales_finance_records').delete().eq('id', id)
  },

  toggleInvoiced: async (id, invoiceNumber) => {
    const r = get().records.find(r => r.id === id)
    if (!r) return
    const now = new Date().toISOString()
    const updates: Partial<SalesFinanceRecord> = r.invoiced
      ? { invoiced: false, invoicedAt: undefined }
      : { invoiced: true, invoicedAt: now, invoiceNumber: invoiceNumber ?? r.invoiceNumber }
    await get().updateRecord(id, updates)
  },

  togglePaid: async (id) => {
    const r = get().records.find(r => r.id === id)
    if (!r) return
    const now = new Date().toISOString()
    const updates: Partial<SalesFinanceRecord> = r.paid
      ? { paid: false, paidAt: undefined }
      : { paid: true, paidAt: now }
    await get().updateRecord(id, updates)
  },

  toggleVatReceived: async (id) => {
    const r = get().records.find(r => r.id === id)
    if (!r) return
    const now = new Date().toISOString()
    const updates: Partial<SalesFinanceRecord> = r.vatReceived
      ? { vatReceived: false, vatReceivedAt: undefined }
      : { vatReceived: true, vatReceivedAt: now }
    await get().updateRecord(id, updates)
  },

  toggleKmoRequested: async (id) => {
    const r = get().records.find(r => r.id === id)
    if (!r) return
    const now = new Date().toISOString()
    const updates: Partial<SalesFinanceRecord> = r.kmoRequested
      ? { kmoRequested: false, kmoRequestedAt: undefined }
      : { kmoRequested: true, kmoRequestedAt: now }
    await get().updateRecord(id, updates)
  },

  toggleKmoApproved: async (id) => {
    const r = get().records.find(r => r.id === id)
    if (!r) return
    const now = new Date().toISOString()
    const updates: Partial<SalesFinanceRecord> = r.kmoApproved
      ? { kmoApproved: false, kmoApprovedAt: undefined }
      : { kmoApproved: true, kmoApprovedAt: now }
    await get().updateRecord(id, updates)
  },

  toggleKmoReceived: async (id) => {
    const r = get().records.find(r => r.id === id)
    if (!r) return
    const now = new Date().toISOString()
    const updates: Partial<SalesFinanceRecord> = r.kmoReceived
      ? { kmoReceived: false, kmoReceivedAt: undefined }
      : { kmoReceived: true, kmoReceivedAt: now, kmoAmount: r.kmoAmount }
    await get().updateRecord(id, updates)
  },
}))

export async function seedSalesFinanceIfEmpty(_userId: string) {
  // No seed data needed — records are created from won leads
}
