import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { scopedKey } from '../lib/workspace'

// ── Types ────────────────────────────────────────────────────────
export type TodoPriority = 'high' | 'medium' | 'low'
export type TodoSphere = 'personal' | 'professional'

export interface Todo {
  id: string
  title: string
  done: boolean
  priority: TodoPriority
  sphere?: TodoSphere    // persoonlijk of professioneel
  date?: string          // YYYY-MM-DD, optioneel: verschijnt dan op de kalender
  noteId?: string        // gekoppelde notitie
  focusMinutes: number   // totaal gefocuste minuten op deze taak
  createdAt: string
  completedAt?: string
}

export interface Note {
  id: string
  title: string
  body: string
  pinned: boolean
  todoId?: string        // gekoppelde taak
  date?: string          // optioneel: dagnotitie
  createdAt: string
  updatedAt: string
}

export interface FocusSession {
  id: string
  todoId?: string
  minutes: number
  date: string           // YYYY-MM-DD
  completedAt: string
}

// Timer state — persisted zodat de timer navigatie en refresh overleeft
export interface TimerState {
  status: 'idle' | 'running' | 'paused'
  mode: 'focus' | 'break'
  todoId?: string
  durationSec: number    // totale duur van de huidige sessie
  endsAt?: number        // epoch ms wanneer de timer afloopt (running)
  remainingSec?: number  // resterende seconden (paused)
}

interface ProductivityStore {
  todos: Todo[]
  notes: Note[]
  sessions: FocusSession[]
  timer: TimerState
  focusLengthMin: number
  breakLengthMin: number

  // Todos
  addTodo: (title: string, priority?: TodoPriority, date?: string, sphere?: TodoSphere) => string
  toggleTodo: (id: string) => void
  updateTodo: (id: string, updates: Partial<Omit<Todo, 'id' | 'createdAt'>>) => void
  deleteTodo: (id: string) => void

  // Notes
  addNote: (partial?: Partial<Pick<Note, 'title' | 'body' | 'todoId' | 'date'>>) => string
  updateNote: (id: string, updates: Partial<Omit<Note, 'id' | 'createdAt'>>) => void
  deleteNote: (id: string) => void

  // Focus
  startTimer: (todoId?: string) => void
  pauseTimer: () => void
  resumeTimer: () => void
  stopTimer: () => void
  completeSession: () => void   // wordt aangeroepen als de timer 0 bereikt
  startBreak: () => void
  setFocusLength: (min: number) => void
  setBreakLength: (min: number) => void
}

const today = () => new Date().toISOString().split('T')[0]

export const useProductivityStore = create<ProductivityStore>()(
  persist(
    (set, get) => ({
      todos: [],
      notes: [],
      sessions: [],
      timer: { status: 'idle', mode: 'focus', durationSec: 25 * 60 },
      focusLengthMin: 25,
      breakLengthMin: 5,

      addTodo: (title, priority = 'medium', date, sphere) => {
        const id = crypto.randomUUID()
        const todo: Todo = {
          id, title, done: false, priority, date, sphere,
          focusMinutes: 0, createdAt: new Date().toISOString(),
        }
        set(s => ({ todos: [todo, ...s.todos] }))
        return id
      },

      toggleTodo: (id) => set(s => ({
        todos: s.todos.map(t => t.id === id
          ? { ...t, done: !t.done, completedAt: !t.done ? new Date().toISOString() : undefined }
          : t),
      })),

      updateTodo: (id, updates) => set(s => ({
        todos: s.todos.map(t => t.id === id ? { ...t, ...updates } : t),
      })),

      deleteTodo: (id) => set(s => ({
        todos: s.todos.filter(t => t.id !== id),
        notes: s.notes.map(n => n.todoId === id ? { ...n, todoId: undefined } : n),
        timer: s.timer.todoId === id ? { ...s.timer, todoId: undefined } : s.timer,
      })),

      addNote: (partial) => {
        const id = crypto.randomUUID()
        const now = new Date().toISOString()
        const note: Note = {
          id, title: partial?.title ?? '', body: partial?.body ?? '',
          pinned: false, todoId: partial?.todoId, date: partial?.date,
          createdAt: now, updatedAt: now,
        }
        set(s => ({ notes: [note, ...s.notes] }))
        return id
      },

      updateNote: (id, updates) => set(s => ({
        notes: s.notes.map(n => n.id === id ? { ...n, ...updates, updatedAt: new Date().toISOString() } : n),
      })),

      deleteNote: (id) => set(s => ({
        notes: s.notes.filter(n => n.id !== id),
        todos: s.todos.map(t => t.noteId === id ? { ...t, noteId: undefined } : t),
      })),

      startTimer: (todoId) => {
        const dur = get().focusLengthMin * 60
        set({ timer: { status: 'running', mode: 'focus', todoId, durationSec: dur, endsAt: Date.now() + dur * 1000 } })
      },

      pauseTimer: () => set(s => {
        if (s.timer.status !== 'running' || !s.timer.endsAt) return s
        const remaining = Math.max(0, Math.round((s.timer.endsAt - Date.now()) / 1000))
        return { timer: { ...s.timer, status: 'paused', endsAt: undefined, remainingSec: remaining } }
      }),

      resumeTimer: () => set(s => {
        if (s.timer.status !== 'paused' || s.timer.remainingSec == null) return s
        return { timer: { ...s.timer, status: 'running', endsAt: Date.now() + s.timer.remainingSec * 1000, remainingSec: undefined } }
      }),

      stopTimer: () => set(s => ({
        timer: { status: 'idle', mode: 'focus', durationSec: get().focusLengthMin * 60, todoId: s.timer.todoId },
      })),

      completeSession: () => {
        const s = get()
        if (s.timer.mode === 'focus') {
          const minutes = Math.round(s.timer.durationSec / 60)
          const session: FocusSession = {
            id: crypto.randomUUID(), todoId: s.timer.todoId,
            minutes, date: today(), completedAt: new Date().toISOString(),
          }
          set({
            sessions: [session, ...s.sessions],
            todos: s.timer.todoId
              ? s.todos.map(t => t.id === s.timer.todoId ? { ...t, focusMinutes: t.focusMinutes + minutes } : t)
              : s.todos,
            timer: { status: 'idle', mode: 'break', durationSec: s.breakLengthMin * 60, todoId: s.timer.todoId },
          })
        } else {
          set({ timer: { status: 'idle', mode: 'focus', durationSec: s.focusLengthMin * 60, todoId: s.timer.todoId } })
        }
      },

      startBreak: () => {
        const dur = get().breakLengthMin * 60
        set(s => ({ timer: { ...s.timer, status: 'running', mode: 'break', durationSec: dur, endsAt: Date.now() + dur * 1000, remainingSec: undefined } }))
      },

      setFocusLength: (min) => set(s => ({
        focusLengthMin: min,
        timer: s.timer.status === 'idle' && s.timer.mode === 'focus'
          ? { ...s.timer, durationSec: min * 60 }
          : s.timer,
      })),

      setBreakLength: (min) => set({ breakLengthMin: min }),
    }),
    { name: scopedKey('productivity-v1') }
  )
)
