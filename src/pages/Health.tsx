import { useState, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { format, subDays, differenceInDays, parseISO, isAfter, isBefore, addDays } from 'date-fns'
import { nlBE } from 'date-fns/locale'
import { Moon, Zap, Droplets, Footprints, Heart, TrendingUp, Wind, Dumbbell, ChevronLeft, ChevronRight, Trophy, Plus, Pencil, Trash2, X, Check, MapPin, Target, Clock } from 'lucide-react'
import { useHealthStore, WORKOUT_LABEL, WORKOUT_EMOJI } from '../store/healthStore'
import { useTrainingStore, SPORT_LABEL, SPORT_EMOJI, SPORT_COLOR } from '../store/trainingStore'
import { useTriathlonStore } from '../store/triathlonStore'
import type { WorkoutType } from '../store/healthStore'
import type { SportType, Competition, TrainingDay } from '../store/trainingStore'
import { TrainingPlanTab } from '../components/TrainingPlanTab'

const TODAY = format(new Date(), 'yyyy-MM-dd')
const DAY_NAMES = ['Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za', 'Zo']
const DAY_NAMES_LONG = ['Maandag', 'Dinsdag', 'Woensdag', 'Donderdag', 'Vrijdag', 'Zaterdag', 'Zondag']
const SPORTS: SportType[] = ['strength', 'run', 'cycle', 'swim', 'triathlon', 'cardio', 'yoga', 'walk', 'sport', 'rest', 'off']

// ── Helpers ────────────────────────────────────────────────────────────────
function todayDayIndex() {
  const d = new Date().getDay() // 0=Sun
  return d === 0 ? 6 : d - 1   // convert to Mon=0
}

function daysUntil(dateStr: string): number {
  return differenceInDays(parseISO(dateStr), new Date())
}

// ── Mini bar chart ─────────────────────────────────────────────────────────
function SparkBar({ values, max, color, height = 32 }: { values: number[]; max: number; color: string; height?: number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height }}>
      {values.map((v, i) => (
        <div key={i} style={{
          flex: 1, borderRadius: 3,
          height: max > 0 ? `${Math.max(4, (v / max) * height)}px` : 4,
          background: v > 0 ? color : 'var(--color-border)',
          transition: 'height 400ms cubic-bezier(.16,1,.3,1)',
          opacity: i === values.length - 1 ? 1 : 0.6 + (i / values.length) * 0.4,
        }} />
      ))}
    </div>
  )
}

function TrendRow({ label, values, max, color, unit }: { label: string; values: number[]; max: number; color: string; unit: string }) {
  const last = values[values.length - 1]
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0', borderBottom: '1px solid var(--color-border)' }}>
      <span style={{ fontSize: 11, color: 'var(--color-muted)', width: 60, flexShrink: 0 }}>{label}</span>
      <div style={{ flex: 1 }}><SparkBar values={values} max={max} color={color} height={28} /></div>
      <span style={{ fontSize: 12, fontWeight: 700, color, width: 44, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
        {last > 0 ? `${last}${unit}` : '—'}
      </span>
    </div>
  )
}

// ── Metric input ───────────────────────────────────────────────────────────
function MetricCard({ icon, label, value, unit, min, max, step, color, onChange, display }: {
  icon: React.ReactNode; label: string; value: number; unit: string
  min: number; max: number; step: number; color: string
  onChange: (v: number) => void; display?: string
}) {
  return (
    <div style={{ padding: '18px 20px', borderRadius: 14, background: 'var(--color-card)', border: '1px solid var(--color-border)', display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ color }}>{icon}</div>
          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</span>
        </div>
        <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--color-ink)', fontVariantNumeric: 'tabular-nums' }}>
          {display ?? value}<span style={{ fontSize: 11, fontWeight: 500, color: 'var(--color-subtle)', marginLeft: 3 }}>{unit}</span>
        </div>
      </div>
      <input type="range" min={min} max={max} step={step} value={value} onChange={e => onChange(Number(e.target.value))} style={{ width: '100%', accentColor: color }} />
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 10, color: 'var(--color-subtle)' }}>{min}{unit}</span>
        <span style={{ fontSize: 10, color: 'var(--color-subtle)' }}>{max}{unit}</span>
      </div>
    </div>
  )
}

function SleepQuality({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const labels = ['', 'Slecht', 'Matig', 'Oké', 'Goed', 'Perfect']
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      {[1, 2, 3, 4, 5].map(v => (
        <button key={v} onClick={() => onChange(v)} style={{
          background: 'none', border: 'none', cursor: 'pointer', fontSize: 22,
          opacity: v <= value ? 1 : 0.25, transition: 'all 150ms', padding: 2,
        }}>⭐</button>
      ))}
      <span style={{ fontSize: 12, color: 'var(--color-muted)', marginLeft: 4 }}>{labels[value]}</span>
    </div>
  )
}

function WorkoutSelector({ active, type, onToggle, onType }: {
  active: boolean; type?: WorkoutType; onToggle: () => void; onType: (t: WorkoutType) => void
}) {
  const types: WorkoutType[] = ['strength', 'cardio', 'yoga', 'walk', 'run', 'cycle', 'swim', 'sport', 'rest']
  return (
    <div style={{ padding: '18px 20px', borderRadius: 14, background: 'var(--color-card)', border: '1px solid var(--color-border)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: active ? 14 : 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Dumbbell size={16} color="#C4935A" />
          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Training</span>
        </div>
        <button onClick={onToggle} style={{
          padding: '6px 14px', borderRadius: 99, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 700,
          background: active ? 'var(--color-accent)' : 'var(--color-surface)', color: active ? '#0A0805' : 'var(--color-subtle)',
        }}>{active ? '✓ Gedaan' : 'Log training'}</button>
      </div>
      {active && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {types.map(t => (
            <button key={t} onClick={() => onType(t)} style={{
              padding: '5px 10px', borderRadius: 99, border: '1px solid', cursor: 'pointer', fontSize: 11, fontWeight: 600,
              borderColor: type === t ? 'var(--color-accent)' : 'var(--color-border)',
              background: type === t ? 'rgba(196,136,78,0.12)' : 'transparent',
              color: type === t ? 'var(--color-accent)' : 'var(--color-subtle)',
            }}>{WORKOUT_EMOJI[t]} {WORKOUT_LABEL[t]}</button>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Training Schema ────────────────────────────────────────────────────────
function TrainingSchema() {
  const { schedule, updateDay } = useTrainingStore()
  const todayIdx = todayDayIndex()
  const [editing, setEditing] = useState<number | null>(null)
  const [editForm, setEditForm] = useState<Partial<TrainingDay>>({})

  const sorted = [...schedule].sort((a, b) => a.day - b.day)

  function openEdit(d: TrainingDay) {
    setEditing(d.day)
    setEditForm({ sport: d.sport, label: d.label, durationMin: d.durationMin, notes: d.notes })
  }

  function saveEdit() {
    if (editing === null) return
    updateDay(editing, editForm)
    setEditing(null)
  }

  // Find next training day (not rest/off) from today
  const nextTraining = (() => {
    for (let i = 1; i <= 7; i++) {
      const idx = (todayIdx + i) % 7
      const d = sorted.find(s => s.day === idx)
      if (d && d.sport !== 'rest' && d.sport !== 'off') return { ...d, daysAway: i }
    }
    return null
  })()

  return (
    <div>
      {/* Next session alert */}
      {nextTraining && (
        <div style={{ marginBottom: 20, padding: '14px 20px', borderRadius: 14, background: `${SPORT_COLOR[nextTraining.sport]}12`, border: `1px solid ${SPORT_COLOR[nextTraining.sport]}33`, display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 22 }}>{SPORT_EMOJI[nextTraining.sport]}</span>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-ink)' }}>{nextTraining.label}</div>
            <div style={{ fontSize: 11, color: 'var(--color-muted)', marginTop: 2 }}>
              {nextTraining.daysAway === 1 ? 'Morgen' : `Over ${nextTraining.daysAway} dagen`} · {DAY_NAMES_LONG[nextTraining.day]} · {nextTraining.durationMin} min
            </div>
          </div>
        </div>
      )}

      {/* Week grid */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {sorted.map(d => {
          const isToday = d.day === todayIdx
          const color = SPORT_COLOR[d.sport]
          return (
            <div key={d.day} style={{
              padding: '14px 18px', borderRadius: 14,
              background: isToday ? `${color}15` : 'var(--color-card)',
              border: `1px solid ${isToday ? color + '55' : 'var(--color-border)'}`,
              display: 'flex', alignItems: 'center', gap: 14,
              transition: 'all 200ms',
            }}>
              {/* Day label */}
              <div style={{ width: 28, flexShrink: 0, textAlign: 'center' }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: isToday ? color : 'var(--color-subtle)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{DAY_NAMES[d.day]}</div>
                {isToday && <div style={{ width: 6, height: 6, borderRadius: '50%', background: color, margin: '3px auto 0' }} />}
              </div>

              {/* Emoji + sport */}
              <div style={{ width: 34, height: 34, borderRadius: 16, background: `${color}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>
                {SPORT_EMOJI[d.sport]}
              </div>

              {/* Label */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-ink)' }}>{d.label}</div>
                <div style={{ fontSize: 11, color: 'var(--color-subtle)', marginTop: 2 }}>
                  {SPORT_LABEL[d.sport]}{d.durationMin > 0 ? ` · ${d.durationMin} min` : ''}
                  {d.notes ? ` · ${d.notes}` : ''}
                </div>
              </div>

              {/* Edit */}
              <button onClick={() => openEdit(d)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-subtle)', padding: 4, opacity: 0.6 }}>
                <Pencil size={13} />
              </button>
            </div>
          )
        })}
      </div>

      {/* Edit modal */}
      {editing !== null && createPortal(
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '0 16px' }}>
          <div style={{ width: '100%', maxWidth: 480, background: 'var(--color-card-solid)', borderRadius: 18, border: '1px solid var(--color-border)', boxShadow: '0 24px 60px rgba(0,0,0,0.25)', padding: '26px 26px 30px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-ink)', margin: 0 }}>{DAY_NAMES_LONG[editing]} bewerken</h3>
              <button onClick={() => setEditing(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-subtle)' }}><X size={17} /></button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 8 }}>Type</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {SPORTS.map(s => (
                    <button key={s} onClick={() => setEditForm(f => ({ ...f, sport: s }))} style={{
                      padding: '6px 12px', borderRadius: 99, border: '1px solid', cursor: 'pointer', fontSize: 12, fontWeight: 600,
                      borderColor: editForm.sport === s ? SPORT_COLOR[s] : 'var(--color-border)',
                      background: editForm.sport === s ? `${SPORT_COLOR[s]}18` : 'transparent',
                      color: editForm.sport === s ? SPORT_COLOR[s] : 'var(--color-subtle)',
                    }}>{SPORT_EMOJI[s]} {SPORT_LABEL[s]}</button>
                  ))}
                </div>
              </div>

              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 8 }}>Label</label>
                <input value={editForm.label ?? ''} onChange={e => setEditForm(f => ({ ...f, label: e.target.value }))}
                  className="input" style={{ width: '100%', boxSizing: 'border-box' }} placeholder="bv. Upper Body Kracht" />
              </div>

              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 8 }}>Duur (minuten)</label>
                <input type="number" value={editForm.durationMin ?? 0} onChange={e => setEditForm(f => ({ ...f, durationMin: Number(e.target.value) }))}
                  className="input" style={{ width: 100 }} min={0} max={240} />
              </div>

              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 8 }}>Notities (optioneel)</label>
                <input value={editForm.notes ?? ''} onChange={e => setEditForm(f => ({ ...f, notes: e.target.value }))}
                  className="input" style={{ width: '100%', boxSizing: 'border-box' }} placeholder="bv. Z1 hartslag, 30 min steady" />
              </div>

              <button onClick={saveEdit} style={{ padding: '13px', borderRadius: 11, background: 'var(--color-accent)', border: 'none', color: 'var(--color-bg)', fontSize: 14, fontWeight: 700, cursor: 'pointer', marginTop: 4 }}>
                Opslaan
              </button>
            </div>
          </div>
        </div>
      , document.body)}
    </div>
  )
}

// ── Competition card ───────────────────────────────────────────────────────
function CompCard({ comp, onDelete }: { comp: Competition; onDelete: () => void }) {
  const days = daysUntil(comp.date)
  const past = days < 0
  const color = SPORT_COLOR[comp.sport] ?? '#C4935A'
  return (
    <div style={{
      padding: '18px 20px', borderRadius: 16,
      background: past ? 'var(--color-card)' : `${color}0E`,
      border: `1px solid ${past ? 'var(--color-border)' : color + '44'}`,
      display: 'flex', alignItems: 'center', gap: 16, opacity: past ? 0.6 : 1,
    }}>
      {/* Countdown ring */}
      <div style={{
        width: 60, height: 60, borderRadius: '50%', flexShrink: 0,
        background: past ? 'var(--color-surface)' : `${color}22`,
        border: `2px solid ${past ? 'var(--color-border)' : color + '66'}`,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      }}>
        {past ? (
          <Trophy size={22} color={color} />
        ) : (
          <>
            <span style={{ fontSize: 18, fontWeight: 900, color, lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>{days}</span>
            <span style={{ fontSize: 8, color: 'var(--color-subtle)', fontWeight: 600, letterSpacing: '0.05em' }}>DAGEN</span>
          </>
        )}
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-ink)' }}>{comp.name}</span>
          <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 99, background: `${color}22`, color, fontWeight: 600 }}>
            {SPORT_EMOJI[comp.sport]} {SPORT_LABEL[comp.sport]}
          </span>
        </div>
        <div style={{ fontSize: 12, color: 'var(--color-muted)', marginTop: 4, display: 'flex', flexWrap: 'wrap', gap: '2px 12px' }}>
          <span>{format(parseISO(comp.date), 'd MMMM yyyy', { locale: nlBE })}</span>
          {comp.location && <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><MapPin size={10} />{comp.location}</span>}
          {comp.distance && <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><Clock size={10} />{comp.distance}</span>}
          {comp.goal && <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><Target size={10} />{comp.goal}</span>}
        </div>
        {past && comp.result && (
          <div style={{ marginTop: 6, fontSize: 12, fontWeight: 700, color }}>🏆 {comp.result}</div>
        )}
      </div>

      <button onClick={onDelete} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-subtle)', padding: 4, opacity: 0.5, flexShrink: 0 }}>
        <Trash2 size={13} />
      </button>
    </div>
  )
}

// ── Competitions tab ───────────────────────────────────────────────────────
function Competitions() {
  const { competitions, addCompetition, deleteCompetition } = useTrainingStore()
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', date: '', sport: 'run' as SportType, location: '', distance: '', goal: '' })

  const upcoming = competitions.filter(c => daysUntil(c.date) >= 0).sort((a, b) => a.date.localeCompare(b.date))
  const past     = competitions.filter(c => daysUntil(c.date) < 0).sort((a, b) => b.date.localeCompare(a.date))

  function save() {
    if (!form.name.trim() || !form.date) return
    addCompetition({
      name: form.name.trim(),
      date: form.date,
      sport: form.sport,
      location: form.location.trim() || undefined,
      distance: form.distance.trim() || undefined,
      goal: form.goal.trim() || undefined,
    })
    setForm({ name: '', date: '', sport: 'run', location: '', distance: '', goal: '' })
    setShowForm(false)
  }

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 20 }}>
        <button onClick={() => setShowForm(true)} className="btn-primary" style={{ gap: 6 }}>
          <Plus size={13} /> Wedstrijd toevoegen
        </button>
      </div>

      {/* Upcoming */}
      {upcoming.length > 0 && (
        <div style={{ marginBottom: 28 }}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--color-muted)', marginBottom: 12 }}>Komende wedstrijden</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {upcoming.map(c => <CompCard key={c.id} comp={c} onDelete={() => deleteCompetition(c.id)} />)}
          </div>
        </div>
      )}

      {/* Past */}
      {past.length > 0 && (
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--color-muted)', marginBottom: 12 }}>Afgelopen</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {past.map(c => <CompCard key={c.id} comp={c} onDelete={() => deleteCompetition(c.id)} />)}
          </div>
        </div>
      )}

      {upcoming.length === 0 && past.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--color-subtle)' }}>
          <Trophy size={32} style={{ opacity: 0.3, display: 'block', margin: '0 auto 12px' }} />
          <p style={{ fontSize: 13 }}>Nog geen wedstrijden. Voeg je eerste toe!</p>
        </div>
      )}

      {/* Add modal */}
      {showForm && createPortal(
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '0 16px' }}>
          <div style={{ width: '100%', maxWidth: 480, background: 'var(--color-card-solid)', borderRadius: 18, border: '1px solid var(--color-border)', boxShadow: '0 24px 60px rgba(0,0,0,0.25)', padding: '26px 26px 30px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-ink)', margin: 0 }}>Wedstrijd toevoegen</h3>
              <button onClick={() => setShowForm(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-subtle)' }}><X size={17} /></button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 8 }}>Naam *</label>
                <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  className="input" style={{ width: '100%', boxSizing: 'border-box' }} placeholder="bv. Antwerp 10 Miles" />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 8 }}>Datum *</label>
                  <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                    className="input" style={{ width: '100%', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 8 }}>Sport</label>
                  <select value={form.sport} onChange={e => setForm(f => ({ ...f, sport: e.target.value as SportType }))}
                    className="input" style={{ width: '100%', boxSizing: 'border-box' }}>
                    {SPORTS.filter(s => s !== 'rest' && s !== 'off').map(s => (
                      <option key={s} value={s}>{SPORT_EMOJI[s]} {SPORT_LABEL[s]}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 8 }}>Locatie</label>
                  <input value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
                    className="input" style={{ width: '100%', boxSizing: 'border-box' }} placeholder="bv. Antwerpen" />
                </div>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 8 }}>Afstand</label>
                  <input value={form.distance} onChange={e => setForm(f => ({ ...f, distance: e.target.value }))}
                    className="input" style={{ width: '100%', boxSizing: 'border-box' }} placeholder="bv. 16 km" />
                </div>
              </div>

              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 8 }}>Doel</label>
                <input value={form.goal} onChange={e => setForm(f => ({ ...f, goal: e.target.value }))}
                  className="input" style={{ width: '100%', boxSizing: 'border-box' }} placeholder="bv. Sub 1:30, Top 10 finishen" />
              </div>

              <button onClick={save} disabled={!form.name.trim() || !form.date}
                style={{ padding: '13px', borderRadius: 11, background: 'var(--color-accent)', border: 'none', color: 'var(--color-bg)', fontSize: 14, fontWeight: 700, cursor: 'pointer', marginTop: 4, opacity: (!form.name.trim() || !form.date) ? 0.4 : 1 }}>
                Toevoegen
              </button>
            </div>
          </div>
        </div>
      , document.body)}
    </div>
  )
}

// ── Daily log tab ──────────────────────────────────────────────────────────
function DailyLog() {
  const { logs, getLog, upsertLog, getWeekAvg } = useHealthStore()
  const [date, setDate] = useState(TODAY)

  const log = getLog(date)
  const set = (updates: Partial<typeof log>) => upsertLog(date, updates)

  const last7 = useMemo(() => {
    const days: string[] = []
    for (let i = 6; i >= 0; i--) days.push(format(subDays(new Date(), i), 'yyyy-MM-dd'))
    return days
  }, [])
  const gl = (d: string) => getLog(d)
  const weekAvg = getWeekAvg(TODAY)

  return (
    <div>
      {/* Date nav */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <button onClick={() => setDate(format(subDays(parseISO(date), 1), 'yyyy-MM-dd'))} className="btn-ghost" style={{ padding: '7px 11px' }}>
          <ChevronLeft size={14} />
        </button>
        <span style={{ flex: 1, textAlign: 'center', fontSize: 14, fontWeight: 600, color: 'var(--color-ink)' }}>
          {format(parseISO(date), "EEEE d MMMM", { locale: nlBE })}
          {date === TODAY && <span style={{ marginLeft: 8, fontSize: 10, background: 'var(--color-accent)', color: 'var(--color-bg)', padding: '2px 7px', borderRadius: 99, fontWeight: 700 }}>VANDAAG</span>}
        </span>
        <button onClick={() => setDate(format(addDays(parseISO(date), 1), 'yyyy-MM-dd'))} className="btn-ghost" style={{ padding: '7px 11px' }} disabled={date >= TODAY}>
          <ChevronRight size={14} />
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
        <MetricCard icon={<Moon size={16} />} label="Slaap" value={log.sleepHours} unit="u" min={0} max={12} step={0.5}
          color="#7AACCF" onChange={v => set({ sleepHours: v })} display={log.sleepHours > 0 ? String(log.sleepHours) : '—'} />
        <MetricCard icon={<Zap size={16} />} label="Energie" value={log.energyLevel} unit="/10" min={1} max={10} step={1}
          color="#B8956A" onChange={v => set({ energyLevel: v })} />
        <MetricCard icon={<Droplets size={16} />} label="Water" value={log.waterGlasses} unit="gl" min={0} max={12} step={1}
          color="#38BDF8" onChange={v => set({ waterGlasses: v })} />
        <MetricCard icon={<Heart size={16} />} label="Stress" value={log.stressLevel} unit="/10" min={1} max={10} step={1}
          color="#C4736A" onChange={v => set({ stressLevel: v })} />
      </div>

      <div style={{ marginBottom: 12 }}>
        <MetricCard icon={<Footprints size={16} />} label="Stappen" value={log.steps} unit="stappen"
          min={0} max={20000} step={500} color="#7A9E8A" onChange={v => set({ steps: v })} />
      </div>

      <div style={{ padding: '18px 20px', borderRadius: 14, background: 'var(--color-card)', border: '1px solid var(--color-border)', marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <Moon size={16} color="#7AACCF" />
          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Slaapkwaliteit</span>
        </div>
        <SleepQuality value={log.sleepQuality} onChange={v => set({ sleepQuality: v })} />
      </div>

      <div style={{ marginBottom: 12 }}>
        <WorkoutSelector active={log.workout} type={log.workoutType}
          onToggle={() => set({ workout: !log.workout })} onType={t => set({ workoutType: t })} />
      </div>

      <div style={{ marginBottom: 28 }}>
        <MetricCard icon={<Wind size={16} />} label="Mood" value={log.mood} unit="/10" min={1} max={10} step={1}
          color="#7AACCF" onChange={v => set({ mood: v })} />
      </div>

      {/* 7-day trends */}
      <div style={{ padding: '20px 22px', borderRadius: 14, background: 'var(--color-card)', border: '1px solid var(--color-border)', marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <TrendingUp size={14} color="var(--color-accent)" />
          <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--color-muted)' }}>Afgelopen 7 dagen</span>
        </div>
        <TrendRow label="Slaap"    values={last7.map(d => gl(d).sleepHours)}  max={10} color="#7AACCF" unit="u" />
        <TrendRow label="Energie"  values={last7.map(d => gl(d).energyLevel)} max={10} color="#B8956A" unit="/10" />
        <TrendRow label="Stress"   values={last7.map(d => gl(d).stressLevel)} max={10} color="#C4736A" unit="/10" />
        <TrendRow label="Water"    values={last7.map(d => gl(d).waterGlasses)} max={10} color="#38BDF8" unit="gl" />
        <div style={{ borderBottom: 'none' }}>
          <TrendRow label="Mood" values={last7.map(d => gl(d).mood)} max={10} color="#7AACCF" unit="/10" />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
        {[
          { label: 'Gem. slaap',      value: `${weekAvg.avgSleep}u`,        color: '#7AACCF' },
          { label: 'Trainingsdagen',  value: `${weekAvg.workoutDays}/7`,     color: '#C96840' },
          { label: 'Gem. energie',    value: `${weekAvg.avgEnergy}/10`,      color: '#B8956A' },
          { label: 'Gem. water',      value: `${weekAvg.avgWater} gl`,       color: '#38BDF8' },
        ].map(s => (
          <div key={s.label} style={{ padding: '14px 16px', borderRadius: 12, background: 'var(--color-card)', border: '1px solid var(--color-border)' }}>
            <div style={{ fontSize: 18, fontWeight: 800, color: s.color, fontVariantNumeric: 'tabular-nums' }}>{s.value}</div>
            <div style={{ fontSize: 10, color: 'var(--color-subtle)', marginTop: 3, fontWeight: 600 }}>{s.label}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Triathlon plan ─────────────────────────────────────────────────────────
function triathlonIcon(training: string) {
  if (training.startsWith('Kracht'))    return '🏋️'
  if (training.startsWith('Loop') || training.startsWith('Run')) return '🏃'
  if (training.includes('Fiets') || training.includes('Brick')) return '🚴'
  if (training.includes('Zwem') || training.includes('open water')) return '🏊'
  if (training === 'Rust' || training.includes('Rust')) return '😴'
  if (training.startsWith('RACE'))      return '🏁'
  if (training.startsWith('TEST'))      return '⏱️'
  return '🎯'
}

type Tab = 'schema' | 'triathlon' | 'wedstrijden' | 'daglog'

export function Health() {
  const [tab, setTab] = useState<Tab>('schema')

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'schema',      label: 'Schema',      icon: <Dumbbell size={13} /> },
    { id: 'wedstrijden', label: 'Wedstrijden', icon: <Trophy size={13} /> },
    { id: 'daglog',      label: 'Daglog',      icon: <TrendingUp size={13} /> },
  ]

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', width: '100%' }}>
      {/* Header */}
      <div className="anim-fade-up" style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 32, fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1, color: 'var(--color-ink)' }}>Sports</h1>
        <p style={{ fontSize: 13, color: 'var(--color-muted)', marginTop: 6 }}>
          {format(new Date(), "EEEE · d MMMM yyyy", { locale: nlBE })}
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 28, padding: '4px', background: 'var(--color-surface)', borderRadius: 12, width: 'fit-content' }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 9, border: 'none', cursor: 'pointer',
            fontSize: 12, fontWeight: 700, transition: 'all 150ms',
            background: tab === t.id ? 'var(--color-card)' : 'transparent',
            color: tab === t.id ? 'var(--color-ink)' : 'var(--color-subtle)',
            boxShadow: tab === t.id ? '0 1px 4px rgba(0,0,0,0.15)' : 'none',
          }}>
            {t.icon}{t.label}
          </button>
        ))}
      </div>

      <div className="anim-fade-up">
        {tab === 'triathlon'   && <TrainingPlanTab />}
        {tab === 'schema'      && <TrainingSchema />}
        {tab === 'wedstrijden' && <Competitions />}
        {tab === 'daglog'      && <DailyLog />}
      </div>
    </div>
  )
}
