import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { scopedKey } from '../lib/workspace'

export interface CalendarEvent {
  id: string
  summary: string
  start: string   // ISO datetime or date
  end: string     // ISO datetime or date
  colorId?: string
  calendarId: string
  calendarName: string
  htmlLink?: string
}

interface CalendarStore {
  clientId: string
  accessToken: string | null
  tokenExpiry: number | null
  events: CalendarEvent[]
  lastFetch: string | null
  connected: boolean

  setClientId: (id: string) => void
  setToken: (token: string, expiresIn: number) => void
  setEvents: (events: CalendarEvent[]) => void
  disconnect: () => void
}

export const useCalendarStore = create<CalendarStore>()(
  persist(
    (set) => ({
      clientId: '',
      accessToken: null,
      tokenExpiry: null,
      events: [],
      lastFetch: null,
      connected: false,

      setClientId: (id) => set({ clientId: id }),
      setToken: (token, expiresIn) => set({
        accessToken: token,
        tokenExpiry: Date.now() + expiresIn * 1000,
        connected: true,
      }),
      setEvents: (events) => set({ events, lastFetch: new Date().toISOString() }),
      disconnect: () => set({ accessToken: null, tokenExpiry: null, connected: false, events: [] }),
    }),
    { name: scopedKey('laurence-calendar') }
  )
)
