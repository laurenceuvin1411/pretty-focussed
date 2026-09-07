import { useState, useEffect } from 'react'
import { Target, Zap, ChevronRight, Check, RefreshCw, RotateCcw, Flame } from 'lucide-react'
import { useSprintStore } from '../store/sprintStore'
import type { Sprint, SprintRoadmap, DailyPlan, SprintTask, TaskCategory } from '../store/sprintStore'

// ── Constants ────────────────────────────────────────────────────
const ACCENT = '#4C6481'
const TODAY = new Date().toISOString().split('T')[0]

const CATEGORY_CFG: Record<TaskCategory, { label: string; color: string }> = {
  'deep-work': { label: 'Deep Work',  color: '#4C6481' },
  sales:       { label: 'Sales',      color: '#6DB889' },
  content:     { label: 'Content',    color: '#C4935A' },
  workout:     { label: 'Workout',    color: '#7AACCF' },
  meetings:    { label: 'Meetings',   color: '#7AACCF' },
  admin:       { label: 'Admin',      color: '#7C7F84' },
  personal:    { label: 'Personal',   color: '#B9BBBE' },
  learning:    { label: 'Learning',   color: '#D4A96A' },
}

const ENERGY_CFG = {
  deep:   { label: 'Hoge focus',  dot: '#4C6481' },
  medium: { label: 'Gemiddeld',   dot: '#C4935A' },
  light:  { label: 'Licht',       dot: '#6DB889' },
}

const PRIORITY_CFG = {
  critical: { label: 'Kritiek', color: '#C4935A' },
  high:     { label: 'Hoog',    color: ACCENT },
  medium:   { label: 'Medium',  color: '#7C7F84' },
}

// ── Helpers ──────────────────────────────────────────────────────
function daysBetween(a: string, b: string) {
  return Math.floor((new Date(b).getTime() - new Date(a).getTime()) / 86400000)
}

function sprintDay(sprint: Sprint) {
  return Math.max(1, Math.min(90, daysBetween(sprint.startDate, TODAY) + 1))
}

function currentWeek(sprint: Sprint) {
  return Math.min(13, Math.ceil(sprintDay(sprint) / 7))
}

function sprintPercent(sprint: Sprint) {
  return Math.round((sprintDay(sprint) / 90) * 100)
}

function goalPercent(sprint: Sprint) {
  if (!sprint.targetValue || !sprint.currentValue) return 0
  return Math.min(100, Math.round((sprint.currentValue / sprint.targetValue) * 100))
}

function momentumScore(sprint: Sprint, todayPlan: DailyPlan | undefined): number {
  const day = sprintDay(sprint)
  if (day < 1) return 0
  const consistency = sprint.completedDates.length / day
  const todayDone = todayPlan ? todayPlan.top3.filter(t => t.completed).length : 0
  const todayScore = todayDone / 3
  return Math.round((consistency * 600 + todayScore * 400))
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('nl-BE', { weekday: 'long', day: 'numeric', month: 'long' })
}

// ── Progress Ring ────────────────────────────────────────────────
function Ring({ pct, size = 64, stroke = 5, color = ACCENT, bg = 'var(--color-border)' }: {
  pct: number; size?: number; stroke?: number; color?: string; bg?: string
}) {
  const r = (size - stroke * 2) / 2
  const circ = 2 * Math.PI * r
  const offset = circ - (pct / 100) * circ
  const c = size / 2
  return (
    <svg width={size} height={size} style={{ flexShrink: 0 }}>
      <circle cx={c} cy={c} r={r} fill="none" stroke={bg} strokeWidth={stroke} />
      <circle cx={c} cy={c} r={r} fill="none" stroke={color} strokeWidth={stroke}
        strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
        transform={`rotate(-90 ${c} ${c})`}
        style={{ transition: 'stroke-dashoffset 900ms cubic-bezier(0.4,0,0.2,1)' }} />
    </svg>
  )
}

// ── API call ─────────────────────────────────────────────────────
async function callAI(system: string, user: string): Promise<string> {
  const res = await fetch('/.netlify/functions/anthropic', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 4000,
      system,
      messages: [{ role: 'user', content: user }],
    }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data?.error || `API ${res.status}`)
  return data.content?.[0]?.text ?? ''
}

function parseJSON(text: string) {
  const m = text.match(/\{[\s\S]*\}/)
  if (!m) throw new Error('Geen JSON gevonden')
  return JSON.parse(m[0])
}

// ── Sprint Setup Wizard ──────────────────────────────────────────
function SprintSetup() {
  const { createSprint, setRoadmap, activateSprint } = useSprintStore()
  const [step, setStep] = useState<'goal' | 'generating' | 'ready'>('goal')
  const [goal, setGoal] = useState('')
  const [context, setContext] = useState('')
  const [targetValue, setTargetValue] = useState('')
  const [targetUnit, setTargetUnit] = useState('')
  const [roadmap, setRoadmapLocal] = useState<SprintRoadmap | null>(null)
  const [sprintId, setSprintId] = useState('')
  const [genStep, setGenStep] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const GEN_STEPS = [
    'Doel analyseren...',
    'Maandelijkse uitkomsten bepalen...',
    'Wekelijkse mijlpalen bouwen...',
    'Dagelijkse acties kalibreren...',
    'Roadmap finaliseren...',
  ]

  async function generate() {
    if (!goal.trim()) return
    const id = createSprint(goal.trim(), context.trim(), targetValue ? Number(targetValue) : undefined, targetUnit || undefined)
    setSprintId(id)
    setStep('generating')

    const stepTimer = setInterval(() => setGenStep(s => Math.min(s + 1, GEN_STEPS.length - 1)), 1200)

    try {
      const text = await callAI(
        'Je bent een elite CEO coach, COO, business strategist en executie-expert. Genereer uitsluitend geldig JSON, geen markdown.',
        `SPRINT DOEL: ${goal}
EXTRA CONTEXT: ${context || 'geen'}
STARTDATUM: ${TODAY}
DOELWAARDE: ${targetValue ? `${targetValue} ${targetUnit}` : 'niet opgegeven'}

Genereer een complete 90-dag sprint roadmap in dit JSON-formaat:
{
  "months": [
    { "title": "string", "focus": "string", "keyResults": ["string","string","string"] },
    { "title": "string", "focus": "string", "keyResults": ["string","string","string"] },
    { "title": "string", "focus": "string", "keyResults": ["string","string","string"] }
  ],
  "weeks": [
    { "weekNumber": 1, "theme": "string", "focus": "string", "milestones": ["string","string"] },
    { "weekNumber": 2, "theme": "string", "focus": "string", "milestones": ["string","string"] },
    { "weekNumber": 3, "theme": "string", "focus": "string", "milestones": ["string","string"] },
    { "weekNumber": 4, "theme": "string", "focus": "string", "milestones": ["string","string"] },
    { "weekNumber": 5, "theme": "string", "focus": "string", "milestones": ["string","string"] },
    { "weekNumber": 6, "theme": "string", "focus": "string", "milestones": ["string","string"] },
    { "weekNumber": 7, "theme": "string", "focus": "string", "milestones": ["string","string"] },
    { "weekNumber": 8, "theme": "string", "focus": "string", "milestones": ["string","string"] },
    { "weekNumber": 9, "theme": "string", "focus": "string", "milestones": ["string","string"] },
    { "weekNumber": 10, "theme": "string", "focus": "string", "milestones": ["string","string"] },
    { "weekNumber": 11, "theme": "string", "focus": "string", "milestones": ["string","string"] },
    { "weekNumber": 12, "theme": "string", "focus": "string", "milestones": ["string","string"] },
    { "weekNumber": 13, "theme": "string", "focus": "string", "milestones": ["string","string"] }
  ],
  "kpiTargets": { "key": number },
  "initialCoachNote": "string"
}

Regels:
- Week themes zijn specifiek en actiegericht: "Launch Week", "Content Batching Week", "Sales Sprint", "Zichtbaarheid Week", "Systemen Week"
- milestones zijn concrete, meetbare resultaten (geen vage statements)
- kpiTargets worden afgeleid van het doel: gebruik sleutels zoals revenue, clients, followers, completions, kg etc.
- initialCoachNote is brutally honest strategisch advies, NOOIT algemene motivatie. Max 2 zinnen.
- Schrijf in het Nederlands`
      )
      clearInterval(stepTimer)
      const result = parseJSON(text) as SprintRoadmap
      setRoadmap(id, result)
      setRoadmapLocal(result)
      setGenStep(GEN_STEPS.length - 1)
      setTimeout(() => setStep('ready'), 600)
    } catch (e: any) {
      clearInterval(stepTimer)
      setError(e.message)
      setStep('goal')
    }
  }

  function launch() {
    activateSprint(sprintId)
  }

  if (step === 'generating') {
    return (
      <div style={{ minHeight: '80vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 32 }}>
        <div style={{ position: 'relative', width: 120, height: 120 }}>
          <Ring pct={(genStep / (GEN_STEPS.length - 1)) * 100} size={120} stroke={4} />
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Target size={28} color={ACCENT} />
          </div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontSize: 18, fontWeight: 700, color: 'var(--color-ink)', letterSpacing: '-0.02em', marginBottom: 8 }}>
            Roadmap wordt gebouwd
          </p>
          <p style={{ fontSize: 13, color: 'var(--color-subtle)', fontFamily: 'var(--font-mono)', letterSpacing: '0.06em' }}>
            {GEN_STEPS[genStep]}
          </p>
        </div>
      </div>
    )
  }

  if (step === 'ready' && roadmap) {
    return (
      <div style={{ maxWidth: 600, margin: '0 auto', padding: '60px 24px' }}>
        <div style={{ marginBottom: 40 }}>
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: ACCENT, fontFamily: 'var(--font-mono)', marginBottom: 12 }}>Sprint klaar</p>
          <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.03em', color: 'var(--color-ink)', lineHeight: 1.2, marginBottom: 8 }}>
            {goal}
          </h1>
          <p style={{ fontSize: 14, color: 'var(--color-subtle)', lineHeight: 1.6 }}>
            90 dagen · {TODAY} tot {new Date(new Date(TODAY).getTime() + 89 * 86400000).toLocaleDateString('nl-BE', { day: 'numeric', month: 'long' })}
          </p>
        </div>

        {/* 3 months */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 32 }}>
          {roadmap.months.map((m, i) => (
            <div key={i} className="card" style={{ padding: '16px 20px', display: 'flex', gap: 16, alignItems: 'flex-start' }}>
              <div style={{ width: 28, height: 28, borderRadius: 16, background: `rgba(76,100,129,${0.12 + i * 0.06})`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span style={{ fontSize: 10, fontWeight: 800, color: ACCENT, fontFamily: 'var(--font-mono)' }}>M{i + 1}</span>
              </div>
              <div>
                <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-ink)', marginBottom: 2 }}>{m.title}</p>
                <p style={{ fontSize: 12, color: 'var(--color-subtle)', lineHeight: 1.5 }}>{m.focus}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Coach note */}
        {roadmap.initialCoachNote && (
          <div style={{ padding: '16px 20px', borderRadius: 12, background: `rgba(76,100,129,0.07)`, border: `1px solid rgba(76,100,129,0.15)`, marginBottom: 32 }}>
            <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.10em', textTransform: 'uppercase', color: ACCENT, fontFamily: 'var(--font-mono)', marginBottom: 6 }}>Coach</p>
            <p style={{ fontSize: 13, color: 'var(--color-ink)', lineHeight: 1.6, fontStyle: 'italic' }}>{roadmap.initialCoachNote}</p>
          </div>
        )}

        <button
          onClick={launch}
          style={{ width: '100%', padding: '16px', borderRadius: 14, border: 'none', background: 'var(--color-ink)', color: 'var(--color-bg)', fontSize: 15, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', letterSpacing: '-0.01em', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
        >
          Sprint starten <ChevronRight size={16} />
        </button>
      </div>
    )
  }

  // Goal input
  return (
    <div style={{ maxWidth: 560, margin: '0 auto', padding: '80px 24px' }}>
      <div style={{ marginBottom: 48 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
          <div style={{ width: 36, height: 36, borderRadius: 16, background: `rgba(76,100,129,0.10)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Target size={18} color={ACCENT} />
          </div>
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: ACCENT, fontFamily: 'var(--font-mono)' }}>90-Day Sprint</span>
        </div>
        <h1 style={{ fontSize: 30, fontWeight: 800, letterSpacing: '-0.03em', color: 'var(--color-ink)', lineHeight: 1.2, marginBottom: 12 }}>
          Wat is jouw ONE<br />outcome voor de<br />komende 90 dagen?
        </h1>
        <p style={{ fontSize: 14, color: 'var(--color-subtle)', lineHeight: 1.6 }}>
          Eén doel. Alles in Laurence OS richt zich hierop.
        </p>
      </div>

      {error && (
        <div style={{ padding: '12px 16px', borderRadius: 16, background: 'rgba(160,80,80,0.08)', border: '1px solid rgba(160,80,80,0.2)', marginBottom: 20, fontSize: 12, color: 'var(--color-muted)' }}>
          {error} — probeer opnieuw
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <input
          autoFocus
          value={goal}
          onChange={e => setGoal(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && goal.trim() && generate()}
          placeholder="100K omzet · 10 nieuwe klanten · Ironman finish · 100K Instagram..."
          style={{ width: '100%', padding: '16px 18px', borderRadius: 12, border: '1.5px solid var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-ink)', fontSize: 16, fontFamily: 'inherit', fontWeight: 600, outline: 'none', boxSizing: 'border-box', transition: 'border-color 150ms' }}
          onFocus={e => e.target.style.borderColor = ACCENT}
          onBlur={e => e.target.style.borderColor = 'var(--color-border)'}
        />

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <div>
            <label style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.10em', textTransform: 'uppercase', color: 'var(--color-subtle)', fontFamily: 'var(--font-mono)', display: 'block', marginBottom: 6 }}>Doelwaarde (optioneel)</label>
            <input
              type="number"
              value={targetValue}
              onChange={e => setTargetValue(e.target.value)}
              placeholder="100000"
              style={{ width: '100%', padding: '10px 14px', borderRadius: 16, border: '1px solid var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-ink)', fontSize: 14, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }}
            />
          </div>
          <div>
            <label style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.10em', textTransform: 'uppercase', color: 'var(--color-subtle)', fontFamily: 'var(--font-mono)', display: 'block', marginBottom: 6 }}>Eenheid</label>
            <input
              value={targetUnit}
              onChange={e => setTargetUnit(e.target.value)}
              placeholder="€ · kg · clients · followers..."
              style={{ width: '100%', padding: '10px 14px', borderRadius: 16, border: '1px solid var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-ink)', fontSize: 14, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }}
            />
          </div>
        </div>

        <div>
          <label style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.10em', textTransform: 'uppercase', color: 'var(--color-subtle)', fontFamily: 'var(--font-mono)', display: 'block', marginBottom: 6 }}>Context voor de AI (optioneel)</label>
          <textarea
            value={context}
            onChange={e => setContext(e.target.value)}
            placeholder="Beschrijf je huidige situatie, beschikbare tijd, constraints, wat je al hebt gedaan..."
            rows={3}
            style={{ width: '100%', padding: '12px 14px', borderRadius: 16, border: '1px solid var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-ink)', fontSize: 13, fontFamily: 'inherit', outline: 'none', resize: 'vertical', boxSizing: 'border-box', lineHeight: 1.5 }}
          />
        </div>

        <button
          onClick={generate}
          disabled={!goal.trim()}
          style={{ padding: '16px', borderRadius: 12, border: 'none', background: goal.trim() ? 'var(--color-ink)' : 'var(--color-border)', color: goal.trim() ? 'var(--color-bg)' : 'var(--color-muted)', fontSize: 15, fontWeight: 800, cursor: goal.trim() ? 'pointer' : 'default', fontFamily: 'inherit', letterSpacing: '-0.01em', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, transition: 'all 200ms' }}
        >
          <Zap size={15} /> Genereer mijn 90-dag roadmap
        </button>
      </div>
    </div>
  )
}

// ── Task Card ────────────────────────────────────────────────────
function TaskCard({ task, index, onComplete }: { task: SprintTask; index: number; onComplete: () => void }) {
  const cat = CATEGORY_CFG[task.category]
  const pri = PRIORITY_CFG[task.priority]
  const eng = ENERGY_CFG[task.energy]

  return (
    <div style={{
      display: 'flex', alignItems: 'flex-start', gap: 18, padding: '20px 22px',
      background: task.completed ? 'transparent' : 'var(--color-card)',
      border: `1px solid ${task.completed ? 'var(--color-border)' : task.priority === 'critical' ? 'rgba(76,100,129,0.25)' : 'var(--color-border)'}`,
      borderRadius: 14, transition: 'all 300ms', opacity: task.completed ? 0.5 : 1,
    }}>
      {/* Number */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, paddingTop: 2 }}>
        <span style={{ fontSize: 10, fontWeight: 800, color: task.completed ? 'var(--color-border)' : ACCENT, fontFamily: 'var(--font-mono)', letterSpacing: '0.08em' }}>
          {String(index + 1).padStart(2, '0')}
        </span>
        {task.priority === 'critical' && !task.completed && (
          <div style={{ width: 4, height: 4, borderRadius: '50%', background: '#C4935A' }} />
        )}
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 15, fontWeight: 700, color: task.completed ? 'var(--color-muted)' : 'var(--color-ink)', letterSpacing: '-0.01em', marginBottom: 6, textDecoration: task.completed ? 'line-through' : 'none', lineHeight: 1.3 }}>
          {task.title}
        </p>
        {!task.completed && (
          <p style={{ fontSize: 12, color: 'var(--color-subtle)', lineHeight: 1.5, marginBottom: 10, fontStyle: 'italic' }}>
            {task.reason}
          </p>
        )}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 99, background: `${cat.color}14`, color: cat.color, fontFamily: 'var(--font-mono)', letterSpacing: '0.04em' }}>{cat.label}</span>
          <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 99, background: 'var(--color-surface)', color: 'var(--color-muted)', fontFamily: 'var(--font-mono)' }}>{task.duration} min</span>
          <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 99, background: 'var(--color-surface)', color: 'var(--color-subtle)', display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ width: 5, height: 5, borderRadius: '50%', background: eng.dot, display: 'inline-block' }} />
            {eng.label}
          </span>
          {task.priority === 'critical' && (
            <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 99, background: 'rgba(196,147,90,0.12)', color: '#C4935A', fontFamily: 'var(--font-mono)' }}>Kritiek</span>
          )}
        </div>
      </div>

      {/* Checkbox */}
      <button
        onClick={onComplete}
        disabled={task.completed}
        style={{ width: 30, height: 30, borderRadius: 9, border: `2px solid ${task.completed ? '#6DB889' : 'var(--color-border)'}`, background: task.completed ? '#6DB889' : 'transparent', cursor: task.completed ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2, transition: 'all 200ms' }}
      >
        {task.completed && <Check size={14} color="#fff" strokeWidth={3} />}
      </button>
    </div>
  )
}

// ── 13-Week Grid ─────────────────────────────────────────────────
function WeekGrid({ sprint }: { sprint: Sprint }) {
  const weeks = sprint.roadmap?.weeks ?? []
  const cw = currentWeek(sprint)
  const day = sprintDay(sprint)
  const [hovered, setHovered] = useState<number | null>(null)

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(13, 1fr)', gap: 6 }}>
        {Array.from({ length: 13 }, (_, i) => {
          const wn = i + 1
          const isPast = wn < cw
          const isCurrent = wn === cw
          const isFuture = wn > cw
          const weekData = weeks.find(w => w.weekNumber === wn)
          const weekDayStart = (wn - 1) * 7 + 1
          const weekDayEnd = Math.min(wn * 7, 90)
          const completedInWeek = sprint.completedDates.filter(d => {
            const dday = daysBetween(sprint.startDate, d) + 1
            return dday >= weekDayStart && dday <= weekDayEnd
          }).length
          const totalDaysInWeek = isPast ? 7 : isCurrent ? ((day - 1) % 7) + 1 : 0

          return (
            <div
              key={wn}
              onMouseEnter={() => setHovered(wn)}
              onMouseLeave={() => setHovered(null)}
              style={{ position: 'relative' }}
            >
              <div style={{
                aspectRatio: '1', borderRadius: 16, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 3, cursor: 'default',
                border: `1.5px solid ${isCurrent ? ACCENT : 'var(--color-border)'}`,
                background: isCurrent ? `rgba(76,100,129,0.08)` : isPast ? (completedInWeek >= totalDaysInWeek * 0.7 ? 'rgba(109,184,137,0.06)' : 'var(--color-surface)') : 'transparent',
                transition: 'all 200ms',
              }}>
                <span style={{ fontSize: 9, fontWeight: 800, fontFamily: 'var(--font-mono)', color: isCurrent ? ACCENT : isPast ? 'var(--color-muted)' : 'var(--color-border)', letterSpacing: '0.06em' }}>W{wn}</span>
                {isPast && (
                  <div style={{ display: 'flex', gap: 2 }}>
                    {[...Array(Math.min(3, Math.round((completedInWeek / 7) * 3)))].map((_, j) => (
                      <div key={j} style={{ width: 3, height: 3, borderRadius: '50%', background: '#6DB889' }} />
                    ))}
                  </div>
                )}
                {isCurrent && <Flame size={8} color={ACCENT} />}
              </div>
              {/* Tooltip */}
              {hovered === wn && weekData && (
                <div style={{ position: 'absolute', bottom: 'calc(100% + 8px)', left: '50%', transform: 'translateX(-50%)', background: 'var(--color-ink)', color: 'var(--color-bg)', padding: '8px 12px', borderRadius: 16, fontSize: 11, whiteSpace: 'nowrap', zIndex: 50, minWidth: 160, lineHeight: 1.5 }}>
                  <p style={{ fontWeight: 700, marginBottom: 2 }}>{weekData.theme}</p>
                  <p style={{ opacity: 0.7, fontSize: 10 }}>{weekData.focus}</p>
                </div>
              )}
            </div>
          )
        })}
      </div>
      {/* Current week theme */}
      {weeks[cw - 1] && (
        <div style={{ marginTop: 14, padding: '12px 16px', borderRadius: 16, background: `rgba(76,100,129,0.06)`, border: `1px solid rgba(76,100,129,0.12)` }}>
          <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: ACCENT, fontFamily: 'var(--font-mono)', marginBottom: 3 }}>Week {cw} · {weeks[cw - 1].theme}</p>
          <p style={{ fontSize: 12, color: 'var(--color-subtle)', lineHeight: 1.5 }}>{weeks[cw - 1].focus}</p>
          {weeks[cw - 1].milestones?.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 8 }}>
              {weeks[cw - 1].milestones.map((m, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                  <span style={{ color: ACCENT, fontSize: 10, marginTop: 2, flexShrink: 0 }}>→</span>
                  <p style={{ fontSize: 12, color: 'var(--color-muted)', lineHeight: 1.4 }}>{m}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Sprint Dashboard ─────────────────────────────────────────────
function SprintDashboard({ sprint }: { sprint: Sprint }) {
  const { setDailyPlan, completeTask, markDayComplete, updateCurrentValue, archiveSprint } = useSprintStore()
  const [generating, setGenerating] = useState(false)
  const [genError, setGenError] = useState<string | null>(null)
  const [editValue, setEditValue] = useState(false)
  const [valueDraft, setValueDraft] = useState(String(sprint.currentValue ?? ''))

  const todayPlan = sprint.dailyPlans[TODAY]
  const day = sprintDay(sprint)
  const cw = currentWeek(sprint)
  const weekData = sprint.roadmap?.weeks.find(w => w.weekNumber === cw)
  const monthIndex = Math.min(2, Math.floor((day - 1) / 30))
  const monthData = sprint.roadmap?.months[monthIndex]
  const sprintPct = sprintPercent(sprint)
  const goalPct = goalPercent(sprint)
  const momentum = momentumScore(sprint, todayPlan)
  const allDone = todayPlan?.top3.every(t => t.completed) ?? false

  useEffect(() => {
    if (allDone && todayPlan && !sprint.completedDates.includes(TODAY)) {
      markDayComplete(sprint.id, TODAY)
    }
  }, [allDone])

  async function generateDay() {
    setGenerating(true)
    setGenError(null)
    try {
      const text = await callAI(
        'Je bent de executie-AI van Laurence OS. Jij bent de CEO coach, COO en strategist in één. Genereer uitsluitend geldig JSON.',
        `SPRINT DOEL: ${sprint.goal}
SPRINT DAG: ${day} van 90
DATUM: ${fmtDate(TODAY)}
WEEK THEMA: ${weekData?.theme ?? 'Uitvoering'}
MAAND FOCUS: ${monthData?.focus ?? sprint.goal}
CONTEXT: ${sprint.goalContext || 'geen extra context'}
${sprint.currentValue && sprint.targetValue ? `VOORTGANG: ${sprint.currentValue} / ${sprint.targetValue} ${sprint.targetUnit ?? ''}` : ''}
VOLTOOIDE DAGEN: ${sprint.completedDates.length}

Genereer het perfecte dagplan voor vandaag:
{
  "mission": "één concrete zin die begint met 'Vandaag'",
  "top3": [
    {
      "title": "concrete actie",
      "duration": number,
      "priority": "critical|high|medium",
      "energy": "deep|medium|light",
      "reason": "waarom dit vandaag de hoogste leverage heeft — max 1 brutaal eerlijke zin",
      "category": "sales|content|admin|workout|deep-work|meetings|personal|learning"
    }
  ],
  "coachInsight": "specifieke strategische observatie + één concrete actie — nooit algemeen, nooit motivationeel"
}

Regels:
- mission is ultra-concreet, niet vaag
- top3 bevat ALTIJD exact 3 items, geordend op leverage
- Eerste taak is altijd de hoogste leverage actie van de dag
- reason is brutally honest — benoem de echte zakelijke reden
- coachInsight observeert een patroon of risico en geeft één concrete actie
- Schrijf in het Nederlands`
      )
      const result = parseJSON(text)
      const plan: DailyPlan = {
        date: TODAY,
        mission: result.mission,
        top3: result.top3.map((t: any) => ({ ...t, id: crypto.randomUUID(), completed: false })),
        coachInsight: result.coachInsight,
        generatedAt: new Date().toISOString(),
      }
      setDailyPlan(sprint.id, plan)
    } catch (e: any) {
      setGenError(e.message)
    } finally {
      setGenerating(false)
    }
  }

  function doCompleteTask(taskId: string) {
    completeTask(sprint.id, TODAY, taskId)
  }

  function saveValue() {
    updateCurrentValue(sprint.id, Number(valueDraft))
    setEditValue(false)
  }

  const completedCount = todayPlan?.top3.filter(t => t.completed).length ?? 0

  return (
    <div style={{ maxWidth: 700, margin: '0 auto' }}>

      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 32 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <Target size={14} color={ACCENT} />
            <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: ACCENT, fontFamily: 'var(--font-mono)' }}>90-Day Sprint · Dag {day}</span>
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--color-ink)', lineHeight: 1.2, marginBottom: 4 }}>
            {sprint.goal}
          </h1>
          <p style={{ fontSize: 12, color: 'var(--color-subtle)', fontFamily: 'var(--font-mono)' }}>
            {fmtDate(TODAY)}
          </p>
        </div>
        <button
          onClick={() => { if (confirm('Sprint archiveren?')) archiveSprint(sprint.id) }}
          style={{ padding: '6px 10px', borderRadius: 16, border: '1px solid var(--color-border)', background: 'transparent', color: 'var(--color-subtle)', fontSize: 11, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 5 }}
        >
          <RotateCcw size={11} /> Reset
        </button>
      </div>

      {/* ── Mission ── */}
      <div style={{ marginBottom: 28 }}>
        {todayPlan ? (
          <div style={{ padding: '22px 24px', borderRadius: 14, background: 'var(--color-card)', border: '1px solid var(--color-border)' }}>
            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--color-subtle)', fontFamily: 'var(--font-mono)', marginBottom: 10 }}>Missie van vandaag</p>
            <p style={{ fontSize: 18, fontWeight: 600, color: 'var(--color-ink)', lineHeight: 1.45, letterSpacing: '-0.01em', fontFamily: 'var(--font-serif)', fontStyle: 'italic' }}>
              {todayPlan.mission}
            </p>
            {todayPlan.top3.length > 0 && (
              <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ flex: 1, height: 3, borderRadius: 99, background: 'var(--color-border)', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${(completedCount / 3) * 100}%`, background: completedCount === 3 ? '#6DB889' : ACCENT, borderRadius: 99, transition: 'width 500ms ease' }} />
                </div>
                <span style={{ fontSize: 11, fontWeight: 700, color: completedCount === 3 ? '#6DB889' : ACCENT, fontFamily: 'var(--font-mono)', whiteSpace: 'nowrap' }}>
                  {completedCount}/3 {completedCount === 3 ? '✓ Dag voltooid' : ''}
                </span>
              </div>
            )}
          </div>
        ) : (
          <div style={{ padding: '28px 24px', borderRadius: 14, border: `1.5px dashed var(--color-border)`, textAlign: 'center' }}>
            <p style={{ fontSize: 14, color: 'var(--color-subtle)', marginBottom: 16, lineHeight: 1.5 }}>
              Geen dagplan gegenereerd.<br />Laat Laurence OS je beste dag bouwen.
            </p>
            {genError && <p style={{ fontSize: 11, color: 'var(--color-muted)', marginBottom: 12 }}>Fout: {genError}</p>}
            <button
              onClick={generateDay}
              disabled={generating}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '12px 22px', borderRadius: 11, border: 'none', background: 'var(--color-ink)', color: 'var(--color-bg)', fontSize: 13, fontWeight: 700, cursor: generating ? 'default' : 'pointer', fontFamily: 'inherit', opacity: generating ? 0.7 : 1, transition: 'opacity 150ms' }}
            >
              {generating ? <><RefreshCw size={13} style={{ animation: 'spin 1s linear infinite' }} /> Dagplan bouwen...</> : <><Zap size={13} /> Plan mijn dag</>}
            </button>
          </div>
        )}
      </div>

      {/* ── Top 3 ── */}
      {todayPlan && todayPlan.top3.length > 0 && (
        <div style={{ marginBottom: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--color-subtle)', fontFamily: 'var(--font-mono)' }}>Top 3 prioriteiten</p>
            <button
              onClick={generateDay}
              disabled={generating}
              style={{ fontSize: 10, color: 'var(--color-subtle)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 4 }}
            >
              <RefreshCw size={10} /> Vernieuwen
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {todayPlan.top3.map((task, i) => (
              <TaskCard key={task.id} task={task} index={i} onComplete={() => doCompleteTask(task.id)} />
            ))}
          </div>
        </div>
      )}

      {/* ── AI Coach ── */}
      {todayPlan?.coachInsight && (
        <div style={{ marginBottom: 28, padding: '16px 20px', borderRadius: 12, background: `rgba(76,100,129,0.06)`, border: `1px solid rgba(76,100,129,0.15)` }}>
          <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: ACCENT, fontFamily: 'var(--font-mono)', marginBottom: 6 }}>Coach</p>
          <p style={{ fontSize: 13, color: 'var(--color-ink)', lineHeight: 1.65, fontStyle: 'italic' }}>{todayPlan.coachInsight}</p>
        </div>
      )}

      {/* ── Progress ── */}
      <div style={{ marginBottom: 28 }}>
        <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--color-subtle)', fontFamily: 'var(--font-mono)', marginBottom: 14 }}>Voortgang</p>
        <div style={{ display: 'grid', gridTemplateColumns: sprint.targetValue ? '1fr 1fr' : '1fr', gap: 12 }}>
          {/* Sprint days */}
          <div className="card" style={{ padding: '18px 20px', display: 'flex', alignItems: 'center', gap: 16 }}>
            <Ring pct={sprintPct} size={56} stroke={4} />
            <div>
              <p style={{ fontSize: 20, fontWeight: 800, color: 'var(--color-ink)', letterSpacing: '-0.02em', lineHeight: 1, fontFamily: 'var(--font-mono)', marginBottom: 2 }}>{day}<span style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-subtle)' }}>/90</span></p>
              <p style={{ fontSize: 11, color: 'var(--color-subtle)' }}>Sprint dagen</p>
              <p style={{ fontSize: 10, color: ACCENT, fontFamily: 'var(--font-mono)', fontWeight: 700, marginTop: 2 }}>{sprintPct}% van de tijd</p>
            </div>
          </div>

          {/* Goal value */}
          {sprint.targetValue && (
            <div className="card" style={{ padding: '18px 20px', display: 'flex', alignItems: 'center', gap: 16 }}>
              <Ring pct={goalPct} size={56} stroke={4} color={goalPct >= 100 ? '#6DB889' : '#C4935A'} />
              <div style={{ flex: 1, minWidth: 0 }}>
                {editValue ? (
                  <div style={{ display: 'flex', gap: 6, marginBottom: 4 }}>
                    <input
                      autoFocus
                      type="number"
                      value={valueDraft}
                      onChange={e => setValueDraft(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') saveValue(); if (e.key === 'Escape') setEditValue(false) }}
                      style={{ width: 80, padding: '4px 8px', borderRadius: 7, border: `1px solid ${ACCENT}`, background: 'var(--color-surface)', color: 'var(--color-ink)', fontSize: 13, fontFamily: 'var(--font-mono)', outline: 'none' }}
                    />
                    <button onClick={saveValue} style={{ padding: '4px 10px', borderRadius: 7, border: 'none', background: ACCENT, color: '#fff', fontSize: 11, cursor: 'pointer', fontFamily: 'inherit' }}>OK</button>
                  </div>
                ) : (
                  <p onClick={() => { setValueDraft(String(sprint.currentValue ?? '')); setEditValue(true) }}
                    style={{ fontSize: 15, fontWeight: 800, color: 'var(--color-ink)', letterSpacing: '-0.02em', lineHeight: 1, fontFamily: 'var(--font-mono)', marginBottom: 2, cursor: 'text' }}>
                    {sprint.currentValue ?? '—'}<span style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-subtle)' }}>/{sprint.targetValue} {sprint.targetUnit}</span>
                  </p>
                )}
                <p style={{ fontSize: 11, color: 'var(--color-subtle)' }}>Doelvoortgang</p>
                <p style={{ fontSize: 10, color: goalPct >= 100 ? '#6DB889' : '#C4935A', fontFamily: 'var(--font-mono)', fontWeight: 700, marginTop: 2 }}>{goalPct}% bereikt</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Momentum ── */}
      <div style={{ marginBottom: 28 }}>
        <div className="card" style={{ padding: '20px 22px', display: 'flex', alignItems: 'center', gap: 20 }}>
          <div style={{ position: 'relative', width: 72, height: 72, flexShrink: 0 }}>
            <Ring pct={momentum / 10} size={72} stroke={5} color={momentum >= 700 ? '#6DB889' : momentum >= 400 ? '#C4935A' : ACCENT} />
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: 16, fontWeight: 800, color: 'var(--color-ink)', fontFamily: 'var(--font-mono)', letterSpacing: '-0.02em' }}>{momentum}</span>
            </div>
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--color-subtle)', fontFamily: 'var(--font-mono)', marginBottom: 4 }}>Momentum Score</p>
            <p style={{ fontSize: 16, fontWeight: 800, color: momentum >= 700 ? '#6DB889' : momentum >= 400 ? '#C4935A' : 'var(--color-ink)', letterSpacing: '-0.01em', marginBottom: 6 }}>
              {momentum >= 700 ? 'Op fire' : momentum >= 400 ? 'Goed bezig' : momentum === 0 ? 'Klaar voor start' : 'Bouw momentum'}
            </p>
            <div style={{ display: 'flex', gap: 16 }}>
              <div>
                <p style={{ fontSize: 18, fontWeight: 800, color: 'var(--color-ink)', fontFamily: 'var(--font-mono)', lineHeight: 1 }}>{sprint.completedDates.length}</p>
                <p style={{ fontSize: 10, color: 'var(--color-subtle)' }}>Voltooide dagen</p>
              </div>
              <div>
                <p style={{ fontSize: 18, fontWeight: 800, color: 'var(--color-ink)', fontFamily: 'var(--font-mono)', lineHeight: 1 }}>{completedCount}/3</p>
                <p style={{ fontSize: 10, color: 'var(--color-subtle)' }}>Vandaag</p>
              </div>
              <div>
                <p style={{ fontSize: 18, fontWeight: 800, color: 'var(--color-ink)', fontFamily: 'var(--font-mono)', lineHeight: 1 }}>{day > 1 ? Math.round((sprint.completedDates.length / (day - 1)) * 100) : 0}%</p>
                <p style={{ fontSize: 10, color: 'var(--color-subtle)' }}>Consistentie</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── 13-Week Grid ── */}
      {sprint.roadmap && (
        <div style={{ marginBottom: 32 }}>
          <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--color-subtle)', fontFamily: 'var(--font-mono)', marginBottom: 14 }}>Sprint Overzicht — 13 weken</p>
          <WeekGrid sprint={sprint} />
        </div>
      )}

      <style>{`@keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }`}</style>
    </div>
  )
}

// ── Main ─────────────────────────────────────────────────────────
export function Sprint() {
  const { activeSprint } = useSprintStore()
  const sprint = activeSprint()
  return sprint ? <SprintDashboard sprint={sprint} /> : <SprintSetup />
}
