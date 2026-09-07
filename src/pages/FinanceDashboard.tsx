import { useState, useMemo } from 'react'
import { useSalesFinanceStore } from '../store/salesFinanceStore'
import type { SalesFinanceRecord } from '../store/salesFinanceStore'
import { calcVat } from '../store/salesFinanceStore'
import { useRecurringInvoiceStore, isDueThisMonth } from '../store/recurringInvoiceStore'
import type { RecurringInvoice, RecurringFrequency } from '../store/recurringInvoiceStore'
import { X, AlertCircle, ChevronRight, TrendingUp, Clock, CheckCircle2, Receipt, Banknote, FileText, Award, Edit2, Save, Trash2, RefreshCw, Plus } from 'lucide-react'

/* ── Helpers ─────────────────────────────────────────────────────────── */
const fmt = (n: number) =>
  new Intl.NumberFormat('nl-BE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n)

const fmtDate = (iso?: string) =>
  iso ? new Date(iso).toLocaleDateString('nl-BE', { day: '2-digit', month: 'short', year: '2-digit' }) : '—'

const daysSince = (iso?: string) =>
  iso ? Math.floor((Date.now() - new Date(iso).getTime()) / 86400000) : 0

type Filter = 'all' | 'te-factureren' | 'openstaand' | 'betaald' | 'btw' | 'kmo'

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all',          label: 'All' },
  { key: 'te-factureren',label: 'To invoice' },
  { key: 'openstaand',   label: 'Outstanding' },
  { key: 'betaald',      label: 'Paid' },
  { key: 'btw',          label: 'Track VAT' },
  { key: 'kmo',          label: 'Track SME' },
]


/* ── KPI Card ────────────────────────────────────────────────────────── */
function KpiCard({ label, value, sub, color, icon: Icon, alert }: {
  label: string; value: string; sub?: string; color: string; icon: typeof TrendingUp; alert?: boolean
}) {
  return (
    <div style={{
      background: 'var(--color-card)', border: `1px solid ${alert ? 'rgba(239,68,68,0.3)' : 'var(--color-border)'}`,
      borderRadius: 16, padding: '18px 20px', minWidth: 0,
      borderTop: `3px solid ${color}`,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--color-subtle)' }}>{label}</span>
        <div style={{ width: 28, height: 28, borderRadius: 16, background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={13} color={color} />
        </div>
      </div>
      <p style={{ fontSize: 22, fontWeight: 800, color: alert ? '#c4736a' : 'var(--color-ink)', fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.03em', lineHeight: 1 }}>{value}</p>
      {sub && <p style={{ fontSize: 11, color: 'var(--color-subtle)', marginTop: 5 }}>{sub}</p>}
    </div>
  )
}

/* ── Pipeline step ───────────────────────────────────────────────────── */
function PipelineStep({ done, label, date, onClick, color = '#4C6481', disabled }: {
  done: boolean; label: string; date?: string; onClick: () => void; color?: string; disabled?: boolean
}) {
  return (
    <button
      onClick={e => { e.stopPropagation(); if (!disabled) onClick() }}
      title={done ? `${label} — klik om ongedaan te maken` : `Klik om ${label.toLowerCase()} te markeren`}
      style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
        background: 'none', border: 'none', cursor: disabled ? 'default' : 'pointer', padding: '4px 6px',
        opacity: disabled ? 0.3 : 1,
      }}
    >
      <div style={{
        width: 28, height: 28, borderRadius: '50%',
        background: done ? `${color}20` : 'rgba(255,255,255,0.04)',
        border: `2px solid ${done ? color : 'rgba(255,255,255,0.12)'}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'all 150ms',
      }}>
        {done
          ? <CheckCircle2 size={13} color={color} />
          : <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'rgba(255,255,255,0.2)' }} />
        }
      </div>
      <span style={{ fontSize: 9, fontWeight: 600, color: done ? color : 'var(--color-subtle)', whiteSpace: 'nowrap', letterSpacing: '0.05em' }}>
        {label}
      </span>
      {done && date && (
        <span style={{ fontSize: 8, color: 'var(--color-subtle)' }}>{fmtDate(date)}</span>
      )}
    </button>
  )
}

/* ── Record Row ──────────────────────────────────────────────────────── */
function RecordRow({ record, onClick }: { record: SalesFinanceRecord; onClick: () => void }) {
  const { toggleInvoiced, togglePaid, toggleVatReceived, toggleKmoRequested, toggleKmoApproved, toggleKmoReceived } = useSalesFinanceStore()

  const invoiceAge   = record.invoiced && !record.paid ? daysSince(record.invoicedAt) : 0
  const isOverdue    = invoiceAge > 14
  const progress     = [record.invoiced, record.paid, record.vatReceived, record.kmoRequested && record.kmoAmount > 0, record.kmoReceived].filter(Boolean).length
  const total        = record.kmoAmount > 0 ? 5 : 3

  return (
    <div
      onClick={onClick}
      style={{
        background: 'var(--color-card)',
        border: `1px solid ${isOverdue ? 'rgba(239,68,68,0.35)' : 'var(--color-border)'}`,
        borderRadius: 14, padding: '16px 20px', cursor: 'pointer',
        transition: 'transform 0.12s, box-shadow 0.12s',
        position: 'relative', overflow: 'hidden',
      }}
      onMouseEnter={e => { const el = e.currentTarget as HTMLDivElement; el.style.transform = 'translateY(-1px)'; el.style.boxShadow = '0 6px 20px rgba(0,0,0,0.12)' }}
      onMouseLeave={e => { const el = e.currentTarget as HTMLDivElement; el.style.transform = ''; el.style.boxShadow = '' }}
    >
      {/* Overdue stripe */}
      {isOverdue && <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: 'var(--color-border)' }} />}

      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        {/* Avatar */}
        <div style={{ width: 42, height: 42, borderRadius: '50%', background: `${record.paid ? '#4C6481' : '#7C7F84'}18`, border: `2px solid ${record.paid ? 'rgba(76,100,129,0.3)' : 'var(--color-border)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <span style={{ fontSize: 16, fontWeight: 700, color: record.paid ? '#4C6481' : 'var(--color-muted)' }}>{record.clientName[0]?.toUpperCase()}</span>
        </div>

        {/* Client + service */}
        <div style={{ minWidth: 0, flex: '0 0 180px' }}>
          <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-ink)', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{record.clientName}</p>
          <p style={{ fontSize: 11, color: 'var(--color-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{record.service}</p>
        </div>

        {/* Amount block */}
        <div style={{ flex: '0 0 120px', textAlign: 'right' }}>
          <p style={{ fontSize: 15, fontWeight: 800, color: record.paid ? '#4C6481' : 'var(--color-ink)', fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.02em' }}>{fmt(record.totalInclVat)}</p>
          <p style={{ fontSize: 10, color: 'var(--color-subtle)', marginTop: 1 }}>excl. {fmt(record.amountExclVat)}</p>
        </div>

        {/* Pipeline steps — clickable */}
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2 }} onClick={e => e.stopPropagation()}>
          <PipelineStep done={true} label="WON" date={record.wonAt} onClick={() => {}} disabled color="#7C7F84" />
          <div style={{ width: 16, height: 1, background: 'var(--color-border)', flexShrink: 0 }} />
          <PipelineStep done={record.invoiced} label="INVOICE" date={record.invoicedAt} onClick={() => toggleInvoiced(record.id)} color="#7C7F84" />
          <div style={{ width: 16, height: 1, background: 'var(--color-border)', flexShrink: 0 }} />
          <PipelineStep done={record.paid} label="PAID" date={record.paidAt} onClick={() => togglePaid(record.id)} color="#4C6481" />
          <div style={{ width: 16, height: 1, background: 'var(--color-border)', flexShrink: 0 }} />
          <PipelineStep done={record.vatReceived} label="VAT" date={record.vatReceivedAt} onClick={() => toggleVatReceived(record.id)} color="#7AACCF" />
          {record.kmoAmount > 0 && <>
            <div style={{ width: 16, height: 1, background: 'var(--color-border)', flexShrink: 0 }} />
            <PipelineStep done={record.kmoRequested} label="SME REQ." date={record.kmoRequestedAt} onClick={() => toggleKmoRequested(record.id)} color="#38BDF8" />
            <div style={{ width: 16, height: 1, background: 'var(--color-border)', flexShrink: 0 }} />
            <PipelineStep done={record.kmoApproved} label="SME APPR." date={record.kmoApprovedAt} onClick={() => toggleKmoApproved(record.id)} color="#38BDF8" />
            <div style={{ width: 16, height: 1, background: 'var(--color-border)', flexShrink: 0 }} />
            <PipelineStep done={record.kmoReceived} label="SME REC." date={record.kmoReceivedAt} onClick={() => toggleKmoReceived(record.id)} color="#38BDF8" />
          </>}
        </div>

        {/* Alerts + meta */}
        <div style={{ flex: '0 0 100px', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
          {isOverdue && (
            <span style={{ fontSize: 10, fontWeight: 700, color: '#c4736a', display: 'flex', alignItems: 'center', gap: 4, background: 'rgba(239,68,68,0.1)', padding: '2px 7px', borderRadius: 99 }}>
              <AlertCircle size={9} /> {invoiceAge}d open
            </span>
          )}
          {record.kmoAmount > 0 && !record.kmoReceived && (
            <span style={{ fontSize: 10, fontWeight: 600, color: '#38BDF8', background: 'rgba(56,189,248,0.1)', padding: '2px 7px', borderRadius: 99 }}>
              KMO {fmt(record.kmoAmount)}
            </span>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <div style={{ width: 48, height: 4, borderRadius: 99, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
              <div style={{ width: `${(progress / total) * 100}%`, height: '100%', background: record.paid ? '#4C6481' : '#7C7F84', transition: 'width 0.3s', borderRadius: 99 }} />
            </div>
            <span style={{ fontSize: 9, color: 'var(--color-subtle)' }}>{progress}/{total}</span>
          </div>
          <ChevronRight size={12} color="var(--color-subtle)" />
        </div>
      </div>
    </div>
  )
}

/* ── Detail Modal ────────────────────────────────────────────────────── */
function RecordDetail({ record: initial, onClose }: { record: SalesFinanceRecord; onClose: () => void }) {
  const { records, updateRecord, deleteRecord, toggleInvoiced, togglePaid, toggleVatReceived, toggleKmoRequested, toggleKmoApproved, toggleKmoReceived } = useSalesFinanceStore()
  const [confirmDelete, setConfirmDelete] = useState(false)
  const record = records.find(r => r.id === initial.id) ?? initial

  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState({
    companyName: record.companyName,
    email: record.email,
    invoiceNumber: record.invoiceNumber,
    vatRate: record.vatRate,
    kmoAmount: String(record.kmoAmount),
    notes: record.notes,
  })

  const saveDraft = () => {
    const kmoAmount = parseFloat(draft.kmoAmount) || 0
    const { vatAmount, totalInclVat } = calcVat(record.amountExclVat, 21)
    updateRecord(record.id, {
      companyName: draft.companyName,
      email: draft.email,
      invoiceNumber: draft.invoiceNumber,
      vatRate: 21, vatAmount, totalInclVat,
      kmoAmount,
      notes: draft.notes,
    })
    setEditing(false)
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '8px 11px', borderRadius: 16,
    border: '1px solid var(--color-border)', background: 'rgba(255,255,255,0.04)',
    color: 'var(--color-ink)', fontSize: 13, outline: 'none', fontFamily: 'inherit',
    boxSizing: 'border-box',
  }

  const CheckRow = ({ done, label, date, onToggle, color = '#4C6481' }: {
    done: boolean; label: string; date?: string; onToggle: () => void; color?: string
  }) => (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--color-border)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <button
          onClick={onToggle}
          style={{ width: 22, height: 22, borderRadius: 14, border: `2px solid ${done ? color : 'rgba(255,255,255,0.2)'}`, background: done ? color : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 150ms', flexShrink: 0 }}
        >
          {done && <CheckCircle2 size={12} color={done ? '#0C0F16' : 'transparent'} />}
        </button>
        <span style={{ fontSize: 13, fontWeight: 500, color: done ? 'var(--color-ink)' : 'var(--color-muted)' }}>{label}</span>
      </div>
      {done && date && <span style={{ fontSize: 11, color: 'var(--color-subtle)' }}>{fmtDate(date)}</span>}
    </div>
  )

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 300, display: 'flex', justifyContent: 'flex-end' }} onClick={onClose}>
      <div style={{ width: 520, height: '100%', background: 'var(--color-bg)', borderLeft: '1px solid var(--color-border)', overflowY: 'auto', boxShadow: '-20px 0 80px rgba(0,0,0,0.2)', display: 'flex', flexDirection: 'column' }} onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div style={{ padding: '28px 32px 20px', borderBottom: '1px solid var(--color-border)', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <div>
              <h2 style={{ fontSize: 22, fontWeight: 700, color: 'var(--color-ink)', marginBottom: 4 }}>{record.clientName}</h2>
              <p style={{ fontSize: 12, color: 'var(--color-subtle)' }}>{record.service} · gewonnen {fmtDate(record.wonAt)}</p>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setEditing(e => !e)} style={{ width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', background: editing ? 'var(--color-accent)' : 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 16, cursor: 'pointer', color: editing ? '#fff' : 'var(--color-muted)' }}>
                <Edit2 size={13} />
              </button>
              <button onClick={() => setConfirmDelete(true)} style={{ width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--color-surface)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 16, cursor: 'pointer', color: '#c4736a' }}>
                <Trash2 size={13} />
              </button>
              <button onClick={onClose} style={{ width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 16, cursor: 'pointer', color: 'var(--color-muted)' }}>
                <X size={13} />
              </button>
            </div>
          </div>

          {/* Amount summary */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginTop: 20 }}>
            {[
              { label: 'Excl. BTW', value: fmt(record.amountExclVat), color: 'var(--color-ink)' },
              { label: `BTW ${record.vatRate}%`, value: fmt(record.vatAmount), color: '#7AACCF' },
              { label: 'Incl. BTW', value: fmt(record.totalInclVat), color: record.paid ? '#4C6481' : 'var(--color-accent)' },
            ].map(({ label, value, color }) => (
              <div key={label} style={{ padding: '12px 14px', borderRadius: 16, background: 'var(--color-surface)', border: '1px solid var(--color-border)', textAlign: 'center' }}>
                <p style={{ fontSize: 9, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--color-subtle)', marginBottom: 6 }}>{label}</p>
                <p style={{ fontSize: 16, fontWeight: 700, color, fontVariantNumeric: 'tabular-nums' }}>{value}</p>
              </div>
            ))}
          </div>
        </div>

        <div style={{ padding: '20px 32px', flex: 1 }}>
          {/* Edit form */}
          {editing ? (
            <div style={{ marginBottom: 24 }}>
              <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--color-subtle)', marginBottom: 12 }}>Client details</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <input style={inputStyle} placeholder="Company name" value={draft.companyName} onChange={e => setDraft(d => ({ ...d, companyName: e.target.value }))} />
                <input style={inputStyle} placeholder="Email address" type="email" value={draft.email} onChange={e => setDraft(d => ({ ...d, email: e.target.value }))} />
                <input style={inputStyle} placeholder="Invoice number" value={draft.invoiceNumber} onChange={e => setDraft(d => ({ ...d, invoiceNumber: e.target.value }))} />
                <input style={inputStyle} placeholder="SME portfolio amount (€)" type="number" value={draft.kmoAmount} onChange={e => setDraft(d => ({ ...d, kmoAmount: e.target.value }))} />
                <textarea style={{ ...inputStyle, height: 72, resize: 'none' } as React.CSSProperties} placeholder="Notes" value={draft.notes} onChange={e => setDraft(d => ({ ...d, notes: e.target.value }))} />
                <button onClick={saveDraft} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '10px', borderRadius: 16, border: 'none', background: 'var(--color-accent)', color: 'var(--color-bg)', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                  <Save size={13} /> Save
                </button>
              </div>
            </div>
          ) : (
            /* Info display */
            record.companyName || record.email || record.invoiceNumber || record.vatNumber ? (
              <div style={{ marginBottom: 20, padding: '14px 16px', borderRadius: 12, background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
                {record.companyName && <p style={{ fontSize: 12, color: 'var(--color-muted)', marginBottom: 4 }}>{record.companyName}</p>}
                {record.email && <p style={{ fontSize: 12, color: 'var(--color-muted)', marginBottom: 4 }}>{record.email}</p>}
                {record.vatNumber && <p style={{ fontSize: 12, color: 'var(--color-muted)', marginBottom: 4 }}>BTW {record.vatNumber}</p>}
                {record.vatRegime && record.vatRegime !== 'normaal' && (
                  <p style={{ fontSize: 11, color: 'var(--color-subtle)', marginBottom: 4 }}>{VAT_REGIME_LABEL[record.vatRegime]}</p>
                )}
                {record.invoiceNumber && <p style={{ fontSize: 12, color: 'var(--color-muted)' }}>Factuur {record.invoiceNumber}</p>}
              </div>
            ) : (
              <button onClick={() => setEditing(true)} style={{ width: '100%', padding: '12px', borderRadius: 16, border: '1px dashed var(--color-border)', background: 'transparent', color: 'var(--color-subtle)', fontSize: 12, cursor: 'pointer', marginBottom: 20, fontFamily: 'inherit' }}>
                + Add company name, email &amp; invoice number
              </button>
            )
          )}

          {/* Status checkboxes */}
          <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--color-subtle)', marginBottom: 4 }}>Opvolgstatus</p>
          <CheckRow done={record.invoiced} label="Gefactureerd" date={record.invoicedAt} onToggle={() => toggleInvoiced(record.id)} color="#7C7F84" />
          <CheckRow done={record.paid} label="Betaald" date={record.paidAt} onToggle={() => togglePaid(record.id)} color="#4C6481" />
          <CheckRow done={record.vatReceived} label="BTW ontvangen" date={record.vatReceivedAt} onToggle={() => toggleVatReceived(record.id)} color="#7AACCF" />

          {/* KMO section */}
          <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--color-subtle)', marginTop: 20, marginBottom: 4 }}>KMO-Portefeuille</p>
          {record.kmoAmount > 0 ? (
            <>
              <div style={{ padding: '10px 14px', borderRadius: 16, background: 'rgba(56,189,248,0.06)', border: '1px solid rgba(56,189,248,0.2)', marginBottom: 8 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#38BDF8' }}>Bedrag: {fmt(record.kmoAmount)}</span>
              </div>
              <CheckRow done={record.kmoRequested} label="KMO-portefeuille aangevraagd" date={record.kmoRequestedAt} onToggle={() => toggleKmoRequested(record.id)} color="#38BDF8" />
              <CheckRow done={record.kmoApproved} label="KMO-portefeuille goedgekeurd" date={record.kmoApprovedAt} onToggle={() => toggleKmoApproved(record.id)} color="#38BDF8" />
              <CheckRow done={record.kmoReceived} label="KMO-bedrag ontvangen" date={record.kmoReceivedAt} onToggle={() => toggleKmoReceived(record.id)} color="#38BDF8" />
            </>
          ) : (
            <button onClick={() => setEditing(true)} style={{ width: '100%', padding: '10px', borderRadius: 16, border: '1px dashed rgba(56,189,248,0.3)', background: 'rgba(56,189,248,0.04)', color: '#38BDF8', fontSize: 11, cursor: 'pointer', fontFamily: 'inherit' }}>
              + KMO-portefeuille bedrag instellen
            </button>
          )}

          {/* Notes */}
          {record.notes && !editing && (
            <div style={{ marginTop: 20, padding: '14px 16px', borderRadius: 12, background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
              <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--color-subtle)', marginBottom: 6 }}>Notities</p>
              <p style={{ fontSize: 12, color: 'var(--color-muted)', lineHeight: 1.6 }}>{record.notes}</p>
            </div>
          )}
        </div>
      </div>

      {/* Delete confirmation */}
      {confirmDelete && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 400, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setConfirmDelete(false)}>
          <div style={{ background: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: 18, padding: '28px 28px 24px', width: 320, boxShadow: '0 24px 80px rgba(0,0,0,0.3)' }} onClick={e => e.stopPropagation()}>
            <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
              <Trash2 size={18} color="#c4736a" />
            </div>
            <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-ink)', marginBottom: 6 }}>Delete this client?</p>
            <p style={{ fontSize: 13, color: 'var(--color-muted)', marginBottom: 24, lineHeight: 1.5 }}>
              <strong>{record.clientName}</strong> will be permanently removed from Finance. This cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setConfirmDelete(false)} style={{ flex: 1, padding: '10px', borderRadius: 16, border: '1px solid var(--color-border)', background: 'transparent', color: 'var(--color-muted)', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>
                Cancel
              </button>
              <button onClick={() => { deleteRecord(record.id); onClose() }} style={{ flex: 1, padding: '10px', borderRadius: 16, border: 'none', background: '#c4736a', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/* ── Recurring Invoice Components ───────────────────────────────────── */
const FREQ_LABEL: Record<RecurringFrequency, string> = {
  monthly: 'Maandelijks',
  quarterly: 'Per kwartaal',
  annual: 'Jaarlijks',
}

function RecurringCard({ item, onInvoiced, onEdit, onDelete, isDue }: {
  item: RecurringInvoice
  onInvoiced: () => void
  onEdit: () => void
  onDelete: () => void
  isDue: boolean
}) {
  const vatAmt = item.amountExclVat * (item.vatRate / 100)
  const total = item.amountExclVat + vatAmt
  const dueDate = new Date(item.nextDueDate)
  const isOverdue = dueDate < new Date()

  return (
    <div style={{
      background: 'var(--color-card)', border: '1px solid var(--color-border)',
      borderRadius: 14, padding: '16px 20px',
      display: 'flex', alignItems: 'center', gap: 16,
      borderLeft: `3px solid ${isOverdue ? '#c4736a' : 'var(--color-accent)'}`,
    }}>
      <div style={{ width: 36, height: 36, borderRadius: 16, background: isOverdue ? 'rgba(239,68,68,0.1)' : 'rgba(201,104,64,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <RefreshCw size={15} color={isOverdue ? '#c4736a' : 'var(--color-accent)'} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-ink)' }}>{item.clientName}</p>
          <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', padding: '2px 7px', borderRadius: 99, background: isOverdue ? 'rgba(239,68,68,0.12)' : 'rgba(201,104,64,0.1)', color: isOverdue ? '#c4736a' : 'var(--color-accent)' }}>
            {FREQ_LABEL[item.frequency]}
          </span>
        </div>
        <p style={{ fontSize: 12, color: 'var(--color-subtle)', marginTop: 2 }}>{item.service}</p>
        <p style={{ fontSize: 11, color: isOverdue ? '#c4736a' : 'var(--color-muted)', marginTop: 3 }}>
          {isOverdue ? 'Vervallen — ' : 'Vervaldatum '}
          {dueDate.toLocaleDateString('nl-BE', { day: '2-digit', month: 'short', year: 'numeric' })}
        </p>
      </div>
      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        <p style={{ fontSize: 16, fontWeight: 800, color: 'var(--color-ink)', letterSpacing: '-0.02em' }}>
          {fmt(item.amountExclVat)}
        </p>
        <p style={{ fontSize: 11, color: 'var(--color-subtle)' }}>
          excl. btw · {item.vatRate}% → {fmt(total)} incl.
        </p>
      </div>
      <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
        <button onClick={onEdit} title="Bewerken" style={{ width: 32, height: 32, borderRadius: 9, border: '1px solid var(--color-border)', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-muted)' }}>
          <Edit2 size={13} />
        </button>
        <button onClick={onDelete} title="Verwijderen" style={{ width: 32, height: 32, borderRadius: 9, border: '1px solid var(--color-border)', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-muted)' }}>
          <Trash2 size={13} />
        </button>
        {isDue ? (
          <button onClick={onInvoiced} style={{
            padding: '0 14px', height: 32, borderRadius: 9, border: 'none',
            background: isOverdue ? '#c4736a' : 'var(--color-accent)', color: '#fff',
            fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap',
          }}>
            Factureer
          </button>
        ) : (
          <span style={{ fontSize: 11, color: 'var(--color-subtle)', whiteSpace: 'nowrap', paddingRight: 4 }}>
            {dueDate.toLocaleDateString('nl-BE', { day: '2-digit', month: 'short' })}
          </span>
        )}
      </div>
    </div>
  )
}

const EMPTY_FORM = {
  clientName: '', service: '', amountExclVat: '', vatRate: '21',
  frequency: 'monthly' as RecurringFrequency, nextDueDate: '', notes: '',
}

function RecurringModal({ initial, onSave, onClose }: {
  initial?: RecurringInvoice
  onSave: (data: Omit<RecurringInvoice, 'id'>) => void
  onClose: () => void
}) {
  const [form, setForm] = useState({
    clientName: initial?.clientName ?? '',
    service: initial?.service ?? '',
    amountExclVat: initial ? String(initial.amountExclVat) : '',
    vatRate: initial ? String(initial.vatRate) : '21',
    frequency: initial?.frequency ?? 'monthly' as RecurringFrequency,
    nextDueDate: initial?.nextDueDate ?? '',
    notes: initial?.notes ?? '',
  })

  const set = (k: string, v: string | RecurringFrequency) => setForm(f => ({ ...f, [k]: v }))

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    onSave({
      clientName: form.clientName,
      service: form.service,
      amountExclVat: parseFloat(form.amountExclVat) || 0,
      vatRate: 21,
      frequency: form.frequency,
      nextDueDate: form.nextDueDate,
      active: true,
      notes: form.notes,
    })
    onClose()
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '9px 12px', borderRadius: 16, border: '1px solid var(--color-border)',
    background: 'var(--color-surface)', color: 'var(--color-ink)', fontSize: 13,
    fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box',
  }
  const labelStyle: React.CSSProperties = { fontSize: 11, fontWeight: 600, color: 'var(--color-muted)', marginBottom: 5, display: 'block', letterSpacing: '0.06em' }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(6px)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ background: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: 20, width: '100%', maxWidth: 520, padding: '28px 28px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22 }}>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--color-ink)', letterSpacing: '-0.01em' }}>
              {initial ? 'Terugkerende factuur bewerken' : 'Terugkerende factuur toevoegen'}
            </h2>
            <p style={{ fontSize: 12, color: 'var(--color-subtle)', marginTop: 3 }}>Wordt elke periode opnieuw aangeboden</p>
          </div>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 9, border: '1px solid var(--color-border)', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-muted)' }}>
            <X size={15} />
          </button>
        </div>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={labelStyle}>Klant</label>
              <input style={inputStyle} value={form.clientName} onChange={e => set('clientName', e.target.value)} placeholder="Klantnaam" required />
            </div>
            <div>
              <label style={labelStyle}>Service</label>
              <input style={inputStyle} value={form.service} onChange={e => set('service', e.target.value)} placeholder="CMO retainer" required />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={labelStyle}>Bedrag excl. btw (€)</label>
              <input style={inputStyle} type="number" step="0.01" min="0" value={form.amountExclVat} onChange={e => set('amountExclVat', e.target.value)} placeholder="1200" required />
            </div>
            <div>
              <label style={labelStyle}>Frequentie</label>
              <select style={inputStyle} value={form.frequency} onChange={e => set('frequency', e.target.value as RecurringFrequency)}>
                <option value="monthly">Maandelijks</option>
                <option value="quarterly">Per kwartaal</option>
                <option value="annual">Jaarlijks</option>
              </select>
            </div>
          </div>
          <div>
            <label style={labelStyle}>Volgende vervaldatum</label>
            <input style={inputStyle} type="date" value={form.nextDueDate} onChange={e => set('nextDueDate', e.target.value)} required />
          </div>
          <div>
            <label style={labelStyle}>Notities (optioneel)</label>
            <input style={inputStyle} value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Extra info..." />
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
            <button type="button" onClick={onClose} style={{ flex: 1, padding: '11px', borderRadius: 16, border: '1px solid var(--color-border)', background: 'transparent', color: 'var(--color-muted)', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>
              Annuleer
            </button>
            <button type="submit" style={{ flex: 2, padding: '11px', borderRadius: 16, border: 'none', background: 'var(--color-accent)', color: 'var(--color-bg)', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
              {initial ? 'Opslaan' : 'Toevoegen'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

/* ── Add Client Modal ────────────────────────────────────────────────── */
function AddClientModal({ onClose }: { onClose: () => void }) {
  const { addRecord } = useSalesFinanceStore()
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    clientName: '', companyName: '', email: '',
    vatNumber: '', service: '', amountExclVat: '',
    invoiceNumber: '', wonAt: new Date().toISOString().split('T')[0], notes: '',
  })

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))
  const amtNum = parseFloat(form.amountExclVat) || 0
  const { vatAmount: vatAmt, totalInclVat: total } = calcVat(amtNum, 21)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    await addRecord({
      leadId: '',
      clientName: form.clientName.trim(),
      companyName: form.companyName.trim(),
      email: form.email.trim(),
      vatNumber: form.vatNumber.trim(),
      vatRegime: 'normaal',
      service: form.service.trim(),
      channel: 'direct',
      invoiceNumber: form.invoiceNumber.trim(),
      amountExclVat: amtNum,
      vatRate: 21,
      vatAmount: vatAmt,
      totalInclVat: total,
      invoiced: false, invoicedAt: undefined,
      paid: false, paidAt: undefined,
      vatReceived: false, vatReceivedAt: undefined,
      kmoRequested: false, kmoRequestedAt: undefined,
      kmoApproved: false, kmoApprovedAt: undefined,
      kmoReceived: false, kmoReceivedAt: undefined,
      kmoAmount: 0,
      wonAt: form.wonAt,
      notes: form.notes.trim(),
    })
    setSaving(false)
    onClose()
  }

  const inp: React.CSSProperties = {
    width: '100%', padding: '9px 12px', borderRadius: 16,
    border: '1px solid var(--color-border)', background: 'var(--color-surface)',
    color: 'var(--color-ink)', fontSize: 13, fontFamily: 'inherit',
    outline: 'none', boxSizing: 'border-box',
  }
  const lbl: React.CSSProperties = {
    fontSize: 11, fontWeight: 600, color: 'var(--color-muted)',
    display: 'block', marginBottom: 5, letterSpacing: '0.06em',
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(6px)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ background: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: 20, width: '100%', maxWidth: 560, padding: '28px 28px 24px', maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22 }}>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--color-ink)', letterSpacing: '-0.01em' }}>Klant toevoegen</h2>
            <p style={{ fontSize: 12, color: 'var(--color-subtle)', marginTop: 3 }}>Rechtstreeks in Finance — zonder Sales pipeline</p>
          </div>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 9, border: '1px solid var(--color-border)', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-muted)' }}>
            <X size={15} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Client */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={lbl}>Naam *</label>
              <input style={inp} value={form.clientName} onChange={e => set('clientName', e.target.value)} placeholder="Jana De Smedt" required autoFocus />
            </div>
            <div>
              <label style={lbl}>Bedrijf</label>
              <input style={inp} value={form.companyName} onChange={e => set('companyName', e.target.value)} placeholder="Bedrijfsnaam BV" />
            </div>
          </div>
          <div>
            <label style={lbl}>E-mail</label>
            <input style={inp} type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="naam@bedrijf.be" />
          </div>

          {/* BTW-nummer klant */}
          <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: 14 }}>
            <label style={lbl}>BTW-nummer klant</label>
            <input style={inp} value={form.vatNumber} onChange={e => set('vatNumber', e.target.value)} placeholder="BE0123456789" />
          </div>

          {/* Service */}
          <div>
            <label style={lbl}>Service / omschrijving *</label>
            <input style={inp} value={form.service} onChange={e => set('service', e.target.value)} placeholder="CMO retainer — juni 2026" required />
          </div>

          {/* Financieel */}
          <div>
            <label style={lbl}>Bedrag excl. btw (€) *</label>
            <input style={inp} type="number" step="0.01" min="0" value={form.amountExclVat} onChange={e => set('amountExclVat', e.target.value)} placeholder="1200" required />
          </div>
          {amtNum > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderRadius: 16, background: 'rgba(201,104,64,0.07)', border: '1px solid rgba(201,104,64,0.18)' }}>
              <span style={{ fontSize: 12, color: 'var(--color-muted)' }}>
                € {amtNum.toLocaleString('nl-BE', { minimumFractionDigits: 2 })} + 21% btw (€ {vatAmt.toLocaleString('nl-BE', { minimumFractionDigits: 2 })})
              </span>
              <span style={{ fontSize: 16, fontWeight: 800, color: 'var(--color-accent)', letterSpacing: '-0.02em' }}>
                = € {total.toLocaleString('nl-BE', { minimumFractionDigits: 2 })}
              </span>
            </div>
          )}

          {/* Meta */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={lbl}>Factuurnummer</label>
              <input style={inp} value={form.invoiceNumber} onChange={e => set('invoiceNumber', e.target.value)} placeholder="2026-001" />
            </div>
            <div>
              <label style={lbl}>Datum gewonnen</label>
              <input style={inp} type="date" value={form.wonAt} onChange={e => set('wonAt', e.target.value)} />
            </div>
          </div>
          <div>
            <label style={lbl}>Notities</label>
            <input style={inp} value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Extra info..." />
          </div>

          <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
            <button type="button" onClick={onClose} style={{ flex: 1, padding: 11, borderRadius: 16, border: '1px solid var(--color-border)', background: 'transparent', color: 'var(--color-muted)', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>
              Annuleer
            </button>
            <button type="submit" disabled={saving} style={{ flex: 2, padding: 11, borderRadius: 16, border: 'none', background: 'var(--color-accent)', color: 'var(--color-bg)', fontSize: 13, fontWeight: 700, cursor: saving ? 'default' : 'pointer', fontFamily: 'inherit', opacity: saving ? 0.7 : 1 }}>
              {saving ? 'Opslaan…' : 'Klant toevoegen'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

/* ── Main Dashboard ──────────────────────────────────────────────────── */
export function FinanceDashboard() {
  const { records, addRecord } = useSalesFinanceStore()
  const { items: recurringItems, add: addRecurring, update: updateRecurring, remove: removeRecurring, advance } = useRecurringInvoiceStore()
  const [filter, setFilter] = useState<Filter>('all')
  const [selected, setSelected] = useState<SalesFinanceRecord | null>(null)
  const [showAddClient, setShowAddClient] = useState(false)
  const [showRecurringModal, setShowRecurringModal] = useState(false)
  const [editingRecurring, setEditingRecurring] = useState<RecurringInvoice | null>(null)

  const dueRecurring = useMemo(() => recurringItems.filter(i => i.active && isDueThisMonth(i)), [recurringItems])
  const allActiveRecurring = useMemo(() => [...recurringItems.filter(i => i.active)].sort((a, b) => a.nextDueDate.localeCompare(b.nextDueDate)), [recurringItems])

  const filtered = useMemo(() => {
    let base = [...records]
    switch (filter) {
      case 'te-factureren': return base.filter(r => !r.invoiced)
      case 'openstaand':    return base.filter(r => r.invoiced && !r.paid)
      case 'betaald':       return base.filter(r => r.paid)
      case 'btw':           return base.filter(r => r.paid && !r.vatReceived)
      case 'kmo':           return base.filter(r => r.kmoAmount > 0 && !r.kmoReceived)
      default:              return base
    }
  }, [records, filter])

  // Sort: overdue first, then by wonAt desc
  const sorted = useMemo(() => [...filtered].sort((a, b) => {
    const aOverdue = a.invoiced && !a.paid && daysSince(a.invoicedAt) > 14 ? 1 : 0
    const bOverdue = b.invoiced && !b.paid && daysSince(b.invoicedAt) > 14 ? 1 : 0
    if (aOverdue !== bOverdue) return bOverdue - aOverdue
    return new Date(b.wonAt).getTime() - new Date(a.wonAt).getTime()
  }), [filtered])

  /* KPIs */
  const totalWon        = records.reduce((s, r) => s + r.totalInclVat, 0)
  const totalInvoiced   = records.filter(r => r.invoiced).reduce((s, r) => s + r.totalInclVat, 0)
  const totalPaid       = records.filter(r => r.paid).reduce((s, r) => s + r.totalInclVat, 0)
  const openInvoices    = records.filter(r => r.invoiced && !r.paid)
  const openInvoiceAmt  = openInvoices.reduce((s, r) => s + r.totalInclVat, 0)
  const overdueCount    = openInvoices.filter(r => daysSince(r.invoicedAt) > 14).length
  const openVatAmt      = records.filter(r => r.paid && !r.vatReceived).reduce((s, r) => s + r.vatAmount, 0)
  const kmoInProcess    = records.filter(r => r.kmoAmount > 0 && r.kmoRequested && !r.kmoApproved).length
  const kmoToReceive    = records.filter(r => r.kmoAmount > 0 && r.kmoApproved && !r.kmoReceived).reduce((s, r) => s + r.kmoAmount, 0)

  // Cashflow forecast: open invoices expected next 30d
  const forecast30 = openInvoices.reduce((s, r) => s + r.totalInclVat, 0)

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: 28, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: 32, fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1, color: 'var(--color-ink)', marginBottom: 4 }}>Finance</h1>
          <p style={{ fontSize: 13, color: 'var(--color-subtle)' }}>Laurence Uvin Commv</p>
        </div>
        <button
          onClick={() => setShowAddClient(true)}
          style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 16px', borderRadius: 11, border: '1px solid var(--color-border)', background: 'var(--color-card)', color: 'var(--color-ink)', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 150ms' }}
        >
          <Plus size={14} /> Klant toevoegen
        </button>
      </div>

      {/* KPI grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
        <KpiCard label="Totale omzet" value={fmt(totalWon)} sub={`${records.length} deals`} color="#7C7F84" icon={TrendingUp} />
        <KpiCard label="Gefactureerd" value={fmt(totalInvoiced)} sub={`${records.filter(r=>r.invoiced).length} facturen`} color="#7C7F84" icon={Receipt} />
        <KpiCard label="Betaald ontvangen" value={fmt(totalPaid)} sub={`${records.filter(r=>r.paid).length} betalingen`} color="#4C6481" icon={Banknote} />
        <KpiCard label="Openstaande facturen" value={fmt(openInvoiceAmt)} sub={overdueCount > 0 ? `⚠ ${overdueCount} vervallen` : `${openInvoices.length} open`} color={overdueCount > 0 ? '#c4736a' : '#C4935A'} icon={Clock} alert={overdueCount > 0} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 28 }}>
        <KpiCard label="Openstaand BTW" value={fmt(openVatAmt)} sub="te vereffenen" color="#7AACCF" icon={FileText} />
        <KpiCard label="KMO in behandeling" value={String(kmoInProcess)} sub="dossiers" color="#38BDF8" icon={Award} />
        <KpiCard label="KMO te ontvangen" value={fmt(kmoToReceive)} sub="goedgekeurd" color="#38BDF8" icon={Award} />
        <KpiCard label="Forecast 30d" value={fmt(forecast30)} sub="verwachte inkomsten" color="#6DB889" icon={TrendingUp} />
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
        {FILTERS.map(f => (
          <button key={f.key} onClick={() => setFilter(f.key)} style={{
            padding: '7px 14px', borderRadius: 99, border: `1px solid ${filter === f.key ? 'var(--color-accent)' : 'var(--color-border)'}`,
            background: filter === f.key ? 'var(--color-accent)' : 'transparent',
            color: filter === f.key ? '#fff' : 'var(--color-muted)',
            fontSize: 12, fontWeight: filter === f.key ? 600 : 400, cursor: 'pointer', fontFamily: 'inherit',
            transition: 'all 150ms',
          }}>
            {f.label}
            {f.key === 'te-factureren' && records.filter(r=>!r.invoiced).length > 0 && (
              <span style={{ marginLeft: 6, background: '#7C7F84', color: '#0C0F16', borderRadius: 99, padding: '1px 5px', fontSize: 10, fontWeight: 700 }}>{records.filter(r=>!r.invoiced).length}</span>
            )}
            {f.key === 'openstaand' && openInvoices.length > 0 && (
              <span style={{ marginLeft: 6, background: overdueCount > 0 ? '#c4736a' : '#C4935A', color: '#fff', borderRadius: 99, padding: '1px 5px', fontSize: 10, fontWeight: 700 }}>{openInvoices.length}</span>
            )}
          </button>
        ))}
      </div>

      {/* Column headers */}
      <div style={{ display: 'grid', gridTemplateColumns: '42px 180px 120px 1fr 100px', gap: 16, padding: '0 20px 8px', alignItems: 'center' }}>
        <div />
        <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--color-subtle)' }}>Klant</span>
        <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--color-subtle)', textAlign: 'right' }}>Bedrag</span>
        <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--color-subtle)', textAlign: 'center' }}>Pipeline</span>
        <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--color-subtle)', textAlign: 'right' }}>Status</span>
      </div>

      {/* Recurring invoices — shown only in "te-factureren" view */}
      {filter === 'te-factureren' && (
        <div style={{ marginBottom: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <RefreshCw size={14} color="var(--color-accent)" />
              <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--color-accent)' }}>
                Terugkerend
              </span>
              {allActiveRecurring.length > 0 && (
                <span style={{ fontSize: 10, fontWeight: 700, background: dueRecurring.length > 0 ? 'var(--color-accent)' : 'var(--color-border)', color: dueRecurring.length > 0 ? '#fff' : 'var(--color-muted)', borderRadius: 99, padding: '1px 6px' }}>
                  {allActiveRecurring.length}
                </span>
              )}
            </div>
            <button
              onClick={() => { setEditingRecurring(null); setShowRecurringModal(true) }}
              style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 9, border: '1px solid var(--color-border)', background: 'transparent', color: 'var(--color-muted)', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}
            >
              <Plus size={12} /> Toevoegen
            </button>
          </div>
          {allActiveRecurring.length === 0 ? (
            <div style={{ padding: '20px', textAlign: 'center', color: 'var(--color-subtle)', fontSize: 13, border: '1px dashed var(--color-border)', borderRadius: 14 }}>
              Nog geen templates. Klik op "Toevoegen" om een terugkerende klant aan te maken.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {allActiveRecurring.map(item => {
                const due = isDueThisMonth(item)
                return (
                  <RecurringCard
                    key={item.id}
                    item={item}
                    isDue={due}
                    onInvoiced={async () => {
                      const { vatAmount, totalInclVat } = calcVat(item.amountExclVat, item.vatRate)
                      await addRecord({
                        leadId: '',
                        clientName: item.clientName,
                        companyName: '',
                        email: '',
                        vatNumber: '',
                        vatRegime: 'normaal',
                        service: item.service,
                        channel: '',
                        invoiceNumber: '',
                        amountExclVat: item.amountExclVat,
                        vatRate: item.vatRate,
                        vatAmount,
                        totalInclVat,
                        invoiced: false,
                        paid: false,
                        vatReceived: false,
                        kmoRequested: false,
                        kmoApproved: false,
                        kmoReceived: false,
                        kmoAmount: 0,
                        wonAt: new Date().toISOString(),
                        notes: `Recurring — ${new Date().toLocaleDateString('nl-BE', { month: 'long', year: 'numeric' })}`,
                      })
                      advance(item.id)
                    }}
                    onEdit={() => { setEditingRecurring(item); setShowRecurringModal(true) }}
                    onDelete={() => removeRecurring(item.id)}
                  />
                )
              })}
            </div>
          )}
          <div style={{ height: 1, background: 'var(--color-border)', margin: '20px 0 0' }} />
          <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--color-subtle)', marginTop: 16, marginBottom: 12 }}>
            Eenmalig te factureren
          </p>
        </div>
      )}

      {/* BTW context banner */}
      {filter === 'btw' && (
        <div style={{ marginBottom: 16, padding: '16px 20px', borderRadius: 14, background: 'rgba(122,172,207,0.07)', border: '1px solid rgba(122,172,207,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
          <div>
            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(122,172,207,0.7)', marginBottom: 4 }}>Te vereffenen bij de fiscus</p>
            <p style={{ fontSize: 24, fontWeight: 800, color: '#7AACCF', letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums' }}>{fmt(openVatAmt)}</p>
            <p style={{ fontSize: 11, color: 'var(--color-muted)', marginTop: 3 }}>
              {sorted.length} factuur{sorted.length !== 1 ? 'en' : ''} waarbij BTW ontvangen maar nog niet afgedragen
            </p>
          </div>
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <p style={{ fontSize: 10, fontWeight: 600, color: 'var(--color-subtle)', marginBottom: 4 }}>Volgende aangifte</p>
            <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-ink)' }}>20 juli 2026</p>
            <p style={{ fontSize: 11, color: 'var(--color-muted)' }}>BTW Q2</p>
          </div>
        </div>
      )}

      {/* Records */}
      {sorted.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--color-subtle)' }}>
          <Receipt size={32} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
          <p style={{ fontSize: 14 }}>
            {filter === 'all'
              ? "No records. Mark a lead as 'Won' in Sales to auto-create a record."
              : 'No records for this filter.'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {sorted.map(r => (
            <RecordRow key={r.id} record={r} onClick={() => setSelected(r)} />
          ))}
        </div>
      )}

      {/* Detail panel */}
      {selected && <RecordDetail record={selected} onClose={() => setSelected(null)} />}

      {/* Add client modal */}
      {showAddClient && <AddClientModal onClose={() => setShowAddClient(false)} />}

      {/* Recurring invoice modal */}
      {showRecurringModal && (
        <RecurringModal
          initial={editingRecurring ?? undefined}
          onSave={data => editingRecurring ? updateRecurring(editingRecurring.id, data) : addRecurring(data)}
          onClose={() => { setShowRecurringModal(false); setEditingRecurring(null) }}
        />
      )}
    </div>
  )
}
