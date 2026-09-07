// Revenue: the month's target, what is logged, the gap. One tap logs a sale. No accounting.
import { useEffect, useId, useState, useSyncExternalStore } from 'react'
import type { CSSProperties } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useRevenueStore, OFFER_KIND_LABEL } from '../store/pf/revenueStore'
import type { Offer, OfferKind, Sale } from '../store/pf/revenueStore'
import { monthKey, todayStr, fmtDay } from '../lib/pf/week'
import { ApertureRing } from './Aperture'
import { Sheet } from './Sheet'

const KINDS = Object.keys(OFFER_KIND_LABEL) as OfferKind[]
const fmtInt = (n: number) => new Intl.NumberFormat('en-IE', { maximumFractionDigits: 0 }).format(Math.round(n))
const num = (s: string) => Number(s.replace(/[^\d.]/g, ''))

function shiftMonth(month: string, by: number): string {
  const [y, m] = month.split('-').map(Number)
  const d = new Date(y, m - 1 + by, 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

function useMedia(query: string): boolean {
  return useSyncExternalStore(
    cb => { const m = window.matchMedia(query); m.addEventListener('change', cb); return () => m.removeEventListener('change', cb) },
    () => window.matchMedia(query).matches,
    () => false,
  )
}

// A hairline row that can be tapped: the button chrome goes, the dotted divider stays.
const rowButton: CSSProperties = {
  width: '100%', background: 'none', borderTop: 0, borderLeft: 0, borderRight: 0,
  font: 'inherit', color: 'inherit', textAlign: 'left', cursor: 'pointer',
}
const flat: CSSProperties = { background: 'none', border: 0, padding: 0, color: 'inherit', cursor: 'pointer', font: 'inherit', textAlign: 'left' }

export function Revenue() {
  const [month, setMonth] = useState(() => monthKey())
  const current = monthKey()
  const name = fmtDay(`${month}-01`, month.slice(0, 4) === current.slice(0, 4) ? 'MMMM' : 'MMMM yyyy')

  return (
    <div className="pf-stack-lg pf-narrow">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <p className="pf-over">Revenue · {name}</p>
        <div style={{ display: 'flex', gap: 8 }}>
          <button type="button" className="pf-chev" aria-label="Previous month" onClick={() => setMonth(shiftMonth(month, -1))}>
            <ChevronLeft size={16} strokeWidth={1.5} aria-hidden="true" />
          </button>
          <button type="button" className="pf-chev" aria-label="Next month" disabled={month >= current} onClick={() => setMonth(shiftMonth(month, 1))}>
            <ChevronRight size={16} strokeWidth={1.5} aria-hidden="true" />
          </button>
        </div>
      </div>
      <MonthView key={month} month={month} name={name} />
    </div>
  )
}

// Everything below the month line resets with the month.
function MonthView({ month, name }: { month: string; name: string }) {
  const rev = useRevenueStore()
  const target = rev.monthTarget(month)
  const revenue = rev.monthRevenue(month)
  const gap = target - revenue
  const wide = useMedia('(min-width: 768px)')
  const isCurrent = month === monthKey()
  const defaultDate = isCurrent ? todayStr() : `${month}-01`

  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(target ? String(target) : '')
  const [logged, setLogged] = useState<string | null>(null)
  const [label, setLabel] = useState('')
  const [amount, setAmount] = useState('')
  const [date, setDate] = useState(defaultDate)
  const [offerSheet, setOfferSheet] = useState<{ offer: Offer | null } | null>(null)
  const [sale, setSale] = useState<Sale | null>(null)

  useEffect(() => {
    if (!logged) return
    const t = setTimeout(() => setLogged(null), 2000)
    return () => clearTimeout(t)
  }, [logged])

  function commitTarget() {
    const n = num(draft)
    if (n > 0) rev.setTarget(month, n)
    setEditing(false)
  }
  function logOffer(o: Offer) {
    if (rev.logSale({ offerId: o.id, date: defaultDate })) setLogged(`Logged. ${fmtInt(o.price)} eur.`)
  }
  function logFree() {
    const n = num(amount)
    if (!(n > 0)) return
    if (!rev.logSale({ amount: n, label: label || 'Sale', date: date || defaultDate })) return
    setLogged(`Logged. ${fmtInt(n)} eur.`)
    setAmount(''); setLabel(''); setDate(defaultDate)
  }

  const sales = rev.sales
    .filter(s => s.date.startsWith(month))
    .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt))

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: 28, flexWrap: 'wrap' }}>
        <ApertureRing value={revenue} max={target || 1} size={wide ? 240 : 200}>
          {target === 0 ? (
            <>
              <span className="pf-cap">Set a target</span>
              <span className="pf-num pf-num--md">{fmtInt(revenue)}<span className="pf-unit">eur</span></span>
            </>
          ) : gap <= 0 ? (
            <>
              <span className="pf-cap">this month</span>
              <span className="pf-num pf-num--md" style={{ color: 'var(--text-brand)' }}>Met</span>
            </>
          ) : (
            <>
              <span className="pf-cap">to go</span>
              <span className="pf-num pf-num--md">{fmtInt(gap)}<span className="pf-unit">eur</span></span>
            </>
          )}
        </ApertureRing>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18, minWidth: 160 }}>
          <div>
            <span className="pf-cap" style={{ display: 'block', marginBottom: 4 }}>Target</span>
            {editing || target === 0 ? (
              <input className="pf-inline pf-num pf-num--sm" inputMode="numeric" autoFocus={editing} value={draft}
                onChange={e => setDraft(e.target.value)} onBlur={commitTarget} onKeyDown={e => e.key === 'Enter' && commitTarget()}
                placeholder="8000" aria-label="Monthly target in euro" style={{ maxWidth: 160 }} />
            ) : (
              <button type="button" onClick={() => { setDraft(String(target)); setEditing(true) }} style={flat} aria-label="Edit the monthly target">
                <span className="pf-num pf-num--sm">{fmtInt(target)}<span className="pf-unit">eur</span></span>
              </button>
            )}
          </div>
          <div>
            <span className="pf-cap" style={{ display: 'block', marginBottom: 4 }}>Logged</span>
            <span className="pf-num pf-num--sm">{fmtInt(revenue)}<span className="pf-unit">eur</span></span>
          </div>
        </div>
      </div>

      <section>
        <span className="pf-cap pf-label">Log a sale</span>
        <div className="pf-stack">
          {rev.offers.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 4 }}>
              {rev.offers.map(o => (
                <button key={o.id} type="button" className="pf-chip" onClick={() => logOffer(o)}>
                  {o.name} <span className="pf-unit pf-mono">{fmtInt(o.price)} eur</span>
                </button>
              ))}
            </div>
          )}
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 110px', gap: 10 }}>
            <input className="pf-input" value={label} onChange={e => setLabel(e.target.value)} placeholder="What sold" aria-label="What sold" />
            <input className="pf-input pf-mono" value={amount} onChange={e => setAmount(e.target.value)} inputMode="numeric" placeholder="eur" aria-label="Amount in euro"
              onKeyDown={e => e.key === 'Enter' && logFree()} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) auto', gap: 10 }}>
            <input className="pf-input pf-mono" type="date" value={date} onChange={e => setDate(e.target.value)} aria-label="Date of the sale" />
            <button type="button" className="pf-btn pf-btn--secondary" onClick={logFree}>Log</button>
          </div>
          {logged && <p className="pf-small pf-enter" role="status">{logged}</p>}
        </div>
      </section>

      <section>
        <span className="pf-cap pf-label">Offers</span>
        {rev.offers.length === 0 ? (
          <p className="pf-small">No offers yet. Add one and a sale takes one tap.</p>
        ) : (
          <div className="pf-rows">
            {rev.offers.map(o => (
              <button key={o.id} type="button" className="pf-row" style={{ ...rowButton, gridTemplateColumns: 'minmax(0,1fr) auto auto' }}
                onClick={() => setOfferSheet({ offer: o })} aria-label={`Edit ${o.name}`}>
                <span style={{ fontSize: 16, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{o.name}</span>
                <span className="pf-cap">{OFFER_KIND_LABEL[o.kind]}</span>
                <span className="pf-mono" style={{ fontSize: 14, color: 'var(--text-2)' }}>{fmtInt(o.price)}<span className="pf-unit" style={{ fontSize: 11 }}>eur</span></span>
              </button>
            ))}
          </div>
        )}
        <button type="button" className="pf-btn pf-btn--secondary" style={{ marginTop: 14 }} onClick={() => setOfferSheet({ offer: null })}>Add an offer</button>
      </section>

      <section>
        <span className="pf-cap pf-label">{isCurrent ? 'This month' : name}</span>
        {sales.length === 0 ? (
          <p className="pf-small">Nothing logged yet.</p>
        ) : (
          <div className="pf-rows">
            {sales.map(s => (
              <button key={s.id} type="button" className="pf-row" style={rowButton} onClick={() => setSale(s)} aria-label={`${s.label}, ${fmtInt(s.amount)} euro`}>
                <span className="pf-mono" style={{ fontSize: 11, color: 'var(--text-3)', letterSpacing: '.02em', minWidth: 44 }}>{fmtDay(s.date, 'd MMM')}</span>
                <span style={{ fontSize: 16, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.label}</span>
                <span className="pf-mono">{fmtInt(s.amount)}<span className="pf-unit" style={{ fontSize: 11 }}>eur</span></span>
              </button>
            ))}
          </div>
        )}
      </section>

      <Sheet open={offerSheet !== null} onClose={() => setOfferSheet(null)} title={offerSheet?.offer ? 'The offer' : 'An offer'}>
        <OfferForm offer={offerSheet?.offer ?? null} onDone={() => setOfferSheet(null)} />
      </Sheet>
      <Sheet open={sale !== null} onClose={() => setSale(null)} title={sale?.label}>
        {sale && <SaleDetail sale={sale} onDone={() => setSale(null)} />}
      </Sheet>
    </>
  )
}

function OfferForm({ offer, onDone }: { offer: Offer | null; onDone: () => void }) {
  const { addOffer, updateOffer, deleteOffer } = useRevenueStore()
  const id = useId()
  const [name, setName] = useState(offer?.name ?? '')
  const [price, setPrice] = useState(offer ? String(offer.price) : '')
  const [kind, setKind] = useState<OfferKind>(offer?.kind ?? 'service')
  const [confirm, setConfirm] = useState(false)
  const p = num(price)
  const valid = name.trim().length > 0 && p > 0

  function save() {
    if (!valid) return
    if (offer) updateOffer(offer.id, { name: name.trim(), price: p, kind })
    else addOffer(name, p, kind)
    onDone()
  }
  function remove() {
    if (!confirm) { setConfirm(true); return }
    if (offer) deleteOffer(offer.id)
    onDone()
  }

  return (
    <form className="pf-fields" style={{ display: 'flex', flexDirection: 'column', gap: 22 }} onSubmit={e => { e.preventDefault(); save() }}>
      <div className="pf-fieldset">
        <label className="pf-cap pf-label" htmlFor={`${id}-name`}>Name</label>
        <input id={`${id}-name`} className="pf-input" value={name} onChange={e => setName(e.target.value)} placeholder="Offer name" autoFocus={!offer} />
      </div>
      <div className="pf-fieldset">
        <label className="pf-cap pf-label" htmlFor={`${id}-price`}>Price</label>
        <input id={`${id}-price`} className="pf-input pf-mono" value={price} onChange={e => setPrice(e.target.value)} inputMode="numeric" placeholder="eur" />
      </div>
      <div className="pf-fieldset">
        <label className="pf-cap pf-label" htmlFor={`${id}-kind`}>Kind</label>
        <select id={`${id}-kind`} className="pf-select" value={kind} onChange={e => setKind(e.target.value as OfferKind)}>
          {KINDS.map(k => <option key={k} value={k}>{OFFER_KIND_LABEL[k]}</option>)}
        </select>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 18, marginTop: 6 }}>
        {offer ? (
          <button type="button" className="pf-btn pf-btn--tertiary" onClick={remove}>{confirm ? 'Remove for good' : 'Remove'}</button>
        ) : <span />}
        <button type="submit" className="pf-btn pf-btn--primary" disabled={!valid}>Save</button>
      </div>
    </form>
  )
}

function SaleDetail({ sale, onDone }: { sale: Sale; onDone: () => void }) {
  const { offers, deleteSale } = useRevenueStore()
  const [confirm, setConfirm] = useState(false)
  const offer = sale.offerId ? offers.find(o => o.id === sale.offerId) : undefined

  function remove() {
    if (!confirm) { setConfirm(true); return }
    deleteSale(sale.id)
    onDone()
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
      <span className="pf-num pf-num--sm">{fmtInt(sale.amount)}<span className="pf-unit">eur</span></span>
      <div>
        <span className="pf-cap" style={{ display: 'block', marginBottom: 4 }}>Logged on</span>
        <p className="pf-small">{fmtDay(sale.date)}{offer ? ` · ${OFFER_KIND_LABEL[offer.kind]}` : ''}</p>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 18 }}>
        <button type="button" className="pf-btn pf-btn--tertiary" onClick={remove}>{confirm ? 'Remove for good' : 'Remove'}</button>
        <button type="button" className="pf-btn pf-btn--secondary" onClick={onDone}>Keep</button>
      </div>
    </div>
  )
}
