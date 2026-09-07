// The Aperture: a sage ring sweeping 300 degrees from twelve, tapering, and one Ink dot that never moves.
// Also the aperture ring (progress is an arc, never a bar) and the loading arc.
import { useId } from 'react'

export function ApertureMark({ size = 24, play = false, className }: { size?: number; play?: boolean; className?: string }) {
  const id = useId()
  const simple = size < 24
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" role="img" aria-label="Pretty Focussed"
      className={`${play ? 'ap-play' : ''} ${className ?? ''}`}>
      <defs>
        <linearGradient id={`${id}-g`} x1="0.15" y1="0" x2="0.85" y2="1">
          <stop offset="0" stopColor="#98A886" /><stop offset=".55" stopColor="#8B9C79" /><stop offset="1" stopColor="#6E7F5E" />
        </linearGradient>
        <mask id={`${id}-m`}>
          <circle cx="50" cy="50" r="42" fill="none" stroke="#fff" strokeWidth="26"
            strokeDasharray="220 300" strokeDashoffset="0" transform="rotate(-90 50 50)" className="ap-sweep" />
        </mask>
      </defs>
      <g className="ap-body">
        {simple ? (
          <path d="M50 12 A38 38 0 1 1 23 77" fill="none" stroke="#6E7F5E" strokeWidth="9" strokeLinecap="round" />
        ) : (
          <g mask={`url(#${id}-m)`}>
            <circle cx="50" cy="50" r="42" fill="none" stroke={`url(#${id}-g)`} strokeWidth="10" strokeLinecap="round" />
          </g>
        )}
        <circle cx="50" cy="50" r="10" fill="currentColor" className="ap-dot" />
      </g>
    </svg>
  )
}

// Progress ring: dotted Stone track, depth-gradient value from twelve o'clock, hairline needle.
// `potential` draws a dashed arc after the value: what could still come. Dashed is a target, solid is a value.
// `ticks` are fractions of the dial (0 to 1) drawn as radial hairlines outside the track: quarters on a year, weeks on a month.
export function ApertureRing({ value, max, potential = 0, ticks = [], size = 180, stroke = 12, children }: { value: number; max: number; potential?: number; ticks?: number[]; size?: number; stroke?: number; children?: React.ReactNode }) {
  const id = useId()
  const r = 78
  const circ = 2 * Math.PI * r
  const pct = max > 0 ? Math.min(1, Math.max(0, value / max)) : 0
  const sweep = 0.816 // 294 degrees, the dial never closes
  const pot = max > 0 ? Math.min(1, Math.max(0, (value + potential) / max)) : 0
  const a0 = pct * 294, a1 = pot * 294
  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg viewBox="2 2 196 196" width={size} height={size} aria-hidden="true" style={{ display: 'block' }}>
        <defs>
          <linearGradient id={`${id}-d`} x1="0.1" y1="0" x2="0.9" y2="1">
            <stop offset="0" stopColor="#C6D0B8" /><stop offset=".6" stopColor="#98A886" /><stop offset="1" stopColor="#6E7F5E" />
          </linearGradient>
        </defs>
        <circle cx="100" cy="100" r={r} fill="none" stroke="var(--ring-track)" strokeWidth="2" strokeDasharray="1.5 5" strokeLinecap="round"
          transform="rotate(-90 100 100)" style={{ strokeDashoffset: 0 }} />
        <circle cx="100" cy="100" r={r} fill="none" stroke={`url(#${id}-d)`} strokeWidth={stroke} strokeLinecap="round"
          transform="rotate(-90 100 100)" strokeDasharray={circ} strokeDashoffset={circ - circ * sweep * pct}
          style={{ transition: 'stroke-dashoffset 200ms cubic-bezier(.23,1,.32,1)' }} />
        {ticks.map((t, i) => (
          <line key={i} x1="100" y1="13" x2="100" y2="8" stroke="var(--ring-track)" strokeWidth="1" transform={`rotate(${Math.min(1, Math.max(0, t)) * 294} 100 100)`} />
        ))}
        {a1 > a0 + 1 && (
          <path d={arcPath(100, 100, r, a0, a1)} fill="none" stroke="var(--depth-3)" strokeWidth="2" strokeDasharray="3 5" strokeLinecap="round" />
        )}
        {/* the needle sits outside the arc, from the track's edge outward, so the value never runs over it */}
        <line x1="100" y1="14" x2="100" y2="4" stroke="currentColor" strokeWidth="1"
          transform={`rotate(${pct * 294} 100 100)`} style={{ transition: 'transform 200ms cubic-bezier(.23,1,.32,1)' }} />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4, textAlign: 'center' }}>
        {children}
      </div>
    </div>
  )
}

// An arc from angle a0 to a1, degrees clockwise from twelve o'clock.
function arcPath(cx: number, cy: number, r: number, a0: number, a1: number): string {
  const p = (a: number) => { const t = (a - 90) * Math.PI / 180; return `${(cx + r * Math.cos(t)).toFixed(2)} ${(cy + r * Math.sin(t)).toFixed(2)}` }
  return `M ${p(a0)} A ${r} ${r} 0 ${a1 - a0 > 180 ? 1 : 0} 1 ${p(a1)}`
}

// A conversation's depth: the ring fills as it moves towards Won. Won closes it and the dot arrives.
export function StageRing({ depth, closed = false, size = 22 }: { depth: number; closed?: boolean; size?: number }) {
  const r = 40, circ = 2 * Math.PI * r
  const pct = Math.min(1, Math.max(0, depth))
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" aria-hidden="true" style={{ display: 'block', flexShrink: 0 }}>
      <circle cx="50" cy="50" r={r} fill="none" stroke="var(--ring-track)" strokeWidth="3" strokeDasharray="2 8" strokeLinecap="round" />
      {pct > 0 && (
        <circle cx="50" cy="50" r={r} fill="none" stroke={pct >= 1 ? 'var(--depth-3)' : pct >= .6 ? 'var(--depth-2)' : 'var(--depth-1)'} strokeWidth="11" strokeLinecap="round"
          transform="rotate(-90 50 50)" strokeDasharray={circ} strokeDashoffset={circ - circ * pct}
          style={{ transition: 'stroke-dashoffset 200ms cubic-bezier(.23,1,.32,1), stroke 200ms cubic-bezier(.23,1,.32,1)' }} />
      )}
      {closed && <circle cx="50" cy="50" r="13" fill="currentColor" />}
    </svg>
  )
}

// Loading: a single arc segment orbiting at 900ms. Never a spinner.
export function ApertureLoader({ size = 28, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" aria-hidden="true" className="pf-sweep" style={{ display: 'block' }}>
      <circle cx="50" cy="50" r="40" fill="none" stroke="var(--ring-track)" strokeWidth="2" strokeDasharray="1.5 5" />
      <circle cx="50" cy="50" r="40" fill="none" stroke={color} strokeWidth="8" strokeLinecap="round" strokeDasharray="80 172" transform="rotate(-90 50 50)" />
    </svg>
  )
}

export function StepDots({ total, current, done, onGo }: { total: number; current: number; done: (i: number) => boolean; onGo: (i: number) => void }) {
  return (
    <div className="pf-dots" role="list" aria-label="Session steps">
      {Array.from({ length: total }, (_, i) => {
        const state = i === current ? 'current' : done(i) ? 'done' : 'upcoming'
        return (
          <button key={i} type="button" role="listitem" className="pf-dot" data-state={state}
            aria-label={`Step ${i + 1}${state === 'current' ? ', current' : state === 'done' ? ', done' : ''}`}
            aria-current={state === 'current' ? 'step' : undefined}
            onClick={() => state === 'done' && onGo(i)} />
        )
      })}
    </div>
  )
}

export function CircleCheck({ checked, onChange, label }: { checked: boolean; onChange: () => void; label: string }) {
  return (
    <button type="button" role="checkbox" aria-checked={checked} aria-label={label} className="pf-check" onClick={onChange}>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
    </button>
  )
}
