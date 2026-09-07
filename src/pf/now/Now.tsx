// Now: one column, three answers. What is on, what is next, the three that count today.
// The app chooses; she carries it out. One Ink pill, and it is the next step.
import { useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useWeekStore } from '../../store/pf/weekStore'
import { useCalendarStore } from '../../store/calendarStore'
import { useGoalStore, LANE_LABEL } from '../../store/pf/goalStore'
import { useSettingsStore } from '../settingsStore'
import { weekKey, todayStr, fmtDay, isSessionWindow } from '../../lib/pf/week'
import { CircleCheck } from '../Aperture'
import { useClock, useDraft, minutesBetween } from './contextStore'
import { slotsFor, currentSlot, nextSlot, fmtMin } from './timeline'

const stop = (s: string) => (/[.!?]$/.test(s) ? s : `${s}.`)

export function Now() {
  const navigate = useNavigate()
  const now = useClock()
  const key = weekKey()
  const date = todayStr()
  const week = useWeekStore(s => s.weeks[key])
  const togglePriority = useWeekStore(s => s.togglePriority)
  const toggleBlock = useWeekStore(s => s.toggleBlock)
  const setIntention = useWeekStore(s => s.setIntention)
  const events = useCalendarStore(s => s.events)
  const goals = useGoalStore(s => s.goals)
  const workEnd = useSettingsStore(s => s.workEnd)
  const [draft, setDraft] = useDraft('now-intention')

  const day = week?.days[date]
  const slots = useMemo(() => slotsFor(day?.blocks ?? [], events, date), [day, events, date])
  const current = currentSlot(slots, now)
  const next = nextSlot(slots, now, current)
  const priorities = week?.priorities ?? []
  const done = priorities.filter(p => p.done).length
  const planned = !!week?.sessionCompletedAt
  const evening = now >= workEnd && now >= '17:00'
  const dayEmpty = slots.length === 0

  // The one thing. In order: the block that is on, the block that is next, the day, the week.
  let headline: string, lead: string
  let primary: { label: string; run: () => void } | null
  if (evening) {
    headline = 'Enough for today.'
    lead = done === priorities.length && priorities.length > 0 ? 'Three of three. They stand.' : `${done} of ${priorities.length || 3} today. The rest keeps until tomorrow.`
    primary = { label: 'Close the day', run: () => navigate('/recap') }
  } else if (current) {
    headline = stop(current.title)
    lead = `Until ${current.end}. ${fmtMin(minutesBetween(now, current.end))} left.${next ? ` Then ${next.title} at ${next.start}.` : ' Nothing after this.'}`
    primary = current.block ? { label: 'Done', run: () => toggleBlock(key, date, current.block!.id) } : null
  } else if (next) {
    headline = `${next.title} at ${next.start}.`
    lead = `In ${fmtMin(minutesBetween(now, next.start))}. Nothing on right now.`
    primary = next.block ? { label: 'Start it now', run: () => navigate('/today') } : null
  } else if (!planned && isSessionWindow()) {
    headline = 'The week is not set yet.'
    lead = 'Twenty minutes. Then every day knows what it is for.'
    primary = { label: 'Start the session', run: () => navigate('/session') }
  } else if (dayEmpty) {
    headline = 'No plan for today yet.'
    lead = 'One intention and a few blocks. The studio drafts it with you.'
    primary = { label: 'Plan today', run: () => navigate('/today') }
  } else {
    headline = 'Nothing else planned today.'
    lead = done === priorities.length && priorities.length > 0 ? 'Three of three. They stand.' : 'What is left sits below.'
    primary = null
  }

  function saveIntention() {
    if (!draft.trim()) return
    setIntention(key, date, draft.trim())
    setDraft('')
  }

  return (
    <div className="pf-enter pf-stack-lg" style={{ gap: 44 }}>
      <header className="pf-stack" style={{ gap: 14 }}>
        <p className="pf-over">{fmtDay(date, 'EEEE d MMMM')}</p>
        <h1 className="pf-h1">{headline}</h1>
        <p className="pf-body">{lead}</p>
        {primary && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 22, flexWrap: 'wrap', marginTop: 10 }}>
            <button type="button" className="pf-btn pf-btn--primary" onClick={primary.run}>{primary.label}</button>
            {!evening && !dayEmpty && <Link to="/today" className="pf-btn pf-btn--tertiary">Re-plan the rest of the day</Link>}
          </div>
        )}
      </header>

      {day && !day.intention && !evening && (
        <div className="pf-fieldset">
          <span className="pf-cap pf-label">One line for today</span>
          <input className="pf-inline" value={draft} onChange={e => setDraft(e.target.value)} onBlur={saveIntention} onKeyDown={e => e.key === 'Enter' && saveIntention()}
            placeholder="What today is for" aria-label="One line for today" />
        </div>
      )}
      {day?.intention && !evening && <p className="pf-small" style={{ color: 'var(--text-2)' }}>{day.intention}</p>}

      <section aria-label="Today counts">
        <span className="pf-cap pf-label">Today counts</span>
        <div className="pf-rows">
          {priorities.map(p => {
            const goal = goals.find(g => g.id === p.goalId)
            return (
              <div key={p.id} className={`pf-row pf-row--big ${p.done ? 'pf-faded' : ''}`}>
                <CircleCheck checked={p.done} onChange={() => togglePriority(key, p.id)} label={p.title} />
                <span style={{ fontSize: 17, minWidth: 0 }}>{p.title}</span>
                <span className="pf-cap">{goal ? LANE_LABEL[goal.lane] : ''}</span>
              </div>
            )
          })}
          {priorities.length === 0 && (
            <p className="pf-small">Three priorities come from the session. {!primary && <Link to="/session" className="pf-btn pf-btn--tertiary" style={{ display: 'inline', padding: 0, minHeight: 0 }}>Open it</Link>}</p>
          )}
        </div>
        {done === priorities.length && priorities.length > 0 && !evening && <p className="pf-small" style={{ marginTop: 12 }}>Three of three. They stand.</p>}
      </section>
    </div>
  )
}
