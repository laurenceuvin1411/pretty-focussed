import { useState, useRef, useEffect } from 'react'
import { getWeek } from 'date-fns'
import { usePlannerStore } from '../store/plannerStore'
import type { WeekBlock, WeekBlockType } from '../types'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import { Trash2, RefreshCw, X, Zap, AlertTriangle, Lightbulb, ChevronRight } from 'lucide-react'
import { format } from 'date-fns'
import { nlBE } from 'date-fns/locale'
import { GoogleCalendarStrip, useWeekEvents, CalendarEventChip } from '../components/GoogleCalendarPanel'

const DAYS = ['mon','tue','wed','thu','fri','sat','sun'] as const
const DAYS_NL = { mon:'Mon', tue:'Tue', wed:'Wed', thu:'Thu', fri:'Fri', sat:'Sat', sun:'Sun' }
const DAYS_FULL = { mon:'Monday', tue:'Tuesday', wed:'Wednesday', thu:'Thursday', fri:'Friday', sat:'Saturday', sun:'Sunday' }
const HOURS = Array.from({ length: 14 }, (_, i) => i + 7)

const blockCfg: Record<WeekBlockType, { label: string; bg: string; text: string; color: string }> = {
  'deep-work': { label: 'Deep Work',  bg: 'rgba(212,169,106,0.2)',  text: '#D4A96A', color: '#D4A96A' },
  'meeting':   { label: 'Meeting',    bg: 'rgba(255,255,255,0.1)',  text: 'rgba(255,255,255,0.6)', color: 'rgba(255,255,255,0.4)' },
  'sales':     { label: 'Sales',      bg: 'rgba(109,184,137,0.2)',  text: '#6DB889', color: '#6DB889' },
  'content':   { label: 'Content',    bg: 'rgba(122,172,207,0.2)',  text: '#7AACCF', color: '#7AACCF' },
  'operator':  { label: 'Operator',   bg: 'rgba(124,127,132,0.10)', text: '#7C7F84', color: '#7C7F84' },
  'recovery':  { label: 'Recovery',   bg: 'rgba(255,255,255,0.06)', text: 'rgba(255,255,255,0.45)', color: 'rgba(255,255,255,0.3)' },
  'training':  { label: 'Training',   bg: 'rgba(122,172,207,0.15)', text: '#7AACCF', color: '#7AACCF' },
}

/* ── AI-curated suggestions per block type ── */
const blockSuggestions: Record<WeekBlockType, {
  quotes: string[]
  urgency: { label: string; quadrant: string; color: string; desc: string }
  alternative: string[]
}> = {
  'deep-work': {
    quotes: [
      '"The ability to perform deep work is becoming increasingly rare and increasingly valuable." Cal Newport',
      '"Focus is the new IQ. Guard it like your most valuable asset."',
      '"One hour of focused work beats eight hours of scattered effort."',
      '"Your greatest competitive advantage is the ability to think deeply when everyone else is distracted."',
    ],
    urgency: { label: 'Important · Not Urgent', quadrant: 'Q2', color: '#6DB889', desc: 'This is your leverage zone. Protect it aggressively. It builds the future.' },
    alternative: [
      'Turn this into a 90-min uninterrupted sprint. Silence your phone, close Slack, one task only.',
      'Start with your hardest problem first (eat the frog). Peak energy goes to peak work.',
      'Define ONE clear output before you sit down. Vague sessions produce vague results.',
    ],
  },
  'meeting': {
    quotes: [
      '"A meeting is an event where minutes are taken and hours are lost.. James T. Kirk',
      '"Every meeting you attend is a trade. Make sure it\'s worth the price."',
      '"The best meeting is the one replaced by a clear Loom video or async doc."',
    ],
    urgency: { label: 'Urgent · Not Important', quadrant: 'Q3', color: '#7C7F84', desc: 'Most meetings live here. Ask: could this be an email? A Loom? A shared doc?' },
    alternative: [
      'Send a 3-min Loom instead. Same info, zero scheduling overhead.',
      'Convert to a standing meeting. 15 min, no chairs, everyone stays focused.',
      'Send a decision doc 24h before with 3 options. Come to align, not explore.',
    ],
  },
  'sales': {
    quotes: [
      '"Revenue solves all known startup problems.. Naval Ravikant',
      '"Your calendar is your strategy. If sales isn\'t on it daily, growth isn\'t a priority."',
      '"Every day you don\'t sell is a day your competitor does."',
      '"Pipeline is peace of mind. No pipeline, no options."',
    ],
    urgency: { label: 'Important · Urgent', quadrant: 'Q1', color: '#D4A96A', desc: 'This is fire-fighting fuel. Important AND urgent. Respect this time, execute hard.' },
    alternative: [
      'Block 2 hours every morning for outreach before the day steals your energy',
      'Follow up on every open proposal within 48h. Most deals die from silence.',
      'Replace cold outreach with warm referral asks. 10x the conversion rate.',
    ],
  },
  'content': {
    quotes: [
      '"Content is compound interest. Ship consistently and the algorithm rewards patience."',
      '"The best content is just your genuine thinking, made visible."',
      '"You don\'t need a big audience you need the right audience watching."',
      '"Done is better than perfect. Publish the imperfect thing that helps someone today."',
    ],
    urgency: { label: 'Important · Not Urgent', quadrant: 'Q2', color: '#6DB889', desc: 'Content builds long-term leverage: audience, authority, inbound leads. Protect this time.' },
    alternative: [
      'Repurpose one piece of content into 5 formats: blog → LinkedIn → thread → reel → email',
      'Batch-create: write 3 posts in one session rather than 1 post on 3 different days',
      'Document your actual work in real-time. The most authentic content is already happening.',
    ],
  },
  'operator': {
    quotes: [
      '"Systems create freedom. The goal is to build something that runs without you."',
      '"Every minute you spend on operator tasks is a minute not spent on CEO tasks."',
      '"Automate it, delegate it, or eliminate it but don\'t let it steal your mornings."',
    ],
    urgency: { label: 'Urgent · Not Important', quadrant: 'Q3', color: '#7C7F84', desc: 'Necessary but not your highest leverage. Can any of this be delegated or automated?' },
    alternative: [
      'Batch all admin into one daily 30-min block don\'t let it bleed into your whole day',
      'Document this process once, then delegate it permanently',
      'Ask: what would happen if I just didn\'t do this? Could answer with "nothing"',
    ],
  },
  'recovery': {
    quotes: [
      '"Rest is not a reward for hard work. It is a requirement for it."',
      '"The body achieves what the mind believes but only when it\'s rested."',
      '"High performance is 80% recovery, 20% output. Most people have it backwards."',
      '"Idle time is when your subconscious solves the problems your conscious mind can\'t."',
    ],
    urgency: { label: 'Important · Not Urgent', quadrant: 'Q2', color: '#6DB889', desc: 'Recovery is performance infrastructure. Cut this and everything else degrades within weeks.' },
    alternative: [
      'Add a 20-min walk. Daylight and movement reset cortisol better than coffee.',
      'Try non-sleep deep rest (NSDR/yoga nidra). 20 min equals 1h of sleep restoration.',
      'No screens for the first 30 min. Let your nervous system find its baseline.',
    ],
  },
  'training': {
    quotes: [
      '"Physical strength is the foundation of all other strengths."',
      '"You can\'t think clearly in a body you\'ve been ignoring."',
      '"The workout you don\'t want to do is usually the one you need most."',
      '"Consistency beats intensity. Show up even when you don\'t feel like it."',
    ],
    urgency: { label: 'Important · Not Urgent', quadrant: 'Q2', color: '#6DB889', desc: 'Training is the highest ROI hour in your week. Energy, clarity, confidence all compound.' },
    alternative: [
      'Pair your training with a podcast/audiobook. Make the hour doubly productive.',
      'Train in the morning willpower is highest, and the rest of the day won\'t steal it',
      'Track progressive overload without data you\'re just exercising, not training',
    ],
  },
}

const toMins = (t: string) => { const [h,m] = t.split(':').map(Number); return h*60+m }
const dur = (b: WeekBlock) => toMins(b.end) - toMins(b.start)

function ceoScore(blocks: WeekBlock[]) {
  const total = blocks.reduce((a,b) => a + dur(b), 0)
  if (!total) return { ceo: 0, operator: 0, deepWork: 0, warn: null, breakdown: [] }
  const byType: Record<string,number> = {}
  blocks.forEach(b => { byType[b.type] = (byType[b.type]||0) + dur(b) })
  const dw = byType['deep-work']||0, sales = byType['sales']||0, op = byType['operator']||0
  const ceoTime = dw + sales
  return {
    ceo: Math.round(ceoTime/total*100),
    operator: Math.round(op/total*100),
    deepWork: Math.round(dw/60*10)/10,
    warn: ceoTime/total < 0.35 ? 'More operator than CEO time this week.' : null,
    breakdown: Object.entries(byType).map(([type, mins]) => ({
      name: blockCfg[type as WeekBlockType]?.label || type,
      value: Math.round(mins/60*10)/10,
      color: blockCfg[type as WeekBlockType]?.color || 'var(--color-subtle)',
    }))
  }
}

/* ── Block detail panel ── */
function BlockPanel({ block, onClose, onDelete, onUpdate }: {
  block: WeekBlock
  onClose: () => void
  onDelete: () => void
  onUpdate: (updates: Partial<WeekBlock>) => void
}) {
  const cfg = blockCfg[block.type]
  const suggestions = blockSuggestions[block.type]
  const [activeTab, setActiveTab] = useState<'quote'|'urgency'|'alternative'>('quote')
  const [notes, setNotes] = useState(block.notes || '')
  const [label, setLabel] = useState(block.label)
  const [quoteIdx] = useState(() => Math.floor(Math.random() * suggestions.quotes.length))
  const [altIdx] = useState(() => Math.floor(Math.random() * suggestions.alternative.length))
  const panelRef = useRef<HTMLDivElement>(null)

  // Save notes on blur/change
  useEffect(() => {
    const t = setTimeout(() => onUpdate({ notes }), 300)
    return () => clearTimeout(t)
  }, [notes])

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  const tabs = [
    { key: 'quote' as const,       icon: <Zap size={11} />,           label: 'Inspiration' },
    { key: 'urgency' as const,     icon: <AlertTriangle size={11} />, label: 'Priority' },
    { key: 'alternative' as const, icon: <Lightbulb size={11} />,     label: 'Upgrade' },
  ]

  const INK   = 'rgba(228,236,248,0.95)'
  const MUTED = 'rgba(180,200,224,0.60)'
  const DIM   = 'rgba(160,185,210,0.40)'
  const EDGE  = 'rgba(255,255,255,0.08)'

  return (
    <>
      {/* Backdrop */}
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 40, background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(6px)' }} />

      {/* Panel */}
      <div ref={panelRef} className="anim-fade-up" style={{
        position: 'fixed', top: 0, right: 0, bottom: 0, zIndex: 50,
        width: 400, background: '#0B1120',
        borderLeft: `1px solid ${cfg.color}40`,
        display: 'flex', flexDirection: 'column',
        boxShadow: `-32px 0 80px rgba(0,0,0,0.6)`,
      }}>

        {/* Colour accent strip at top */}
        <div style={{ height: 3, background: `linear-gradient(90deg, ${cfg.color}, ${cfg.color}40)`, flexShrink: 0 }} />

        {/* Header */}
        <div style={{ padding: '24px 28px 20px', borderBottom: `1px solid ${EDGE}`, flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
            {/* Block type badge */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: `${cfg.color}18`, border: `1px solid ${cfg.color}35`, borderRadius: 20, padding: '5px 12px' }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: cfg.color, boxShadow: `0 0 6px ${cfg.color}` }} />
              <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: cfg.color }}>{cfg.label}</span>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <button onClick={onDelete} title="Verwijder" style={{ width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,80,80,0.08)', border: '1px solid rgba(255,80,80,0.2)', borderRadius: 16, cursor: 'pointer', color: 'rgba(255,120,120,0.7)', transition: 'all 150ms' }}>
                <Trash2 size={13} />
              </button>
              <button onClick={onClose} title="Sluiten" style={{ width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', background: EDGE, border: `1px solid ${EDGE}`, borderRadius: 16, cursor: 'pointer', color: MUTED, transition: 'all 150ms' }}>
                <X size={13} />
              </button>
            </div>
          </div>

          {/* Editable title */}
          <input
            value={label}
            onChange={e => setLabel(e.target.value)}
            onBlur={() => onUpdate({ label: label.trim() || block.label })}
            onKeyDown={e => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur() }}
            style={{ width: '100%', background: 'transparent', border: 'none', outline: 'none', fontSize: 24, fontWeight: 700, letterSpacing: '-0.04em', color: INK, fontFamily: 'inherit', lineHeight: 1.15, marginBottom: 8, caretColor: cfg.color }}
          />
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 3, height: 3, borderRadius: '50%', background: DIM }} />
            <span style={{ fontSize: 12, color: DIM, letterSpacing: '0.02em' }}>{DAYS_FULL[block.day]} · {block.start} – {block.end} · {Math.round(dur(block) / 60 * 10) / 10}h</span>
          </div>
        </div>

        {/* Notes */}
        <div style={{ padding: '18px 28px', borderBottom: `1px solid ${EDGE}`, flexShrink: 0 }}>
          <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: DIM }}>Notities</span>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Context, intenties of focus voor dit blok…"
            rows={3}
            style={{ marginTop: 10, width: '100%', background: 'rgba(255,255,255,0.04)', border: `1px solid ${EDGE}`, borderRadius: 12, padding: '12px 14px', fontSize: 13, lineHeight: 1.65, color: INK, fontFamily: 'inherit', resize: 'none', outline: 'none', boxSizing: 'border-box', transition: 'border-color 150ms', }}
            onFocus={e => (e.target.style.borderColor = `${cfg.color}60`)}
            onBlur={e => (e.target.style.borderColor = EDGE)}
          />
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: `1px solid ${EDGE}`, flexShrink: 0, padding: '0 20px' }}>
          {tabs.map(t => (
            <button key={t.key} onClick={() => setActiveTab(t.key)} style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '13px 10px',
              background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: 'inherit',
              fontSize: 11, fontWeight: 600, letterSpacing: '0.05em',
              color: activeTab === t.key ? cfg.color : DIM,
              borderBottom: activeTab === t.key ? `2px solid ${cfg.color}` : '2px solid transparent',
              marginBottom: '-1px', transition: 'all 150ms ease', whiteSpace: 'nowrap',
            }}>
              {t.icon}{t.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px 28px' }}>

          {/* ── INSPIRATION ── */}
          {activeTab === 'quote' && (() => {
            const raw = suggestions.quotes[quoteIdx % suggestions.quotes.length]
            const quote = raw.replace(/^[""]|[""]$/g, '').trim()
            return (
              <div>
                {/* Quote card */}
                <div style={{ position: 'relative', borderRadius: 18, background: `linear-gradient(135deg, ${cfg.color}14, ${cfg.color}06)`, border: `1px solid ${cfg.color}30`, padding: '28px 24px 22px', marginBottom: 16, overflow: 'hidden' }}>
                  {/* decorative large quote mark */}
                  <div style={{ position: 'absolute', top: -8, left: 16, fontSize: 80, lineHeight: 1, color: cfg.color, opacity: 0.12, fontFamily: 'Georgia, serif', userSelect: 'none', pointerEvents: 'none' }}>"</div>
                  <p style={{ fontSize: 15, lineHeight: 1.75, color: INK, fontStyle: 'italic', letterSpacing: '-0.01em', position: 'relative', zIndex: 1, marginBottom: 16 }}>
                    {quote}
                  </p>
                  {/* progress dots */}
                  <div style={{ display: 'flex', gap: 5 }}>
                    {suggestions.quotes.map((_, i) => (
                      <div key={i} style={{ height: 3, borderRadius: 100, transition: 'all 200ms', width: i === quoteIdx % suggestions.quotes.length ? 20 : 8, background: i === quoteIdx % suggestions.quotes.length ? cfg.color : EDGE }} />
                    ))}
                  </div>
                </div>
                {/* Mindset label */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 16px', borderRadius: 12, background: EDGE }}>
                  <Zap size={13} color={cfg.color} />
                  <span style={{ fontSize: 12, color: MUTED, lineHeight: 1.5 }}>Mindset fuel voor <strong style={{ color: INK, fontWeight: 600 }}>{cfg.label}</strong> blokken</span>
                </div>
              </div>
            )
          })()}

          {/* ── PRIORITY ── */}
          {activeTab === 'urgency' && (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 16 }}>
                {[
                  { q: 'Q1', label: 'Urgent\n+ Belangrijk', active: suggestions.urgency.quadrant === 'Q1', note: 'Do now' },
                  { q: 'Q2', label: 'Niet Urgent\n+ Belangrijk', active: suggestions.urgency.quadrant === 'Q2', note: 'Schedule' },
                  { q: 'Q3', label: 'Urgent\n− Niet Belangrijk', active: suggestions.urgency.quadrant === 'Q3', note: 'Delegate' },
                  { q: 'Q4', label: 'Niet Urgent\n− Niet Belangrijk', active: suggestions.urgency.quadrant === 'Q4', note: 'Eliminate' },
                ].map(cell => (
                  <div key={cell.q} style={{ padding: '14px 12px', borderRadius: 12, textAlign: 'center', background: cell.active ? `${suggestions.urgency.color}18` : 'rgba(255,255,255,0.03)', border: `1px solid ${cell.active ? suggestions.urgency.color + '50' : EDGE}`, transition: 'all 200ms' }}>
                    <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.08em', color: cell.active ? suggestions.urgency.color : DIM, textTransform: 'uppercase', marginBottom: 4 }}>{cell.q}</p>
                    <p style={{ fontSize: 10.5, whiteSpace: 'pre-line', lineHeight: 1.4, color: cell.active ? INK : MUTED, fontWeight: cell.active ? 600 : 400 }}>{cell.label}</p>
                    <p style={{ fontSize: 9, letterSpacing: '0.08em', textTransform: 'uppercase', marginTop: 8, color: cell.active ? suggestions.urgency.color : EDGE, fontWeight: 700 }}>{cell.note}</p>
                  </div>
                ))}
              </div>
              <div style={{ padding: '16px 20px', borderRadius: 14, background: `${suggestions.urgency.color}12`, border: `1px solid ${suggestions.urgency.color}30` }}>
                <p style={{ fontSize: 12, fontWeight: 700, color: suggestions.urgency.color, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{suggestions.urgency.label}</p>
                <p style={{ fontSize: 13, lineHeight: 1.65, color: MUTED }}>{suggestions.urgency.desc}</p>
              </div>
            </div>
          )}

          {/* ── UPGRADE ── */}
          {activeTab === 'alternative' && (
            <div>
              <p style={{ fontSize: 11, color: DIM, marginBottom: 14, lineHeight: 1.5 }}>Hogere-leverage alternatieven voor dit blok type:</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {suggestions.alternative.map((alt, i) => (
                  <div key={i} style={{ padding: '14px 18px', borderRadius: 14, background: i === altIdx ? `${cfg.color}14` : 'rgba(255,255,255,0.03)', border: `1px solid ${i === altIdx ? cfg.color + '40' : EDGE}`, display: 'flex', gap: 12, alignItems: 'flex-start', transition: 'all 200ms' }}>
                    <div style={{ width: 22, height: 22, borderRadius: '50%', background: i === altIdx ? cfg.color : EDGE, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
                      <ChevronRight size={11} color={i === altIdx ? '#0B1120' : DIM} />
                    </div>
                    <p style={{ fontSize: 13, lineHeight: 1.6, color: i === altIdx ? INK : MUTED }}>{alt}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}

/* ── Main component ── */
export function WeekOptimizer() {
  const { weekBlocks, loadIdealWeek, deleteWeekBlock, addWeekBlock, updateWeekBlock } = usePlannerStore()
  const { byDayHour } = useWeekEvents()
  const [dragType, setDragType] = useState<WeekBlockType|null>(null)
  const [newLabel, setNewLabel] = useState('')
  const [selectedBlock, setSelectedBlock] = useState<WeekBlock|null>(null)
  const [dragStart, setDragStart] = useState<{ day: typeof DAYS[number]; hour: number } | null>(null)
  const [dragEnd, setDragEnd] = useState<{ day: typeof DAYS[number]; hour: number } | null>(null)

  const score = ceoScore(weekBlocks)
  const week = getWeek(new Date(), { weekStartsOn: 1 })
  const now = new Date()

  // Keep selectedBlock in sync with store updates
  useEffect(() => {
    if (selectedBlock) {
      const updated = weekBlocks.find(b => b.id === selectedBlock.id)
      if (updated) setSelectedBlock(updated)
    }
  }, [weekBlocks])

  const getBlockAt = (day: typeof DAYS[number], hour: number) =>
    weekBlocks.filter(b => b.day===day && toMins(b.start)<=hour*60 && toMins(b.end)>hour*60)

  const isInDragRange = (day: typeof DAYS[number], hour: number) => {
    if (!dragStart || !dragEnd || dragStart.day !== day || dragEnd.day !== day) return false
    const minH = Math.min(dragStart.hour, dragEnd.hour)
    const maxH = Math.max(dragStart.hour, dragEnd.hour)
    return hour >= minH && hour <= maxH
  }

  const handleMouseDown = (day: typeof DAYS[number], hour: number, hasBlock: boolean) => {
    if (!dragType || hasBlock) return
    setDragStart({ day, hour })
    setDragEnd({ day, hour })
  }

  const handleMouseEnter = (day: typeof DAYS[number], hour: number) => {
    if (!dragStart || !dragType) return
    if (day !== dragStart.day) return
    setDragEnd({ day, hour })
  }

  const handleMouseUp = (day: typeof DAYS[number], hour: number) => {
    if (!dragType || !dragStart) return
    const startHour = Math.min(dragStart.hour, hour)
    const endHour = Math.max(dragStart.hour, hour) + 1
    addWeekBlock({
      day: dragStart.day,
      start: `${String(startHour).padStart(2,'0')}:00`,
      end:   `${String(endHour).padStart(2,'0')}:00`,
      type: dragType,
      label: newLabel || blockCfg[dragType].label,
      notes: '',
    })
    setNewLabel('')
    setDragStart(null)
    setDragEnd(null)
  }

  const handleBlockClick = (block: WeekBlock, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!dragType) setSelectedBlock(block)
  }

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto' }}>

      {/* ── Header ── */}
      <div className="anim-fade-up" style={{ marginBottom: 40, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: 32, fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1, color: 'var(--color-ink)', marginBottom: 12 }}>
            Time Design
          </h1>
          <p style={{ fontSize: 13, color: 'var(--color-muted)' }}>
            {score.ceo >= 50 ? 'CEO-mode dominant. You\'re in the driver\'s seat.' : score.ceo >= 35 ? 'Balanced week. Push CEO time higher.' : 'Operator-heavy. Protect your deep work.'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          {[
            { v: `${score.ceo}%`, l: 'CEO Time', c: score.ceo >= 50 ? 'var(--color-brand-green)' : 'var(--color-accent)' },
            { v: `${score.operator}%`, l: 'Operator', c: score.operator > 50 ? '#7C7F84' : 'var(--color-muted)' },
            { v: `${score.deepWork}h`, l: 'Deep Work', c: 'var(--color-brand-blue)' },
          ].map(s => (
            <div key={s.l} className="card" style={{ padding: '16px 20px', textAlign: 'center', minWidth: 72 }}>
              <p style={{ fontSize: 22, fontWeight: 600, letterSpacing: '-0.04em', color: s.c, lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>{s.v}</p>
              <p style={{ fontSize: 9, color: 'var(--color-subtle)', marginTop: 6, letterSpacing: '0.1em', textTransform: 'uppercase' }}>{s.l}</p>
            </div>
          ))}
        </div>
      </div>

      {score.warn && (
        <div style={{ marginBottom: 24, padding: '14px 20px', borderRadius: 14, background: 'rgba(196,136,78,0.1)', border: '1px solid rgba(196,136,78,0.2)', fontSize: 13, color: '#D4A97A' }}>
          ⚠ {score.warn}
        </div>
      )}

      <div style={{ display: 'flex', gap: 24 }}>

        {/* Left palette */}
        <div style={{ width: 180, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="card" style={{ padding: '24px 20px' }}>
            <p style={{ fontSize: 10, fontWeight: 500, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--color-subtle)', marginBottom: 16 }}>
              Block type
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {(Object.entries(blockCfg) as [WeekBlockType, typeof blockCfg[WeekBlockType]][]).map(([type, cfg]) => (
                <button key={type} onClick={() => setDragType(dragType===type ? null : type)}
                  style={{
                    width: '100%', textAlign: 'left', fontSize: 12, padding: '9px 14px',
                    borderRadius: 12, fontWeight: 500, cursor: 'pointer',
                    border: dragType===type ? `1px solid ${cfg.color}60` : '1px solid var(--color-border)',
                    background: dragType===type ? cfg.bg : 'transparent',
                    color: dragType===type ? cfg.text : 'var(--color-muted)',
                    transition: 'all 150ms ease', fontFamily: 'inherit',
                    display: 'flex', alignItems: 'center', gap: 8,
                  }}>
                  {dragType===type && <span style={{ width: 6, height: 6, borderRadius: '50%', background: cfg.color, flexShrink: 0 }} />}
                  {cfg.label}
                </button>
              ))}
            </div>

            {dragType && (
              <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <input value={newLabel} onChange={e => setNewLabel(e.target.value)}
                  placeholder="Custom name…" className="input"
                  style={{ fontSize: 12, padding: '10px 14px', borderRadius: 12 }} />
                <p style={{ fontSize: 10, color: 'var(--color-subtle)', lineHeight: 1.5 }}>
                  Click to place · drag to span hours
                </p>
              </div>
            )}
            {!dragType && (
              <p style={{ fontSize: 11, color: 'var(--color-subtle)', marginTop: 14, lineHeight: 1.6 }}>
                Select a type, then click or drag on the grid. Click any block to open it.
              </p>
            )}
          </div>

          <button onClick={loadIdealWeek} className="btn-ghost cursor-pointer" style={{ width: '100%', justifyContent: 'center', borderRadius: 14, padding: '12px 0' }}>
            <RefreshCw size={12} />
            <span style={{ marginLeft: 8, fontSize: 12 }}>Load ideal week</span>
          </button>

          <GoogleCalendarStrip />

          {score.breakdown.length > 0 && (
            <div className="card" style={{ padding: '24px 20px' }}>
              <p style={{ fontSize: 10, fontWeight: 500, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--color-subtle)', marginBottom: 16 }}>
                Distribution
              </p>
              <ResponsiveContainer width="100%" height={120}>
                <PieChart>
                  <Pie data={score.breakdown} cx="50%" cy="50%" innerRadius={28} outerRadius={52} dataKey="value" strokeWidth={0}>
                    {score.breakdown.map((e,i) => <Cell key={i} fill={e.color} />)}
                  </Pie>
                  <Tooltip formatter={(v: number) => `${v}h`} contentStyle={{ fontSize: 11, borderRadius: 12, border: '1px solid var(--color-border)', background: 'rgba(15,15,20,0.95)', color: 'var(--color-ink)' }} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8 }}>
                {score.breakdown.map(b => (
                  <div key={b.name} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: b.color, flexShrink: 0 }} />
                    <span style={{ fontSize: 11, color: 'var(--color-muted)', flex: 1 }}>{b.name}</span>
                    <span style={{ fontSize: 11, color: 'var(--color-ink)', fontVariantNumeric: 'tabular-nums' }}>{b.value}h</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Calendar grid */}
        <div className="card" style={{ flex: 1, overflow: 'hidden', userSelect: 'none' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                <th style={{ width: 52, padding: '16px 0', fontSize: 10, color: 'var(--color-subtle)', fontWeight: 400, borderRight: '1px solid var(--color-border)', background: 'rgba(255,255,255,0.02)' }} />
                {DAYS.map(day => (
                  <th key={day} style={{ padding: '16px 0', fontSize: 11, fontWeight: 500, textAlign: 'center', color: 'var(--color-muted)', borderRight: '1px solid var(--color-border)', background: 'rgba(255,255,255,0.02)', letterSpacing: '0.04em' }}>
                    {DAYS_NL[day]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {HOURS.map(hour => (
                <tr key={hour} style={{ height: 48, borderBottom: '1px solid var(--color-border)' }}>
                  <td style={{ width: 52, padding: '0 12px', fontSize: 10, textAlign: 'right', color: 'var(--color-subtle)', borderRight: '1px solid var(--color-border)', verticalAlign: 'middle', fontVariantNumeric: 'tabular-nums' }}>
                    {String(hour).padStart(2,'0')}:00
                  </td>
                  {DAYS.map(day => {
                    const blocks = getBlockAt(day, hour)
                    const hasBlock = blocks.length > 0
                    const inDrag = isInDragRange(day, hour)
                    const canPlace = dragType && !hasBlock

                    return (
                      <td key={day}
                        onMouseDown={() => handleMouseDown(day, hour, hasBlock)}
                        onMouseEnter={() => handleMouseEnter(day, hour)}
                        onMouseUp={() => handleMouseUp(day, hour)}
                        style={{
                          borderRight: '1px solid var(--color-border)',
                          verticalAlign: 'middle', padding: '2px 3px',
                          cursor: canPlace ? 'crosshair' : 'default',
                          background: inDrag && dragType ? `${blockCfg[dragType].bg}` : canPlace ? 'rgba(212,169,106,0.03)' : 'transparent',
                          transition: 'background 80ms ease', position: 'relative',
                        }}>
                        {inDrag && dragType && !hasBlock && (
                          <div style={{ position: 'absolute', inset: '2px 3px', borderRadius: 16, border: `1px dashed ${blockCfg[dragType].color}60`, pointerEvents: 'none' }} />
                        )}
                        {/* Google Calendar events */}
                        {(byDayHour[day]?.[hour] || []).map(ev => (
                          <CalendarEventChip key={ev.id} event={ev} />
                        ))}

                        {blocks.map(block => {
                          const cfg = blockCfg[block.type]
                          const isSelected = selectedBlock?.id === block.id
                          return (
                            <div
                              key={block.id}
                              onClick={e => handleBlockClick(block, e)}
                              style={{
                                borderRadius: 16, padding: '5px 10px', fontSize: 11, fontWeight: 500,
                                display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6,
                                background: cfg.bg, color: cfg.text,
                                cursor: dragType ? 'default' : 'pointer',
                                border: isSelected ? `1px solid ${cfg.color}60` : '1px solid transparent',
                                boxShadow: isSelected ? `0 0 12px ${cfg.color}25` : 'none',
                                transition: 'all 150ms ease',
                              }}
                              className="week-block"
                            >
                              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                                {block.notes && <span style={{ marginRight: 4, opacity: 0.6 }}>·</span>}
                                {block.label}
                              </span>
                              <button onClick={e => { e.stopPropagation(); deleteWeekBlock(block.id); if (selectedBlock?.id === block.id) setSelectedBlock(null) }}
                                className="block-del"
                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', padding: '1px 0', opacity: 0, flexShrink: 0 }}>
                                <Trash2 size={9} />
                              </button>
                            </div>
                          )
                        })}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Block detail panel */}
      {selectedBlock && (
        <BlockPanel
          block={selectedBlock}
          onClose={() => setSelectedBlock(null)}
          onDelete={() => { deleteWeekBlock(selectedBlock.id); setSelectedBlock(null) }}
          onUpdate={updates => updateWeekBlock(selectedBlock.id, updates)}
        />
      )}

      <style>{`
        .week-block:hover .block-del { opacity: 0.6 !important; }
        .week-block:hover .block-del:hover { opacity: 1 !important; }
        .week-block:hover { opacity: 0.9; }
      `}</style>
    </div>
  )
}
