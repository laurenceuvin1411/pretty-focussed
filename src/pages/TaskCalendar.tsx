import { useState, useRef } from 'react'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isSameDay, parseISO, isToday } from 'date-fns'
import { nlBE } from 'date-fns/locale'
import { ChevronLeft, ChevronRight, Plus, AlertCircle, Check, RefreshCw, Pencil, Trash2, X } from 'lucide-react'
import { useTaskStore } from '../store/taskStore'
import { useRecurringStore } from '../store/recurringStore'
import type { Task, RecurringTask } from '../types'
import { CheckBox } from '../components/shared/CheckBox'
import { Badge } from '../components/shared/Badge'

const ACCENT = '#4C6481'

// ── Edit task modal ──────────────────────────────────────────────────────────
function EditTaskModal({ task, onClose }: { task: Task; onClose: () => void }) {
  const { updateTask, deleteTask } = useTaskStore()
  const { addRecurring } = useRecurringStore()
  const [title, setTitle]       = useState(task.title)
  const [dueDate, setDueDate]   = useState(task.dueDate ?? '')
  const [business, setBusiness] = useState<Task['business']>(task.business)
  const [status, setStatus]     = useState<Task['status']>(task.status)
  const [makeRecurring, setMakeRecurring] = useState(false)
  const [recurDays, setRecurDays]         = useState<number[]>([])
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    setSaving(true)
    await updateTask(task.id, { title: title.trim(), dueDate: dueDate || undefined, business, status })
    if (makeRecurring && recurDays.length > 0) {
      await addRecurring({ title: title.trim(), business, frequency: 'weekly', days: recurDays })
    }
    setSaving(false)
    onClose()
  }

  async function handleDelete() {
    await deleteTask(task.id)
    onClose()
  }

  const STATUSES: Task['status'][] = ['backlog', 'this-week', 'today', 'in-progress', 'done', 'cancelled']
  const STATUS_LABELS: Record<Task['status'], string> = {
    backlog: 'Backlog', 'this-week': 'Deze week', today: 'Vandaag',
    'in-progress': 'Bezig', done: 'Klaar', cancelled: 'Geannuleerd',
  }
  const WEEK_DAYS_SHORT = [
    { label: 'Ma', jsDay: 1 }, { label: 'Di', jsDay: 2 }, { label: 'Wo', jsDay: 3 },
    { label: 'Do', jsDay: 4 }, { label: 'Vr', jsDay: 5 }, { label: 'Za', jsDay: 6 }, { label: 'Zo', jsDay: 0 },
  ]

  const inputSt: React.CSSProperties = {
    width: '100%', boxSizing: 'border-box', padding: '9px 12px',
    borderRadius: 4, border: '1px solid var(--color-border)',
    background: 'var(--color-surface)', color: 'var(--color-ink)',
    fontSize: 13, fontFamily: 'var(--font-sans)', outline: 'none',
  }

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 40, background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(6px)' }} />
      <div style={{
        position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
        zIndex: 50, width: 420, maxWidth: 'calc(100vw - 32px)', maxHeight: '90vh', overflowY: 'auto',
        background: 'var(--color-card)', border: '1px solid var(--color-border)',
        borderRadius: 16, boxShadow: '0 24px 64px rgba(0,0,0,0.4)',
      }}>
        <div style={{ height: 2, background: ACCENT }} />
        <div style={{ padding: '22px 24px 28px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', fontWeight: 700, letterSpacing: '0.12em', color: ACCENT }}>TAAK BEWERKEN</span>
            <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-muted)', padding: 4 }}><X size={15} /></button>
          </div>

          {/* Title */}
          <div>
            <label style={{ fontSize: 9, fontFamily: 'var(--font-mono)', letterSpacing: '0.12em', color: 'var(--color-muted)', display: 'block', marginBottom: 6 }}>NAAM</label>
            <input value={title} onChange={e => setTitle(e.target.value)} style={inputSt} />
          </div>

          {/* Due date */}
          <div>
            <label style={{ fontSize: 9, fontFamily: 'var(--font-mono)', letterSpacing: '0.12em', color: 'var(--color-muted)', display: 'block', marginBottom: 6 }}>DATUM</label>
            <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} style={inputSt} />
          </div>

          {/* Status */}
          <div>
            <label style={{ fontSize: 9, fontFamily: 'var(--font-mono)', letterSpacing: '0.12em', color: 'var(--color-muted)', display: 'block', marginBottom: 6 }}>STATUS</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
              {STATUSES.map(s => (
                <button key={s} type="button" onClick={() => setStatus(s)} style={{
                  padding: '4px 10px', borderRadius: 3, fontSize: 10, cursor: 'pointer',
                  fontFamily: 'var(--font-mono)', letterSpacing: '0.08em',
                  border: `1px solid ${status === s ? ACCENT : 'var(--color-border)'}`,
                  background: status === s ? 'rgba(76,100,129,0.12)' : 'transparent',
                  color: status === s ? ACCENT : 'var(--color-subtle)',
                }}>{STATUS_LABELS[s]}</button>
              ))}
            </div>
          </div>

          {/* Business */}
          <div>
            <label style={{ fontSize: 9, fontFamily: 'var(--font-mono)', letterSpacing: '0.12em', color: 'var(--color-muted)', display: 'block', marginBottom: 6 }}>PROJECT</label>
            <div style={{ display: 'flex', gap: 5 }}>
              {(['ceo-lifestyle', 'bora', 'personal'] as const).map(b => (
                <button key={b} type="button" onClick={() => setBusiness(b)} style={{
                  padding: '4px 10px', borderRadius: 3, fontSize: 10, cursor: 'pointer',
                  fontFamily: 'var(--font-mono)', letterSpacing: '0.08em',
                  border: `1px solid ${business === b ? ACCENT : 'var(--color-border)'}`,
                  background: business === b ? 'rgba(76,100,129,0.12)' : 'transparent',
                  color: business === b ? ACCENT : 'var(--color-subtle)',
                }}>{b === 'ceo-lifestyle' ? 'CEO' : b === 'bora' ? 'Bora' : 'Persoonlijk'}</button>
              ))}
            </div>
          </div>

          {/* Recurring toggle */}
          <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: 14 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
              <div onClick={() => setMakeRecurring(v => !v)} style={{
                width: 32, height: 18, borderRadius: 9, border: `1px solid ${makeRecurring ? ACCENT : 'var(--color-border)'}`,
                background: makeRecurring ? ACCENT : 'var(--color-surface)', position: 'relative', transition: 'all 150ms', cursor: 'pointer',
              }}>
                <div style={{
                  position: 'absolute', top: 2, left: makeRecurring ? 14 : 2,
                  width: 12, height: 12, borderRadius: '50%', background: '#fff', transition: 'left 150ms',
                }} />
              </div>
              <span style={{ fontSize: 12, color: 'var(--color-ink)' }}>Herhalend maken</span>
            </label>

            {makeRecurring && (
              <div style={{ marginTop: 12 }}>
                <label style={{ fontSize: 9, fontFamily: 'var(--font-mono)', letterSpacing: '0.12em', color: 'var(--color-muted)', display: 'block', marginBottom: 8 }}>HERHAAL OP</label>
                <div style={{ display: 'flex', gap: 5 }}>
                  {WEEK_DAYS_SHORT.map(d => (
                    <button key={d.jsDay} type="button" onClick={() => setRecurDays(prev => prev.includes(d.jsDay) ? prev.filter(x => x !== d.jsDay) : [...prev, d.jsDay])} style={{
                      width: 32, height: 32, borderRadius: 3, fontSize: 10, cursor: 'pointer',
                      fontFamily: 'var(--font-mono)', border: `1px solid ${recurDays.includes(d.jsDay) ? ACCENT : 'var(--color-border)'}`,
                      background: recurDays.includes(d.jsDay) ? 'rgba(76,100,129,0.12)' : 'transparent',
                      color: recurDays.includes(d.jsDay) ? ACCENT : 'var(--color-subtle)',
                    }}>{d.label}</button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
            <button onClick={handleSave} disabled={saving || !title.trim()} style={{
              flex: 1, padding: '10px', borderRadius: 4, border: 'none', cursor: 'pointer',
              fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700, letterSpacing: '0.1em',
              background: ACCENT, color: '#fff', opacity: saving ? 0.6 : 1,
            }}>OPSLAAN</button>
            <button onClick={handleDelete} style={{
              padding: '10px 14px', borderRadius: 4, border: '1px solid var(--color-border)', cursor: 'pointer',
              fontFamily: 'var(--font-mono)', fontSize: 11, background: 'transparent', color: 'var(--color-muted)',
            }}>VERWIJDER</button>
          </div>
        </div>
      </div>
    </>
  )
}

// ── Recurring modal ──────────────────────────────────────────────────────────

// Weekdagen in Ma–Zo volgorde (JS weekday → display)
const WEEK_DAYS = [
  { label: 'Ma', jsDay: 1 }, { label: 'Di', jsDay: 2 }, { label: 'Wo', jsDay: 3 },
  { label: 'Do', jsDay: 4 }, { label: 'Vr', jsDay: 5 }, { label: 'Za', jsDay: 6 },
  { label: 'Zo', jsDay: 0 },
]

const BIZ_OPTIONS = [
  { value: 'ceo-lifestyle', label: 'CEO Lifestyle' },
  { value: 'bora', label: 'Bora' },
  { value: 'personal', label: 'Personal' },
]

const FREQ_LABEL: Record<'weekly' | 'monthly', string> = { weekly: 'Weekly', monthly: 'Monthly' }

function RecurringModal({ onClose, editTask }: { onClose: () => void; editTask?: RecurringTask }) {
  const { addRecurring, updateRecurring } = useRecurringStore()
  const [title, setTitle] = useState(editTask?.title ?? '')
  const [business, setBusiness] = useState<RecurringTask['business']>(editTask?.business ?? 'personal')
  const [freq, setFreq] = useState<'weekly' | 'monthly'>(editTask?.frequency ?? 'weekly')
  const [days, setDays] = useState<number[]>(editTask?.days ?? [])
  const [monthlyDay, setMonthlyDay] = useState<number>(editTask?.monthlyDay ?? 1)
  const [saving, setSaving] = useState(false)

  function toggleDay(jsDay: number) {
    setDays(prev => prev.includes(jsDay) ? prev.filter(d => d !== jsDay) : [...prev, jsDay])
  }

  async function save() {
    if (!title.trim()) return
    setSaving(true)
    const task: Omit<RecurringTask, 'id'> = {
      title: title.trim(), business, category: 'operations', priority: 3,
      needleMover: false, frequency: freq,
      days: freq === 'weekly' ? days : [],
      monthlyDay: freq === 'monthly' ? monthlyDay : undefined,
      active: true, tags: ['recurring'],
    }
    if (editTask) {
      await updateRecurring(editTask.id, task)
    } else {
      await addRecurring(task)
    }
    onClose()
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)' }}>
      <div style={{ width: '100%', maxWidth: 480, background: 'var(--color-card)', borderRadius: 18, border: '1px solid var(--color-border)', padding: '26px 26px 30px', margin: '0 16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-ink)' }}>
            {editTask ? 'Edit task' : 'Recurring task'}
          </h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-subtle)', padding: 4 }}><X size={17} /></button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Title */}
          <input autoFocus value={title} onChange={e => setTitle(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && save()}
            placeholder="Task name..."
            style={{ width: '100%', padding: '13px 15px', borderRadius: 11, border: '1px solid var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-ink)', fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />

          {/* Business */}
          <div>
            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--color-subtle)', marginBottom: 8 }}>Project</p>
            <div style={{ display: 'flex', gap: 7 }}>
              {BIZ_OPTIONS.map(b => (
                <button key={b.value} onClick={() => setBusiness(b.value as RecurringTask['business'])}
                  style={{ padding: '7px 13px', borderRadius: 99, fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all 130ms',
                    background: business === b.value ? 'var(--color-accent)' : 'transparent',
                    border: `1.5px solid ${business === b.value ? 'var(--color-accent)' : 'var(--color-border)'}`,
                    color: business === b.value ? '#0A0805' : 'var(--color-muted)' }}>
                  {b.label}
                </button>
              ))}
            </div>
          </div>

          {/* Frequency */}
          <div>
            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--color-subtle)', marginBottom: 8 }}>Frequency</p>
            <div style={{ display: 'flex', gap: 7 }}>
              {(['weekly', 'monthly'] as const).map(f => (
                <button key={f} onClick={() => setFreq(f)}
                  style={{ padding: '7px 16px', borderRadius: 99, fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all 130ms',
                    background: freq === f ? 'var(--color-accent)' : 'transparent',
                    border: `1.5px solid ${freq === f ? 'var(--color-accent)' : 'var(--color-border)'}`,
                    color: freq === f ? '#0A0805' : 'var(--color-muted)' }}>
                  {FREQ_LABEL[f]}
                </button>
              ))}
            </div>
          </div>

          {/* Weekly day picker (Ma → Zo) */}
          {freq === 'weekly' && (
            <div>
              <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--color-subtle)', marginBottom: 8 }}>Which days</p>
              <div style={{ display: 'flex', gap: 6 }}>
                {WEEK_DAYS.map(({ label, jsDay }) => (
                  <button key={jsDay} onClick={() => toggleDay(jsDay)}
                    style={{ flex: 1, height: 36, borderRadius: 9, fontSize: 11, fontWeight: 700, cursor: 'pointer', transition: 'all 130ms',
                      background: days.includes(jsDay) ? 'var(--color-accent)' : 'transparent',
                      border: `1.5px solid ${days.includes(jsDay) ? 'var(--color-accent)' : 'var(--color-border)'}`,
                      color: days.includes(jsDay) ? '#0A0805' : 'var(--color-muted)' }}>
                    {label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Monthly day picker */}
          {freq === 'monthly' && (
            <div>
              <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--color-subtle)', marginBottom: 8 }}>Day of the month</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <input type="number" min={1} max={31} value={monthlyDay}
                  onChange={e => setMonthlyDay(Math.min(31, Math.max(1, Number(e.target.value))))}
                  style={{ width: 72, padding: '10px 12px', borderRadius: 16, border: '1px solid var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-ink)', fontSize: 20, fontWeight: 700, textAlign: 'center', outline: 'none' }} />
                <span style={{ fontSize: 13, color: 'var(--color-subtle)' }}>of each month</span>
              </div>
              <p style={{ fontSize: 11, color: 'var(--color-subtle)', marginTop: 8 }}>
                If the month has fewer than {monthlyDay} days, the task is skipped.
              </p>
            </div>
          )}

          <button onClick={save} disabled={saving || !title.trim() || (freq === 'weekly' && days.length === 0)}
            style={{ marginTop: 4, padding: '14px', borderRadius: 11, background: 'var(--color-accent)', border: 'none', color: 'var(--color-bg)', fontSize: 14, fontWeight: 700, cursor: 'pointer',
              opacity: saving || !title.trim() || (freq === 'weekly' && days.length === 0) ? 0.45 : 1 }}>
            {saving ? 'Saving...' : editTask ? 'Save changes' : 'Create task'}
          </button>
        </div>
      </div>
    </div>
  )
}

const BIZ: Record<string, { dot: string; bg: string; text: string; label: string }> = {
  'ceo-lifestyle': { dot: '#4C6481', bg: 'rgba(76,100,129,0.14)', text: '#4C6481', label: 'CEO' },
  'bora':          { dot: '#4C6481', bg: 'rgba(76,100,129,0.14)', text: '#4C6481', label: 'Bora'},
  'personal':      { dot: 'var(--color-subtle)', bg: 'var(--color-surface)', text: 'var(--color-muted)', label: 'Pers'},
  'all':           { dot: 'var(--color-subtle)', bg: 'var(--color-surface)', text: 'var(--color-muted)', label: 'All' },
}

export function TaskCalendar() {
  const today = new Date()
  const [viewDate, setViewDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1))
  const [selectedDay, setSelectedDay] = useState<Date | null>(today)
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [showRecurring, setShowRecurring] = useState(false)
  const [editRecurring, setEditRecurring] = useState<RecurringTask | undefined>()
  const [editTask, setEditTask] = useState<Task | null>(null)
  const [expandedDay, setExpandedDay] = useState<string | null>(null)
  const { tasks, toggleTask, addTask } = useTaskStore()
  const { recurring, deleteRecurring } = useRecurringStore()
  const selDayRef = useRef<HTMLDivElement>(null)

  const year  = viewDate.getFullYear()
  const month = viewDate.getMonth()
  const days  = eachDayOfInterval({ start: startOfMonth(viewDate), end: endOfMonth(viewDate) })
  const firstDow = (getDay(startOfMonth(viewDate)) + 6) % 7
  const paddedDays: (Date | null)[] = [...Array(firstDow).fill(null), ...days]
  while (paddedDays.length % 7 !== 0) paddedDays.push(null)

  const todayStr   = format(today, 'yyyy-MM-dd')
  const getForDay  = (d: Date) => { const s = format(d, 'yyyy-MM-dd'); return tasks.filter(t => (t.dueDate === s || t.scheduledDate === s) && t.status !== 'cancelled') }
  const todayTasks = tasks.filter(t => (t.dueDate === todayStr || t.status === 'today' || t.status === 'in-progress') && t.status !== 'done' && t.status !== 'cancelled')
  const monthTasks = tasks.filter(t => { const d = t.dueDate || t.scheduledDate; return d?.startsWith(format(viewDate, 'yyyy-MM')) })
  const overdue    = tasks.filter(t => t.dueDate && t.dueDate < todayStr && t.status !== 'done' && t.status !== 'cancelled')
  const selTasks   = selectedDay ? getForDay(selectedDay) : []

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTaskTitle.trim()) return
    let business: Task['business'] = 'personal'
    let title = newTaskTitle.trim()
    if (title.includes('/ceo'))  { business = 'ceo-lifestyle'; title = title.replace('/ceo', '').trim() }
    if (title.includes('/bora')) { business = 'bora';          title = title.replace('/bora', '').trim() }
    const dueDate = selectedDay ? format(selectedDay, 'yyyy-MM-dd') : undefined
    const isToday = dueDate === todayStr
    addTask({ title, business, category: 'operations', priority: 3, needleMover: false,
      status: isToday ? 'today' : 'this-week',
      dueDate, tags: [] })
    setNewTaskTitle('')
    setTimeout(() => selDayRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 80)
  }

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', width: '100%', overflow: 'hidden' }}>
      {editTask && <EditTaskModal task={editTask} onClose={() => setEditTask(null)} />}

      {/* ── Header ── */}
      <div className="anim-fade-up" style={{ marginBottom: 32, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 32, fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1, color: 'var(--color-ink)' }}>
            Focus
          </h1>
          <p style={{ fontSize: 13, color: 'var(--color-muted)', marginTop: 6 }}>
            {format(today, "EEEE · d MMMM yyyy", { locale: nlBE })}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {[
            { v: todayTasks.length,   l: 'Today',   c: 'var(--color-brand-orange)' },
            { v: overdue.length,      l: 'Overdue', c: overdue.length > 0 ? 'var(--color-brand-orange)' : 'var(--color-subtle)' },
            { v: tasks.filter(t => t.status === 'done').length, l: 'Done', c: 'var(--color-brand-green)' },
          ].map(s => (
            <div key={s.l} className="card" style={{ padding: '14px 18px', textAlign: 'center', minWidth: 58 }}>
              <p style={{ fontSize: 22, fontWeight: 600, letterSpacing: '-0.04em', color: s.c, lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>{s.v}</p>
              <p style={{ fontSize: 9, color: 'var(--color-subtle)', marginTop: 5, letterSpacing: '0.1em', textTransform: 'uppercase' }}>{s.l}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Overdue alert ── */}
      {overdue.length > 0 && (
        <div className="anim-fade-up" style={{ marginBottom: 20, padding: '14px 20px', borderRadius: 14, background: 'rgba(196,136,78,0.08)', border: '1px solid rgba(196,136,78,0.22)', display: 'flex', alignItems: 'center', gap: 10 }}>
          <AlertCircle size={13} style={{ color: 'var(--color-brand-orange)', flexShrink: 0 }} />
          <span style={{ fontSize: 12, color: 'var(--color-brand-orange)' }}>{overdue.length} overdue. Reschedule or complete to stay clear.</span>
        </div>
      )}

      {/* ── Add task ── */}
      <form onSubmit={handleAdd} style={{ marginBottom: 24, display: 'flex', gap: 8 }}>
        <input
          value={newTaskTitle}
          onChange={e => setNewTaskTitle(e.target.value)}
          placeholder={`Add task voor ${selectedDay ? format(selectedDay, 'd MMM', { locale: nlBE }) : 'geselecteerde dag'}...   /ceo  /bora`}
          className="input"
          style={{ flex: 1, borderRadius: 14, padding: '12px 16px', fontSize: 13 }}
        />
        <button type="submit" className="btn-primary cursor-pointer" style={{ gap: 6 }}>
          <Plus size={13} /> Add
        </button>
      </form>

      {/* ── Main 2-column layout ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 200px', gap: 16, alignItems: 'start' }}>

        {/* Left: calendar + selected day */}
        <div style={{ minWidth: 0, display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Month nav */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <button onClick={() => setViewDate(new Date(year, month - 1, 1))} className="btn-ghost cursor-pointer" style={{ padding: '7px 11px' }}>
              <ChevronLeft size={13} />
            </button>
            <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--color-ink)', textTransform: 'capitalize', letterSpacing: '-0.01em' }}>
              {format(viewDate, 'MMMM yyyy', { locale: nlBE })}
            </span>
            <button onClick={() => setViewDate(new Date(year, month + 1, 1))} className="btn-ghost cursor-pointer" style={{ padding: '7px 11px' }}>
              <ChevronRight size={13} />
            </button>
          </div>

          {/* Calendar grid */}
          <div className="card" style={{ overflow: 'hidden' }}>
            {/* Day headers */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', borderBottom: '1px solid var(--color-border)' }}>
              {['Ma','Di','Wo','Do','Vr','Za','Zo'].map(d => (
                <div key={d} style={{ padding: '12px 0', textAlign: 'center', fontSize: 9, fontWeight: 500, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--color-subtle)' }}>
                  {d}
                </div>
              ))}
            </div>
            {/* Cells */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
              {paddedDays.map((day, i) => {
                if (!day) return <div key={`p-${i}`} style={{ minHeight: 80, borderRight: '1px solid var(--color-border)', borderBottom: '1px solid var(--color-border)', background: 'rgba(0,0,0,0.04)' }} />
                const dt     = getForDay(day)
                const isSel  = selectedDay && isSameDay(day, selectedDay)
                const isTod  = isToday(day)
                return (
                  <div key={day.toISOString()} onClick={() => setSelectedDay(day)}
                    style={{
                      minHeight: 80, padding: '8px 8px',
                      borderRight: '1px solid var(--color-border)',
                      borderBottom: '1px solid var(--color-border)',
                      background: isSel ? 'rgba(232,168,76,0.07)' : 'transparent',
                      cursor: 'pointer',
                      transition: 'background 150ms ease',
                    }}>
                    <div style={{
                      width: 24, height: 24, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      marginBottom: 5,
                      background: isTod ? '#4C6481' : 'transparent',
                      fontSize: 11, fontWeight: isTod ? 700 : 400,
                      color: isTod ? '#fff' : isSel ? 'var(--color-ink)' : 'var(--color-muted)',
                    }}>
                      {format(day, 'd')}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      {(() => {
                        const dayKey = format(day, 'yyyy-MM-dd')
                        const isExpanded = expandedDay === dayKey
                        const visible = isExpanded ? dt : dt.slice(0, 2)
                        return (
                          <>
                            {visible.map(t => {
                              const bc = BIZ[t.business] || BIZ.all
                              return (
                                <div key={t.id} style={{ fontSize: 9, padding: '2px 5px', borderRadius: 4, background: bc.bg, color: bc.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 500 }}>
                                  {t.title}
                                </div>
                              )
                            })}
                            {dt.length > 2 && (
                              <div
                                onClick={e => { e.stopPropagation(); setExpandedDay(isExpanded ? null : dayKey) }}
                                style={{ fontSize: 9, paddingLeft: 5, color: '#4C6481', cursor: 'pointer', fontWeight: 600 }}
                              >
                                {isExpanded ? '↑ inklappen' : `+${dt.length - 2}`}
                              </div>
                            )}
                          </>
                        )
                      })()}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Selected day detail */}
          {selectedDay && (
            <div ref={selDayRef} className="card anim-fade-in" style={{ padding: '22px 26px' }}>
              <p style={{ fontSize: 10, fontWeight: 500, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--color-subtle)', marginBottom: 16 }}>
                {format(selectedDay, 'EEEE d MMMM', { locale: nlBE })}
              </p>
              {selTasks.length === 0
                ? <p style={{ fontSize: 13, fontStyle: 'italic', color: 'var(--color-subtle)' }}>Nothing planned. Add a task above.</p>
                : <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {selTasks.map(t => {
                      const bc = BIZ[t.business] || BIZ.all
                      const done = t.status === 'done'
                      return (
                        <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 14, background: 'var(--color-card)', border: '1px solid var(--color-border)' }}>
                          <button onClick={() => toggleTask(t.id)} style={{ background: 'none', padding: 0, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', width: 18, height: 18, borderRadius: 3, border: `1.5px solid ${done ? ACCENT : 'var(--color-border)'}`, flexShrink: 0, background: done ? ACCENT : 'transparent', color: '#fff', transition: 'all 150ms' }}>
                            {done && <Check size={10} />}
                          </button>
                          <span style={{ flex: 1, fontSize: 13, color: done ? 'var(--color-subtle)' : 'var(--color-ink)', textDecoration: done ? 'line-through' : 'none', lineHeight: 1.4 }}>
                            {t.title}
                          </span>
                          {t.business !== 'personal' && (
                            <span style={{ fontSize: 9, fontFamily: 'var(--font-mono)', color: ACCENT, letterSpacing: '0.08em' }}>{bc.label}</span>
                          )}
                          <button onClick={() => setEditTask(t)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: 'var(--color-subtle)', display: 'flex', alignItems: 'center' }}>
                            <Pencil size={11} />
                          </button>
                        </div>
                      )
                    })}
                  </div>
              }
            </div>
          )}
        </div>

        {/* Right: today + month list stacked */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, minWidth: 0 }}>

          {/* Today's tasks */}
          <div className="card" style={{ padding: '20px 22px' }}>
            <span className="section-label" style={{ marginBottom: 14 }}>Today</span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {todayTasks.slice(0, 8).map(t => (
                <div key={t.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                  <button onClick={() => toggleTask(t.id)} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', flexShrink: 0, marginTop: 1 }}>
                    <CheckBox checked={t.status === 'done'} onChange={() => {}} size="sm" />
                  </button>
                  <span style={{ flex: 1, fontSize: 12, lineHeight: 1.4, color: t.status === 'done' ? 'var(--color-subtle)' : 'var(--color-ink)', textDecoration: t.status === 'done' ? 'line-through' : 'none', wordBreak: 'break-word' }}>
                    {t.title}
                  </span>
                  <button onClick={() => setEditTask(t)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 3, color: 'var(--color-subtle)', flexShrink: 0, opacity: 0.6 }}>
                    <Pencil size={10} />
                  </button>
                </div>
              ))}
              {todayTasks.length === 0 && <p style={{ fontSize: 12, fontStyle: 'italic', color: 'var(--color-subtle)' }}>Clear board ✓</p>}
              {todayTasks.length > 8 && <p style={{ fontSize: 11, color: 'var(--color-subtle)', paddingTop: 4 }}>+{todayTasks.length - 8} more</p>}
            </div>
          </div>

          {/* This month */}
          <div className="card" style={{ padding: '20px 22px' }}>
            <span className="section-label" style={{ marginBottom: 14 }}>This month</span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0, maxHeight: 340, overflowY: 'auto' }}>
              {monthTasks.length === 0 && <p style={{ fontSize: 12, fontStyle: 'italic', color: 'var(--color-subtle)' }}>No tasks.</p>}
              {monthTasks
                .sort((a,b) => (a.dueDate||'').localeCompare(b.dueDate||''))
                .map((t, i) => {
                  const bc = BIZ[t.business] || BIZ.all
                  return (
                    <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 0', borderBottom: i < monthTasks.length - 1 ? '1px solid var(--color-border)' : 'none' }}>
                      <div style={{ width: 4, height: 4, borderRadius: '50%', background: t.status === 'done' ? 'var(--color-subtle)' : ACCENT, flexShrink: 0 }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: 11, color: t.status === 'done' ? 'var(--color-subtle)' : 'var(--color-ink)', textDecoration: t.status === 'done' ? 'line-through' : 'none', lineHeight: 1.3 }}>
                          {t.title}
                        </p>
                        {t.dueDate && <p style={{ fontSize: 9, fontFamily: 'var(--font-mono)', color: 'var(--color-subtle)', marginTop: 2 }}>{format(parseISO(t.dueDate), 'd MMM', { locale: nlBE })}</p>}
                      </div>
                      <button onClick={() => setEditTask(t)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 3, color: 'var(--color-subtle)', flexShrink: 0, opacity: 0.6 }}>
                        <Pencil size={10} />
                      </button>
                    </div>
                  )
                })}
            </div>
          </div>

          {/* Stats mini */}
          <div className="card" style={{ padding: '18px 22px' }}>
            <span className="section-label" style={{ marginBottom: 12 }}>Overview</span>
            {[
              { l: 'Today',    v: todayTasks.length,   c: 'var(--color-brand-orange)' },
              { l: 'Month',    v: monthTasks.length,   c: 'var(--color-ink)' },
              { l: 'Overdue',  v: overdue.length,      c: overdue.length > 0 ? 'var(--color-brand-orange)' : 'var(--color-subtle)' },
              { l: 'Done',     v: tasks.filter(t => t.status === 'done').length, c: 'var(--color-brand-green)' },
            ].map((s, i, arr) => (
              <div key={s.l} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 0', borderBottom: i < arr.length - 1 ? '1px solid var(--color-border)' : 'none' }}>
                <span style={{ fontSize: 12, color: 'var(--color-muted)' }}>{s.l}</span>
                <span style={{ fontSize: 16, fontWeight: 600, color: s.c, letterSpacing: '-0.03em', fontVariantNumeric: 'tabular-nums' }}>{s.v}</span>
              </div>
            ))}
          </div>

          {/* Recurring tasks */}
          <div className="card" style={{ padding: '18px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                <RefreshCw size={12} color="var(--color-subtle)" />
                <span className="section-label" style={{ margin: 0 }}>Recurring</span>
              </div>
              <button onClick={() => { setEditRecurring(undefined); setShowRecurring(true) }}
                style={{ width: 24, height: 24, borderRadius: 7, background: 'var(--color-surface)', border: '1px solid var(--color-border)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-subtle)' }}>
                <Plus size={12} />
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {recurring.length === 0 && (
                <p style={{ fontSize: 11, fontStyle: 'italic', color: 'var(--color-subtle)' }}>No recurring tasks yet.</p>
              )}
              {recurring.map(r => {
                const freqLabel = r.frequency === 'monthly'
                  ? `Dag ${r.monthlyDay} v/d maand`
                  : WEEK_DAYS.filter(w => r.days.includes(w.jsDay)).map(w => w.label).join(', ')
                const bizColor = r.business === 'ceo-lifestyle' ? 'var(--color-brand-orange)' : r.business === 'bora' ? 'var(--color-brand-green)' : 'var(--color-subtle)'
                return (
                  <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.04)', opacity: r.active ? 1 : 0.45 }}>
                    <div style={{ width: 5, height: 5, borderRadius: '50%', background: bizColor, flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 12, color: 'var(--color-ink)', lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.title}</p>
                      <p style={{ fontSize: 10, color: 'var(--color-subtle)', marginTop: 2 }}>{freqLabel}</p>
                    </div>
                    <button onClick={() => { setEditRecurring(r); setShowRecurring(true) }}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-subtle)', padding: 3, opacity: 0.6, flexShrink: 0 }}>
                      <Pencil size={10} />
                    </button>
                    <button onClick={() => deleteRecurring(r.id)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-subtle)', padding: 3, opacity: 0.6, flexShrink: 0 }}>
                      <Trash2 size={10} />
                    </button>
                  </div>
                )
              })}
            </div>
          </div>

        </div>
      </div>

      {/* Recurring modal */}
      {(showRecurring || editRecurring) && (
        <RecurringModal
          onClose={() => { setShowRecurring(false); setEditRecurring(undefined) }}
          editTask={editRecurring}
        />
      )}
    </div>
  )
}
