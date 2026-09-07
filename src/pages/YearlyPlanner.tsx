import { useState, useMemo, useEffect } from 'react'
import { parseISO, differenceInDays, format } from 'date-fns'
import { nlBE } from 'date-fns/locale'
import { usePlannerStore } from '../store/plannerStore'
import { useMonthlyResetStore } from '../store/monthlyResetStore'
import type { Goal, GoalCategory } from '../types'
import { Plus, X, Pencil, RotateCcw } from 'lucide-react'

// ─── constants ────────────────────────────────────────────────────
const YEAR       = 2026
const YEAR_START = new Date(YEAR, 0, 1)
const YEAR_END   = new Date(YEAR, 11, 31)
const TOTAL_DAYS = differenceInDays(YEAR_END, YEAR_START) + 1

type GoalGroup = 'personal' | 'professional' | 'investments'

const CAT: Record<GoalCategory, { label: string; color: string; group: GoalGroup }> = {
  'health':           { label: 'HEALTH',      color: '#7C7F84', group: 'personal' },
  'relationships':    { label: 'RELATIES',     color: '#7C7F84', group: 'personal' },
  'travel':           { label: 'REIZEN',       color: '#7C7F84', group: 'personal' },
  'revenue':          { label: 'OMZET',        color: '#7C7F84', group: 'professional' },
  'sales':            { label: 'SALES',        color: '#7C7F84', group: 'professional' },
  'brand':            { label: 'BRAND',        color: '#7C7F84', group: 'professional' },
  'community':        { label: 'COMMUNITY',    color: '#7C7F84', group: 'professional' },
  'personal-finance': { label: 'FIN. PERS.',  color: '#7C7F84', group: 'investments' },
  'business-savings': { label: 'SPAARGELD',   color: '#7C7F84', group: 'investments' },
  'real-estate':      { label: 'VASTGOED',    color: '#7C7F84', group: 'investments' },
  'stocks':           { label: 'AANDELEN',    color: '#7C7F84', group: 'investments' },
}

const GROUP_CONFIG: Record<GoalGroup, { label: string; accent: string; dim: string }> = {
  personal:      { label: 'PERSOONLIJK',    accent: '#4C6481', dim: 'rgba(76,100,129,0.08)' },
  professional:  { label: 'PROFESSIONEEL',  accent: '#4C6481', dim: 'rgba(76,100,129,0.08)' },
  investments:   { label: 'INVESTERINGEN',  accent: '#4C6481', dim: 'rgba(76,100,129,0.08)' },
}

const GROUP_ORDER: GoalGroup[] = ['professional', 'investments', 'personal']

// ─── helpers ──────────────────────────────────────────────────────
const pct = (g: Goal) => g.targetNumber <= 0 ? 0 : Math.min(100, Math.round((g.currentNumber / g.targetNumber) * 100))
const daysLeft = (d: string) => differenceInDays(parseISO(d), new Date())
const todayPos = () => Math.max(0, Math.min(100, differenceInDays(new Date(), YEAR_START) / TOTAL_DAYS * 100))

function status(g: Goal): 'DONE' | 'GO' | 'WATCH' | 'NO-GO' {
  const p = pct(g)
  if (p >= 100) return 'DONE'
  if (!g.targetDate) return p > 30 ? 'GO' : 'WATCH'
  const days = daysLeft(g.targetDate)
  if (days < 0) return 'NO-GO'
  // Expected progress at this point in time
  const yearElapsed = differenceInDays(new Date(), YEAR_START)
  const goalDays = differenceInDays(parseISO(g.targetDate), YEAR_START)
  const expectedPct = goalDays > 0 ? Math.round((yearElapsed / goalDays) * 100) : 100
  const delta = p - expectedPct
  if (delta >= -10) return 'GO'
  if (delta >= -25) return 'WATCH'
  return 'NO-GO'
}

const STATUS_COLOR = {
  'DONE':  '#4C6481',
  'GO':    '#4C6481',
  'WATCH': '#7C7F84',
  'NO-GO': '#7C7F84',
}

// ─── Edit Modal ───────────────────────────────────────────────────
function EditGoalModal({ goal, onClose, onSave, onDelete }: {
  goal: Goal; onClose: () => void
  onSave: (u: Partial<Goal>) => void
  onDelete: () => void
}) {
  const [form, setForm] = useState({
    title: goal.title,
    category: goal.category,
    targetNumber: goal.targetNumber,
    currentNumber: goal.currentNumber,
    unit: goal.unit,
    targetDate: goal.targetDate ?? '',
    whyItMatters: goal.whyItMatters ?? '',
    horizon: goal.horizon,
  })
  const set = <K extends keyof typeof form>(k: K, v: typeof form[K]) => setForm(p => ({ ...p, [k]: v }))
  const cfg = CAT[form.category]
  const monthHistory = useMonthlyResetStore(s => s.getHistory(goal.id))

  const inputStyle: React.CSSProperties = {
    width: '100%', boxSizing: 'border-box',
    background: 'var(--color-surface)', border: '1px solid var(--color-border)',
    borderRadius: 4, padding: '10px 14px', color: 'var(--color-ink)', fontSize: 13,
    fontFamily: 'var(--font-mono)', outline: 'none', letterSpacing: '0.02em',
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    onSave({
      title: form.title,
      category: form.category,
      targetNumber: form.targetNumber,
      currentNumber: form.currentNumber,
      unit: form.unit,
      targetDate: (form.targetDate as string) || undefined,
      whyItMatters: form.whyItMatters,
      horizon: form.horizon,
      color: cfg.color,
    })
    onClose()
  }

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 40, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)' }} />
      <div style={{
        position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
        zIndex: 50, width: 460, maxHeight: '90vh', overflowY: 'auto',
        background: 'var(--color-card)', border: '1px solid var(--color-border)',
        borderRadius: 8, boxShadow: '0 32px 80px rgba(0,0,0,0.5)',
      }}>
        <div style={{ height: 2, background: cfg.color, transition: 'background 200ms' }} />
        <div style={{ padding: '24px 24px 28px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.14em', color: cfg.color, fontFamily: 'var(--font-mono)' }}>EDIT OBJECTIVE</span>
            <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-muted)' }}><X size={15} /></button>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.14em', color: 'var(--color-muted)', display: 'block', marginBottom: 6, fontFamily: 'var(--font-mono)' }}>CATEGORIE</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                {(Object.entries(CAT) as [GoalCategory, typeof CAT[GoalCategory]][]).map(([key, c]) => (
                  <button key={key} type="button" onClick={() => set('category', key)} style={{
                    padding: '4px 10px', borderRadius: 3, fontSize: 9, cursor: 'pointer', fontWeight: 700,
                    fontFamily: 'var(--font-mono)', letterSpacing: '0.1em',
                    background: form.category === key ? `${c.color}20` : 'transparent',
                    border: `1px solid ${form.category === key ? c.color : 'var(--color-border)'}`,
                    color: form.category === key ? c.color : 'var(--color-subtle)', transition: 'all 100ms',
                  }}>{c.label}</button>
                ))}
              </div>
            </div>

            <div>
              <label style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.14em', color: 'var(--color-muted)', display: 'block', marginBottom: 6, fontFamily: 'var(--font-mono)' }}>OBJECTIVE</label>
              <input required value={form.title} onChange={e => set('title', e.target.value)} style={inputStyle} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 0.6fr', gap: 10 }}>
              {[
                { label: 'TARGET', key: 'targetNumber' as const, type: 'number' },
                { label: 'CURRENT', key: 'currentNumber' as const, type: 'number' },
                { label: 'UNIT', key: 'unit' as const, type: 'text' },
              ].map(f => (
                <div key={f.key}>
                  <label style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.14em', color: 'var(--color-muted)', display: 'block', marginBottom: 6, fontFamily: 'var(--font-mono)' }}>{f.label}</label>
                  <input required={f.key !== 'currentNumber'} type={f.type}
                    value={String(form[f.key])}
                    onChange={e => set(f.key, f.type === 'number' ? Number(e.target.value) : e.target.value as any)}
                    style={inputStyle} />
                </div>
              ))}
            </div>

            <div>
              <label style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.14em', color: 'var(--color-muted)', display: 'block', marginBottom: 6, fontFamily: 'var(--font-mono)' }}>DEADLINE</label>
              <input type="date" value={form.targetDate as string} onChange={e => set('targetDate', e.target.value as any)} style={inputStyle} />
            </div>

            {/* Horizon — monthly toggle */}
            <div>
              <label style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.14em', color: 'var(--color-muted)', display: 'block', marginBottom: 6, fontFamily: 'var(--font-mono)' }}>FREQUENTIE</label>
              <div style={{ display: 'flex', gap: 5 }}>
                {(['monthly', 'quarterly', 'annual'] as const).map(h => (
                  <button key={h} type="button" onClick={() => set('horizon', h)} style={{
                    padding: '4px 12px', borderRadius: 3, fontSize: 9, cursor: 'pointer', fontWeight: 700,
                    fontFamily: 'var(--font-mono)', letterSpacing: '0.1em',
                    background: form.horizon === h ? `${cfg.color}20` : 'transparent',
                    border: `1px solid ${form.horizon === h ? cfg.color : 'var(--color-border)'}`,
                    color: form.horizon === h ? cfg.color : 'var(--color-subtle)', transition: 'all 100ms',
                  }}>
                    {h === 'monthly' ? 'MAANDELIJKS' : h === 'quarterly' ? 'KWARTAAL' : 'JAARLIJKS'}
                  </button>
                ))}
              </div>
              {form.horizon === 'monthly' && (
                <div style={{ marginTop: 8, fontSize: 9, color: 'var(--color-muted)', fontFamily: 'var(--font-mono)', letterSpacing: '0.06em', display: 'flex', alignItems: 'center', gap: 5 }}>
                  <RotateCcw size={9} />
                  Wordt elke maand automatisch gereset
                </div>
              )}
            </div>

            {/* Monthly history */}
            {monthHistory.length > 0 && (
              <div>
                <label style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.14em', color: 'var(--color-muted)', display: 'block', marginBottom: 8, fontFamily: 'var(--font-mono)' }}>MAANDHISTORIE</label>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {monthHistory.slice().reverse().map(r => {
                    const hitTarget = r.value >= goal.targetNumber
                    return (
                      <div key={r.month} style={{
                        padding: '5px 10px', borderRadius: 4,
                        background: hitTarget ? `${cfg.color}18` : 'var(--color-surface)',
                        border: `1px solid ${hitTarget ? cfg.color + '40' : 'var(--color-border)'}`,
                      }}>
                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--color-subtle)', letterSpacing: '0.08em' }}>
                          {format(parseISO(r.month + '-01'), 'MMM yy', { locale: nlBE }).toUpperCase()}
                        </div>
                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 700, color: hitTarget ? cfg.color : 'var(--color-ink)', marginTop: 2 }}>
                          {r.value}<span style={{ fontSize: 8, opacity: 0.6, marginLeft: 3 }}>{goal.unit}</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            <div>
              <label style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.14em', color: 'var(--color-muted)', display: 'block', marginBottom: 6, fontFamily: 'var(--font-mono)' }}>WAAROM</label>
              <textarea value={form.whyItMatters} onChange={e => set('whyItMatters', e.target.value)} rows={2}
                style={{ ...inputStyle, resize: 'none', lineHeight: 1.6 }} />
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <button type="submit" style={{
                flex: 1, padding: '12px', borderRadius: 4, border: `1px solid ${cfg.color}60`,
                cursor: 'pointer', fontSize: 11, fontWeight: 800,
                fontFamily: 'var(--font-mono)', letterSpacing: '0.14em',
                background: `${cfg.color}15`, color: cfg.color,
              }}>SAVE</button>
              <button type="button" onClick={() => { onDelete(); onClose() }} style={{
                padding: '12px 16px', borderRadius: 4, border: '1px solid var(--color-border)',
                cursor: 'pointer', fontSize: 11, fontWeight: 800,
                fontFamily: 'var(--font-mono)', letterSpacing: '0.14em',
                background: 'transparent', color: 'var(--color-muted)',
              }}>DELETE</button>
            </div>
          </form>
        </div>
      </div>
    </>
  )
}

// ─── Goal circle card ─────────────────────────────────────────────
function GoalCircle({ goal, index, onUpdate, onDelete }: {
  goal: Goal; index: number
  onUpdate: (u: Partial<Goal>) => void
  onDelete: () => void
}) {
  const [editOpen, setEditOpen] = useState(false)
  const [hovered, setHovered] = useState(false)

  const cat = CAT[goal.category] ?? CAT.revenue
  const p   = pct(goal)
  const st  = status(goal)
  const stColor = STATUS_COLOR[st]
  const days = goal.targetDate ? daysLeft(goal.targetDate) : null

  const fillColor = p >= 100 ? '#4C6481' : st === 'NO-GO' ? '#7C7F84' : '#4C6481'
  const r = 44
  const cx = 50, cy = 50
  const diameter = r * 2
  const fillH = (p / 100) * diameter
  const fillY = cy + r - fillH
  const clipId = `clip-${goal.id.replace(/[^a-z0-9]/gi, '')}`

  return (
    <>
      {editOpen && (
        <EditGoalModal
          goal={goal}
          onClose={() => setEditOpen(false)}
          onSave={u => { onUpdate(u); setEditOpen(false) }}
          onDelete={onDelete}
        />
      )}
      <div
        onClick={() => setEditOpen(true)}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          cursor: 'pointer',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          width: 128,
          padding: '16px 8px 12px',
          borderRadius: 10,
          background: hovered ? 'var(--color-surface)' : 'transparent',
          transition: 'background 120ms',
          animationDelay: `${index * 40}ms`,
          animation: 'fadeSlideIn 300ms ease both',
          position: 'relative',
        }}
      >
        {/* SVG circle */}
        <svg width="108" height="108" viewBox="0 0 100 100" style={{ overflow: 'visible' }}>
          <defs>
            <clipPath id={clipId}>
              <circle cx={cx} cy={cy} r={r} />
            </clipPath>
          </defs>
          {/* Background fill */}
          <circle cx={cx} cy={cy} r={r} fill="var(--color-border)" opacity="0.5" />
          {/* Liquid fill from bottom */}
          {p > 0 && (
            <rect
              x={cx - r} y={fillY}
              width={diameter} height={fillH}
              fill={fillColor} opacity="0.82"
              clipPath={`url(#${clipId})`}
            />
          )}
          {/* Slight wave on fill top */}
          {p > 3 && p < 97 && (
            <ellipse
              cx={cx} cy={fillY}
              rx={r} ry={3}
              fill={fillColor} opacity="0.5"
              clipPath={`url(#${clipId})`}
            />
          )}
          {/* Circle border */}
          <circle cx={cx} cy={cy} r={r} fill="none" stroke={fillColor} strokeWidth="1.5" opacity="0.7" />
          {/* % text */}
          <text
            x={cx} y={p > 55 ? cy - 2 : cy + 4}
            textAnchor="middle" dominantBaseline="middle"
            fontSize={p >= 100 ? 13 : 17}
            fontWeight="800"
            fontFamily='var(--font-mono)'
            fill={p > 55 ? 'white' : fillColor}
            opacity={p > 55 ? 1 : 0.9}
          >
            {p}%
          </text>
          {/* Numbers below % */}
          <text
            x={cx} y={p > 55 ? cy + 13 : cy + 18}
            textAnchor="middle"
            fontSize="6"
            fontFamily='var(--font-mono)'
            fill={p > 55 ? 'rgba(255,255,255,0.65)' : 'var(--color-muted)'}
          >
            {goal.currentNumber.toLocaleString('nl-BE')} / {goal.targetNumber.toLocaleString('nl-BE')}
          </text>
        </svg>

        {/* Monthly badge */}
        {goal.horizon === 'monthly' && (
          <div style={{
            marginTop: 8, fontSize: 7, fontWeight: 700, letterSpacing: '0.12em',
            color: 'var(--color-muted)', fontFamily: 'var(--font-mono)',
            display: 'flex', alignItems: 'center', gap: 3,
          }}>
            <RotateCcw size={7} /> MAANDELIJKS
          </div>
        )}

        {/* Title */}
        <div style={{
          marginTop: goal.horizon === 'monthly' ? 4 : 10,
          fontSize: 10,
          fontWeight: 700,
          color: 'var(--color-ink)',
          textAlign: 'center',
          lineHeight: 1.3,
          maxWidth: 112,
          overflow: 'hidden',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          letterSpacing: '0.01em',
        }}>
          {goal.title}
        </div>

        {/* Category */}
        <div style={{ marginTop: 4, fontSize: 7, color: 'var(--color-subtle)', fontWeight: 700, letterSpacing: '0.12em', fontFamily: 'var(--font-mono)' }}>
          {cat.label}
        </div>

        {/* Deadline + status */}
        <div style={{ marginTop: 5, display: 'flex', alignItems: 'center', gap: 6 }}>
          {days !== null && (
            <span style={{
              fontSize: 7, fontFamily: 'var(--font-mono)',
              color: days < 0 ? 'var(--color-subtle)' : days <= 30 ? '#4C6481' : 'var(--color-muted)',
            }}>
              {days < 0 ? `−${Math.abs(days)}d` : `${days}d`}
            </span>
          )}
          <span style={{
            fontSize: 7, fontWeight: 800, letterSpacing: '0.1em',
            color: stColor, fontFamily: 'var(--font-mono)',
          }}>{st}</span>
        </div>

        {hovered && <Pencil size={9} style={{ position: 'absolute', top: 10, right: 10, color: 'var(--color-subtle)' }} />}
      </div>
    </>
  )
}

// ─── Add Modal ────────────────────────────────────────────────────
const EMPTY: Omit<Goal, 'id'> = {
  title: '', area: 'business', category: 'revenue', icon: '', color: '#7A9E8A',
  unit: '', horizon: 'annual', targetNumber: 100, currentNumber: 0,
  status: 'active', whyItMatters: '', milestones: [], xpReward: 200,
}

function AddGoalModal({ onClose, onAdd }: { onClose: () => void; onAdd: (g: Omit<Goal,'id'>) => void }) {
  const [form, setForm] = useState({ ...EMPTY, targetDate: '' })
  const set = <K extends keyof typeof form>(k: K, v: typeof form[K]) => setForm(p => ({ ...p, [k]: v }))
  const cfg = CAT[form.category]

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.title.trim() || !form.targetNumber || !form.unit) return
    onAdd({
      ...form,
      color: cfg.color,
      area: cfg.group === 'investments' ? 'finance'
        : cfg.group === 'personal'
          ? (form.category === 'health' ? 'health' : form.category === 'relationships' ? 'relationships' : 'lifestyle')
          : 'business',
      targetDate: (form.targetDate as string) || undefined,
      milestones: [],
    })
    onClose()
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', boxSizing: 'border-box',
    background: 'var(--color-surface)',
    border: '1px solid var(--color-border)',
    borderRadius: 4, padding: '10px 14px',
    color: 'var(--color-ink)', fontSize: 13,
    fontFamily: 'var(--font-mono)',
    outline: 'none', letterSpacing: '0.02em',
  }

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 40, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }} />
      <div style={{
        position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
        zIndex: 50, width: 460, maxHeight: '90vh', overflowY: 'auto',
        background: 'var(--color-card)', border: '1px solid var(--color-border)',
        borderRadius: 8, boxShadow: '0 32px 80px rgba(0,0,0,0.8)',
      }}>
        {/* Top accent */}
        <div style={{ height: 2, background: cfg.color, transition: 'background 200ms' }} />

        <div style={{ padding: '24px 24px 28px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.14em', color: cfg.color, fontFamily: 'var(--font-mono)' }}>NEW OBJECTIVE</span>
            <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-muted)' }}><X size={15} /></button>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--color-muted)', display: 'block', marginBottom: 6, fontFamily: 'var(--font-mono)' }}>CATEGORIE</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                {(Object.entries(CAT) as [GoalCategory, typeof CAT[GoalCategory]][]).map(([key, c]) => (
                  <button key={key} type="button" onClick={() => set('category', key)} style={{
                    padding: '4px 10px', borderRadius: 3, fontSize: 9, cursor: 'pointer', fontWeight: 700,
                    fontFamily: 'var(--font-mono)', letterSpacing: '0.1em',
                    background: form.category === key ? `${c.color}20` : 'transparent',
                    border: `1px solid ${form.category === key ? c.color : 'var(--color-border)'}`,
                    color: form.category === key ? c.color : 'var(--color-muted)',
                    transition: 'all 100ms',
                  }}>{c.label}</button>
                ))}
              </div>
            </div>

            <div>
              <label style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.14em', color: 'var(--color-muted)', display: 'block', marginBottom: 6, fontFamily: 'var(--font-mono)' }}>OBJECTIVE</label>
              <input required value={form.title} onChange={e => set('title', e.target.value)} placeholder="bv. €200k omzet behalen" style={inputStyle} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 0.6fr', gap: 10 }}>
              {[
                { label: 'TARGET', key: 'targetNumber' as const, type: 'number', ph: '200000' },
                { label: 'CURRENT', key: 'currentNumber' as const, type: 'number', ph: '0' },
                { label: 'UNIT', key: 'unit' as const, type: 'text', ph: '€' },
              ].map(f => (
                <div key={f.key}>
                  <label style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.14em', color: 'var(--color-muted)', display: 'block', marginBottom: 6, fontFamily: 'var(--font-mono)' }}>{f.label}</label>
                  <input required={f.key !== 'currentNumber'} type={f.type}
                    value={String(form[f.key])}
                    onChange={e => set(f.key, f.type === 'number' ? Number(e.target.value) : e.target.value as any)}
                    placeholder={f.ph} style={inputStyle} />
                </div>
              ))}
            </div>

            <div>
              <label style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.14em', color: 'var(--color-muted)', display: 'block', marginBottom: 6, fontFamily: 'var(--font-mono)' }}>DEADLINE</label>
              <input type="date" value={form.targetDate as string} onChange={e => set('targetDate', e.target.value as any)} style={inputStyle} />
            </div>

            <button type="submit" style={{
              padding: '12px', borderRadius: 4, border: `1px solid ${cfg.color}60`,
              cursor: 'pointer', fontSize: 11, fontWeight: 800,
              fontFamily: 'var(--font-mono)', letterSpacing: '0.14em',
              background: `${cfg.color}15`, color: cfg.color,
              transition: 'all 150ms', marginTop: 4,
            }}>
              + ADD OBJECTIVE
            </button>
          </form>
        </div>
      </div>
    </>
  )
}

// ─── Main ─────────────────────────────────────────────────────────
export function YearlyPlanner() {
  const { goals, addGoal, updateGoal, deleteGoal } = usePlannerStore()
  const { lastResetMonth, markReset } = useMonthlyResetStore()
  const [showAdd, setShowAdd] = useState(false)
  const [filter, setFilter]   = useState<'ALL'|'GO'|'WATCH'|'NO-GO'>('ALL')

  // Auto-reset monthly goals when a new month begins
  // Runs on every render but only acts when month has actually changed
  useEffect(() => {
    const currentMonth = format(new Date(), 'yyyy-MM')
    goals.forEach(g => {
      if (g.horizon !== 'monthly') return
      const last = useMonthlyResetStore.getState().lastResetMonth[g.id]
      if (last === currentMonth) return
      if (last !== undefined) {
        // Month changed — archive previous value and reset
        markReset(g.id, last, g.currentNumber)
        updateGoal(g.id, { currentNumber: 0 })
      } else {
        // First time — register this month, no reset
        markReset(g.id, currentMonth, 0)
      }
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // runs once on mount; store reads are always fresh via getState()

  const active    = goals.filter(g => g.status !== 'complete')
  const completed = goals.filter(g => pct(g) >= 100)

  const sortGoals = (list: Goal[]) => [...list].sort((a, b) => {
    const order = { 'NO-GO': 0, 'WATCH': 1, 'GO': 2, 'DONE': 3 }
    const diff = order[status(a)] - order[status(b)]
    if (diff !== 0) return diff
    if (a.targetDate && b.targetDate) return a.targetDate.localeCompare(b.targetDate)
    return 0
  })

  const byGroup = useMemo(() => {
    const map: Record<GoalGroup, Goal[]> = { professional: [], investments: [], personal: [] }
    for (const g of active) {
      const grp = CAT[g.category]?.group ?? 'personal'
      map[grp].push(g)
    }
    for (const grp of GROUP_ORDER) map[grp] = sortGoals(map[grp])
    return map
  }, [goals])

  const filtered = filter === 'ALL'
    ? null  // show grouped view
    : sortGoals(active).filter(g => status(g) === filter)

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', width: '100%' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600;700;800&display=swap');
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* Header */}
      <div className="anim-fade-up" style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 16 }}>
          <h1 style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--color-ink)', margin: 0 }}>Goals {YEAR}</h1>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--color-subtle)', letterSpacing: '0.08em' }}>
            {Math.round(todayPos())}% YTD
          </span>
        </div>
        <button onClick={() => setShowAdd(true)} style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '7px 16px', borderRadius: 4,
          border: '1px solid var(--color-border)',
          cursor: 'pointer', fontSize: 9, fontWeight: 800,
          fontFamily: 'var(--font-mono)', letterSpacing: '0.12em',
          background: 'var(--color-surface)', color: 'var(--color-ink)',
        }}>
          <Plus size={10} /> NEW OBJECTIVE
        </button>
      </div>

      {/* Top stats — 3 columns, one per group */}
      <div className="anim-fade-up" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 24 }}>
        {GROUP_ORDER.map(grp => {
          const gc = GROUP_CONFIG[grp]
          const gs = byGroup[grp]
          const avg = gs.length ? Math.round(gs.reduce((s, g) => s + pct(g), 0) / gs.length) : 0
          const ng  = gs.filter(g => status(g) === 'NO-GO').length
          return (
            <div key={grp} style={{
              padding: '16px 20px', borderRadius: 8,
              background: 'var(--color-card)',
              border: `1px solid var(--color-border)`,
              borderTop: `3px solid ${gc.accent}`,
            }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, fontWeight: 800, letterSpacing: '0.16em', color: gc.accent, marginBottom: 10 }}>{gc.label}</div>
              <div style={{ display: 'flex', gap: 20 }}>
                <div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 22, fontWeight: 800, color: 'var(--color-ink)', letterSpacing: '-0.04em', lineHeight: 1 }}>{gs.length}</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 7, color: 'var(--color-subtle)', marginTop: 4, letterSpacing: '0.12em' }}>GOALS</div>
                </div>
                <div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 22, fontWeight: 800, color: avg > 60 ? gc.accent : avg > 30 ? gc.accent : 'var(--color-muted)', letterSpacing: '-0.04em', lineHeight: 1 }}>{avg}%</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 7, color: 'var(--color-subtle)', marginTop: 4, letterSpacing: '0.12em' }}>GEM.</div>
                </div>
                {ng > 0 && (
                  <div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 22, fontWeight: 800, color: 'var(--color-muted)', letterSpacing: '-0.04em', lineHeight: 1 }}>{ng}</div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 7, color: 'var(--color-subtle)', marginTop: 4, letterSpacing: '0.12em' }}>NO-GO</div>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Year rail */}
      <div className="anim-fade-up" style={{ marginBottom: 28, padding: '14px 20px', background: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: 8 }}>
        <div style={{ display: 'flex', marginBottom: 6 }}>
          {['Jan','Feb','Mrt','Apr','Mei','Jun','Jul','Aug','Sep','Okt','Nov','Dec'].map(m => (
            <div key={m} style={{ flex: 1, fontFamily: 'var(--font-mono)', fontSize: 7, color: 'var(--color-subtle)', letterSpacing: '0.06em', textAlign: 'center' }}>{m}</div>
          ))}
        </div>
        <div style={{ position: 'relative', height: 4, background: 'var(--color-border)' }}>
          <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${todayPos()}%`, background: 'var(--color-subtle)' }} />
          {active.filter(g => g.targetDate).map(g => {
            const p = Math.max(0, Math.min(100, differenceInDays(parseISO(g.targetDate!), YEAR_START) / TOTAL_DAYS * 100))
            return (
              <div key={g.id} title={`${g.title} (${status(g)})`} style={{
                position: 'absolute', left: `${p}%`, top: -3, bottom: -3,
                width: 2, background: STATUS_COLOR[status(g)],
                transform: 'translateX(-50%)', opacity: 0.9,
              }} />
            )
          })}
          <div style={{ position: 'absolute', left: `${todayPos()}%`, top: -8, bottom: -8, width: 2, background: 'var(--color-ink)', transform: 'translateX(-50%)' }}>
            <div style={{ position: 'absolute', top: -13, left: '50%', transform: 'translateX(-50%)', fontFamily: 'var(--font-mono)', fontSize: 6, color: 'var(--color-ink)', letterSpacing: '0.08em', whiteSpace: 'nowrap' }}>NOW</div>
          </div>
        </div>
      </div>

      {/* Status filter */}
      <div className="anim-fade-up" style={{ display: 'flex', gap: 6, marginBottom: 20 }}>
        {(['ALL', 'GO', 'WATCH', 'NO-GO'] as const).map(f => {
          const isActive = filter === f
          return (
            <button key={f} onClick={() => setFilter(f)} style={{
              padding: '5px 12px', borderRadius: 3,
              border: `1px solid ${isActive ? '#4C6481' : 'var(--color-border)'}`,
              cursor: 'pointer', fontSize: 9, fontWeight: 800,
              fontFamily: 'var(--font-mono)', letterSpacing: '0.12em',
              background: isActive ? 'rgba(76,100,129,0.12)' : 'transparent',
              color: isActive ? '#4C6481' : 'var(--color-subtle)',
              transition: 'all 120ms',
            }}>{f}</button>
          )
        })}
      </div>

      {/* Filtered view (single flat list of circles) */}
      {filtered !== null && (
        <div style={{ marginBottom: 24 }}>
          {filtered.length === 0
            ? <div style={{ padding: '32px 24px', textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--color-subtle)', letterSpacing: '0.1em' }}>NO OBJECTIVES FOUND</div>
            : (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, padding: '16px' }}>
                {filtered.map((g, i) => <GoalCircle key={g.id} goal={g} index={i} onUpdate={u => updateGoal(g.id, u)} onDelete={() => deleteGoal(g.id)} />)}
              </div>
            )
          }
        </div>
      )}

      {/* Grouped view */}
      {filtered === null && GROUP_ORDER.map((grp) => {
        const gc = GROUP_CONFIG[grp]
        const gs = byGroup[grp]
        if (gs.length === 0) return null
        return (
          <div key={grp} style={{ marginBottom: 28 }}>
            {/* Group header */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '10px 24px',
              background: gc.dim,
              borderLeft: `3px solid ${gc.accent}`,
              border: `1px solid var(--color-border)`,
              borderRadius: '8px 8px 0 0',
            }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, fontWeight: 800, letterSpacing: '0.18em', color: gc.accent }}>{gc.label}</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--color-subtle)', letterSpacing: '0.08em' }}>{gs.length} OBJECTIVES</span>
            </div>
            {/* Circle grid */}
            <div style={{
              border: `1px solid var(--color-border)`, borderTop: 'none',
              borderRadius: '0 0 8px 8px',
              padding: '16px 16px 8px',
              display: 'flex', flexWrap: 'wrap', gap: 4,
            }}>
              {gs.map((g, i) => <GoalCircle key={g.id} goal={g} index={i} onUpdate={u => updateGoal(g.id, u)} onDelete={() => deleteGoal(g.id)} />)}
            </div>
          </div>
        )
      })}

      {/* Completed */}
      {completed.length > 0 && (
        <div style={{ marginTop: 8, opacity: 0.45 }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 7, letterSpacing: '0.16em', color: '#4C6481', marginBottom: 6, paddingLeft: 4 }}>✓ COMPLETED ({completed.length})</div>
          <div style={{ border: '1px solid var(--color-border)', borderRadius: 8, padding: '16px 16px 8px', display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {completed.map((g, i) => <GoalCircle key={g.id} goal={g} index={i} onUpdate={u => updateGoal(g.id, u)} onDelete={() => deleteGoal(g.id)} />)}
          </div>
        </div>
      )}

      {showAdd && <AddGoalModal onClose={() => setShowAdd(false)} onAdd={addGoal} />}
    </div>
  )
}
