// The world she is in (one switcher, one structure), the screen she left, and half-typed lines.
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { useCallback, useSyncExternalStore } from 'react'
import { scopedKey } from '../../lib/workspace'

export type Context = 'business' | 'brand' | 'life' | 'clients'
export const CONTEXTS: { id: Context; label: string }[] = [
  { id: 'business', label: 'Business' },
  { id: 'brand',    label: 'Brand' },
  { id: 'life',     label: 'Life' },
  { id: 'clients',  label: 'Clients' },
]

interface ContextStore {
  context: Context
  setContext: (c: Context) => void
  lastRoute: string
  setLastRoute: (r: string) => void
  drafts: Record<string, string>
  setDraft: (key: string, value: string) => void
}

export const useContextStore = create<ContextStore>()(
  persist(
    (set) => ({
      context: 'business',
      setContext: (context) => set({ context }),
      lastRoute: '/now',
      setLastRoute: (lastRoute) => set({ lastRoute }),
      drafts: {},
      setDraft: (key, value) => set(s => {
        const drafts = { ...s.drafts }
        if (value) drafts[key] = value; else delete drafts[key]
        return { drafts }
      }),
    }),
    { name: scopedKey('pf-context-v1') }
  )
)

// A half-typed line survives closing the app. Clear it by saving an empty string.
export function useDraft(key: string): [string, (v: string) => void] {
  const value = useContextStore(s => s.drafts[key] ?? '')
  const setDraft = useContextStore(s => s.setDraft)
  const set = useCallback((v: string) => setDraft(key, v), [key, setDraft])
  return [value, set]
}

// The clock, once a minute, shared by every screen that shows time.
const listeners = new Set<() => void>()
let minute = new Date().toTimeString().slice(0, 5)
setInterval(() => {
  const m = new Date().toTimeString().slice(0, 5)
  if (m !== minute) { minute = m; listeners.forEach(l => l()) }
}, 15_000)
export function useClock(): string {
  return useSyncExternalStore(cb => { listeners.add(cb); return () => { listeners.delete(cb) } }, () => minute, () => minute)
}

export function minutesBetween(a: string, b: string): number {
  const [ah, am] = a.split(':').map(Number), [bh, bm] = b.split(':').map(Number)
  return (bh * 60 + bm) - (ah * 60 + am)
}
