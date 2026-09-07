// Focus: the one screen that changes with her world. Same place in the navigation, different reading.
// Each world opens with the one thing that matters now, one pill, and the rest held under it.
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useContextStore } from './contextStore'
import { useRevenueStore } from '../../store/pf/revenueStore'
import { useSalesStore } from '../../store/pf/salesStore'
import { useContentStore, FORMAT_LABEL, STATUS_LABEL, sumMetric } from '../../store/pf/contentStore'
import type { ContentFormat, Idea } from '../../store/pf/contentStore'
import { useRitualStore, PHASE_LABEL, PHASE_HINT } from '../../store/pf/ritualStore'
import { useWeekStore } from '../../store/pf/weekStore'
import { monthKey, todayStr, fmtDay, weekKey, weekDatesFromKey, dayIndex, DAY_SHORT } from '../../lib/pf/week'
import { DepthBar } from '../DepthBar'
import { CircleCheck } from '../Aperture'
import { Sheet } from '../Sheet'
import { Quarter } from '../Goals'
import { Sales } from '../Sales'
import { useDraft } from './contextStore'

const fmtInt = (n: number) => new Intl.NumberFormat('en-IE', { maximumFractionDigits: 0 }).format(Math.round(n))
const stop = (s: string) => (/[.!?]$/.test(s) ? s : `${s}.`)
const FORMATS = Object.keys(FORMAT_LABEL) as ContentFormat[]

export function Focus() {
  const context = useContextStore(s => s.context)
  if (context === 'brand') return <BrandFocus />
  if (context === 'clients') return <Sales focus />
  if (context === 'life') return <LifeFocus />
  return <BusinessFocus />
}

// ── Business: the month in one line, the gap as a bar, the goals under it, one pill to log a sale ──

function BusinessFocus() {
  const rev = useRevenueStore()
  const sales = useSalesStore()
  const month = monthKey()
  const name = fmtDay(`${month}-01`, 'MMMM')
  const target = rev.monthTarget(month)
  const revenue = rev.monthRevenue(month)
  const inPlay = sales.pipelineValue()
  const gap = Math.max(0, target - revenue)
  const pct = target > 0 ? (revenue / target) * 100 : 0
  const [logging, setLogging] = useState(false)
  const [logged, setLogged] = useState<string | null>(null)

  const headline = target === 0 ? 'No target for this month yet.'
    : gap === 0 ? `${name} is met.`
    : `${fmtInt(gap)} eur to go in ${name}.`
  const lead = target === 0 ? 'Set one and this screen reads the gap.'
    : gap === 0 ? `${fmtInt(revenue)} eur logged. Everything from here is extra.`
    : inPlay > 0 ? `${fmtInt(revenue)} eur logged. ${fmtInt(inPlay)} eur in conversations.` : `${fmtInt(revenue)} eur logged.`

  return (
    <div className="pf-enter pf-stack-lg" style={{ gap: 44 }}>
      <header className="pf-stack" style={{ gap: 14 }}>
        <p className="pf-over">Focus · Business</p>
        <h1 className="pf-h1">{headline}</h1>
        <p className="pf-body">{lead}</p>
        {target > 0 && (
          <div style={{ marginTop: 6 }}>
            <span style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12 }}>
              <span className="pf-num pf-num--sm">{fmtInt(revenue)}<span className="pf-unit">/{fmtInt(target)} eur</span></span>
              <span className="pf-cap">{fmtInt(gap)} to go</span>
            </span>
            <DepthBar pct={pct} landed={gap === 0} style={{ marginTop: 6 }} />
          </div>
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: 22, flexWrap: 'wrap', marginTop: 10 }}>
          <button type="button" className="pf-btn pf-btn--primary" onClick={() => setLogging(true)}>Log a sale</button>
          {logged && <span className="pf-small pf-enter" role="status">{logged}</span>}
        </div>
      </header>

      <Quarter lanes={['business']} compact />

      <Sheet open={logging} onClose={() => setLogging(false)} title="A sale.">
        <LogSale onDone={msg => { setLogging(false); setLogged(msg) }} />
      </Sheet>
    </div>
  )
}

function LogSale({ onDone }: { onDone: (msg: string) => void }) {
  const { offers, logSale } = useRevenueStore()
  const [label, setLabel] = useState('')
  const [amount, setAmount] = useState('')
  const n = Number(amount.replace(/[^\d.]/g, ''))
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      {offers.length > 0 && (
        <div className="pf-fieldset">
          <span className="pf-cap pf-label">One tap</span>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {offers.map(o => (
              <button key={o.id} type="button" className="pf-chip" onClick={() => { if (logSale({ offerId: o.id, date: todayStr() })) onDone(`Logged. ${fmtInt(o.price)} eur.`) }}>
                {o.name}<span className="pf-unit">{fmtInt(o.price)} eur</span>
              </button>
            ))}
          </div>
        </div>
      )}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 120px', gap: 10 }}>
        <div className="pf-fieldset">
          <span className="pf-cap pf-label">Or something else</span>
          <input className="pf-input" value={label} onChange={e => setLabel(e.target.value)} placeholder="What sold" aria-label="What sold" />
        </div>
        <div className="pf-fieldset">
          <span className="pf-cap pf-label">Amount</span>
          <input className="pf-input pf-mono" value={amount} onChange={e => setAmount(e.target.value)} inputMode="numeric" placeholder="eur" aria-label="Amount in euro" />
        </div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button type="button" className="pf-btn pf-btn--primary" disabled={!(n > 0)} onClick={() => { if (logSale({ amount: n, label: label || 'Sale', date: todayStr() })) onDone(`Logged. ${fmtInt(n)} eur.`) }}>Log</button>
      </div>
    </div>
  )
}

// ── Brand: the next piece to make, one pill to plan one, one line to catch an idea, what worked ──

function BrandFocus() {
  const { ideas, posts, addIdea, deleteIdea, planIdea, addPost, updatePost } = useContentStore()
  const today = todayStr()
  const key = weekKey()
  const dates = weekDatesFromKey(key)
  const month = monthKey()
  const [draft, setDraft] = useDraft('brand-idea')
  const [planning, setPlanning] = useState<{ idea?: Idea } | null>(null)

  const weekPosts = posts.filter(p => dates.includes(p.date)).sort((a, b) => a.date.localeCompare(b.date))
  const todayPost = weekPosts.find(p => p.date === today && p.status !== 'posted')
  const upcoming = weekPosts.find(p => p.date > today && p.status !== 'posted') ?? posts.filter(p => p.date > today && p.status !== 'posted').sort((a, b) => a.date.localeCompare(b.date))[0]
  const postedMonth = posts.filter(p => p.date.startsWith(month) && p.status === 'posted')
  const withNumbers = postedMonth.filter(p => p.metrics && (p.metrics.reach || p.metrics.saves))
  const top = [...withNumbers].sort((a, b) => (b.metrics?.saves ?? 0) - (a.metrics?.saves ?? 0)).slice(0, 3)
  const saves = sumMetric(postedMonth, 'saves')

  const headline = todayPost ? stop(todayPost.title)
    : upcoming ? `${upcoming.title} on ${fmtDay(upcoming.date, 'EEEE')}.`
    : weekPosts.length ? 'Nothing left to post this week.' : 'Nothing planned this week.'
  const lead = todayPost ? `Today, ${FORMAT_LABEL[todayPost.format].toLowerCase()}. Add the numbers after it goes out.`
    : top[0] ? `Best this month: ${top[0].title}, ${fmtInt(top[0].metrics?.saves ?? 0)} saves.`
    : postedMonth.length ? `${postedMonth.length} posted this month${saves ? `, ${fmtInt(saves)} saves` : ''}.` : 'One idea in one line is enough to start.'

  function catchIdea() { if (draft.trim() && addIdea(draft.trim())) setDraft('') }

  return (
    <div className="pf-enter pf-stack-lg" style={{ gap: 44 }}>
      <header className="pf-stack" style={{ gap: 14 }}>
        <p className="pf-over">Focus · Brand</p>
        <h1 className="pf-h1">{headline}</h1>
        <p className="pf-body">{lead}</p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 22, flexWrap: 'wrap', marginTop: 10 }}>
          {todayPost
            ? <button type="button" className="pf-btn pf-btn--primary" onClick={() => updatePost(todayPost.id, { status: 'posted' })}>Posted</button>
            : <button type="button" className="pf-btn pf-btn--primary" onClick={() => setPlanning({})}>Plan a post</button>}
          {todayPost && <button type="button" className="pf-btn pf-btn--tertiary" onClick={() => setPlanning({})}>Plan another</button>}
        </div>
      </header>

      <div className="pf-fieldset">
        <span className="pf-cap pf-label">Catch an idea</span>
        <input className="pf-inline" value={draft} onChange={e => setDraft(e.target.value)} onKeyDown={e => e.key === 'Enter' && catchIdea()} onBlur={catchIdea}
          placeholder="One line. Enter keeps it." aria-label="Catch an idea" />
      </div>

      <section aria-label="This week">
        <span className="pf-cap pf-label">This week</span>
        <div className="pf-rows">
          {weekPosts.map(p => {
            const plane = p.date === today ? '' : p.date < today ? 'pf-soft' : 'pf-dim'
            return (
              <div key={p.id} className={`pf-row pf-row--big ${plane} ${p.status === 'posted' ? 'pf-faded' : ''}`} style={{ gridTemplateColumns: '44px minmax(0,1fr) auto' }}>
                <span className="pf-num pf-num--sm" style={{ color: p.date === today ? 'var(--text)' : 'var(--text-2)' }}>{DAY_SHORT[dayIndex(p.date)]}</span>
                <span style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
                  <span style={{ fontSize: 17, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.title}</span>
                  <span className="pf-cap">{FORMAT_LABEL[p.format]} · {STATUS_LABEL[p.status]}</span>
                </span>
                <CircleCheck checked={p.status === 'posted'} onChange={() => updatePost(p.id, { status: p.status === 'posted' ? 'drafted' : 'posted' })} label={`${p.title} posted`} />
              </div>
            )
          })}
          {weekPosts.length === 0 && <p className="pf-small">Nothing placed in the week yet.</p>}
        </div>
      </section>

      {ideas.length > 0 && (
        <section aria-label="Ideas">
          <span className="pf-cap pf-label">Ideas</span>
          <div className="pf-rows">
            {ideas.map(i => (
              <div key={i.id} className="pf-row" style={{ gridTemplateColumns: 'minmax(0,1fr) auto auto', padding: '12px 0' }}>
                <span style={{ fontSize: 16, minWidth: 0 }}>{i.title}</span>
                <button type="button" className="pf-btn pf-btn--tertiary" style={{ padding: '6px 4px' }} onClick={() => setPlanning({ idea: i })}>Plan</button>
                <button type="button" className="pf-btn pf-btn--tertiary" style={{ padding: '6px 0 6px 4px', color: 'var(--text-3)' }} onClick={() => deleteIdea(i.id)} aria-label={`Let go of ${i.title}`}>Let go</button>
              </div>
            ))}
          </div>
        </section>
      )}

      {top.length > 0 && (
        <section aria-label="What worked">
          <span className="pf-cap pf-label">What worked this month</span>
          <div className="pf-rows">
            {top.map(p => (
              <div key={p.id} className="pf-row" style={{ gridTemplateColumns: 'minmax(0,1fr) auto', padding: '12px 0' }}>
                <span style={{ fontSize: 16, minWidth: 0 }}>{p.title}<span className="pf-cap" style={{ marginLeft: 8 }}>{FORMAT_LABEL[p.format]}</span></span>
                <span className="pf-num pf-num--sm">{fmtInt(p.metrics?.saves ?? 0)}<span className="pf-unit">saves</span></span>
              </div>
            ))}
          </div>
        </section>
      )}

      <p className="pf-small"><Link to="/content" className="pf-btn pf-btn--tertiary" style={{ display: 'inline', padding: 0, minHeight: 0 }}>The full plan, with numbers</Link></p>

      {planning && (
        <Sheet open onClose={() => setPlanning(null)} title="A post.">
          <PlanPost idea={planning.idea} onDone={() => setPlanning(null)}
            onSave={(title, date, format) => {
              if (planning.idea) planIdea(planning.idea.id, date, format)
              else addPost({ title, date, format })
              setPlanning(null)
            }} />
        </Sheet>
      )}
    </div>
  )
}

function PlanPost({ idea, onSave, onDone }: { idea?: Idea; onSave: (title: string, date: string, format: ContentFormat) => void; onDone: () => void }) {
  const [title, setTitle] = useState(idea?.title ?? '')
  const [date, setDate] = useState(todayStr())
  const [format, setFormat] = useState<ContentFormat>(idea?.format ?? 'post')
  const dates = weekDatesFromKey(weekKey())
  return (
    <div className="pf-fields" style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div className="pf-fieldset">
        <span className="pf-cap pf-label">What</span>
        <input className="pf-input" value={title} onChange={e => setTitle(e.target.value)} placeholder="The piece, in one line" aria-label="Title" autoFocus={!idea} />
      </div>
      <div className="pf-fieldset">
        <span className="pf-cap pf-label">When</span>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
          {dates.map((d, i) => <button key={d} type="button" className="pf-day" aria-pressed={date === d} aria-label={fmtDay(d, 'EEEE d MMMM')} onClick={() => setDate(d)}>{DAY_SHORT[i].slice(0, 2)}</button>)}
          <input className="pf-input pf-mono" type="date" value={date} onChange={e => setDate(e.target.value)} aria-label="Date" style={{ padding: '6px 10px', width: 'auto', minHeight: 36, fontSize: 13 }} />
        </div>
      </div>
      <div className="pf-fieldset">
        <span className="pf-cap pf-label">Format</span>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {FORMATS.map(f => <button key={f} type="button" className="pf-chip" aria-pressed={format === f} onClick={() => setFormat(f)}>{FORMAT_LABEL[f]}</button>)}
        </div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
        <button type="button" className="pf-btn pf-btn--tertiary" onClick={onDone}>Not now</button>
        <button type="button" className="pf-btn pf-btn--primary" disabled={!title.trim()} onClick={() => onSave(title.trim(), date, format)}>Place it</button>
      </div>
    </div>
  )
}

// ── Life: the phase she is in, the habit for today, the habits of the week, the life goals ──

function LifeFocus() {
  const rituals = useRitualStore(s => s.rituals)
  const logs = useRitualStore(s => s.logs)
  const toggleLog = useRitualStore(s => s.toggleLog)
  const phaseOn = useRitualStore(s => s.phaseOn)
  const cycleStart = useRitualStore(s => s.cycleStart)
  const week = useWeekStore(s => s.weeks[weekKey()])
  const today = todayStr()
  const dates = weekDatesFromKey(weekKey())
  const todayIdx = dayIndex(today)
  const phase = phaseOn(today)

  const rows = rituals.map(r => {
    const planned = week?.ritualDays[r.id] ?? r.preferredDays
    return { r, planned, count: dates.filter(d => (logs[d] ?? []).includes(r.id)).length, doneToday: (logs[today] ?? []).includes(r.id), todayPlanned: planned.includes(todayIdx) }
  })
  const dueToday = rows.filter(x => x.todayPlanned && !x.doneToday)
  const first = dueToday[0]
  const kept = rows.reduce((a, x) => a + Math.min(x.count, x.r.timesPerWeek), 0)
  const total = rows.reduce((a, x) => a + x.r.timesPerWeek, 0)

  const headline = first ? `${first.r.name} today.`
    : rituals.length === 0 ? 'Nothing protected yet.'
    : dueToday.length === 0 && rows.some(x => x.todayPlanned) ? 'Today is kept.'
    : 'Nothing planned today. That is allowed.'
  const lead = phase ? `${PHASE_LABEL[phase]}. ${PHASE_HINT[phase]}`
    : total > 0 ? `${kept} of ${total} this week.` : 'Up to five habits. The week is drafted around them.'

  return (
    <div className="pf-enter pf-stack-lg" style={{ gap: 44 }}>
      <header className="pf-stack" style={{ gap: 14 }}>
        <p className="pf-over">Focus · Life</p>
        <h1 className="pf-h1">{headline}</h1>
        <p className="pf-body">{lead}</p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 22, flexWrap: 'wrap', marginTop: 10 }}>
          {first
            ? <button type="button" className="pf-btn pf-btn--primary" onClick={() => toggleLog(first.r.id, today)}>Done</button>
            : rituals.length === 0 && <Link to="/rituals" className="pf-btn pf-btn--primary">Add a habit</Link>}
          {rituals.length > 0 && <Link to="/rituals" className="pf-btn pf-btn--tertiary">{cycleStart ? 'Habits and cycle' : 'Habits'}</Link>}
        </div>
      </header>

      {rituals.length > 0 && (
        <section aria-label="This week">
          <span className="pf-cap pf-label">This week</span>
          <div className="pf-rows">
            {rows.map(({ r, planned, count, doneToday, todayPlanned }) => (
              <div key={r.id} className={`pf-row pf-row--big ${!todayPlanned && !doneToday ? 'pf-dim' : ''} ${doneToday ? 'pf-faded' : ''}`} style={{ gridTemplateColumns: 'auto minmax(0,1fr) auto' }}>
                <CircleCheck checked={doneToday} onChange={() => toggleLog(r.id, today)} label={`${r.name} today`} />
                <span style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 0 }}>
                  <span style={{ fontSize: 17 }}>{r.name}</span>
                  <span style={{ display: 'flex', gap: 6 }} aria-hidden="true">
                    {dates.map((d, i) => {
                      const on = (logs[d] ?? []).includes(r.id)
                      const plan = planned.includes(i)
                      return <span key={d} style={{ width: 8, height: 8, borderRadius: '50%', background: on ? 'var(--depth-3)' : 'transparent', border: on ? '1px solid var(--depth-3)' : plan ? '1px solid var(--text-3)' : '1px dotted var(--border)', boxShadow: d === today ? '0 0 0 2px var(--ground), 0 0 0 3px var(--text-3)' : undefined }} />
                    })}
                  </span>
                </span>
                <span className="pf-num pf-num--sm">{count}<span className="pf-unit">/{r.timesPerWeek}</span></span>
              </div>
            ))}
          </div>
        </section>
      )}

      <Quarter lanes={['life']} compact />
    </div>
  )
}
