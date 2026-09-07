// Today: the current block is sharp, everything else soft. The nav pill is the dense object,
// so this page carries no Ink pill of its own; the only primary appears inside the rebuild sheet, on the proposal.
import { useEffect, useState } from 'react'
import type { CSSProperties, ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Pencil } from 'lucide-react'
import { useWeekStore } from '../store/pf/weekStore'
import type { Block, BlockKind, WeekPlan } from '../store/pf/weekStore'
import { useGoalStore, LANE_LABEL } from '../store/pf/goalStore'
import { useRitualStore } from '../store/pf/ritualStore'
import { useCalendarStore } from '../store/calendarStore'
import { useGoogleCalendar } from '../hooks/useGoogleCalendar'
import { replanDay } from '../lib/pf/assistant'
import type { DayReplan } from '../lib/pf/assistant'
import { AIError } from '../lib/ai'
import { weekKey, weekNumber, weekDatesFromKey, todayStr } from '../lib/pf/week'
import { ApertureLoader, CircleCheck } from './Aperture'
import { Sheet } from './Sheet'

const KIND_LABEL: Record<BlockKind, string> = { priority: 'Priority', ritual: 'Habit', event: 'Event', admin: 'Admin', rest: 'Rest', other: 'Other' }
function hhmm() { return new Date().toTimeString().slice(0, 5) }
function byStart(a: Block, b: Block) { return a.start.localeCompare(b.start) }

export function Today() {
  const key = weekKey()
  const date = todayStr()
  const week = useWeekStore(s => s.weeks[key])
  const togglePriority = useWeekStore(s => s.togglePriority)
  const toggleBlock = useWeekStore(s => s.toggleBlock)
  const updateBlock = useWeekStore(s => s.updateBlock)
  const replaceDay = useWeekStore(s => s.replaceDay)
  const goals = useGoalStore(s => s.goals)
  const rituals = useRitualStore(s => s.rituals)
  const logs = useRitualStore(s => s.logs)
  const toggleLog = useRitualStore(s => s.toggleLog)
  const events = useCalendarStore(s => s.events)
  const { connected, connect, refresh } = useGoogleCalendar()

  // The clock ticks once a minute; the current block follows it.
  const [now, setNow] = useState(hhmm)
  useEffect(() => {
    const t = setInterval(() => setNow(hhmm()), 60_000)
    return () => clearInterval(t)
  }, [])
  const [editing, setEditing] = useState<Block | null>(null)
  const [adding, setAdding] = useState(false)
  const [rebuilding, setRebuilding] = useState(false)

  if (!week?.sessionCompletedAt) return <EmptyToday />

  const day = week.days[date]
  const blocks = [...(day?.blocks ?? [])].sort(byStart)
  const current = blocks.find(b => b.start <= now && now < b.end)
  const priorities = week.priorities
  const allDone = priorities.length > 0 && priorities.every(p => p.done)
  const evening = now >= '20:00'
  const dates = weekDatesFromKey(key)
  const todayEvents = events
    .filter(e => e.start.slice(0, 10) === date && !blocks.some(b => b.title === e.summary))
    .sort((a, b) => a.start.localeCompare(b.start))

  function onBlockToggle(b: Block) {
    toggleBlock(key, date, b.id)
    if (b.kind === 'ritual' && b.ritualId) toggleLog(b.ritualId, date)
  }
  function saveBlocks(next: Block[], intention?: string) {
    replaceDay(key, date, [...next].sort(byStart), intention ?? day?.intention)
  }

  return (
    <div className="pf-enter pf-stack-lg pf-narrow">
      <header className="pf-stack" style={{ gap: 14 }}>
        <p className="pf-over">Today · week {weekNumber(key)}</p>
        <h1 className="pf-h2">{current ? (/[.!?]$/.test(current.title) ? current.title : `${current.title}.`) : day?.intention || 'One thing at a time.'}</h1>
        {evening && <p className="pf-small">Enough for today. The studio sees you tomorrow.</p>}
      </header>

      <section>
        <span className="pf-cap pf-label">Your three</span>
        <div className="pf-rows">
          {priorities.map(p => {
            const goal = goals.find(g => g.id === p.goalId)
            return (
              <div key={p.id} className={`pf-row ${p.done ? 'pf-faded' : ''}`}>
                <CircleCheck checked={p.done} onChange={() => togglePriority(key, p.id)} label={p.title} />
                <span style={{ fontSize: 16 }}>{p.title}</span>
                <span className="pf-cap">{goal ? LANE_LABEL[goal.lane] : ''}</span>
              </div>
            )
          })}
          {priorities.length === 0 && <p className="pf-cap">Nothing yet.</p>}
        </div>
        {allDone && <p className="pf-small" style={{ marginTop: 12 }}>Three of three. They stand.</p>}
      </section>

      <section>
        <span className="pf-cap pf-label">Today</span>
        <div className="pf-rows">
          {blocks.map(b => {
            const isNow = current?.id === b.id
            const past = !b.done && b.end <= now
            const plane = current ? (isNow ? 'pf-sharp' : b.end <= now ? 'pf-soft' : 'pf-dim') : ''
            return (
              <div key={b.id} className={`pf-row ${plane}`}>
                <KindDot kind={b.kind} />
                <div style={{ minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                    <span className="pf-cap pf-mono">{b.start} to {b.end}</span>
                    {isNow && <span className="pf-glass"><b>Now</b></span>}
                  </div>
                  <span className={past || b.done ? 'pf-faded' : ''} style={{ display: 'block', fontSize: 16, fontWeight: isNow ? 500 : 400, marginTop: 2 }}>{b.title}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <button type="button" className="pf-day" aria-label={`Edit ${b.title}`} onClick={() => setEditing(b)}>
                    <Pencil size={15} strokeWidth={1.5} aria-hidden="true" />
                  </button>
                  <CircleCheck checked={b.done} onChange={() => onBlockToggle(b)} label={`${b.title} done`} />
                </div>
              </div>
            )
          })}
          {blocks.length === 0 && <p className="pf-cap">Nothing planned. That's allowed.</p>}
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '10px 18px', marginTop: 18 }}>
          <button type="button" className="pf-btn pf-btn--secondary" onClick={() => setRebuilding(true)}>Rebuild the rest of today</button>
          <button type="button" className="pf-btn pf-btn--tertiary" onClick={() => setAdding(true)}>+ block</button>
        </div>
      </section>

      <section>
        <span className="pf-cap pf-label">Calendar</span>
        {todayEvents.length > 0 ? (
          <div className="pf-rows">
            {todayEvents.map(e => (
              <div key={e.id} className="pf-row">
                <span className="pf-cap pf-mono">{e.start.includes('T') ? `${e.start.slice(11, 16)} to ${e.end.slice(11, 16)}` : 'all day'}</span>
                <span style={{ fontSize: 15 }}>{e.summary}</span>
                <span />
              </div>
            ))}
          </div>
        ) : (
          <p className="pf-cap">{connected ? 'Nothing today.' : 'Not connected.'}</p>
        )}
        <div style={{ marginTop: 6 }}>
          {connected
            ? <button type="button" className="pf-btn pf-btn--tertiary" onClick={() => { void refresh() }}>Refresh</button>
            : <button type="button" className="pf-btn pf-btn--tertiary" onClick={() => { void connect() }}>Connect Google Calendar</button>}
        </div>
      </section>

      <section>
        <span className="pf-cap pf-label">Success habits</span>
        <div className="pf-rows">
          {rituals.map(r => {
            const count = dates.filter(d => (logs[d] ?? []).includes(r.id)).length
            const done = (logs[date] ?? []).includes(r.id)
            return (
              <div key={r.id} className={`pf-row ${done ? 'pf-faded' : ''}`}>
                <CircleCheck checked={done} onChange={() => toggleLog(r.id, date)} label={r.name} />
                <span style={{ fontSize: 16 }}>{r.name}</span>
                <span className="pf-num pf-num--sm">{count}<span className="pf-unit">/{r.timesPerWeek}</span></span>
              </div>
            )
          })}
          {rituals.length === 0 && <p className="pf-cap">Nothing yet.</p>}
        </div>
      </section>

      {editing && (
        <BlockSheet block={editing} onClose={() => setEditing(null)}
          onSave={b => updateBlock(key, date, b.id, { title: b.title, start: b.start, end: b.end, kind: b.kind })}
          onRemove={() => saveBlocks(blocks.filter(x => x.id !== editing.id))} />
      )}
      {adding && (
        <BlockSheet onClose={() => setAdding(false)} onSave={b => saveBlocks([...blocks, b])} />
      )}
      {rebuilding && (
        <RebuildSheet week={week} date={date} onClose={() => setRebuilding(false)}
          onTake={p => saveBlocks(p.blocks, p.intention)} />
      )}
    </div>
  )
}

// ── pieces ────────────────────────────────────────────────────────────

function EmptyToday() {
  return (
    <div className="pf-enter pf-narrow" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 22, paddingTop: 'clamp(24px, 8vh, 80px)' }}>
      <Outline size={64} />
      <h1 className="pf-h2">Your week is not set yet.</h1>
      <p className="pf-body"><span className="pf-mono">20 minutes</span> on Sunday. Monday starts clear.</p>
      <Link to="/session" className="pf-btn pf-btn--primary">Walk in</Link>
    </div>
  )
}

// The faint aperture, empty: a dotted Stone ring. No illustration.
function Outline({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" aria-hidden="true" style={{ display: 'block', opacity: .7 }}>
      <circle cx="50" cy="50" r="42" fill="none" stroke="var(--border)" strokeWidth="2" strokeDasharray="1.5 6" strokeLinecap="round" />
    </svg>
  )
}

// Kind by hairline grammar, never by shade: priority solid, ritual Stone ring, event solid ring, the rest dotted.
const DOT: Record<BlockKind, CSSProperties> = {
  priority: { background: 'var(--text)', borderColor: 'var(--text)' },
  ritual: { borderColor: 'var(--text-3)' },
  event: { borderColor: 'var(--text-2)' },
  admin: { borderStyle: 'dotted' },
  rest: { borderStyle: 'dotted' },
  other: { borderStyle: 'dotted' },
}
export function KindDot({ kind }: { kind: BlockKind }) {
  return <span aria-hidden="true" style={{ width: 10, height: 10, borderRadius: '50%', border: '1px solid var(--border)', display: 'block', flexShrink: 0, ...DOT[kind] }} />
}

function Labelled({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="pf-fieldset">
      <span className="pf-cap pf-label">{label}</span>
      {children}
    </div>
  )
}

// Edit or add one block. The page's dense object is the nav pill, so the sheet's action stays secondary.
export function BlockSheet({ block, onClose, onSave, onRemove }: { block?: Block; onClose: () => void; onSave: (b: Block) => void; onRemove?: () => void }) {
  const [title, setTitle] = useState(block?.title ?? '')
  const [start, setStart] = useState(block?.start ?? '09:00')
  const [end, setEnd] = useState(block?.end ?? '10:30')
  const [kind, setKind] = useState<BlockKind>(block?.kind ?? 'priority')
  const valid = title.trim().length > 0 && start < end

  function save() {
    if (!valid) return
    onSave({ id: block?.id ?? crypto.randomUUID(), title: title.trim(), start, end, kind, priorityId: block?.priorityId, ritualId: block?.ritualId, done: block?.done ?? false })
    onClose()
  }

  return (
    <Sheet open onClose={onClose} title={block ? 'Edit block' : 'New block'}>
      <div className="pf-fields" style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
        <Labelled label="Title">
          <input className="pf-input" value={title} autoFocus onChange={e => setTitle(e.target.value)} placeholder="One thing." onKeyDown={e => { if (e.key === 'Enter') save() }} />
        </Labelled>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 14 }}>
          <Labelled label="Start"><input type="time" className="pf-input" value={start} onChange={e => setStart(e.target.value)} /></Labelled>
          <Labelled label="End"><input type="time" className="pf-input" value={end} onChange={e => setEnd(e.target.value)} /></Labelled>
        </div>
        <Labelled label="Kind">
          <select className="pf-select" value={kind} onChange={e => setKind(e.target.value as BlockKind)}>
            {(Object.keys(KIND_LABEL) as BlockKind[]).map(k => <option key={k} value={k}>{KIND_LABEL[k]}</option>)}
          </select>
        </Labelled>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 18, marginTop: 28 }}>
        <button type="button" className="pf-btn pf-btn--secondary" disabled={!valid} onClick={save}>{block ? 'Save' : 'Add'}</button>
        {onRemove && <button type="button" className="pf-btn pf-btn--tertiary" onClick={() => { onRemove(); onClose() }}>Remove</button>}
      </div>
    </Sheet>
  )
}

// The assistant proposes; she takes it or leaves it. Nothing is applied on its own.
export function RebuildSheet({ week, date, onClose, onTake }: { week: WeekPlan; date: string; onClose: () => void; onTake: (p: DayReplan) => void }) {
  const [reason, setReason] = useState('')
  const [phase, setPhase] = useState<'ask' | 'busy' | 'proposal' | 'error'>('ask')
  const [proposal, setProposal] = useState<DayReplan | null>(null)
  const [error, setError] = useState('')

  async function run() {
    setPhase('busy')
    try {
      const p = await replanDay(week, date, reason.trim())
      setProposal(p)
      setPhase('proposal')
    } catch (e) {
      setError(e instanceof AIError ? e.message : 'The assistant did not answer. Nothing is lost; try again in a moment.')
      setPhase('error')
    }
  }

  return (
    <Sheet open onClose={onClose} title="Rebuild the rest of today">
      {phase === 'ask' && (
        <>
          <Labelled label="What happened">
            <textarea className="pf-textarea" value={reason} autoFocus onChange={e => setReason(e.target.value)} placeholder="A client cancelled. I'm free from 14:00." />
          </Labelled>
          <div style={{ display: 'flex', alignItems: 'center', gap: 18, marginTop: 28 }}>
            <button type="button" className="pf-btn pf-btn--secondary" onClick={() => { void run() }}>Rebuild</button>
            <button type="button" className="pf-btn pf-btn--tertiary" onClick={onClose}>Leave it</button>
          </div>
        </>
      )}
      {phase === 'busy' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 18, padding: '12px 0' }}>
          <ApertureLoader size={44} color="var(--depth-3)" />
          <p className="pf-body">Rebuilding your afternoon.</p>
        </div>
      )}
      {phase === 'proposal' && proposal && (
        <>
          <p className="pf-h4">{proposal.intention}</p>
          <div className="pf-rows" style={{ marginTop: 14 }}>
            {proposal.blocks.map(b => (
              <div key={b.id} className={`pf-row ${b.done ? 'pf-faded' : ''}`}>
                <KindDot kind={b.kind} />
                <span style={{ fontSize: 15 }}>{b.title}</span>
                <span className="pf-cap pf-mono">{b.start} to {b.end}</span>
              </div>
            ))}
            {proposal.blocks.length === 0 && <p className="pf-cap">Nothing more today. That's allowed.</p>}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 18, marginTop: 28 }}>
            <button type="button" className="pf-btn pf-btn--primary" onClick={() => { onTake(proposal); onClose() }}>Take it</button>
            <button type="button" className="pf-btn pf-btn--tertiary" onClick={onClose}>Leave it</button>
          </div>
        </>
      )}
      {phase === 'error' && (
        <>
          <div className="pf-error" role="alert">{error}</div>
          <button type="button" className="pf-btn pf-btn--tertiary" style={{ marginTop: 14 }} onClick={() => setPhase('ask')}>Try again</button>
        </>
      )}
    </Sheet>
  )
}
