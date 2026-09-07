import { useState, useEffect, useMemo, useRef } from 'react'
import { format, addMonths, subMonths, getDaysInMonth, startOfMonth, getDay } from 'date-fns'
import { nlBE } from 'date-fns/locale'
import {
  Plus, Check, Trash2, Calendar as CalendarIcon, FileText, Timer,
  ChevronLeft, ChevronRight, Play, Pause, Square, Pin, X, ListTodo, Link2,
} from 'lucide-react'
import { useProductivityStore } from '../store/productivityStore'
import type { Todo, TodoPriority, TodoSphere } from '../store/productivityStore'

const SPHERE_CFG: Record<TodoSphere, { label: string; color: string }> = {
  personal:     { label: 'Persoonlijk',   color: '#C4935A' },
  professional: { label: 'Professioneel', color: '#6DB889' },
}

const ACCENT = '#4C6481'
const TODAY = () => format(new Date(), 'yyyy-MM-dd')

const PRIORITY_CFG: Record<TodoPriority, { label: string; color: string }> = {
  high:   { label: 'Hoog',   color: '#C4935A' },
  medium: { label: 'Medium', color: ACCENT },
  low:    { label: 'Laag',   color: '#7C7F84' },
}

// ── Shared bits ──────────────────────────────────────────────────
const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 14px', borderRadius: 10,
  border: '1px solid var(--color-border)', background: 'var(--color-surface)',
  color: 'var(--color-ink)', fontSize: 13, fontFamily: 'inherit',
  outline: 'none', boxSizing: 'border-box',
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--color-subtle)', fontFamily: 'var(--font-mono)', marginBottom: 10 }}>
      {children}
    </p>
  )
}

// ── Todo row ─────────────────────────────────────────────────────
function TodoRow({ todo, onOpenNote }: { todo: Todo; onOpenNote: (todoId: string) => void }) {
  const { toggleTodo, deleteTodo, updateTodo } = useProductivityStore()
  const [hover, setHover] = useState(false)
  const dateRef = useRef<HTMLInputElement>(null)
  const pri = PRIORITY_CFG[todo.priority]
  const isToday = todo.date === TODAY()
  const isOverdue = !!todo.date && todo.date < TODAY() && !todo.done

  return (
    <div
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 16px', borderBottom: '1px solid var(--color-border)', background: hover ? 'rgba(124,127,132,0.04)' : 'transparent', transition: 'background 150ms' }}
    >
      <button
        onClick={() => toggleTodo(todo.id)}
        aria-label={todo.done ? 'Heropen taak' : 'Vink taak af'}
        style={{
          width: 22, height: 22, borderRadius: 7, flexShrink: 0, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: todo.done ? '#6DB889' : 'transparent',
          border: `2px solid ${todo.done ? '#6DB889' : 'rgba(124,127,132,0.32)'}`,
          transition: 'all 180ms',
        }}
      >
        {todo.done && <Check size={12} color="#fff" strokeWidth={3} />}
      </button>

      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 14, fontWeight: 500, color: todo.done ? 'var(--color-muted)' : 'var(--color-ink)', textDecoration: todo.done ? 'line-through' : 'none', letterSpacing: '-0.01em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {todo.title}
        </p>
        <div style={{ display: 'flex', gap: 8, marginTop: 2, alignItems: 'center' }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: pri.color, fontFamily: 'var(--font-mono)' }}>{pri.label}</span>
          <button
            onClick={e => {
              e.stopPropagation()
              const next = todo.sphere === 'personal' ? 'professional' : todo.sphere === 'professional' ? undefined : 'personal'
              updateTodo(todo.id, { sphere: next })
            }}
            title="Wissel: persoonlijk / professioneel / geen"
            style={{
              fontSize: 10, fontWeight: 700, fontFamily: 'var(--font-mono)', cursor: 'pointer',
              background: 'none', border: 'none', padding: 0,
              color: todo.sphere ? SPHERE_CFG[todo.sphere].color : 'var(--color-subtle)',
              opacity: todo.sphere ? 1 : 0.5,
            }}
          >
            {todo.sphere ? SPHERE_CFG[todo.sphere].label : '+ sfeer'}
          </button>
          {todo.date && (
            <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: isOverdue ? '#C4935A' : isToday ? ACCENT : 'var(--color-subtle)', fontWeight: isToday || isOverdue ? 700 : 400 }}>
              {isOverdue ? 'Verlopen · ' : isToday ? 'Vandaag' : format(new Date(todo.date + 'T12:00:00'), 'd MMM', { locale: nlBE })}
              {isOverdue && format(new Date(todo.date + 'T12:00:00'), 'd MMM', { locale: nlBE })}
            </span>
          )}
          {todo.focusMinutes > 0 && (
            <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--color-subtle)', display: 'flex', alignItems: 'center', gap: 3 }}>
              <Timer size={9} /> {todo.focusMinutes}m
            </span>
          )}
          {todo.noteId && (
            <button onClick={() => onOpenNote(todo.id)} title="Open notitie" style={{ fontSize: 10, color: ACCENT, background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', gap: 3, fontFamily: 'inherit' }}>
              <FileText size={9} /> notitie
            </button>
          )}
        </div>
      </div>

      {hover && (
        <div style={{ display: 'flex', gap: 5, flexShrink: 0, position: 'relative' }}>
          <button
            onClick={() => {
              const el = dateRef.current
              if (!el) return
              if (typeof el.showPicker === 'function') el.showPicker()
              else el.click()
            }}
            title={todo.date ? `Gepland: ${todo.date} (klik om te wijzigen)` : 'Plan op datum'}
            style={{ width: 26, height: 26, borderRadius: 7, border: `1px solid ${todo.date ? ACCENT : 'var(--color-border)'}`, background: todo.date ? 'rgba(76,100,129,0.08)' : 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: todo.date ? ACCENT : 'var(--color-subtle)' }}
          >
            <CalendarIcon size={11} />
          </button>
          <input
            ref={dateRef}
            type="date"
            value={todo.date ?? ''}
            onChange={e => updateTodo(todo.id, { date: e.target.value || undefined })}
            aria-label="Plan taak op datum"
            style={{ position: 'absolute', left: 0, top: 26, width: 1, height: 1, opacity: 0, border: 'none', padding: 0 }}
            tabIndex={-1}
          />
          {!todo.noteId && (
            <button onClick={() => onOpenNote(todo.id)} title="Notitie toevoegen"
              style={{ width: 26, height: 26, borderRadius: 7, border: '1px solid var(--color-border)', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-subtle)' }}>
              <FileText size={11} />
            </button>
          )}
          <button onClick={() => deleteTodo(todo.id)} title="Verwijder"
            style={{ width: 26, height: 26, borderRadius: 7, border: '1px solid var(--color-border)', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-subtle)' }}>
            <Trash2 size={11} />
          </button>
        </div>
      )}
    </div>
  )
}

// ── Todos section ────────────────────────────────────────────────
function TodosSection({ onOpenNote }: { onOpenNote: (todoId: string) => void }) {
  const { todos, addTodo } = useProductivityStore()
  const [title, setTitle] = useState('')
  const [priority, setPriority] = useState<TodoPriority>('medium')
  const [sphere, setSphere] = useState<'' | TodoSphere>('')
  const [date, setDate] = useState('')
  const [showDone, setShowDone] = useState(false)

  function submit() {
    if (!title.trim()) return
    addTodo(title.trim(), priority, date || undefined, sphere || undefined)
    setTitle('')
    setDate('')
    setSphere('')
  }

  const open = todos.filter(t => !t.done)
  const done = todos.filter(t => t.done)
  const priOrder: TodoPriority[] = ['high', 'medium', 'low']
  const todayStr = TODAY()

  const overdue = open.filter(t => t.date && t.date < todayStr)
  const todayList = open.filter(t => t.date === todayStr)
  const upcoming = open.filter(t => t.date && t.date > todayStr)
  const someday = open.filter(t => !t.date)
  const sortPri = (a: Todo, b: Todo) => priOrder.indexOf(a.priority) - priOrder.indexOf(b.priority)

  const groups: { label: string; items: Todo[] }[] = [
    { label: 'Verlopen', items: overdue.sort(sortPri) },
    { label: 'Vandaag', items: todayList.sort(sortPri) },
    { label: 'Gepland', items: upcoming.sort((a, b) => (a.date! < b.date! ? -1 : 1)) },
    { label: 'Ooit', items: someday.sort(sortPri) },
  ].filter(g => g.items.length > 0)

  return (
    <div style={{ maxWidth: 640 }}>
      {/* Quick add */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24, alignItems: 'center' }}>
        <input
          value={title}
          onChange={e => setTitle(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && submit()}
          placeholder="Nieuwe taak..."
          style={{ ...inputStyle, flex: 1, padding: '12px 16px', fontSize: 14 }}
        />
        <select
          value={priority}
          onChange={e => setPriority(e.target.value as TodoPriority)}
          style={{ ...inputStyle, width: 100, cursor: 'pointer' }}
          aria-label="Prioriteit"
        >
          <option value="high">Hoog</option>
          <option value="medium">Medium</option>
          <option value="low">Laag</option>
        </select>
        <select
          value={sphere}
          onChange={e => setSphere(e.target.value as '' | TodoSphere)}
          style={{ ...inputStyle, width: 128, cursor: 'pointer', color: sphere ? SPHERE_CFG[sphere].color : 'var(--color-subtle)' }}
          aria-label="Sfeer"
        >
          <option value="">Sfeer...</option>
          <option value="personal">Persoonlijk</option>
          <option value="professional">Professioneel</option>
        </select>
        <input
          type="date"
          value={date}
          onChange={e => setDate(e.target.value)}
          style={{ ...inputStyle, width: 140, cursor: 'pointer', colorScheme: 'light dark' }}
          aria-label="Datum"
        />
        <button
          onClick={submit}
          disabled={!title.trim()}
          aria-label="Taak toevoegen"
          style={{ width: 42, height: 40, borderRadius: 10, border: 'none', background: title.trim() ? 'var(--color-ink)' : 'var(--color-border)', color: title.trim() ? 'var(--color-bg)' : 'var(--color-muted)', cursor: title.trim() ? 'pointer' : 'default', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 150ms' }}
        >
          <Plus size={16} />
        </button>
      </div>

      {groups.length === 0 && done.length === 0 && (
        <div style={{ padding: '40px 24px', borderRadius: 14, border: '1.5px dashed var(--color-border)', textAlign: 'center' }}>
          <p style={{ fontSize: 13, color: 'var(--color-subtle)' }}>Nog geen taken. Voeg je eerste taak toe hierboven.</p>
        </div>
      )}

      {groups.map(g => (
        <div key={g.label} style={{ marginBottom: 22 }}>
          <SectionLabel>{g.label} · {g.items.length}</SectionLabel>
          <div style={{ borderRadius: 14, border: '1px solid var(--color-border)', background: 'var(--color-card)', overflow: 'hidden' }}>
            {g.items.map(t => <TodoRow key={t.id} todo={t} onOpenNote={onOpenNote} />)}
          </div>
        </div>
      ))}

      {done.length > 0 && (
        <div style={{ marginBottom: 22 }}>
          <button onClick={() => setShowDone(v => !v)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontFamily: 'inherit', display: 'block', marginBottom: 10 }}>
            <SectionLabel>{showDone ? '▾' : '▸'} Afgewerkt · {done.length}</SectionLabel>
          </button>
          {showDone && (
            <div style={{ borderRadius: 14, border: '1px solid var(--color-border)', background: 'var(--color-card)', overflow: 'hidden', opacity: 0.7 }}>
              {done.map(t => <TodoRow key={t.id} todo={t} onOpenNote={onOpenNote} />)}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Calendar section ─────────────────────────────────────────────
function CalendarSection({ onOpenNote }: { onOpenNote: (todoId: string) => void }) {
  const { todos, addTodo } = useProductivityStore()
  const [viewDate, setViewDate] = useState(new Date())
  const [selected, setSelected] = useState<string>(TODAY())
  const [quickTitle, setQuickTitle] = useState('')
  const [quickSphere, setQuickSphere] = useState<'' | TodoSphere>('')

  const year = viewDate.getFullYear()
  const month = viewDate.getMonth()
  const daysInMonth = getDaysInMonth(viewDate)
  const firstDow = (getDay(startOfMonth(viewDate)) + 6) % 7 // maandag = 0
  const todayStr = TODAY()

  const byDate = useMemo(() => {
    const map: Record<string, Todo[]> = {}
    todos.forEach(t => { if (t.date) (map[t.date] ??= []).push(t) })
    return map
  }, [todos])

  const selectedTodos = byDate[selected] ?? []

  function quickAdd() {
    if (!quickTitle.trim()) return
    addTodo(quickTitle.trim(), 'medium', selected, quickSphere || undefined)
    setQuickSphere('')
    setQuickTitle('')
  }

  const cells: (number | null)[] = [
    ...Array.from({ length: firstDow }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.4fr) minmax(280px, 1fr)', gap: 24, alignItems: 'start' }}>
      {/* Month grid */}
      <div className="card" style={{ padding: 20, borderRadius: 16, border: '1px solid var(--color-border)', background: 'var(--color-card)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-ink)', letterSpacing: '-0.01em', textTransform: 'capitalize' }}>
            {format(viewDate, 'MMMM yyyy', { locale: nlBE })}
          </p>
          <div style={{ display: 'flex', gap: 6 }}>
            <button onClick={() => setViewDate(d => subMonths(d, 1))} aria-label="Vorige maand"
              style={{ width: 28, height: 28, borderRadius: 8, border: '1px solid var(--color-border)', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-muted)' }}>
              <ChevronLeft size={13} />
            </button>
            <button onClick={() => setViewDate(d => addMonths(d, 1))} aria-label="Volgende maand"
              style={{ width: 28, height: 28, borderRadius: 8, border: '1px solid var(--color-border)', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-muted)' }}>
              <ChevronRight size={13} />
            </button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, marginBottom: 6 }}>
          {['Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za', 'Zo'].map(d => (
            <div key={d} style={{ textAlign: 'center', fontSize: 9, fontWeight: 700, color: 'var(--color-subtle)', fontFamily: 'var(--font-mono)', letterSpacing: '0.08em', padding: '4px 0' }}>{d}</div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
          {cells.map((d, i) => {
            if (d === null) return <div key={`e${i}`} />
            const dateStr = format(new Date(year, month, d), 'yyyy-MM-dd')
            const dayTodos = byDate[dateStr] ?? []
            const openCount = dayTodos.filter(t => !t.done).length
            const allDone = dayTodos.length > 0 && openCount === 0
            const isSel = dateStr === selected
            const isToday = dateStr === todayStr
            return (
              <button
                key={d}
                onClick={() => setSelected(dateStr)}
                style={{
                  aspectRatio: '1', borderRadius: 9, cursor: 'pointer', position: 'relative',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 3,
                  border: `1.5px solid ${isSel ? ACCENT : isToday ? 'rgba(76,100,129,0.35)' : 'transparent'}`,
                  background: isSel ? 'rgba(76,100,129,0.10)' : 'transparent',
                  transition: 'all 150ms', fontFamily: 'inherit', padding: 0,
                }}
              >
                <span style={{ fontSize: 12, fontWeight: isToday || isSel ? 700 : 400, color: isSel ? ACCENT : isToday ? 'var(--color-ink)' : 'var(--color-muted)' }}>{d}</span>
                {dayTodos.length > 0 && (
                  <div style={{ display: 'flex', gap: 2 }}>
                    {dayTodos.slice(0, 3).map((t, j) => (
                      <span key={j} style={{ width: 4, height: 4, borderRadius: '50%', background: t.done ? '#6DB889' : allDone ? '#6DB889' : PRIORITY_CFG[t.priority].color, opacity: t.done ? 0.5 : 1 }} />
                    ))}
                    {dayTodos.length > 3 && <span style={{ fontSize: 7, color: 'var(--color-subtle)', lineHeight: '4px' }}>+</span>}
                  </div>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Day detail */}
      <div className="card" style={{ padding: 20, borderRadius: 16, border: '1px solid var(--color-border)', background: 'var(--color-card)' }}>
        <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-ink)', marginBottom: 2, textTransform: 'capitalize' }}>
          {format(new Date(selected + 'T12:00:00'), 'EEEE d MMMM', { locale: nlBE })}
        </p>
        <p style={{ fontSize: 11, color: 'var(--color-subtle)', fontFamily: 'var(--font-mono)', marginBottom: 14 }}>
          {selectedTodos.filter(t => !t.done).length} open · {selectedTodos.filter(t => t.done).length} klaar
        </p>

        <div style={{ marginBottom: 14 }}>
          <div style={{ display: 'flex', gap: 6 }}>
            <input
              value={quickTitle}
              onChange={e => setQuickTitle(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && quickAdd()}
              placeholder="Taak voor deze dag..."
              style={{ ...inputStyle, flex: 1, fontSize: 12, padding: '8px 12px' }}
            />
            <button onClick={quickAdd} disabled={!quickTitle.trim()} aria-label="Toevoegen"
              style={{ width: 34, height: 34, borderRadius: 11, border: 'none', background: quickTitle.trim() ? 'var(--color-ink)' : 'var(--color-border)', color: quickTitle.trim() ? 'var(--color-bg)' : 'var(--color-muted)', cursor: quickTitle.trim() ? 'pointer' : 'default', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Plus size={14} />
            </button>
          </div>
          {/* Sfeer: persoonlijk of professioneel */}
          <div style={{ display: 'flex', gap: 5, marginTop: 7 }}>
            {(Object.keys(SPHERE_CFG) as TodoSphere[]).map(s => {
              const active = quickSphere === s
              return (
                <button key={s} onClick={() => setQuickSphere(active ? '' : s)}
                  aria-label={`Markeer als ${SPHERE_CFG[s].label}`}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 5, padding: '4px 11px', borderRadius: 99,
                    fontSize: 10, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-mono)',
                    transition: 'all 150ms',
                    border: `1.5px solid ${active ? SPHERE_CFG[s].color : 'var(--color-border)'}`,
                    background: active ? `${SPHERE_CFG[s].color}18` : 'transparent',
                    color: active ? SPHERE_CFG[s].color : 'var(--color-subtle)',
                  }}>
                  <span style={{ width: 5, height: 5, borderRadius: '50%', background: SPHERE_CFG[s].color, display: 'inline-block' }} />
                  {SPHERE_CFG[s].label}
                </button>
              )
            })}
          </div>
        </div>

        {selectedTodos.length === 0 ? (
          <p style={{ fontSize: 12, color: 'var(--color-subtle)', textAlign: 'center', padding: '20px 0' }}>Niets gepland op deze dag.</p>
        ) : (
          <div style={{ borderRadius: 12, border: '1px solid var(--color-border)', overflow: 'hidden' }}>
            {selectedTodos.map(t => <TodoRow key={t.id} todo={t} onOpenNote={onOpenNote} />)}
          </div>
        )}
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
    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(240px, 300px) minmax(0, 1fr)', gap: 24, alignItems: 'start' }}>
      {/* List */}
      <div>
        <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Zoek notities..."
            style={{ ...inputStyle, flex: 1, fontSize: 12, padding: '8px 12px' }}
          />
          <button onClick={createNote} aria-label="Nieuwe notitie"
            style={{ width: 34, height: 34, borderRadius: 9, border: 'none', background: 'var(--color-ink)', color: 'var(--color-bg)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Plus size={14} />
          </button>
        </div>

        {filtered.length === 0 ? (
          <p style={{ fontSize: 12, color: 'var(--color-subtle)', padding: '16px 4px' }}>
            {notes.length === 0 ? 'Nog geen notities.' : 'Geen resultaten.'}
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {filtered.map(n => (
              <button
                key={n.id}
                onClick={() => setActiveNoteId(n.id)}
                style={{
                  textAlign: 'left', padding: '12px 14px', borderRadius: 12, cursor: 'pointer', fontFamily: 'inherit',
                  border: `1.5px solid ${n.id === activeNoteId ? ACCENT : 'var(--color-border)'}`,
                  background: n.id === activeNoteId ? 'rgba(76,100,129,0.06)' : 'var(--color-card)',
                  transition: 'all 150ms',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  {n.pinned && <Pin size={10} color={ACCENT} style={{ flexShrink: 0 }} />}
                  <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {n.title || 'Zonder titel'}
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
        <div className="card" style={{ padding: 24, borderRadius: 16, border: '1px solid var(--color-border)', background: 'var(--color-card)' }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 14 }}>
            <input
              value={active.title}
              onChange={e => updateNote(active.id, { title: e.target.value })}
              placeholder="Titel..."
              style={{ flex: 1, border: 'none', background: 'transparent', outline: 'none', fontSize: 18, fontWeight: 700, color: 'var(--color-ink)', fontFamily: 'inherit', letterSpacing: '-0.01em', padding: 0 }}
            />
            <button onClick={() => updateNote(active.id, { pinned: !active.pinned })} title={active.pinned ? 'Losmaken' : 'Vastpinnen'}
              style={{ width: 30, height: 30, borderRadius: 8, border: '1px solid var(--color-border)', background: active.pinned ? 'rgba(76,100,129,0.10)' : 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: active.pinned ? ACCENT : 'var(--color-subtle)' }}>
              <Pin size={13} />
            </button>
            <button onClick={() => { deleteNote(active.id); setActiveNoteId(null) }} title="Verwijder notitie"
              style={{ width: 30, height: 30, borderRadius: 8, border: '1px solid var(--color-border)', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-subtle)' }}>
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
              aria-label="Koppel aan taak"
            >
              <option value="">Niet gekoppeld aan taak</option>
              {todos.filter(t => !t.done || t.id === active.todoId).map(t => (
                <option key={t.id} value={t.id}>{t.title}</option>
              ))}
            </select>
            {linkedTodo && (
              <span style={{ fontSize: 10, color: linkedTodo.done ? '#6DB889' : 'var(--color-subtle)', fontFamily: 'var(--font-mono)' }}>
                {linkedTodo.done ? '✓ afgewerkt' : 'open'}
              </span>
            )}
          </div>

          <textarea
            value={active.body}
            onChange={e => updateNote(active.id, { body: e.target.value })}
            placeholder="Schrijf hier..."
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
  const ringColor = timer.mode === 'break' ? '#6DB889' : ACCENT

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(260px, 320px)', gap: 32, alignItems: 'start', maxWidth: 860 }}>
      {/* Timer */}
      <div className="card" style={{ padding: '40px 32px', borderRadius: 18, border: '1px solid var(--color-border)', background: 'var(--color-card)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: ringColor, fontFamily: 'var(--font-mono)', marginBottom: 24 }}>
          {timer.mode === 'break' ? 'Pauze' : 'Focus'}
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
            <span data-testid="timer-clock" style={{ fontSize: 44, fontWeight: 800, color: 'var(--color-ink)', fontFamily: 'var(--font-mono)', letterSpacing: '-0.02em' }}>
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
              style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '13px 28px', borderRadius: 12, border: 'none', background: 'var(--color-ink)', color: 'var(--color-bg)', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
              <Play size={14} /> Start focus
            </button>
          )}
          {isBreakReady && (
            <>
              <button onClick={() => store.startBreak()}
                style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '13px 24px', borderRadius: 12, border: 'none', background: '#6DB889', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                <Play size={14} /> Start pauze ({breakLengthMin}m)
              </button>
              <button onClick={() => store.startTimer(timer.todoId)}
                style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '13px 24px', borderRadius: 12, border: '1px solid var(--color-border)', background: 'transparent', color: 'var(--color-ink)', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                Volgende focus
              </button>
            </>
          )}
          {timer.status === 'running' && (
            <button onClick={() => store.pauseTimer()} data-testid="pause-focus"
              style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '13px 28px', borderRadius: 12, border: '1px solid var(--color-border)', background: 'transparent', color: 'var(--color-ink)', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
              <Pause size={14} /> Pauzeer
            </button>
          )}
          {timer.status === 'paused' && (
            <button onClick={() => store.resumeTimer()}
              style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '13px 28px', borderRadius: 12, border: 'none', background: 'var(--color-ink)', color: 'var(--color-bg)', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
              <Play size={14} /> Hervat
            </button>
          )}
          {timer.status !== 'idle' && (
            <button onClick={() => store.stopTimer()} title="Stop en reset"
              style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '13px 18px', borderRadius: 12, border: '1px solid var(--color-border)', background: 'transparent', color: 'var(--color-subtle)', fontSize: 14, cursor: 'pointer', fontFamily: 'inherit' }}>
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
            aria-label="Werk aan taak"
          >
            <option value="">Geen taak gekoppeld</option>
            {openTodos.map(t => <option key={t.id} value={t.id}>{t.title}</option>)}
          </select>

          {timer.status === 'idle' && (
            <div style={{ display: 'flex', gap: 10 }}>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.10em', textTransform: 'uppercase', color: 'var(--color-subtle)', fontFamily: 'var(--font-mono)', display: 'block', marginBottom: 4 }}>Focus (min)</label>
                <select value={focusLengthMin} onChange={e => store.setFocusLength(Number(e.target.value))} style={{ ...inputStyle, cursor: 'pointer', fontSize: 12 }}>
                  {[15, 25, 45, 60, 90].map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.10em', textTransform: 'uppercase', color: 'var(--color-subtle)', fontFamily: 'var(--font-mono)', display: 'block', marginBottom: 4 }}>Pauze (min)</label>
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
        <div className="card" style={{ padding: '18px 20px', borderRadius: 16, border: '1px solid var(--color-border)', background: 'var(--color-card)' }}>
          <SectionLabel>Vandaag</SectionLabel>
          <div style={{ display: 'flex', gap: 24 }}>
            <div>
              <p style={{ fontSize: 26, fontWeight: 800, color: 'var(--color-ink)', fontFamily: 'var(--font-mono)', lineHeight: 1 }}>{todayMinutes}<span style={{ fontSize: 13, color: 'var(--color-subtle)' }}>m</span></p>
              <p style={{ fontSize: 10, color: 'var(--color-subtle)', marginTop: 3 }}>Gefocust</p>
            </div>
            <div>
              <p style={{ fontSize: 26, fontWeight: 800, color: 'var(--color-ink)', fontFamily: 'var(--font-mono)', lineHeight: 1 }}>{todaySessions.length}</p>
              <p style={{ fontSize: 10, color: 'var(--color-subtle)', marginTop: 3 }}>Sessies</p>
            </div>
          </div>
        </div>

        {todaySessions.length > 0 && (
          <div className="card" style={{ padding: '18px 20px', borderRadius: 16, border: '1px solid var(--color-border)', background: 'var(--color-card)' }}>
            <SectionLabel>Sessies vandaag</SectionLabel>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {todaySessions.slice(0, 8).map(s => {
                const t = s.todoId ? todos.find(x => x.id === s.todoId) : null
                return (
                  <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ width: 5, height: 5, borderRadius: '50%', background: ACCENT, flexShrink: 0 }} />
                    <span style={{ fontSize: 12, color: 'var(--color-ink)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {t?.title ?? 'Vrije focus'}
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
          <div className="card" style={{ padding: '18px 20px', borderRadius: 16, border: '1px solid var(--color-border)', background: 'var(--color-card)' }}>
            <SectionLabel>Focus per taak</SectionLabel>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[...todos].filter(t => t.focusMinutes > 0).sort((a, b) => b.focusMinutes - a.focusMinutes).slice(0, 6).map(t => (
                <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 12, color: t.done ? 'var(--color-muted)' : 'var(--color-ink)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textDecoration: t.done ? 'line-through' : 'none' }}>
                    {t.title}
                  </span>
                  <span style={{ fontSize: 10, color: ACCENT, fontFamily: 'var(--font-mono)', fontWeight: 700, flexShrink: 0 }}>{t.focusMinutes}m</span>
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
  { key: 'calendar', label: 'Kalender', icon: <CalendarIcon size={13} /> },
  { key: 'todos',    label: 'Taken',    icon: <ListTodo size={13} /> },
  { key: 'notes',    label: 'Notities', icon: <FileText size={13} /> },
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
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--color-ink)', lineHeight: 1.2 }}>
            Productivity
          </h1>
          <p style={{ fontSize: 12, color: 'var(--color-subtle)', marginTop: 4, fontFamily: 'var(--font-mono)' }}>
            {openToday} taken vandaag · {todayMinutes}m gefocust
            {timer.status === 'running' && <span style={{ color: ACCENT, fontWeight: 700 }}> · timer loopt</span>}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 28, borderBottom: '1px solid var(--color-border)', paddingBottom: 0 }}>
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            style={{
              display: 'flex', alignItems: 'center', gap: 7, padding: '10px 16px',
              background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit',
              fontSize: 13, fontWeight: tab === t.key ? 700 : 500,
              color: tab === t.key ? 'var(--color-ink)' : 'var(--color-subtle)',
              borderBottom: `2px solid ${tab === t.key ? ACCENT : 'transparent'}`,
              marginBottom: -1, transition: 'all 150ms',
            }}
          >
            {t.icon} {t.label}
            {t.key === 'focus' && timer.status === 'running' && (
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: ACCENT, display: 'inline-block' }} />
            )}
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
