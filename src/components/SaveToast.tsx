import { useEffect, useState } from 'react'
import { Check } from 'lucide-react'

// Simple event bus — no extra dependencies
const listeners: Array<(msg: string) => void> = []

export function showSaved(msg = 'Opgeslagen') {
  listeners.forEach(fn => fn(msg))
}

export function SaveToast() {
  const [visible, setVisible] = useState(false)
  const [msg, setMsg] = useState('Opgeslagen')
  const [timer, setTimer] = useState<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const handler = (m: string) => {
      setMsg(m)
      setVisible(true)
      if (timer) clearTimeout(timer)
      setTimer(setTimeout(() => setVisible(false), 2000))
    }
    listeners.push(handler)
    return () => {
      const i = listeners.indexOf(handler)
      if (i !== -1) listeners.splice(i, 1)
    }
  }, [])

  return (
    <div style={{
      position: 'fixed', bottom: 28, left: '50%',
      transform: `translateX(-50%) translateY(${visible ? 0 : 12}px)`,
      opacity: visible ? 1 : 0,
      transition: 'opacity 200ms ease, transform 200ms ease',
      pointerEvents: 'none',
      zIndex: 9999,
      display: 'flex', alignItems: 'center', gap: 8,
      padding: '9px 18px',
      borderRadius: 100,
      background: 'rgba(20,26,38,0.92)',
      border: '1px solid rgba(168,189,208,0.18)',
      boxShadow: '0 8px 32px rgba(0,0,0,0.35)',
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
    }}>
      <div style={{
        width: 18, height: 18, borderRadius: '50%',
        background: 'rgba(34,197,94,0.2)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Check size={10} color="#7A9E8A" strokeWidth={3} />
      </div>
      <span style={{
        fontSize: 12, fontWeight: 600,
        color: 'rgba(228,236,248,0.9)',
        letterSpacing: '0.02em',
        whiteSpace: 'nowrap',
      }}>{msg}</span>
    </div>
  )
}
