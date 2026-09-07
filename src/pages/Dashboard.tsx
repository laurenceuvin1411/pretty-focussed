import { useState, useMemo, useRef } from 'react'
import { format, differenceInDays, parseISO } from 'date-fns'
import { nlBE } from 'date-fns/locale'
import { Link } from 'react-router-dom'
import {
  Moon, Zap, Dumbbell, Droplets, TrendingUp, TrendingDown,
  Users, ArrowRight, AlertTriangle, RefreshCw, Clock,
  CheckCircle, Circle, ChevronRight, Sparkles, Target,
  BarChart2, Heart, Minus, Plus,
} from 'lucide-react'

import { useHabitStore } from '../store/habitStore'
import { useTaskStore } from '../store/taskStore'
import { useLeadStore } from '../store/leadStore'
import { useSalesFinanceStore } from '../store/salesFinanceStore'
import { useRecurringInvoiceStore, isDueThisMonth } from '../store/recurringInvoiceStore'
import { useHealthStore } from '../store/healthStore'
import { useProjectDataStore, useProjectStore, getPeriodKey } from '../store/projectStore'
import { computePerformanceScore, scoreLabel } from '../utils/performanceScore'
import { isOwner, firstName } from '../lib/workspace'

const TODAY = format(new Date(), 'yyyy-MM-dd')
const NOW_HOUR = new Date().getHours()

function greeting() {
  if (NOW_HOUR < 5)  return 'Nog aan het werk?'
  if (NOW_HOUR < 12) return 'Goedemorgen'
  if (NOW_HOUR < 17) return 'Goedemiddag'
  if (NOW_HOUR < 21) return 'Goedenavond'
  return 'Goede nacht'
}

// ── Performance Score Ring ─────────────────────────────────────────────────
function ScoreRing({ score, size = 120 }: { score: number; size?: number }) {
  const r = (size - 10) / 2
  const circ = 2 * Math.PI * r
  const offset = circ - (score / 100) * circ
  const { color, label } = scoreLabel(score)

  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--color-border)" strokeWidth={6} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={6}
          strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 1.2s cubic-bezier(.16,1,.3,1)' }} />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
        <span style={{ fontSize: size < 100 ? 22 : 32, fontWeight: 900, color, fontVariantNumeric: 'tabular-nums', lineHeight: 1, fontFamily: 'Syne, sans-serif' }}>
          {score}
        </span>
        <span style={{ fontSize: 9, fontWeight: 700, color: 'var(--color-subtle)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
          {label}
        </span>
      </div>
    </div>
  )
}

// ── Mini metric pill ───────────────────────────────────────────────────────
function MetricPill({ icon, value, label, color, to }: {
  icon: React.ReactNode; value: string; label: string; color: string; to?: string
}) {
  const content = (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '12px 16px', borderRadius: 12,
      background: 'var(--color-card)', border: '1px solid var(--color-border)',
      cursor: to ? 'pointer' : 'default',
      transition: 'border-color 150ms',
    }}>
      <div style={{ color, flexShrink: 0 }}>{icon}</div>
      <div>
        <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--color-ink)', fontVariantNumeric: 'tabular-nums', lineHeight: 1.1 }}>{value}</div>
        <div style={{ fontSize: 10, color: 'var(--color-subtle)', fontWeight: 600, marginTop: 2 }}>{label}</div>
      </div>
    </div>
  )
  return to ? <Link to={to} style={{ textDecoration: 'none' }}>{content}</Link> : content
}

// ── Score dimension bar ────────────────────────────────────────────────────
function DimBar({ label, score, color }: { label: string; score: number; color: string }) {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={{ fontSize: 11, color: 'var(--color-muted)', fontWeight: 600 }}>{label}</span>
        <span style={{ fontSize: 11, color, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{score}%</span>
      </div>
      <div style={{ height: 4, borderRadius: 4, background: 'var(--color-border)', overflow: 'hidden' }}>
        <div style={{
          height: '100%', borderRadius: 4, background: color,
          width: `${score}%`, transition: 'width 1s cubic-bezier(.16,1,.3,1)',
        }} />
      </div>
    </div>
  )
}

// ── Intelligence alert ─────────────────────────────────────────────────────
interface Alert { id: string; text: string; urgency: 'critical' | 'high' | 'medium'; to: string }

const FISCAL_DEADLINES = [
  { label: 'Sociale bijdragen Q2',   date: '2026-06-30', link: '/lu-admin', urgency: 'high'   as const },
  { label: 'Voorafbetaling VA2',      date: '2026-07-10', link: '/lu-admin', urgency: 'high'   as const },
  { label: 'BTW-aangifte Q2',         date: '2026-07-20', link: '/finance',  urgency: 'medium' as const },
  { label: 'Sociale bijdragen Q3',    date: '2026-09-30', link: '/lu-admin', urgency: 'high'   as const },
  { label: 'Voorafbetaling VA3',      date: '2026-10-12', link: '/lu-admin', urgency: 'high'   as const },
  { label: 'BTW-aangifte Q3',         date: '2026-10-20', link: '/finance',  urgency: 'medium' as const },
  { label: 'Sociale bijdragen Q4',    date: '2026-12-31', link: '/lu-admin', urgency: 'high'   as const },
  { label: 'Voorafbetaling VA4',      date: '2026-12-22', link: '/lu-admin', urgency: 'high'   as const },
  { label: 'BTW-aangifte Q4',         date: '2027-01-20', link: '/finance',  urgency: 'medium' as const },
]

// ── Health quick-log (inline on dashboard) ─────────────────────────────────
function HealthQuickLog() {
  const { getLog, upsertLog } = useHealthStore()
  const log = getLog(TODAY)

  const set = (u: Parameters<typeof upsertLog>[1]) => upsertLog(TODAY, u)

  return (
    <div style={{
      padding: '18px 22px', borderRadius: 14,
      background: 'var(--color-card)', border: '1px solid var(--color-border)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Heart size={14} color="var(--color-subtle)" />
          <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'var(--color-muted)' }}>
            Health check-in
          </span>
        </div>
        <Link to="/health" style={{ fontSize: 11, color: 'var(--color-accent)', textDecoration: 'none', fontWeight: 600 }}>
          Volledig →
        </Link>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
        {/* Sleep */}
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 10, color: 'var(--color-subtle)', fontWeight: 600, marginBottom: 6 }}>SLAAP</div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
            <button onClick={() => set({ sleepHours: Math.max(0, log.sleepHours - 0.5) })}
              style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 14, padding: '2px 6px', cursor: 'pointer', color: 'var(--color-muted)' }}>
              <Minus size={10} />
            </button>
            <span style={{ fontSize: 15, fontWeight: 800, color: '#7AACCF', fontVariantNumeric: 'tabular-nums', minWidth: 36, textAlign: 'center' }}>
              {log.sleepHours.toFixed(1)}u
            </span>
            <button onClick={() => set({ sleepHours: Math.min(12, log.sleepHours + 0.5) })}
              style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 14, padding: '2px 6px', cursor: 'pointer', color: 'var(--color-muted)' }}>
              <Plus size={10} />
            </button>
          </div>
        </div>

        {/* Energy */}
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 10, color: 'var(--color-subtle)', fontWeight: 600, marginBottom: 6 }}>ENERGIE</div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
            <button onClick={() => set({ energyLevel: Math.max(1, log.energyLevel - 1) })}
              style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 14, padding: '2px 6px', cursor: 'pointer', color: 'var(--color-muted)' }}>
              <Minus size={10} />
            </button>
            <span style={{ fontSize: 15, fontWeight: 800, color: '#7C7F84', fontVariantNumeric: 'tabular-nums', minWidth: 36, textAlign: 'center' }}>
              {log.energyLevel}/10
            </span>
            <button onClick={() => set({ energyLevel: Math.min(10, log.energyLevel + 1) })}
              style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 14, padding: '2px 6px', cursor: 'pointer', color: 'var(--color-muted)' }}>
              <Plus size={10} />
            </button>
          </div>
        </div>

        {/* Workout */}
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 10, color: 'var(--color-subtle)', fontWeight: 600, marginBottom: 6 }}>TRAINING</div>
          <button
            onClick={() => set({ workout: !log.workout })}
            style={{
              padding: '5px 14px', borderRadius: 20, cursor: 'pointer', fontSize: 12, fontWeight: 700,
              background: log.workout ? 'var(--color-action)' : 'var(--color-surface)',
              color: log.workout ? '#fff' : 'var(--color-muted)',
              border: `1px solid ${log.workout ? 'var(--color-action)' : 'var(--color-border)'}`,
              transition: 'all 200ms',
            }}
          >
            {log.workout ? '✓ Gedaan' : 'Nee'}
          </button>
        </div>

        {/* Water */}
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 10, color: 'var(--color-subtle)', fontWeight: 600, marginBottom: 6 }}>WATER</div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
            <button onClick={() => set({ waterGlasses: Math.max(0, log.waterGlasses - 1) })}
              style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 14, padding: '2px 6px', cursor: 'pointer', color: 'var(--color-muted)' }}>
              <Minus size={10} />
            </button>
            <span style={{ fontSize: 15, fontWeight: 800, color: '#38BDF8', fontVariantNumeric: 'tabular-nums', minWidth: 36, textAlign: 'center' }}>
              {log.waterGlasses}/8
            </span>
            <button onClick={() => set({ waterGlasses: Math.min(12, log.waterGlasses + 1) })}
              style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 14, padding: '2px 6px', cursor: 'pointer', color: 'var(--color-muted)' }}>
              <Plus size={10} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Today's Top 3 ──────────────────────────────────────────────────────────
function TopThree() {
  const { tasks, updateTask } = useTaskStore()
  const top3 = useMemo(() =>
    tasks
      .filter(t => t.status !== 'done' && (t.scheduledDate === TODAY || t.dueDate === TODAY || t.needleMover))
      .sort((a, b) => {
        if (a.needleMover && !b.needleMover) return -1
        if (!a.needleMover && b.needleMover) return 1
        const pa = a.priority === 'high' ? 0 : a.priority === 'medium' ? 1 : 2
        const pb = b.priority === 'high' ? 0 : b.priority === 'medium' ? 1 : 2
        return pa - pb
      })
      .slice(0, 3),
    [tasks]
  )

  if (top3.length === 0) return (
    <div style={{ padding: '18px 22px', borderRadius: 14, background: 'var(--color-card)', border: '1px solid var(--color-border)' }}>
      <p style={{ fontSize: 13, color: 'var(--color-subtle)', fontStyle: 'italic' }}>Geen urgente taken — plan je Top 3 in Focus.</p>
      <Link to="/tasks" style={{ fontSize: 12, color: 'var(--color-accent)', textDecoration: 'none', fontWeight: 600, display: 'block', marginTop: 8 }}>
        Open Focus →
      </Link>
    </div>
  )

  return (
    <div style={{ padding: '18px 22px', borderRadius: 14, background: 'var(--color-card)', border: '1px solid var(--color-border)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Target size={14} color="var(--color-accent)" />
          <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'var(--color-muted)' }}>
            Top 3 vandaag
          </span>
        </div>
        <Link to="/tasks" style={{ fontSize: 11, color: 'var(--color-accent)', textDecoration: 'none', fontWeight: 600 }}>
          Alle taken →
        </Link>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {top3.map((task, i) => (
          <button
            key={task.id}
            onClick={() => updateTask(task.id, { status: 'done' })}
            style={{
              display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px',
              borderRadius: 16, background: 'var(--color-surface)', border: '1px solid var(--color-border)',
              cursor: 'pointer', textAlign: 'left', transition: 'all 150ms',
            }}
          >
            <div style={{
              width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
              background: task.needleMover ? 'rgba(201,104,64,0.15)' : 'var(--color-card)',
              border: `1.5px solid ${task.needleMover ? '#C96840' : 'var(--color-border)'}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--color-subtle)', fontSize: 10, fontWeight: 700,
            }}>
              {i + 1}
            </div>
            <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-ink)', flex: 1, lineHeight: 1.3 }}>
              {task.title}
            </span>
            {task.needleMover && (
              <span style={{ fontSize: 9, padding: '2px 6px', borderRadius: 4, background: 'rgba(201,104,64,0.12)', color: '#C96840', fontWeight: 700 }}>
                NEEDLE
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  )
}

// ── Habit ring strip ───────────────────────────────────────────────────────
function HabitStrip() {
  const { habits, getLogForDate, getDailyScore } = useHabitStore()
  const active = habits.filter(h => h.active)
  const logs = getLogForDate(TODAY)
  const score = getDailyScore(TODAY)
  const done = logs.filter(l => l.completed).length

  if (active.length === 0) return null

  const pct = Math.round((done / active.length) * 100)

  return (
    <div style={{
      padding: '14px 22px', borderRadius: 14,
      background: 'var(--color-card)', border: '1px solid var(--color-border)',
      display: 'flex', alignItems: 'center', gap: 14,
    }}>
      <div style={{ position: 'relative', width: 48, height: 48, flexShrink: 0 }}>
        <svg width={48} height={48} style={{ transform: 'rotate(-90deg)' }}>
          <circle cx={24} cy={24} r={20} fill="none" stroke="var(--color-border)" strokeWidth={3.5} />
          <circle cx={24} cy={24} r={20} fill="none"
            stroke={pct >= 100 ? 'var(--color-action)' : pct >= 60 ? '#7C7F84' : 'var(--color-accent)'}
            strokeWidth={3.5}
            strokeDasharray={2 * Math.PI * 20}
            strokeDashoffset={2 * Math.PI * 20 - (pct / 100) * 2 * Math.PI * 20}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 800ms cubic-bezier(.16,1,.3,1)' }} />
        </svg>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontSize: 10, fontWeight: 800, color: 'var(--color-ink)', fontVariantNumeric: 'tabular-nums' }}>{pct}%</span>
        </div>
      </div>

      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-ink)', marginBottom: 3 }}>
          {done}/{active.length} habits
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          {active.map(h => {
            const done = logs.find(l => l.habitId === h.id)?.completed ?? false
            return (
              <div key={h.id} style={{
                width: 8, height: 8, borderRadius: '50%',
                background: done ? (h.color || 'var(--color-action)') : 'var(--color-border)',
                transition: 'background 300ms',
              }} />
            )
          })}
        </div>
      </div>

      <Link to="/habits" style={{ fontSize: 11, color: 'var(--color-accent)', textDecoration: 'none', fontWeight: 600, flexShrink: 0 }}>
        Loggen →
      </Link>
    </div>
  )
}

// ── Business metrics row ───────────────────────────────────────────────────
function BusinessRow() {
  const records = useSalesFinanceStore(s => s.records)
  const leads = useLeadStore(s => s.leads)
  const recurringItems = useRecurringInvoiceStore(s => s.items)

  const now = new Date()
  const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`

  const mtdRevenue = useMemo(() =>
    records
      .filter(r => r.wonAt >= monthStart && r.wonAt <= TODAY)
      .reduce((s, r) => s + r.amountExclVat, 0),
    [records]
  )

  const pipeline = useMemo(() =>
    leads
      .filter(l => !['won', 'lost'].includes(l.status))
      .reduce((s, l) => s + l.value * (l.probability / 100), 0),
    [leads]
  )

  const activeLeads = leads.filter(l => !['won', 'lost'].includes(l.status)).length
  const dueRecurring = recurringItems.filter(i => i.active && isDueThisMonth(i)).length

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
      <MetricPill
        icon={<BarChart2 size={16} />}
        value={`€${(mtdRevenue / 1000).toFixed(1)}k`}
        label="Omzet MTD"
        color="#4C6481"
        to="/finance"
      />
      <MetricPill
        icon={<TrendingUp size={16} />}
        value={`€${Math.round(pipeline / 1000)}k`}
        label="Pipeline"
        color="#7AACCF"
        to="/sales"
      />
      <MetricPill
        icon={<Users size={16} />}
        value={String(activeLeads)}
        label="Actieve leads"
        color="#7C7F84"
        to="/sales"
      />
      <MetricPill
        icon={<RefreshCw size={16} />}
        value={String(dueRecurring)}
        label="Te factureren"
        color={dueRecurring > 0 ? '#C96840' : 'var(--color-muted)'}
        to="/finance"
      />
    </div>
  )
}

// ── Intelligence alerts ────────────────────────────────────────────────────
function IntelligencePanel() {
  const records = useSalesFinanceStore(s => s.records)
  const recurringItems = useRecurringInvoiceStore(s => s.items)
  const { getLog } = useHealthStore()
  const healthLog = getLog(TODAY)
  const { projects } = useProjectDataStore()
  const completions = useProjectStore(s => s.completions)

  const alerts: Alert[] = useMemo(() => {
    const out: Alert[] = []
    const today = new Date()

    // Fiscal deadlines
    FISCAL_DEADLINES.forEach(d => {
      const days = differenceInDays(parseISO(d.date), today)
      if (days >= 0 && days <= 30) {
        const urgency = days <= 3 ? 'critical' : days <= 10 ? 'high' : 'medium'
        out.push({
          id: d.label,
          text: `${d.label} — ${days === 0 ? 'vandaag!' : `over ${days} dag${days !== 1 ? 'en' : ''}`}`,
          urgency,
          to: d.link,
        })
      }
    })

    // Recurring invoices due
    const dueRecurring = recurringItems.filter(i => i.active && isDueThisMonth(i))
    dueRecurring.forEach(item => {
      out.push({
        id: `rec-${item.id}`,
        text: `Terugkerende factuur te sturen: ${item.clientName} — €${item.amountExclVat.toLocaleString('nl-BE')}`,
        urgency: 'high',
        to: '/finance',
      })
    })

    // Overdue invoices (>21 days invoiced but not paid)
    const cutoff = new Date(today)
    cutoff.setDate(cutoff.getDate() - 21)
    records
      .filter(r => r.invoiced && !r.paid && r.wonAt < cutoff.toISOString())
      .slice(0, 3)
      .forEach(r => {
        out.push({
          id: `overdue-${r.id}`,
          text: `Factuur te laat: ${r.clientName} — €${r.totalInclVat.toLocaleString('nl-BE')}`,
          urgency: 'high',
          to: '/finance',
        })
      })

    // Checklist due dates — today or overdue
    projects.forEach(project => {
      project.checklists.forEach(checklist => {
        checklist.items.forEach(item => {
          if (!item.dueDate) return
          const daysUntil = differenceInDays(parseISO(item.dueDate), today)
          if (daysUntil > 7) return
          const periodKey = `${item.id}::${getPeriodKey(item.recurrence, today)}`
          const isDone = !!completions[periodKey]
          if (isDone) return
          const isOverdue = daysUntil < 0
          const isToday = daysUntil === 0
          const urgency = isOverdue ? 'critical' : isToday ? 'high' : 'medium'
          const when = isOverdue
            ? `${Math.abs(daysUntil)} dag${Math.abs(daysUntil) !== 1 ? 'en' : ''} verlopen`
            : isToday ? 'vandaag'
            : `over ${daysUntil} dag${daysUntil !== 1 ? 'en' : ''}`
          const projectPath = project.id === 'laurence-uvin' ? '/lu-admin' : project.id === 'bora' ? '/bora-admin' : `/projects/${project.id}`
          out.push({
            id: `checklist-${item.id}`,
            text: `${project.name}: ${item.title} — ${when}`,
            urgency,
            to: projectPath,
          })
        })
      })
    })

    // Health warnings — proactive coaching
    if (healthLog.sleepHours > 0 && healthLog.sleepHours < 6) {
      out.push({
        id: 'sleep-warning',
        text: `Slaap: ${healthLog.sleepHours}u — verwacht lager focus en slechtere beslissingen vandaag. Prioriteer herstel.`,
        urgency: 'high',
        to: '/health',
      })
    }

    return out.sort((a, b) => {
      const p = { critical: 0, high: 1, medium: 2 }
      return p[a.urgency] - p[b.urgency]
    })
  }, [records, recurringItems, healthLog, projects, completions])

  if (alerts.length === 0) return null

  const URGENCY_COLOR = { critical: 'var(--color-subtle)', high: '#7C7F84', medium: 'var(--color-subtle)' }
  const URGENCY_BG    = { critical: 'rgba(239,68,68,0.06)', high: 'rgba(245,158,11,0.06)', medium: 'var(--color-surface)' }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {alerts.map(a => (
        <Link key={a.id} to={a.to} style={{ textDecoration: 'none' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px',
            borderRadius: 12, background: URGENCY_BG[a.urgency],
            border: `1px solid ${URGENCY_COLOR[a.urgency]}30`,
            cursor: 'pointer', transition: 'border-color 150ms',
          }}>
            <AlertTriangle size={13} color={URGENCY_COLOR[a.urgency]} style={{ flexShrink: 0 }} />
            <span style={{ fontSize: 13, color: 'var(--color-ink)', flex: 1, lineHeight: 1.4 }}>{a.text}</span>
            <ChevronRight size={13} color="var(--color-subtle)" style={{ flexShrink: 0 }} />
          </div>
        </Link>
      ))}
    </div>
  )
}

// ── Main Dashboard ─────────────────────────────────────────────────────────
export function Dashboard() {
  const perf = useMemo(() => computePerformanceScore(TODAY), [])
  const { color } = scoreLabel(perf.total)

  const dateStr = format(new Date(), "EEEE d MMMM · 'Week' w", { locale: nlBE })
  const capitalised = dateStr.charAt(0).toUpperCase() + dateStr.slice(1)

  return (
    <div style={{ maxWidth: 800 }}>
      {/* ── Hero: Score + greeting ── */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 28,
        padding: '28px 32px', borderRadius: 20, marginBottom: 24,
        background: 'var(--color-card)', border: '1px solid var(--color-border)',
      }}>
        <ScoreRing score={perf.total} />

        <div style={{ flex: 1 }}>
          <p style={{ fontSize: 12, color: 'var(--color-subtle)', fontWeight: 600, letterSpacing: '0.06em', marginBottom: 4 }}>
            {capitalised}
          </p>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--color-ink)', fontFamily: 'Syne, sans-serif', marginBottom: 16 }}>
            {greeting()}, {firstName() || 'daar'}.
          </h1>

          {/* Dimension bars */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <DimBar label="Health"    score={perf.health}    color="#7AACCF" />
            <DimBar label="Habits"    score={perf.habits}    color="#4C6481" />
            <DimBar label="Execution" score={perf.execution} color="#7C7F84" />
            <DimBar label="Business"  score={perf.business}  color="#C96840" />
          </div>
        </div>
      </div>

      {/* ── Health check-in ── */}
      <div style={{ marginBottom: 14 }}>
        <HealthQuickLog />
      </div>

      {/* ── Business metrics ── */}
      <div style={{ marginBottom: 14 }}>
        <BusinessRow />
      </div>

      {/* ── Today's Top 3 + Habits side by side ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
        <TopThree />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <HabitStrip />

          {/* Quick nav tiles */}
          {[
            { to: '/sales',   label: 'Sales CRM',  sub: 'Pipeline & deals' },
            { to: '/finance', label: 'Finance',     sub: 'Facturen & BTW'  },
            { to: '/marketing', label: 'Content',   sub: 'AI Director'      },
          ].map(n => (
            <Link key={n.to} to={n.to} style={{ textDecoration: 'none' }}>
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '12px 16px', borderRadius: 12,
                background: 'var(--color-card)', border: '1px solid var(--color-border)',
                cursor: 'pointer', transition: 'border-color 150ms',
              }}>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-ink)' }}>{n.label}</div>
                  <div style={{ fontSize: 10, color: 'var(--color-subtle)', marginTop: 1 }}>{n.sub}</div>
                </div>
                <ChevronRight size={14} color="var(--color-subtle)" />
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* ── Intelligence Panel ── */}
      <IntelligencePanel />

      {/* ── Werk met Laurence: subtiel, alleen voor gasten ── */}
      {!isOwner() && (
        <Link to="/coaching" style={{ textDecoration: 'none', display: 'block', marginTop: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '18px 22px', borderRadius: 20, border: '1px solid rgba(255,255,255,0.7)', background: 'linear-gradient(135deg, rgba(242,220,227,0.5), rgba(255,255,255,0.7) 50%, rgba(214,229,238,0.45))', boxShadow: '0 4px 18px rgba(120,100,110,0.08)' }}>
            <div style={{ width: 38, height: 38, borderRadius: 14, background: 'rgba(76,100,129,0.10)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Sparkles size={16} color="#4C6481" />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#4C6481', fontFamily: 'var(--font-mono)', marginBottom: 3 }}>Werk met Laurence</p>
              <p style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--color-ink)', letterSpacing: '-0.01em' }}>Wil je hier sneller mee vooruit? Eén sessie of een volledig traject.</p>
            </div>
            <ArrowRight size={16} color="var(--color-muted)" style={{ flexShrink: 0 }} />
          </div>
        </Link>
      )}
    </div>
  )
}
