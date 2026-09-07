// Settings: she picks the room, her hours, her days off. One tap to leave.
import { Link } from 'react-router-dom'
import { useSettingsStore, GROUNDS } from './settingsStore'
import { useThemeStore } from '../store/themeStore'
import { useAuthStore } from '../store/authStore'
import { isOwner, getCurrentEmail } from '../lib/workspace'
import { DAY_SHORT, DAY_LONG } from '../lib/pf/week'

const MORE = [
  { to: '/os', label: 'Overview' },
  { to: '/habits', label: 'Habits' },
  { to: '/health', label: 'Sports' },
  { to: '/recipes', label: 'Recipes' },
  { to: '/planner', label: 'Yearly goals' },
  { to: '/productivity', label: 'Productivity' },
  { to: '/automations', label: 'Automations' },
  { to: '/coaching', label: 'Work with Laurence' },
]

export function Settings() {
  const { ground, setGround, workStart, workEnd, freeDays, setHours, setFreeDays } = useSettingsStore()
  const { isDark, toggle } = useThemeStore()
  const signOut = useAuthStore(s => s.signOut)
  const email = getCurrentEmail()

  return (
    <div className="pf-stack-lg pf-narrow">
      <div>
        <p className="pf-over">Settings</p>
        <h1 className="pf-h2" style={{ marginTop: 12 }}>Your room.</h1>
        <p className="pf-body" style={{ marginTop: 12 }}>The instrument never changes. The room is yours.</p>
      </div>

      <section>
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

      <section>
        <span className="pf-cap pf-label">Light</span>
        <button type="button" className="pf-toggle" aria-pressed={isDark} onClick={toggle}>
          <span>{isDark ? 'Ink room' : 'Bone room'}</span>
          <span className="pf-track" aria-hidden="true"><span /></span>
        </button>
      </section>

      <section className="pf-fields" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 22 }}>
        <div className="pf-fieldset">
          <span className="pf-cap pf-label">Working day</span>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <input className="pf-input pf-mono" type="time" value={workStart} onChange={e => setHours(e.target.value, workEnd)} aria-label="Work starts" style={{ padding: '10px 12px' }} />
            <span className="pf-cap">to</span>
            <input className="pf-input pf-mono" type="time" value={workEnd} onChange={e => setHours(workStart, e.target.value)} aria-label="Work ends" style={{ padding: '10px 12px' }} />
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

      <section>
        <span className="pf-cap pf-label">More</span>
        <div className="pf-rows">
          {MORE.map(m => (
            <Link key={m.to} to={m.to} className="pf-row pf-row--link" style={{ gridTemplateColumns: 'minmax(0,1fr)' }}>
              <span style={{ fontSize: 16 }}>{m.label}</span>
            </Link>
          ))}
        </div>
        <p className="pf-small" style={{ marginTop: 10 }}>{isOwner() ? 'Your Laurence OS pages, unchanged.' : 'The earlier pages, kept while the studio grows.'}</p>
      </section>

      <section>
        <span className="pf-cap pf-label">Account</span>
        <p className="pf-small" style={{ marginBottom: 12 }}>{email ?? 'Signed in'}</p>
        <button type="button" className="pf-btn pf-btn--secondary" onClick={() => signOut()}>Sign out</button>
      </section>
    </div>
  )
}
