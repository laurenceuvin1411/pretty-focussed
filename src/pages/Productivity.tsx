import { useState, useEffect, useMemo, useRef } from 'react'
import { format, startOfWeek, addDays } from 'date-fns'
import { nlBE, enGB } from 'date-fns/locale'
import { Plus, Trash2, Calendar as CalendarIcon, FileText, Timer, ChevronLeft, ChevronRight, Play, Pause, Square, Pin, ListTodo, Link2 } from 'lucide-react'
import { useProductivityStore } from '../store/productivityStore'
import type { Todo, TodoPriority, TodoSphere } from '../store/productivityStore'

const SPHERE_CFG: Record<TodoSphere, { label: string; color: string }> = {
  personal:     { label: 'Personal',      color: 'var(--pf-depth-text)' },
  professional: { label: 'Professional',  color: 'var(--pf-depth-text)' },
}

const ACCENT = 'var(--pf-sage)'
const TODAY = () => format(new Date(), 'yyyy-MM-dd')

const PRIORITY_CFG: Record<TodoPriority, { label: string; color: string }> = {
  high:   { label: 'High',   color: 'var(--pf-depth-text)' },
  medium: { label: 'Medium', color: ACCENT },
  low:    { label: 'Low',    color: 'var(--color-subtle)' },
}

// ── Shared bits ──────────────────────────────────────────────────
const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 14px', borderRadius: 14,
  border: '1px solid var(--color-border)', background: 'var(--color-surface)',
  color: 'var(--color-ink)', fontSize: 13, fontFamily: 'inherit',
  outline: 'none', boxSizing: 'border-box',
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ fontSize: 10, fontWeight: 500, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--color-subtle)', fontFamily: 'var(--font-mono)', marginBottom: 10 }}>
      {children}
    </p>
  )
}

// ── Task card: one row for the calendar and the list. Check, time, what, how long. ──
const DUR_STEPS = [0, 15, 30, 45, 60, 90, 120, 180]
function fmtDur(m: number) { if (m < 60) return `${m} min`; const h = Math.floor(m / 60), r = m % 60; return r ? `${h} h ${r}` : `${h} h` }

function plateOf(t: Todo) { return t.sphere === 'professional' ? '1' : t.sphere === 'personal' ? '3' : '2' }

function TaskCard({ todo, onOpenNote, showDate = false }: { todo: Todo; onOpenNote: (todoId: string) => void; showDate?: boolean }) {
  const { toggleTodo, deleteTodo, updateTodo } = useProductivityStore()
  const timeRef = useRef<HTMLInputElement>(null)
  const dateRef = useRef<HTMLInputElement>(null)
  const [editing, setEditing] = useState(false)
  const [title, setTitle] = useState(todo.title)
  const open = (el: HTMLInputElement | null) => { if (!el) return; if (typeof el.showPicker === 'function') el.showPicker(); else el.click() }
  function cycleDur() { const i = DUR_STEPS.indexOf(todo.minutes ?? 0); updateTodo(todo.id, { minutes: DUR_STEPS[(i + 1) % DUR_STEPS.length] || undefined }) }
  function cycleSphere() { updateTodo(todo.id, { sphere: todo.sphere === 'personal' ? 'professional' : todo.sphere === 'professional' ? undefined : 'personal' }) }
  function commit() { const t = title.trim(); if (t && t !== todo.title) updateTodo(todo.id, { title: t }); else setTitle(todo.title); setEditing(false) }
  const cap = todo.sphere ? SPHERE_CFG[todo.sphere].label : PRIORITY_CFG[todo.priority].label
  const hidden: React.CSSProperties = { position: 'absolute', left: 0, top: 30, width: 1, height: 1, opacity: 0, border: 'none', padding: 0 }
  return (
    <div className={`pf-slot ${todo.done ? 'is-done' : ''}`} data-plate={plateOf(todo)}>
      <button type="button" role="checkbox" aria-checked={todo.done} aria-label={todo.title} className="pf-check" onClick={() => toggleTodo(todo.id)}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
      </button>
      <span style={{ position: 'relative' }}>
        <button type="button" className={`pf-slot__time ${todo.time ? '' : 'is-empty'}`} onClick={() => open(timeRef.current)} aria-label={todo.time ? `Starts ${todo.time}, change` : 'Set a time'}>
          {todo.time ?? 'Time'}
        </button>
        <input ref={timeRef} type="time" value={todo.time ?? ''} onChange={e => updateTodo(todo.id, { time: e.target.value || undefined })} aria-label="Time" tabIndex={-1} style={hidden} />
      </span>
      <span className="pf-slot__body">
        <button type="button" className="pf-slot__area" onClick={cycleSphere} title="Personal, professional, or none">{cap}{showDate && todo.date ? ` · ${format(new Date(todo.date + 'T12:00:00'), 'd MMM', { locale: enGB })}` : ''}</button>
        {editing ? (
          <input className="pf-inline" value={title} autoFocus onChange={e => setTitle(e.target.value)} onBlur={commit} onKeyDown={e => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') { setTitle(todo.title); setEditing(false) } }} aria-label="Task" style={{ fontSize: 16, color: 'var(--pf-ink)', borderBottomColor: 'rgb(20 21 15 / .3)' }} />
        ) : (
          <p className="pf-slot__focus" onClick={() => setEditing(true)}>{todo.title}</p>
        )}
      </span>
      <span className="pf-slot__right">
        <button type="button" className="pf-slot__len" onClick={cycleDur} aria-label="Duration">{todo.minutes ? fmtDur(todo.minutes) : '+ time'}</button>
        <span style={{ position: 'relative' }}>
          <button type="button" className="pf-slot__icon" onClick={() => open(dateRef.current)} aria-label={todo.date ? `On ${todo.date}, change` : 'Plan on a day'}><CalendarIcon size={14} /></button>
          <input ref={dateRef} type="date" value={todo.date ?? ''} onChange={e => updateTodo(todo.id, { date: e.target.value || undefined })} aria-label="Date" tabIndex={-1} style={hidden} />
        </span>
        <button type="button" className="pf-slot__icon" onClick={() => onOpenNote(todo.id)} aria-label={todo.noteId ? 'Open the note' : 'Add a note'} style={{ color: todo.noteId ? 'var(--pf-ink)' : undefined }}><FileText size={14} /></button>
        <button type="button" className="pf-slot__icon" onClick={() => deleteTodo(todo.id)} aria-label="Remove"><Trash2 size={14} /></button>
      </span>
    </div>
  )
}

// ── Quick add: one line, a day, a time, a sphere. ────────────────
function QuickAdd({ date, onAdd }: { date?: string; onAdd: (title: string, sphere?: TodoSphere, time?: string, minutes?: number, date?: string) => void }) {
  const [title, setTitle] = useState('')
  const [sphere, setSphere] = useState<'' | TodoSphere>('')
  const [time, setTime] = useState('')
  const [minutes, setMinutes] = useState(0)
  const [day, setDay] = useState(date ?? '')
  function submit() { if (!title.trim()) return; onAdd(title.trim(), sphere || undefined, time || undefined, minutes || undefined, (date ?? day) || undefined); setTitle(''); setTime(''); setMinutes(0) }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'flex', gap: 8 }}>
        <input value={title} onChange={e => setTitle(e.target.value)} onKeyDown={e => e.key === 'Enter' && submit()} aria-label="New task" placeholder={date ? 'One thing for this day' : 'One thing'} style={{ ...inputStyle, flex: 1, fontSize: 16, padding: '13px 20px', borderRadius: 999, border: 0, background: 'rgb(255 255 255 / .55)', boxShadow: 'inset 0 0 0 1px rgb(255 255 255 / .8)' }} />
        <button onClick={submit} disabled={!title.trim()} aria-label="Add" style={{ width: 44, height: 44, borderRadius: 999, border: 'none', background: title.trim() ? 'var(--color-ink)' : 'var(--color-border)', color: title.trim() ? 'var(--color-bg)' : 'var(--color-muted)', cursor: title.trim() ? 'pointer' : 'default', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Plus size={16} /></button>
      </div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
        {(Object.keys(SPHERE_CFG) as TodoSphere[]).map(s => (
          <button key={s} type="button" className="pf-chip pf-chip--haze" aria-pressed={sphere === s} onClick={() => setSphere(sphere === s ? '' : s)} style={{ minHeight: 34, padding: '7px 12px', fontSize: 13 }}>{SPHERE_CFG[s].label}</button>
        ))}
        <input type="time" value={time} onChange={e => setTime(e.target.value)} aria-label="Time" style={{ ...inputStyle, width: 'auto', padding: '6px 10px', fontSize: 13, fontFamily: 'var(--font-mono)', minHeight: 34 }} />
        <select value={minutes} onChange={e => setMinutes(Number(e.target.value))} aria-label="Duration" style={{ ...inputStyle, width: 'auto', padding: '6px 10px', fontSize: 13, fontFamily: 'var(--font-mono)', minHeight: 34 }}>
          {DUR_STEPS.map(m => <option key={m} value={m}>{m ? fmtDur(m) : 'no duration'}</option>)}
        </select>
        {!date && <input type="date" value={day} onChange={e => setDay(e.target.value)} aria-label="Date" style={{ ...inputStyle, width: 'auto', padding: '6px 10px', fontSize: 13, fontFamily: 'var(--font-mono)', minHeight: 34 }} />}
      </div>
    </div>
  )
}

const byTime = (a: Todo, b: Todo) => (a.done === b.done ? 0 : a.done ? 1 : -1) || (a.time ?? '99').localeCompare(b.time ?? '99') || a.createdAt.localeCompare(b.createdAt)

// ── Todos section: the same cards, grouped by when ──────────────
function TodosSection({ onOpenNote }: { onOpenNote: (todoId: string) => void }) {
  const { todos, addTodo, updateTodo } = useProductivityStore()
  const [showDone, setShowDone] = useState(false)
  const todayStr = TODAY()
  const open = todos.filter(t => !t.done)
  const done = todos.filter(t => t.done)
  const groups: { label: string; items: Todo[] }[] = [
    { label: 'Overdue', items: open.filter(t => t.date && t.date < todayStr).sort(byTime) },
    { label: 'Today', items: open.filter(t => t.date === todayStr).sort(byTime) },
    { label: 'Planned', items: open.filter(t => t.date && t.date > todayStr).sort((a, b) => a.date!.localeCompare(b.date!) || byTime(a, b)) },
    { label: 'Someday', items: open.filter(t => !t.date).sort(byTime) },
  ].filter(g => g.items.length > 0)
  function add(title: string, sphere?: TodoSphere, time?: string, minutes?: number, date?: string) {
    const id = addTodo(title, 'medium', date, sphere)
    if (time || minutes) updateTodo(id, { time, minutes })
  }
  return (
    <div style={{ maxWidth: 720, display: 'flex', flexDirection: 'column', gap: 28 }}>
      <QuickAdd onAdd={add} />
      {groups.length === 0 && done.length === 0 && <p style={{ fontSize: 14, color: 'var(--color-subtle)' }}>Nothing yet. One line above is enough.</p>}
      {groups.map(g => (
        <div key={g.label} className="pf-dayplan">
          <p className="pf-over">{g.label} · {g.items.length}</p>
          {g.items.map(t => <TaskCard key={t.id} todo={t} onOpenNote={onOpenNote} showDate={g.label !== 'Today'} />)}
        </div>
      ))}
      {done.length > 0 && (
        <div>
          <button onClick={() => setShowDone(v => !v)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontFamily: 'inherit', display: 'block' }}>
            <SectionLabel>{showDone ? 'Hide' : 'Show'} done · {done.length}</SectionLabel>
          </button>
          {showDone && <div className="pf-dayplan">{done.map(t => <TaskCard key={t.id} todo={t} onOpenNote={onOpenNote} showDate />)}</div>}
        </div>
      )}
    </div>
  )
}

// ── Calendar: one week as seven cards, the chosen day as a list of time cards ──
function CalendarSection({ onOpenNote }: { onOpenNote: (todoId: string) => void }) {
  const { todos, addTodo, updateTodo } = useProductivityStore()
  const todayStr = TODAY()
  const [selected, setSelected] = useState<string>(todayStr)
  const [weekStart, setWeekStart] = useState<Date>(() => startOfWeek(new Date(), { weekStartsOn: 1 }))
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))
  const byDate = useMemo(() => { const m: Record<string, Todo[]> = {}; todos.forEach(t => { if (t.date) (m[t.date] ??= []).push(t) }); return m }, [todos])
  const list = [...(byDate[selected] ?? [])].sort(byTime)
  const thisMonday = startOfWeek(new Date(selected + 'T12:00:00'), { weekStartsOn: 1 })
  const diff = Math.round((weekStart.getTime() - thisMonday.getTime()) / (7 * 86400000))
  const label = diff === 0 ? 'This week' : diff === 1 ? 'Next week' : diff === -1 ? 'Last week' : `Week ${format(weekStart, 'w')}`
  const range = `${format(days[0], 'd MMMM', { locale: enGB })} to ${format(days[6], 'd MMMM', { locale: enGB })}`
  function add(title: string, sphere?: TodoSphere, time?: string, minutes?: number) {
    const id = addTodo(title, 'medium', selected, sphere)
    if (time || minutes) updateTodo(id, { time, minutes })
  }
  return (
    <div className="pf-sched pf-resolve d1">
      <div className="pf-sched__top">
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <button type="button" className="pf-chev" aria-label="Previous week" onClick={() => setWeekStart(d => addDays(d, -7))}><ChevronLeft size={16} strokeWidth={1.5} /></button>
          <p className="pf-over">{label}</p>
          <button type="button" className="pf-chev" aria-label="Next week" onClick={() => setWeekStart(d => addDays(d, 7))}><ChevronRight size={16} strokeWidth={1.5} /></button>
        </div>
        <span style={{ fontSize: 14, color: 'var(--pf-slate-600)' }}>{range}</span>
      </div>

      <div className="pf-days" role="tablist" aria-label="Days of the week">
        {days.map(d => {
          const ds = format(d, 'yyyy-MM-dd')
          const items = byDate[ds] ?? []
          return (
            <button key={ds} type="button" role="tab" aria-selected={ds === selected} className={`pf-dayc ${ds === todayStr ? 'is-today' : ''} ${items.length ? '' : 'is-free'}`} onClick={() => setSelected(ds)}
              aria-label={`${format(d, 'EEEE', { locale: enGB })}, ${items.length ? `${items.length} ${items.length === 1 ? 'item' : 'items'}` : 'free'}`}>
              <span className="dn">{format(d, 'EEE', { locale: enGB })}</span>
              <span className="dd">{format(d, 'd')}</span>
              <span className="dots" aria-hidden="true">{items.slice(0, 4).map(t => <i key={t.id} data-plate={plateOf(t)} className={t.done ? 'is-done' : ''} />)}</span>
            </button>
          )
        })}
      </div>

      <div className="pf-dayplan" role="tabpanel">
        <div key={selected} className="pf-dayplan__body" style={{ display: 'grid', gap: 8 }}>
          <p className="pf-over">{format(new Date(selected + 'T12:00:00'), 'EEEE', { locale: enGB })}</p>
          {list.length === 0 ? <p className="free">Nothing planned. This day is yours.</p> : list.map(t => <TaskCard key={t.id} todo={t} onOpenNote={onOpenNote} />)}
        </div>
        <div style={{ marginTop: 10 }}><QuickAdd date={selected} onAdd={(title, sphere, time, minutes) => add(title, sphere, time, minutes)} /></div>
      </div>
    </div>
  )
}

// ── Notes section ────────────────────────────────────────────────
function NotesSection({ activeNoteId, setActiveNoteId }: { activeNoteId: string | null; setActiveNoteId: (id: string | null) => void }) {
  const { notes, todos, addNote, updateNote, deleteNote } = useProductivityStore()
  const [search, setSearch] = useState('')

  const active = notes.find(n => n.id === activeNoteId) ?? null
  const linkedTodo = active?.todoId ? todos.find(t => t.id === active.todoId) : null

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    const list = q ? notes.filter(n => n.title.toLowerCase().includes(q) || n.body.toLowerCase().includes(q)) : notes
    return [...list].sort((a, b) => (Number(b.pinned) - Number(a.pinned)) || (b.updatedAt < a.updatedAt ? -1 : 1))
  }, [notes, search])

  function createNote() {
    const id = addNote()
    setActiveNoteId(id)
  }

  return (
    <div className="pf-two-col" style={{ display: 'grid', gridTemplateColumns: 'minmax(240px, 300px) minmax(0, 1fr)', gap: 24, alignItems: 'start' }}>
      {/* List */}
      <div>
        <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search notes"
            style={{ ...inputStyle, flex: 1, fontSize: 12, padding: '8px 12px' }}
          />
          <button onClick={createNote} aria-label="New note"
            style={{ width: 34, height: 34, borderRadius: 14, border: 'none', background: 'var(--color-ink)', color: 'var(--color-bg)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Plus size={14} />
          </button>
        </div>

        {filtered.length === 0 ? (
          <p style={{ fontSize: 12, color: 'var(--color-subtle)', padding: '16px 4px' }}>
            {notes.length === 0 ? 'No notes yet.' : 'No results.'}
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {filtered.map(n => (
              <button
                key={n.id}
                onClick={() => setActiveNoteId(n.id)}
                style={{
                  textAlign: 'left', padding: '12px 14px', borderRadius: 14, cursor: 'pointer', fontFamily: 'inherit',
                  border: `1.5px solid ${n.id === activeNoteId ? ACCENT : 'var(--color-border)'}`,
                  background: n.id === activeNoteId ? 'var(--pf-sage-soft)' : 'var(--color-card)',
                  transition: 'all 150ms',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  {n.pinned && <Pin size={10} color={ACCENT} style={{ flexShrink: 0 }} />}
                  <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {n.title || 'Untitled'}
                  </p>
                </div>
                <p style={{ fontSize: 11, color: 'var(--color-subtle)', marginTop: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {n.body.replace(/\n/g, ' ').slice(0, 60) || 'Leeg'}
                </p>
                <p style={{ fontSize: 9, color: 'var(--color-subtle)', fontFamily: 'var(--font-mono)', marginTop: 4 }}>
                  {format(new Date(n.updatedAt), 'd MMM HH:mm', { locale: nlBE })}
                  {n.todoId && ' · gekoppeld'}
                </p>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Editor */}
      {active ? (
        <div className="card" style={{ padding: 24, borderRadius: 16, border: 'none', boxShadow: '0 4px 16px rgb(62 73 54 / .06)', background: 'var(--color-card)' }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 14 }}>
            <input
              value={active.title}
              onChange={e => updateNote(active.id, { title: e.target.value })}
              placeholder="Title"
              style={{ flex: 1, border: 'none', background: 'transparent', outline: 'none', fontSize: 18, fontWeight: 500, color: 'var(--color-ink)', fontFamily: 'inherit', letterSpacing: '-0.01em', padding: 0 }}
            />
            <button onClick={() => updateNote(active.id, { pinned: !active.pinned })} title={active.pinned ? 'Losmaken' : 'Vastpinnen'}
              style={{ width: 30, height: 30, borderRadius: 14, border: '1px solid var(--color-border)', background: active.pinned ? 'var(--pf-sage-soft)' : 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: active.pinned ? ACCENT : 'var(--color-subtle)' }}>
              <Pin size={13} />
            </button>
            <button onClick={() => { deleteNote(active.id); setActiveNoteId(null) }} title="Remove note"
              style={{ width: 30, height: 30, borderRadius: 14, border: '1px solid var(--color-border)', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-subtle)' }}>
              <Trash2 size={13} />
            </button>
          </div>

          {/* Link to todo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <Link2 size={11} color="var(--color-subtle)" />
            <select
              value={active.todoId ?? ''}
              onChange={e => {
                const newTodoId = e.target.value || undefined
                const { updateTodo } = useProductivityStore.getState()
                if (active.todoId) updateTodo(active.todoId, { noteId: undefined })
                if (newTodoId) updateTodo(newTodoId, { noteId: active.id })
                updateNote(active.id, { todoId: newTodoId })
              }}
              style={{ ...inputStyle, fontSize: 11, padding: '6px 10px', width: 'auto', maxWidth: 280, cursor: 'pointer' }}
              aria-label="Link to a task"
            >
              <option value="">Not linked to a task</option>
              {todos.filter(t => !t.done || t.id === active.todoId).map(t => (
                <option key={t.id} value={t.id}>{t.title}</option>
              ))}
            </select>
            {linkedTodo && (
              <span style={{ fontSize: 10, color: linkedTodo.done ? 'var(--pf-depth-text)' : 'var(--color-subtle)', fontFamily: 'var(--font-mono)' }}>
                {linkedTodo.done ? '✓ afgewerkt' : 'open'}
              </span>
            )}
          </div>

          <textarea
            value={active.body}
            onChange={e => updateNote(active.id, { body: e.target.value })}
            placeholder="Write here"
            rows={16}
            style={{ width: '100%', border: 'none', background: 'transparent', outline: 'none', resize: 'vertical', fontSize: 14, lineHeight: 1.7, color: 'var(--color-ink)', fontFamily: 'inherit', boxSizing: 'border-box', padding: 0 }}
          />
        </div>
      ) : (
        <div style={{ padding: '60px 24px', borderRadius: 16, border: '1.5px dashed var(--color-border)', textAlign: 'center' }}>
          <FileText size={20} color="var(--color-subtle)" style={{ marginBottom: 10 }} />
          <p style={{ fontSize: 13, color: 'var(--color-subtle)' }}>Selecteer een notitie of maak een nieuwe.</p>
        </div>
      )}
    </div>
  )
}

// ── Focus section ────────────────────────────────────────────────
function fmtClock(sec: number) {
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

function FocusSection() {
  const store = useProductivityStore()
  const { timer, todos, sessions, focusLengthMin, breakLengthMin } = store
  const [nowTick, setNowTick] = useState(Date.now())
  const completedRef = useRef(false)

  // tick elke seconde als de timer loopt
  useEffect(() => {
    if (timer.status !== 'running') return
    const iv = setInterval(() => setNowTick(Date.now()), 500)
    return () => clearInterval(iv)
  }, [timer.status])

  const remaining = timer.status === 'running' && timer.endsAt
    ? Math.max(0, Math.round((timer.endsAt - nowTick) / 1000))
    : timer.status === 'paused'
      ? (timer.remainingSec ?? 0)
      : timer.durationSec

  // sessie afronden zodra 0 bereikt is
  useEffect(() => {
    if (timer.status === 'running' && remaining === 0 && !completedRef.current) {
      completedRef.current = true
      store.completeSession()
      setTimeout(() => { completedRef.current = false }, 1000)
    }
  }, [remaining, timer.status])

  const pct = timer.durationSec > 0 ? ((timer.durationSec - remaining) / timer.durationSec) * 100 : 0
  const todayStr = TODAY()
  const todaySessions = sessions.filter(s => s.date === todayStr)
  const todayMinutes = todaySessions.reduce((sum, s) => sum + s.minutes, 0)
  const openTodos = todos.filter(t => !t.done)
  const linkedTodo = timer.todoId ? todos.find(t => t.id === timer.todoId) : null
  const isBreakReady = timer.status === 'idle' && timer.mode === 'break'

  // progress ring
  const size = 220, stroke = 6
  const r = (size - stroke * 2) / 2
  const circ = 2 * Math.PI * r
  const ringColor = timer.mode === 'break' ? 'var(--pf-depth-text)' : ACCENT

  return (
    <div className="pf-two-col" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(260px, 320px)', gap: 32, alignItems: 'start', maxWidth: 860 }}>
      {/* Timer */}
      <div className="card" style={{ padding: '40px 32px', borderRadius: 18, border: 'none', boxShadow: '0 4px 16px rgb(62 73 54 / .06)', background: 'var(--color-card)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <p style={{ fontSize: 10, fontWeight: 500, letterSpacing: '0.16em', textTransform: 'uppercase', color: ringColor, fontFamily: 'var(--font-mono)', marginBottom: 24 }}>
          {timer.mode === 'break' ? 'Break' : 'Focus'}
          {linkedTodo && timer.mode === 'focus' && ` · ${linkedTodo.title.slice(0, 32)}`}
        </p>

        <div style={{ position: 'relative', width: size, height: size, marginBottom: 28 }}>
          <svg width={size} height={size}>
            <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--color-border)" strokeWidth={stroke} />
            <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={ringColor} strokeWidth={stroke}
              strokeDasharray={circ} strokeDashoffset={circ - (pct / 100) * circ} strokeLinecap="round"
              transform={`rotate(-90 ${size / 2} ${size / 2})`}
              style={{ transition: 'stroke-dashoffset 500ms linear' }} />
          </svg>
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
            <span data-testid="timer-clock" style={{ fontSize: 44, fontWeight: 500, color: 'var(--color-ink)', fontFamily: 'var(--font-mono)', letterSpacing: '-0.02em' }}>
              {fmtClock(remaining)}
            </span>
            <span style={{ fontSize: 11, color: 'var(--color-subtle)', fontFamily: 'var(--font-mono)' }}>
              {timer.status === 'running' ? 'bezig' : timer.status === 'paused' ? 'gepauzeerd' : isBreakReady ? 'sessie klaar!' : 'klaar om te starten'}
            </span>
          </div>
        </div>

        {/* Controls */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 24 }}>
          {timer.status === 'idle' && !isBreakReady && (
            <button onClick={() => store.startTimer(timer.todoId)} data-testid="start-focus"
              style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '13px 28px', borderRadius: 14, border: 'none', background: 'var(--color-ink)', color: 'var(--color-bg)', fontSize: 14, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}>
              <Play size={14} /> Start focus
            </button>
          )}
          {isBreakReady && (
            <>
              <button onClick={() => store.startBreak()}
                style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '13px 24px', borderRadius: 14, border: 'none', background: 'var(--pf-depth-text)', color: '#fff', fontSize: 14, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}>
                <Play size={14} /> Start break ({breakLengthMin} min)
              </button>
              <button onClick={() => store.startTimer(timer.todoId)}
                style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '13px 24px', borderRadius: 14, border: '1px solid var(--color-border)', background: 'transparent', color: 'var(--color-ink)', fontSize: 14, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}>
                Volgende focus
              </button>
            </>
          )}
          {timer.status === 'running' && (
            <button onClick={() => store.pauseTimer()} data-testid="pause-focus"
              style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '13px 28px', borderRadius: 14, border: '1px solid var(--color-border)', background: 'transparent', color: 'var(--color-ink)', fontSize: 14, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}>
              <Pause size={14} /> Pause
            </button>
          )}
          {timer.status === 'paused' && (
            <button onClick={() => store.resumeTimer()}
              style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '13px 28px', borderRadius: 14, border: 'none', background: 'var(--color-ink)', color: 'var(--color-bg)', fontSize: 14, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}>
              <Play size={14} /> Resume
            </button>
          )}
          {timer.status !== 'idle' && (
            <button onClick={() => store.stopTimer()} title="Stop and reset"
              style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '13px 18px', borderRadius: 14, border: '1px solid var(--color-border)', background: 'transparent', color: 'var(--color-subtle)', fontSize: 14, cursor: 'pointer', fontFamily: 'inherit' }}>
              <Square size={13} />
            </button>
          )}
        </div>

        {/* Task select + durations */}
        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <select
            value={timer.todoId ?? ''}
            onChange={e => {
              const { timer: t } = useProductivityStore.getState()
              useProductivityStore.setState({ timer: { ...t, todoId: e.target.value || undefined } })
            }}
            disabled={timer.status === 'running'}
            style={{ ...inputStyle, cursor: 'pointer', fontSize: 12 }}
            aria-label="Work on a task"
          >
            <option value="">No task linked</option>
            {openTodos.map(t => <option key={t.id} value={t.id}>{t.title}</option>)}
          </select>

          {timer.status === 'idle' && (
            <div style={{ display: 'flex', gap: 10 }}>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: 9, fontWeight: 500, letterSpacing: '0.10em', textTransform: 'uppercase', color: 'var(--color-subtle)', fontFamily: 'var(--font-mono)', display: 'block', marginBottom: 4 }}>Focus (min)</label>
                <select value={focusLengthMin} onChange={e => store.setFocusLength(Number(e.target.value))} style={{ ...inputStyle, cursor: 'pointer', fontSize: 12 }}>
                  {[15, 25, 45, 60, 90].map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: 9, fontWeight: 500, letterSpacing: '0.10em', textTransform: 'uppercase', color: 'var(--color-subtle)', fontFamily: 'var(--font-mono)', display: 'block', marginBottom: 4 }}>Pauze (min)</label>
                <select value={breakLengthMin} onChange={e => store.setBreakLength(Number(e.target.value))} style={{ ...inputStyle, cursor: 'pointer', fontSize: 12 }}>
                  {[5, 10, 15].map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div className="card" style={{ padding: '18px 20px', borderRadius: 16, border: 'none', boxShadow: '0 4px 16px rgb(62 73 54 / .06)', background: 'var(--color-card)' }}>
          <SectionLabel>Today</SectionLabel>
          <div style={{ display: 'flex', gap: 24 }}>
            <div>
              <p style={{ fontSize: 26, fontWeight: 500, color: 'var(--color-ink)', fontFamily: 'var(--font-mono)', lineHeight: 1 }}>{todayMinutes}<span style={{ fontSize: 13, color: 'var(--color-subtle)' }}>m</span></p>
              <p style={{ fontSize: 10, color: 'var(--color-subtle)', marginTop: 3 }}>Gefocust</p>
            </div>
            <div>
              <p style={{ fontSize: 26, fontWeight: 500, color: 'var(--color-ink)', fontFamily: 'var(--font-mono)', lineHeight: 1 }}>{todaySessions.length}</p>
              <p style={{ fontSize: 10, color: 'var(--color-subtle)', marginTop: 3 }}>Sessions</p>
            </div>
          </div>
        </div>

        {todaySessions.length > 0 && (
          <div className="card" style={{ padding: '18px 20px', borderRadius: 16, border: 'none', boxShadow: '0 4px 16px rgb(62 73 54 / .06)', background: 'var(--color-card)' }}>
            <SectionLabel>Sessions today</SectionLabel>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {todaySessions.slice(0, 8).map(s => {
                const t = s.todoId ? todos.find(x => x.id === s.todoId) : null
                return (
                  <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ width: 5, height: 5, borderRadius: '50%', background: ACCENT, flexShrink: 0 }} />
                    <span style={{ fontSize: 12, color: 'var(--color-ink)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {t?.title ?? 'Free focus'}
                    </span>
                    <span style={{ fontSize: 10, color: 'var(--color-subtle)', fontFamily: 'var(--font-mono)', flexShrink: 0 }}>
                      {s.minutes}m · {format(new Date(s.completedAt), 'HH:mm')}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Per-taak focus totalen */}
        {todos.some(t => t.focusMinutes > 0) && (
          <div className="card" style={{ padding: '18px 20px', borderRadius: 16, border: 'none', boxShadow: '0 4px 16px rgb(62 73 54 / .06)', background: 'var(--color-card)' }}>
            <SectionLabel>Focus per task</SectionLabel>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[...todos].filter(t => t.focusMinutes > 0).sort((a, b) => b.focusMinutes - a.focusMinutes).slice(0, 6).map(t => (
                <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 12, color: t.done ? 'var(--color-muted)' : 'var(--color-ink)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textDecoration: t.done ? 'line-through' : 'none' }}>
                    {t.title}
                  </span>
                  <span style={{ fontSize: 10, color: ACCENT, fontFamily: 'var(--font-mono)', fontWeight: 500, flexShrink: 0 }}>{t.focusMinutes}m</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Main ─────────────────────────────────────────────────────────
type Tab = 'todos' | 'calendar' | 'notes' | 'focus'

const TABS: { key: Tab; label: string; icon: React.ReactNode }[] = [
  { key: 'calendar', label: 'Calendar', icon: <CalendarIcon size={13} /> },
  { key: 'todos',    label: 'Tasks',    icon: <ListTodo size={13} /> },
  { key: 'notes',    label: 'Notes', icon: <FileText size={13} /> },
  { key: 'focus',    label: 'Focus',    icon: <Timer size={13} /> },
]

export function Productivity() {
  const [tab, setTab] = useState<Tab>('calendar')
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null)
  const { todos, sessions, timer, addNote } = useProductivityStore()

  const todayStr = TODAY()
  const openToday = todos.filter(t => !t.done && t.date === todayStr).length
  const todayMinutes = sessions.filter(s => s.date === todayStr).reduce((sum, s) => sum + s.minutes, 0)

  // vanuit taak → notitie openen (bestaande of nieuwe, gekoppeld)
  function openNoteForTodo(todoId: string) {
    const state = useProductivityStore.getState()
    const todo = state.todos.find(t => t.id === todoId)
    if (!todo) return
    let noteId = todo.noteId
    if (!noteId || !state.notes.some(n => n.id === noteId)) {
      noteId = addNote({ title: todo.title, todoId })
      state.updateTodo(todoId, { noteId })
    }
    setActiveNoteId(noteId)
    setTab('notes')
  }

  return (
    <div>
      {/* Header */}
      <div className="pf-resolve" style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 500, letterSpacing: '-0.02em', color: 'var(--color-ink)', lineHeight: 1.2 }}>
            Your priorities
          </h1>
          <p style={{ fontSize: 12, color: 'var(--color-subtle)', marginTop: 4, fontFamily: 'var(--font-mono)' }}>
            {openToday} {openToday === 1 ? 'task' : 'tasks'} today · {todayMinutes} min focused
            {timer.status === 'running' && <span style={{ color: ACCENT, fontWeight: 500 }}> · timer running</span>}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="pf-segments pf-segments--haze pf-segments--wrap" role="tablist" aria-label="Your priorities" style={{ marginBottom: 28 }}>
        {TABS.map(t => (
          <button key={t.key} type="button" role="tab" aria-selected={tab === t.key} className="pf-segment" onClick={() => setTab(t.key)}>
            {t.label}{t.key === 'focus' && timer.status === 'running' ? ' ·' : ''}
          </button>
        ))}
      </div>

      {tab === 'todos' && <TodosSection onOpenNote={openNoteForTodo} />}
      {tab === 'calendar' && <CalendarSection onOpenNote={openNoteForTodo} />}
      {tab === 'notes' && <NotesSection activeNoteId={activeNoteId} setActiveNoteId={setActiveNoteId} />}
      {tab === 'focus' && <FocusSection />}
    </div>
  )
}
