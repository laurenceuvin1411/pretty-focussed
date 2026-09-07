import { useEffect, useCallback, useRef } from 'react'
import { useCalendarStore } from '../store/calendarStore'
import type { CalendarEvent } from '../store/calendarStore'
import { startOfWeek, endOfWeek, formatISO } from 'date-fns'

declare global {
  interface Window {
    google: {
      accounts: {
        oauth2: {
          initTokenClient: (config: {
            client_id: string
            scope: string
            callback: (resp: { access_token: string; expires_in: number; error?: string }) => void
          }) => { requestAccessToken: () => void }
        }
      }
    }
  }
}

const SCOPE = 'https://www.googleapis.com/auth/calendar.readonly'
const GIS_SRC = 'https://accounts.google.com/gsi/client'

function loadGIS(): Promise<void> {
  return new Promise((resolve) => {
    if (document.querySelector(`script[src="${GIS_SRC}"]`)) {
      if (window.google?.accounts) { resolve(); return }
      const check = setInterval(() => {
        if (window.google?.accounts) { clearInterval(check); resolve() }
      }, 100)
      return
    }
    const s = document.createElement('script')
    s.src = GIS_SRC
    s.async = true
    s.defer = true
    s.onload = () => resolve()
    document.head.appendChild(s)
  })
}

async function fetchCalendarEvents(token: string): Promise<CalendarEvent[]> {
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 })
  const weekEnd = endOfWeek(new Date(), { weekStartsOn: 1 })

  const timeMin = formatISO(weekStart)
  const timeMax = formatISO(weekEnd)

  // First get calendar list
  const calRes = await fetch(
    'https://www.googleapis.com/calendar/v3/users/me/calendarList?maxResults=20',
    { headers: { Authorization: `Bearer ${token}` } }
  )
  if (!calRes.ok) throw new Error('Failed to fetch calendars')
  const calData = await calRes.json()

  const calendars: { id: string; summary: string; backgroundColor: string }[] =
    calData.items?.filter((c: { accessRole: string }) => c.accessRole !== 'none') || []

  // Fetch events for primary calendars (max 5 to avoid rate limits)
  const topCals = calendars.slice(0, 5)
  const allEvents: CalendarEvent[] = []

  await Promise.all(topCals.map(async (cal) => {
    try {
      const evRes = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(cal.id)}/events?` +
        `timeMin=${encodeURIComponent(timeMin)}&timeMax=${encodeURIComponent(timeMax)}&singleEvents=true&orderBy=startTime&maxResults=50`,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      if (!evRes.ok) return
      const evData = await evRes.json()
      const events: CalendarEvent[] = (evData.items || []).map((ev: {
        id: string; summary?: string; start?: { dateTime?: string; date?: string };
        end?: { dateTime?: string; date?: string }; colorId?: string; htmlLink?: string
      }) => ({
        id: ev.id,
        summary: ev.summary || '(Geen titel)',
        start: ev.start?.dateTime || ev.start?.date || '',
        end: ev.end?.dateTime || ev.end?.date || '',
        colorId: ev.colorId,
        calendarId: cal.id,
        calendarName: cal.summary,
        htmlLink: ev.htmlLink,
      }))
      allEvents.push(...events)
    } catch {
      // skip failing calendars
    }
  }))

  return allEvents
}

export function useGoogleCalendar() {
  const { clientId, accessToken, tokenExpiry, connected, setToken, setEvents, disconnect } = useCalendarStore()
  const tokenClientRef = useRef<{ requestAccessToken: () => void } | null>(null)

  const isTokenValid = accessToken && tokenExpiry && Date.now() < tokenExpiry - 60000

  const initTokenClient = useCallback(async () => {
    if (!clientId) return
    await loadGIS()
    tokenClientRef.current = window.google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: SCOPE,
      callback: async (resp) => {
        if (resp.error || !resp.access_token) {
          console.error('OAuth error', resp.error)
          return
        }
        setToken(resp.access_token, resp.expires_in)
        try {
          const events = await fetchCalendarEvents(resp.access_token)
          setEvents(events)
        } catch (e) {
          console.error('Calendar fetch error', e)
        }
      },
    })
  }, [clientId])

  useEffect(() => {
    if (clientId) initTokenClient()
  }, [clientId])

  const connect = useCallback(async () => {
    if (!tokenClientRef.current) await initTokenClient()
    tokenClientRef.current?.requestAccessToken()
  }, [initTokenClient])

  const refresh = useCallback(async () => {
    if (!isTokenValid || !accessToken) { connect(); return }
    try {
      const events = await fetchCalendarEvents(accessToken)
      setEvents(events)
    } catch {
      disconnect()
    }
  }, [isTokenValid, accessToken])

  // Auto-fetch on load if token still valid
  useEffect(() => {
    if (isTokenValid && accessToken) {
      fetchCalendarEvents(accessToken).then(setEvents).catch(() => disconnect())
    }
  }, [])

  return { connected: connected && !!isTokenValid, connect, refresh, disconnect }
}
