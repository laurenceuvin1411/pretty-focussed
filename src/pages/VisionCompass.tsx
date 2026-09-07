import { useState } from 'react'
import { format } from 'date-fns'
import { nlBE } from 'date-fns/locale'
import { useVisionStore } from '../store/visionStore'
import { useFinanceStore } from '../store/financeStore'
import { getTodaysPrinciple, principles } from '../data/philosophyPrinciples'
import { Check, Shield, Brain, Target, Zap, Clock } from 'lucide-react'

// ── Editable field ──────────────────────────────────────────────────────────
function EditableText({
  value, onSave, multiline = false, placeholder = '', style = {}
}: {
  value: string; onSave: (v: string) => void; multiline?: boolean
  placeholder?: string; style?: React.CSSProperties
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value)

  if (editing) {
    const props = {
      value: draft,
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setDraft(e.target.value),
      onBlur: () => { onSave(draft); setEditing(false) },
      onKeyDown: (e: React.KeyboardEvent) => { if (!multiline && e.key === 'Enter') { onSave(draft); setEditing(false) } if (e.key === 'Escape') { setDraft(value); setEditing(false) } },
      autoFocus: true,
      style: {
        width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(212,169,106,0.4)',
        borderRadius: 16, padding: '10px 14px', color: 'var(--color-ink)', fontSize: 'inherit',
        fontFamily: 'inherit', fontWeight: 'inherit', letterSpacing: 'inherit', lineHeight: 'inherit',
        outline: 'none', resize: 'vertical' as const, ...style,
      }
    }
    return multiline
      ? <textarea rows={4} {...props} />
      : <input {...props} />
  }
  return (
    <div onClick={() => { setDraft(value); setEditing(true) }}
      style={{ cursor: 'text', ...style }}
      title="Click to edit">
      {value || <span style={{ color: 'var(--color-subtle)', fontStyle: 'italic' }}>{placeholder}</span>}
    </div>
  )
}

// ── Editable Tag List ───────────────────────────────────────────────────────
function EditableList({
  items, onSave, color = 'var(--color-accent)', label = 'Add item'
}: {
  items: string[]; onSave: (items: string[]) => void; color?: string; label?: string
}) {
  const [adding, setAdding] = useState(false)
  const [newItem, setNewItem] = useState('')
  const [editing, setEditing] = useState<number | null>(null)
  const [editVal, setEditVal] = useState('')

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
      {items.map((item, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 20, background: 'rgba(255,255,255,0.07)', border: `1px solid ${color}33`, cursor: 'pointer' }}
          onClick={() => { setEditing(i); setEditVal(item) }}>
          {editing === i
            ? <input value={editVal} onChange={e => setEditVal(e.target.value)}
                onBlur={() => { const n = [...items]; n[i] = editVal; onSave(n); setEditing(null) }}
                onKeyDown={e => { if (e.key === 'Enter') { const n = [...items]; n[i] = editVal; onSave(n); setEditing(null) } if (e.key === 'Escape') setEditing(null) }}
                autoFocus style={{ background: 'none', border: 'none', outline: 'none', color: 'var(--color-ink)', fontSize: 12, width: Math.max(80, editVal.length * 8) }} />
            : <span style={{ fontSize: 12, color: 'var(--color-ink)' }}>{item}</span>
          }
          <button onClick={e => { e.stopPropagation(); onSave(items.filter((_, j) => j !== i)) }}
            style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: 'var(--color-subtle)', lineHeight: 1, fontSize: 14, display: 'flex', alignItems: 'center' }}>×</button>
        </div>
      ))}
      {adding
        ? <input value={newItem} onChange={e => setNewItem(e.target.value)} placeholder={label}
            onBlur={() => { if (newItem.trim()) onSave([...items, newItem.trim()]); setNewItem(''); setAdding(false) }}
            onKeyDown={e => { if (e.key === 'Enter' && newItem.trim()) { onSave([...items, newItem.trim()]); setNewItem(''); setAdding(false) } if (e.key === 'Escape') { setAdding(false); setNewItem('') } }}
            autoFocus style={{ padding: '6px 12px', borderRadius: 20, background: 'rgba(255,255,255,0.06)', border: `1px solid ${color}66`, outline: 'none', color: 'var(--color-ink)', fontSize: 12, width: 160 }} />
        : <button onClick={() => setAdding(true)} style={{ padding: '6px 12px', borderRadius: 20, background: 'transparent', border: `1px dashed ${color}55`, color: 'var(--color-subtle)', fontSize: 11, cursor: 'pointer', letterSpacing: '0.04em' }}>+ {label}</button>
      }
    </div>
  )
}

// ── Hedgehog SVG ────────────────────────────────────────────────────────────
function HedgehogDiagram() {
  const [active, setActive] = useState<null | 'love' | 'best' | 'economics'>(null)
  const circles = [
    { id: 'love' as const, label: 'What you LOVE', cx: 160, cy: 120, color: '#C4935A' },
    { id: 'best' as const, label: 'What you\'re BEST at', cx: 280, cy: 120, color: '#7AACCF' },
    { id: 'economics' as const, label: 'What DRIVES economics', cx: 220, cy: 230, color: '#6DB889' },
  ]
  return (
    <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <svg width={440} height={340} viewBox="0 0 440 340" style={{ overflow: 'visible' }}>
        <defs>
          {circles.map(c => (
            <radialGradient key={c.id} id={`hg-${c.id}`} cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor={c.color} stopOpacity="0.18" />
              <stop offset="100%" stopColor={c.color} stopOpacity="0.04" />
            </radialGradient>
          ))}
        </defs>
        {circles.map(c => (
          <circle key={c.id} cx={c.cx} cy={c.cy} r={100}
            fill={`url(#hg-${c.id})`}
            stroke={active === c.id ? c.color : `${c.color}55`}
            strokeWidth={active === c.id ? 1.5 : 1}
            style={{ cursor: 'pointer', transition: 'all 0.2s' }}
            onMouseEnter={() => setActive(c.id)} onMouseLeave={() => setActive(null)} />
        ))}
        {/* Labels */}
        <text x="95" y="72" textAnchor="middle" fill="#C4935A" fontSize={11} fontWeight={600} letterSpacing="0.08em" style={{ textTransform: 'uppercase' }}>LOVE</text>
        <text x="345" y="72" textAnchor="middle" fill="#7AACCF" fontSize={11} fontWeight={600} letterSpacing="0.08em">BEST AT</text>
        <text x="220" y="316" textAnchor="middle" fill="#6DB889" fontSize={11} fontWeight={600} letterSpacing="0.08em">ECONOMICS</text>
        {/* Center: The Hedgehog */}
        <circle cx={220} cy={170} r={28} fill="rgba(212,169,106,0.15)" stroke="rgba(212,169,106,0.5)" strokeWidth={1} />
        <text x={220} y={167} textAnchor="middle" fill="var(--color-accent)" fontSize={9} fontWeight={600} letterSpacing="0.1em">YOUR</text>
        <text x={220} y={179} textAnchor="middle" fill="var(--color-accent)" fontSize={9} fontWeight={600} letterSpacing="0.1em">HEDGEHOG</text>
      </svg>
      <p style={{ fontSize: 10, color: 'var(--color-subtle)', textAlign: 'center', letterSpacing: '0.06em', marginTop: -8 }}>
        The intersection of all three is your competitive monopoly.
      </p>
    </div>
  )
}

// ── Compound projection ─────────────────────────────────────────────────────
function CompoundChart({ current, target, years = 5 }: { current: number; target: number; years?: number }) {
  const monthly = 2000 // assumed monthly savings
  const annualReturn = 0.08
  const points: { x: number; y: number; value: number }[] = []
  for (let m = 0; m <= years * 12; m++) {
    const val = current * Math.pow(1 + annualReturn / 12, m) + monthly * ((Math.pow(1 + annualReturn / 12, m) - 1) / (annualReturn / 12))
    points.push({ x: m / (years * 12) * 280, y: val, value: val })
  }
  const maxVal = Math.max(points[points.length - 1].value, target)
  const scaled = points.map(p => ({ ...p, y: 80 - (p.value / maxVal) * 72 }))
  const pathD = scaled.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')
  const targetY = 80 - (target / maxVal) * 72

  return (
    <div>
      <svg width={280} height={90} viewBox="0 0 280 90" style={{ overflow: 'visible' }}>
        <defs>
          <linearGradient id="comp-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#6DB889" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#6DB889" stopOpacity="0" />
          </linearGradient>
        </defs>
        {/* Target line */}
        <line x1={0} y1={targetY} x2={280} y2={targetY} stroke="rgba(212,169,106,0.4)" strokeWidth={1} strokeDasharray="4 3" />
        <text x={285} y={targetY + 4} fill="var(--color-accent)" fontSize={9}>€{(target / 1000).toFixed(0)}k</text>
        {/* Area fill */}
        <path d={`${pathD} L ${scaled[scaled.length - 1].x} 80 L 0 80 Z`} fill="url(#comp-fill)" />
        {/* Line */}
        <path d={pathD} fill="none" stroke="#6DB889" strokeWidth={2} strokeLinecap="round" />
        {/* Current dot */}
        <circle cx={0} cy={scaled[0].y} r={3} fill="#6DB889" />
      </svg>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
        <span style={{ fontSize: 10, color: 'var(--color-subtle)' }}>Now</span>
        <span style={{ fontSize: 10, color: 'var(--color-subtle)' }}>{years}y</span>
      </div>
    </div>
  )
}

// ── Section header ──────────────────────────────────────────────────────────
function SectionHeader({ label, sub, accent }: { label: string; sub?: string; accent?: string }) {
  return (
    <div style={{ marginBottom: 28 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
        {accent && <div style={{ width: 3, height: 18, borderRadius: 2, background: accent }} />}
        <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--color-subtle)' }}>{label}</span>
      </div>
      {sub && <p style={{ fontSize: 12, color: 'var(--color-muted)', paddingLeft: accent ? 13 : 0 }}>{sub}</p>}
    </div>
  )
}

// ── Main component ──────────────────────────────────────────────────────────
export function VisionCompass() {
  const v = useVisionStore()
  const { getNetWorth } = useFinanceStore()
  const today = format(new Date(), "EEEE · d MMMM yyyy", { locale: nlBE })
  const principle = getTodaysPrinciple()
  const netWorth = getNetWorth()
  const [activeTab, setActiveTab] = useState<'north-star' | 'hedgehog' | 'identity' | 'wealth' | 'horizon'>('north-star')

  const tabs = [
    { id: 'north-star' as const, label: 'North Star' },
    { id: 'hedgehog' as const, label: 'Hedgehog' },
    { id: 'identity' as const, label: 'Identity' },
    { id: 'wealth' as const, label: 'Wealth Engine' },
    { id: 'horizon' as const, label: 'Time Horizon' },
  ]

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto' }}>

      {/* ── Header ── */}
      <div className="anim-fade-up" style={{ marginBottom: 56, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: 32, fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1, color: 'var(--color-ink)' }}>
            Your Operating<br />Instructions.
          </h1>
          <p style={{ fontSize: 14, color: 'var(--color-muted)', marginTop: 20, maxWidth: 480, lineHeight: 1.7, letterSpacing: '-0.01em' }}>
            A living document of who you are, where you're going, and what you're building.
            Return here whenever you feel lost. Everything connects back to this.
          </p>
        </div>

        {/* Annual word */}
        <div style={{ textAlign: 'right' }}>
          <p style={{ fontSize: 9, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--color-subtle)', marginBottom: 12 }}>
            {new Date().getFullYear()} · Word of the year
          </p>
          <div style={{ display: 'inline-block', padding: '12px 28px', borderRadius: 16, border: '1px solid rgba(212,169,106,0.35)', background: 'rgba(212,169,106,0.08)' }}>
            <EditableText value={v.annualWord} onSave={val => v.update({ annualWord: val })}
              style={{ fontSize: 32, fontWeight: 600, color: 'var(--color-accent)', letterSpacing: '-0.03em' }} />
          </div>
        </div>
      </div>

      {/* ── Today's principle ── */}
      <div className="anim-fade-up" style={{ marginBottom: 40, padding: '28px 40px', borderRadius: 20, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -60, right: -60, width: 200, height: 200, borderRadius: '50%', background: 'rgba(122,172,207,0.06)', filter: 'blur(40px)' }} />
        <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>
          <span style={{ fontSize: 64, lineHeight: 1, color: 'rgba(122,172,207,0.25)', fontFamily: 'Georgia, serif', marginTop: -8, flexShrink: 0 }}>"</span>
          <div>
            <p style={{ fontSize: 16, lineHeight: 1.7, color: 'var(--color-ink)', letterSpacing: '-0.01em', marginBottom: 14 }}>{principle.quote}</p>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-accent)' }}>{principle.author}</span>
              <span style={{ width: 1, height: 12, background: 'var(--color-border)' }} />
              <span style={{ fontSize: 11, color: 'var(--color-subtle)', fontStyle: 'italic' }}>{principle.book}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="anim-fade-up" style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', gap: 4, padding: 4, borderRadius: 14, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', width: 'fit-content' }}>
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '10px 20px', borderRadius: 16, border: 'none', cursor: 'pointer',
                fontSize: 12, fontWeight: 500, letterSpacing: '0.01em', transition: 'all 0.15s',
                background: activeTab === tab.id ? 'rgba(255,255,255,0.1)' : 'transparent',
                color: activeTab === tab.id ? 'var(--color-ink)' : 'var(--color-subtle)',
              }}>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Tab: North Star ── */}
      {activeTab === 'north-star' && (
        <div className="anim-fade-up" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          {/* Life vision */}
          <div className="card" style={{ padding: '40px', gridColumn: '1 / -1' }}>
            <SectionHeader label="Life Vision" sub="The vivid picture of your ideal life. Write it in present tense as if it's already true." accent="var(--color-accent)" />
            <EditableText value={v.lifeVision} onSave={val => v.update({ lifeVision: val })} multiline placeholder="Write your life vision here..." style={{ fontSize: 16, lineHeight: 1.8, color: 'var(--color-ink)', letterSpacing: '-0.01em' }} />
          </div>

          {/* Core WHY */}
          <div className="card" style={{ padding: '36px 40px' }}>
            <SectionHeader label="Your Core WHY" sub="He who has a why can bear almost any how.: Frankl" accent="#6DB889" />
            <EditableText value={v.coreWhy} onSave={val => v.update({ coreWhy: val })} multiline placeholder="Why does any of this matter to you?" style={{ fontSize: 14, lineHeight: 1.8, color: 'var(--color-ink)' }} />
          </div>

          {/* Current project: anti-resistance */}
          <div className="card" style={{ padding: '36px 40px' }}>
            <SectionHeader label="What You're Shipping" sub="The War of Art: Amateurs wait for inspiration. Professionals ship." accent="#C4935A" />
            <EditableText value={v.currentProject} onSave={val => v.update({ currentProject: val })} placeholder="The one creative project you're currently shipping..." style={{ fontSize: 14, lineHeight: 1.8, color: 'var(--color-ink)', marginBottom: 24 }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 20px', borderRadius: 12, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: v.resistanceCheckedToday ? 'rgba(109,184,137,0.2)' : 'rgba(196,136,78,0.2)', border: `1px solid ${v.resistanceCheckedToday ? '#6DB889' : '#C4935A'}55`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {v.resistanceCheckedToday ? <Check size={14} style={{ color: '#6DB889' }} /> : <Shield size={14} style={{ color: '#C4935A' }} />}
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 12, fontWeight: 500, color: 'var(--color-ink)', marginBottom: 2 }}>
                  {v.resistanceCheckedToday ? 'Resistance defeated today.' : 'Have you done the work today?'}
                </p>
                <p style={{ fontSize: 11, color: 'var(--color-subtle)' }}>Turning pro means showing up regardless of how you feel.</p>
              </div>
              {!v.resistanceCheckedToday && (
                <button onClick={v.checkResistance} style={{ padding: '8px 16px', borderRadius: 16, background: 'rgba(196,136,78,0.2)', border: '1px solid rgba(196,136,78,0.4)', color: '#C4935A', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>
                  <Check size={11} style={{ marginRight: 4, display: 'inline' }} />Done
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Tab: Hedgehog ── */}
      {activeTab === 'hedgehog' && (
        <div className="anim-fade-up">
          <div className="card" style={{ padding: '40px', marginBottom: 20 }}>
            <div style={{ display: 'flex', gap: 48, alignItems: 'flex-start', flexWrap: 'wrap' }}>
              <div style={{ flexShrink: 0 }}>
                <SectionHeader label="The Hedgehog Concept" sub="Jim Collins: The one thing you can be best in the world at." accent="var(--color-accent)" />
                <HedgehogDiagram />
              </div>
              <div style={{ flex: 1, minWidth: 280, display: 'flex', flexDirection: 'column', gap: 32 }}>
                <div>
                  <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.16em', textTransform: 'uppercase', color: '#C4935A', marginBottom: 12 }}>What you love</p>
                  <EditableList items={v.whatILove} onSave={items => v.update({ whatILove: items })} color="#C4935A" label="Add passion" />
                </div>
                <div>
                  <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.16em', textTransform: 'uppercase', color: '#7AACCF', marginBottom: 12 }}>What you're best at</p>
                  <EditableList items={v.whatImBestAt} onSave={items => v.update({ whatImBestAt: items })} color="#7AACCF" label="Add strength" />
                </div>
                <div>
                  <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.16em', textTransform: 'uppercase', color: '#6DB889', marginBottom: 12 }}>What drives your economics</p>
                  <EditableList items={v.economicsEngine} onSave={items => v.update({ economicsEngine: items })} color="#6DB889" label="Add revenue driver" />
                </div>
              </div>
            </div>
          </div>

          {/* Naval's specific knowledge */}
          <div className="card" style={{ padding: '40px' }}>
            <SectionHeader label="Specific Knowledge" sub="Naval: Specific knowledge is what you cannot be trained for. It is your unfair advantage." accent="var(--color-brand-blue)" />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
              {v.specificKnowledge.map((k, i) => (
                <div key={i} style={{ padding: '16px 20px', borderRadius: 12, background: 'rgba(122,172,207,0.08)', border: '1px solid rgba(122,172,207,0.2)' }}>
                  <p style={{ fontSize: 13, color: 'var(--color-ink)', lineHeight: 1.5 }}>{k}</p>
                </div>
              ))}
            </div>
            <EditableList items={v.specificKnowledge} onSave={items => v.update({ specificKnowledge: items })} color="#7AACCF" label="Add knowledge area" />
          </div>
        </div>
      )}

      {/* ── Tab: Identity ── */}
      {activeTab === 'identity' && (
        <div className="anim-fade-up" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          <div className="card" style={{ padding: '40px', gridColumn: '1 / -1' }}>
            <SectionHeader label="Identity Architecture" sub="Atomic Habits: Every action is a vote for the type of person you're becoming. Who are you?" accent="var(--color-accent)" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 28 }}>
              {v.identityStatements.map((stmt, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '18px 24px', borderRadius: 14, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--color-accent)', flexShrink: 0 }} />
                  <p style={{ flex: 1, fontSize: 16, color: 'var(--color-ink)', fontWeight: 500, letterSpacing: '-0.01em' }}>{stmt}</p>
                  <button onClick={() => v.update({ identityStatements: v.identityStatements.filter((_, j) => j !== i) })}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-subtle)', fontSize: 18, padding: 0, lineHeight: 1 }}>×</button>
                </div>
              ))}
            </div>
            <EditableList items={[]} onSave={newItems => { if (newItems.length) v.update({ identityStatements: [...v.identityStatements, ...newItems] }) }} color="var(--color-accent)" label="Add identity statement" />
          </div>

          {/* The 40% rule */}
          <div className="card" style={{ padding: '36px 40px' }}>
            <SectionHeader label="The 40% Rule" sub="David Goggins: When you think you're done, you're only 40% done." accent="#C4935A" />
            <div style={{ marginTop: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                <span style={{ fontSize: 12, color: 'var(--color-muted)' }}>Perceived limit</span>
                <span style={{ fontSize: 12, fontWeight: 600, color: '#C4935A' }}>40%</span>
              </div>
              <div style={{ height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.08)', marginBottom: 24 }}>
                <div style={{ width: '40%', height: '100%', borderRadius: 3, background: '#C4935A', boxShadow: '0 0 10px rgba(196,136,78,0.4)' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                <span style={{ fontSize: 12, color: 'var(--color-muted)' }}>Real capacity</span>
                <span style={{ fontSize: 12, fontWeight: 600, color: '#6DB889' }}>100%</span>
              </div>
              <div style={{ height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.08)', marginBottom: 24 }}>
                <div style={{ width: '100%', height: '100%', borderRadius: 3, background: '#6DB889', boxShadow: '0 0 10px rgba(109,184,137,0.4)' }} />
              </div>
              <p style={{ fontSize: 12, color: 'var(--color-muted)', lineHeight: 1.7, fontStyle: 'italic' }}>
                "Most people give up right before the breakthrough. The last 60% is where champions are made."
              </p>
            </div>
          </div>

          {/* Observer self */}
          <div className="card" style={{ padding: '36px 40px' }}>
            <SectionHeader label="Daily Reflection" sub="Untethered Soul: You are not your thoughts. You are the observer." accent="#7AACCF" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {[
                { q: 'What am I resisting today?', color: '#C4935A' },
                { q: 'Am I voting for the right identity?', color: 'var(--color-accent)' },
                { q: 'What would the person I want to be do right now?', color: '#6DB889' },
                { q: 'Is this the highest use of my life force?', color: '#7AACCF' },
              ].map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 18px', borderRadius: 16, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                  <div style={{ width: 4, height: 4, borderRadius: '50%', background: item.color, flexShrink: 0 }} />
                  <p style={{ fontSize: 13, color: 'var(--color-ink)', fontStyle: 'italic', lineHeight: 1.5 }}>{item.q}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Tab: Wealth Engine ── */}
      {activeTab === 'wealth' && (
        <div className="anim-fade-up" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          {/* Naval's wealth equation */}
          <div className="card" style={{ padding: '40px', gridColumn: '1 / -1' }}>
            <SectionHeader label="Naval's Wealth Equation" sub="Wealth = Specific Knowledge × Accountability × Leverage × Time" accent="#6DB889" />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 12 }}>
              {[
                { label: 'Specific Knowledge', desc: 'What only you can do', Icon: Brain, color: '#7AACCF' },
                { label: 'Accountability', desc: 'Put your name on it', Icon: Target, color: '#C4935A' },
                { label: 'Leverage', desc: 'Code, media, capital, labor', Icon: Zap, color: 'var(--color-accent)' },
                { label: 'Time', desc: 'Play long-term games', Icon: Clock, color: '#6DB889' },
              ].map((item, i) => (
                <div key={i} style={{ padding: '24px', borderRadius: 16, background: 'rgba(255,255,255,0.05)', border: `1px solid ${item.color}33`, textAlign: 'center' }}>
                  <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}><item.Icon size={24} style={{ color: item.color }} /></div>
                  <p style={{ fontSize: 13, fontWeight: 600, color: item.color, marginBottom: 6, letterSpacing: '-0.01em' }}>{item.label}</p>
                  <p style={{ fontSize: 11, color: 'var(--color-subtle)', lineHeight: 1.5 }}>{item.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Enough number */}
          <div className="card" style={{ padding: '40px' }}>
            <SectionHeader label="Your Enough Number" sub="Psychology of Money: The most important financial skill is knowing when to stop." accent="var(--color-accent)" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              <div>
                <p style={{ fontSize: 10, color: 'var(--color-subtle)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 8 }}>Monthly enough</p>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                  <span style={{ fontSize: 11, color: 'var(--color-muted)' }}>€</span>
                  <EditableText value={v.enoughMonthlyIncome.toString()} onSave={val => v.update({ enoughMonthlyIncome: Number(val) || 0 })}
                    style={{ fontSize: 40, fontWeight: 600, color: 'var(--color-accent)', letterSpacing: '-0.04em', lineHeight: 1 }} />
                </div>
                <p style={{ fontSize: 11, color: 'var(--color-muted)', marginTop: 4 }}>per month for a rich life</p>
              </div>
              <div>
                <p style={{ fontSize: 10, color: 'var(--color-subtle)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 8 }}>Net worth target</p>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                  <span style={{ fontSize: 11, color: 'var(--color-muted)' }}>€</span>
                  <EditableText value={v.enoughNetWorth.toLocaleString()} onSave={val => v.update({ enoughNetWorth: Number(val.replace(/\D/g, '')) || 0 })}
                    style={{ fontSize: 40, fontWeight: 600, color: '#6DB889', letterSpacing: '-0.04em', lineHeight: 1 }} />
                </div>
                <p style={{ fontSize: 11, color: 'var(--color-muted)', marginTop: 4 }}>financial independence number</p>
              </div>
              <div style={{ paddingTop: 16, borderTop: '1px solid var(--color-border)' }}>
                <p style={{ fontSize: 11, color: 'var(--color-muted)', marginBottom: 12 }}>At current trajectory ({new Date().getFullYear() + 5})</p>
                <CompoundChart current={netWorth} target={v.enoughNetWorth} years={5} />
              </div>
            </div>
          </div>

          {/* Leverage types */}
          <div className="card" style={{ padding: '40px' }}>
            <SectionHeader label="Your Leverage" sub="Code and media are leverage that works while you sleep. Labor and capital are permission-dependent." accent="#7AACCF" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {[
                { type: 'Media', desc: 'Content, brand, audience: scales infinitely', active: true, color: '#D4A96A' },
                { type: 'Labor', desc: 'Team, VAs, contractors: requires management', active: true, color: '#7AACCF' },
                { type: 'Code', desc: 'Products, tools, automation: no marginal cost', active: false, color: '#6DB889' },
                { type: 'Capital', desc: 'Investments, equity: money making money', active: false, color: '#C4935A' },
              ].map(item => (
                <div key={item.type} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '16px 20px', borderRadius: 12, background: item.active ? `rgba(${item.color === '#D4A96A' ? '212,169,106' : item.color === '#7AACCF' ? '122,172,207' : '109,184,137'},0.08)` : 'rgba(255,255,255,0.03)', border: `1px solid ${item.active ? item.color + '33' : 'rgba(255,255,255,0.07)'}`, opacity: item.active ? 1 : 0.5 }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: item.active ? item.color : 'var(--color-subtle)', flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 13, fontWeight: 600, color: item.active ? 'var(--color-ink)' : 'var(--color-subtle)', marginBottom: 2 }}>{item.type}</p>
                    <p style={{ fontSize: 11, color: 'var(--color-subtle)' }}>{item.desc}</p>
                  </div>
                  <span style={{ fontSize: 10, padding: '4px 10px', borderRadius: 100, background: item.active ? `${item.color}22` : 'transparent', color: item.active ? item.color : 'var(--color-subtle)', border: `1px solid ${item.active ? item.color + '44' : 'transparent'}`, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                    {item.active ? 'Active' : 'Next'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Tab: Time Horizon ── */}
      {activeTab === 'horizon' && (
        <div className="anim-fade-up" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {[
            { label: '10-Year Vision', sub: 'The vivid picture of your ideal life in 2036', key: 'vision10Year' as const, color: '#D4A96A', scale: '10 Y' },
            { label: '3-Year Targets', sub: 'Ambitious but achievable milestones by 2029', key: 'vision3Year' as const, color: '#7AACCF', scale: '3 Y' },
            { label: 'This Year\'s Focus', sub: `The specific outcomes you\'ll achieve in ${new Date().getFullYear()}`, key: 'vision1Year' as const, color: '#6DB889', scale: '1 Y' },
          ].map(item => (
            <div key={item.key} className="card" style={{ padding: '40px', display: 'flex', gap: 32 }}>
              <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 52, height: 52, borderRadius: '50%', border: `1.5px solid ${item.color}55`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: item.color, letterSpacing: '0.04em' }}>{item.scale}</span>
                </div>
                <div style={{ width: 1, flex: 1, minHeight: 60, background: `linear-gradient(${item.color}44, transparent)` }} />
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.16em', textTransform: 'uppercase', color: item.color, marginBottom: 6 }}>{item.label}</p>
                <p style={{ fontSize: 11, color: 'var(--color-subtle)', marginBottom: 20 }}>{item.sub}</p>
                <EditableText value={v[item.key]} onSave={val => v.update({ [item.key]: val })} multiline placeholder={`Write your ${item.label.toLowerCase()} here...`}
                  style={{ fontSize: 15, lineHeight: 1.8, color: 'var(--color-ink)', letterSpacing: '-0.01em' }} />
              </div>
            </div>
          ))}

          {/* Flywheel principle */}
          <div style={{ padding: '28px 40px', borderRadius: 20, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', textAlign: 'center' }}>
            <p style={{ fontSize: 13, color: 'var(--color-muted)', fontStyle: 'italic', lineHeight: 1.7 }}>
              "The flywheel turns. Then it turns again. Each turn builds on the last. At some point: breakthrough."
            </p>
            <p style={{ fontSize: 11, color: 'var(--color-subtle)', marginTop: 10 }}>Jim Collins · Good to Great</p>
          </div>
        </div>
      )}
    </div>
  )
}
