// Week: the three that carry it, the seven days that hold it, and the one next step for the week.
// Today is sharp; the days behind are soft; the days ahead are dim.
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useWeekStore } from '../../store/pf/weekStore'
import { useGoalStore } from '../../store/pf/goalStore'
import { useRitualStore } from '../../store/pf/ritualStore'
import { useFocusStore } from '../../store/pf/focusStore'
import { weekKey, prevWeekKey, nextWeekKey, weekNumber, weekLabel, weekDatesFromKey, todayStr, isSessionWindow, isRecapWindow, DAY_SHORT } from '../../lib/pf/week'
import { CircleCheck } from '../Aperture'

export function WeekScreen() {
  const [key, setKey] = useState(() => weekKey())
  const current = weekKey()
  const week = useWeekStore(s => s.weeks[key])
  const togglePriority = useWeekStore(s => s.togglePriority)
  const goals = useGoalStore(s => s.goals)
  const rituals = useRitualStore(s => s.rituals)
  const logs = useRitualStore(s => s.logs)
  const months = useFocusStore(s => s.months)
  const dates = weekDatesFromKey(key)
  const today = todayStr()
  const isNow = key === current
  const ps = week?.priorities ?? []
  const done = ps.filter(p => p.done).length
  const planned = !!week?.sessionCompletedAt
  const focus = months[dates[0].slice(0, 7)]?.focus

  // The one next step for this week, in order: set it, finish it, close it, read it back.
  let headline: string, lead: string
  let primary: { label: string; to: string } | null = null
  if (!planned && ps.length === 0) {
    headline = isNow ? 'The week is not set yet.' : key < current ? 'No plan that week.' : 'Not planned yet.'
    lead = isNow ? (isSessionWindow() ? 'Twenty minutes. Then every day knows what it is for.' : 'The session is Sunday or Monday. It can be now.') : ''
    if (isNow || key > current) primary = { label: 'Start the session', to: '/session' }
  } else if (!planned) {
    headline = 'The week is half set.'
    lead = `${ps.length} priorities chosen. The days are not drafted yet.`
    primary = { label: 'Finish the session', to: '/session' }
  } else if (week?.recap) {
    headline = week.recap.headline || `${done} of ${ps.length} stood.`
    lead = week.recap.nextWeekHint || ''
    primary = { label: 'See the recap', to: '/recap' }
  } else if (isNow && isRecapWindow()) {
    headline = done === ps.length ? 'All three stood.' : `${done} of ${ps.length} so far.`
    lead = 'Friday. Read the week back, then let it go.'
    primary = { label: 'Write the recap', to: '/recap' }
  } else {
    headline = done === ps.length ? 'All three stood.' : `${ps.length} priorities. ${done} done.`
    lead = week?.assistantNote || focus || ''
    primary = key < current ? { label: 'Write the recap', to: '/recap' } : null
  }

  return (
    <div className="pf-enter pf-stack-lg" style={{ gap: 44 }}>
      <header className="pf-stack" style={{ gap: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <p className="pf-over">Week {weekNumber(key)} · {weekLabel(key)}</p>
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="button" className="pf-chev" aria-label="Previous week" onClick={() => setKey(prevWeekKey(key))}><ChevronLeft size={16} strokeWidth={1.5} aria-hidden="true" /></button>
            <button type="button" className="pf-chev" aria-label="Next week" disabled={key >= nextWeekKey(current)} onClick={() => setKey(nextWeekKey(key))}><ChevronRight size={16} strokeWidth={1.5} aria-hidden="true" /></button>
          </div>
        </div>
        <h1 className="pf-h1">{headline}</h1>
        {lead && <p className="pf-body">{lead}</p>}
        {primary && <div style={{ marginTop: 10 }}><Link to={primary.to} className="pf-btn pf-btn--primary">{primary.label}</Link></div>}
      </header>

      {ps.length > 0 && (
        <section aria-label="The three">
          <span className="pf-cap pf-label">The three</span>
          <div className="pf-rows">
            {ps.map(p => {
              const g = goals.find(x => x.id === p.goalId)
              return (
                <div key={p.id} className={`pf-row pf-row--big ${p.done ? 'pf-faded' : ''}`}>
                  <CircleCheck checked={p.done} onChange={() => togglePriority(key, p.id)} label={p.title} />
                  <span style={{ display: 'flex', flexDirection: 'column', gap: 3, minWidth: 0 }}>
                    <span style={{ fontSize: 17 }}>{p.title}</span>
                    {g && <span className="pf-cap">serves <span style={{ color: 'var(--text-brand)' }}>{g.title}</span></span>}
                  </span>
                  <span />
                </div>
              )
            })}
          </div>
        </section>
      )}

      {planned && (
        <section aria-label="The days">
          <span className="pf-cap pf-label">The days</span>
          <div className="pf-rows">
            {dates.map((d, i) => {
              const plan = week?.days[d]
              const blocks = plan?.blocks ?? []
              const doneB = blocks.filter(b => b.done).length
              const habits = (logs[d] ?? []).length
              const plane = d === today ? 'is-today' : d < today ? 'pf-soft' : 'pf-dim'
              const inner = (
                <>
                  <span className="pf-num pf-num--sm" style={{ color: d === today ? 'var(--text)' : 'var(--text-2)' }}>{DAY_SHORT[i]}</span>
                  <span style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
                    <span style={{ fontSize: 16, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{plan?.intention || (blocks.length ? `${blocks.length} blocks` : 'Free')}</span>
                    {blocks.length > 0 && <span className="pf-cap">{blocks.length} {blocks.length === 1 ? 'block' : 'blocks'}{habits ? ` · ${habits} ${habits === 1 ? 'habit' : 'habits'}` : ''}</span>}
                  </span>
                  <span className="pf-cap">{blocks.length ? <><span className="pf-mono">{doneB}/{blocks.length}</span> done</> : ''}</span>
                </>
              )
              return d === today
                ? <Link key={d} to="/today" className={`pf-dayrow ${plane}`} aria-label="Open today">{inner}</Link>
                : <div key={d} className={`pf-dayrow ${plane}`}>{inner}</div>
            })}
          </div>
        </section>
      )}

      {rituals.length > 0 && planned && (
        <section aria-label="Success habits this week">
          <span className="pf-cap pf-label">Success habits</span>
          <div className="pf-rows">
            {rituals.map(r => {
              const count = dates.filter(d => (logs[d] ?? []).includes(r.id)).length
              return (
                <div key={r.id} className={`pf-row ${count >= r.timesPerWeek ? 'pf-faded' : ''}`} style={{ gridTemplateColumns: 'minmax(0,1fr) auto' }}>
                  <span style={{ fontSize: 16 }}>{r.name}</span>
                  <span className="pf-num pf-num--sm">{count}<span className="pf-unit">/{r.timesPerWeek}</span></span>
                </div>
              )
            })}
          </div>
        </section>
      )}

      <p className="pf-small"><Link to="/goals" className="pf-btn pf-btn--tertiary" style={{ display: 'inline', padding: 0, minHeight: 0 }}>The quarter behind this week</Link></p>
    </div>
  )
}
