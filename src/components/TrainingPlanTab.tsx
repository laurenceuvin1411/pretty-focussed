import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { nlBE } from 'date-fns/locale'
import { Plus, Trash2, Check, ChevronDown, ChevronRight, Flag, CalendarPlus } from 'lucide-react'
import { useSportsStore, groupByWeek, weekLabel } from '../store/sportsStore'
import type { PlanDay } from '../store/sportsStore'
import { useTrainingStore } from '../store/trainingStore'
import { isOwner } from '../lib/workspace'
import { TRIATHLON_PLAN, RACE_DATE } from '../data/laurenceTriathlon'

const ACCENT = '#4C6481'
const today = () => format(new Date(), 'yyyy-MM-dd')

const inputStyle: React.CSSProperties = {
  padding: '9px 12px', borderRadius: 12, border: '1px solid var(--color-border)',
  background: 'var(--color-surface)', color: 'var(--color-ink)', fontSize: 13,
  fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box',
}

function planIcon(title: string) {
  const t = title.toLowerCase()
  if (t.includes('rust')) return '😴'
  if (t.includes('race') || t.includes('wedstrijd') || t.includes('test')) return '🏁'
  if (t.includes('kracht')) return '🏋️'
  if (t.includes('loop') || t.includes('run')) return '🏃'
  if (t.includes('fiets') || t.includes('bike')) return '🚴'
  if (t.includes('zwem') || t.includes('swim')) return '🏊'
  if (t.includes('brick')) return '🔁'
  return '💪'
}

// ── Eén dag in het plan ──────────────────────────────────────────
function DayRow({ planId, day }: { planId: string; day: PlanDay }) {
  const { updateDay, deleteDay, toggleDayDone } = useSportsStore()
  const [editing, setEditing] = useState(false)
  const [title, setTitle] = useState(day.title)
  const [details, setDetails] = useState(day.details)

  const isToday = day.date === today()
  const isPast = day.date < today()

  function save() {
    updateDay(planId, day.id, { title: title.trim(), details: details.trim() })
    setEditing(false)
  }

  return (
    <div style={{ opacity: isPast && !isToday ? 0.45 : 1 }}>
      <div
        onClick={() => editing ? undefined : setEditing(true)}
        style={{
          display: 'flex', gap: 12, padding: '11px 14px',
          borderRadius: editing ? '14px 14px 0 0' : 14,
          background: isToday ? 'rgba(76,100,129,0.10)' : 'var(--color-card)',
          border: `1px solid ${editing ? ACCENT + '55' : isToday ? 'rgba(76,100,129,0.35)' : 'var(--color-border)'}`,
          borderBottom: editing ? 'none' : undefined,
          cursor: 'pointer',
        }}
      >
        {/* Datum */}
        <div style={{ minWidth: 30, textAlign: 'center', flexShrink: 0 }}>
          <div style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: isToday ? ACCENT : 'var(--color-muted)', fontWeight: isToday ? 700 : 400 }}>
            {format(new Date(day.date + 'T12:00:00'), 'EEEEEE', { locale: nlBE })}
          </div>
          <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--color-subtle)', marginTop: 1 }}>{day.date.slice(8)}</div>
        </div>

        <div style={{ fontSize: 16, lineHeight: 1, marginTop: 2, flexShrink: 0 }}>{planIcon(day.title)}</div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: 13, fontWeight: isToday ? 700 : 600, color: 'var(--color-ink)', lineHeight: 1.3, textDecoration: day.done ? 'line-through' : 'none' }}>
            {day.title || 'Zonder titel'}
          </p>
          {day.details && <p style={{ fontSize: 11, color: 'var(--color-muted)', marginTop: 3, lineHeight: 1.5 }}>{day.details}</p>}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
          {isToday && <span style={{ fontSize: 9, fontFamily: 'var(--font-mono)', background: ACCENT, color: '#fff', padding: '2px 7px', borderRadius: 99 }}>VANDAAG</span>}
          <button
            onClick={e => { e.stopPropagation(); toggleDayDone(planId, day.id) }}
            aria-label={day.done ? 'Markeer als niet gedaan' : 'Markeer als gedaan'}
            style={{
              width: 22, height: 22, borderRadius: 7, cursor: 'pointer', flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: day.done ? '#6DB889' : 'transparent',
              border: `2px solid ${day.done ? '#6DB889' : 'rgba(124,127,132,0.30)'}`,
            }}
          >
            {day.done && <Check size={11} color="#fff" strokeWidth={3} />}
          </button>
        </div>
      </div>

      {editing && (
        <div style={{ padding: '12px 14px', background: 'var(--color-card)', border: `1px solid ${ACCENT}55`, borderTop: 'none', borderRadius: '0 0 14px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Training" style={{ ...inputStyle, width: '100%' }} />
          <textarea value={details} onChange={e => setDetails(e.target.value)} placeholder="Details, instructies van je coach..." rows={3} style={{ ...inputStyle, width: '100%', resize: 'vertical', lineHeight: 1.6 }} />
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={save} style={{ padding: '8px 16px', borderRadius: 99, border: 'none', cursor: 'pointer', fontSize: 11, fontFamily: 'var(--font-mono)', fontWeight: 700, background: ACCENT, color: '#fff', letterSpacing: '0.06em' }}>OPSLAAN</button>
            <button onClick={() => setEditing(false)} style={{ padding: '8px 16px', borderRadius: 99, border: '1px solid var(--color-border)', cursor: 'pointer', fontSize: 11, fontFamily: 'var(--font-mono)', background: 'transparent', color: 'var(--color-muted)' }}>ANNULEER</button>
            <button onClick={() => { deleteDay(planId, day.id); setEditing(false) }} title="Verwijder dag" style={{ marginLeft: 'auto', width: 30, height: 30, borderRadius: 10, border: '1px solid var(--color-border)', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-subtle)' }}><Trash2 size={12} /></button>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Nieuwe dag toevoegen ─────────────────────────────────────────
function AddDayForm({ planId, defaultDate }: { planId: string; defaultDate: string }) {
  const { addDay } = useSportsStore()
  const [open, setOpen] = useState(false)
  const [date, setDate] = useState(defaultDate)
  const [title, setTitle] = useState('')
  const [details, setDetails] = useState('')

  function save() {
    if (!title.trim() || !date) return
    addDay(planId, { date, title: title.trim(), details: details.trim() })
    setTitle(''); setDetails('')
    // volgende dag alvast klaarzetten
    const next = new Date(date + 'T12:00:00')
    next.setDate(next.getDate() + 1)
    setDate(next.toISOString().split('T')[0])
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} data-testid="open-add-day"
        style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '11px 16px', borderRadius: 14, border: '1.5px dashed var(--color-border)', background: 'transparent', cursor: 'pointer', fontSize: 12.5, color: 'var(--color-subtle)', fontFamily: 'inherit', width: '100%', justifyContent: 'center' }}>
        <Plus size={13} /> Training toevoegen
      </button>
    )
  }

  return (
    <div style={{ padding: 14, borderRadius: 16, border: `1px solid ${ACCENT}40`, background: 'var(--color-card)', display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', gap: 8 }}>
        <input type="date" value={date} onChange={e => setDate(e.target.value)} aria-label="Datum" style={{ ...inputStyle, width: 150, colorScheme: 'light dark' }} />
        <input value={title} onChange={e => setTitle(e.target.value)} onKeyDown={e => e.key === 'Enter' && save()} placeholder="Training, bv. Loop intervallen" aria-label="Training" style={{ ...inputStyle, flex: 1 }} autoFocus />
      </div>
      <textarea value={details} onChange={e => setDetails(e.target.value)} placeholder="Details (optioneel)" rows={2} style={{ ...inputStyle, resize: 'vertical' }} />
      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={save} disabled={!title.trim()} data-testid="save-day"
          style={{ padding: '8px 18px', borderRadius: 99, border: 'none', cursor: title.trim() ? 'pointer' : 'default', fontSize: 11.5, fontWeight: 700, background: title.trim() ? 'var(--color-ink)' : 'var(--color-border)', color: title.trim() ? 'var(--color-bg)' : 'var(--color-muted)', fontFamily: 'inherit' }}>
          Toevoegen
        </button>
        <button onClick={() => setOpen(false)} style={{ padding: '8px 16px', borderRadius: 99, border: '1px solid var(--color-border)', background: 'transparent', color: 'var(--color-subtle)', fontSize: 11.5, cursor: 'pointer', fontFamily: 'inherit' }}>Sluiten</button>
      </div>
    </div>
  )
}

// ── Hoofdcomponent ───────────────────────────────────────────────
export function TrainingPlanTab() {
  const { plans, races, activePlanId, addPlan, setActivePlan, deletePlan, updatePlan, addDay, addRace } = useSportsStore()
  const { competitions } = useTrainingStore()
  const [newPlanName, setNewPlanName] = useState('')
  const [showPast, setShowPast] = useState(false)
  const [imported, setImported] = useState(false)

  // Laurence' bestaande triathlonschema eenmalig overnemen, zodat het
  // bewerkbaar wordt in plaats van vastgezet in de code.
  useEffect(() => {
    if (!isOwner() || imported) return
    const store = useSportsStore.getState()
    if (store.plans.length > 0) return
    const raceId = store.races.some(r => r.date === RACE_DATE)
      ? store.races.find(r => r.date === RACE_DATE)!.id
      : store.addRace('1/8 Triathlon', RACE_DATE)
    const planId = store.addPlan('1/8 Triathlon opbouw', raceId)
    TRIATHLON_PLAN.forEach(d => store.addDay(planId, { date: d.date, title: d.training, details: d.details }))
    setImported(true)
  }, [imported])

  const plan = plans.find(p => p.id === activePlanId) ?? plans[0]
  const linkedRace = plan?.raceId ? races.find(r => r.id === plan.raceId) : undefined
  const todayStr = today()

  // Wedstrijd om naar af te tellen: gekoppeld, anders de eerstvolgende uit beide bronnen
  const upcomingRace = linkedRace ?? [...races, ...competitions.map(c => ({ id: c.id, name: c.name, date: c.date, createdAt: '' }))]
    .filter(r => r.date >= todayStr).sort((a, b) => a.date.localeCompare(b.date))[0]
  const daysLeft = upcomingRace
    ? Math.max(0, Math.ceil((new Date(upcomingRace.date).getTime() - new Date(todayStr).getTime()) / 86400000))
    : null

  // Geen plan: lege template met uitleg
  if (!plan) {
    return (
      <div>
        <div style={{ padding: '44px 26px', borderRadius: 20, border: '1.5px dashed var(--color-border)', textAlign: 'center', marginBottom: 18 }}>
          <CalendarPlus size={20} color={ACCENT} style={{ marginBottom: 12 }} />
          <p style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-ink)', marginBottom: 4 }}>Nog geen trainingsplan.</p>
          <p style={{ fontSize: 13, color: 'var(--color-subtle)', marginBottom: 20, lineHeight: 1.6 }}>
            Maak een plan naar een doel toe: een wedstrijd, een afstand of gewoon een blok van een paar weken.
          </p>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
            <input
              value={newPlanName}
              onChange={e => setNewPlanName(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && newPlanName.trim()) { addPlan(newPlanName.trim()); setNewPlanName('') } }}
              placeholder="Naam van je plan"
              aria-label="Naam van je plan"
              data-testid="new-plan-name"
              style={{ ...inputStyle, width: 240 }}
            />
            <button
              onClick={() => { if (newPlanName.trim()) { addPlan(newPlanName.trim()); setNewPlanName('') } }}
              data-testid="create-plan"
              style={{ padding: '10px 20px', borderRadius: 99, border: 'none', background: 'var(--color-ink)', color: 'var(--color-bg)', fontSize: 12.5, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
              Plan aanmaken
            </button>
          </div>
        </div>
      </div>
    )
  }

  const sortedDays = [...plan.days].sort((a, b) => a.date.localeCompare(b.date))
  const weeks = groupByWeek(sortedDays)
  const currentWeek = sortedDays.find(d => d.date >= todayStr)
    ? weekLabel(sortedDays.find(d => d.date >= todayStr)!.date, sortedDays[0].date)
    : weeks[weeks.length - 1]?.[0]
  const currentIdx = weeks.findIndex(([w]) => w === currentWeek)
  const pastWeeks = currentIdx > 0 ? weeks.slice(0, currentIdx) : []
  const upcomingWeeks = currentIdx >= 0 ? weeks.slice(currentIdx) : weeks

  function renderWeek([week, days]: [string, PlanDay[]]) {
    const isCurrent = week === currentWeek
    return (
      <div key={week} style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', fontWeight: 700, color: isCurrent ? 'var(--color-ink)' : 'var(--color-muted)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>{week}</span>
          <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--color-subtle)' }}>
            {days.filter(d => d.done).length}/{days.length}
          </span>
          {isCurrent && <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', background: ACCENT, color: '#fff', padding: '2px 8px', borderRadius: 99 }}>NU</span>}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5, borderLeft: '1px solid var(--color-border)', paddingLeft: 16 }}>
          {days.map(d => <DayRow key={d.id} planId={plan!.id} day={d} />)}
        </div>
      </div>
    )
  }

  return (
    <div>
      {/* Planselectie + wedstrijd-aftelling */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18, flexWrap: 'wrap' }}>
        <select
          value={plan.id}
          onChange={e => setActivePlan(e.target.value)}
          aria-label="Kies plan"
          style={{ ...inputStyle, fontWeight: 700, cursor: 'pointer', maxWidth: 260 }}
        >
          {plans.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <button
          onClick={() => { const n = prompt('Naam van het nieuwe plan?'); if (n?.trim()) addPlan(n.trim()) }}
          title="Nieuw plan"
          style={{ width: 36, height: 36, borderRadius: 12, border: '1px solid var(--color-border)', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-muted)' }}>
          <Plus size={14} />
        </button>
        <select
          value={plan.raceId ?? ''}
          onChange={e => updatePlan(plan.id, { raceId: e.target.value || undefined })}
          aria-label="Koppel wedstrijd"
          style={{ ...inputStyle, cursor: 'pointer', maxWidth: 220, fontSize: 12 }}
        >
          <option value="">Geen wedstrijd gekoppeld</option>
          {races.map(r => <option key={r.id} value={r.id}>{r.name} · {r.date}</option>)}
        </select>
        <button
          onClick={() => {
            const n = prompt('Naam van de wedstrijd?')
            if (!n?.trim()) return
            const d = prompt('Datum (JJJJ-MM-DD)?')
            if (!d?.match(/^\d{4}-\d{2}-\d{2}$/)) return
            const id = addRace(n.trim(), d)
            updatePlan(plan.id, { raceId: id })
          }}
          title="Wedstrijd toevoegen"
          style={{ width: 36, height: 36, borderRadius: 12, border: '1px solid var(--color-border)', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-muted)' }}>
          <Flag size={13} />
        </button>
        <button
          onClick={() => { if (confirm(`Plan "${plan.name}" verwijderen?`)) deletePlan(plan.id) }}
          title="Plan verwijderen"
          style={{ marginLeft: 'auto', width: 36, height: 36, borderRadius: 12, border: '1px solid var(--color-border)', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-subtle)' }}>
          <Trash2 size={13} />
        </button>
      </div>

      {upcomingRace && daysLeft != null && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, padding: '14px 18px', borderRadius: 16, background: 'var(--color-card)', border: '1px solid var(--color-border)' }}>
          <div>
            <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--color-muted)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Race dag</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-ink)', marginTop: 2 }}>
              {upcomingRace.name} · {format(new Date(upcomingRace.date + 'T12:00:00'), 'd MMMM yyyy', { locale: nlBE })}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--color-ink)', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>{daysLeft}</div>
            <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--color-muted)' }}>DAGEN</div>
          </div>
        </div>
      )}

      {/* Weken: huidige eerst */}
      {sortedDays.length === 0 ? (
        <p style={{ fontSize: 13, color: 'var(--color-subtle)', textAlign: 'center', padding: '24px 0' }}>
          Nog geen trainingen in dit plan. Voeg je eerste training toe.
        </p>
      ) : (
        <>
          {upcomingWeeks.map(renderWeek)}
          {pastWeeks.length > 0 && (
            <div style={{ marginTop: 4, marginBottom: 18 }}>
              <button
                onClick={() => setShowPast(v => !v)}
                style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 14px', borderRadius: 12, border: '1px solid var(--color-border)', background: 'transparent', cursor: 'pointer', fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--color-muted)' }}>
                {showPast ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                {pastWeeks.length} voorbije {pastWeeks.length === 1 ? 'week' : 'weken'}
              </button>
              {showPast && <div style={{ marginTop: 14, opacity: 0.7 }}>{pastWeeks.map(renderWeek)}</div>}
            </div>
          )}
        </>
      )}

      <AddDayForm planId={plan.id} defaultDate={todayStr} />
    </div>
  )
}
