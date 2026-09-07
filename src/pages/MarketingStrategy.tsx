import { useState } from 'react'
import { Sparkles, RefreshCw, Plus, Trash2, ChevronDown, ChevronUp, Link } from 'lucide-react'
import {
  useMarketingStrategyStore,
  MONTHS_NL, MONTHS_FULL, CHANNELS, FUNNEL_STAGES, AUDIENCE_TYPES, KPI_KEYS, KPI_LABELS,
} from '../store/marketingStrategyStore'
import { useProjectDataStore } from '../store/projectStore'
import type {
  Month, MonthData, Channel, ChannelStatus, FunnelStage, Launch, MarketingEvent,
} from '../store/marketingStrategyStore'

// ── Constants ────────────────────────────────────────────────────
const ACCENT = '#4C6481'
const YEARS = [2025, 2026, 2027, 2028, 2029]

const CHANNEL_STATUS_CONFIG: Record<ChannelStatus, { label: string; bg: string; color: string }> = {
  active:      { label: 'Actief',      bg: `rgba(76,100,129,0.12)`,  color: ACCENT },
  campaign:    { label: 'Campagne',    bg: `rgba(76,100,129,0.22)`,  color: ACCENT },
  maintenance: { label: 'Onderhoud',  bg: 'var(--color-surface)',    color: 'var(--color-muted)' },
  off:         { label: '—',           bg: 'transparent',             color: 'var(--color-border)' },
}

const FUNNEL_CONFIG: Record<FunnelStage, { label: string; color: string }> = {
  awareness:  { label: 'Awareness',  color: '#B9BBBE' },
  interest:   { label: 'Interest',   color: '#7C7F84' },
  lead:       { label: 'Lead',       color: ACCENT },
  nurture:    { label: 'Nurture',    color: ACCENT },
  sales:      { label: 'Sales',      color: '#3C3E42' },
  retention:  { label: 'Retention',  color: '#7C7F84' },
  referral:   { label: 'Referral',   color: '#B9BBBE' },
}

const SECTION_TABS = [
  { id: 'overview',   label: 'Jaaroverzicht' },
  { id: 'channels',   label: 'Kanalen' },
  { id: 'launches',   label: 'Lanceringen' },
  { id: 'events',     label: 'Events' },
  { id: 'kpis',       label: 'KPIs' },
  { id: 'ai',         label: 'AI Strategie' },
]

// ── Helpers ──────────────────────────────────────────────────────
const inp: React.CSSProperties = {
  width: '100%', padding: '7px 10px', borderRadius: 7,
  border: '1px solid var(--color-border)', background: 'var(--color-surface)',
  color: 'var(--color-ink)', fontSize: 12, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box',
}

function Badge({ status }: { status: ChannelStatus }) {
  const cfg = CHANNEL_STATUS_CONFIG[status]
  return (
    <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 99, fontSize: 9, fontWeight: 700, background: cfg.bg, color: cfg.color, fontFamily: 'var(--font-mono)', letterSpacing: '0.06em' }}>
      {cfg.label}
    </span>
  )
}

function FunnelBadge({ stage }: { stage: FunnelStage | '' }) {
  if (!stage) return null
  const cfg = FUNNEL_CONFIG[stage]
  return (
    <span style={{ padding: '2px 8px', borderRadius: 99, fontSize: 9, fontWeight: 700, background: `${cfg.color}18`, color: cfg.color, fontFamily: 'var(--font-mono)', letterSpacing: '0.06em' }}>
      {cfg.label}
    </span>
  )
}

function Field({ label, value, onChange, multiline }: { label: string; value: string; onChange: (v: string) => void; multiline?: boolean }) {
  const [editing, setEditing] = useState(false)
  return (
    <div>
      <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--color-subtle)', marginBottom: 3, fontFamily: 'var(--font-mono)' }}>{label}</p>
      {editing ? (
        multiline ? (
          <textarea
            autoFocus
            value={value}
            onChange={e => onChange(e.target.value)}
            onBlur={() => setEditing(false)}
            rows={2}
            style={{ ...inp, resize: 'vertical' }}
          />
        ) : (
          <input
            autoFocus
            style={inp}
            value={value}
            onChange={e => onChange(e.target.value)}
            onBlur={() => setEditing(false)}
            onKeyDown={e => e.key === 'Enter' && setEditing(false)}
          />
        )
      ) : (
        <p
          onClick={() => setEditing(true)}
          style={{ fontSize: 12, color: value ? 'var(--color-ink)' : 'var(--color-border)', cursor: 'text', minHeight: 18, lineHeight: 1.5 }}
        >
          {value || 'Klik om in te vullen...'}
        </p>
      )}
    </div>
  )
}

// ── Overview section ─────────────────────────────────────────────
function OverviewSection({ projectId, year }: { projectId: string; year: number }) {
  const { plans, setMonthData } = useMarketingStrategyStore()
  const yearPlan = plans[projectId]?.[year]
  const [expanded, setExpanded] = useState<Month | null>(null)

  function upd(month: Month, data: Partial<MonthData>) {
    setMonthData(projectId, year, month, data)
  }

  return (
    <div>
      {/* 12 month cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
        {(Array.from({ length: 12 }, (_, i) => (i + 1) as Month)).map(m => {
          const d = yearPlan?.months[m] ?? {}
          const isExp = expanded === m
          return (
            <div key={m} className="card" style={{ overflow: 'hidden', transition: 'box-shadow 150ms' }}>
              {/* Month header */}
              <div
                onClick={() => setExpanded(isExp ? null : m)}
                style={{ padding: '14px 18px 12px', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', userSelect: 'none' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 9, fontWeight: 700, color: 'var(--color-subtle)', fontFamily: 'var(--font-mono)', letterSpacing: '0.14em' }}>
                    {String(m).padStart(2, '0')}
                  </span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-ink)' }}>{MONTHS_FULL[m - 1]}</span>
                  {d.funnelFocus && <FunnelBadge stage={d.funnelFocus} />}
                </div>
                {isExp ? <ChevronUp size={14} color="var(--color-muted)" /> : <ChevronDown size={14} color="var(--color-muted)" />}
              </div>

              {/* Compact summary */}
              {!isExp && (
                <div style={{ padding: '12px 18px', display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: d.primaryFocus ? 'var(--color-ink)' : 'var(--color-border)', lineHeight: 1.3, minHeight: 18 }}>
                    {d.primaryFocus || 'Primary focus...'}
                  </p>
                  {d.campaign && (
                    <p style={{ fontSize: 11, color: 'var(--color-subtle)' }}>↗ {d.campaign}</p>
                  )}
                  {d.mainKpi && (
                    <p style={{ fontSize: 10, color: ACCENT, fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{d.mainKpi}</p>
                  )}
                  {/* Channel dots */}
                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 2 }}>
                    {CHANNELS.filter(c => d.channels?.[c] === 'active' || d.channels?.[c] === 'campaign').map(c => (
                      <span
                        key={c}
                        style={{ fontSize: 9, padding: '1px 6px', borderRadius: 99, background: `rgba(76,100,129,${d.channels?.[c] === 'campaign' ? '0.18' : '0.09'})`, color: ACCENT, fontFamily: 'var(--font-mono)', letterSpacing: '0.04em' }}
                      >
                        {c.split('/')[0]}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Expanded detail */}
              {isExp && (
                <div style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <Field label="Primary Focus" value={d.primaryFocus ?? ''} onChange={v => upd(m, { primaryFocus: v })} />
                  <Field label="Campagne" value={d.campaign ?? ''} onChange={v => upd(m, { campaign: v })} />
                  <Field label="Lancering" value={d.launch ?? ''} onChange={v => upd(m, { launch: v })} />
                  <Field label="Events" value={d.events ?? ''} onChange={v => upd(m, { events: v })} />
                  <Field label="Content Thema" value={d.contentTheme ?? ''} onChange={v => upd(m, { contentTheme: v })} />
                  <Field label="Primary Audience" value={d.primaryAudience ?? ''} onChange={v => upd(m, { primaryAudience: v })} />
                  <Field label="Main KPI" value={d.mainKpi ?? ''} onChange={v => upd(m, { mainKpi: v })} />
                  <div>
                    <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--color-subtle)', marginBottom: 6, fontFamily: 'var(--font-mono)' }}>Funnel Focus</p>
                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                      {FUNNEL_STAGES.map(s => {
                        const active = d.funnelFocus === s
                        const cfg = FUNNEL_CONFIG[s]
                        return (
                          <button key={s} onClick={() => upd(m, { funnelFocus: active ? '' : s })}
                            style={{ padding: '3px 10px', borderRadius: 99, fontSize: 10, cursor: 'pointer', fontFamily: 'inherit', border: `1.5px solid ${active ? cfg.color : 'var(--color-border)'}`, background: active ? `${cfg.color}18` : 'transparent', color: active ? cfg.color : 'var(--color-muted)', transition: 'all 150ms' }}>
                            {cfg.label}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                  <Field label="Hero Topic" value={d.heroTopic ?? ''} onChange={v => upd(m, { heroTopic: v })} />
                  <Field label="CTA" value={d.cta ?? ''} onChange={v => upd(m, { cta: v })} />
                  <Field label="Lead Magnet" value={d.leadMagnet ?? ''} onChange={v => upd(m, { leadMagnet: v })} />
                  <Field label="Aanbod" value={d.offer ?? ''} onChange={v => upd(m, { offer: v })} />
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Channels section ─────────────────────────────────────────────
function ChannelsSection({ projectId, year }: { projectId: string; year: number }) {
  const { plans, setMonthData } = useMarketingStrategyStore()
  const yearPlan = plans[projectId]?.[year]

  function cycleStatus(channel: Channel, month: Month) {
    const statuses: ChannelStatus[] = ['active', 'campaign', 'maintenance', 'off']
    const current = yearPlan?.months[month]?.channels?.[channel] ?? 'off'
    const next = statuses[(statuses.indexOf(current) + 1) % statuses.length]
    const existing = yearPlan?.months[month]?.channels ?? {}
    setMonthData(projectId, year, month, { channels: { ...existing, [channel]: next } })
  }

  return (
    <div style={{ overflowX: 'auto' }}>
      <p style={{ fontSize: 11, color: 'var(--color-subtle)', marginBottom: 16 }}>Klik op een cel om de status te wisselen.</p>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
        <thead>
          <tr>
            <th style={{ textAlign: 'left', padding: '8px 12px', fontWeight: 700, fontSize: 9, letterSpacing: '0.12em', color: 'var(--color-subtle)', fontFamily: 'var(--font-mono)', borderBottom: '1px solid var(--color-border)', whiteSpace: 'nowrap' }}>Kanaal</th>
            {MONTHS_NL.map(m => (
              <th key={m} style={{ textAlign: 'center', padding: '8px 6px', fontWeight: 700, fontSize: 9, letterSpacing: '0.10em', color: 'var(--color-subtle)', fontFamily: 'var(--font-mono)', borderBottom: '1px solid var(--color-border)', minWidth: 62 }}>{m}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {CHANNELS.map(channel => (
            <tr key={channel}>
              <td style={{ padding: '8px 12px', fontWeight: 600, color: 'var(--color-ink)', fontSize: 12, borderBottom: '1px solid var(--color-border)', whiteSpace: 'nowrap' }}>{channel}</td>
              {(Array.from({ length: 12 }, (_, i) => (i + 1) as Month)).map(m => {
                const status = yearPlan?.months[m]?.channels?.[channel] ?? 'off'
                const cfg = CHANNEL_STATUS_CONFIG[status]
                return (
                  <td key={m} style={{ textAlign: 'center', padding: '6px 4px', borderBottom: '1px solid var(--color-border)' }}>
                    <button
                      onClick={() => cycleStatus(channel, m)}
                      title={cfg.label}
                      style={{ padding: '3px 8px', borderRadius: 14, fontSize: 9, cursor: 'pointer', fontFamily: 'var(--font-mono)', fontWeight: 700, border: `1px solid ${status === 'off' ? 'var(--color-border)' : cfg.color}`, background: cfg.bg, color: cfg.color, transition: 'all 120ms', letterSpacing: '0.04em', whiteSpace: 'nowrap' }}
                    >
                      {cfg.label}
                    </button>
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>

      {/* Legend */}
      <div style={{ display: 'flex', gap: 16, marginTop: 16 }}>
        {(Object.entries(CHANNEL_STATUS_CONFIG) as [ChannelStatus, typeof CHANNEL_STATUS_CONFIG[ChannelStatus]][]).map(([k, v]) => (
          <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 8, height: 8, borderRadius: 2, background: v.bg, border: `1px solid ${v.color}`, display: 'inline-block' }} />
            <span style={{ fontSize: 10, color: 'var(--color-subtle)' }}>{v.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Launches section ─────────────────────────────────────────────
function LaunchesSection({ projectId, year }: { projectId: string; year: number }) {
  const { plans, addLaunch, updateLaunch, removeLaunch } = useMarketingStrategyStore()
  const launches = plans[projectId]?.[year]?.launches ?? []
  const [adding, setAdding] = useState(false)
  const [form, setForm] = useState<Omit<Launch, 'id'>>({ name: '', quarter: 1, prelaunchWeeks: 2, waitlistDays: 14, liveDays: 7, followupDays: 14, revenueGoal: null, notes: '' })

  const QUARTERS = [1, 2, 3, 4] as const
  const byQuarter = QUARTERS.map(q => ({ q, launches: launches.filter(l => l.quarter === q) }))

  function submit() {
    if (!form.name.trim()) return
    addLaunch(projectId, year, form)
    setAdding(false)
    setForm({ name: '', quarter: 1, prelaunchWeeks: 2, waitlistDays: 14, liveDays: 7, followupDays: 14, revenueGoal: null, notes: '' })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button onClick={() => setAdding(a => !a)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 9, border: `1.5px solid ${adding ? ACCENT : 'var(--color-border)'}`, background: adding ? `rgba(76,100,129,0.08)` : 'transparent', color: adding ? ACCENT : 'var(--color-muted)', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 150ms' }}>
          <Plus size={13} /> Lancering toevoegen
        </button>
      </div>

      {adding && (
        <div className="card" style={{ padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ fontSize: 10, fontWeight: 700, color: 'var(--color-muted)', display: 'block', marginBottom: 4, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Naam</label>
              <input style={inp} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="CEO Lifestyle — Q1 Launch" />
            </div>
            <div>
              <label style={{ fontSize: 10, fontWeight: 700, color: 'var(--color-muted)', display: 'block', marginBottom: 4, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Kwartaal</label>
              <div style={{ display: 'flex', gap: 6 }}>
                {QUARTERS.map(q => (
                  <button key={q} onClick={() => setForm(f => ({ ...f, quarter: q }))}
                    style={{ flex: 1, padding: '7px', borderRadius: 7, border: `1.5px solid ${form.quarter === q ? ACCENT : 'var(--color-border)'}`, background: form.quarter === q ? `rgba(76,100,129,0.10)` : 'transparent', color: form.quarter === q ? ACCENT : 'var(--color-muted)', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                    Q{q}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
            {[
              { key: 'prelaunchWeeks', label: 'Pre-launch (weken)' },
              { key: 'waitlistDays', label: 'Waitlist (dagen)' },
              { key: 'liveDays', label: 'Live (dagen)' },
              { key: 'followupDays', label: 'Follow-up (dagen)' },
            ].map(({ key, label }) => (
              <div key={key}>
                <label style={{ fontSize: 10, fontWeight: 700, color: 'var(--color-muted)', display: 'block', marginBottom: 4, letterSpacing: '0.08em', textTransform: 'uppercase' }}>{label}</label>
                <input type="number" style={inp} value={(form as any)[key] ?? ''} onChange={e => setForm(f => ({ ...f, [key]: Number(e.target.value) }))} />
              </div>
            ))}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ fontSize: 10, fontWeight: 700, color: 'var(--color-muted)', display: 'block', marginBottom: 4, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Omzetdoel (€)</label>
              <input type="number" style={inp} value={form.revenueGoal ?? ''} onChange={e => setForm(f => ({ ...f, revenueGoal: e.target.value ? Number(e.target.value) : null }))} placeholder="10000" />
            </div>
            <div>
              <label style={{ fontSize: 10, fontWeight: 700, color: 'var(--color-muted)', display: 'block', marginBottom: 4, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Notities</label>
              <input style={inp} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="..." />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button onClick={() => setAdding(false)} style={{ padding: '8px 16px', borderRadius: 9, border: '1px solid var(--color-border)', background: 'transparent', color: 'var(--color-muted)', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>Annuleer</button>
            <button onClick={submit} disabled={!form.name.trim()} style={{ padding: '8px 20px', borderRadius: 9, border: 'none', background: form.name.trim() ? ACCENT : 'var(--color-border)', color: form.name.trim() ? '#fff' : 'var(--color-muted)', fontSize: 12, fontWeight: 700, cursor: form.name.trim() ? 'pointer' : 'default', fontFamily: 'inherit' }}>Toevoegen</button>
          </div>
        </div>
      )}

      {/* Q1–Q4 timeline */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
        {byQuarter.map(({ q, launches: ql }) => (
          <div key={q} className="card" style={{ overflow: 'hidden' }}>
            <div style={{ padding: '13px 18px', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', color: 'var(--color-subtle)', fontFamily: 'var(--font-mono)' }}>Q{q}</span>
            </div>
            {ql.length === 0 ? (
              <div style={{ padding: '24px 18px', color: 'var(--color-border)', fontSize: 12, textAlign: 'center' }}>Geen lanceringen</div>
            ) : ql.map(l => (
              <div key={l.id} style={{ padding: '14px 18px', borderBottom: '1px solid var(--color-border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                  <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-ink)' }}>{l.name}</p>
                  <button onClick={() => removeLaunch(projectId, year, l.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-subtle)', padding: 2 }}><Trash2 size={12} /></button>
                </div>
                {/* Timeline bar */}
                <div style={{ display: 'flex', gap: 0, marginBottom: 10 }}>
                  {[
                    { label: `Pre-launch`, value: `${l.prelaunchWeeks}w`, flex: l.prelaunchWeeks * 7 },
                    { label: `Waitlist`, value: `${l.waitlistDays}d`, flex: l.waitlistDays },
                    { label: `Live`, value: `${l.liveDays}d`, flex: l.liveDays },
                    { label: `Follow-up`, value: `${l.followupDays}d`, flex: l.followupDays },
                  ].map((phase, i) => (
                    <div key={i} style={{ flex: phase.flex, minWidth: 36, padding: '5px 8px', background: i === 2 ? ACCENT : i === 1 ? 'rgba(76,100,129,0.18)' : 'var(--color-surface)', borderRadius: i === 0 ? '6px 0 0 6px' : i === 3 ? '0 6px 6px 0' : 0, borderRight: i < 3 ? '1px solid var(--color-border)' : 'none' }}>
                      <p style={{ fontSize: 8, fontFamily: 'var(--font-mono)', color: i === 2 ? '#fff' : 'var(--color-muted)', letterSpacing: '0.08em', marginBottom: 2 }}>{phase.label}</p>
                      <p style={{ fontSize: 11, fontWeight: 700, color: i === 2 ? '#fff' : 'var(--color-ink)' }}>{phase.value}</p>
                    </div>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: 16 }}>
                  {l.revenueGoal && <p style={{ fontSize: 11, color: ACCENT, fontFamily: 'var(--font-mono)', fontWeight: 700 }}>€{l.revenueGoal.toLocaleString('nl-BE')}</p>}
                  {l.notes && <p style={{ fontSize: 11, color: 'var(--color-subtle)' }}>{l.notes}</p>}
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Events section ───────────────────────────────────────────────
function EventsSection({ projectId, year }: { projectId: string; year: number }) {
  const { plans, addEvent, removeEvent } = useMarketingStrategyStore()
  const events = plans[projectId]?.[year]?.events ?? []
  const [adding, setAdding] = useState(false)
  const [form, setForm] = useState<Omit<MarketingEvent, 'id'>>({
    name: '', date: '', location: '', type: '', goal: '',
    leadGoal: null, revenueGoal: null, contentOpportunities: '',
    needsAftermovie: false, needsPhotographer: false, hasSponsor: false,
  })

  function submit() {
    if (!form.name.trim()) return
    addEvent(projectId, year, form)
    setAdding(false)
    setForm({ name: '', date: '', location: '', type: '', goal: '', leadGoal: null, revenueGoal: null, contentOpportunities: '', needsAftermovie: false, needsPhotographer: false, hasSponsor: false })
  }

  const sorted = [...events].sort((a, b) => a.date.localeCompare(b.date))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button onClick={() => setAdding(a => !a)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 9, border: `1.5px solid ${adding ? ACCENT : 'var(--color-border)'}`, background: adding ? `rgba(76,100,129,0.08)` : 'transparent', color: adding ? ACCENT : 'var(--color-muted)', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>
          <Plus size={13} /> Event toevoegen
        </button>
      </div>

      {adding && (
        <div className="card" style={{ padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
            {[{ key: 'name', label: 'Naam', ph: 'Bora Open Day' }, { key: 'date', label: 'Datum', ph: '2026-03-15', type: 'date' }, { key: 'location', label: 'Locatie', ph: 'Bora HQ' }].map(({ key, label, ph, type }) => (
              <div key={key}>
                <label style={{ fontSize: 10, fontWeight: 700, color: 'var(--color-muted)', display: 'block', marginBottom: 4, letterSpacing: '0.08em', textTransform: 'uppercase' }}>{label}</label>
                <input type={type ?? 'text'} style={inp} value={(form as any)[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} placeholder={ph} />
              </div>
            ))}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {[{ key: 'type', label: 'Type', ph: 'Open dag / Workshop / Lancering' }, { key: 'goal', label: 'Doel', ph: 'Brand awareness + leads' }].map(({ key, label, ph }) => (
              <div key={key}>
                <label style={{ fontSize: 10, fontWeight: 700, color: 'var(--color-muted)', display: 'block', marginBottom: 4, letterSpacing: '0.08em', textTransform: 'uppercase' }}>{label}</label>
                <input style={inp} value={(form as any)[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} placeholder={ph} />
              </div>
            ))}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ fontSize: 10, fontWeight: 700, color: 'var(--color-muted)', display: 'block', marginBottom: 4, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Content kansen</label>
              <input style={inp} value={form.contentOpportunities} onChange={e => setForm(f => ({ ...f, contentOpportunities: e.target.value }))} placeholder="Reels, interviews, BTS..." />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingTop: 20 }}>
              {[{ key: 'needsAftermovie', label: 'Aftermovie nodig' }, { key: 'needsPhotographer', label: 'Fotograaf nodig' }, { key: 'hasSponsor', label: 'Sponsor aanwezig' }].map(({ key, label }) => (
                <label key={key} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 12 }}>
                  <input type="checkbox" checked={(form as any)[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.checked }))} />
                  <span style={{ color: 'var(--color-muted)' }}>{label}</span>
                </label>
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button onClick={() => setAdding(false)} style={{ padding: '8px 16px', borderRadius: 9, border: '1px solid var(--color-border)', background: 'transparent', color: 'var(--color-muted)', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>Annuleer</button>
            <button onClick={submit} disabled={!form.name.trim()} style={{ padding: '8px 20px', borderRadius: 9, border: 'none', background: form.name.trim() ? ACCENT : 'var(--color-border)', color: form.name.trim() ? '#fff' : 'var(--color-muted)', fontSize: 12, fontWeight: 700, cursor: form.name.trim() ? 'pointer' : 'default', fontFamily: 'inherit' }}>Toevoegen</button>
          </div>
        </div>
      )}

      {sorted.length === 0 && !adding && (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--color-subtle)' }}>
          <p style={{ fontSize: 14 }}>Nog geen events. Voeg er een toe.</p>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {sorted.map(e => (
          <div key={e.id} className="card" style={{ padding: '18px 22px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
              <div>
                <p style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-ink)', letterSpacing: '-0.01em' }}>{e.name}</p>
                <div style={{ display: 'flex', gap: 12, marginTop: 4 }}>
                  {e.date && <span style={{ fontSize: 11, color: 'var(--color-subtle)', fontFamily: 'var(--font-mono)' }}>{e.date}</span>}
                  {e.location && <span style={{ fontSize: 11, color: 'var(--color-subtle)' }}>{e.location}</span>}
                  {e.type && <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 99, background: 'rgba(76,100,129,0.10)', color: ACCENT }}>{e.type}</span>}
                </div>
              </div>
              <button onClick={() => removeEvent(projectId, year, e.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-subtle)', padding: 4 }}><Trash2 size={13} /></button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
              {e.goal && <div><p style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', color: 'var(--color-subtle)', fontFamily: 'var(--font-mono)', marginBottom: 2 }}>DOEL</p><p style={{ fontSize: 12 }}>{e.goal}</p></div>}
              {e.contentOpportunities && <div><p style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', color: 'var(--color-subtle)', fontFamily: 'var(--font-mono)', marginBottom: 2 }}>CONTENT</p><p style={{ fontSize: 12 }}>{e.contentOpportunities}</p></div>}
              <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', flexWrap: 'wrap', paddingTop: 2 }}>
                {e.needsAftermovie && <span style={{ fontSize: 9, padding: '2px 7px', borderRadius: 99, background: 'var(--color-surface)', border: '1px solid var(--color-border)', color: 'var(--color-muted)' }}>Aftermovie</span>}
                {e.needsPhotographer && <span style={{ fontSize: 9, padding: '2px 7px', borderRadius: 99, background: 'var(--color-surface)', border: '1px solid var(--color-border)', color: 'var(--color-muted)' }}>Fotograaf</span>}
                {e.hasSponsor && <span style={{ fontSize: 9, padding: '2px 7px', borderRadius: 99, background: 'rgba(76,100,129,0.10)', border: `1px solid ${ACCENT}`, color: ACCENT }}>Sponsor</span>}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── KPI section ──────────────────────────────────────────────────
function KpiSection({ projectId, year }: { projectId: string; year: number }) {
  const { plans, setMonthData } = useMarketingStrategyStore()
  const yearPlan = plans[projectId]?.[year]

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
        <thead>
          <tr>
            <th style={{ textAlign: 'left', padding: '8px 14px', fontWeight: 700, fontSize: 9, letterSpacing: '0.12em', color: 'var(--color-subtle)', fontFamily: 'var(--font-mono)', borderBottom: '1px solid var(--color-border)', whiteSpace: 'nowrap' }}>KPI</th>
            {MONTHS_NL.map(m => (
              <th key={m} style={{ textAlign: 'center', padding: '8px 4px', fontWeight: 700, fontSize: 9, letterSpacing: '0.10em', color: 'var(--color-subtle)', fontFamily: 'var(--font-mono)', borderBottom: '1px solid var(--color-border)', minWidth: 70 }}>{m}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {KPI_KEYS.map(kpi => (
            <tr key={kpi}>
              <td style={{ padding: '8px 14px', fontWeight: 600, color: 'var(--color-ink)', fontSize: 12, borderBottom: '1px solid var(--color-border)', whiteSpace: 'nowrap' }}>{KPI_LABELS[kpi]}</td>
              {(Array.from({ length: 12 }, (_, i) => (i + 1) as Month)).map(m => {
                const val = yearPlan?.months[m]?.kpis?.[kpi]
                return (
                  <td key={m} style={{ textAlign: 'center', padding: '4px', borderBottom: '1px solid var(--color-border)' }}>
                    <input
                      type="number"
                      value={val ?? ''}
                      onChange={e => {
                        const existing = yearPlan?.months[m]?.kpis ?? {}
                        setMonthData(projectId, year, m, { kpis: { ...existing, [kpi]: e.target.value ? Number(e.target.value) : undefined } })
                      }}
                      style={{ width: 62, padding: '4px 6px', borderRadius: 14, border: '1px solid var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-ink)', fontSize: 11, textAlign: 'right', fontFamily: 'var(--font-mono)', outline: 'none' }}
                    />
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ── AI section ───────────────────────────────────────────────────
function AiSection({ projectId, year, projectName }: { projectId: string; year: number; projectName: string }) {
  const { plans, setYearPlan, setBrief } = useMarketingStrategyStore()
  const yearPlan = plans[projectId]?.[year]
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [expandedMonth, setExpandedMonth] = useState<Month | null>(1)
  const brief = yearPlan?.brief ?? ''

  async function generate() {
    if (!brief.trim()) { setError('Vul eerst een projectbeschrijving in.'); return }
    setLoading(true); setError(null)
    try {
      const res = await fetch('/.netlify/functions/anthropic', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-6',
          max_tokens: 6000,
          system: `Je bent een senior CMO en growth strategist. Genereer een volledige marketingstrategie in JSON. Return ALLEEN geldig JSON, geen markdown, geen uitleg.`,
          messages: [{
            role: 'user',
            content: `PROJECTNAAM: ${projectName}
JAAR: ${year}
BESCHRIJVING: ${brief}

Genereer een volledige marketingstrategie. Return ALLEEN dit JSON-formaat:
{
  "months": {
    "1": {
      "primaryFocus": "string",
      "campaign": "string",
      "launch": "string",
      "events": "string",
      "contentTheme": "string",
      "primaryAudience": "string",
      "mainKpi": "string",
      "funnelFocus": "awareness|interest|lead|nurture|sales|retention|referral",
      "heroTopic": "string",
      "supportingTopics": ["string","string","string"],
      "cta": "string",
      "leadMagnet": "string",
      "offer": "string",
      "channels": { "Instagram": "active|campaign|maintenance|off", "LinkedIn": "active|campaign|maintenance|off", "TikTok": "active|campaign|maintenance|off", "YouTube": "active|campaign|maintenance|off", "Pinterest": "active|campaign|maintenance|off", "Podcast": "active|campaign|maintenance|off", "Nieuwsbrief": "active|campaign|maintenance|off", "PR": "active|campaign|maintenance|off", "Ads": "active|campaign|maintenance|off", "Partners": "active|campaign|maintenance|off", "Community": "active|campaign|maintenance|off", "Website/SEO": "active|campaign|maintenance|off" },
      "aiSuggestions": ["campagne-idee", "contentreeks", "reel-idee", "nieuwsbrief-idee", "partnership-idee", "seo-artikel", "event-idee"]
    },
    "2": { ... },
    "3": { ... },
    "4": { ... },
    "5": { ... },
    "6": { ... },
    "7": { ... },
    "8": { ... },
    "9": { ... },
    "10": { ... },
    "11": { ... },
    "12": { ... }
  }
}

Regels:
- Spread logisch: Q1 leadgen, Q2 groei, juli-aug community/maintenance, Q4 retention+upsell
- Geef elke maand 2-4 actieve kanalen, 1-2 campagne, rest onderhoud of off
- Maak suggesties specifiek voor de sector van het project
- Geen twee grote lanceringen in dezelfde maand`,
          }],
        }),
      })
      if (!res.ok) throw new Error(`API ${res.status}`)
      const data = await res.json()
      const text: string = data.content?.[0]?.text ?? ''
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      if (!jsonMatch) throw new Error('Geen JSON in respons')
      const result = JSON.parse(jsonMatch[0])

      // Merge months into store
      const months: Partial<Record<Month, Partial<MonthData>>> = {}
      for (let m = 1; m <= 12; m++) {
        if (result.months?.[m]) months[m as Month] = result.months[m]
      }
      setYearPlan(projectId, year, { months })
    } catch (e: any) {
      setError(e.message ?? 'Fout bij genereren')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Brief + generate */}
      <div className="card" style={{ padding: '20px 22px' }}>
        <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.10em', textTransform: 'uppercase', color: 'var(--color-subtle)', marginBottom: 8, fontFamily: 'var(--font-mono)' }}>Projectbeschrijving</p>
        <textarea
          value={brief}
          onChange={e => setBrief(projectId, year, e.target.value)}
          placeholder={`Beschrijf het project: wie is de doelgroep, wat is het aanbod, wat zijn de doelen voor ${year}? Hoe meer context, hoe beter de strategie.`}
          rows={4}
          style={{ ...inp, resize: 'vertical', marginBottom: 12 }}
        />
        {error && <p style={{ fontSize: 11, color: 'var(--color-muted)', marginBottom: 10 }}>{error}</p>}
        <button
          onClick={generate}
          disabled={loading}
          style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '10px 20px', borderRadius: 16, border: 'none', background: ACCENT, color: '#fff', fontSize: 13, fontWeight: 700, cursor: loading ? 'default' : 'pointer', fontFamily: 'inherit', opacity: loading ? 0.7 : 1, transition: 'opacity 150ms' }}
        >
          {loading
            ? <><RefreshCw size={13} style={{ animation: 'spin 1s linear infinite' }} /> Strategie genereren...</>
            : <><Sparkles size={13} /> {yearPlan?.lastGenerated ? 'Strategie opnieuw genereren' : 'Strategie genereren'}</>}
        </button>
        {yearPlan?.lastGenerated && (
          <p style={{ fontSize: 10, color: 'var(--color-subtle)', marginTop: 8, fontFamily: 'var(--font-mono)' }}>
            Gegenereerd op {new Date(yearPlan.lastGenerated).toLocaleDateString('nl-BE')}
          </p>
        )}
      </div>

      {/* AI suggestions per month */}
      {yearPlan?.months && Object.keys(yearPlan.months).some(m => (yearPlan.months[+m as Month]?.aiSuggestions ?? []).length > 0) && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--color-subtle)', fontFamily: 'var(--font-mono)' }}>Suggesties per maand</p>
          {(Array.from({ length: 12 }, (_, i) => (i + 1) as Month)).map(m => {
            const suggestions = yearPlan.months[m]?.aiSuggestions ?? []
            if (suggestions.length === 0) return null
            const isExp = expandedMonth === m
            return (
              <div key={m} className="card" style={{ overflow: 'hidden' }}>
                <div onClick={() => setExpandedMonth(isExp ? null : m)} style={{ padding: '13px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-ink)' }}>{MONTHS_FULL[m - 1]}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 10, color: 'var(--color-subtle)' }}>{suggestions.length} ideeën</span>
                    {isExp ? <ChevronUp size={14} color="var(--color-muted)" /> : <ChevronDown size={14} color="var(--color-muted)" />}
                  </div>
                </div>
                {isExp && (
                  <div style={{ padding: '0 18px 16px', display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {suggestions.map((s, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '8px 0', borderTop: '1px solid var(--color-border)' }}>
                        <span style={{ fontSize: 9, fontWeight: 700, color: ACCENT, fontFamily: 'var(--font-mono)', marginTop: 2, flexShrink: 0 }}>{String(i + 1).padStart(2, '0')}</span>
                        <p style={{ fontSize: 13, color: 'var(--color-ink)', lineHeight: 1.5 }}>{s}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ── Instagram URL widget ─────────────────────────────────────────
function InstagramUrlField({ projectId }: { projectId: string }) {
  const { projects, updateProject } = useProjectDataStore()
  const project = projects.find(p => p.id === projectId)
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(project?.instagramUrl ?? '')

  function save() {
    updateProject(projectId, { instagramUrl: draft.trim() || undefined })
    setEditing(false)
  }

  const handle = project?.instagramUrl
    ?.replace('https://www.instagram.com/', '')
    .replace('https://instagram.com/', '')
    .replace(/\/$/, '')

  if (editing) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <Link size={13} color={ACCENT} />
        <input
          autoFocus
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') save(); if (e.key === 'Escape') setEditing(false) }}
          placeholder="https://www.instagram.com/gebruikersnaam/"
          style={{ width: 280, padding: '5px 10px', borderRadius: 16, border: `1px solid ${ACCENT}`, background: 'var(--color-surface)', color: 'var(--color-ink)', fontSize: 12, fontFamily: 'inherit', outline: 'none' }}
        />
        <button onClick={save} style={{ padding: '5px 12px', borderRadius: 16, border: 'none', background: ACCENT, color: '#fff', fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>Opslaan</button>
        <button onClick={() => setEditing(false)} style={{ padding: '5px 10px', borderRadius: 16, border: '1px solid var(--color-border)', background: 'transparent', color: 'var(--color-muted)', fontSize: 11, cursor: 'pointer', fontFamily: 'inherit' }}>Annuleer</button>
      </div>
    )
  }

  if (project?.instagramUrl) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <Link size={13} color={ACCENT} />
        <a href={project.instagramUrl} target="_blank" rel="noreferrer" style={{ fontSize: 12, color: ACCENT, fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
          @{handle}
        </a>
        <button onClick={() => { setDraft(project.instagramUrl ?? ''); setEditing(true) }} style={{ fontSize: 10, color: 'var(--color-subtle)', background: 'none', border: 'none', cursor: 'pointer', padding: '2px 4px', fontFamily: 'inherit' }}>wijzig</button>
      </div>
    )
  }

  return (
    <button
      onClick={() => setEditing(true)}
      style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 16, border: '1px dashed var(--color-border)', background: 'transparent', color: 'var(--color-subtle)', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 150ms' }}
    >
      <Link size={13} /> Instagram koppelen
    </button>
  )
}

// ── Main ─────────────────────────────────────────────────────────
export function MarketingStrategy({ projectId, projectName }: { projectId: string; projectName: string }) {
  const [year, setYear] = useState(2026)
  const [section, setSection] = useState('overview')

  return (
    <div>
      <style>{`@keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }`}</style>

      {/* Year + Instagram header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div style={{ display: 'flex', gap: 4 }}>
          {YEARS.map(y => (
            <button
              key={y}
              onClick={() => setYear(y)}
              style={{ padding: '6px 14px', borderRadius: 16, fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-mono)', border: `1.5px solid ${y === year ? ACCENT : 'var(--color-border)'}`, background: y === year ? `rgba(76,100,129,0.10)` : 'transparent', color: y === year ? ACCENT : 'var(--color-muted)', transition: 'all 150ms' }}
            >
              {y}
            </button>
          ))}
        </div>
        <InstagramUrlField projectId={projectId} />
      </div>

      {/* Section tabs */}
      <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid var(--color-border)', marginBottom: 24 }}>
        {SECTION_TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setSection(tab.id)}
            style={{ padding: '9px 16px', background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600, fontFamily: 'inherit', color: section === tab.id ? 'var(--color-ink)' : 'var(--color-muted)', borderBottom: `2px solid ${section === tab.id ? ACCENT : 'transparent'}`, marginBottom: -1, transition: 'all 150ms', whiteSpace: 'nowrap' }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Section content */}
      {section === 'overview'  && <OverviewSection  projectId={projectId} year={year} />}
      {section === 'channels'  && <ChannelsSection  projectId={projectId} year={year} />}
      {section === 'launches'  && <LaunchesSection  projectId={projectId} year={year} />}
      {section === 'events'    && <EventsSection    projectId={projectId} year={year} />}
      {section === 'kpis'      && <KpiSection        projectId={projectId} year={year} />}
      {section === 'ai'        && <AiSection         projectId={projectId} year={year} projectName={projectName} />}
    </div>
  )
}
