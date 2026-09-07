/**
 * QuickCapture — Fase 2
 *
 * Principe: Hormozi — minimaliseer tijd-tot-eerste-resultaat.
 * Een idee of taak vastleggen in < 3 seconden, altijd bereikbaar op elk scherm.
 * Geen verplichte velden. Geen categorisatie. Gewoon typen en Enter.
 *
 * Principe: de app onthoudt, de gebruiker niet.
 * Wat niet meteen vastgelegd kan worden, is voor een ADHD-brein verloren.
 */

import { useState, useEffect, useRef } from 'react'
import { Plus } from 'lucide-react'
import { useTaskStore } from '../../store/taskStore'

// Voss-copy: variabele placeholders benoemen de gedachte achter de actie
// Principe: tactische empathie — de gebruiker voelt zich begrepen, niet aangestuurd
const PLACEHOLDERS = [
  "What don't you want to forget?",
  "What's on your mind?",
  'One idea. Just drop it here.',
  "What can't you forget today?",
  'Put it here. No action needed now.',
]

export function QuickCapture() {
  const { addTask } = useTaskStore()
  const [open, setOpen]       = useState(false)
  const [value, setValue]     = useState('')
  const [saved, setSaved]     = useState(false)
  const [placeholder] = useState(() => PLACEHOLDERS[Math.floor(Math.random() * PLACEHOLDERS.length)])
  const inputRef = useRef<HTMLInputElement>(null)

  // Keyboard shortcut: ⌘K / Ctrl+K om te openen, Escape om te sluiten
  // Principe: time-blindness ondersteunen — snelkoppeling zodat de gedachte
  // niet verdwijnt terwijl je naar de muis zoekt
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setOpen(v => !v)
      }
      if (e.key === 'Escape' && open) {
        setOpen(false)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open])

  // Auto-focus bij openen
  useEffect(() => {
    if (open) {
      const t = setTimeout(() => inputRef.current?.focus(), 60)
      return () => clearTimeout(t)
    } else {
      setValue('')
      setSaved(false)
    }
  }, [open])

  const save = () => {
    const trimmed = value.trim()
    if (!trimmed) return
    // Principe: app onthoudt, gebruiker niet — minimale metadata, status 'backlog'
    addTask({
      title: trimmed,
      business: 'personal',
      category: 'operations',
      priority: 2,
      needleMover: false,
      status: 'backlog',
      tags: [],
    })
    setSaved(true)
    setValue('')
    // Sluit automatisch na korte bevestiging — geen afleiding
    const t = setTimeout(() => {
      setSaved(false)
      setOpen(false)
    }, 1000)
    return () => clearTimeout(t)
  }

  return (
    <>
      {/* ── Capture Panel ── */}
      {open && (
        <>
          {/* Klik buiten sluit panel */}
          <div
            style={{ position: 'fixed', inset: 0, zIndex: 390 }}
            onClick={() => setOpen(false)}
          />
          <div
            style={{
              position: 'fixed', bottom: 92, right: 28, zIndex: 400,
              width: 360,
              background: 'rgba(24,14,6,0.97)',
              backdropFilter: 'blur(40px) saturate(180%)',
              WebkitBackdropFilter: 'blur(40px) saturate(180%)',
              border: '1px solid rgba(255,200,120,0.18)',
              borderRadius: 20,
              padding: '22px 22px 18px',
              boxShadow: '0 20px 60px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,220,150,0.12)',
              animation: 'fade-up 260ms cubic-bezier(.16,1,.3,1) forwards',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(255,210,160,0.4)' }}>
                Quick capture
              </p>
              <span style={{ fontSize: 10, color: 'rgba(255,210,160,0.25)', letterSpacing: '0.05em' }}>⌘K</span>
            </div>

            {saved ? (
              /* Stille bevestiging — kalm, niet schreeuwerig */
              <div style={{
                padding: '12px 16px', borderRadius: 11,
                background: 'rgba(125,200,154,0.10)', border: '1px solid rgba(125,200,154,0.2)',
                display: 'flex', alignItems: 'center', gap: 10,
              }}>
                <div style={{ width: 18, height: 18, borderRadius: '50%', background: 'rgba(125,200,154,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                    <path d="M1 4L3.5 6.5L9 1" stroke="#7DC89A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <p style={{ fontSize: 13, color: 'var(--color-brand-green)', fontWeight: 500 }}>Captured.</p>
              </div>
            ) : (
              <>
                <input
                  ref={inputRef}
                  value={value}
                  onChange={e => setValue(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') save()
                    if (e.key === 'Escape') setOpen(false)
                  }}
                  placeholder={placeholder}
                  style={{
                    width: '100%', padding: '12px 15px', borderRadius: 12,
                    border: '1px solid rgba(255,200,120,0.18)',
                    background: 'rgba(255,255,255,0.05)',
                    color: 'rgba(255,248,235,0.92)',
                    fontSize: 14, outline: 'none', fontFamily: 'inherit',
                    boxSizing: 'border-box', lineHeight: 1.5,
                    transition: 'border-color 180ms',
                  }}
                  onFocus={e => { e.target.style.borderColor = 'rgba(232,168,76,0.5)' }}
                  onBlur={e => { e.target.style.borderColor = 'rgba(255,200,120,0.18)' }}
                />
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 }}>
                  <p style={{ fontSize: 10, color: 'rgba(255,210,160,0.28)' }}>
                    Goes to your backlog — no categorization needed
                  </p>
                  <button
                    onClick={save}
                    disabled={!value.trim()}
                    style={{
                      padding: '7px 16px', borderRadius: 9,
                      border: 'none',
                      background: value.trim() ? 'var(--color-accent)' : 'rgba(255,255,255,0.07)',
                      color: value.trim() ? '#fff' : 'rgba(255,210,160,0.3)',
                      fontSize: 12, fontWeight: 600,
                      cursor: value.trim() ? 'pointer' : 'not-allowed',
                      transition: 'all 200ms ease', flexShrink: 0,
                    }}
                  >
                    Save
                  </button>
                </div>
              </>
            )}
          </div>
        </>
      )}

      {/* ── Zwevende knop ── altijd zichtbaar, elke scherm */}
      {/* Principe: altijd-bereikbare capture = externaliseer het geheugen van de gebruiker */}
      <button
        onClick={() => setOpen(v => !v)}
        title="Quick capture (⌘K)"
        style={{
          position: 'fixed', bottom: 28, right: 28, zIndex: 400,
          width: 52, height: 52, borderRadius: '50%',
          border: 'none',
          background: open ? 'rgba(232,168,76,0.9)' : 'var(--color-accent)',
          color: '#fff', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: open
            ? '0 4px 16px rgba(232,168,76,0.3)'
            : '0 8px 28px rgba(232,168,76,0.40), 0 2px 8px rgba(0,0,0,0.3)',
          transition: 'all 220ms cubic-bezier(.16,1,.3,1)',
          transform: open ? 'rotate(45deg) scale(1.05)' : 'rotate(0deg) scale(1)',
        }}
      >
        <Plus size={20} strokeWidth={2} />
      </button>
    </>
  )
}
