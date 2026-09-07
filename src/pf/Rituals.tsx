// Success habits: what she protects. Five at most, logged by day, the week drafted around them.
import { useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { useRitualStore, MAX_RITUALS, PHASE_LABEL, PHASE_HINT } from '../store/pf/ritualStore'
import type { Ritual, CyclePhase } from '../store/pf/ritualStore'
import { useWeekStore } from '../store/pf/weekStore'
import { weekDates, weekKey, todayStr, fmtDay, DAY_SHORT, DAY_LONG } from '../lib/pf/week'
import { Sheet } from './Sheet'

const HOLD_MS = 1600
const DAYS = [0, 1, 2, 3, 4, 5, 6]
const PHASE_TONE: Record<CyclePhase, string> = { menstrual: 'var(--depth-1)', follicular: 'var(--depth-2)', ovulatory: 'var(--depth-3)', luteal: 'var(--depth-4)' }
const DAY_GRID = { display: 'grid', gridTemplateColumns: 'repeat(7, 32px)', gap: 6 } as const
const PLAIN_BTN = { background: 'none', border: 0, padding: 0, font: 'inherit', color: 'inherit', cursor: 'pointer', textAlign: 'left' } as const

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="pf-fieldset">
      <span className="pf-cap pf-label">{label}</span>
      {children}
    </div>
  )
}

// A unit beside a caption-sized numeral keeps the caption's own size; 35 percent of 11px would vanish.
function CapUnit({ children, inherit = false }: { children: ReactNode; inherit?: boolean }) {
  return <span className="pf-unit" style={{ fontSize: 11, color: inherit ? 'inherit' : undefined }}>{children}</span>
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

// ── the sheet: new or existing ────────────────────────────────────────

function RitualForm({ ritual, onSave, onRemove }: { ritual: Ritual | null; onSave: (name: string, times: number, days: number[], cycleAware: boolean) => void; onRemove?: () => void }) {
  const [name, setName] = useState(ritual?.name ?? '')
  const [times, setTimes] = useState(ritual?.timesPerWeek ?? 3)
  const [days, setDays] = useState<number[]>(ritual?.preferredDays ?? [])
  const [cycleAware, setCycleAware] = useState(ritual?.cycleAware ?? false)

  function toggleDay(d: number) { setDays(cur => cur.includes(d) ? cur.filter(x => x !== d) : [...cur, d].sort()) }
  function save() { if (!name.trim()) return; onSave(name.trim(), times, days, cycleAware) }

  return (
    <div className="pf-fields" style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <Field label="Habit">
        <input className="pf-input" value={name} onChange={e => setName(e.target.value)} onKeyDown={e => e.key === 'Enter' && save()} placeholder="Run, pilates, a screen-free evening" aria-label="Ritual name" autoFocus={!ritual} />
      </Field>
      <Field label="Times a week">
        <div style={DAY_GRID} role="radiogroup" aria-label="Times a week">
          {[1, 2, 3, 4, 5, 6, 7].map(n => (
            <button key={n} type="button" role="radio" aria-checked={times === n} aria-label={`${n} a week`} className="pf-day" aria-pressed={times === n} onClick={() => setTimes(n)}>{n}</button>
          ))}
        </div>
      </Field>
      <Field label="Preferred days">
        <div style={DAY_GRID}>
          {DAYS.map(d => (
            <button key={d} type="button" className="pf-day" aria-pressed={days.includes(d)} aria-label={DAY_LONG[d]} onClick={() => toggleDay(d)}>{DAY_SHORT[d].slice(0, 2)}</button>
          ))}
        </div>
      </Field>
      <div className="pf-fieldset">
        <button type="button" className="pf-toggle" aria-pressed={cycleAware} onClick={() => setCycleAware(v => !v)}>
          <span>Cycle-aware</span>
          <span className="pf-track" aria-hidden="true"><span /></span>
        </button>
        <p className="pf-small" style={{ marginTop: 8 }}>Moves with your phase when the week is drafted.</p>
      </div>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap', marginTop: 8 }}>
        <button type="button" className="pf-btn pf-btn--primary" onClick={save} disabled={!name.trim()}>{ritual ? 'Save' : 'Add'}</button>
        {onRemove && <HoldToRemove onConfirm={onRemove} />}
      </div>
    </div>
  )
}

// ── one ritual, one week ──────────────────────────────────────────────

function RitualStrip({ ritual, dates, today, planned, logs, onOpen, onLog }: {
  ritual: Ritual; dates: string[]; today: string; planned: number[]; logs: Record<string, string[]>; onOpen: () => void; onLog: (date: string) => void
}) {
  const done = dates.filter(d => (logs[d] ?? []).includes(ritual.id)).length
  const held = done >= ritual.timesPerWeek
  return (
    <div className="pf-row" style={{ gridTemplateColumns: 'minmax(0,1fr)', gap: 10, padding: '16px 0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12 }}>
        <button type="button" className="pf-hit" onClick={onOpen} aria-label={`Edit ${ritual.name}`} style={{ ...PLAIN_BTN, fontSize: 16, fontWeight: 500, lineHeight: 1.3 }}>{ritual.name}</button>
        <span className="pf-cap" style={{ color: held ? 'var(--text-brand)' : undefined, whiteSpace: 'nowrap' }}>
          {done}<CapUnit inherit={held}>/{ritual.timesPerWeek} this week</CapUnit>{held && ' Held.'}
        </span>
      </div>
      <div style={DAY_GRID}>
        {dates.map((d, i) => {
          const logged = (logs[d] ?? []).includes(ritual.id)
          const isPlanned = planned.includes(i) && !logged
          const future = d > today
          return (
            <button key={d} type="button" className="pf-day" aria-pressed={logged} disabled={future} onClick={() => onLog(d)}
              style={isPlanned ? { borderStyle: 'dashed', borderColor: 'var(--text-3)' } : undefined}
              aria-label={`${ritual.name}, ${DAY_LONG[i]} ${fmtDay(d, 'd MMMM')}${logged ? ', logged' : isPlanned ? ', planned' : ''}`}>
              {fmtDay(d, 'd')}
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ── cycle ─────────────────────────────────────────────────────────────

function CyclePanel({ dates, today }: { dates: string[]; today: string }) {
  const cycleStart = useRitualStore(s => s.cycleStart)
  const cycleLength = useRitualStore(s => s.cycleLength)
  const setCycle = useRitualStore(s => s.setCycle)
  const phaseOn = useRitualStore(s => s.phaseOn)
  const [lengthDraft, setLengthDraft] = useState(String(cycleLength))

  function commitLength() {
    const n = Math.round(Number(lengthDraft))
    if (!Number.isFinite(n) || n < 21 || n > 40) { setLengthDraft(String(cycleLength)); return }
    setCycle(cycleStart, n)
  }
  const phase = cycleStart ? phaseOn(today) : null

  return (
    <section className="pf-panel" aria-label="Cycle-aware planning">
      <span className="pf-cap pf-label">Cycle-aware planning</span>
      <p className="pf-body" style={{ marginBottom: 18 }}>Optional. Stays on this device.</p>
      <div className="pf-fields" style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 112px', gap: 10 }}>
        <Field label="First day of your last period">
          <input className="pf-input pf-mono" type="date" value={cycleStart ?? ''} max={today} onChange={e => setCycle(e.target.value || null)} aria-label="First day of your last period" style={{ padding: '10px 12px' }} />
        </Field>
        <Field label="Length">
          <input className="pf-input pf-mono" inputMode="numeric" value={lengthDraft} onChange={e => setLengthDraft(e.target.value)} onBlur={commitLength}
            onKeyDown={e => e.key === 'Enter' && commitLength()} aria-label="Cycle length in days, 21 to 40" style={{ padding: '10px 12px' }} />
        </Field>
      </div>
      {phase && (
        <div style={{ marginTop: 22, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <h3 className="pf-h4">{PHASE_LABEL[phase]}</h3>
            <p className="pf-small" style={{ marginTop: 4 }}>{PHASE_HINT[phase]}</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 20px)', gap: 8 }} role="list" aria-label="This week's phases">
            {dates.map((d, i) => {
              const p = phaseOn(d)
              return (
                <div key={d} role="listitem" aria-label={`${DAY_LONG[i]}, ${p ? PHASE_LABEL[p] : 'unknown'}`} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                  <span aria-hidden="true" style={{ width: 8, height: 8, borderRadius: '50%', background: p ? PHASE_TONE[p] : 'var(--border)', display: 'block' }} />
                  <span className="pf-cap pf-mono" aria-hidden="true" style={{ fontWeight: d === today ? 500 : 400, color: d === today ? 'var(--text)' : undefined }}>{DAY_SHORT[i].slice(0, 2)}</span>
                </div>
              )
            })}
          </div>
          <div>
            <button type="button" className="pf-btn pf-btn--tertiary" onClick={() => { setCycle(null); setLengthDraft(String(cycleLength)) }}>Clear</button>
          </div>
        </div>
      )}
    </section>
  )
}

// ── the page ──────────────────────────────────────────────────────────

export function Rituals() {
  const rituals = useRitualStore(s => s.rituals)
  const logs = useRitualStore(s => s.logs)
  const addRitual = useRitualStore(s => s.addRitual)
  const updateRitual = useRitualStore(s => s.updateRitual)
  const deleteRitual = useRitualStore(s => s.deleteRitual)
  const toggleLog = useRitualStore(s => s.toggleLog)
  const week = useWeekStore(s => s.weeks[weekKey()])
  const [sheet, setSheet] = useState<'closed' | 'new' | string>('closed')

  const dates = weekDates()
  const today = todayStr()
  const editing = rituals.find(r => r.id === sheet) ?? null
  const atLimit = rituals.length >= MAX_RITUALS

  function close() { setSheet('closed') }

  return (
    <div className="pf-stack-lg pf-narrow">
      <div>
        <p className="pf-over">Success habits</p>
        <h1 className="pf-h2" style={{ marginTop: 12 }}>What you protect.</h1>
        <p className="pf-body" style={{ marginTop: 12 }}>Five at most. The week is drafted around them.</p>
      </div>

      <section aria-label="This week">
        <div style={{ ...DAY_GRID, marginBottom: 4 }} aria-hidden="true">
          {dates.map((d, i) => (
            <span key={d} className="pf-cap pf-mono" style={{ textAlign: 'center', fontWeight: d === today ? 500 : 400, color: d === today ? 'var(--text)' : undefined }}>{DAY_SHORT[i].slice(0, 2)}</span>
          ))}
        </div>
        <div className="pf-rows">
          {rituals.length === 0 && (
            <div className="pf-row" style={{ gridTemplateColumns: 'auto minmax(0,1fr)', padding: '22px 0' }}>
              <svg width="56" height="56" viewBox="0 0 56 56" aria-hidden="true" style={{ display: 'block' }}>
                <circle cx="28" cy="28" r="24" fill="none" stroke="var(--border)" strokeWidth="1" strokeDasharray="1.5 5" strokeLinecap="round" />
              </svg>
              <span className="pf-small">Nothing yet.</span>
            </div>
          )}
          {rituals.map(r => (
            <RitualStrip key={r.id} ritual={r} dates={dates} today={today} logs={logs}
              planned={week?.ritualDays[r.id] ?? r.preferredDays} onOpen={() => setSheet(r.id)} onLog={d => toggleLog(r.id, d)} />
          ))}
        </div>
        <div style={{ marginTop: 20 }}>
          {atLimit ? (
            <p className="pf-small">Five is the limit. Fewer is more here.</p>
          ) : (
            <button type="button" className="pf-btn pf-btn--secondary" onClick={() => setSheet('new')}>Add a habit</button>
          )}
        </div>
      </section>

      <CyclePanel dates={dates} today={today} />

      {(sheet === 'new' || editing) && (
        <Sheet open onClose={close} title={editing ? 'Edit habit' : 'A habit'}>
          <RitualForm key={editing?.id ?? 'new'} ritual={editing}
            onSave={(name, times, days, cycleAware) => {
              if (editing) updateRitual(editing.id, { name, timesPerWeek: times, preferredDays: days, cycleAware })
              else addRitual(name, times, { preferredDays: days, cycleAware, emoji: '' })
              close()
            }}
            onRemove={editing ? () => { deleteRitual(editing.id); close() } : undefined} />
        </Sheet>
      )}
    </div>
  )
}
