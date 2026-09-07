import { useSupplementStore, SUPPLEMENTS } from '../store/supplementStore'
import type { SupplementId } from '../store/supplementStore'
import { Check } from 'lucide-react'

export function SupplementStack({ selectedDateStr }: { selectedDateStr: string }) {
  const { logs, toggle } = useSupplementStore()
  const taken = logs[selectedDateStr] ?? []
  const todayStr = new Date().toISOString().split('T')[0]
  const isFuture = selectedDateStr > todayStr
  const doneCount = taken.length

  return (
    <div className="card" style={{ padding: '20px 22px', marginBottom: 20 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#6DB889', flexShrink: 0 }} />
          <div>
            <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#6DB889', marginBottom: 1 }}>Supplement Stack</p>
            <p style={{ fontSize: 12, color: 'var(--color-muted)' }}>Daily</p>
          </div>
        </div>
        <span style={{
          fontSize: 13, fontWeight: 700,
          color: doneCount === SUPPLEMENTS.length ? '#6DB889' : 'var(--color-subtle)',
          background: doneCount === SUPPLEMENTS.length ? 'rgba(109,184,137,0.12)' : 'transparent',
          padding: doneCount === SUPPLEMENTS.length ? '2px 10px' : '0',
          borderRadius: 99,
        }}>
          {doneCount}/{SUPPLEMENTS.length}
        </span>
      </div>

      {/* Pills grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 8 }}>
        {SUPPLEMENTS.map(s => {
          const done = taken.includes(s.id)
          return (
            <button
              key={s.id}
              onClick={() => !isFuture && toggle(selectedDateStr, s.id as SupplementId)}
              disabled={isFuture}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '11px 13px', borderRadius: 12, textAlign: 'left',
                background: done ? `${s.color}14` : 'rgba(255,255,255,0.03)',
                border: `1.5px solid ${done ? s.color + '50' : 'rgba(210,180,145,0.14)'}`,
                cursor: isFuture ? 'default' : 'pointer',
                transition: 'all 160ms ease',
                opacity: isFuture ? 0.4 : 1,
              }}
            >
              <div style={{
                width: 22, height: 22, borderRadius: 6, flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: done ? s.color : 'transparent',
                border: `1.5px solid ${done ? s.color : 'rgba(210,180,145,0.28)'}`,
                transition: 'all 160ms ease',
                boxShadow: done ? `0 0 8px ${s.color}45` : 'none',
              }}>
                {done && <Check size={11} color="#0A0805" strokeWidth={3} />}
              </div>
              <div>
                <p style={{ fontSize: 12, fontWeight: 600, color: done ? 'var(--color-muted)' : 'var(--color-ink)', textDecoration: done ? 'line-through' : 'none', lineHeight: 1.2 }}>{s.label}</p>
                <p style={{ fontSize: 10, color: 'var(--color-subtle)', marginTop: 2 }}>{s.sub}</p>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
