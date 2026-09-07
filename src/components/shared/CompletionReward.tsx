/**
 * CompletionReward — Fase 3
 *
 * Principe: Hooked-loop — variabele beloning.
 * Kleine, niet-voorspelbare visuele bevestiging bij voltooiing.
 * Ethische grens: kalm, kort (< 800ms), nooit schreeuwerig.
 * Vier varianten rouleren willekeurig — nooit twee keer hetzelfde op rij.
 *
 * Varianten:
 *   1. Ripple    — stille ring die uitzet vanuit het klikvlak
 *   2. Particles — 5 kleine gekleurde stippen die uiteenspatten
 *   3. Sparkle   — 3 dunne stralen die vanuit het centrum stralen
 *   4. Bloom     — zachte lichtpuls, geen beweging buiten het element
 */

import { useState, useEffect, useRef } from 'react'

export type RewardVariant = 'ripple' | 'particles' | 'sparkle' | 'bloom'

// ── 1. Ripple — stil, minimaal
function RippleEffect({ x, y, onDone }: { x: number; y: number; onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 700)
    return () => clearTimeout(t)
  }, [])
  return (
    <div style={{ position: 'fixed', left: x, top: y, zIndex: 300, pointerEvents: 'none' }}>
      <div style={{
        position: 'absolute', transform: 'translate(-50%, -50%)',
        width: 56, height: 56, borderRadius: '50%',
        border: '1.5px solid rgba(125,200,154,0.55)',
        animation: 'ripple-out 560ms ease-out forwards',
      }} />
      <div style={{
        position: 'absolute', transform: 'translate(-50%, -50%)',
        width: 30, height: 30, borderRadius: '50%',
        border: '1px solid rgba(125,200,154,0.3)',
        animation: 'ripple-out 560ms 80ms ease-out forwards',
      }} />
    </div>
  )
}

// ── 2. Particles — 5 stippen spatten uiteen
function ParticlesEffect({ x, y, onDone }: { x: number; y: number; onDone: () => void }) {
  const [active, setActive] = useState(false)

  const particles = [
    { dx: -26, dy: -34, color: '#7DC89A', size: 5 },
    { dx:   4, dy: -40, color: '#E8A84C', size: 6 },
    { dx:  26, dy: -28, color: '#7DC89A', size: 4 },
    { dx: -16, dy: -18, color: '#8AB4CC', size: 5 },
    { dx:  16, dy: -22, color: '#E8A84C', size: 4 },
  ]

  useEffect(() => {
    // Double rAF: geeft browser één frame om initiële positie te renderen
    const raf = requestAnimationFrame(() =>
      requestAnimationFrame(() => setActive(true))
    )
    const t = setTimeout(onDone, 900)
    return () => { cancelAnimationFrame(raf); clearTimeout(t) }
  }, [])

  return (
    <div style={{ position: 'fixed', left: x, top: y, zIndex: 300, pointerEvents: 'none' }}>
      {particles.map((p, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            width: p.size, height: p.size, borderRadius: '50%',
            background: p.color,
            left: -p.size / 2, top: -p.size / 2,
            transform: active ? `translate(${p.dx}px, ${p.dy}px) scale(0)` : 'translate(0, 0) scale(1)',
            opacity: active ? 0 : 0.9,
            transition: `transform ${480 + i * 40}ms cubic-bezier(.25,.46,.45,.94) ${i * 25}ms,
                         opacity   ${480 + i * 40}ms ease-out ${i * 25 + 200}ms`,
          }}
        />
      ))}
    </div>
  )
}

// ── 3. Sparkle — 3 dunne stralen vanuit centrum
function SparkleEffect({ x, y, onDone }: { x: number; y: number; onDone: () => void }) {
  const [active, setActive] = useState(false)

  const rays = [
    { angle: -50, len: 20 },
    { angle:   0, len: 26 },
    { angle:  50, len: 18 },
  ]

  useEffect(() => {
    const raf = requestAnimationFrame(() =>
      requestAnimationFrame(() => setActive(true))
    )
    const t = setTimeout(onDone, 700)
    return () => { cancelAnimationFrame(raf); clearTimeout(t) }
  }, [])

  return (
    <div style={{ position: 'fixed', left: x, top: y, zIndex: 300, pointerEvents: 'none' }}>
      {rays.map((r, i) => {
        const rad = (r.angle - 90) * (Math.PI / 180)
        const ex = Math.cos(rad) * r.len
        const ey = Math.sin(rad) * r.len
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              width: 2, height: active ? r.len : 0,
              background: `linear-gradient(to top, rgba(232,168,76,0.8), transparent)`,
              borderRadius: 1,
              left: 0, top: 0,
              transformOrigin: 'bottom center',
              transform: `rotate(${r.angle}deg) translateX(-50%)`,
              opacity: active ? 0 : 1,
              transition: `height 300ms ${i * 50}ms ease-out, opacity 200ms ${300 + i * 50}ms ease-out`,
            }}
          />
        )
      })}
    </div>
  )
}

// ── 4. Bloom — zachte lokale gloed, geen beweging buiten klikvlak
function BloomEffect({ x, y, onDone }: { x: number; y: number; onDone: () => void }) {
  const [phase, setPhase] = useState<'in' | 'out'>('in')

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('out'), 200)
    const t2 = setTimeout(onDone, 700)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [])

  return (
    <div style={{
      position: 'fixed', left: x, top: y, zIndex: 300, pointerEvents: 'none',
      transform: 'translate(-50%, -50%)',
      width: phase === 'in' ? 80 : 0,
      height: phase === 'in' ? 80 : 0,
      borderRadius: '50%',
      background: 'radial-gradient(circle, rgba(125,200,154,0.25) 0%, transparent 70%)',
      opacity: phase === 'in' ? 1 : 0,
      transition: phase === 'in'
        ? 'all 180ms ease-out'
        : 'all 380ms ease-in',
    }} />
  )
}

// ── Hook — kies willekeurige variant, vermijd herhaling
const ALL_VARIANTS: RewardVariant[] = ['ripple', 'particles', 'sparkle', 'bloom']

export function useReward() {
  const lastVariant = useRef<RewardVariant | undefined>(undefined)
  const [effect, setEffect] = useState<{ variant: RewardVariant; x: number; y: number; key: number } | null>(null)

  const trigger = (x: number, y: number) => {
    const pool = lastVariant.current
      ? ALL_VARIANTS.filter(v => v !== lastVariant.current)
      : ALL_VARIANTS
    const variant = pool[Math.floor(Math.random() * pool.length)]
    lastVariant.current = variant
    setEffect({ variant, x, y, key: Date.now() })
  }

  const overlay = effect && (() => {
    const k = effect.key
    const clear = () => setEffect(null)
    const shared = { x: effect.x, y: effect.y, onDone: clear }
    switch (effect.variant) {
      case 'ripple':    return <RippleEffect    key={k} {...shared} />
      case 'particles': return <ParticlesEffect key={k} {...shared} />
      case 'sparkle':   return <SparkleEffect   key={k} {...shared} />
      case 'bloom':     return <BloomEffect     key={k} {...shared} />
    }
  })()

  return { trigger, overlay }
}
