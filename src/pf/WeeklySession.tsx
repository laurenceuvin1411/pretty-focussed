// The Weekly Session: Sunday's slot on her studio schedule. Full screen, phone first.
// One question per screen, one sharp thing, one Ink pill.
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import './pf.css'
import { useWeekStore } from '../store/pf/weekStore'
import { weekKey, nextWeekKey, weekNumber, weekLabel, fmtDay, todayStr } from '../lib/pf/week'
import { ApertureMark } from './Aperture'
import { useClock, minutesBetween } from './now/contextStore'
import { useSettingsStore } from './settingsStore'
import { Dock, StepMoney, StepThree, StepRituals, StepWeek, WeekGrid } from './SessionSteps'
import { StepLookBack } from './LookBack'
import type { Prefs } from './SessionSteps'
import { takeDevView } from './devSeed'

// Honest times: what each step takes now that it confirms instead of asking.
const STEPS = [
  { label: 'Look back', minutes: 0.5 },
  { label: 'Money', minutes: 0.5 },
  { label: 'Your three', minutes: 2 },
  { label: 'Success habits', minutes: 1 },
  { label: 'Your week', minutes: 2 },
]
const TOTAL = Math.ceil(STEPS.reduce((a, s) => a + s.minutes, 0))

function sessionKey() {
  const key = weekKey()
  return new Date().getDay() === 0 ? nextWeekKey(key) : key
}

export function WeeklySession() {
  const key = sessionKey()
  const week = useWeekStore(s => s.weeks[key])
  const ensureWeek = useWeekStore(s => s.ensureWeek)
  const startSession = useWeekStore(s => s.startSession)
  const setStep = useWeekStore(s => s.setStep)
  // 'auto' resolves from the week itself: a completed session opens on its week, anything else on the slot.
  const [chosen, setView] = useState<'auto' | 'slot' | 'steps' | 'closed'>(() => takeDevView() ?? 'auto')
  const [drop, setDrop] = useState('')
  const settings = useSettingsStore.getState()
  const [prefs, setPrefs] = useState<Prefs>({ workStart: settings.workStart, workEnd: settings.workEnd, freeDays: settings.freeDays })
  const clock = useClock()

  useEffect(() => { ensureWeek(key) }, [key, ensureWeek])
  const completed = !!week?.sessionCompletedAt
  const view = chosen === 'auto' ? (completed && (week?.step ?? 0) >= 5 ? 'closed' : 'slot') : chosen
  useEffect(() => { window.scrollTo(0, 0); document.querySelector('.pf-room')?.scrollTo(0, 0) }, [view, week?.step])

  if (!week) return null
  const step = Math.min(5, Math.max(1, week.step || 1))
  const started = week.step > 0 && !completed

  // Twenty minutes, counted down from the moment she walked in. Time is visible, never a nag.
  const startedAt = week.sessionStartedAt && !completed ? new Date(week.sessionStartedAt).toTimeString().slice(0, 5) : null
  const elapsed = startedAt ? Math.max(0, minutesBetween(startedAt, clock)) : 0
  const left = Math.max(0, TOTAL - elapsed)

  function walkIn() { startSession(key); setView('steps') }
  function go(n: number) { setStep(key, n) }

  return (
    <div className="pf pf-room">
      <div className="pf-field" aria-hidden="true" />
      <div className="pf-grain" aria-hidden="true" />
      <div className={`pf-col ${view === 'steps' && step === 5 ? 'pf-col--wide' : ''} ${view === 'closed' ? 'pf-col--wide' : ''}`}>
        <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, minHeight: 44 }}>
          <Link to="/now" style={{ display: 'inline-flex', alignItems: 'center', gap: 9, textDecoration: 'none', color: 'inherit', fontSize: 14, fontWeight: 500, letterSpacing: '-.01em', wordSpacing: '-.06em' }} aria-label="Back to Now">
            <ApertureMark size={22} /> Pretty Focussed
          </Link>
          <span className="pf-cap" style={{ whiteSpace: 'nowrap' }}>
            <span className="pf-mono" style={{ color: 'var(--text)' }}>{clock}</span> · week <span className="pf-mono">{weekNumber(key)}</span>
          </span>
        </header>
        {view === 'steps' && (
          <p className="pf-cap" style={{ marginTop: 14 }} aria-live="polite">
            Step <span className="pf-mono">{step}</span> of <span className="pf-mono">5</span>, {STEPS[step - 1].label} · <span className="pf-mono">{left} min</span> left of {TOTAL}
          </p>
        )}

        {view === 'slot' && (
          <div className="pf-enter" style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
            <div style={{ marginTop: 'clamp(40px, 10vh, 96px)' }}>
              <p className="pf-over">{fmtDay(todayStr(), 'EEEE d MMMM')} · week {weekNumber(key)}</p>
              <h1 className="pf-h1" style={{ marginTop: 14 }}>{completed ? 'Your week is set.' : started ? `Continue at ${STEPS[step - 1].label.toLowerCase()}.` : `${TOTAL} minutes. Then the week knows what it is for.`}</h1>
              <p className="pf-body" style={{ marginTop: 14 }}>{completed ? `${weekLabel(key)}. Open it, or walk through it again.` : started ? `Step ${step} of 5. About ${Math.ceil(STEPS.slice(step - 1).reduce((a, x) => a + x.minutes, 0))} minutes left.` : `${weekLabel(key)}. Five steps, one question each. You can stop and come back.`}</p>
            </div>

            <div className="pf-rows" style={{ marginTop: 44 }}>
              {STEPS.map((s, i) => {
                const n = i + 1
                const state = completed ? 'done' : started ? (n < step ? 'done' : n === step ? 'current' : 'next') : n === 1 ? 'current' : 'next'
                return (
                  <div key={s.label} className={`pf-row ${state === 'next' ? 'pf-soft' : ''} ${state === 'done' ? 'pf-faded' : ''}`}>
                    <span className="pf-dot" data-state={state === 'next' ? 'upcoming' : state} aria-hidden="true" style={{ width: 8, height: 8 }} />
                    <span style={{ fontSize: 16, fontWeight: state === 'current' ? 500 : 400 }}>{s.label}</span>
                    <span className="pf-cap pf-mono">{s.minutes < 1 ? '30 sec' : `${s.minutes} min`}</span>
                  </div>
                )
              })}
            </div>

            <Dock
              primary={{ label: completed ? 'Open your week' : started ? 'Continue' : 'Walk in', onClick: completed ? () => setView('closed') : walkIn }}
              secondary={{ label: 'Not tonight', to: '/now' }} />
          </div>
        )}

        {view === 'steps' && (
          <div key={step} className="pf-enter" style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
            {step === 1 && <StepLookBack week={week} onNext={() => go(2)} onSkip={() => go(2)} />}
            {step === 2 && <StepMoney onNext={() => go(3)} onBack={() => go(1)} />}
            {step === 3 && <StepThree week={week} drop={drop} setDrop={setDrop} onNext={() => go(4)} onBack={() => go(2)} />}
            {step === 4 && <StepRituals week={week} prefs={prefs} setPrefs={setPrefs} onNext={() => go(5)} onBack={() => go(3)} />}
            {step === 5 && <StepWeek week={week} prefs={prefs} drop={drop} onDone={() => setView('closed')} onBack={() => go(4)} />}
          </div>
        )}

        {view === 'closed' && (
          <div className="pf-enter" style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', marginTop: 'clamp(40px, 10vh, 96px)', marginBottom: 56 }}>
              <ApertureMark size={72} play />
              <h1 className="pf-h1" style={{ marginTop: 36 }}>Your week is set.</h1>
              <p className="pf-body" style={{ marginTop: 16, maxWidth: '36ch' }}>Monday starts clear. {week.priorities.length} priorities, {Object.values(week.ritualDays).flat().length} habit mornings held.</p>
            </div>
            <WeekGrid week={week} />
            <Dock primary={{ label: 'Back to Now', to: '/now' }} secondary={{ label: 'Redo the session', onClick: () => { setStep(key, 1); setView('steps') } }} />
          </div>
        )}
      </div>
    </div>
  )
}
