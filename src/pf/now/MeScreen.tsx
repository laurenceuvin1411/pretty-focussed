// Me: the room, the hours, the habits, and the door. Everything rare sits behind Search.
import { Link } from 'react-router-dom'
import { useSettingsStore, GROUNDS } from '../settingsStore'
import { useThemeStore } from '../../store/themeStore'
import { useAuthStore } from '../../store/authStore'
import { useRitualStore } from '../../store/pf/ritualStore'
import { useWeekStore } from '../../store/pf/weekStore'
import { getCurrentEmail } from '../../lib/workspace'
import { DAY_SHORT, DAY_LONG } from '../../lib/pf/week'

export function MeScreen() {
  const { ground, setGround, workStart, workEnd, freeDays, setHours, setFreeDays } = useSettingsStore()
  const { isDark, toggle } = useThemeStore()
  const signOut = useAuthStore(s => s.signOut)
  const rituals = useRitualStore(s => s.rituals)
  const sessions = useWeekStore(s => s.completedSessions)()
  const email = getCurrentEmail()

  return (
    <div className="pf-enter pf-stack-lg" style={{ gap: 44 }}>
      <header className="pf-stack" style={{ gap: 14 }}>
        <p className="pf-over">Me</p>
        <h1 className="pf-h1">Your room.</h1>
        <p className="pf-body">{sessions > 0 ? `${sessions} ${sessions === 1 ? 'session' : 'sessions'} so far. The instrument never changes; the room is yours.` : 'The instrument never changes. The room is yours.'}</p>
      </header>

      <section aria-label="Ground">
        <span className="pf-cap pf-label">Ground</span>
        <div className="pf-swatches" role="radiogroup" aria-label="Ground">
          {GROUNDS.map(g => (
            <button key={g.id} type="button" role="radio" className="pf-swatch" aria-checked={ground === g.id} onClick={() => setGround(g.id)}>
              <span className="pf-swatch__disc" style={{ background: g.rest }} aria-hidden="true" />
              <span className="pf-cap" style={{ color: ground === g.id ? 'var(--text)' : undefined }}>{g.name}</span>
            </button>
          ))}
        </div>
        <p className="pf-small" style={{ marginTop: 12 }}>{GROUNDS.find(g => g.id === ground)?.note}</p>
      </section>

      <section aria-label="Light">
        <span className="pf-cap pf-label">Light</span>
        <button type="button" className="pf-toggle" aria-pressed={isDark} onClick={toggle}>
          <span>{isDark ? 'Ink room' : 'Bone room'}</span>
          <span className="pf-track" aria-hidden="true"><span /></span>
        </button>
      </section>

      <section aria-label="Hours" className="pf-fields" style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
        <div className="pf-fieldset">
          <span className="pf-cap pf-label">Working day</span>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <input className="pf-input pf-mono" type="time" value={workStart} onChange={e => setHours(e.target.value, workEnd)} aria-label="Work starts" style={{ padding: '10px 12px', width: 'auto' }} />
            <span className="pf-cap">to</span>
            <input className="pf-input pf-mono" type="time" value={workEnd} onChange={e => setHours(workStart, e.target.value)} aria-label="Work ends" style={{ padding: '10px 12px', width: 'auto' }} />
          </div>
        </div>
        <div className="pf-fieldset">
          <span className="pf-cap pf-label">Days off</span>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {DAY_SHORT.map((d, i) => (
              <button key={d} type="button" className="pf-day" aria-pressed={freeDays.includes(i)} aria-label={`${DAY_LONG[i]} off`}
                onClick={() => setFreeDays(freeDays.includes(i) ? freeDays.filter(x => x !== i) : [...freeDays, i])}>{d.slice(0, 2)}</button>
            ))}
          </div>
        </div>
      </section>

      <section aria-label="Success habits">
        <span className="pf-cap pf-label">Success habits</span>
        <Link to="/rituals" className="pf-row pf-row--link pf-row--big" style={{ gridTemplateColumns: 'minmax(0,1fr) auto' }}>
          <span style={{ fontSize: 17 }}>{rituals.length === 0 ? 'None yet.' : rituals.map(r => r.name).join(' · ')}</span>
          <span className="pf-cap">{rituals.length}<span className="pf-unit" style={{ fontSize: 11 }}>/5</span></span>
        </Link>
        <p className="pf-small" style={{ marginTop: 8 }}>Up to five, cycle-aware if you want.</p>
      </section>

      <section aria-label="Everything else">
        <span className="pf-cap pf-label">Everything else</span>
        <p className="pf-small">Recap, goals by year, month or quarter, revenue, finance, content and the older pages are one search away.</p>
        <button type="button" className="pf-btn pf-btn--secondary" style={{ marginTop: 12 }} onClick={() => window.dispatchEvent(new Event('pf:search'))}>Search <span className="pf-mono" style={{ fontSize: 12, color: 'var(--text-3)', marginLeft: 4 }}>⌘K</span></button>
      </section>

      <section aria-label="Account">
        <span className="pf-cap pf-label">Account</span>
        <p className="pf-small" style={{ marginBottom: 12 }}>{email ?? 'Signed in'}</p>
        <button type="button" className="pf-btn pf-btn--tertiary" style={{ paddingLeft: 0 }} onClick={() => signOut()}>Sign out</button>
      </section>
    </div>
  )
}
