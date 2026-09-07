// Finance: what comes in, what goes out, what she keeps. No accounting.
import { useId, useState, useSyncExternalStore } from 'react'
import type { CSSProperties } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useFinanceStore, EXPENSE_LABEL } from '../store/pf/financeStore'
import type { Expense, ExpenseKind } from '../store/pf/financeStore'
import { useRevenueStore } from '../store/pf/revenueStore'
import { monthKey, todayStr, fmtDay } from '../lib/pf/week'
import { ApertureRing } from './Aperture'
import { Sheet } from './Sheet'

const KINDS = Object.keys(EXPENSE_LABEL) as ExpenseKind[]
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
const ellipsis: CSSProperties = { fontSize: 16, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }
const dateMono: CSSProperties = { fontSize: 11, color: 'var(--text-3)', letterSpacing: '.02em', minWidth: 44 }

export function Finance() {
  const [month, setMonth] = useState(() => monthKey())
  const current = monthKey()
  const name = fmtDay(`${month}-01`, month.slice(0, 4) === current.slice(0, 4) ? 'MMMM' : 'MMMM yyyy')

  return (
    <div className="pf-stack-lg pf-narrow">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <p className="pf-over">Finance · {name}</p>
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
  const fin = useFinanceStore()
  const wide = useMedia('(min-width: 768px)')
  const isCurrent = month === monthKey()
  const revenue = rev.monthRevenue(month)
  const out = fin.monthOut(month)
  const kept = revenue - out
  const payTarget = fin.payTarget
  const paid = payTarget > 0 && kept >= payTarget

  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(payTarget ? String(payTarget) : '')
  const [sheet, setSheet] = useState<{ expense: Expense | null } | null>(null)

  const headline = revenue === 0 && out === 0
    ? 'Nothing logged this month.'
    : kept < 0 ? `Out exceeds in by ${fmtInt(-kept)} eur this month.` : `You keep ${fmtInt(kept)} eur this month.`

  // Six months ending here; a month has data when anything came in or went out.
  const series = Array.from({ length: 6 }, (_, i) => {
    const m = shiftMonth(month, i - 5)
    const r = rev.monthRevenue(m)
    return { m, kept: r - fin.monthOut(m), has: r > 0 || fin.expensesIn(m).length > 0 }
  })
  const monthsWithData = series.filter(p => p.has).length

  const fixed = fin.expenses.filter(e => e.monthly).sort((a, b) => b.amount - a.amount || a.label.localeCompare(b.label))
  const oneOff = fin.expensesIn(month).filter(e => !e.monthly)
  const fixedSum = fin.fixedMonthly()

  function commitTarget() {
    fin.setPayTarget(num(draft))
    setEditing(false)
  }

  return (
    <>
      <h1 className="pf-h2">{headline}</h1>

      <div style={{ display: 'flex', alignItems: 'center', gap: 28, flexWrap: 'wrap' }}>
        <ApertureRing value={Math.max(0, kept)} max={payTarget || 1} size={wide ? 240 : 200}>
          <span className="pf-cap" style={paid ? { color: 'var(--text-brand)' } : undefined}>{paid ? 'Paid' : 'Kept'}</span>
          <span className="pf-num pf-num--md">{fmtInt(kept)}<span className="pf-unit">eur</span></span>
        </ApertureRing>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18, minWidth: 160 }}>
          <div>
            <span className="pf-cap" style={{ display: 'block', marginBottom: 4 }}>In</span>
            <span className="pf-num pf-num--sm">{fmtInt(revenue)}<span className="pf-unit">eur</span></span>
          </div>
          <div>
            <span className="pf-cap" style={{ display: 'block', marginBottom: 4 }}>Out</span>
            <span className="pf-num pf-num--sm">{fmtInt(out)}<span className="pf-unit">eur</span></span>
          </div>
          <div>
            <span className="pf-cap" style={{ display: 'block', marginBottom: 4 }}>Pay target</span>
            {editing || payTarget === 0 ? (
              <input className="pf-inline pf-num pf-num--sm" inputMode="numeric" autoFocus={editing} value={draft}
                onChange={e => setDraft(e.target.value)} onBlur={commitTarget} onKeyDown={e => e.key === 'Enter' && commitTarget()}
                placeholder="3000" aria-label="What you want to pay yourself a month, in euro" style={{ maxWidth: 160 }} />
            ) : (
              <button type="button" className="pf-hit" onClick={() => { setDraft(String(payTarget)); setEditing(true) }} style={flat} aria-label="Edit the pay target">
                <span className="pf-num pf-num--sm">{fmtInt(payTarget)}<span className="pf-unit">eur</span></span>
              </button>
            )}
          </div>
        </div>
      </div>

      <section>
        <span className="pf-cap pf-label">Kept, six months</span>
        {monthsWithData < 2
          ? <p className="pf-small">Two months of numbers and the line appears.</p>
          : <KeptLine points={series} mark={month} />}
      </section>

      {fin.expenses.length === 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 18 }}>
          <Outline />
          <p className="pf-small">No costs yet. Add the fixed ones first.</p>
          <button type="button" className="pf-btn pf-btn--secondary" onClick={() => setSheet({ expense: null })}>Add a cost</button>
        </div>
      ) : (
        <>
          <section>
            <span className="pf-cap pf-label">Fixed every month</span>
            {fixed.length === 0 ? (
              <p className="pf-small">Nothing fixed yet.</p>
            ) : (
              <>
                <div className="pf-rows">
                  {fixed.map(e => (
                    <button key={e.id} type="button" className="pf-row pf-row--press" style={{ ...rowButton, gridTemplateColumns: 'minmax(0,1fr) auto auto' }}
                      onClick={() => setSheet({ expense: e })} aria-label={`Edit ${e.label}`}>
                      <span style={ellipsis}>{e.label}</span>
                      <span className="pf-cap">{EXPENSE_LABEL[e.kind]}</span>
                      <span className="pf-mono">{fmtInt(e.amount)}<span className="pf-unit" style={{ fontSize: 11 }}>eur</span></span>
                    </button>
                  ))}
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 14, paddingTop: 14, borderTop: '1px solid var(--border-soft)' }}>
                  <span className="pf-cap">Every month</span>
                  <span className="pf-num pf-num--sm">{fmtInt(fixedSum)}<span className="pf-unit">eur</span></span>
                </div>
              </>
            )}
          </section>

          <section>
            <span className="pf-cap pf-label">{isCurrent ? 'This month' : name}</span>
            {oneOff.length === 0 ? (
              <p className="pf-small">Nothing else this month.</p>
            ) : (
              <div className="pf-rows">
                {oneOff.map(e => (
                  <button key={e.id} type="button" className="pf-row pf-row--press" style={rowButton} onClick={() => setSheet({ expense: e })} aria-label={`Edit ${e.label}`}>
                    <span className="pf-mono" style={dateMono}>{fmtDay(e.date, 'd MMM')}</span>
                    <span style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
                      <span style={ellipsis}>{e.label}</span>
                      <span className="pf-cap">{EXPENSE_LABEL[e.kind]}</span>
                    </span>
                    <span className="pf-mono">{fmtInt(e.amount)}<span className="pf-unit" style={{ fontSize: 11 }}>eur</span></span>
                  </button>
                ))}
              </div>
            )}
            <button type="button" className="pf-btn pf-btn--secondary" style={{ marginTop: 14 }} onClick={() => setSheet({ expense: null })}>Add a cost</button>
          </section>
        </>
      )}

      <Sheet open={sheet !== null} onClose={() => setSheet(null)} title={sheet?.expense ? 'The cost' : 'A cost'}>
        {sheet && <CostForm expense={sheet.expense} defaultDate={isCurrent ? todayStr() : `${month}-01`} onDone={() => setSheet(null)} />}
      </Sheet>
    </>
  )
}

// The faint aperture, empty: a dotted Stone ring. No illustration.
function Outline() {
  return (
    <svg width="56" height="56" viewBox="0 0 56 56" aria-hidden="true" style={{ display: 'block' }}>
      <circle cx="28" cy="28" r="24" fill="none" stroke="var(--border)" strokeWidth="1" strokeDasharray="1.5 5" strokeLinecap="round" />
    </svg>
  )
}

// Catmull-Rom through the points, as cubic beziers: a gentle curve, no overshoot to speak of.
function spline(p: [number, number][]): string {
  let d = `M ${p[0][0]} ${p[0][1]}`
  for (let i = 0; i < p.length - 1; i++) {
    const a = p[Math.max(0, i - 1)], b = p[i], c = p[i + 1], e = p[Math.min(p.length - 1, i + 2)]
    d += ` C ${b[0] + (c[0] - a[0]) / 6} ${b[1] + (c[1] - a[1]) / 6} ${c[0] - (e[0] - b[0]) / 6} ${c[1] - (e[1] - b[1]) / 6} ${c[0]} ${c[1]}`
  }
  return d
}

// Kept per month: one solid Ink curve over three dotted scaffold lines, the month being read marked with a dot.
function KeptLine({ points, mark }: { points: { m: string; kept: number }[]; mark: string }) {
  const id = useId()
  const W = 320, top = 16, bottom = 88, H = 96
  const vals = points.map(p => p.kept)
  const rawLo = Math.min(0, ...vals)
  const rawHi = Math.max(1, ...vals)
  // pad the range so the curve never rides a scaffold line
  const hi = rawHi + (rawHi - rawLo) * 0.12
  const lo = rawLo < 0 ? rawLo - (rawHi - rawLo) * 0.12 : 0
  const x = (i: number) => Math.round(((i + .5) / points.length) * W * 10) / 10
  const y = (v: number) => Math.round((bottom - ((v - lo) / (hi - lo)) * (bottom - top)) * 10) / 10
  const pts = points.map((p, i) => [x(i), y(p.kept)] as [number, number])
  const line = spline(pts)
  const area = `${line} L ${pts[pts.length - 1][0]} ${bottom} L ${pts[0][0]} ${bottom} Z`
  const markIndex = points.findIndex(p => p.m === mark)

  return (
    <div style={{ marginTop: 6, position: 'relative' }}>
      <span className="pf-cap pf-mono" style={{ position: 'absolute', right: 0, top: -4, lineHeight: 1 }}>{fmtInt(rawHi)} eur</span>
      <span className="pf-cap pf-mono" style={{ position: 'absolute', left: 0, bottom: 'calc(8.5% + 20px)', lineHeight: 1 }}>{fmtInt(rawLo)} eur</span>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label={`Kept per month, ${points.length} months`} style={{ display: 'block', height: 'auto' }}>
        <defs>
          <linearGradient id={`${id}-f`} x1="0" y1="0" x2="0.3" y2="1">
            <stop offset="0" stopColor="var(--depth-3)" stopOpacity=".12" />
            <stop offset="1" stopColor="var(--depth-0)" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[top, (top + bottom) / 2, bottom].map(gy => (
          <line key={gy} x1="0" x2={W} y1={gy} y2={gy} stroke="var(--border)" strokeWidth="1" strokeDasharray="1.5 5" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
        ))}
        <path d={area} fill={`url(#${id}-f)`} />
        <path d={line} fill="none" stroke="var(--text)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
        {markIndex >= 0 && <circle cx={pts[markIndex][0]} cy={pts[markIndex][1]} r="3" fill="var(--text)" />}
      </svg>
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${points.length}, 1fr)`, marginTop: 6 }}>
        {points.map(p => (
          <span key={p.m} className="pf-mono" style={{ fontSize: 10, lineHeight: '14px', letterSpacing: '.02em', textAlign: 'center', color: p.m === mark ? 'var(--text)' : 'var(--text-3)' }}>
            {fmtDay(`${p.m}-01`, 'MMM')}
          </span>
        ))}
      </div>
    </div>
  )
}

function CostForm({ expense, defaultDate, onDone }: { expense: Expense | null; defaultDate: string; onDone: () => void }) {
  const { addExpense, updateExpense, deleteExpense } = useFinanceStore()
  const id = useId()
  const [label, setLabel] = useState(expense?.label ?? '')
  const [amount, setAmount] = useState(expense ? String(expense.amount) : '')
  const [kind, setKind] = useState<ExpenseKind>(expense?.kind ?? 'other')
  const [date, setDate] = useState(expense?.date ?? defaultDate)
  const [monthly, setMonthly] = useState(expense?.monthly ?? false)
  const [confirm, setConfirm] = useState(false)
  const n = num(amount)
  const valid = label.trim().length > 0 && n > 0 && date.length > 0
  const small: CSSProperties = { padding: '10px 12px' }

  function save() {
    if (!valid) return
    const v = { label: label.trim(), amount: n, kind, date, monthly }
    if (expense) updateExpense(expense.id, v)
    else addExpense(v)
    onDone()
  }
  function remove() {
    if (!confirm) { setConfirm(true); return }
    if (expense) deleteExpense(expense.id)
    onDone()
  }

  return (
    <form className="pf-fields" style={{ display: 'flex', flexDirection: 'column', gap: 18 }} onSubmit={e => { e.preventDefault(); save() }}>
      <div className="pf-fieldset">
        <label className="pf-cap pf-label" htmlFor={`${id}-label`}>What</label>
        <input id={`${id}-label`} className="pf-input" value={label} onChange={e => setLabel(e.target.value)} placeholder="What it is for" autoFocus={!expense} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '120px minmax(0,1fr)', gap: 10 }}>
        <div className="pf-fieldset">
          <label className="pf-cap pf-label" htmlFor={`${id}-amount`}>Amount</label>
          <input id={`${id}-amount`} className="pf-input pf-mono" value={amount} onChange={e => setAmount(e.target.value)} inputMode="numeric" placeholder="eur" style={small} />
        </div>
        <div className="pf-fieldset">
          <label className="pf-cap pf-label" htmlFor={`${id}-kind`}>Kind</label>
          <select id={`${id}-kind`} className="pf-select" value={kind} onChange={e => setKind(e.target.value as ExpenseKind)} style={{ ...small, paddingRight: 40 }}>
            {KINDS.map(k => <option key={k} value={k}>{EXPENSE_LABEL[k]}</option>)}
          </select>
        </div>
      </div>
      <div className="pf-fieldset">
        <label className="pf-cap pf-label" htmlFor={`${id}-date`}>{monthly ? 'Since' : 'Date'}</label>
        <input id={`${id}-date`} className="pf-input pf-mono" type="date" value={date} onChange={e => setDate(e.target.value)} style={small} />
      </div>
      <div className="pf-fieldset">
        <button type="button" className="pf-toggle" aria-pressed={monthly} onClick={() => setMonthly(!monthly)}>
          Repeats every month
          <span className="pf-track" aria-hidden="true"><span /></span>
        </button>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 18, marginTop: 6 }}>
        {expense ? (
          <button type="button" className="pf-btn pf-btn--tertiary" onClick={remove}>{confirm ? 'Remove for good' : 'Remove'}</button>
        ) : <span />}
        <button type="submit" className="pf-btn pf-btn--primary" disabled={!valid}>Save</button>
      </div>
    </form>
  )
}
