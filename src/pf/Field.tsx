// The Field: the home. A reading, not a to-do list. One aperture, three rows, one full stop.
import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { useWeekStore } from '../store/pf/weekStore'
import type { WeekPlan } from '../store/pf/weekStore'
import { useGoalStore, LANE_LABEL } from '../store/pf/goalStore'
import { useRitualStore } from '../store/pf/ritualStore'
import { useRevenueStore } from '../store/pf/revenueStore'
import { weekKey, nextWeekKey, weekDatesFromKey, weekNumber, todayStr, fmtDay, isRecapWindow } from '../lib/pf/week'
import { ApertureRing, CircleCheck } from './Aperture'

function isSunday() { return new Date().getDay() === 0 }
function fmtInt(n: number) { return new Intl.NumberFormat('en-IE', { maximumFractionDigits: 0 }).format(Math.round(n)) }
function stateWord(pct: number) { return pct <= 0 ? 'Open' : pct < 50 ? 'In focus' : pct < 100 ? 'Held' : 'Set' }

// The aperture takes 62 percent of a phone and settles at 300px on a desk.
function measureRing() { return Math.min(300, Math.round(window.innerWidth * 0.62)) }
function useRingSize() {
  const [size, setSize] = useState(measureRing)
  useEffect(() => {
    const onResize = () => setSize(measureRing())
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])
  return size
}

export function Field() {
  const key = weekKey()
  const today = todayStr()
  const weeks = useWeekStore(s => s.weeks)
  const togglePriority = useWeekStore(s => s.togglePriority)
  const goals = useGoalStore(s => s.goals)
  const rituals = useRitualStore(s => s.rituals)
  const logs = useRitualStore(s => s.logs)
  const rev = useRevenueStore()
  const ringSize = useRingSize()

  const week = weeks[key]
  const sunday = isSunday()
  const sessionDue = sunday ? !weeks[nextWeekKey(key)]?.sessionCompletedAt : !week?.sessionCompletedAt
  const firstRun = goals.length === 0 && !week?.sessionCompletedAt

  // The reading: blocks when the week has them, the three otherwise.
  const priorities = week?.priorities ?? []
  const doneP = priorities.filter(p => p.done).length
  const blocks = Object.values(week?.days ?? {}).flatMap(d => d.blocks)
  const doneB = blocks.filter(b => b.done).length
  const value = blocks.length ? doneB : doneP
  const max = blocks.length ? blocks.length : (priorities.length || 3)
  const pct = max > 0 ? Math.round((value / max) * 100) : 0

  const dates = weekDatesFromKey(key)
  const planned = rituals.reduce((a, r) => a + r.timesPerWeek, 0)
  const kept = rituals.reduce((a, r) => a + Math.min(r.timesPerWeek, dates.filter(d => (logs[d] ?? []).includes(r.id)).length), 0)
  const gap = rev.monthGap()

  const past = Object.values(weeks).filter(w => w.sessionCompletedAt).sort((a, b) => a.key.localeCompare(b.key))
  const intention = week?.sessionCompletedAt ? week.days[today]?.intention : undefined
  const recapDue = isRecapWindow() && priorities.length > 0 && !week?.recap

  return (
    <div className="pf-enter pf-stack-lg" style={{ gap: 'clamp(24px, 4vw, 56px)' }}>
      <header className="pf-stack" style={{ gap: 14 }}>
        <p className="pf-over">{fmtDay(today, 'EEEE d MMMM')}</p>
        <h1 className="pf-h2">{intention || 'Everything else can wait.'}</h1>
        {firstRun && <p className="pf-body">Sunday, walk into your first session. <span className="pf-mono">20 minutes</span> and the week is set.</p>}
      </header>

      {!firstRun && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px 44px' }}>
          <Stat label="This week">{doneP}<span className="pf-unit">/{priorities.length || 3} priorities</span></Stat>
          <Stat label="Habits">{kept}<span className="pf-unit">/{planned}</span></Stat>
          <Stat label="To go">{gap > 0 ? <>{fmtInt(gap)}<span className="pf-unit">eur</span></> : 'Met'}</Stat>
        </div>
      )}

      {/* The aperture dominates, left of centre; the three hang beside it on a desk and under it on a phone. */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '24px 64px' }}>
        <ApertureRing value={value} max={max} size={ringSize}>
          <span className="pf-cap">{stateWord(pct)}</span>
          <p className="pf-num pf-num--md">{value}<span className="pf-unit">{blocks.length ? `/${max} blocks` : `/${max}`}</span></p>
        </ApertureRing>
        {priorities.length > 0 && (
          <div style={{ flex: '1 1 300px', maxWidth: 560, minWidth: 0 }}>
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
            </div>
          </div>
        )}
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '14px 22px' }}>
        {sessionDue ? (
          <>
            <Link to="/session" className="pf-btn pf-btn--primary">Walk in</Link>
            <span className="pf-cap">{sunday ? <>Sunday's session · <span className="pf-mono">20 min</span></> : 'Your week is not set yet'}</span>
          </>
        ) : (
          <Link to="/today" className="pf-btn pf-btn--primary">Open today</Link>
        )}
        {recapDue && <Link to="/recap" className="pf-btn pf-btn--tertiary">Write the recap</Link>}
      </div>

      {!firstRun && <Bubbles past={past} />}
    </div>
  )
}

function Stat({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <span className="pf-cap pf-label">{label}</span>
      <p className="pf-num pf-num--md">{children}</p>
    </div>
  )
}

// The bubble field: one circle per completed session. Size is what moved, blur and opacity are recency.
// The past is literally out of focus.
function Bubbles({ past }: { past: WeekPlan[] }) {
  const shown = past.slice(-10)
  const n = shown.length
  if (n === 0) return null
  return (
    <div>
      <span className="pf-cap pf-label">Sessions <span className="pf-mono">{past.length}</span></span>
      {(
        <div role="img" aria-label={`${n} sessions, oldest to newest`} style={{ height: 80, display: 'flex', alignItems: 'center', gap: 18 }}>
          {shown.map((w, i) => {
            const t = n > 1 ? i / (n - 1) : 1
            const size = 14 + w.priorities.filter(p => p.done).length * 8
            return (
              <span key={w.key} title={`Week ${weekNumber(w.key)}`} style={{
                width: size, height: size, borderRadius: '50%', flexShrink: 0, background: 'var(--depth-2)',
                opacity: 0.35 + 0.65 * t, filter: `blur(${(3 * (1 - t)).toFixed(1)}px)`,
              }} />
            )
          })}
        </div>
      )}
    </div>
  )
}

// The faint aperture, empty: a dotted Stone ring. No illustration.
