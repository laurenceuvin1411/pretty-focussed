// Goals: four horizons of one ladder. The year gives direction, the quarter gives six goals,
// the month gives one focus, the week gives three priorities. Depth over time is always an aperture ring.
import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import type { CSSProperties, ReactNode } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useGoalStore, goalProgress, MAX_PER_LANE, LANE_LABEL } from '../store/pf/goalStore'
import type { Goal90, Lane } from '../store/pf/goalStore'
import { useFocusStore, MAX_OUTCOMES } from '../store/pf/focusStore'
import type { YearOutcome } from '../store/pf/focusStore'
import { useWeekStore } from '../store/pf/weekStore'
import type { WeekPlan } from '../store/pf/weekStore'
import { quarterInfo, yearInfo, monthInfo, monthKey, shiftMonth, weeksInMonth, weekKey, prevWeekKey, nextWeekKey, weekLabel, weekNumber, weekDatesFromKey, todayStr } from '../lib/pf/week'
import { ApertureRing, CircleCheck } from './Aperture'
import { DepthBar } from './DepthBar'
import { usePop } from '../lib/pf/depth'
import { Sheet } from './Sheet'

const LANES: Lane[] = ['business', 'life']
const HOLD_MS = 1600
const UNITS = ['clients', 'members', 'eur', 'km', 'sessions', 'posts', 'hours', 'days']

const TABS = [
  { id: 'year',    label: 'Year',    path: '/goals/year' },
  { id: 'quarter', label: 'Quarter', path: '/goals' },
  { id: 'month',   label: 'Month',   path: '/goals/month' },
  { id: 'week',    label: 'Week',    path: '/goals/week' },
] as const
type Horizon = typeof TABS[number]['id']

const flat: CSSProperties = { background: 'none', border: 0, padding: 0, font: 'inherit', color: 'inherit', cursor: 'pointer', textAlign: 'left' }

function useMedia(query: string) {
  return useSyncExternalStore(
    cb => { const m = window.matchMedia(query); m.addEventListener('change', cb); return () => m.removeEventListener('change', cb) },
    () => window.matchMedia(query).matches,
    () => false,
  )
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="pf-fieldset">
      <span className="pf-cap pf-label">{label}</span>
      {children}
    </div>
  )
}

function CapUnit({ children }: { children: ReactNode }) {
  return <span className="pf-unit" style={{ fontSize: 11 }}>{children}</span>
}

function shortUnit(unit?: string) {
  const u = (unit ?? '').trim()
  return u.length > 7 ? u.slice(0, 3) : u
}

// A one-line field that reads as text until she taps it. Saves on blur or Enter.
function InlineLine({ value, placeholder, onSave, className, label, style }: { value: string; placeholder: string; onSave: (v: string) => void; className: string; label: string; style?: CSSProperties }) {
  const [draft, setDraft] = useState(value)
  const [editing, setEditing] = useState(false)
  const [seen, setSeen] = useState(value)
  if (seen !== value && !editing) { setSeen(value); setDraft(value) }   // the saved line changed underneath: follow it
  function commit() { setEditing(false); if (draft.trim() !== value) onSave(draft.trim()) }
  if (editing || !value) {
    return (
      <input className={`pf-inline ${className}`} value={draft} onChange={e => setDraft(e.target.value)} placeholder={placeholder} aria-label={label}
        autoFocus={editing} onFocus={() => setEditing(true)} onBlur={commit} onKeyDown={e => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') { setDraft(value); setEditing(false) } }}
        style={{ ...style, borderBottomColor: value ? 'transparent' : undefined }} />
    )
  }
  return <button type="button" className={className} onClick={() => setEditing(true)} aria-label={`Edit: ${label}`} style={{ background: 'none', border: 0, padding: 0, color: 'inherit', cursor: 'pointer', textAlign: 'left', ...style }}>{value}</button>
}

// Destructive: Ink sweeps across the pill for 1.6 seconds while pressed. Release when full and it is gone.
function HoldToRemove({ onConfirm }: { onConfirm: () => void }) {
  const [holding, setHolding] = useState(false)
  const timer = useRef<number | null>(null)
  const full = useRef(false)
  function start() {
    if (timer.current !== null) return
    full.current = false
    setHolding(true)
    timer.current = window.setTimeout(() => { full.current = true }, HOLD_MS)
  }
  function release() {
    if (timer.current !== null) { window.clearTimeout(timer.current); timer.current = null }
    setHolding(false)
    if (full.current) { full.current = false; onConfirm() }
  }
  return (
    <button type="button" className="pf-btn pf-btn--secondary" aria-label="Hold to remove"
      onPointerDown={start} onPointerUp={release} onPointerLeave={release} onPointerCancel={release}
      onKeyDown={e => { if ((e.key === ' ' || e.key === 'Enter') && !e.repeat) { e.preventDefault(); start() } }}
      onKeyUp={e => { if (e.key === ' ' || e.key === 'Enter') release() }}
      style={{ position: 'relative', overflow: 'hidden', touchAction: 'none', userSelect: 'none', WebkitUserSelect: 'none' }}>
      <span>Hold to remove</span>
      <span aria-hidden="true" style={{
        position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', background: 'var(--action)', color: 'var(--action-text)',
        clipPath: holding ? 'inset(0 0 0 0)' : 'inset(0 100% 0 0)',
        transition: holding ? `clip-path ${HOLD_MS}ms linear` : 'clip-path 200ms cubic-bezier(.23,1,.32,1)',
      }}>Hold to remove</span>
    </button>
  )
}

function EmptyMark() {
  return (
    <svg width="56" height="56" viewBox="0 0 56 56" aria-hidden="true" style={{ display: 'block', flexShrink: 0 }}>
      <circle cx="28" cy="28" r="24" fill="none" stroke="var(--border)" strokeWidth="1" strokeDasharray="1.5 5" strokeLinecap="round" />
    </svg>
  )
}

function Chevrons({ onPrev, onNext, nextDisabled = false, prevLabel, nextLabel }: { onPrev: () => void; onNext: () => void; nextDisabled?: boolean; prevLabel: string; nextLabel: string }) {
  return (
    <div style={{ display: 'flex', gap: 8 }}>
      <button type="button" className="pf-chev" aria-label={prevLabel} onClick={onPrev}><ChevronLeft size={16} strokeWidth={1.5} aria-hidden="true" /></button>
      <button type="button" className="pf-chev" aria-label={nextLabel} disabled={nextDisabled} onClick={onNext}><ChevronRight size={16} strokeWidth={1.5} aria-hidden="true" /></button>
    </div>
  )
}

// ── the page ──────────────────────────────────────────────────────────

export function Goals() {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const active: Horizon = pathname.endsWith('/year') ? 'year' : pathname.endsWith('/month') ? 'month' : pathname.endsWith('/week') ? 'week' : 'quarter'
  return (
    <div className="pf-stack-lg" style={{ gap: 28 }}>
      <div className="pf-segments" role="tablist" aria-label="Horizon">
        {TABS.map(t => (
          <button key={t.id} type="button" role="tab" aria-selected={active === t.id} className="pf-segment" onClick={() => navigate(t.path)}>{t.label}</button>
        ))}
      </div>
      {active === 'year' && <Year />}
      {active === 'quarter' && <Quarter />}
      {active === 'month' && <Month />}
      {active === 'week' && <Week />}
    </div>
  )
}

// ── quarter: two lanes, three each, ninety days ───────────────────────

function GoalRow({ goal, serves, landing, onOpen, onBump }: { goal: Goal90; serves?: string; landing: boolean; onOpen: () => void; onBump: () => void }) {
  const measurable = !!goal.target && goal.target > 0
  const current = goal.current ?? 0
  const pct = goalProgress(goal) ?? 0
  const unit = shortUnit(goal.unit)
  const pop = usePop(current)
  const toGo = measurable ? Math.max(0, (goal.target ?? 0) - current) : 0
  return (
    <div className={`pf-row ${goal.done && !landing ? 'pf-faded' : ''} ${landing ? 'is-landed' : ''}`} style={{ gridTemplateColumns: 'minmax(0,1fr)', padding: '18px 0' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, minWidth: 0 }}>
        <button type="button" onClick={onOpen} aria-label={`Edit ${goal.title}`} style={{ ...flat, display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0 }}>
          <span className="pf-h4">{goal.title}{goal.done ? '.' : ''}</span>
          {goal.why && <span className="pf-small">{goal.why}</span>}
        </button>
        {measurable && !goal.done ? (
          <button type="button" className="pf-goalbtn" onClick={onBump} aria-label={`Add one ${goal.unit ?? ''} to ${goal.title}`.replace(/\s+/g, ' ')}>
            <span style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12 }}>
              <span className="pf-num pf-num--sm"><span className={`pf-pop ${pop ? 'is-pop' : ''}`}>{current}</span><span className="pf-unit">/{goal.target} {unit}</span></span>
              <span className="pf-cap" style={{ whiteSpace: 'nowrap' }}>{toGo} to go · tap for one more</span>
            </span>
            <DepthBar pct={pct} style={{ marginTop: 6 }} />
          </button>
        ) : goal.done ? (
          <div>
            <DepthBar pct={100} landed />
            <span className="pf-cap" style={{ display: 'block', marginTop: 8, color: 'var(--text-brand)' }}>Landed.{measurable ? ` ${goal.target} ${goal.unit ?? ''}.`.replace(/\s+\./, '.') : ''}</span>
          </div>
        ) : (
          <div>
            <DepthBar pct={0} />
            <span className="pf-cap" style={{ display: 'block', marginTop: 8 }}>{goal.measure || 'Open'} · tap the title to give it a number</span>
          </div>
        )}
        {(serves || goal.milestones.length > 0) && !goal.done && (
          <span className="pf-cap" style={{ color: 'var(--text-3)' }}>
            {serves && <span style={{ color: 'var(--text-brand)' }}>serves {serves}</span>}
            {serves && goal.milestones.length > 0 ? ' · ' : ''}
            {goal.milestones.join(' · ')}
          </span>
        )}
      </div>
    </div>
  )
}

// The goal sheet. A preview ring at the top fills as she makes the goal measurable.
function GoalForm({ goal, outcomes, onSave, onRemove }: { goal: Goal90; outcomes: YearOutcome[]; onSave: (patch: Partial<Goal90>) => void; onRemove: () => void }) {
  const [title, setTitle] = useState(goal.title)
  const [why, setWhy] = useState(goal.why ?? '')
  const [measure, setMeasure] = useState(goal.measure ?? '')
  const [target, setTarget] = useState(goal.target != null ? String(goal.target) : '')
  const [current, setCurrent] = useState(goal.current != null ? String(goal.current) : '')
  const [unit, setUnit] = useState(goal.unit ?? '')
  const [yearId, setYearId] = useState(goal.yearId ?? '')
  const [milestones, setMilestones] = useState(goal.milestones.join('\n'))
  const [done, setDone] = useState(goal.done)

  function num(s: string) { const n = Number(s.replace(/[^\d.]/g, '')); return s.trim() && Number.isFinite(n) ? n : undefined }
  const t = num(target) ?? 0, c = num(current) ?? 0
  const pct = done ? 100 : t > 0 ? Math.min(100, Math.round((c / t) * 100)) : 0

  function save() {
    if (!title.trim()) return
    onSave({
      title: title.trim(), why: why.trim() || undefined, measure: measure.trim() || undefined,
      target: num(target), current: num(current), unit: unit.trim() || undefined, yearId: yearId || undefined,
      milestones: milestones.split('\n').map(s => s.trim()).filter(Boolean).slice(0, 4), done,
    })
  }

  return (
    <div className="pf-fields" style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div>
        <span style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12 }}>
          {done ? <span className="pf-cap" style={{ color: 'var(--text-brand)' }}>Landed.</span>
            : t > 0 ? <span className="pf-num pf-num--sm">{c}<span className="pf-unit">/{t} {shortUnit(unit)}</span></span>
            : <span className="pf-cap">Open</span>}
          <span className="pf-cap">{t > 0 ? `${Math.max(0, t - c)} to go` : ''}</span>
        </span>
        <DepthBar pct={pct} landed={done} style={{ marginTop: 6 }} />
        <p className="pf-small" style={{ marginTop: 10 }}>{t > 0 ? `The bar fills as ${unit.trim() || 'the number'} comes in. When it lands, the dot arrives.` : 'Give it a number and the bar can fill.'}</p>
      </div>
      <Field label="Goal">
        <input className="pf-input" value={title} onChange={e => setTitle(e.target.value)} placeholder="One outcome for this quarter" aria-label="Goal" />
      </Field>
      <Field label="Why">
        <input className="pf-input" value={why} onChange={e => setWhy(e.target.value)} placeholder="In your words" aria-label="Why this goal" />
      </Field>
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr) minmax(0,1.2fr)', gap: 10 }}>
        <Field label="Target">
          <input className="pf-input pf-mono" value={target} onChange={e => setTarget(e.target.value)} inputMode="decimal" placeholder="20" aria-label="Target" />
        </Field>
        <Field label="Now">
          <input className="pf-input pf-mono" value={current} onChange={e => setCurrent(e.target.value)} inputMode="decimal" placeholder="0" aria-label="Current value" />
        </Field>
        <Field label="Unit">
          <input className="pf-input" value={unit} onChange={e => setUnit(e.target.value)} placeholder="hours" aria-label="Unit" />
        </Field>
      </div>
      <div className="pf-fieldset" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {UNITS.map(u => <button key={u} type="button" className="pf-chip pf-chip--haze" aria-pressed={unit === u} onClick={() => setUnit(u)} style={{ minHeight: 34, padding: '7px 12px', fontSize: 13 }}>{u}</button>)}
      </div>
      <Field label="How you know it landed">
        <input className="pf-input" value={measure} onChange={e => setMeasure(e.target.value)} placeholder="The evidence" aria-label="Measure" />
      </Field>
      {outcomes.length > 0 && (
        <div className="pf-fieldset">
          <span className="pf-cap pf-label">Serves this year</span>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {outcomes.map(o => <button key={o.id} type="button" className="pf-chip pf-chip--haze" aria-pressed={yearId === o.id} onClick={() => setYearId(yearId === o.id ? '' : o.id)}>{o.title}</button>)}
          </div>
        </div>
      )}
      <Field label="Milestones, one per line, four at most">
        <textarea className="pf-textarea" value={milestones} onChange={e => setMilestones(e.target.value)} placeholder="The steps between here and there" aria-label="Milestones" />
      </Field>
      <div className="pf-fieldset">
        <button type="button" className="pf-toggle" aria-pressed={done} onClick={() => setDone(d => !d)}>
          <span>{done ? 'Done' : 'Open'}</span>
          <span className="pf-track" aria-hidden="true"><span /></span>
        </button>
      </div>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap', marginTop: 8 }}>
        <button type="button" className="pf-btn pf-btn--primary" onClick={save} disabled={!title.trim()}>Save</button>
        <HoldToRemove onConfirm={onRemove} />
      </div>
    </div>
  )
}

function LaneSection({ lane, goals, outcomes, landing, onOpen, onBump, onAdd }: {
  lane: Lane; goals: Goal90[]; outcomes: YearOutcome[]; landing: string | null; onOpen: (id: string) => void; onBump: (g: Goal90) => void; onAdd: (lane: Lane, title: string) => void
}) {
  const [draft, setDraft] = useState('')
  const full = goals.length >= MAX_PER_LANE
  const done = goals.filter(g => g.done).length
  function add() { const t = draft.trim(); if (!t) return; onAdd(lane, t); setDraft('') }

  return (
    <section aria-label={`${LANE_LABEL[lane]} goals`}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12, marginBottom: 6 }}>
        <span className="pf-cap">{LANE_LABEL[lane]} · 90 days</span>
        <span className="pf-num pf-num--sm">{done}<span className="pf-unit">/{goals.length} done</span></span>
      </div>
      <div className={`pf-rows ${landing && goals.some(g => g.id === landing) ? 'is-landing' : ''}`}>
        {goals.length === 0 && (
          <div className="pf-row" style={{ gridTemplateColumns: 'auto minmax(0,1fr)', padding: '22px 0' }}>
            <EmptyMark />
            <span className="pf-small">Nothing yet.</span>
          </div>
        )}
        {goals.map(g => <GoalRow key={g.id} goal={g} serves={outcomes.find(o => o.id === g.yearId)?.title} landing={landing === g.id} onOpen={() => onOpen(g.id)} onBump={() => onBump(g)} />)}
        <div className="pf-row" style={{ gridTemplateColumns: 'minmax(0,1fr)' }}>
          {full ? (
            <span className="pf-small">Three is enough. Finish one first.</span>
          ) : (
            <input className="pf-inline" value={draft} onChange={e => setDraft(e.target.value)} onKeyDown={e => e.key === 'Enter' && add()}
              placeholder="One goal for this quarter" aria-label={`Add a ${LANE_LABEL[lane].toLowerCase()} goal`} />
          )}
        </div>
      </div>
    </section>
  )
}

export function Quarter({ lanes = LANES, compact = false }: { lanes?: Lane[]; compact?: boolean } = {}) {
  const goals = useGoalStore(s => s.goals)
  const addGoal = useGoalStore(s => s.addGoal)
  const updateGoal = useGoalStore(s => s.updateGoal)
  const deleteGoal = useGoalStore(s => s.deleteGoal)
  const setProgress = useGoalStore(s => s.setProgress)
  const outcomes = useFocusStore(s => s.outcomes)
  const [editing, setEditing] = useState<string | null>(null)
  const [fresh, setFresh] = useState<string | null>(null)
  const [landing, setLanding] = useState<string | null>(null)
  useEffect(() => {
    if (!landing) return
    const t = setTimeout(() => setLanding(null), 2600)
    return () => clearTimeout(t)
  }, [landing])

  const q = quarterInfo()
  const y = yearInfo()
  const inQuarter = goals.filter(g => g.quarter === q.key)
  const open = inQuarter.find(g => g.id === editing) ?? null
  const yearOutcomes = outcomes.filter(o => o.year === y.key)
  const doneCount = inQuarter.filter(g => g.done).length

  function close() { setEditing(null) }
  // One more. Reaching the target lands the goal: the bar goes Depth, the dot arrives, the row holds sharp for a breath.
  function bump(g: Goal90) {
    const next = (g.current ?? 0) + 1
    setProgress(g.id, next)
    if (g.target && next >= g.target) { updateGoal(g.id, { done: true }); setLanding(g.id) }
  }
  function add(lane: Lane, title: string) {
    const id = addGoal(lane, title)
    if (id) { setFresh(id); setEditing(id) }   // straight into the sheet: give it a number, and the ring can fill
  }

  return (
    <div className="pf-stack-lg">
      {compact ? (
        <p className="pf-cap">{q.key} · day {q.day} of {q.total} · {q.daysLeft} days left</p>
      ) : (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 24, flexWrap: 'wrap' }}>
        <div>
          <p className="pf-over">{q.key} · day {q.day} of {q.total}</p>
          <h1 className="pf-h2" style={{ marginTop: 12 }}>Two lanes. Six goals at most.</h1>
          <p className="pf-body" style={{ marginTop: 12 }}>
            {inQuarter.length === 0 ? 'Business and life. Both win.' : doneCount === inQuarter.length ? 'All of them landed. Set the next six.' : `${doneCount} of ${inQuarter.length} landed. ${q.daysLeft} days left.`}
          </p>
        </div>
        <ApertureRing value={q.day} max={q.total} size={112} stroke={7} ticks={[1 / 3, 2 / 3]}>
          <span className="pf-num pf-num--sm">{q.daysLeft}<span className="pf-unit">days</span></span>
          <span className="pf-cap" style={{ color: 'var(--text-3)' }}>left</span>
        </ApertureRing>
      </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '40px 48px' }}>
        {lanes.map(lane => (
          <LaneSection key={lane} lane={lane} goals={inQuarter.filter(g => g.lane === lane)} outcomes={yearOutcomes.filter(o => o.lane === lane)} landing={landing}
            onOpen={setEditing} onBump={bump} onAdd={add} />
        ))}
      </div>

      {open && (
        <Sheet open onClose={close} title={open.id === fresh ? 'Make it real.' : 'Edit goal'}>
          <GoalForm key={open.id} goal={open} outcomes={yearOutcomes.filter(o => o.lane === open.lane)}
            onSave={patch => { updateGoal(open.id, patch); close() }}
            onRemove={() => { deleteGoal(open.id); close() }} />
        </Sheet>
      )}
    </div>
  )
}

// ── year: one word, three outcomes per lane ───────────────────────────

function Year() {
  const y = yearInfo()
  const years = useFocusStore(s => s.years)
  const outcomes = useFocusStore(s => s.outcomes)
  const setYear = useFocusStore(s => s.setYear)
  const addOutcome = useFocusStore(s => s.addOutcome)
  const updateOutcome = useFocusStore(s => s.updateOutcome)
  const deleteOutcome = useFocusStore(s => s.deleteOutcome)
  const goals = useGoalStore(s => s.goals)
  const wide = useMedia('(min-width: 768px)')
  const plan = years[y.key] ?? {}
  const mine = outcomes.filter(o => o.year === y.key)
  const [editing, setEditing] = useState<string | null>(null)
  const open = mine.find(o => o.id === editing) ?? null
  const done = mine.filter(o => o.done).length
  const quarter = quarterInfo().key

  return (
    <div className="pf-stack-lg">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 24, flexWrap: 'wrap' }}>
        <div style={{ minWidth: 0, flex: '1 1 320px' }}>
          <p className="pf-over">{y.key} · day {y.day} of {y.total}</p>
          <InlineLine value={plan.word ?? ''} placeholder="One word for the year" label="The word for the year" className="pf-h1 pf-word"
            onSave={v => setYear(y.key, { word: v.replace(/\.$/, '') })} style={{ marginTop: 12, display: 'block', maxWidth: '100%' }} />
          <InlineLine value={plan.line ?? ''} placeholder="What this year is about, in one line" label="The line for the year" className="pf-body"
            onSave={v => setYear(y.key, { line: v })} style={{ marginTop: 14, display: 'block', maxWidth: '56ch' }} />
        </div>
        <ApertureRing value={y.day} max={y.total} size={wide ? 176 : 140} stroke={9} ticks={[.25, .5, .75]}>
          <span className="pf-cap">left</span>
          <span className="pf-num pf-num--md">{y.daysLeft}<span className="pf-unit">days</span></span>
          <span className="pf-cap" style={{ color: 'var(--text-3)' }}>{done}<CapUnit>/{mine.length} landed</CapUnit></span>
        </ApertureRing>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '40px 48px' }}>
        {LANES.map(lane => {
          const rows = mine.filter(o => o.lane === lane)
          return (
            <OutcomeLane key={lane} lane={lane} rows={rows} goals={goals} quarter={quarter}
              onOpen={setEditing} onAdd={t => addOutcome(y.key, lane, t)} />
          )
        })}
      </div>

      <p className="pf-small">Three per lane. A quarter goal can serve one of these; the ring fills as those land.</p>

      {open && (
        <Sheet open onClose={() => setEditing(null)} title="Edit outcome">
          <OutcomeForm key={open.id} outcome={open}
            onSave={patch => { updateOutcome(open.id, patch); setEditing(null) }}
            onRemove={() => { deleteOutcome(open.id); setEditing(null) }} />
        </Sheet>
      )}
    </div>
  )
}

function OutcomeLane({ lane, rows, goals, quarter, onOpen, onAdd }: { lane: Lane; rows: YearOutcome[]; goals: Goal90[]; quarter: string; onOpen: (id: string) => void; onAdd: (t: string) => void }) {
  const [draft, setDraft] = useState('')
  const full = rows.length >= MAX_OUTCOMES
  function add() { const t = draft.trim(); if (!t) return; onAdd(t); setDraft('') }
  return (
    <section aria-label={`${LANE_LABEL[lane]} outcomes`}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12, marginBottom: 6 }}>
        <span className="pf-cap">{LANE_LABEL[lane]} · this year</span>
        <span className="pf-num pf-num--sm">{rows.length}<span className="pf-unit">/{MAX_OUTCOMES}</span></span>
      </div>
      <div className="pf-rows">
        {rows.length === 0 && (
          <div className="pf-row" style={{ gridTemplateColumns: 'auto minmax(0,1fr)', padding: '22px 0' }}>
            <EmptyMark />
            <span className="pf-small">Nothing yet.</span>
          </div>
        )}
        {rows.map(o => {
          const serving = goals.filter(g => g.yearId === o.id)
          const landed = serving.filter(g => g.done).length
          const depth = o.done ? 1 : serving.length ? landed / serving.length : 0
          return (
            <button key={o.id} type="button" className={`pf-row pf-row--press ${o.done ? 'pf-faded' : ''}`} onClick={() => onOpen(o.id)} aria-label={`Edit ${o.title}`}
              style={{ ...flat, width: '100%', gridTemplateColumns: 'auto minmax(0,1fr)', padding: '16px 0', borderTop: 0, borderLeft: 0, borderRight: 0 }}>
              <span style={{ width: 56, display: 'block', paddingTop: 6 }}><DepthBar pct={depth * 100} landed={o.done} height={4} /></span>
              <span style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0 }}>
                <span className="pf-h4">{o.title}</span>
                <span className="pf-cap">
                  {o.done ? 'Landed.' : serving.length === 0 ? 'No quarter goal serves this yet.' : serving.map(g => `${g.quarter === quarter ? 'Now' : g.quarter.slice(-2)}: ${g.title}${g.done ? ' (done)' : ''}`).join(' · ')}
                </span>
              </span>
            </button>
          )
        })}
        <div className="pf-row" style={{ gridTemplateColumns: 'minmax(0,1fr)' }}>
          {full ? (
            <span className="pf-small">Three is the year. Land one first.</span>
          ) : (
            <input className="pf-inline" value={draft} onChange={e => setDraft(e.target.value)} onKeyDown={e => e.key === 'Enter' && add()}
              placeholder="One outcome for this year" aria-label={`Add a ${LANE_LABEL[lane].toLowerCase()} outcome`} />
          )}
        </div>
      </div>
    </section>
  )
}

function OutcomeForm({ outcome, onSave, onRemove }: { outcome: YearOutcome; onSave: (patch: Partial<YearOutcome>) => void; onRemove: () => void }) {
  const [title, setTitle] = useState(outcome.title)
  const [done, setDone] = useState(outcome.done)
  return (
    <div className="pf-fields" style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <Field label="Outcome">
        <input className="pf-input" value={title} onChange={e => setTitle(e.target.value)} placeholder="What is true by December" aria-label="Outcome" autoFocus />
      </Field>
      <div className="pf-fieldset">
        <button type="button" className="pf-toggle" aria-pressed={done} onClick={() => setDone(d => !d)}>
          <span>{done ? 'Landed' : 'Open'}</span>
          <span className="pf-track" aria-hidden="true"><span /></span>
        </button>
      </div>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap', marginTop: 8 }}>
        <button type="button" className="pf-btn pf-btn--primary" onClick={() => title.trim() && onSave({ title: title.trim(), done })} disabled={!title.trim()}>Save</button>
        <HoldToRemove onConfirm={onRemove} />
      </div>
    </div>
  )
}

// ── month: one focus, the goals that get it, the weeks that carry it ──

function Month() {
  const [month, setMonth] = useState(() => monthKey())
  const current = monthKey()
  const m = monthInfo(month)
  const months = useFocusStore(s => s.months)
  const setMonthFocus = useFocusStore(s => s.setMonthFocus)
  const toggleMonthGoal = useFocusStore(s => s.toggleMonthGoal)
  const goals = useGoalStore(s => s.goals)
  const weeks = useWeekStore(s => s.weeks)
  const wide = useMedia('(min-width: 768px)')
  const plan = months[month] ?? { goalIds: [] }
  const quarter = quarterInfo(m.start).key
  const inQuarter = goals.filter(g => g.quarter === quarter)
  const chosen = inQuarter.filter(g => plan.goalIds.includes(g.id))
  const keys = weeksInMonth(month)
  const thisWeek = weekKey()
  const ticks = keys.slice(1).map(k => {
    const first = new Date(weekDatesFromKey(k)[0])
    return Math.max(0, (first.getTime() - m.start.getTime()) / (m.end.getTime() - m.start.getTime()))
  })
  const closed = keys.filter(k => weeks[k]?.status && weeks[k].status !== 'draft').length

  return (
    <div className="pf-stack-lg">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <p className="pf-over">{m.name}{month.slice(0, 4) !== current.slice(0, 4) ? ` ${month.slice(0, 4)}` : ''} · {m.inMonth ? `day ${m.day} of ${m.total}` : `${m.total} days`}</p>
        <Chevrons onPrev={() => setMonth(shiftMonth(month, -1))} onNext={() => setMonth(shiftMonth(month, 1))} nextDisabled={month >= shiftMonth(current, 2)} prevLabel="Previous month" nextLabel="Next month" />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 24, flexWrap: 'wrap' }}>
        <div style={{ minWidth: 0, flex: '1 1 320px' }}>
          <InlineLine value={plan.focus ?? ''} placeholder={`What ${m.name} is about`} label={`The focus for ${m.name}`} className="pf-h2"
            onSave={v => setMonthFocus(month, v && !/[.!?]$/.test(v) ? `${v}.` : v)} style={{ display: 'block', maxWidth: '100%' }} />
          <p className="pf-body" style={{ marginTop: 12 }}>
            {chosen.length === 0 ? 'One focus. Then pick the goals that get this month.' : `${chosen.length} ${chosen.length === 1 ? 'goal gets' : 'goals get'} ${m.name}. ${keys.length} weeks, ${closed} planned.`}
          </p>
        </div>
        <ApertureRing value={m.inMonth ? m.day : m.start > new Date() ? 0 : m.total} max={m.total} size={wide ? 152 : 128} stroke={8} ticks={ticks}>
          <span className="pf-cap">left</span>
          <span className="pf-num pf-num--md">{m.inMonth ? m.daysLeft : m.start > new Date() ? m.total : 0}<span className="pf-unit">days</span></span>
        </ApertureRing>
      </div>

      <section aria-label="Goals in play this month">
        <span className="pf-cap pf-label">In play this month</span>
        {inQuarter.length === 0 ? (
          <p className="pf-small">No goals for this quarter yet. <Link to="/goals" className="pf-btn pf-btn--tertiary" style={{ display: 'inline', padding: 0, minHeight: 0 }}>Set them</Link>.</p>
        ) : (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {inQuarter.map(g => (
              <button key={g.id} type="button" className={`pf-chip pf-chip--haze pf-chip--goal ${g.done ? 'pf-faded' : ''}`} aria-pressed={plan.goalIds.includes(g.id)} onClick={() => toggleMonthGoal(month, g.id)}>
                <span style={{ width: 24, display: 'inline-block' }}><DepthBar pct={goalProgress(g) ?? 0} landed={g.done} height={4} /></span>
                {g.title}
              </button>
            ))}
          </div>
        )}
      </section>

      <section aria-label="Weeks">
        <span className="pf-cap pf-label">The weeks</span>
        <div className="pf-rows">
          {keys.map(k => <WeekRow key={k} k={k} week={weeks[k]} goals={goals} now={k === thisWeek} />)}
        </div>
      </section>
    </div>
  )
}

function WeekRow({ k, week, goals, now }: { k: string; week?: WeekPlan; goals: Goal90[]; now: boolean }) {
  const ps = week?.priorities ?? []
  const done = ps.filter(p => p.done).length
  const status = !week || week.status === 'draft' ? (ps.length ? 'Drafted' : 'Not planned') : week.status === 'recapped' ? 'Recapped' : 'Planned'
  return (
    <div className={`pf-row ${now ? '' : 'pf-dim'}`} style={{ gridTemplateColumns: '64px minmax(0,1fr) auto', alignItems: 'start', padding: '16px 0' }}>
      <span style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <span className="pf-num pf-num--sm" style={{ color: now ? 'var(--text)' : undefined }}>W{weekNumber(k)}</span>
        <span className="pf-mono" style={{ fontSize: 11, color: 'var(--text-3)', letterSpacing: '.02em' }}>{weekLabel(k)}</span>
      </span>
      <span style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0 }}>
        {ps.length === 0 ? (
          <span className="pf-small" style={{ color: 'var(--text-3)' }}>{now ? 'No priorities yet. The session sets them.' : status}</span>
        ) : ps.map(p => {
          const g = goals.find(x => x.id === p.goalId)
          return (
            <span key={p.id} className={`pf-small ${p.done ? 'pf-faded' : ''}`} style={{ color: 'var(--text)', display: 'flex', gap: 8, alignItems: 'baseline', minWidth: 0 }}>
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.title}</span>
              {g && <span className="pf-cap" style={{ flexShrink: 0, color: 'var(--text-brand)' }}>{g.lane === 'life' ? 'life' : 'business'}</span>}
            </span>
          )
        })}
      </span>
      <span className="pf-cap" style={{ whiteSpace: 'nowrap' }}>{ps.length ? <><span className="pf-mono">{done}/{ps.length}</span> done</> : ''}</span>
    </div>
  )
}

// ── week: three priorities and what they serve ────────────────────────

function Week() {
  const [key, setKey] = useState(() => weekKey())
  const current = weekKey()
  const weeks = useWeekStore(s => s.weeks)
  const togglePriority = useWeekStore(s => s.togglePriority)
  const goals = useGoalStore(s => s.goals)
  const outcomes = useFocusStore(s => s.outcomes)
  const months = useFocusStore(s => s.months)
  const wide = useMedia('(min-width: 768px)')
  const week = weeks[key]
  const ps = week?.priorities ?? []
  const done = ps.filter(p => p.done).length
  const dates = weekDatesFromKey(key)
  const today = todayStr()
  const dayN = dates.indexOf(today) + 1
  const isNow = key === current
  const focus = months[dates[0].slice(0, 7)]?.focus
  const label = weekLabel(key)
  const headline = ps.length === 0
    ? (isNow ? 'No priorities yet.' : key < current ? 'No plan that week.' : 'Not planned yet.')
    : done === ps.length ? 'All three landed.' : `${ps.length} priorities. ${done} done.`

  return (
    <div className="pf-stack-lg">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <p className="pf-over">Week {weekNumber(key)} · {label}</p>
        <Chevrons onPrev={() => setKey(prevWeekKey(key))} onNext={() => setKey(nextWeekKey(key))} nextDisabled={key >= nextWeekKey(nextWeekKey(current))} prevLabel="Previous week" nextLabel="Next week" />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 24, flexWrap: 'wrap' }}>
        <div style={{ minWidth: 0, flex: '1 1 320px' }}>
          <h1 className="pf-h2">{headline}</h1>
          <p className="pf-body" style={{ marginTop: 12 }}>
            {focus ? `${focus} ` : ''}{week?.days && Object.keys(week.days).length > 0 ? `${Object.keys(week.days).length} days planned.` : isNow && ps.length === 0 ? 'The Weekly Session sets the three.' : ''}
          </p>
        </div>
        <ApertureRing value={isNow ? Math.max(0, dayN) : key < current ? 7 : 0} max={7} size={wide ? 128 : 112} stroke={8} ticks={[1 / 7, 2 / 7, 3 / 7, 4 / 7, 5 / 7, 6 / 7]}>
          {isNow ? (
            <>
              <span className="pf-num pf-num--sm">{Math.max(0, 7 - dayN)}<span className="pf-unit">days</span></span>
              <span className="pf-cap" style={{ color: 'var(--text-3)' }}>left</span>
            </>
          ) : <span className="pf-cap">{key < current ? 'Past' : 'Ahead'}</span>}
        </ApertureRing>
      </div>

      <section aria-label="Priorities">
        <div className="pf-rows">
          {ps.map(p => {
            const g = goals.find(x => x.id === p.goalId)
            const o = g?.yearId ? outcomes.find(x => x.id === g.yearId) : undefined
            return (
              <div key={p.id} className={`pf-row ${p.done ? 'pf-faded' : ''}`} style={{ padding: '16px 0' }}>
                <CircleCheck checked={p.done} onChange={() => togglePriority(key, p.id)} label={p.title} />
                <span style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0 }}>
                  <span className="pf-h4">{p.title}</span>
                  <span className="pf-cap">
                    {g ? <>serves <span style={{ color: 'var(--text-brand)' }}>{g.title}</span>{o ? <> · this year: {o.title}</> : null}</> : p.why || 'No goal behind this one.'}
                  </span>
                </span>
              </div>
            )
          })}
          {ps.length === 0 && (
            <div className="pf-row" style={{ gridTemplateColumns: 'auto minmax(0,1fr)', padding: '22px 0' }}>
              <EmptyMark />
              <span className="pf-small">{isNow ? <>Three priorities come from the session. <Link to="/session" className="pf-btn pf-btn--tertiary" style={{ display: 'inline', padding: 0, minHeight: 0 }}>Open it</Link>.</> : 'Nothing here.'}</span>
            </div>
          )}
        </div>
      </section>

      {isNow && ps.length > 0 && week?.status === 'draft' && (
        <p className="pf-small">The week is still a draft. <Link to="/session" className="pf-btn pf-btn--tertiary" style={{ display: 'inline', padding: 0, minHeight: 0 }}>Finish the session</Link>.</p>
      )}
    </div>
  )
}
