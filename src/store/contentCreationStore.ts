import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { scopedKey } from '../lib/workspace'

// ── Types ────────────────────────────────────────────────────────
export type Pillar = 'brand' | 'followers' | 'customers'
export type CardStatus = 'idea' | 'planned' | 'in-progress' | 'posted'
export type ContentFormat = 'reel' | 'carrousel'
export type CardPriority = 'high' | 'normal'
export type ScriptStatus = 'draft' | 'ready' | 'filmed' | 'posted'

export const AUTHORITY_GOAL = 100
export const AUTHORITY_DEADLINE = '2026-12-31'

export const PILLAR_CFG: Record<Pillar, { label: string; color: string; bg: string; short: string }> = {
  brand:     { label: 'Brand Building',    color: '#A89A8C', bg: 'rgba(168,154,140,0.10)', short: 'Brand' },
  followers: { label: 'Gaining Followers', color: '#7AACCF', bg: 'rgba(122,172,207,0.10)', short: 'Followers' },
  customers: { label: 'Gaining Customers', color: '#D4A96A', bg: 'rgba(212,169,106,0.10)', short: 'Customers' },
}

export interface Script {
  id: string
  title: string
  script: string
  cta: string
  platform: string
  notes: string
  status: ScriptStatus
  posted: boolean
  postedAt?: string      // YYYY-MM-DD
  plannedDate?: string   // YYYY-MM-DD
  order: number
  createdAt: string
}

export interface ContentCard {
  id: string
  title: string
  pillar: Pillar
  status: CardStatus
  priority: CardPriority
  platform: string
  format?: ContentFormat // reel of carrousel
  hasFile?: boolean      // bestand klaargezet in IndexedDB
  fileName?: string
  date?: string          // target publish date YYYY-MM-DD
  notes: string
  order: number
  createdAt: string
}

interface ContentCreationStore {
  scripts: Script[]
  cards: ContentCard[]
  brainDump: string
  baselinePosted: number   // talking heads al gepost buiten de app, tellen mee richting de 100
  setBaselinePosted: (n: number) => void
  weekGoal: number         // aanpasbaar doel: posts per week
  setWeekGoal: (n: number) => void
  postedDays: Record<string, Pillar>  // dag -> pillar van wat die dag gepost werd
  setPostedDay: (date: string, pillar: Pillar) => void
  clearPostedDay: (date: string) => void

  // Scripts (authority tracker)
  addScript: (title?: string) => string
  updateScript: (id: string, updates: Partial<Omit<Script, 'id' | 'createdAt'>>) => void
  togglePosted: (id: string) => void
  duplicateScript: (id: string) => string
  deleteScript: (id: string) => void
  reorderScripts: (fromId: string, toId: string) => void

  // Planner cards
  addCard: (pillar: Pillar, title: string, date?: string) => string
  updateCard: (id: string, updates: Partial<Omit<ContentCard, 'id' | 'createdAt'>>) => void
  deleteCard: (id: string) => void
  moveCard: (id: string, pillar: Pillar, beforeId?: string) => void

  setBrainDump: (text: string) => void
}

const today = () => new Date().toISOString().split('T')[0]

function makeContentCreationStore(storageName: string) {
  return create<ContentCreationStore>()(
  persist(
    (set, get) => ({
      scripts: [],
      cards: [],
      brainDump: '',
      baselinePosted: 0,
      weekGoal: 2,
      setWeekGoal: (n) => set({ weekGoal: Math.max(1, Math.min(14, Math.round(n) || 1)) }),
      setBaselinePosted: (n) => set({ baselinePosted: Math.max(0, Math.min(AUTHORITY_GOAL, Math.round(n) || 0)) }),
      postedDays: {},
      setPostedDay: (date, pillar) => set(s => ({ postedDays: { ...s.postedDays, [date]: pillar } })),
      clearPostedDay: (date) => set(s => {
        const next = { ...s.postedDays }
        delete next[date]
        return { postedDays: next }
      }),

      addScript: (title = '') => {
        const id = crypto.randomUUID()
        const maxOrder = Math.max(0, ...get().scripts.map(s => s.order))
        const script: Script = {
          id, title, script: '', cta: '', platform: 'Instagram', notes: '',
          status: 'draft', posted: false, order: maxOrder + 1, createdAt: new Date().toISOString(),
        }
        set(s => ({ scripts: [script, ...s.scripts] }))
        return id
      },

      updateScript: (id, updates) => set(s => ({
        scripts: s.scripts.map(sc => sc.id === id ? { ...sc, ...updates } : sc),
      })),

      togglePosted: (id) => set(s => ({
        scripts: s.scripts.map(sc => sc.id === id
          ? { ...sc, posted: !sc.posted, postedAt: !sc.posted ? today() : undefined, status: !sc.posted ? 'posted' : 'ready' }
          : sc),
      })),

      duplicateScript: (id) => {
        const src = get().scripts.find(s => s.id === id)
        if (!src) return ''
        const newId = crypto.randomUUID()
        const copy: Script = {
          ...src, id: newId, title: `${src.title} (kopie)`, posted: false,
          postedAt: undefined, status: 'draft', createdAt: new Date().toISOString(),
        }
        set(s => ({ scripts: [copy, ...s.scripts] }))
        return newId
      },

      deleteScript: (id) => set(s => ({ scripts: s.scripts.filter(sc => sc.id !== id) })),

      reorderScripts: (fromId, toId) => set(s => {
        const list = [...s.scripts]
        const fromIdx = list.findIndex(x => x.id === fromId)
        const toIdx = list.findIndex(x => x.id === toId)
        if (fromIdx < 0 || toIdx < 0) return s
        const [moved] = list.splice(fromIdx, 1)
        list.splice(toIdx, 0, moved)
        return { scripts: list }
      }),

      addCard: (pillar, title, date) => {
        const id = crypto.randomUUID()
        const maxOrder = Math.max(0, ...get().cards.filter(c => c.pillar === pillar).map(c => c.order))
        const card: ContentCard = {
          id, title, pillar, status: date ? 'planned' : 'idea', priority: 'normal', platform: 'Instagram',
          date, notes: '', order: maxOrder + 1, createdAt: new Date().toISOString(),
        }
        set(s => ({ cards: [...s.cards, card] }))
        return id
      },

      updateCard: (id, updates) => set(s => ({
        cards: s.cards.map(c => c.id === id ? { ...c, ...updates } : c),
      })),

      deleteCard: (id) => set(s => ({ cards: s.cards.filter(c => c.id !== id) })),

      moveCard: (id, pillar, beforeId) => set(s => {
        const card = s.cards.find(c => c.id === id)
        if (!card) return s
        const rest = s.cards.filter(c => c.id !== id)
        const moved = { ...card, pillar }
        if (!beforeId) {
          // achteraan in de kolom
          const maxOrder = Math.max(0, ...rest.filter(c => c.pillar === pillar).map(c => c.order))
          return { cards: [...rest, { ...moved, order: maxOrder + 1 }] }
        }
        // vóór beforeId: herorden hele kolom
        const col = rest.filter(c => c.pillar === pillar).sort((a, b) => a.order - b.order)
        const others = rest.filter(c => c.pillar !== pillar)
        const idx = col.findIndex(c => c.id === beforeId)
        col.splice(idx < 0 ? col.length : idx, 0, moved)
        return { cards: [...others, ...col.map((c, i) => ({ ...c, order: i + 1 }))] }
      }),

      setBrainDump: (text) => set({ brainDump: text }),
    }),
    {
      name: scopedKey(storageName),
      version: 1,
      migrate: (persisted: any) => {
        // v0 had postedDates: string[]; zet om naar postedDays met pillar 'customers'
        if (persisted && Array.isArray(persisted.postedDates)) {
          persisted.postedDays = Object.fromEntries(persisted.postedDates.map((d: string) => [d, 'customers']))
          delete persisted.postedDates
        }
        return persisted
      },
    }
  )
  )
}

export const useContentCreationStore = makeContentCreationStore('content-creation-v1')
export const useBoraContentCreationStore = makeContentCreationStore('content-creation-bora-v1')
export type ContentCreationStoreHook = typeof useContentCreationStore

// Eigen content-store per custom project, lazy aangemaakt en gecachet
// zodat elk project zijn eigen planner/kalender/data heeft.
const projectContentStores = new Map<string, ContentCreationStoreHook>()
export function getProjectContentStore(projectId: string): ContentCreationStoreHook {
  let store = projectContentStores.get(projectId)
  if (!store) {
    store = makeContentCreationStore(`content-creation-${projectId}-v1`)
    projectContentStores.set(projectId, store)
  }
  return store
}

// ── Afgeleide statistieken ───────────────────────────────────────
export function getContentStats(scripts: Script[], cards: ContentCard[], baselinePosted = 0, postedDays: Record<string, Pillar> = {}) {
  const allDates = Object.keys(postedDays)
  // alleen customers-dagen (talking heads) tellen mee richting de 100
  const customerDates = allDates.filter(d => postedDays[d] === 'customers')
  const now = new Date()
  const year = now.getFullYear()
  const monthStr = now.toISOString().slice(0, 7)

  const postedScripts = scripts.filter(s => s.posted)
  const completed = Math.min(AUTHORITY_GOAL, postedScripts.length + baselinePosted + customerDates.length)
  const remaining = Math.max(0, AUTHORITY_GOAL - completed)

  const postedCardsThisYear = cards.filter(c => c.status === 'posted' && c.date?.startsWith(String(year))).length
  const postedScriptsThisYear = postedScripts.filter(s => s.postedAt?.startsWith(String(year))).length
  const postsThisYear = postedCardsThisYear + postedScriptsThisYear + allDates.filter(d => d.startsWith(String(year))).length

  const postedThisMonth = postedScripts.filter(s => s.postedAt?.startsWith(monthStr)).length
    + cards.filter(c => c.status === 'posted' && c.date?.startsWith(monthStr)).length
    + allDates.filter(d => d.startsWith(monthStr)).length

  // pace richting deadline
  const deadline = new Date(AUTHORITY_DEADLINE + 'T23:59:59')
  const msLeft = Math.max(0, deadline.getTime() - now.getTime())
  const weeksLeft = Math.max(1, msLeft / (7 * 86400000))
  const monthsLeft = Math.max(0.25, msLeft / (30.44 * 86400000))
  const perWeekNeeded = remaining / weeksLeft
  const perMonthNeeded = remaining / monthsLeft

  // huidige tempo: posts in de laatste 28 dagen
  const cutoff = new Date(now.getTime() - 28 * 86400000).toISOString().split('T')[0]
  const recent = postedScripts.filter(s => s.postedAt && s.postedAt >= cutoff).length
    + customerDates.filter(d => d >= cutoff).length
  const pacePerDay = recent / 28
  const estDoneDate = pacePerDay > 0
    ? new Date(now.getTime() + (remaining / pacePerDay) * 86400000)
    : null

  // streak: aaneengesloten weken (t/m deze week) met minstens 1 posted script
  const weekKey = (d: Date) => {
    const x = new Date(d); const day = (x.getDay() + 6) % 7
    x.setDate(x.getDate() - day)
    return x.toISOString().split('T')[0]
  }
  const postedWeeks = new Set([
    ...postedScripts.filter(s => s.postedAt).map(s => weekKey(new Date(s.postedAt + 'T12:00:00'))),
    ...allDates.map(d => weekKey(new Date(d + 'T12:00:00'))),
  ])
  let streak = 0
  const cursor = new Date()
  while (postedWeeks.has(weekKey(cursor))) { streak++; cursor.setDate(cursor.getDate() - 7) }

  // posts die deze maand nog nodig zijn volgens het benodigde tempo
  const monthLeftTarget = Math.max(0, Math.ceil(perMonthNeeded) - postedThisMonth)

  return {
    completed, remaining, postsThisYear, postedThisMonth,
    pctOfGoal: Math.min(100, Math.round((completed / AUTHORITY_GOAL) * 100)),
    perWeekNeeded, perMonthNeeded, estDoneDate, streak, monthLeftTarget,
  }
}
