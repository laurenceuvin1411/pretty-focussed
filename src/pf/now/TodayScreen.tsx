// Today: the day as one line of time. The block that is on is sharp; the past is soft; the future is dim.
// One action, to change the rest of the day. Checking off is the feel of the page.
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useWeekStore } from '../../store/pf/weekStore'
import type { Block } from '../../store/pf/weekStore'
import { useRitualStore } from '../../store/pf/ritualStore'
import { useCalendarStore } from '../../store/calendarStore'
import { useGoogleCalendar } from '../../hooks/useGoogleCalendar'
import { weekKey, weekNumber, weekDatesFromKey, todayStr, fmtDay } from '../../lib/pf/week'
import { CircleCheck } from '../Aperture'
import { Sheet } from '../Sheet'
import { KindDot, BlockSheet, RebuildSheet } from '../Today'
import { useClock, minutesBetween } from './contextStore'
import { slotsFor, currentSlot, nextSlot, fmtMin } from './timeline'

const stop = (s: string) => (/[.!?]$/.test(s) ? s : `${s}.`)
const byStart = (a: Block, b: Block) => a.start.localeCompare(b.start)

export function TodayScreen() {
  const now = useClock()
  const key = weekKey()
  const date = todayStr()
  const week = useWeekStore(s => s.weeks[key])
  const toggleBlock = useWeekStore(s => s.toggleBlock)
  const updateBlock = useWeekStore(s => s.updateBlock)
  const replaceDay = useWeekStore(s => s.replaceDay)
  const rituals = useRitualStore(s => s.rituals)
  const logs = useRitualStore(s => s.logs)
  const toggleLog = useRitualStore(s => s.toggleLog)
  const events = useCalendarStore(s => s.events)
  const { connected, connect } = useGoogleCalendar()
  const [changing, setChanging] = useState(false)
  const [editing, setEditing] = useState<Block | null>(null)
  const [adding, setAdding] = useState(false)
  const [rebuilding, setRebuilding] = useState(false)

  const day = week?.days[date]
  const blocks = useMemo(() => [...(day?.blocks ?? [])].sort(byStart), [day])
  const slots = useMemo(() => slotsFor(blocks, events, date), [blocks, events, date])
  const current = currentSlot(slots, now)
  const next = nextSlot(slots, now, current)
  const doneCount = blocks.filter(b => b.done).length
  const dates = weekDatesFromKey(key)
  const planned = !!week?.sessionCompletedAt

  function onBlockToggle(b: Block) {
    toggleBlock(key, date, b.id)
    if (b.kind === 'ritual' && b.ritualId) toggleLog(b.ritualId, date)
  }
  function saveBlocks(nextBlocks: Block[], intention?: string) {
    replaceDay(key, date, [...nextBlocks].sort(byStart), intention ?? day?.intention)
  }

  if (!planned) {
    return (
      <div className="pf-enter pf-stack-lg" style={{ gap: 44 }}>
        <header className="pf-stack" style={{ gap: 14 }}>
          <p className="pf-over">Today · {fmtDay(date, 'EEEE d MMMM')}</p>
          <h1 className="pf-h1">The week is not set yet.</h1>
          <p className="pf-body">Twenty minutes. Then every day knows what it is for.</p>
          <div style={{ marginTop: 10 }}><Link to="/session" className="pf-btn pf-btn--primary">Start the session</Link></div>
        </header>
      </div>
    )
  }

  const headline = day?.intention ? stop(day.intention) : blocks.length === 0 ? 'No plan for today yet.' : 'One thing at a time.'
  const lead = blocks.length === 0
    ? 'A few blocks and the day has a shape.'
    : `${blocks.length} ${blocks.length === 1 ? 'block' : 'blocks'}, ${doneCount} done.${current ? ` On now: ${current.title}, ${fmtMin(minutesBetween(now, current.end))} left.` : next ? ` Next: ${next.title} at ${next.start}.` : ' Nothing else planned.'}`

  return (
    <div className="pf-enter pf-stack-lg" style={{ gap: 44 }}>
      <header className="pf-stack" style={{ gap: 14 }}>
        <p className="pf-over">Today · week {weekNumber(key)}</p>
        <h1 className="pf-h1">{headline}</h1>
        <p className="pf-body">{lead}</p>
        <div style={{ marginTop: 10 }}>
          <button type="button" className="pf-btn pf-btn--primary" onClick={() => setChanging(true)}>{blocks.length === 0 ? 'Plan today' : 'Change today'}</button>
        </div>
      </header>

      <section aria-label="The day">
        <span className="pf-cap pf-label">The day</span>
        <div className="pf-rows">
          {slots.map(s => {
            const isNow = current?.id === s.id
            const past = s.end <= now
            const plane = current ? (isNow ? 'pf-sharp' : past ? 'pf-soft' : 'pf-dim') : past ? 'pf-soft' : ''
            const b = s.block
            return (
              <div key={s.id} className={`pf-row pf-row--big ${plane}`} style={{ gridTemplateColumns: 'auto minmax(0,1fr) auto' }}>
                <KindDot kind={s.kind} />
                <button type="button" onClick={() => b && setEditing(b)} disabled={!b} aria-label={b ? `Edit ${s.title}` : s.title}
                  style={{ background: 'none', border: 0, padding: 0, font: 'inherit', color: 'inherit', textAlign: 'left', cursor: b ? 'pointer' : 'default', minWidth: 0, minHeight: 44 }}>
                  <span className="pf-cap pf-mono" style={{ display: 'block' }}>{s.start} to {s.end}{isNow ? ' · now' : ''}</span>
                  <span className={s.done ? 'pf-faded' : ''} style={{ display: 'block', fontSize: 17, fontWeight: isNow ? 500 : 400, marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.title}</span>
                </button>
                {b ? <CircleCheck checked={b.done} onChange={() => onBlockToggle(b)} label={`${b.title} done`} /> : <span className="pf-cap">calendar</span>}
              </div>
            )
          })}
          {slots.length === 0 && <p className="pf-small">Nothing planned. That's allowed.</p>}
        </div>
        {!connected && <button type="button" className="pf-btn pf-btn--tertiary" style={{ marginTop: 8, paddingLeft: 0 }} onClick={() => { void connect() }}>Connect Google Calendar</button>}
      </section>

      {rituals.length > 0 && (
        <section aria-label="Success habits">
          <span className="pf-cap pf-label">Success habits</span>
          <div className="pf-rows">
            {rituals.map(r => {
              const count = dates.filter(d => (logs[d] ?? []).includes(r.id)).length
              const done = (logs[date] ?? []).includes(r.id)
              return (
                <div key={r.id} className={`pf-row pf-row--big ${done ? 'pf-faded' : ''}`}>
                  <CircleCheck checked={done} onChange={() => toggleLog(r.id, date)} label={r.name} />
                  <span style={{ fontSize: 17 }}>{r.name}</span>
                  <span className="pf-num pf-num--sm">{count}<span className="pf-unit">/{r.timesPerWeek}</span></span>
                </div>
              )
            })}
          </div>
        </section>
      )}

      <Sheet open={changing} onClose={() => setChanging(false)} title={blocks.length === 0 ? 'Plan today.' : 'Change today.'}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <p className="pf-body">{blocks.length === 0 ? 'The studio drafts the day around your three, your habits and your calendar.' : 'Tell the studio what happened and it rebuilds the rest. Or change one block by hand.'}</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 18, flexWrap: 'wrap', marginTop: 8 }}>
            <button type="button" className="pf-btn pf-btn--primary" onClick={() => { setChanging(false); setRebuilding(true) }}>{blocks.length === 0 ? 'Draft the day' : 'Rebuild the rest'}</button>
            <button type="button" className="pf-btn pf-btn--tertiary" onClick={() => { setChanging(false); setAdding(true) }}>Add a block by hand</button>
          </div>
        </div>
      </Sheet>

      {editing && (
        <BlockSheet block={editing} onClose={() => setEditing(null)}
          onSave={b => updateBlock(key, date, b.id, { title: b.title, start: b.start, end: b.end, kind: b.kind })}
          onRemove={() => saveBlocks(blocks.filter(x => x.id !== editing.id))} />
      )}
      {adding && <BlockSheet onClose={() => setAdding(false)} onSave={b => saveBlocks([...blocks, b])} />}
      {rebuilding && week && (
        <RebuildSheet week={week} date={date} onClose={() => setRebuilding(false)} onTake={p => saveBlocks(p.blocks, p.intention)} />
      )}
    </div>
  )
}
