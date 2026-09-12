import { useState, useEffect } from 'react'
import { format, getDaysInMonth, startOfWeek, eachDayOfInterval, endOfWeek } from 'date-fns'
import { nlBE } from 'date-fns/locale'
import {
  ChevronLeft, ChevronRight, Flame, Star, Calendar, Check, Sparkles,
  Plus, Pencil, Trash2, Target, TrendingUp, X, ChevronDown, ChevronUp,
} from 'lucide-react'
import { useHabitStore } from '../store/habitStore'
import { usePlannerStore } from '../store/plannerStore'
import { HabitAICoach } from '../components/HabitAICoach'
import { Protocols } from '../components/Protocols'
import { migrateLegacyProtocols } from '../lib/migrateProtocols'
import type { Habit } from '../types'

// ── Category config ────────────────────────────────────────────────
const CAT_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  persoonlijk:   { label: 'Personal',      color: 'var(--pf-depth-text)', bg: 'rgba(196,136,78,0.08)' },
  professioneel: { label: 'Professional',  color: 'var(--pf-depth-text)', bg: 'var(--pf-sage-soft)' },
  lifestyle:     { label: 'Personal',      color: 'var(--pf-depth-text)', bg: 'rgba(196,136,78,0.08)' },
  physical:      { label: 'Physical',      color: 'var(--pf-depth-text)', bg: 'rgba(196,136,78,0.08)' },
  mental:        { label: 'Mental',        color: 'var(--pf-depth-text)', bg: 'var(--pf-sage-soft)' },
  professional:  { label: 'Professional',  color: 'var(--pf-depth-text)', bg: 'var(--pf-sage-soft)' },
  financial:     { label: 'Financial',     color: 'var(--pf-depth-text)', bg: 'var(--pf-sage-soft)' },
  relationships: { label: 'Relationships', color: 'var(--pf-depth-text)', bg: 'var(--pf-sage-soft)' },
}

const CATEGORIES = ['persoonlijk', 'professioneel'] as const
const FREQ_LABELS: Record<string, string> = { daily: 'Daily', weekdays: 'Weekdays', custom: 'Custom' }

// ── Helpers ────────────────────────────────────────────────────────
function ProgressBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0
  return (
    <div style={{ height: 6, borderRadius: 99, background: 'rgba(255,255,255,0.08)', overflow: 'hidden', flex: 1 }}>
      <div style={{ height: '100%', width: `${pct}%`, borderRadius: 99, background: color, transition: 'width 0.8s cubic-bezier(.16,1,.3,1)' }} />
    </div>
  )
}

// ── Add Habit Modal ────────────────────────────────────────────────
const ALL_CATS = ['persoonlijk', 'professioneel']

function AddHabitModal({ onClose, editHabit }: { onClose: () => void; editHabit?: Habit }) {
  const { addHabit, updateHabit } = useHabitStore()
  const [name, setName] = useState(editHabit?.name ?? '')
  const [category, setCategory] = useState(editHabit?.category ?? 'persoonlijk')
  const [freq, setFreq] = useState<'daily' | 'weekdays' | 'custom'>(editHabit?.targetFrequency ?? 'daily')
  const [customDays, setCustomDays] = useState<number[]>(editHabit?.customDays ?? [])
  const [saving, setSaving] = useState(false)

  const dayLabels = ['Zo', 'Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za']

  async function save() {
    if (!name.trim()) return
    setSaving(true)
    const habitData = {
      name: name.trim(), category: category as Habit['category'],
      icon: '', color: CAT_CONFIG[category]?.color ?? 'var(--pf-depth-text)',
      targetFrequency: freq, customDays: freq === 'custom' ? customDays : undefined,
      order: 99, active: true,
    }
    if (editHabit) {
      await updateHabit(editHabit.id, habitData)
    } else {
      await addHabit(habitData)
    }
    onClose()
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgb(20 21 15 / .4)', backdropFilter: 'blur(6px)' }}>
      <div style={{ width: '100%', maxWidth: 520, background: 'var(--color-card)', borderRadius: 20, border: '1px solid var(--color-border)', padding: '28px 28px 32px', margin: '0 16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h3 style={{ fontSize: 17, fontWeight: 500, color: 'var(--color-ink)' }}>{editHabit ? 'Edit habit' : 'New habit'}</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-subtle)', padding: 4 }}><X size={18} /></button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <input
            autoFocus
            value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && save()}
            placeholder="Habit name..."
            style={{ width: '100%', padding: '14px 16px', borderRadius: 14, border: '1px solid var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-ink)', fontSize: 15, outline: 'none', boxSizing: 'border-box' }}
          />

          <div>
            <p style={{ fontSize: 11, fontWeight: 500, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--color-subtle)', marginBottom: 8 }}>Category</p>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {ALL_CATS.map(c => (
                <button key={c} onClick={() => setCategory(c)}
                  style={{ padding: '8px 16px', borderRadius: 99, fontSize: 12, fontWeight: 500, cursor: 'pointer', transition: 'all 150ms',
                    background: category === c ? CAT_CONFIG[c]?.color : 'transparent',
                    border: `1.5px solid ${category === c ? CAT_CONFIG[c]?.color : 'var(--color-border)'}`,
                    color: category === c ? '#fff' : 'var(--color-ink)' }}>
                  {CAT_CONFIG[c]?.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p style={{ fontSize: 11, fontWeight: 500, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--color-subtle)', marginBottom: 8 }}>Frequency</p>
            <div style={{ display: 'flex', gap: 8 }}>
              {(['daily', 'weekdays', 'custom'] as const).map(f => (
                <button key={f} onClick={() => setFreq(f)}
                  style={{ padding: '8px 14px', borderRadius: 99, fontSize: 12, fontWeight: 500, cursor: 'pointer', transition: 'all 150ms',
                    background: freq === f ? 'var(--color-accent)' : 'transparent',
                    border: `1.5px solid ${freq === f ? 'var(--color-accent)' : 'var(--color-border)'}`,
                    color: freq === f ? '#fff' : 'var(--color-ink)' }}>
                  {FREQ_LABELS[f]}
                </button>
              ))}
            </div>
            {freq === 'custom' && (
              <div style={{ display: 'flex', gap: 6, marginTop: 12 }}>
                {dayLabels.map((d, i) => (
                  <button key={i} onClick={() => setCustomDays(prev => prev.includes(i) ? prev.filter(x => x !== i) : [...prev, i])}
                    style={{ width: 36, height: 36, borderRadius: 16, fontSize: 11, fontWeight: 500, cursor: 'pointer', transition: 'all 150ms',
                      background: customDays.includes(i) ? 'var(--color-accent)' : 'transparent',
                      border: `1.5px solid ${customDays.includes(i) ? 'var(--color-accent)' : 'var(--color-border)'}`,
                      color: customDays.includes(i) ? '#fff' : 'var(--color-ink)' }}>
                    {d}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button onClick={save} disabled={saving || !name.trim()}
            style={{ marginTop: 8, padding: '15px', borderRadius: 14, background: 'var(--color-accent)', border: 'none', color: 'var(--color-bg)', fontSize: 14, fontWeight: 500, cursor: 'pointer', opacity: saving || !name.trim() ? 0.5 : 1 }}>
            {saving ? 'Saving...' : editHabit ? 'Save changes' : 'Create habit'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Goals Section ──────────────────────────────────────────────────
function GoalCard({ goal }: { goal: ReturnType<typeof usePlannerStore>['goals'][0] }) {
  const { updateGoal, deleteGoal } = usePlannerStore()
  const [expanded, setExpanded] = useState(false)
  const [editing, setEditing] = useState(false)
  const [newCurrent, setNewCurrent] = useState(String(goal.currentNumber))
  const pct = goal.targetNumber > 0 ? Math.min(100, Math.round((goal.currentNumber / goal.targetNumber) * 100)) : 0
  const color = goal.color ?? 'var(--pf-depth-text)'

  function saveProgress() {
    const v = Number(newCurrent)
    if (!isNaN(v)) updateGoal(goal.id, { currentNumber: v })
    setEditing(false)
  }

  const areaLabel: Record<string, string> = {
    business: 'Business', health: 'Health', finance: 'Financial',
    relationships: 'Relationships', lifestyle: 'Lifestyle',
  }

  return (
    <div style={{ borderRadius: 14, border: 'none', boxShadow: '0 4px 16px rgb(62 73 54 / .06)', background: 'var(--color-card)', overflow: 'hidden' }}>
      <div style={{ height: 3, background: color }} />
      <div style={{ padding: '18px 20px' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12, gap: 12 }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <span style={{ fontSize: 9, fontWeight: 500, letterSpacing: '0.14em', textTransform: 'uppercase', color, padding: '2px 8px', borderRadius: 99, background: `${color}15` }}>
                {areaLabel[goal.area] ?? goal.area}
              </span>
            </div>
            <p style={{ fontSize: 15, fontWeight: 500, color: 'var(--color-ink)', lineHeight: 1.3 }}>{goal.title}</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <button onClick={() => setExpanded(v => !v)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-subtle)', padding: 4 }}>
              {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
          </div>
        </div>

        {/* Progress */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
          <ProgressBar value={goal.currentNumber} max={goal.targetNumber} color={color} />
          <span style={{ fontSize: 13, fontWeight: 500, color, minWidth: 36, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{pct}%</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {editing ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <input value={newCurrent} onChange={e => setNewCurrent(e.target.value)} onKeyDown={e => e.key === 'Enter' && saveProgress()}
                  style={{ width: 64, padding: '5px 8px', borderRadius: 16, border: `1.5px solid ${color}`, background: 'var(--color-surface)', color: 'var(--color-ink)', fontSize: 13, textAlign: 'center', outline: 'none' }} autoFocus />
                <span style={{ fontSize: 11, color: 'var(--color-subtle)' }}>/ {goal.targetNumber} {goal.unit}</span>
                <button onClick={saveProgress} style={{ padding: '5px 10px', borderRadius: 16, background: color, border: 'none', color: 'var(--color-bg)', fontSize: 11, fontWeight: 500, cursor: 'pointer' }}>OK</button>
                <button onClick={() => setEditing(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-subtle)', padding: 4 }}><X size={12} /></button>
              </div>
            ) : (
              <button onClick={() => setEditing(true)} style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-subtle)', fontSize: 12, padding: 0 }}>
                <span style={{ fontWeight: 500, color: 'var(--color-ink)' }}>{goal.currentNumber}</span>
                <span>/ {goal.targetNumber} {goal.unit}</span>
                <Pencil size={10} style={{ marginLeft: 2 }} />
              </button>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {goal.targetDate && (
              <span style={{ fontSize: 10, color: 'var(--color-subtle)' }}>
                {format(new Date(goal.targetDate), 'd MMM yyyy', { locale: nlBE })}
              </span>
            )}
            <button onClick={() => deleteGoal(goal.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-subtle)', padding: 2, opacity: 0.4 }}>
              <Trash2 size={11} />
            </button>
          </div>
        </div>

        {/* Milestones expanded */}
        {expanded && goal.milestones?.length > 0 && (
          <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--color-border)', display: 'flex', gap: 8 }}>
            {goal.milestones.map((m, i) => {
              const unlocked = goal.currentNumber >= m.value
              return (
                <div key={i} style={{ flex: 1, textAlign: 'center', opacity: unlocked ? 1 : 0.35 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 16, background: unlocked ? `${color}20` : 'rgba(255,255,255,0.04)', border: `1.5px solid ${unlocked ? color : 'var(--color-border)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 6px', fontSize: 14 }}>
                    {unlocked ? <Check size={14} color={color} /> : <span style={{ fontSize: 11 }}>{m.value}</span>}
                  </div>
                  <p style={{ fontSize: 9, color: unlocked ? color : 'var(--color-subtle)', fontWeight: 500, lineHeight: 1.3 }}>{m.label}</p>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Habit Checklist Row ─────────────────────────────────────────────
function HabitRow({ habit, done, onToggle, streak, monthPct, onEdit, onDelete }: {
  habit: Habit; done: boolean; onToggle: () => void; streak: number; monthPct: number; onEdit: () => void; onDelete: () => void
}) {
  const cfg = CAT_CONFIG[habit.category] ?? CAT_CONFIG.lifestyle
  const [showActions, setShowActions] = useState(false)

  return (
    <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 0 }}
      onMouseEnter={() => setShowActions(true)} onMouseLeave={() => setShowActions(false)}>
      <button onClick={onToggle}
        style={{
          flex: 1, display: 'flex', alignItems: 'center', gap: 16, padding: '15px 20px',
          cursor: 'pointer', textAlign: 'left', background: 'transparent', border: 'none',
          borderRadius: 14, transition: 'background 150ms',
        }}>
        {/* Big checkbox */}
        <div style={{
          width: 26, height: 26, borderRadius: 16, flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: done ? cfg.color : 'transparent',
          border: done ? `2px solid ${cfg.color}` : '2px solid var(--color-surface-stone)',
          transition: 'all 200ms cubic-bezier(.16,1,.3,1)',
          boxShadow: done ? `0 0 10px ${cfg.color}50` : 'none',
        }}>
          {done && <Check size={13} color="var(--color-ink)" strokeWidth={3} />}
        </div>

        <div style={{ flex: 1 }}>
          <p style={{ fontSize: 14, fontWeight: done ? 400 : 500, color: done ? 'var(--color-muted)' : 'var(--color-ink)', textDecoration: done ? 'line-through' : 'none', transition: 'all 200ms', letterSpacing: '-0.01em' }}>
            {habit.name}
          </p>
          <p style={{ fontSize: 10, color: 'var(--color-subtle)', marginTop: 2 }}>
            {FREQ_LABELS[habit.targetFrequency]}
            {habit.targetFrequency === 'custom' && habit.customDays && ` · ${habit.customDays.map(d => ['Zo','Ma','Di','Wo','Do','Vr','Za'][d]).join(', ')}`}
          </p>
        </div>

        {/* Streak */}
        {streak > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '3px 8px', borderRadius: 99, background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.2)' }}>
            <Flame size={10} color="var(--pf-depth-text)" />
            <span style={{ fontSize: 10, fontWeight: 500, color: 'var(--pf-depth-text)' }}>{streak}</span>
          </div>
        )}

        {/* Month % */}
        <span style={{ fontSize: 11, fontWeight: 500, color: monthPct >= 75 ? 'var(--pf-depth-text)' : monthPct >= 50 ? 'var(--pf-depth-text)' : 'var(--color-subtle)', minWidth: 28, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
          {monthPct}%
        </span>
      </button>

      {/* Edit/delete on hover */}
      {showActions && (
        <div style={{ display: 'flex', gap: 4, paddingRight: 12, flexShrink: 0 }}>
          <button onClick={onEdit} style={{ width: 28, height: 28, borderRadius: 16, background: 'var(--color-surface)', border: '1px solid var(--color-border)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-subtle)' }}>
            <Pencil size={11} />
          </button>
          <button onClick={onDelete} style={{ width: 28, height: 28, borderRadius: 16, background: 'var(--color-surface)', border: '1px solid var(--color-border)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-subtle)' }}>
            <Trash2 size={11} />
          </button>
        </div>
      )}
    </div>
  )
}

// ── Month habit row with hover-delete ───────────────────────────────
function MonthHabitRow({ habit, days, todayDay, cfg, pct, scoreColor, getLog, isPast, toggleHabit, deleteHabit, year, month }: {
  habit: Habit; days: number[]; todayDay: number; cfg: { label: string; color: string; bg: string }
  pct: number; scoreColor: string
  getLog: (habitId: string, day: number) => { completed: boolean } | undefined
  isPast: (d: number) => boolean
  toggleHabit: (habitId: string, date: string) => void
  deleteHabit: (habitId: string) => void
  year: number; month: number
}) {
  const [hovered, setHovered] = useState(false)
  return (
    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}>
      <td style={{ padding: '8px 20px', color: 'var(--color-ink)', fontSize: 13, whiteSpace: 'nowrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span>{habit.name}</span>
          {hovered && (
            <button
              onClick={() => deleteHabit(habit.id)}
              title="Verwijder habit"
              style={{ width: 18, height: 18, borderRadius: 14, border: '1px solid var(--color-border)', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-subtle)', flexShrink: 0, padding: 0 }}
            >
              <Trash2 size={10} />
            </button>
          )}
        </div>
      </td>
      {days.map(d => {
        const log = getLog(habit.id, d)
        const past = isPast(d)
        const bg = d === todayDay ? 'var(--pf-sage-soft)' : 'transparent'
        return (
          <td key={d} style={{ padding: '6px 2px', textAlign: 'center', background: bg }}>
            {past ? (
              <button onClick={() => toggleHabit(habit.id, format(new Date(year, month, d), 'yyyy-MM-dd'))}
                style={{ width: 20, height: 20, borderRadius: 14, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 120ms',
                  ...(log?.completed
                    ? { background: cfg.color, border: `1.5px solid ${cfg.color}`, boxShadow: `0 0 6px ${cfg.color}60` }
                    : { background: 'transparent', border: '1.5px solid var(--color-surface-stone)' }) }}>
                {log?.completed && <Check size={10} color="var(--color-ink)" strokeWidth={3} />}
              </button>
            ) : (
              <div style={{ width: 20, height: 20, borderRadius: 14, margin: '0 auto', background: 'transparent', border: '1.5px solid var(--color-surface-stone)' }} />
            )}
          </td>
        )
      })}
      <td style={{ padding: '12px 8px', textAlign: 'center', fontWeight: 500, color: scoreColor, fontSize: 11 }}>{pct}%</td>
    </tr>
  )
}

// ── Main Component ──────────────────────────────────────────────────
export function HabitTracker() {
  useEffect(() => { migrateLegacyProtocols() }, [])
  const today = new Date()
  const todayStr = format(today, 'yyyy-MM-dd')
  const [tab, setTab] = useState<'today' | 'month' | 'goals'>('today')
  const [viewDate, setViewDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1))
  const [showAddHabit, setShowAddHabit] = useState(false)
  const [editHabit, setEditHabit] = useState<Habit | undefined>()
  const [showAICoach, setShowAICoach] = useState(false)

  const [selectedDateStr, setSelectedDateStr] = useState(todayStr)
  const selectedDate = new Date(selectedDateStr + 'T12:00:00')
  const isToday = selectedDateStr === todayStr

  const goDay = (delta: number) => {
    const d = new Date(selectedDateStr + 'T12:00:00')
    d.setDate(d.getDate() + delta)
    const next = format(d, 'yyyy-MM-dd')
    if (next <= todayStr) setSelectedDateStr(next)
  }

  const { habits, logs, toggleHabit, deleteHabit, getDailyScore, getMonthlyScore, getPerfectDays, getStreak } = useHabitStore()
  const { goals } = usePlannerStore()

  const year = viewDate.getFullYear()
  const month = viewDate.getMonth()
  const monthStr = format(viewDate, 'yyyy-MM')
  const daysInMonth = getDaysInMonth(viewDate)
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1)
  const todayDay = today.getMonth() === month && today.getFullYear() === year ? today.getDate() : -1
  const activeHabits = habits.filter(h => h.active)

  // Normalize legacy 'lifestyle' category to 'persoonlijk'
  const normCat = (cat: string) => cat === 'lifestyle' ? 'persoonlijk' : cat

  // All categories present in habits (ordered: persoonlijk first, then others)
  const presentCats = [...CATEGORIES, 'physical', 'mental', 'professional', 'financial', 'relationships'].filter(cat =>
    activeHabits.some(h => normCat(h.category) === cat)
  )

  const isScheduledOn = (habit: Habit, dateStr: string) => {
    const dow = new Date(dateStr + 'T12:00:00').getDay() // 0=Sun,1=Mon,...,6=Sat
    if (habit.targetFrequency === 'daily') return true
    if (habit.targetFrequency === 'weekdays') return dow >= 1 && dow <= 5
    if (habit.targetFrequency === 'custom') return habit.customDays?.includes(dow) ?? false
    return true
  }

  const getLog = (habitId: string, day: number) => {
    const date = format(new Date(year, month, day), 'yyyy-MM-dd')
    return logs.find(l => l.habitId === habitId && l.date === date)
  }
  const getTodayLog = (habitId: string) => logs.find(l => l.habitId === habitId && l.date === selectedDateStr)
  const isPast = (day: number) => {
    if (year < today.getFullYear()) return true
    if (year === today.getFullYear() && month < today.getMonth()) return true
    if (year === today.getFullYear() && month === today.getMonth() && day <= today.getDate()) return true
    return false
  }
  const getHabitMonthPct = (habitId: string) => {
    const count = logs.filter(l => l.habitId === habitId && l.date.startsWith(monthStr) && l.completed).length
    return daysInMonth > 0 ? Math.round((count / daysInMonth) * 100) : 0
  }

  const scheduledHabits = activeHabits.filter(h => isScheduledOn(h, selectedDateStr))
  const todayScore = getDailyScore(selectedDateStr)
  const todayDone = logs.filter(l => l.date === selectedDateStr && l.completed && scheduledHabits.some(h => h.id === l.habitId)).length
  const todayTotal = scheduledHabits.length
  const monthScore = getMonthlyScore(monthStr)
  const perfectDays = getPerfectDays(monthStr)
  const monthlyDone = logs.filter(l => l.date.startsWith(monthStr) && l.completed).length

  // Week habit heatmap
  const weekStart = startOfWeek(today, { weekStartsOn: 1 })
  const weekEnd = endOfWeek(today, { weekStartsOn: 1 })
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd })

  const motivation = todayScore === 100 ? 'Perfect day. Streak alive.' :
    todayScore >= 75 ? 'Strong. Finish it.' :
    todayScore >= 50 ? 'Halfway. Keep going.' :
    todayDone > 0 ? 'Good start. Keep going.' : 'New day. Make it count.'

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto' }}>
      {showAICoach && <HabitAICoach onClose={() => setShowAICoach(false)} />}
      {(showAddHabit || editHabit) && <AddHabitModal onClose={() => { setShowAddHabit(false); setEditHabit(undefined) }} editHabit={editHabit} />}

      {/* ── Page header ────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <p style={{ fontSize: 10, fontWeight: 500, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--color-subtle)', marginBottom: 8 }}>
            {format(today, "EEEE · d MMMM yyyy", { locale: nlBE })}
          </p>
          <h1 style={{ fontSize: 32, fontWeight: 500, letterSpacing: '-0.02em', lineHeight: 1, color: 'var(--color-ink)', marginBottom: 6 }}>
            Daily Rituals
          </h1>
          <p style={{ fontSize: 13, color: 'var(--color-subtle)' }}>{motivation}</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button onClick={() => setShowAICoach(true)}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 14px', borderRadius: 16, border: '1px solid var(--color-border)', background: 'transparent', color: 'var(--color-subtle)', fontSize: 12, fontWeight: 500, cursor: 'pointer' }}>
            <Sparkles size={12} /> Coach
          </button>
          <button onClick={() => setShowAddHabit(true)}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 14px', borderRadius: 16, border: 'none', background: 'var(--color-accent)', color: 'var(--color-bg)', fontSize: 12, fontWeight: 500, cursor: 'pointer' }}>
            <Plus size={13} /> Habit
          </button>
        </div>
      </div>

      {/* ── Tabs ───────────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 24, padding: '4px', background: 'rgba(255,255,255,0.04)', borderRadius: 14, border: '1px solid var(--color-border)', width: 'fit-content' }}>
        {([['today', 'Today'], ['month', 'Month'], ['goals', 'Goals']] as const).map(([t, label]) => (
          <button key={t} onClick={() => setTab(t)}
            style={{ padding: '8px 20px', borderRadius: 14, fontSize: 13, fontWeight: tab === t ? 700 : 500, cursor: 'pointer', transition: 'all 150ms',
              background: tab === t ? 'var(--color-card)' : 'transparent',
              border: tab === t ? '1px solid var(--color-border)' : '1px solid transparent',
              color: tab === t ? 'var(--color-ink)' : 'var(--color-subtle)' }}>
            {label}
          </button>
        ))}
      </div>

      {/* ────────────────────────────────────────────────────────── */}
      {/* ────────────────────────────────────────────────────────── */}
      {/* TAB: TODAY */}
      {/* ────────────────────────────────────────────────────────── */}
      {tab === 'today' && (
        <div>
          {/* Date navigator */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
            <button onClick={() => goDay(-1)} style={{ width: 32, height: 32, borderRadius: 16, border: 'none', boxShadow: '0 4px 16px rgb(62 73 54 / .06)', background: 'var(--color-card)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-muted)' }}>
              <ChevronLeft size={15} />
            </button>
            <div style={{ flex: 1, textAlign: 'center' }}>
              <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-ink)' }}>
                {isToday ? 'Today' : format(selectedDate, 'EEEE d MMMM')}
              </span>
              {!isToday && (
                <button onClick={() => setSelectedDateStr(todayStr)} style={{ marginLeft: 10, fontSize: 11, fontWeight: 500, color: 'var(--color-accent)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                  Back to today
                </button>
              )}
            </div>
            <button onClick={() => goDay(1)} disabled={isToday} style={{ width: 32, height: 32, borderRadius: 16, border: 'none', boxShadow: '0 4px 16px rgb(62 73 54 / .06)', background: 'var(--color-card)', cursor: isToday ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: isToday ? 'var(--color-subtle)' : 'var(--color-muted)', opacity: isToday ? 0.35 : 1 }}>
              <ChevronRight size={15} />
            </button>
          </div>

          {/* Stats row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 28 }}>
            {[
              { label: 'Today', value: `${todayDone}/${todayTotal}`, sub: 'habits', color: 'var(--pf-depth-text)', icon: <Check size={12} /> },
              { label: 'Score', value: `${todayScore}%`, sub: 'day score', color: todayScore >= 80 ? 'var(--pf-depth-text)' : todayScore >= 50 ? 'var(--pf-depth-text)' : 'var(--pf-depth-text)', icon: <Star size={12} /> },
              { label: 'Streak', value: `${perfectDays}`, sub: 'perfect days', color: 'var(--pf-depth-text)', icon: <Flame size={12} /> },
              { label: 'Month', value: `${monthScore}%`, sub: 'month score', color: monthScore >= 75 ? 'var(--pf-depth-text)' : 'var(--pf-depth-text)', icon: <TrendingUp size={12} /> },
            ].map(s => (
              <div key={s.label} style={{ borderRadius: 14, border: 'none', boxShadow: '0 4px 16px rgb(62 73 54 / .06)', background: 'var(--color-card)', padding: '16px 18px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: 'var(--color-subtle)', marginBottom: 8 }}>{s.icon}</div>
                <p style={{ fontSize: 24, fontWeight: 500, color: s.color, letterSpacing: '-0.04em', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>{s.value}</p>
                <p style={{ fontSize: 9, color: 'var(--color-subtle)', marginTop: 6, textTransform: 'uppercase', letterSpacing: '0.1em' }}>{s.sub}</p>
              </div>
            ))}
          </div>

          {/* Week heatmap */}
          <div style={{ borderRadius: 14, border: 'none', boxShadow: '0 4px 16px rgb(62 73 54 / .06)', background: 'var(--color-card)', padding: '16px 20px', marginBottom: 24 }}>
            <p style={{ fontSize: 9, fontWeight: 500, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--color-subtle)', marginBottom: 12 }}>Week</p>
            <div style={{ display: 'flex', gap: 6 }}>
              {weekDays.map(d => {
                const dStr = format(d, 'yyyy-MM-dd')
                const done = logs.filter(l => l.date === dStr && l.completed).length
                const pct = activeHabits.length > 0 ? done / activeHabits.length : 0
                const isDayToday = dStr === todayStr
                const isFut = dStr > todayStr
                const isSelected = dStr === selectedDateStr
                const col = pct >= 1 ? 'var(--pf-depth-text)' : pct >= 0.5 ? 'var(--pf-depth-text)' : 'var(--pf-depth-text)'
                return (
                  <div key={dStr}
                    onClick={() => { if (!isFut) setSelectedDateStr(dStr) }}
                    style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, cursor: isFut ? 'default' : 'pointer' }}>
                    <div style={{
                      width: '100%', height: 40, borderRadius: 16,
                      background: isFut ? 'rgba(255,255,255,0.02)' : `${col}${Math.round(pct * 50 + 12).toString(16).padStart(2,'0')}`,
                      border: isSelected ? `2px solid ${isDayToday ? col : 'var(--color-accent)'}` : `1px solid ${isDayToday ? col : 'transparent'}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      transition: 'border 120ms',
                      boxShadow: isSelected ? `0 0 0 3px rgba(201,104,64,0.15)` : 'none',
                    }}>
                      {!isFut && activeHabits.length > 0 && <span style={{ fontSize: 10, fontWeight: 500, color: pct >= 0.5 ? col : 'var(--color-subtle)' }}>{done}/{activeHabits.length}</span>}
                    </div>
                    <span style={{ fontSize: 9, fontWeight: isSelected || isDayToday ? 700 : 400, color: isSelected ? 'var(--color-accent)' : isDayToday ? 'var(--color-ink)' : 'var(--color-subtle)', letterSpacing: '0.06em' }}>
                      {format(d, 'EEE', { locale: nlBE }).charAt(0).toUpperCase()}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Supplement stack */}
          <Protocols selectedDateStr={selectedDateStr} />

          {/* Skin Protocol tracker */}

          {/* Habit checklist by category */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {presentCats.map(cat => {
              const cfg = CAT_CONFIG[cat]
              const catHabits = activeHabits.filter(h => normCat(h.category) === cat && isScheduledOn(h, selectedDateStr))
              if (!catHabits.length) return null
              const catDone = catHabits.filter(h => getTodayLog(h.id)?.completed).length

              return (
                <div key={cat} style={{ borderRadius: 14, border: 'none', boxShadow: '0 4px 16px rgb(62 73 54 / .06)', background: 'var(--color-card)', overflow: 'hidden', marginBottom: 4 }}>
                  {/* Category header */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 20px 10px', borderBottom: '1px solid var(--color-border)' }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: cfg.color, flexShrink: 0 }} />
                    <span style={{ fontSize: 10, fontWeight: 500, letterSpacing: '0.14em', textTransform: 'uppercase', color: cfg.color, flex: 1 }}>
                      {cfg.label}
                    </span>
                    <span style={{ fontSize: 11, fontWeight: 500, color: catDone === catHabits.length ? cfg.color : 'var(--color-subtle)' }}>
                      {catDone}/{catHabits.length}
                    </span>
                  </div>

                  {/* Habits */}
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    {catHabits.map((habit, idx) => (
                      <div key={habit.id} style={{ borderBottom: idx < catHabits.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                        <HabitRow
                          habit={habit}
                          done={getTodayLog(habit.id)?.completed ?? false}
                          onToggle={() => toggleHabit(habit.id, selectedDateStr)}
                          streak={getStreak(habit.id)}
                          monthPct={getHabitMonthPct(habit.id)}
                          onEdit={() => setEditHabit(habit)}
                          onDelete={() => deleteHabit(habit.id)}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>

          {activeHabits.length === 0 && (
            <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--color-subtle)' }}>
              <Target size={32} style={{ margin: '0 auto 12px', opacity: 0.4 }} />
              <p style={{ fontSize: 14, fontWeight: 500 }}>No habits yet. Add your first one.</p>
              <button onClick={() => setShowAddHabit(true)} style={{ marginTop: 16, padding: '10px 20px', borderRadius: 16, background: 'var(--color-accent)', border: 'none', color: 'var(--color-bg)', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>
                Add habit
              </button>
            </div>
          )}
        </div>
      )}

      {/* ────────────────────────────────────────────────────────── */}
      {/* TAB: MAAND */}
      {/* ────────────────────────────────────────────────────────── */}
      {tab === 'month' && (
        <div>
          {/* Month stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 24 }}>
            {[
              { label: 'Active habits', value: activeHabits.length, color: 'var(--color-ink)', icon: <Target size={12} /> },
              { label: 'Done this month', value: monthlyDone, color: 'var(--pf-depth-text)', icon: <Check size={12} /> },
              { label: 'Perfect days', value: perfectDays, color: 'var(--pf-depth-text)', icon: <Flame size={12} /> },
              { label: 'Month score', value: `${monthScore}%`, color: monthScore >= 75 ? 'var(--pf-depth-text)' : monthScore >= 50 ? 'var(--pf-depth-text)' : 'var(--pf-depth-text)', icon: <Star size={12} /> },
            ].map(s => (
              <div key={s.label} style={{ borderRadius: 14, border: 'none', boxShadow: '0 4px 16px rgb(62 73 54 / .06)', background: 'var(--color-card)', padding: '16px 18px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: 'var(--color-subtle)', marginBottom: 8 }}>{s.icon}</div>
                <p style={{ fontSize: 24, fontWeight: 500, color: s.color, letterSpacing: '-0.04em', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>{s.value}</p>
                <p style={{ fontSize: 9, color: 'var(--color-subtle)', marginTop: 6, textTransform: 'uppercase', letterSpacing: '0.1em' }}>{s.label}</p>
              </div>
            ))}
          </div>

          {/* Month nav */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <button onClick={() => setViewDate(new Date(year, month - 1, 1))}
              style={{ width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', border: '1px solid var(--color-border)', borderRadius: 14, cursor: 'pointer', color: 'var(--color-muted)' }}>
              <ChevronLeft size={14} />
            </button>
            <span style={{ padding: '0 8px', fontSize: 14, fontWeight: 500, color: 'var(--color-ink)', textTransform: 'capitalize' }}>
              {format(viewDate, 'MMMM yyyy', { locale: nlBE })}
            </span>
            <button onClick={() => setViewDate(new Date(year, month + 1, 1))}
              style={{ width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', border: '1px solid var(--color-border)', borderRadius: 14, cursor: 'pointer', color: 'var(--color-muted)' }}>
              <ChevronRight size={14} />
            </button>
          </div>

          {/* Grid */}
          <div style={{ borderRadius: 14, border: 'none', boxShadow: '0 4px 16px rgb(62 73 54 / .06)', background: 'var(--color-card)', overflow: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 800, fontSize: 12 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <th style={{ textAlign: 'left', padding: '14px 20px', fontWeight: 500, fontSize: 10, letterSpacing: '0.14em', color: 'var(--color-subtle)', width: 200 }}>HABIT</th>
                  {days.map(d => (
                    <th key={d} style={{ padding: '14px 0', textAlign: 'center', width: 26, fontWeight: d === todayDay ? 700 : 400, fontSize: 10, color: d === todayDay ? 'var(--color-accent)' : 'var(--color-subtle)', background: d === todayDay ? 'var(--pf-sage-soft)' : 'transparent' }}>{d}</th>
                  ))}
                  <th style={{ padding: '14px 8px', textAlign: 'center', fontSize: 10, color: 'var(--color-subtle)', width: 44 }}>%</th>
                </tr>
              </thead>
              <tbody>
                {presentCats.map(cat => {
                  const cfg = CAT_CONFIG[cat]
                  const catHabits = activeHabits.filter(h => normCat(h.category) === cat)
                  if (!catHabits.length) return null
                  return [
                    <tr key={`cat-${cat}`} style={{ background: cfg.bg, borderBottom: '1px solid var(--color-border)' }}>
                      <td style={{ padding: '8px 20px', fontSize: 9, fontWeight: 500, letterSpacing: '0.16em', textTransform: 'uppercase', color: cfg.color, borderLeft: `3px solid ${cfg.color}` }} colSpan={daysInMonth + 2}>
                        {cfg.label}
                      </td>
                    </tr>,
                    ...catHabits.map(habit => {
                      const count = logs.filter(l => l.habitId === habit.id && l.date.startsWith(monthStr) && l.completed).length
                      const pct = daysInMonth > 0 ? Math.round((count / daysInMonth) * 100) : 0
                      const scoreColor = pct >= 75 ? 'var(--pf-depth-text)' : pct >= 50 ? 'var(--pf-depth-text)' : 'var(--pf-depth-text)'
                      return (
                        <MonthHabitRow
                          key={habit.id}
                          habit={habit}
                          days={days}
                          todayDay={todayDay}
                          cfg={cfg}
                          pct={pct}
                          scoreColor={scoreColor}
                          getLog={getLog}
                          isPast={isPast}
                          toggleHabit={toggleHabit}
                          deleteHabit={deleteHabit}
                          year={year}
                          month={month}
                        />
                      )
                    })
                  ]
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────── */}
      {/* TAB: DOELEN */}
      {/* ────────────────────────────────────────────────────────── */}
      {tab === 'goals' && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <div>
              <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-ink)' }}>{goals.filter(g => g.status === 'active').length} active goals</p>
              <p style={{ fontSize: 11, color: 'var(--color-subtle)', marginTop: 2 }}>Manage your progress and milestones</p>
            </div>
          </div>

          {/* Business */}
          {['business', 'health', 'lifestyle', 'finance', 'relationships'].map(area => {
            const areaGoals = goals.filter(g => g.area === area && g.status === 'active')
            if (!areaGoals.length) return null
            const areaLabel: Record<string, string> = {
              business: 'Business', health: 'Health', lifestyle: 'Lifestyle',
              finance: 'Financial', relationships: 'Relationships',
            }
            const areaColor: Record<string, string> = {
              business: 'var(--pf-depth-text)', health: 'var(--pf-depth-text)', lifestyle: 'var(--pf-depth-text)',
              finance: 'var(--pf-depth-text)', relationships: 'var(--pf-depth-text)',
            }
            return (
              <div key={area} style={{ marginBottom: 28 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: areaColor[area] }} />
                  <p style={{ fontSize: 10, fontWeight: 500, letterSpacing: '0.14em', textTransform: 'uppercase', color: areaColor[area] }}>{areaLabel[area]}</p>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 12 }}>
                  {areaGoals.map(g => <GoalCard key={g.id} goal={g} />)}
                </div>
              </div>
            )
          })}

          {goals.filter(g => g.status === 'active').length === 0 && (
            <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--color-subtle)' }}>
              <Target size={32} style={{ margin: '0 auto 12px', opacity: 0.4 }} />
              <p style={{ fontSize: 14, fontWeight: 500 }}>No goals yet. Go to Goals in the sidebar to add them.</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
