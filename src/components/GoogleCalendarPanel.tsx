import { useState } from 'react'
import { format, parseISO, isValid } from 'date-fns'
import { nlBE } from 'date-fns/locale'
import { Lock, ExternalLink, Copy, Check } from 'lucide-react'
import { useCalendarStore } from '../store/calendarStore'
import type { CalendarEvent } from '../store/calendarStore'
import { useGoogleCalendar } from '../hooks/useGoogleCalendar'

const DAYS_SHORT = ['mon','tue','wed','thu','fri','sat','sun'] as const
type DayKey = typeof DAYS_SHORT[number]

// Google calendar color map
const GCal_COLORS: Record<string, string> = {
  '1': '#7986CB', '2': '#33B679', '3': '#8E24AA', '4': '#E67C73',
  '5': '#F6BF26', '6': '#F4511E', '7': '#039BE5', '8': '#616161',
  '9': '#3F51B5', '10': '#0B8043', '11': '#D50000',
}

function eventColor(ev: CalendarEvent) {
  return GCal_COLORS[ev.colorId || ''] || '#7AACCF'
}

function parseEventTime(iso: string): { hour: number; minute: number } | null {
  try {
    const d = parseISO(iso)
    if (!isValid(d)) return null
    return { hour: d.getHours(), minute: d.getMinutes() }
  } catch { return null }
}

function isAllDay(ev: CalendarEvent) {
  return !ev.start.includes('T')
}

function eventDay(ev: CalendarEvent): DayKey | null {
  try {
    const d = parseISO(ev.start)
    if (!isValid(d)) return null
    const dayIdx = d.getDay() // 0=Sun, 1=Mon...
    const map: Record<number, DayKey> = { 1:'mon', 2:'tue', 3:'wed', 4:'thu', 5:'fri', 6:'sat', 0:'sun' }
    return map[dayIdx]
  } catch { return null }
}

function SetupModal({ onClose }: { onClose: () => void }) {
  const { clientId, setClientId } = useCalendarStore()
  const { connect } = useGoogleCalendar()
  const [id, setId] = useState(clientId)
  const [copied, setCopied] = useState(false)

  const handleConnect = () => {
    setClientId(id.trim())
    onClose()
    setTimeout(() => connect(), 300)
  }

  const copyOrigin = () => {
    navigator.clipboard.writeText('http://localhost:5173')
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={onClose}>
      <div style={{
          background: '#0E1524',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 24, padding: 36, width: 480,
          boxShadow: '0 32px 100px rgba(0,0,0,0.6)',
          color: 'rgba(228,236,248,0.95)',
          // Override all CSS vars to dark-mode values
          '--color-ink': 'rgba(228,236,248,0.95)',
          '--color-muted': 'rgba(180,200,224,0.65)',
          '--color-subtle': 'rgba(160,185,210,0.5)',
          '--color-border': 'rgba(255,255,255,0.09)',
          '--color-surface': 'rgba(255,255,255,0.06)',
          '--color-accent': '#7AACCF',
        } as React.CSSProperties} onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700, color: 'var(--color-ink)', marginBottom: 6, lineHeight: 1.2 }}>
            Connect Google Calendar
          </h3>
          <p style={{ fontSize: 14, color: 'var(--color-muted)', lineHeight: 1.5 }}>
            Connect your calendar so appointments appear in your weekly schedule.
          </p>
        </div>

        {/* Steps */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
          {/* Step 1 */}
          <div style={{ background: 'var(--color-surface)', borderRadius: 14, padding: '14px 16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <span style={{ width: 20, height: 20, borderRadius: '50%', background: 'var(--color-accent)', color: 'var(--color-bg)', fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>1</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-ink)' }}>Create an OAuth 2.0 Client ID</span>
            </div>
            <p style={{ fontSize: 12.5, color: 'var(--color-muted)', lineHeight: 1.55, paddingLeft: 28 }}>
              Open{' '}
              <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noreferrer"
                style={{ color: 'var(--color-accent)', textDecoration: 'none', fontWeight: 500, display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                Google Cloud Console <ExternalLink size={11} />
              </a>
              {' '}→ Credentials → OAuth 2.0 Client ID → Web application.
            </p>
          </div>

          {/* Step 2 */}
          <div style={{ background: 'var(--color-surface)', borderRadius: 14, padding: '14px 16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <span style={{ width: 20, height: 20, borderRadius: '50%', background: 'var(--color-accent)', color: 'var(--color-bg)', fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>2</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-ink)' }}>Add as Authorized JavaScript origin</span>
            </div>
            <div style={{ paddingLeft: 28 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: 8, padding: '7px 12px' }}>
                <code style={{ flex: 1, fontSize: 13, color: 'var(--color-ink)', fontFamily: 'monospace', letterSpacing: '0.01em' }}>http://localhost:5173</code>
                <button onClick={copyOrigin} title="Kopieer" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-muted)', display: 'flex', padding: 2, borderRadius: 4 }}>
                  {copied ? <Check size={14} color="var(--color-accent)" /> : <Copy size={14} />}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Client ID input */}
        <div style={{ marginBottom: 20 }}>
          <label style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--color-subtle)', display: 'block', marginBottom: 8 }}>
            Your Client ID
          </label>
          <input
            value={id}
            onChange={e => setId(e.target.value)}
            placeholder="123456789-abc.apps.googleusercontent.com"
            style={{ width: '100%', padding: '11px 14px', borderRadius: 12, border: '1.5px solid var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-ink)', fontSize: 13.5, outline: 'none', boxSizing: 'border-box', fontFamily: 'monospace', letterSpacing: '0.01em', transition: 'border-color 0.15s' }}
            onFocus={e => (e.target.style.borderColor = 'var(--color-accent)')}
            onBlur={e => (e.target.style.borderColor = 'var(--color-border)')}
          />
        </div>

        {/* Privacy notice */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, background: 'rgba(122,172,207,0.07)', border: '1px solid rgba(122,172,207,0.18)', borderRadius: 12, padding: '11px 14px', marginBottom: 28 }}>
          <Lock size={14} color="var(--color-accent)" style={{ flexShrink: 0, marginTop: 1 }} />
          <p style={{ fontSize: 12.5, color: 'var(--color-muted)', lineHeight: 1.55 }}>
            Your token is stored <strong style={{ color: 'var(--color-ink)', fontWeight: 600 }}>locally in your browser only</strong>. No data goes to an external server. Read-only access via <code style={{ fontSize: 11.5, background: 'rgba(0,0,0,0.08)', padding: '1px 5px', borderRadius: 4 }}>calendar.readonly</code> scope.
          </p>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onClose} style={{ flex: 1, padding: '11px 0', borderRadius: 12, border: '1px solid var(--color-border)', background: 'transparent', color: 'var(--color-muted)', fontSize: 13.5, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 500, transition: 'background 0.15s' }}>
            Cancel
          </button>
          <button onClick={handleConnect} disabled={!id.trim()} style={{ flex: 2, padding: '11px 0', borderRadius: 12, border: 'none', background: id.trim() ? 'var(--color-accent)' : 'var(--color-border)', color: id.trim() ? '#fff' : 'var(--color-subtle)', fontSize: 13.5, fontWeight: 700, cursor: id.trim() ? 'pointer' : 'default', fontFamily: 'inherit', transition: 'background 0.15s, opacity 0.15s', letterSpacing: '0.01em' }}>
            Connect to Google Calendar
          </button>
        </div>
      </div>
    </div>
  )
}

// Inline event chip for the week grid
export function CalendarEventChip({ event }: { event: CalendarEvent }) {
  const color = eventColor(event)
  const time = parseEventTime(event.start)
  return (
    <div style={{
      borderRadius: 6, padding: '3px 8px', fontSize: 10, fontWeight: 500,
      background: `${color}22`, borderLeft: `2px solid ${color}`,
      color, lineHeight: 1.3, overflow: 'hidden',
      whiteSpace: 'nowrap', textOverflow: 'ellipsis',
      cursor: 'pointer', marginBottom: 1,
    }}
      title={`${event.summary} • ${event.calendarName}`}
      onClick={() => event.htmlLink && window.open(event.htmlLink, '_blank')}
    >
      {time && <span style={{ opacity: 0.7 }}>{time.hour}:{String(time.minute).padStart(2,'0')} </span>}
      {event.summary}
    </div>
  )
}

// Returns events grouped by day and hour for the week grid
export function useWeekEvents() {
  const { events } = useCalendarStore()
  const byDayHour: Partial<Record<DayKey, Record<number, CalendarEvent[]>>> = {}

  events.forEach(ev => {
    const day = eventDay(ev)
    if (!day) return
    if (isAllDay(ev)) return // skip all-day for grid (shown separately)
    const time = parseEventTime(ev.start)
    if (!time) return
    if (!byDayHour[day]) byDayHour[day] = {}
    const bucket = byDayHour[day]!
    if (!bucket[time.hour]) bucket[time.hour] = []
    bucket[time.hour].push(ev)
  })

  const allDayEvents = events.filter(ev => {
    const day = eventDay(ev)
    return day && isAllDay(ev)
  })

  return { byDayHour, allDayEvents }
}

// Main Google Calendar panel (sidebar strip shown when connected)
export function GoogleCalendarStrip() {
  const { events } = useCalendarStore()
  const { connected, connect, refresh, disconnect } = useGoogleCalendar()
  const [showSetup, setShowSetup] = useState(false)
  const { clientId } = useCalendarStore()

  const today = new Date().toISOString().split('T')[0]
  const todayEvents = events.filter(ev => {
    const day = ev.start.split('T')[0]
    return day === today
  }).sort((a, b) => a.start.localeCompare(b.start))

  if (!connected) {
    return (
      <>
        {showSetup && <SetupModal onClose={() => setShowSetup(false)} />}
        <div style={{
          background: 'var(--color-card)', border: '1px solid var(--color-border)',
          borderRadius: 16, padding: '20px', marginTop: 16,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <rect x="3" y="4" width="18" height="18" rx="2" stroke="var(--color-muted)" strokeWidth="1.5"/>
              <path d="M16 2v4M8 2v4M3 10h18" stroke="var(--color-muted)" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--color-subtle)' }}>Google Calendar</span>
          </div>
          <p style={{ fontSize: 12, color: 'var(--color-muted)', marginBottom: 14, lineHeight: 1.5 }}>
            Connect your calendar to see appointments in your weekly schedule.
          </p>
          <button
            onClick={() => clientId ? connect() : setShowSetup(true)}
            style={{ width: '100%', padding: '9px 0', borderRadius: 10, border: '1px solid var(--color-border)', background: 'transparent', color: 'var(--color-muted)', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2z" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M12 8v8M8 12h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            Connect calendar
          </button>
        </div>
      </>
    )
  }

  return (
    <>
      {showSetup && <SetupModal onClose={() => setShowSetup(false)} />}
      <div style={{
        background: 'var(--color-card)', border: '1px solid var(--color-border)',
        borderRadius: 16, padding: '20px', marginTop: 16,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#7A9E8A' }} />
            <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--color-subtle)' }}>Today</span>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <button onClick={refresh} title="Refresh" style={{ width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-muted)', borderRadius: 6 }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M4 4v5h5M20 20v-5h-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><path d="M20 9A8 8 0 0 0 7.5 4.5L4 8M4 15a8 8 0 0 0 12.5 3.5L20 16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
            </button>
            <button onClick={disconnect} title="Disconnect" style={{ width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-muted)', borderRadius: 6 }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
            </button>
          </div>
        </div>

        {todayEvents.length === 0 && (
          <p style={{ fontSize: 12, color: 'var(--color-subtle)', fontStyle: 'italic' }}>No appointments today</p>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {todayEvents.map(ev => {
            const color = eventColor(ev)
            const time = parseEventTime(ev.start)
            const endTime = parseEventTime(ev.end)
            return (
              <div key={ev.id} style={{ padding: '8px 12px', borderRadius: 10, background: `${color}12`, borderLeft: `3px solid ${color}`, cursor: 'pointer' }}
                onClick={() => ev.htmlLink && window.open(ev.htmlLink, '_blank')}>
                <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-ink)', marginBottom: 2, lineHeight: 1.3 }}>{ev.summary}</p>
                {time && (
                  <p style={{ fontSize: 10, color }}>
                    {time.hour}:{String(time.minute).padStart(2,'0')}
                    {endTime && ` – ${endTime.hour}:${String(endTime.minute).padStart(2,'0')}`}
                  </p>
                )}
                {!time && <p style={{ fontSize: 10, color: 'var(--color-subtle)' }}>Hele dag · {ev.calendarName}</p>}
              </div>
            )
          })}
        </div>

        {events.length > 0 && (
          <p style={{ fontSize: 10, color: 'var(--color-subtle)', marginTop: 12 }}>
            {events.length} events deze week · {format(new Date(), "d MMM", { locale: nlBE })}
          </p>
        )}
      </div>
    </>
  )
}
