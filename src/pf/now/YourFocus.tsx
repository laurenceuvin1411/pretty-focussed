// Your focus: four chapters, one open at a time, the rest visible and soft. Who you are, what you want,
// what is getting in the way, your next 30 days. Tapping over typing: everything that can be prefilled is.
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useFocusStore, MAX_OUTCOMES } from '../../store/pf/focusStore'
import type { Obstacle } from '../../store/pf/focusStore'
import { useGoalStore, LANE_LABEL } from '../../store/pf/goalStore'
import type { Lane } from '../../store/pf/goalStore'
import { useRevenueStore } from '../../store/pf/revenueStore'
import { useRitualStore } from '../../store/pf/ritualStore'
import { useWeekStore } from '../../store/pf/weekStore'
import { useSalesStore } from '../../store/pf/salesStore'
import { yearInfo, monthKey, monthInfo, quarterInfo, weekKey, prevWeekKey, weekDatesFromKey } from '../../lib/pf/week'
import { DepthBar } from '../DepthBar'
import { useDraft } from './contextStore'

const CHAPTERS = [
  { n: '01', title: 'Who you are', q: 'Who you are.' },
  { n: '02', title: 'What you want', q: 'What you want.' },
  { n: '03', title: "What's getting in the way", q: 'What is getting in the way.' },
  { n: '04', title: 'Your next 30 days', q: 'Your next 30 days.' },
]
const VALUES = ['Freedom', 'Depth', 'Health', 'Calm', 'Craft', 'Money', 'Family', 'Play', 'Honesty', 'Leverage', 'Beauty', 'Rest']
const fmtInt = (n: number) => new Intl.NumberFormat('en-IE', { maximumFractionDigits: 0 }).format(Math.round(n))

export function YourFocus() {
  const [i, setI] = useState(0)
  return (
    <div className="pf-enter pf-stack-lg" style={{ gap: 36 }}>
      <header className="pf-stack" style={{ gap: 14 }}>
        <p className="pf-over">Your focus · {CHAPTERS[i].n} of 04</p>
        <h1 className="pf-h1">{CHAPTERS[i].q}</h1>
        <p className="pf-body">{LEAD[i]}</p>
      </header>

      <div className="pf-lb">
        {CHAPTERS.map((c, k) => {
          const state = k === i ? 'now' : k < i ? 'done' : 'ahead'
          return (
            <section key={c.n} className={`pf-lb__q ${state === 'now' ? 'is-now' : state === 'done' ? 'is-done' : 'is-ahead'}`} aria-current={state === 'now' ? 'step' : undefined}>
              {state === 'now' ? (
                <>
                  {k === 0 && <WhoYouAre />}
                  {k === 1 && <WhatYouWant />}
                  {k === 2 && <InTheWay />}
                  {k === 3 && <Next30 />}
                  <div style={{ display: 'flex', gap: 18, alignItems: 'center', marginTop: 26 }}>
                    {k < 3 && <button type="button" className="pf-btn pf-btn--primary" onClick={() => setI(k + 1)}>Next</button>}
                    {k > 0 && <button type="button" className="pf-btn pf-btn--tertiary" onClick={() => setI(k - 1)}>Back</button>}
                  </div>
                </>
              ) : (
                <button type="button" className="pf-lb__row" onClick={() => setI(k)} aria-label={`${c.n} ${c.title}`}>
                  <span className="pf-cap pf-mono">{c.n}</span>
                  <span style={{ fontSize: 16, fontWeight: 500 }}>{c.title}</span>
                  <span className="pf-cap">{state === 'done' ? 'change' : 'next'}</span>
                </button>
              )}
            </section>
          )
        })}
      </div>
    </div>
  )
}

const LEAD = [
  'One word, a few values, one line. Tap what is true.',
  'The year in three outcomes per lane, the quarter in six goals, the month in one number.',
  'Tap what stands between you and that. The week already knows some of it.',
  'One focus for the month, the goals that get it, the habits that hold it.',
]

// ── 01 · Who you are: the word, the values, one line ─────────────────

function WhoYouAre() {
  const y = yearInfo()
  const years = useFocusStore(s => s.years)
  const setYear = useFocusStore(s => s.setYear)
  const plan = years[y.key] ?? {}
  const values = plan.values ?? []
  const [word, setWord] = useDraft('focus-word')
  const [who, setWho] = useDraft('focus-who')
  function toggleValue(v: string) { setYear(y.key, { values: values.includes(v) ? values.filter(x => x !== v) : [...values, v].slice(0, 4) }) }
  function saveWord() { if (word.trim()) { setYear(y.key, { word: word.trim().replace(/\.$/, '') }); setWord('') } }
  function saveWho() { if (who.trim()) { setYear(y.key, { who: who.trim() }); setWho('') } }
  return (
    <div className="pf-stack-lg" style={{ gap: 26 }}>
      <div className="pf-fieldset">
        <span className="pf-cap pf-label">The word for {y.key}</span>
        {plan.word ? (
          <p className="pf-word" style={{ margin: 0, fontWeight: 500 }}>{plan.word}<button type="button" className="pf-btn pf-btn--tertiary" style={{ marginLeft: 16, fontSize: 14, verticalAlign: 'middle' }} onClick={() => setYear(y.key, { word: undefined })}>change</button></p>
        ) : (
          <input className="pf-input" value={word} onChange={e => setWord(e.target.value)} onBlur={saveWord} onKeyDown={e => e.key === 'Enter' && saveWord()} aria-label="The word for the year" style={{ maxWidth: 320 }} />
        )}
      </div>
      <div className="pf-fieldset">
        <span className="pf-cap pf-label">What you will not trade, four at most</span>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {VALUES.map(v => <button key={v} type="button" className="pf-chip pf-chip--haze" aria-pressed={values.includes(v)} onClick={() => toggleValue(v)}>{v}</button>)}
        </div>
      </div>
      <div className="pf-fieldset">
        <label className="pf-cap pf-label" htmlFor="focus-who">One line, the woman you are running this as</label>
        {plan.who ? (
          <p className="pf-body" style={{ color: 'var(--text)' }}>{plan.who} <button type="button" className="pf-btn pf-btn--tertiary" style={{ fontSize: 14, padding: '0 6px', minHeight: 0, display: 'inline' }} onClick={() => setYear(y.key, { who: undefined })}>change</button></p>
        ) : (
          <input id="focus-who" className="pf-input" value={who} onChange={e => setWho(e.target.value)} onBlur={saveWho} onKeyDown={e => e.key === 'Enter' && saveWho()} />
        )}
      </div>
    </div>
  )
}

// ── 02 · What you want: outcomes, goals, the number ──────────────────

function WhatYouWant() {
  const y = yearInfo()
  const q = quarterInfo()
  const outcomes = useFocusStore(s => s.outcomes)
  const addOutcome = useFocusStore(s => s.addOutcome)
  const deleteOutcome = useFocusStore(s => s.deleteOutcome)
  const goals = useGoalStore(s => s.goals)
  const rev = useRevenueStore()
  const month = monthKey()
  const target = rev.monthTarget(month)
  const [draft, setDraft] = useState<Record<Lane, string>>({ business: '', life: '' })
  const mine = outcomes.filter(o => o.year === y.key)
  const inQuarter = goals.filter(g => g.quarter === q.key)
  function add(lane: Lane) { const t = draft[lane].trim(); if (!t) return; addOutcome(y.key, lane, t); setDraft({ ...draft, [lane]: '' }) }
  return (
    <div className="pf-stack-lg" style={{ gap: 26 }}>
      {(['business', 'life'] as Lane[]).map(lane => {
        const rows = mine.filter(o => o.lane === lane)
        return (
          <div key={lane} className="pf-fieldset">
            <span className="pf-cap pf-label">{LANE_LABEL[lane]} · by December, {MAX_OUTCOMES} at most</span>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
              {rows.map(o => <button key={o.id} type="button" className="pf-chip pf-chip--haze" aria-pressed onClick={() => deleteOutcome(o.id)} title="Tap to let go">{o.title}</button>)}
              {rows.length < MAX_OUTCOMES && (
                <input className="pf-inline" value={draft[lane]} onChange={e => setDraft({ ...draft, [lane]: e.target.value })} onKeyDown={e => e.key === 'Enter' && add(lane)} onBlur={() => add(lane)} aria-label={`Add a ${lane} outcome`} style={{ maxWidth: 280 }} />
              )}
            </div>
          </div>
        )
      })}
      <div className="pf-fieldset">
        <span className="pf-cap pf-label">This quarter, {inQuarter.length} of 6 goals</span>
        {inQuarter.length ? (
          <div className="pf-rows">
            {inQuarter.map(g => (
              <div key={g.id} className={`pf-row ${g.done ? 'pf-faded' : ''}`} style={{ gridTemplateColumns: 'minmax(0,1fr) 120px', padding: '10px 0' }}>
                <span style={{ fontSize: 16 }}>{g.title}</span>
                <DepthBar pct={g.done ? 100 : g.target ? ((g.current ?? 0) / g.target) * 100 : 0} landed={g.done} height={4} />
              </div>
            ))}
          </div>
        ) : <p className="pf-small">None yet.</p>}
        <p className="pf-small" style={{ marginTop: 8 }}><Link to="/goals" className="pf-btn pf-btn--tertiary" style={{ display: 'inline', padding: 0, minHeight: 0 }}>Set or change them</Link></p>
      </div>
      <div className="pf-fieldset">
        <span className="pf-cap pf-label">This month, in money</span>
        <p className="pf-body" style={{ color: 'var(--text)' }}>{target > 0 ? <><span className="pf-num pf-num--sm">{fmtInt(target)}<span className="pf-unit">eur</span></span> is the target.</> : 'No target yet.'} <Link to="/money" className="pf-btn pf-btn--tertiary" style={{ display: 'inline', padding: '0 6px', minHeight: 0, fontSize: 14 }}>{target > 0 ? 'change' : 'set it'}</Link></p>
      </div>
    </div>
  )
}

// ── 03 · What is getting in the way: chips from the week, plus her own ──

function InTheWay() {
  const obstacles = useFocusStore(s => s.obstacles)
  const setObstacles = useFocusStore(s => s.setObstacles)
  const rituals = useRitualStore(s => s.rituals)
  const logs = useRitualStore(s => s.logs)
  const weeks = useWeekStore(s => s.weeks)
  const leads = useSalesStore(s => s.leads)
  const [own, setOwn] = useDraft('focus-obstacle')

  // Suggestions the data makes; she keeps the ones that are true.
  const prev = weeks[prevWeekKey(weekKey())]
  const dates = weekDatesFromKey(prevWeekKey(weekKey()))
  const suggestions: string[] = []
  const undone = prev?.priorities.filter(p => !p.done) ?? []
  if (undone.length === (prev?.priorities.length ?? 0) && undone.length > 0) suggestions.push('The week runs me, not the plan')
  for (const r of rituals) { const kept = dates.filter(d => (logs[d] ?? []).includes(r.id)).length; if (kept < r.timesPerWeek) suggestions.push(`${r.name} slips when the week fills`) }
  const due = leads.filter(l => ['conversation', 'proposal'].includes(l.stage) && l.nextDate && l.nextDate < new Date().toISOString().slice(0, 10)).length
  if (due > 0) suggestions.push(`${due} ${due === 1 ? 'conversation waits' : 'conversations wait'} for my reply`)
  if (prev?.review?.drops) suggestions.push(prev.review.drops.split(';')[0].trim())
  const defaults = ['Saying yes too fast', 'Mail before the work', 'No end to the working day', 'Too many open threads', 'Content without a plan', 'Doing it all myself']
  const all = [...new Set([...obstacles.map(o => o.text), ...suggestions, ...defaults])].filter(Boolean)
  const isOn = (t: string) => obstacles.some(o => o.text === t && o.on)
  function toggle(t: string) {
    const ex = obstacles.find(o => o.text === t)
    if (ex) setObstacles(obstacles.map(o => o.text === t ? { ...o, on: !o.on } : o))
    else setObstacles([...obstacles, { id: crypto.randomUUID(), text: t, on: true, createdAt: new Date().toISOString() } as Obstacle])
  }
  function addOwn() { const t = own.trim(); if (!t) return; if (!obstacles.some(o => o.text === t)) toggle(t); setOwn('') }
  const on = obstacles.filter(o => o.on)
  return (
    <div className="pf-stack-lg" style={{ gap: 26 }}>
      <div className="pf-fieldset">
        <span className="pf-cap pf-label">{on.length ? `${on.length} in the way` : 'Tap what is true'}</span>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {all.map(t => <button key={t} type="button" className="pf-chip pf-chip--haze pf-chip--goal" aria-pressed={isOn(t)} onClick={() => toggle(t)}>{t}</button>)}
        </div>
      </div>
      <div className="pf-fieldset">
        <label className="pf-cap pf-label" htmlFor="focus-obstacle">In your own words</label>
        <input id="focus-obstacle" className="pf-input" value={own} onChange={e => setOwn(e.target.value)} onKeyDown={e => e.key === 'Enter' && addOwn()} onBlur={addOwn} />
      </div>
      {on.length > 0 && <p className="pf-small">The session and the next 30 days read these. Nothing here is a verdict.</p>}
    </div>
  )
}

// ── 04 · Your next 30 days: the month's focus, the goals that get it, the habits that hold it ──

function Next30() {
  const month = monthKey()
  const m = monthInfo(month)
  const months = useFocusStore(s => s.months)
  const setMonthFocus = useFocusStore(s => s.setMonthFocus)
  const toggleMonthGoal = useFocusStore(s => s.toggleMonthGoal)
  const obstacles = useFocusStore(s => s.obstacles)
  const goals = useGoalStore(s => s.goals)
  const rituals = useRitualStore(s => s.rituals)
  const [draft, setDraft] = useDraft('focus-month')
  const plan = months[month] ?? { goalIds: [] }
  const inQuarter = goals.filter(g => g.quarter === quarterInfo(m.start).key && !g.done)
  const proposals = [
    inQuarter[0] ? `${inQuarter[0].title}.` : null,
    obstacles.find(o => o.on) ? `Less of: ${obstacles.find(o => o.on)!.text.toLowerCase()}.` : null,
    'Fewer things, held longer.',
  ].filter(Boolean) as string[]
  function save(v: string) { setMonthFocus(month, v && !/[.!?]$/.test(v) ? `${v}.` : v); setDraft('') }
  return (
    <div className="pf-stack-lg" style={{ gap: 26 }}>
      <div className="pf-fieldset">
        <span className="pf-cap pf-label">{m.name}, day {m.day} of {m.total} · one focus</span>
        {plan.focus ? (
          <p className="pf-h3" style={{ margin: 0 }}>{plan.focus} <button type="button" className="pf-btn pf-btn--tertiary" style={{ fontSize: 14, padding: '0 6px', minHeight: 0, display: 'inline' }} onClick={() => setMonthFocus(month, '')}>change</button></p>
        ) : (
          <>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
              {proposals.map(p => <button key={p} type="button" className="pf-chip pf-chip--haze pf-chip--goal" onClick={() => save(p)}>{p}</button>)}
            </div>
            <input className="pf-input" value={draft} onChange={e => setDraft(e.target.value)} onKeyDown={e => e.key === 'Enter' && draft.trim() && save(draft.trim())} onBlur={() => draft.trim() && save(draft.trim())} aria-label="Your own focus for the month" />
          </>
        )}
      </div>
      <div className="pf-fieldset">
        <span className="pf-cap pf-label">The goals that get this month</span>
        {inQuarter.length ? (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {inQuarter.map(g => <button key={g.id} type="button" className="pf-chip pf-chip--haze pf-chip--goal" aria-pressed={plan.goalIds.includes(g.id)} onClick={() => toggleMonthGoal(month, g.id)}>{g.title}</button>)}
          </div>
        ) : <p className="pf-small">No open goals this quarter. <Link to="/goals" className="pf-btn pf-btn--tertiary" style={{ display: 'inline', padding: 0, minHeight: 0 }}>Set them</Link>.</p>}
      </div>
      <div className="pf-fieldset">
        <span className="pf-cap pf-label">The habits that hold it</span>
        <p className="pf-body">{rituals.length ? rituals.map(r => `${r.name} ${r.timesPerWeek}x`).join(' · ') : 'None yet.'} <Link to="/focus/habits" className="pf-btn pf-btn--tertiary" style={{ display: 'inline', padding: '0 6px', minHeight: 0, fontSize: 14 }}>your habits</Link></p>
      </div>
      <p className="pf-small">Every Sunday the session turns this into three priorities. <Link to="/session" className="pf-btn pf-btn--tertiary" style={{ display: 'inline', padding: 0, minHeight: 0 }}>Start it</Link>.</p>
    </div>
  )
}
