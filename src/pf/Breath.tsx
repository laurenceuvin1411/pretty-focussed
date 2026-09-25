// A breath. One circle that opens and closes, four seconds each way; she matches it.
// Ambient motion is the only place the brand clock runs slow. Reduced motion keeps the words and drops the scale.
import { useEffect, useState } from 'react'
import { Sheet } from './Sheet'
import { useContextStore } from './now/contextStore'
import { todayStr } from '../lib/pf/week'

const IN = 4000, OUT = 4000

export function BreathRing({ size = 200, cycles, onDone }: { size?: number; cycles?: number; onDone?: () => void }) {
  const [phase, setPhase] = useState<'in' | 'out'>('in')
  const [count, setCount] = useState(0)
  useEffect(() => {
    let alive = true
    let n = 0
    const tick = (p: 'in' | 'out') => {
      if (!alive) return
      setPhase(p)
      if (p === 'in') { n += 1; setCount(n); if (cycles && n > cycles) { onDone?.(); return } }
      setTimeout(() => tick(p === 'in' ? 'out' : 'in'), p === 'in' ? IN : OUT)
    }
    tick('in')
    return () => { alive = false }
  }, [cycles, onDone])
  return (
    <div className="pf-breath" style={{ width: size, height: size }} role="img" aria-label={phase === 'in' ? 'Inhale' : 'Exhale'}>
      <span className="pf-breath__halo" aria-hidden="true" />
      <span className="pf-breath__disc" aria-hidden="true" />
      <span className="pf-breath__word" aria-live="polite">{phase === 'in' ? 'Inhale' : 'Exhale'}</span>
      {cycles && <span className="pf-breath__count pf-mono">{Math.min(count, cycles)} / {cycles}</span>}
    </div>
  )
}

// Once a day, on arrival: three breaths. "Not now" is one tap and never asks again today.
export function DailyBreath() {
  const last = useContextStore(s => s.lastBreath)
  const setLastBreath = useContextStore(s => s.setLastBreath)
  const today = todayStr()
  const [open, setOpen] = useState(() => last !== today)
  function close() { setLastBreath(today); setOpen(false) }
  if (!open) return null
  return (
    <Sheet open onClose={close} title="Take a breath.">
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 22, padding: '6px 0 4px' }}>
        <p className="pf-body" style={{ textAlign: 'center', maxWidth: '30ch' }}>Three, with the circle. Then the day.</p>
        <BreathRing size={220} cycles={3} onDone={close} />
        <div style={{ display: 'flex', gap: 18, alignItems: 'center' }}>
          <button type="button" className="pf-btn pf-btn--tertiary" onClick={close}>Not now</button>
          <button type="button" className="pf-btn pf-btn--primary" onClick={close}>Done</button>
        </div>
      </div>
    </Sheet>
  )
}
