import { useState } from 'react'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { Plus, X } from 'lucide-react'

// ── Lichte sales-pipeline per project (los van de centrale CRM) ──
type LeadStatus = 'nieuw' | 'gesprek' | 'voorstel' | 'gewonnen' | 'verloren'

const STATUSES: { id: LeadStatus; label: string; color: string }[] = [
  { id: 'nieuw',    label: 'Nieuw',    color: 'var(--color-subtle)' },
  { id: 'gesprek',  label: 'Gesprek',  color: 'var(--pf-depth-text)' },
  { id: 'voorstel', label: 'Voorstel', color: 'var(--pf-depth-text)' },
  { id: 'gewonnen', label: 'Gewonnen', color: 'var(--pf-depth-text)' },
  { id: 'verloren', label: 'Verloren', color: 'var(--color-border)' },
]

interface Lead {
  id: string
  name: string
  service: string
  value: number
  status: LeadStatus
  createdAt: string
}

interface ProjectSalesStore {
  leads: Lead[]
  addLead: (name: string, service: string, value: number) => void
  setStatus: (id: string, status: LeadStatus) => void
  removeLead: (id: string) => void
}

type SalesHook = ReturnType<typeof makeSalesStore>

function makeSalesStore(storageName: string) {
  return create<ProjectSalesStore>()(
    persist(
      (set) => ({
        leads: [],
        addLead: (name, service, value) => set(s => ({
          leads: [{ id: crypto.randomUUID(), name: name.trim(), service: service.trim(), value, status: 'nieuw' as LeadStatus, createdAt: new Date().toISOString() }, ...s.leads],
        })),
        setStatus: (id, status) => set(s => ({ leads: s.leads.map(l => l.id === id ? { ...l, status } : l) })),
        removeLead: (id) => set(s => ({ leads: s.leads.filter(l => l.id !== id) })),
      }),
      { name: storageName }
    )
  )
}

const salesStores = new Map<string, SalesHook>()
function getSalesStore(projectId: string): SalesHook {
  let store = salesStores.get(projectId)
  if (!store) {
    store = makeSalesStore(`project-sales-${projectId}-v1`)
    salesStores.set(projectId, store)
  }
  return store
}

const eur = (n: number) => `€${n.toLocaleString('nl-BE')}`

function Stat({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="card" style={{ padding: '16px 18px', flex: 1, minWidth: 130 }}>
      <p style={{ fontSize: 10, fontWeight: 500, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--color-subtle)', fontFamily: 'var(--font-mono)', marginBottom: 6 }}>{label}</p>
      <p style={{ fontSize: 22, fontWeight: 500, letterSpacing: '-0.02em', color: 'var(--color-ink)', lineHeight: 1 }}>{value}</p>
      <p style={{ fontSize: 10.5, color: 'var(--color-subtle)', marginTop: 5 }}>{sub}</p>
    </div>
  )
}

export function ProjectSales({ projectId, projectName }: { projectId: string; projectName: string }) {
  const useSales = getSalesStore(projectId)
  const { leads, addLead, setStatus, removeLead } = useSales()
  const [name, setName] = useState('')
  const [service, setService] = useState('')
  const [value, setValue] = useState('')

  const open = leads.filter(l => l.status !== 'gewonnen' && l.status !== 'verloren')
  const won = leads.filter(l => l.status === 'gewonnen')
  const pipelineValue = open.reduce((sum, l) => sum + l.value, 0)
  const wonValue = won.reduce((sum, l) => sum + l.value, 0)

  function handleAdd() {
    if (!name.trim()) return
    addLead(name, service, Number(value) || 0)
    setName(''); setService(''); setValue('')
  }

  return (
    <div style={{ maxWidth: 760 }}>
      <div style={{ marginBottom: 30 }}>
        <h1 style={{ fontSize: 24, fontWeight: 500, letterSpacing: '-0.02em', color: 'var(--color-ink)', lineHeight: 1.2, marginBottom: 4 }}>
          Sales · {projectName}
        </h1>
        <p style={{ fontSize: 12, color: 'var(--color-subtle)', fontFamily: 'var(--font-mono)' }}>
          Eenvoudige pipeline voor dit project
        </p>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <Stat label="Pipeline" value={eur(pipelineValue)} sub={`${open.length} open lead${open.length === 1 ? '' : 's'}`} />
        <Stat label="Gewonnen" value={eur(wonValue)} sub={`${won.length} deal${won.length === 1 ? '' : 's'}`} />
      </div>

      <div className="card" style={{ padding: '18px 20px', marginBottom: 16 }}>
        <p style={{ fontSize: 10, fontWeight: 500, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--color-subtle)', fontFamily: 'var(--font-mono)', marginBottom: 10 }}>Nieuwe lead</p>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <input className="input" style={{ flex: 2, minWidth: 140 }} placeholder="Naam" value={name} onChange={e => setName(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAdd()} />
          <input className="input" style={{ flex: 2, minWidth: 140 }} placeholder="Dienst of aanbod" value={service} onChange={e => setService(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAdd()} />
          <input className="input" style={{ flex: 1, minWidth: 90 }} placeholder="€" type="number" value={value} onChange={e => setValue(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAdd()} />
          <button className="btn-primary" disabled={!name.trim()} onClick={handleAdd} style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
            <Plus size={13} /> Toevoegen
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {leads.length === 0 && (
          <div className="card" style={{ padding: '26px 20px', textAlign: 'center' }}>
            <p style={{ fontSize: 12.5, color: 'var(--color-subtle)' }}>Nog geen leads. Voeg hierboven je eerste toe.</p>
          </div>
        )}
        {leads.map(lead => {
          const cfg = STATUSES.find(s => s.id === lead.status)!
          const closed = lead.status === 'gewonnen' || lead.status === 'verloren'
          return (
            <div key={lead.id} className="card" style={{ padding: '13px 16px', display: 'flex', alignItems: 'center', gap: 12, opacity: lead.status === 'verloren' ? 0.55 : 1 }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: cfg.color, flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 13.5, fontWeight: 500, color: 'var(--color-ink)', letterSpacing: '-0.01em' }}>{lead.name}</p>
                {lead.service && <p style={{ fontSize: 11.5, color: 'var(--color-subtle)', marginTop: 1 }}>{lead.service}</p>}
              </div>
              <span style={{ fontSize: 13, fontWeight: 500, color: closed ? 'var(--color-subtle)' : 'var(--color-ink)', fontVariantNumeric: 'tabular-nums' }}>
                {lead.value > 0 ? eur(lead.value) : ''}
              </span>
              <select
                className="input"
                style={{ width: 118, fontSize: 12, padding: '6px 10px' }}
                value={lead.status}
                onChange={e => setStatus(lead.id, e.target.value as LeadStatus)}
              >
                {STATUSES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
              </select>
              <button onClick={() => removeLead(lead.id)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--color-subtle)', padding: 2 }}>
                <X size={13} />
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
