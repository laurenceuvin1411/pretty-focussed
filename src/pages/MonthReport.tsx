import { useState } from 'react'
import { format, getDaysInMonth, startOfMonth } from 'date-fns'
import { nlBE } from 'date-fns/locale'
import { useHabitStore } from '../store/habitStore'
import { useTaskStore } from '../store/taskStore'
import { useLeadStore } from '../store/leadStore'
import { useFinanceStore } from '../store/financeStore'
import { ChevronLeft, ChevronRight } from 'lucide-react'

function fmt(n: number) {
  return new Intl.NumberFormat('nl-BE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n)
}

function ScoreBar({ value, color = 'var(--color-accent)' }: { value: number; color?: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <div style={{ flex: 1, height: 6, borderRadius: 99, background: 'var(--color-border)', overflow: 'hidden' }}>
        <div style={{ width: `${value}%`, height: '100%', background: color, borderRadius: 99, transition: 'width 0.6s cubic-bezier(.16,1,.3,1)' }} />
      </div>
      <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-ink)', minWidth: 36, textAlign: 'right' }}>{value}%</span>
    </div>
  )
}

export function MonthReport() {
  const now = new Date()
  const [year, setYear]   = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1)

  const monthStr = `${year}-${String(month).padStart(2, '0')}`
  const daysInMonth = getDaysInMonth(new Date(year, month - 1))
  const monthLabel  = format(startOfMonth(new Date(year, month - 1)), 'MMMM yyyy', { locale: nlBE })

  const { habits, logs, getDailyScore, getMonthlyScore, getPerfectDays } = useHabitStore()
  const { tasks } = useTaskStore()
  const { leads } = useLeadStore()
  const { getMonthRevenue, getMonthExpenses } = useFinanceStore()

  function prevMonth() { if (month === 1) { setMonth(12); setYear(y => y - 1) } else setMonth(m => m - 1) }
  function nextMonth() { if (month === 12) { setMonth(1); setYear(y => y + 1) } else setMonth(m => m + 1) }

  // ── Habit stats ──────────────────────────────────────────────────────
  const habitScore  = getMonthlyScore(monthStr)
  const perfectDays = getPerfectDays(monthStr)
  const activeHabits = habits.filter(h => h.active)

  const habitRows = activeHabits.map(h => {
    const completed = logs.filter(l => l.habitId === h.id && l.date.startsWith(monthStr) && l.completed).length
    const pct = daysInMonth > 0 ? Math.round((completed / daysInMonth) * 100) : 0
    return { habit: h, completed, pct }
  }).sort((a, b) => b.pct - a.pct)

  // ── Daily score calendar ─────────────────────────────────────────────
  const dailyScores = Array.from({ length: daysInMonth }, (_, i) => {
    const d = `${year}-${String(month).padStart(2, '0')}-${String(i + 1).padStart(2, '0')}`
    return { day: i + 1, score: getDailyScore(d) }
  })

  // ── Tasks stats ──────────────────────────────────────────────────────
  const monthTasks = tasks.filter(t => {
    const d = t.completedAt || t.dueDate || t.scheduledDate
    return d && d.startsWith(monthStr)
  })
  const doneTasks   = monthTasks.filter(t => t.status === 'done').length
  const totalTasks  = monthTasks.length
  const taskPct     = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0

  const needleMovers = tasks.filter(t => t.needleMover && t.completedAt?.startsWith(monthStr)).length

  // ── Sales stats ──────────────────────────────────────────────────────
  const wonLeads      = leads.filter(l => l.status === 'won' && l.lastContact.startsWith(monthStr))
  const contactedLeads = leads.filter(l => l.lastContact.startsWith(monthStr))
  const wonValue      = wonLeads.reduce((s, l) => s + l.value, 0)

  // ── Finance ──────────────────────────────────────────────────────────
  const revenue  = getMonthRevenue(monthStr)
  const expenses = getMonthExpenses(monthStr)
  const net      = revenue - expenses

  const statCardStyle = {
    padding: '20px 24px',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 6,
  }

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 36 }}>
        <div>
          <h1 style={{ fontSize: 32, fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1, color: 'var(--color-ink)', marginBottom: 4 }}>
            Month Report
          </h1>
          <p style={{ fontSize: 13, color: 'var(--color-muted)' }}>What did you achieve this month?</p>
        </div>

        {/* Month picker */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={prevMonth} style={{ width: 32, height: 32, borderRadius: 16, border: '1px solid var(--color-border)', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-muted)' }}>
            <ChevronLeft size={14} />
          </button>
          <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-ink)', minWidth: 110, textAlign: 'center', textTransform: 'capitalize' }}>
            {monthLabel}
          </span>
          <button onClick={nextMonth} disabled={year === now.getFullYear() && month === now.getMonth() + 1} style={{ width: 32, height: 32, borderRadius: 16, border: '1px solid var(--color-border)', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-muted)', opacity: (year === now.getFullYear() && month === now.getMonth() + 1) ? 0.3 : 1 }}>
            <ChevronRight size={14} />
          </button>
        </div>
      </div>

      {/* Top stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 28 }}>
        {[
          { label: 'Habit score', value: `${habitScore}%`, sub: `${perfectDays} perfect days`, color: habitScore >= 75 ? 'var(--color-brand-green)' : 'var(--color-accent)' },
          { label: 'Tasks completed', value: `${doneTasks}/${totalTasks}`, sub: `${needleMovers} needle movers`, color: 'var(--color-accent)' },
          { label: 'Sales won', value: fmt(wonValue), sub: `${wonLeads.length} new customers`, color: 'var(--color-brand-green)' },
          { label: 'Net result', value: fmt(net), sub: `${fmt(revenue)} revenue`, color: net >= 0 ? 'var(--color-brand-green)' : 'var(--color-brand-orange)' },
        ].map(s => (
          <div key={s.label} className="card" style={statCardStyle}>
            <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--color-subtle)' }}>{s.label}</p>
            <p style={{ fontSize: 26, fontWeight: 700, color: s.color, lineHeight: 1 }}>{s.value}</p>
            <p style={{ fontSize: 11, color: 'var(--color-muted)' }}>{s.sub}</p>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>

        {/* Habit heatmap */}
        <div className="card" style={{ padding: 24 }}>
          <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--color-subtle)', marginBottom: 16 }}>
            Daily habit score
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 5 }}>
            {dailyScores.map(({ day, score }) => {
              const bg = score === 0
                ? 'var(--color-border)'
                : score >= 75 ? 'var(--color-brand-green)'
                : score >= 50 ? 'var(--color-accent)'
                : 'var(--color-brand-orange)'
              return (
                <div key={day} title={`${day}/${month}: ${score}%`} style={{
                  aspectRatio: '1', borderRadius: 5,
                  background: bg, opacity: score === 0 ? 0.4 : 0.85,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 9, color: score > 0 ? '#fff' : 'var(--color-muted)',
                  fontWeight: 600,
                }}>
                  {day}
                </div>
              )
            })}
          </div>
          <div style={{ display: 'flex', gap: 12, marginTop: 14, fontSize: 10, color: 'var(--color-muted)' }}>
            {[['var(--color-brand-green)', '≥75%'], ['var(--color-accent)', '50–74%'], ['var(--color-brand-orange)', '<50%']].map(([c, l]) => (
              <span key={l} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{ width: 8, height: 8, borderRadius: 2, background: c, display: 'inline-block' }} />
                {l}
              </span>
            ))}
          </div>
        </div>

        {/* Per habit breakdown */}
        <div className="card" style={{ padding: 24 }}>
          <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--color-subtle)', marginBottom: 16 }}>
            Per habit
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {habitRows.length === 0 && (
              <p style={{ fontSize: 12, color: 'var(--color-muted)' }}>No habits configured</p>
            )}
            {habitRows.map(({ habit, completed, pct }) => (
              <div key={habit.id}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                  <span style={{ fontSize: 12, color: 'var(--color-ink)' }}>{habit.icon} {habit.name}</span>
                  <span style={{ fontSize: 11, color: 'var(--color-muted)' }}>{completed}/{daysInMonth}d</span>
                </div>
                <ScoreBar value={pct} color={habit.color} />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>

        {/* Tasks */}
        <div className="card" style={{ padding: 24 }}>
          <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--color-subtle)', marginBottom: 16 }}>
            Tasks — {taskPct}% completed
          </p>
          <ScoreBar value={taskPct} color="var(--color-accent)" />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 20 }}>
            {[
              { label: 'Done', value: doneTasks, color: 'var(--color-brand-green)' },
              { label: 'Needle movers', value: needleMovers, color: 'var(--color-accent)' },
              { label: 'Outstanding', value: totalTasks - doneTasks, color: 'var(--color-brand-orange)' },
              { label: 'Contacten sales', value: contactedLeads.length, color: 'var(--color-subtle)' },
            ].map(s => (
              <div key={s.label} style={{ padding: '12px 14px', borderRadius: 16, background: 'var(--color-surface)' }}>
                <p style={{ fontSize: 9, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--color-subtle)', marginBottom: 4 }}>{s.label}</p>
                <p style={{ fontSize: 22, fontWeight: 700, color: s.color }}>{s.value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Finance */}
        <div className="card" style={{ padding: 24 }}>
          <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--color-subtle)', marginBottom: 16 }}>
            Finance
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              { label: 'Revenue', value: revenue, color: 'var(--color-brand-green)' },
              { label: 'Expenses', value: expenses, color: 'var(--color-brand-orange)' },
              { label: 'Net', value: net, color: net >= 0 ? 'var(--color-brand-green)' : 'var(--color-brand-orange)', border: true },
            ].map(s => (
              <div key={s.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: s.border ? 12 : 0, borderTop: s.border ? '1px solid var(--color-border)' : 'none' }}>
                <span style={{ fontSize: 13, color: 'var(--color-muted)' }}>{s.label}</span>
                <span style={{ fontSize: 16, fontWeight: 700, color: s.color }}>{fmt(s.value)}</span>
              </div>
            ))}
          </div>

          {wonLeads.length > 0 && (
            <div style={{ marginTop: 18, paddingTop: 16, borderTop: '1px solid var(--color-border)' }}>
              <p style={{ fontSize: 11, color: 'var(--color-subtle)', marginBottom: 8 }}>Won customers</p>
              {wonLeads.map(l => (
                <div key={l.id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 12, color: 'var(--color-ink)' }}>{l.name}</span>
                  <span style={{ fontSize: 12, color: 'var(--color-brand-green)', fontWeight: 600 }}>{fmt(l.value)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

    </div>
  )
}
