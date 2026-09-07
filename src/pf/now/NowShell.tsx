// The room, reworked around one sharp thing. One switcher for her worlds, one time line that is always
// there, five words of navigation, and search for everything else. The app remembers where she was.
import { useEffect, useMemo, useState } from 'react'
import { Link, NavLink, Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom'
import '../pf.css'
import { ApertureMark } from '../Aperture'
import { Sheet } from '../Sheet'
import { useSettingsStore } from '../settingsStore'
import { useWeekStore } from '../../store/pf/weekStore'
import { useCalendarStore } from '../../store/calendarStore'
import { weekKey, todayStr } from '../../lib/pf/week'
import { CONTEXTS, useContextStore, useClock, minutesBetween } from './contextStore'
import { slotsFor, currentSlot, nextSlot, fmtMin } from './timeline'

const NAV = [
  { to: '/now',   label: 'Now' },
  { to: '/today', label: 'Today' },
  { to: '/week',  label: 'Week' },
  { to: '/focus', label: 'Focus' },
  { to: '/me',    label: 'Me' },
]

// Everything she can reach by typing. The five above, and all that sits behind them.
const PLACES: { label: string; to: string; hint?: string }[] = [
  { label: 'Now', to: '/now', hint: 'What is on, what is next' },
  { label: 'Today', to: '/today', hint: 'The day, block by block' },
  { label: 'Week', to: '/week', hint: 'Three priorities and the session' },
  { label: 'Focus', to: '/focus', hint: 'Goals and numbers for this world' },
  { label: 'Me', to: '/me', hint: 'Room, hours, habits, sign out' },
  { label: 'Weekly Session', to: '/session', hint: 'Twenty minutes that set the week' },
  { label: 'Recap', to: '/recap', hint: 'Friday, shareable' },
  { label: 'Goals · year', to: '/goals/year' },
  { label: 'Goals · quarter', to: '/goals' },
  { label: 'Goals · month', to: '/goals/month' },
  { label: 'Revenue', to: '/money' },
  { label: 'Sales', to: '/money/sales' },
  { label: 'Finance', to: '/money/finance' },
  { label: 'Content', to: '/content' },
  { label: 'Success habits', to: '/rituals' },
  { label: 'Settings', to: '/settings' },
  { label: 'Field (old home)', to: '/field' },
  { label: 'Laurence OS · overview', to: '/os', hint: 'The older pages' },
  { label: 'Laurence OS · habits', to: '/habits' },
  { label: 'Laurence OS · health', to: '/health' },
  { label: 'Laurence OS · planner', to: '/planner' },
]

export function NowShell() {
  const ground = useSettingsStore(s => s.ground)
  const context = useContextStore(s => s.context)
  const setContext = useContextStore(s => s.setContext)
  const setLastRoute = useContextStore(s => s.setLastRoute)
  const { pathname } = useLocation()
  const [search, setSearch] = useState(false)

  // Where she is, remembered. Opening the app returns here.
  useEffect(() => { if (pathname !== '/') setLastRoute(pathname) }, [pathname, setLastRoute])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); setSearch(s => !s) }
    }
    const onOpen = () => setSearch(true)
    window.addEventListener('keydown', onKey)
    window.addEventListener('pf:search', onOpen)
    return () => { window.removeEventListener('keydown', onKey); window.removeEventListener('pf:search', onOpen) }
  }, [])

  return (
    <div className="pf pf-app" data-ground={ground}>
      <div className="pf-field" aria-hidden="true" />
      <div className="pf-grain" aria-hidden="true" />
      <header className="pf-app__head pf-head2">
        <div className="pf-head2__row">
          <Link to="/now" className="pf-brand" aria-label="Now"><ApertureMark size={22} /> Pretty Focussed</Link>
          <button type="button" className="pf-btn pf-btn--tertiary pf-head2__search" onClick={() => setSearch(true)} aria-keyshortcuts="Meta+K Control+K">Search</button>
        </div>
        <div className="pf-segments pf-segments--haze" role="tablist" aria-label="World">
          {CONTEXTS.map(c => (
            <button key={c.id} type="button" role="tab" aria-selected={context === c.id} className="pf-segment" onClick={() => setContext(c.id)}>{c.label}</button>
          ))}
        </div>
        <TimeStrip />
        <nav className="pf-tnav" aria-label="Pretty Focussed">
          {NAV.map(n => (
            <NavLink key={n.to} to={n.to} className={({ isActive }) => `pf-tnav__item ${isActive ? 'is-on' : ''}`}>{n.label}</NavLink>
          ))}
        </nav>
      </header>
      <main className="pf-page pf-page--one">
        <div className="pf-one"><Outlet /></div>
      </main>
      <Palette open={search} onClose={() => setSearch(false)} />
    </div>
  )
}

// Opening the app is returning. "/" goes to the screen she left.
export function Resume() {
  const [to] = useState(() => { const l = useContextStore.getState().lastRoute; return l && l !== '/' ? l : '/now' })   // read once: the redirect must not chase later writes
  return <Navigate to={to} replace />
}

// The clock, what is on, and how long until the next thing. Always there, never loud.
function TimeStrip() {
  const now = useClock()
  const key = weekKey()
  const date = todayStr()
  const week = useWeekStore(s => s.weeks[key])
  const events = useCalendarStore(s => s.events)
  const slots = useMemo(() => slotsFor(week?.days[date]?.blocks ?? [], events, date), [week, events, date])
  const current = currentSlot(slots, now)
  const next = nextSlot(slots, now, current)
  return (
    <div className="pf-strip" aria-live="polite">
      <span className="pf-mono pf-strip__clock">{now}</span>
      {current ? (
        <span className="pf-small pf-strip__now"><span style={{ color: 'var(--text)' }}>{current.title}</span> until <span className="pf-mono">{current.end}</span>, <span className="pf-mono">{fmtMin(minutesBetween(now, current.end))}</span> left</span>
      ) : next ? (
        <span className="pf-small pf-strip__now">Nothing on. Next <span style={{ color: 'var(--text)' }}>{next.title}</span> at <span className="pf-mono">{next.start}</span>, in <span className="pf-mono">{fmtMin(minutesBetween(now, next.start))}</span></span>
      ) : (
        <span className="pf-small pf-strip__now">Nothing else planned today.</span>
      )}
      {current && next && <span className="pf-cap pf-strip__next">next {next.title} at <span className="pf-mono">{next.start}</span></span>}
    </div>
  )
}

// Cmd+K. Type, arrow, enter. Nothing disappears from the app; it just stops taking up room.
function Palette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const navigate = useNavigate()
  const [q, setQ] = useState('')
  const [i, setI] = useState(0)
  const hits = useMemo(() => {
    const s = q.trim().toLowerCase()
    return (s ? PLACES.filter(p => p.label.toLowerCase().includes(s) || p.hint?.toLowerCase().includes(s)) : PLACES).slice(0, 9)
  }, [q])
  function go(to: string) { onClose(); setQ(''); setI(0); navigate(to) }
  if (!open) return null
  return (
    <Sheet open onClose={() => { onClose(); setQ(''); setI(0) }} title="Go to">
      <input className="pf-input" value={q} placeholder="Type a place" aria-label="Search the app" autoFocus
        onChange={e => { setQ(e.target.value); setI(0) }}
        onKeyDown={e => {
          if (e.key === 'ArrowDown') { e.preventDefault(); setI(x => Math.min(hits.length - 1, x + 1)) }
          if (e.key === 'ArrowUp') { e.preventDefault(); setI(x => Math.max(0, x - 1)) }
          if (e.key === 'Enter' && hits[i]) go(hits[i].to)
        }} />
      <div className="pf-rows" style={{ marginTop: 14 }} role="listbox" aria-label="Places">
        {hits.map((p, k) => (
          <button key={p.to} type="button" role="option" aria-selected={k === i} className={`pf-row pf-row--press ${k === i ? '' : 'pf-dim'}`}
            style={{ width: '100%', background: 'none', border: 0, borderBottom: '1px dotted var(--border)', font: 'inherit', color: 'inherit', textAlign: 'left', cursor: 'pointer', gridTemplateColumns: 'minmax(0,1fr) auto' }}
            onMouseEnter={() => setI(k)} onClick={() => go(p.to)}>
            <span style={{ fontSize: 16, fontWeight: k === i ? 500 : 400 }}>{p.label}</span>
            {p.hint && <span className="pf-cap">{p.hint}</span>}
          </button>
        ))}
        {hits.length === 0 && <p className="pf-small">Nothing by that name.</p>}
      </div>
    </Sheet>
  )
}
