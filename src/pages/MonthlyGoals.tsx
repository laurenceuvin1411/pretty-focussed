import { useState, useRef, useEffect } from 'react'
import { format } from 'date-fns'
import { Check, Trash2, ChevronLeft, ChevronRight, Target } from 'lucide-react'
import { useMonthlyGoalStore } from '../store/monthlyGoalStore'
import type { GoalSphere, MonthlyGoal } from '../store/monthlyGoalStore'

const ACCENT = '#4C6481'

const SPHERE_CFG: Record<GoalSphere, { label: string; color: string }> = {
  personal:     { label: 'Persoonlijk',   color: '#C4935A' },
  professional: { label: 'Professioneel', color: '#6DB889' },
}

const MONTH_NAMES = ['Jan', 'Feb', 'Maart', 'April', 'Mei', 'Juni', 'Juli', 'Aug', 'Sep', 'Okt', 'Nov', 'Dec']

// ── Goal card ────────────────────────────────────────────────────
function GoalCard({ goal, onDragStart }: { goal: MonthlyGoal; onDragStart: () => void }) {
  const { toggleGoal, deleteGoal, updateGoal } = useMonthlyGoalStore()
  const [hover, setHover] = useState(false)
  const cfg = SPHERE_CFG[goal.sphere]

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{
        display: 'flex', alignItems: 'flex-start', gap: 9, padding: '10px 12px',
        borderRadius: 11, background: 'var(--color-card)', border: '1px solid var(--color-border)',
        borderLeft: `3px solid ${cfg.color}`,
        opacity: goal.done ? 0.55 : 1, transition: 'opacity 200ms', cursor: 'grab',
      }}
    >
      <button
        onClick={() => toggleGoal(goal.id)}
        aria-label={goal.done ? 'Heropen doel' : 'Vink doel af'}
        style={{
          width: 18, height: 18, borderRadius: 6, flexShrink: 0, cursor: 'pointer', marginTop: 2,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: goal.done ? cfg.color : 'transparent',
          border: `2px solid ${goal.done ? cfg.color : 'rgba(124,127,132,0.30)'}`,
          transition: 'all 180ms',
        }}
      >
        {goal.done && <Check size={10} color="#fff" strokeWidth={3} />}
      </button>

      <textarea
        value={goal.title}
        onChange={e => updateGoal(goal.id, e.target.value)}
        rows={Math.max(1, Math.ceil(goal.title.length / 26))}
        style={{
          flex: 1, border: 'none', background: 'transparent', outline: 'none', resize: 'none',
          fontSize: 12.5, fontFamily: 'inherit', lineHeight: 1.45, padding: 0,
          color: goal.done ? 'var(--color-muted)' : 'var(--color-ink)',
          textDecoration: goal.done ? 'line-through' : 'none',
        }}
      />

      {hover && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flexShrink: 0 }}>
          <button
            onClick={() => useMonthlyGoalStore.setState(s => ({
              goals: s.goals.map(g => g.id === goal.id
                ? { ...g, sphere: g.sphere === 'personal' ? 'professional' : 'personal' }
                : g),
            }))}
            title={`Nu ${cfg.label.toLowerCase()} · klik om te wisselen`}
            style={{ width: 14, height: 14, borderRadius: '50%', border: 'none', background: cfg.color, cursor: 'pointer', padding: 0 }}
          />
          <button onClick={() => deleteGoal(goal.id)} title="Verwijder" aria-label="Verwijder doel"
            style={{ width: 16, height: 16, borderRadius: 5, border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-subtle)', padding: 0 }}>
            <Trash2 size={10} />
          </button>
        </div>
      )}
    </div>
  )
}

// ── Column ───────────────────────────────────────────────────────
function GoalColumn({ monthKey, title, isCurrent, dragId }: {
  monthKey: string; title: string; isCurrent: boolean
  dragId: React.MutableRefObject<string | null>
}) {
  const { goals, addGoal, moveGoal } = useMonthlyGoalStore()
  const [draft, setDraft] = useState('')
  const [draftSphere, setDraftSphere] = useState<GoalSphere>('personal')
  const list = goals.filter(g => g.month === monthKey)
  const done = list.filter(g => g.done).length

  function submit() {
    if (!draft.trim()) return
    addGoal(monthKey, draftSphere, draft.trim())
    setDraft('')
  }

  return (
    <div
      onDragOver={e => e.preventDefault()}
      onDrop={e => {
        e.preventDefault()
        if (dragId.current) { moveGoal(dragId.current, monthKey); dragId.current = null }
      }}
      style={{
        width: 250, flexShrink: 0, borderRadius: 16,
        background: isCurrent ? 'rgba(76,100,129,0.05)' : 'var(--color-surface)',
        border: `1.5px solid ${isCurrent ? ACCENT : 'var(--color-border)'}`,
        padding: '13px 11px', display: 'flex', flexDirection: 'column', gap: 7,
        alignSelf: 'flex-start',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '0 3px', marginBottom: 3 }}>
        <span style={{ width: 7, height: 7, borderRadius: '50%', background: isCurrent ? ACCENT : 'var(--color-subtle)', flexShrink: 0, opacity: isCurrent ? 1 : 0.5 }} />
        <span style={{ fontSize: 12, fontWeight: 800, color: isCurrent ? ACCENT : 'var(--color-ink)', letterSpacing: '-0.01em', flex: 1 }}>{title}</span>
        {list.length > 0 && (
          <span style={{ fontSize: 10, fontWeight: 700, fontFamily: 'var(--font-mono)', padding: '2px 8px', borderRadius: 99, background: done === list.length ? 'rgba(109,184,137,0.14)' : 'rgba(76,100,129,0.08)', color: done === list.length ? '#6DB889' : 'var(--color-muted)' }}>
            {done}/{list.length}
          </span>
        )}
      </div>

      {list.map(g => (
        <GoalCard key={g.id} goal={g} onDragStart={() => { dragId.current = g.id }} />
      ))}

      {/* Quick add */}
      <div style={{ borderRadius: 11, border: '1.5px dashed var(--color-border)', padding: '8px 10px' }}>
        <input
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && submit()}
          placeholder="+ nieuw doel"
          aria-label={`Nieuw doel voor ${title}`}
          style={{ width: '100%', border: 'none', background: 'transparent', outline: 'none', fontSize: 12, fontFamily: 'inherit', color: 'var(--color-ink)', padding: 0, boxSizing: 'border-box' }}
        />
        {draft.trim() && (
          <div style={{ display: 'flex', gap: 5, marginTop: 7 }}>
            {(Object.keys(SPHERE_CFG) as GoalSphere[]).map(s => (
              <button key={s}
                onClick={() => { setDraftSphere(s) }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 4, padding: '3px 9px', borderRadius: 99,
                  fontSize: 9.5, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-mono)',
                  border: `1.5px solid ${draftSphere === s ? SPHERE_CFG[s].color : 'var(--color-border)'}`,
                  background: draftSphere === s ? `${SPHERE_CFG[s].color}18` : 'transparent',
                  color: draftSphere === s ? SPHERE_CFG[s].color : 'var(--color-subtle)',
                }}>
                <span style={{ width: 5, height: 5, borderRadius: '50%', background: SPHERE_CFG[s].color, display: 'inline-block' }} />
                {SPHERE_CFG[s].label}
              </button>
            ))}
            <button onClick={submit}
              style={{ marginLeft: 'auto', padding: '3px 11px', borderRadius: 99, border: 'none', background: 'var(--color-ink)', color: 'var(--color-bg)', fontSize: 9.5, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-mono)' }}>
              OK
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Main ─────────────────────────────────────────────────────────
export function MonthlyGoals() {
  const currentYear = new Date().getFullYear()
  const currentMonth = format(new Date(), 'yyyy-MM')
  const [year, setYear] = useState(currentYear)
  const { goals } = useMonthlyGoalStore()
  const dragId = useRef<string | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const currentColRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // scroll het board horizontaal naar de huidige maand (na layout)
    const t = setTimeout(() => {
      if (year === currentYear && scrollRef.current && currentColRef.current) {
        scrollRef.current.scrollLeft = Math.max(0, currentColRef.current.offsetLeft - 290)
      }
    }, 50)
    return () => clearTimeout(t)
  }, [year])

  const yearGoals = goals.filter(g => g.month.startsWith(String(year)))
  const yearDone = yearGoals.filter(g => g.done).length
  const overallKey = `${year}-00`

  return (
    <div style={{ maxWidth: '100%', minWidth: 0 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 10 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <Target size={14} color={ACCENT} />
            <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: ACCENT, fontFamily: 'var(--font-mono)' }}>Doelen {year}</span>
          </div>
          <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--color-ink)', lineHeight: 1.1, marginBottom: 8 }}>Goals</h1>
          <p style={{ fontSize: 13.5, color: 'var(--color-subtle)', fontFamily: 'var(--font-serif)', fontStyle: 'italic', lineHeight: 1.55, maxWidth: 480 }}>
            Je doelen zijn geen to-do's, maar een kompas naar je higher self. Let's focus on you.
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          {yearGoals.length > 0 && (
            <span style={{ fontSize: 11, color: 'var(--color-subtle)', fontFamily: 'var(--font-mono)' }}>{yearDone}/{yearGoals.length} afgerond</span>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button onClick={() => setYear(y => y - 1)} aria-label="Vorig jaar"
              style={{ width: 30, height: 30, borderRadius: 9, border: '1px solid var(--color-border)', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-muted)' }}>
              <ChevronLeft size={13} />
            </button>
            <span style={{ fontSize: 15, fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--color-ink)', minWidth: 48, textAlign: 'center' }}>{year}</span>
            <button onClick={() => setYear(y => y + 1)} aria-label="Volgend jaar"
              style={{ width: 30, height: 30, borderRadius: 9, border: '1px solid var(--color-border)', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-muted)' }}>
              <ChevronRight size={13} />
            </button>
          </div>
        </div>
      </div>

      {/* Legende */}
      <div style={{ display: 'flex', gap: 14, marginBottom: 18 }}>
        {(Object.keys(SPHERE_CFG) as GoalSphere[]).map(s => (
          <span key={s} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 10.5, color: 'var(--color-subtle)', fontFamily: 'var(--font-mono)' }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: SPHERE_CFG[s].color, display: 'inline-block' }} />
            {SPHERE_CFG[s].label}
          </span>
        ))}
        <span style={{ fontSize: 10.5, color: 'var(--color-subtle)', fontFamily: 'var(--font-mono)', opacity: 0.7 }}>· sleep kaartjes tussen maanden</span>
      </div>

      {/* Board */}
      <div ref={scrollRef} style={{ display: 'flex', gap: 14, overflowX: 'auto', paddingBottom: 24, WebkitOverflowScrolling: 'touch' }}>
        {/* Overall kolom */}
        <GoalColumn monthKey={overallKey} title={`Overall ${year}`} isCurrent={false} dragId={dragId} />

        {MONTH_NAMES.map((name, i) => {
          const monthKey = `${year}-${String(i + 1).padStart(2, '0')}`
          const isCurrent = monthKey === currentMonth
          return (
            <div key={monthKey} ref={isCurrent ? currentColRef : undefined}>
              <GoalColumn monthKey={monthKey} title={`${name} ${year}`} isCurrent={isCurrent} dragId={dragId} />
            </div>
          )
        })}
      </div>
    </div>
  )
}
