// Content: catch the idea, place it in the week, add the numbers after. One glance says what worked.
import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useContentStore, FORMAT_LABEL, PLATFORM_LABEL, STATUS_LABEL, sumMetric } from '../store/pf/contentStore'
import type { Post, Idea, ContentFormat, Platform, PostStatus, Metrics } from '../store/pf/contentStore'
import { Sheet } from './Sheet'
import { weekKey, prevWeekKey, nextWeekKey, weekNumber, weekLabel, weekDatesFromKey, todayStr, fmtDay, DAY_SHORT, monthKey } from '../lib/pf/week'

const FORMATS = Object.keys(FORMAT_LABEL) as ContentFormat[]
const PLATFORMS = Object.keys(PLATFORM_LABEL) as Platform[]
const STATUSES = Object.keys(STATUS_LABEL) as PostStatus[]

function fmt(n: number) { return new Intl.NumberFormat('en-IE', { maximumFractionDigits: 0 }).format(n) }

export function Content() {
  const { ideas, posts, addIdea, deleteIdea, planIdea, addPost, updatePost, deletePost, setMetrics } = useContentStore()
  const [key, setKey] = useState(weekKey())
  const [ideaDraft, setIdeaDraft] = useState('')
  const [editing, setEditing] = useState<Post | null>(null)
  const [adding, setAdding] = useState<{ date: string; idea?: Idea } | null>(null)
  const dates = weekDatesFromKey(key)
  const today = todayStr()
  const month = monthKey()
  const monthStart = `${month}-01`
  const monthEnd = `${month}-31`

  const monthPosts = posts.filter(p => p.date >= monthStart && p.date <= monthEnd)
  const posted = monthPosts.filter(p => p.status === 'posted')
  const reach = sumMetric(posted, 'reach')
  const saves = sumMetric(posted, 'saves')
  const withNumbers = posted.filter(p => p.metrics && (p.metrics.reach || p.metrics.saves))
  const top = [...withNumbers].sort((a, b) => (b.metrics?.saves ?? 0) - (a.metrics?.saves ?? 0)).slice(0, 3)
  const weekPosts = posts.filter(p => dates.includes(p.date))

  const headline = posted.length === 0
    ? (monthPosts.length ? `${monthPosts.length} planned. Nothing posted yet.` : 'Nothing planned yet.')
    : saves > 0 ? `${posted.length} posted. ${fmt(saves)} saves.` : `${posted.length} posted this month.`

  function catchIdea() { if (addIdea(ideaDraft)) setIdeaDraft('') }

  return (
    <div className="pf-stack-lg">
      <div>
        <p className="pf-over">Content · {fmtDay(today, 'MMMM')}</p>
        <h1 className="pf-h2" style={{ marginTop: 12 }}>{headline}</h1>
      </div>

      {/* at a glance */}
      <section>
        <div style={{ display: 'flex', gap: 'clamp(24px, 6vw, 48px)', flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <Stat label="Posted" value={posted.length} unit="this month" />
          <Stat label="Reach" value={reach} unit="reach" muted={reach === 0} />
          <Stat label="Saves" value={saves} unit="saves" muted={saves === 0} />
        </div>
        <BubbleField posts={withNumbers} />
        {top.length > 0 && (
          <div style={{ marginTop: 24 }}>
            <span className="pf-cap pf-label">What worked</span>
            <div className="pf-rows">
              {top.map(p => (
                <button key={p.id} type="button" className="pf-row pf-row--press" style={{ gridTemplateColumns: 'minmax(0,1fr) auto auto', background: 'none', border: 0, borderBottom: '1px dotted var(--border)', padding: '12px 0', font: 'inherit', color: 'inherit', textAlign: 'left', cursor: 'pointer' }} onClick={() => setEditing(p)}>
                  <span style={{ fontSize: 15 }}>{p.title}<span className="pf-cap" style={{ marginLeft: 8 }}>{FORMAT_LABEL[p.format]}</span></span>
                  <span className="pf-mono pf-cap">{fmt(p.metrics?.reach ?? 0)} reach</span>
                  <span className="pf-mono">{fmt(p.metrics?.saves ?? 0)}<span className="pf-unit">saves</span></span>
                </button>
              ))}
            </div>
          </div>
        )}
        {posted.length > 0 && withNumbers.length === 0 && <p className="pf-small" style={{ marginTop: 16 }}>Add the numbers to a posted piece and this reads back what worked.</p>}
      </section>

      {/* the week */}
      <section>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
            <span className="pf-h4">{weekLabel(key)}.</span>
            <span className="pf-cap pf-mono">week {weekNumber(key)}</span>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <button type="button" className="pf-chev" aria-label="Previous week" onClick={() => setKey(prevWeekKey(key))}><ChevronLeft size={14} strokeWidth={1.5} /></button>
            <button type="button" className="pf-chev" aria-label="Next week" onClick={() => setKey(nextWeekKey(key))}><ChevronRight size={14} strokeWidth={1.5} /></button>
          </div>
        </div>
        <div className="pf-content-week">
          {dates.map((d, i) => {
            const items = weekPosts.filter(p => p.date === d)
            const isToday = d === today
            return (
              <div key={d} className={`pf-content-day ${isToday ? 'is-today' : ''}`}>
                <button type="button" className="pf-content-day__head" onClick={() => setAdding({ date: d })} aria-label={`Plan a post on ${fmtDay(d, 'EEEE d MMMM')}`}>
                  <span style={{ fontWeight: isToday ? 500 : 400 }}>{DAY_SHORT[i]}</span>
                  <span className="pf-mono pf-cap">{fmtDay(d, 'd')}</span>
                </button>
                {items.map(p => (
                  <button key={p.id} type="button" className={`pf-content-post ${p.status === 'posted' ? 'pf-faded' : ''}`} onClick={() => setEditing(p)}>
                    <span className="pf-cap" style={{ color: p.status === 'posted' ? 'var(--text-brand)' : 'var(--text-3)' }}>{p.status === 'posted' ? 'Posted' : FORMAT_LABEL[p.format]}</span>
                    <span style={{ fontSize: 14, lineHeight: 1.35 }}>{p.title}</span>
                  </button>
                ))}
              </div>
            )
          })}
        </div>
        <div style={{ marginTop: 18 }}>
          <button type="button" className="pf-btn pf-btn--primary" onClick={() => setAdding({ date: dates.includes(today) ? today : dates[0] })}>Plan a post</button>
        </div>
      </section>

      {/* ideas */}
      <section className="pf-narrow">
        <span className="pf-cap pf-label">Ideas</span>
        <input className="pf-inline" value={ideaDraft} onChange={e => setIdeaDraft(e.target.value)} onKeyDown={e => e.key === 'Enter' && catchIdea()} onBlur={catchIdea}
          placeholder="One idea, before it goes" aria-label="Catch an idea" style={{ fontSize: 16, padding: '10px 0', marginBottom: 6 }} />
        {ideas.length === 0 ? (
          <p className="pf-small" style={{ marginTop: 14 }}>Nothing yet. Ideas caught here wait until you place them in a week.</p>
        ) : (
          <div className="pf-rows">
            {ideas.map(i => (
              <div key={i.id} className="pf-row" style={{ gridTemplateColumns: 'minmax(0,1fr) auto auto' }}>
                <span style={{ fontSize: 15 }}>{i.title}{i.format && <span className="pf-cap" style={{ marginLeft: 8 }}>{FORMAT_LABEL[i.format]}</span>}</span>
                <button type="button" className="pf-chip" style={{ padding: '8px 14px' }} onClick={() => setAdding({ date: dates.includes(today) ? today : dates[0], idea: i })}>Place</button>
                <button type="button" className="pf-btn pf-btn--tertiary" style={{ padding: '6px 4px', fontSize: 13 }} onClick={() => deleteIdea(i.id)}>Let go</button>
              </div>
            ))}
          </div>
        )}
      </section>

      {adding && (
        <PostSheet
          initial={{ title: adding.idea?.title ?? '', date: adding.date, format: adding.idea?.format ?? 'post', platform: 'instagram', status: 'planned', note: adding.idea?.note }}
          title={adding.idea ? 'Place the idea' : 'Plan a post'}
          onClose={() => setAdding(null)}
          onSave={v => {
            if (adding.idea) planIdea(adding.idea.id, v.date, v.format, v.platform)
            else addPost({ title: v.title, date: v.date, format: v.format, platform: v.platform, hook: v.hook, note: v.note })
            setAdding(null)
          }} />
      )}
      {editing && (
        <PostSheet
          initial={editing}
          title={editing.status === 'posted' ? 'The numbers' : 'The post'}
          onClose={() => setEditing(null)}
          onSave={v => {
            updatePost(editing.id, { title: v.title, date: v.date, format: v.format, platform: v.platform, status: v.status, hook: v.hook, note: v.note })
            if (v.status === 'posted' && v.metrics) setMetrics(editing.id, v.metrics)
            setEditing(null)
          }}
          onRemove={() => { deletePost(editing.id); setEditing(null) }} />
      )}
    </div>
  )
}

function Stat({ label, value, unit, muted }: { label: string; value: number; unit: string; muted?: boolean }) {
  return (
    <div>
      <span className="pf-cap" style={{ display: 'block', marginBottom: 6 }}>{label}</span>
      <span className="pf-num pf-num--md" style={{ opacity: muted ? .4 : 1 }}>{fmt(value)}<span className="pf-unit">{unit}</span></span>
    </div>
  )
}

// Each circle is a real posted piece: size by reach, opacity by recency. Data, not decoration.
function BubbleField({ posts }: { posts: Post[] }) {
  if (posts.length < 2) return null
  const max = Math.max(...posts.map(p => p.metrics?.reach ?? 0), 1)
  const sorted = [...posts].sort((a, b) => a.date.localeCompare(b.date)).slice(-12)
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, height: 72, marginTop: 24 }} aria-label={`${sorted.length} posted pieces by reach`} role="img">
      {sorted.map((p, i) => {
        const size = 12 + Math.round(((p.metrics?.reach ?? 0) / max) * 40)
        const age = sorted.length - 1 - i
        return <span key={p.id} title={`${p.title}: ${fmt(p.metrics?.reach ?? 0)} reach`} style={{ width: size, height: size, borderRadius: '50%', background: 'var(--depth-2)', opacity: Math.max(.35, 1 - age * .08), filter: `blur(${Math.min(3, age * .4)}px)`, flexShrink: 0 }} />
      })}
    </div>
  )
}

type Draft = { title: string; date: string; format: ContentFormat; platform: Platform; status: PostStatus; hook?: string; note?: string; metrics?: Metrics }

function PostSheet({ initial, title, onClose, onSave, onRemove }: { initial: Draft; title: string; onClose: () => void; onSave: (v: Draft) => void; onRemove?: () => void }) {
  const [v, setV] = useState<Draft>({ ...initial, metrics: { ...initial.metrics } })
  const [confirm, setConfirm] = useState(false)
  const posted = v.status === 'posted'
  const m = (k: keyof Metrics) => (v.metrics?.[k] ?? '') as number | ''
  const setM = (k: keyof Metrics, raw: string) => setV({ ...v, metrics: { ...v.metrics, [k]: raw === '' ? undefined : Number(raw.replace(/[^\d]/g, '')) } })

  return (
    <Sheet open onClose={onClose} title={title}>
      <div className="pf-fields" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div className="pf-fieldset">
          <span className="pf-cap pf-label">Title</span>
          <input className="pf-input" value={v.title} onChange={e => setV({ ...v, title: e.target.value })} placeholder="What it is about" autoFocus={!initial.title} />
        </div>
        <div className="pf-fieldset">
          <span className="pf-cap pf-label">First line</span>
          <input className="pf-input" value={v.hook ?? ''} onChange={e => setV({ ...v, hook: e.target.value })} placeholder="The hook, if you have it" />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12 }}>
          <div className="pf-fieldset">
            <span className="pf-cap pf-label">Day</span>
            <input className="pf-input pf-mono" type="date" value={v.date} onChange={e => setV({ ...v, date: e.target.value })} aria-label="Day" style={{ padding: '10px 12px' }} />
          </div>
          <div className="pf-fieldset">
            <span className="pf-cap pf-label">Format</span>
            <select className="pf-select" value={v.format} onChange={e => setV({ ...v, format: e.target.value as ContentFormat })} style={{ padding: '10px 40px 10px 12px' }}>
              {FORMATS.map(f => <option key={f} value={f}>{FORMAT_LABEL[f]}</option>)}
            </select>
          </div>
          <div className="pf-fieldset">
            <span className="pf-cap pf-label">Where</span>
            <select className="pf-select" value={v.platform} onChange={e => setV({ ...v, platform: e.target.value as Platform })} style={{ padding: '10px 40px 10px 12px' }}>
              {PLATFORMS.map(p => <option key={p} value={p}>{PLATFORM_LABEL[p]}</option>)}
            </select>
          </div>
        </div>
        <div className="pf-fieldset">
          <span className="pf-cap pf-label">Status</span>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {STATUSES.map(s => <button key={s} type="button" className="pf-chip" aria-pressed={v.status === s} onClick={() => setV({ ...v, status: s })}>{STATUS_LABEL[s]}</button>)}
          </div>
        </div>
        {posted && (
          <div className="pf-fieldset">
            <span className="pf-cap pf-label">The numbers</span>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(96px, 1fr))', gap: 10 }}>
              {(['reach', 'saves', 'comments', 'follows', 'clicks'] as (keyof Metrics)[]).map(k => (
                <label key={k} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <span className="pf-cap">{k[0].toUpperCase() + k.slice(1)}</span>
                  <input className="pf-input pf-mono" inputMode="numeric" value={m(k)} onChange={e => setM(k, e.target.value)} placeholder="0" style={{ padding: '10px 12px' }} />
                </label>
              ))}
            </div>
          </div>
        )}
        <div className="pf-fieldset">
          <span className="pf-cap pf-label">Note</span>
          <textarea className="pf-textarea" value={v.note ?? ''} onChange={e => setV({ ...v, note: e.target.value })} placeholder="Anything the future you should know." style={{ minHeight: 64 }} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginTop: 6 }}>
          {onRemove ? (
            confirm
              ? <button type="button" className="pf-btn pf-btn--tertiary" onClick={onRemove}>Yes, remove it</button>
              : <button type="button" className="pf-btn pf-btn--tertiary" onClick={() => setConfirm(true)}>Remove</button>
          ) : <span />}
          <button type="button" className="pf-btn pf-btn--primary" disabled={!v.title.trim() || !v.date} onClick={() => onSave(v)}>{posted ? 'Save the numbers' : 'Save'}</button>
        </div>
      </div>
    </Sheet>
  )
}
