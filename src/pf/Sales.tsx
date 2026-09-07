// Sales: the conversations that become revenue. Five stages, no automation, no CRM.
// The close: a ring that shows how far the open conversations can fill the month, cards she moves
// with one swipe, a next step after every step, and one Won moment.
import { useEffect, useId, useRef, useState, useSyncExternalStore } from 'react'
import type { CSSProperties, KeyboardEvent, PointerEvent as ReactPointerEvent } from 'react'
import { useSalesStore, STAGES, STAGE_LABEL, OPEN_STAGES } from '../store/pf/salesStore'
import type { Lead, Stage } from '../store/pf/salesStore'
import { useRevenueStore } from '../store/pf/revenueStore'
import { monthKey, todayStr, fmtDay } from '../lib/pf/week'
import { ApertureMark, ApertureRing, CircleCheck, StageRing } from './Aperture'
import { Sheet } from './Sheet'

const fmtInt = (n: number) => new Intl.NumberFormat('en-IE', { maximumFractionDigits: 0 }).format(Math.round(n))
const num = (s: string) => Number(s.replace(/[^\d.]/g, ''))
const byNext = (a: Lead, b: Lead) => (a.nextDate ?? '9999').localeCompare(b.nextDate ?? '9999') || b.updatedAt.localeCompare(a.updatedAt)
const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`
const addDays = (d: string, n: number) => { const x = new Date(`${d}T12:00:00`); x.setDate(x.getDate() + n); return x.toISOString().slice(0, 10) }

// Depth per stage: the ring fills as the conversation moves towards Won.
const DEPTH: Record<Stage, number> = { new: .25, conversation: .5, proposal: .78, won: 1, lost: 0 }
const NEXT: Partial<Record<Stage, Stage>> = { new: 'conversation', conversation: 'proposal', proposal: 'won' }

const ellipsis: CSSProperties = { overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }
const dateMono: CSSProperties = { fontSize: 11, color: 'var(--text-3)', letterSpacing: '.02em' }

function useMedia(query: string): boolean {
  return useSyncExternalStore(
    cb => { const m = window.matchMedia(query); m.addEventListener('change', cb); return () => m.removeEventListener('change', cb) },
    () => window.matchMedia(query).matches,
    () => false,
  )
}

type Won = { lead: Lead; from: Stage }
type Undo = { id: string; name: string; from: Stage; to: Stage }

// `focus` is the one-column reading inside Focus · Clients: h1, the pill in the header, the ring alone.
export function Sales({ focus = false }: { focus?: boolean } = {}) {
  const sales = useSalesStore()
  const rev = useRevenueStore()
  const month = monthKey()
  const today = todayStr()
  const name = fmtDay(`${month}-01`, 'MMMM')
  const wide = useMedia('(min-width: 768px)')

  const open = sales.open()
  const inPlay = sales.pipelineValue()
  const revenue = rev.monthRevenue(month)
  const target = rev.monthTarget(month)
  const won = sales.wonBetween(`${month}-01`, `${month}-31`).sort((a, b) => (b.closedAt ?? '').localeCompare(a.closedAt ?? ''))
  const wonSum = won.reduce((a, l) => a + (l.value ?? 0), 0)
  const lost = sales.leads.filter(l => l.stage === 'lost').sort((a, b) => (b.closedAt ?? '').localeCompare(a.closedAt ?? ''))
  const due = open.filter(l => l.nextDate && l.nextDate <= today).sort(byNext)
  const dueValue = due.reduce((a, l) => a + (l.value ?? 0), 0)
  const rest = open.filter(l => !due.includes(l))
  const groups = OPEN_STAGES
    .map(stage => ({ stage, leads: rest.filter(l => l.stage === stage).sort(byNext) }))
    .filter(g => g.leads.length > 0)

  const [sheet, setSheet] = useState<{ lead: Lead | null } | null>(null)
  const [wonMoment, setWonMoment] = useState<Won | null>(null)
  const [undo, setUndo] = useState<Undo | null>(null)
  const [showLost, setShowLost] = useState(false)

  useEffect(() => {
    if (!undo) return
    const t = setTimeout(() => setUndo(null), 6000)
    return () => clearTimeout(t)
  }, [undo])

  // One move, from a swipe or a key. Won opens the moment; the sale is logged there.
  function move(lead: Lead, to: Stage) {
    if (to === lead.stage) return
    sales.moveLead(lead.id, to)
    if (to === 'won') { setUndo(null); setWonMoment({ lead: { ...lead, stage: 'won' }, from: lead.stage }); return }
    setUndo({ id: lead.id, name: lead.name, from: lead.stage, to })
  }

  // Done, or the sheet closed: the sale becomes revenue, once.
  function finishWon() {
    if (!wonMoment) return
    const l = wonMoment.lead
    if ((l.value ?? 0) > 0) rev.logSale({ offerId: l.offerId, amount: l.value, label: l.offerName || l.name, date: todayStr() })
    setWonMoment(null)
  }

  const headline = due.length > 0
    ? `${plural(due.length, 'conversation', 'conversations')} to move today.`
    : open.length === 0
      ? 'No conversations open.'
      : `${plural(open.length, 'conversation', 'conversations')} open. ${fmtInt(inPlay)} eur in play.`

  const closeAll = revenue + inPlay
  const forecast = open.length === 0
    ? (won.length > 0 ? `Won this month: ${plural(won.length, 'conversation', 'conversations')}, ${fmtInt(wonSum)} eur.` : 'Start one and this page reads the month.')
    : target === 0
      ? `${fmtInt(inPlay)} eur in play. Set a target in Revenue and this page reads the gap.`
      : revenue >= target
        ? `Target met. ${fmtInt(inPlay)} eur in play on top.`
        : closeAll >= target
          ? `Close ${open.length === 1 ? 'it' : `all ${open.length}`} and the month passes the target.`
          : `Close ${open.length === 1 ? 'it' : `all ${open.length}`} and the month lands at ${fmtInt(closeAll)} eur. ${fmtInt(target - closeAll)} eur short of ${fmtInt(target)}.`

  const ringMax = target > 0 ? target : Math.max(1, closeAll)

  return (
    <div className={`pf-stack-lg ${focus ? '' : 'pf-narrow'}`} style={focus ? { gap: 44 } : undefined}>
      <div>
        <p className="pf-over">{focus ? 'Focus · Clients' : `Sales · ${name}`}</p>
        <h1 className={focus ? 'pf-h1' : 'pf-h2'} style={{ marginTop: 12 }}>{headline}</h1>
        <p className="pf-body" style={{ marginTop: 14 }}>{due.length > 0 && dueValue > 0 ? `${fmtInt(dueValue)} eur behind them. ${forecast}` : forecast}</p>
        {focus && (
          <div style={{ marginTop: 24 }}>
            <button type="button" className="pf-btn pf-btn--primary" onClick={() => setSheet({ lead: null })}>New conversation</button>
          </div>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 28, flexWrap: 'wrap' }}>
        <ApertureRing value={revenue} max={ringMax} potential={inPlay} size={focus ? 150 : wide ? 220 : 188} stroke={focus ? 9 : 12}>
          <span className="pf-cap">in play</span>
          <span className={`pf-num ${focus ? 'pf-num--sm' : 'pf-num--md'}`} style={{ opacity: inPlay === 0 ? .4 : 1 }}>{fmtInt(inPlay)}<span className="pf-unit">eur</span></span>
        </ApertureRing>
        {focus ? (
          <p className="pf-small" style={{ flex: '1 1 200px' }}>Solid is logged. Dashed is what the open conversations could add before the target.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: wide ? 'column' : 'row', flexWrap: 'wrap', gap: wide ? 16 : '16px 32px', minWidth: 150 }}>
            <Stat label="Logged" value={revenue} unit="eur" />
            <Stat label="Target" value={target} unit="eur" />
            <Stat label="Won" value={won.length} unit={won.length === 1 ? 'conversation' : 'conversations'} />
          </div>
        )}
      </div>

      {sales.leads.length === 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 18 }}>
          <StageRing depth={0} size={56} />
          <p className="pf-small">No conversations yet. Swipe a card right to move it on, left to park it.</p>
          {!focus && <button type="button" className="pf-btn pf-btn--secondary" onClick={() => setSheet({ lead: null })}>New conversation</button>}
        </div>
      ) : (
        <div className="pf-stack-lg" style={{ gap: 36 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 18, flexWrap: 'wrap' }}>
            {!focus && <button type="button" className="pf-btn pf-btn--secondary" onClick={() => setSheet({ lead: null })}>New conversation</button>}
            {undo && (
              <p className="pf-small pf-enter" role="status" key={undo.id + undo.to}>
                {undo.name} to {STAGE_LABEL[undo.to]}.
                <button type="button" className="pf-btn pf-btn--tertiary" style={{ marginLeft: 4, minHeight: 0, padding: '0 4px' }} onClick={() => { sales.moveLead(undo.id, undo.from); setUndo(null) }}>Undo</button>
              </p>
            )}
          </div>

          {due.length > 0 && (
            <section>
              <Cap label="Today" count={due.length} />
              <div className="pf-leads">
                {due.map(l => <LeadCard key={`${l.stage}-${l.id}`} lead={l} due onOpen={() => setSheet({ lead: l })} onMove={to => move(l, to)} />)}
              </div>
            </section>
          )}

          {groups.map(g => (
            <section key={g.stage} className={due.length > 0 ? 'pf-dim' : undefined}>
              <Cap label={STAGE_LABEL[g.stage]} count={g.leads.length} />
              <div className="pf-leads">
                {g.leads.map(l => <LeadCard key={`${l.stage}-${l.id}`} lead={l} onOpen={() => setSheet({ lead: l })} onMove={to => move(l, to)} />)}
              </div>
            </section>
          ))}

          {won.length > 0 && (
            <section>
              <Cap label="Won" count={won.length} extra={`${fmtInt(wonSum)} eur`} />
              <div className="pf-rows">
                {won.map(l => <ClosedRow key={l.id} lead={l} onOpen={() => setSheet({ lead: l })} />)}
              </div>
            </section>
          )}

          {lost.length > 0 && (
            <section>
              {showLost ? (
                <>
                  <Cap label="Not now" count={lost.length} />
                  <div className="pf-rows">
                    {lost.map(l => <ClosedRow key={l.id} lead={l} onOpen={() => setSheet({ lead: l })} />)}
                  </div>
                </>
              ) : (
                <button type="button" className="pf-btn pf-btn--tertiary" onClick={() => setShowLost(true)}>Show {lost.length} not now</button>
              )}
            </section>
          )}
        </div>
      )}

      <Sheet open={sheet !== null} onClose={() => setSheet(null)} title={sheet?.lead ? 'The conversation' : 'A conversation'}>
        {sheet && <LeadForm lead={sheet.lead} onDone={() => setSheet(null)} onWon={(lead, from) => { setSheet(null); setWonMoment({ lead, from }) }} />}
      </Sheet>

      <Sheet open={wonMoment !== null} onClose={finishWon} title="Won.">
        {wonMoment && (
          <WonMoment
            lead={wonMoment.lead}
            toGo={target > 0 ? target - revenue - (wonMoment.lead.value ?? 0) : null}
            onDone={finishWon}
            onBack={() => { sales.moveLead(wonMoment.lead.id, wonMoment.from); setWonMoment(null) }}
          />
        )}
      </Sheet>
    </div>
  )
}

function Cap({ label, count, extra }: { label: string; count: number; extra?: string }) {
  return (
    <span className="pf-cap pf-label" style={{ display: 'flex', gap: 6, alignItems: 'baseline' }}>
      {label} <span className="pf-mono">{count}</span>
      {extra && <span className="pf-mono" style={{ marginLeft: 'auto' }}>{extra}</span>}
    </span>
  )
}

function Stat({ label, value, unit }: { label: string; value: number; unit: string }) {
  return (
    <div>
      <span className="pf-cap" style={{ display: 'block', marginBottom: 4 }}>{label}</span>
      <span className="pf-num pf-num--sm" style={{ opacity: value === 0 ? .4 : 1 }}>{fmtInt(value)}<span className="pf-unit">{unit}</span></span>
    </div>
  )
}

// ── the card ────────────────────────────────────────────────────────────────
// Drag right: the next stage. Drag left: not now. A flick is enough; past the edge the card slows down.
// Arrow keys do the same. Tapping opens the conversation. The check says the step is done and asks for the next one.
const COMMIT = 96      // px
const REACH = 132      // px, where damping starts
const FLICK = 0.11     // px per ms

function LeadCard({ lead, due = false, onOpen, onMove }: { lead: Lead; due?: boolean; onOpen: () => void; onMove: (to: Stage) => void }) {
  const next = NEXT[lead.stage]
  const card = useRef<HTMLDivElement>(null)
  const wrap = useRef<HTMLDivElement>(null)
  const drag = useRef<{ x: number; y: number; t: number; dx: number; on: boolean; axis: 'x' | 'y' | null; id: number } | null>(null)
  const [asking, setAsking] = useState(false)
  const swap = useSwap(asking)
  const [leaving, setLeaving] = useState<Stage | null>(null)
  const hasValue = (lead.value ?? 0) > 0

  function paint(dx: number) {
    const el = card.current, w = wrap.current
    if (!el || !w) return
    el.style.transform = dx === 0 ? '' : `translateX(${dx}px)`
    const p = Math.min(1, Math.abs(dx) / COMMIT)
    w.style.setProperty('--adv', dx > 0 ? String(p) : '0')
    w.style.setProperty('--park', dx < 0 ? String(p) : '0')
    w.dataset.armed = p >= 1 ? (dx > 0 ? 'adv' : 'park') : ''
  }

  function commit(to: Stage, dir: 1 | -1) {
    const el = card.current
    if (!el) return
    setLeaving(to)
    el.style.transition = 'transform 180ms var(--ease-out), opacity 150ms var(--ease-out)'
    el.style.transform = `translateX(${dir * (el.offsetWidth + 24)}px)`
    el.style.opacity = '0'
    setTimeout(() => onMove(to), 170)
  }

  function onDown(e: ReactPointerEvent<HTMLDivElement>) {
    if (drag.current?.on && performance.now() - drag.current.t < 1500) return   // one finger at a time; a lost pointer expires
    if ((e.target as HTMLElement).closest('button, input, a')) return
    if (asking || leaving) return
    drag.current = { x: e.clientX, y: e.clientY, t: performance.now(), dx: 0, on: true, axis: null, id: e.pointerId }
    if (card.current) card.current.style.transition = 'none'
  }
  function onMoveP(e: ReactPointerEvent<HTMLDivElement>) {
    const d = drag.current
    if (!d || !d.on || e.pointerId !== d.id) return
    const dx = e.clientX - d.x, dy = e.clientY - d.y
    if (!d.axis) {
      if (Math.abs(dx) < 6 && Math.abs(dy) < 6) return
      d.axis = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y'
      if (d.axis === 'x') { try { card.current?.setPointerCapture(d.id) } catch { /* a synthetic pointer: nothing to capture */ } }
    }
    if (d.axis !== 'x') return
    let x = dx
    if (!next && x > 0) x = x * 0.25                          // nowhere to go to the right: friction from the start
    if (Math.abs(x) > REACH) x = Math.sign(x) * (REACH + (Math.abs(x) - REACH) * 0.25)
    d.dx = x
    paint(x)
  }
  function onUp(e: ReactPointerEvent<HTMLDivElement>) {
    const d = drag.current
    if (!d || e.pointerId !== d.id) return
    drag.current = null
    const el = card.current
    if (d.axis !== 'x' || !el) { paint(0); return }
    // a drag, committed or not, should not also open the card
    el.dataset.moved = '1'
    setTimeout(() => { delete el.dataset.moved }, 80)
    const v = Math.abs(d.dx) / Math.max(1, performance.now() - d.t)
    const go = Math.abs(d.dx) >= COMMIT || (v > FLICK && Math.abs(d.dx) > 28)
    if (go && d.dx > 0 && next) { commit(next, 1); return }
    if (go && d.dx < 0) { commit('lost', -1); return }
    el.style.transition = 'transform 260ms var(--ease-out)'
    paint(0)
  }
  function onClick(e: React.MouseEvent<HTMLDivElement>) {
    if (card.current?.dataset.moved) return
    if ((e.target as HTMLElement).closest('button, input, form')) return   // the check and the next-step form handle their own taps
    onOpen()
  }
  function onKey(e: KeyboardEvent<HTMLDivElement>) {
    if (e.target !== e.currentTarget) return
    if (e.key === 'ArrowRight' && next) { e.preventDefault(); commit(next, 1) }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); commit('lost', -1) }
    else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onOpen() }
  }

  return (
    <div ref={wrap} className={`pf-lead-wrap ${leaving ? 'is-leaving' : ''}`}>
      <div className="pf-lead-under" aria-hidden="true">
        <span className="pf-lead-under__adv">{next ? STAGE_LABEL[next] : ''}</span>
        <span className="pf-lead-under__park">Not now</span>
      </div>
      <div
        ref={card}
        className={`pf-lead ${due ? 'pf-lead--due' : ''}`}
        role="button" tabIndex={0}
        aria-label={`${lead.name}${next ? `. Right arrow moves to ${STAGE_LABEL[next]}` : ''}. Left arrow parks it`}
        onPointerDown={onDown} onPointerMove={onMoveP} onPointerUp={onUp} onPointerCancel={onUp} onLostPointerCapture={onUp}
        onClick={onClick} onKeyDown={onKey}
      >
        <div className={`pf-swap ${swap.out ? 'is-out' : ''}`}>
          {swap.shown ? (
            <NextStep lead={lead} onDone={() => setAsking(false)} />
          ) : (
            <div className="pf-lead__body">
              <StageRing depth={DEPTH[lead.stage]} />
              <span style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
                <span style={{ fontSize: 16, fontWeight: 500, ...ellipsis }}>{lead.name}</span>
                {(lead.offerName || hasValue) && (
                  <span className="pf-cap" style={ellipsis}>
                    {lead.offerName}{lead.offerName && hasValue ? ' · ' : ''}
                    {hasValue && <span className="pf-mono">{fmtInt(lead.value ?? 0)} eur</span>}
                  </span>
                )}
                {(lead.nextStep || lead.nextDate) ? (
                  <span className="pf-small" style={{ display: 'flex', alignItems: 'baseline', gap: 8, minWidth: 0, marginTop: 4, color: due ? 'var(--text)' : undefined }}>
                    <span style={ellipsis}>{lead.nextStep}</span>
                    {lead.nextDate && <span className="pf-mono" style={{ flexShrink: 0, ...dateMono }}>{fmtDay(lead.nextDate, 'd MMM')}</span>}
                  </span>
                ) : (
                  <span className="pf-small" style={{ marginTop: 4, color: 'var(--text-3)' }}>No next step yet.</span>
                )}
              </span>
              <span style={{ display: 'flex', alignItems: 'center', alignSelf: 'center' }}>
                <CircleCheck checked={false} onChange={() => setAsking(true)} label={`${lead.nextStep || 'Next step'} done. Set the next one`} />
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// One thing crossfades into the next: the old state blurs out for 140ms, then the new one resolves.
function useSwap<T>(target: T): { shown: T; out: boolean } {
  const [shown, setShown] = useState(target)
  const out = shown !== target
  useEffect(() => {
    if (!out) return
    const t = setTimeout(() => setShown(target), 140)
    return () => clearTimeout(t)
  }, [out, target])
  return { shown, out }
}

// The step is done. What happens next, and when. A conversation without a next step goes quiet.
function NextStep({ lead, onDone }: { lead: Lead; onDone: () => void }) {
  const { updateLead } = useSalesStore()
  const id = useId()
  const today = todayStr()
  const [step, setStep] = useState('')
  const [date, setDate] = useState(addDays(today, 2))
  const quick = [
    { label: 'Tomorrow', d: addDays(today, 1) },
    { label: 'In 3 days', d: addDays(today, 3) },
    { label: 'Next week', d: addDays(today, 7) },
  ]
  function save() {
    updateLead(lead.id, { nextStep: step.trim() || undefined, nextDate: step.trim() ? date : undefined })
    onDone()
  }
  function quiet() {
    updateLead(lead.id, { nextStep: undefined, nextDate: undefined })
    onDone()
  }
  return (
    <form className="pf-lead__ask" onSubmit={e => { e.preventDefault(); save() }} onKeyDown={e => e.key === 'Escape' && onDone()}>
      <span className="pf-cap">{lead.name} · done. Next</span>
      <input id={`${id}-s`} className="pf-input" value={step} onChange={e => setStep(e.target.value)} placeholder="What happens next" autoFocus style={{ padding: '10px 12px' }} />
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        {quick.map(q => <button key={q.d} type="button" className="pf-chip" aria-pressed={date === q.d} onClick={() => setDate(q.d)} style={{ minHeight: 36, padding: '8px 14px' }}>{q.label}</button>)}
        <input className="pf-input pf-mono" type="date" value={date} onChange={e => setDate(e.target.value)} aria-label="Next date" style={{ padding: '6px 10px', width: 'auto', minHeight: 36, fontSize: 13 }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
        <button type="button" className="pf-btn pf-btn--tertiary" onClick={quiet} style={{ padding: '6px 0' }}>Nothing for now</button>
        <span style={{ display: 'flex', gap: 8 }}>
          <button type="button" className="pf-btn pf-btn--tertiary" onClick={onDone} style={{ padding: '6px 6px' }}>Back</button>
          <button type="submit" className="pf-btn pf-btn--secondary" disabled={!step.trim()} style={{ minHeight: 40, padding: '10px 20px' }}>Save</button>
        </span>
      </div>
    </form>
  )
}

// Closed conversations fade and keep their date.
function ClosedRow({ lead, onOpen }: { lead: Lead; onOpen: () => void }) {
  const hasValue = (lead.value ?? 0) > 0
  return (
    <button type="button" className="pf-row pf-row--press pf-faded" onClick={onOpen} aria-label={`Open ${lead.name}`}
      style={{ width: '100%', background: 'none', borderTop: 0, borderLeft: 0, borderRight: 0, font: 'inherit', color: 'inherit', textAlign: 'left', cursor: 'pointer', gridTemplateColumns: 'auto minmax(0,1fr) auto' }}>
      <StageRing depth={DEPTH[lead.stage]} closed={lead.stage === 'won'} />
      <span style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
        <span style={{ fontSize: 16, fontWeight: 500, ...ellipsis }}>{lead.name}</span>
        {(lead.offerName || hasValue) && (
          <span className="pf-cap" style={ellipsis}>
            {lead.offerName}{lead.offerName && hasValue ? ' · ' : ''}
            {hasValue && <span className="pf-mono">{fmtInt(lead.value ?? 0)} eur</span>}
          </span>
        )}
      </span>
      {lead.closedAt && <span className="pf-mono" style={dateMono}>{fmtDay(lead.closedAt, 'd MMM')}</span>}
    </button>
  )
}

// ── the Won moment ──────────────────────────────────────────────────────────
// The one time the brand is allowed to move: the field resolves, the arc sweeps, the dot arrives, the number counts up.
function WonMoment({ lead, toGo, onDone, onBack }: { lead: Lead; toGo: number | null; onDone: () => void; onBack: () => void }) {
  const value = lead.value ?? 0
  const shown = useCountUp(value, 700)
  const line = toGo === null ? null : toGo <= 0 ? 'Target met.' : `${fmtInt(toGo)} eur to the target.`
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 22, alignItems: 'flex-start' }}>
      <ApertureMark size={64} play />
      <div>
        {value > 0 ? (
          <span className="pf-num">{fmtInt(shown)}<span className="pf-unit">eur</span></span>
        ) : (
          <span className="pf-h3">{lead.name}.</span>
        )}
        <p className="pf-body" style={{ marginTop: 14 }}>
          {value > 0 ? `${lead.name}${lead.offerName ? `, ${lead.offerName.toLowerCase()}` : ''}. ` : ''}
          {value > 0 ? 'Logged as revenue when you tap done.' : 'No value on this one, so nothing is logged.'}
        </p>
        {line && <p className="pf-small" style={{ marginTop: 6 }}>{line}</p>}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 18, width: '100%' }}>
        <button type="button" className="pf-btn pf-btn--tertiary" onClick={onBack}>Not yet</button>
        <button type="button" className="pf-btn pf-btn--primary" onClick={onDone} autoFocus>Done</button>
      </div>
    </div>
  )
}

// A number that arrives. Ease-out, one pass; with reduced motion it is simply there.
function useCountUp(to: number, ms: number): number {
  const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const [v, setV] = useState(() => still ? to : 0)
  useEffect(() => {
    if (still) return
    let raf = 0
    const t0 = performance.now()
    const tick = (t: number) => {
      const p = Math.min(1, (t - t0) / ms)
      const e = 1 - Math.pow(1 - p, 3)
      setV(Math.round(to * e))
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    const settle = setTimeout(() => setV(to), ms + 120)   // a hidden tab has no frames; the number still arrives
    return () => { cancelAnimationFrame(raf); clearTimeout(settle) }
  }, [to, ms, still])
  return still ? to : v
}

// ── the form ────────────────────────────────────────────────────────────────
function LeadForm({ lead, onDone, onWon }: { lead: Lead | null; onDone: () => void; onWon: (lead: Lead, from: Stage) => void }) {
  const { addLead, updateLead, moveLead, deleteLead } = useSalesStore()
  const { offers } = useRevenueStore()
  const id = useId()
  const [name, setName] = useState(lead?.name ?? '')
  const [offerId, setOfferId] = useState(lead?.offerId ?? '')
  const [offerName, setOfferName] = useState(lead?.offerName ?? '')
  const [value, setValue] = useState(lead?.value ? String(lead.value) : '')
  const [stage, setStage] = useState<Stage>(lead?.stage ?? 'new')
  const [nextStep, setNextStep] = useState(lead?.nextStep ?? '')
  const [nextDate, setNextDate] = useState(lead?.nextDate ?? '')
  const [source, setSource] = useState(lead?.source ?? '')
  const [note, setNote] = useState(lead?.note ?? '')
  const [confirm, setConfirm] = useState(false)
  const v = num(value)
  const valid = name.trim().length > 0
  const small: CSSProperties = { padding: '10px 12px' }

  function pickOffer(oid: string) {
    setOfferId(oid)
    const o = offers.find(x => x.id === oid)
    setOfferName(o?.name ?? '')
    if (o) setValue(String(o.price))
  }

  function save() {
    if (!valid) return
    const patch = {
      name: name.trim(), offerId: offerId || undefined, offerName: offerName || undefined, value: v > 0 ? v : undefined,
      nextStep: nextStep.trim() || undefined, nextDate: nextDate || undefined, source: source.trim() || undefined, note: note.trim() || undefined,
    }
    let leadId: string | undefined
    const from: Stage = lead?.stage ?? 'new'
    if (lead) {
      leadId = lead.id
      updateLead(leadId, patch)
      if (stage !== lead.stage) moveLead(leadId, stage)
    } else {
      leadId = addLead({ ...patch, stage }) ?? undefined
      if (leadId && (stage === 'won' || stage === 'lost')) moveLead(leadId, stage)
    }
    // Won for the first time: the moment, then revenue.
    if (leadId && stage === 'won' && from !== 'won') {
      const fresh = useSalesStore.getState().leads.find(l => l.id === leadId)
      if (fresh) { onWon(fresh, from); return }
    }
    onDone()
  }

  function remove() {
    if (!confirm) { setConfirm(true); return }
    if (lead) deleteLead(lead.id)
    onDone()
  }

  return (
    <form className="pf-fields" style={{ display: 'flex', flexDirection: 'column', gap: 18 }} onSubmit={e => { e.preventDefault(); save() }}>
      <div className="pf-fieldset">
        <label className="pf-cap pf-label" htmlFor={`${id}-name`}>Who</label>
        <input id={`${id}-name`} className="pf-input" value={name} onChange={e => setName(e.target.value)} placeholder="Her name" autoFocus={!lead} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 120px', gap: 10 }}>
        <div className="pf-fieldset">
          <label className="pf-cap pf-label" htmlFor={`${id}-offer`}>Offer</label>
          <select id={`${id}-offer`} className="pf-select" value={offerId} onChange={e => pickOffer(e.target.value)} style={{ ...small, paddingRight: 40 }}>
            <option value="">No offer yet</option>
            {offers.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
          </select>
        </div>
        <div className="pf-fieldset">
          <label className="pf-cap pf-label" htmlFor={`${id}-value`}>Value</label>
          <input id={`${id}-value`} className="pf-input pf-mono" value={value} onChange={e => setValue(e.target.value)} inputMode="numeric" placeholder="eur" style={small} />
        </div>
      </div>
      <div className="pf-fieldset">
        <span className="pf-cap pf-label">Stage</span>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {STAGES.map(s => <button key={s} type="button" className="pf-chip" aria-pressed={stage === s} onClick={() => setStage(s)}>{STAGE_LABEL[s]}</button>)}
        </div>
        {stage === 'won' && lead?.stage !== 'won' && <p className="pf-small" style={{ marginTop: 10 }}>{v > 0 ? 'Saving logs this as revenue.' : 'Add a value and saving logs it as revenue.'}</p>}
      </div>
      <div className="pf-fieldset">
        <label className="pf-cap pf-label" htmlFor={`${id}-next`}>Next step</label>
        <input id={`${id}-next`} className="pf-input" value={nextStep} onChange={e => setNextStep(e.target.value)} placeholder="What happens next" />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10 }}>
        <div className="pf-fieldset">
          <label className="pf-cap pf-label" htmlFor={`${id}-date`}>Next date</label>
          <input id={`${id}-date`} className="pf-input pf-mono" type="date" value={nextDate} onChange={e => setNextDate(e.target.value)} style={small} />
        </div>
        <div className="pf-fieldset">
          <label className="pf-cap pf-label" htmlFor={`${id}-source`}>Where she came from</label>
          <input id={`${id}-source`} className="pf-input" value={source} onChange={e => setSource(e.target.value)} placeholder="Instagram, a referral, an event" style={small} />
        </div>
      </div>
      <div className="pf-fieldset">
        <label className="pf-cap pf-label" htmlFor={`${id}-note`}>Note</label>
        <textarea id={`${id}-note`} className="pf-textarea" value={note} onChange={e => setNote(e.target.value)} placeholder="Anything the future you should know." style={{ minHeight: 64 }} />
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 18, marginTop: 6 }}>
        {lead ? (
          <button type="button" className="pf-btn pf-btn--tertiary" onClick={remove}>{confirm ? 'Remove for good' : 'Remove'}</button>
        ) : <span />}
        <button type="submit" className="pf-btn pf-btn--primary" disabled={!valid}>Save</button>
      </div>
    </form>
  )
}
