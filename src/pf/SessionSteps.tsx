// The five steps of the Weekly Session. One question per screen, one sharp thing, one Ink pill.
import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { Link } from 'react-router-dom'
import { useWeekStore, MAX_PRIORITIES } from '../store/pf/weekStore'
import type { WeekPlan, Priority, Block } from '../store/pf/weekStore'
import { useGoalStore } from '../store/pf/goalStore'
import { useRevenueStore } from '../store/pf/revenueStore'
import { useRitualStore, PHASE_LABEL, PHASE_HINT } from '../store/pf/ritualStore'
import { useCalendarStore } from '../store/calendarStore'
import { suggestPriorities, draftWeek } from '../lib/pf/assistant'
import { localDraft } from '../lib/pf/localDraft'
import { useSalesStore } from '../store/pf/salesStore'
import { useContentStore } from '../store/pf/contentStore'
import { DepthBar } from './DepthBar'
import { AIError } from '../lib/ai'
import { prevWeekKey, shiftMonth, weekDatesFromKey, monthKey, quarterKey, DAY_SHORT, DAY_LONG, dayIndex, fmtDay, todayStr } from '../lib/pf/week'
import { ApertureLoader } from './Aperture'

// ── shared ────────────────────────────────────────────────────────────

// One body-level host for the fixed dock, created on first use. It carries the .pf tokens.
function dockRoot(): HTMLElement | null {
  if (typeof document === 'undefined') return null
  let el = document.getElementById('pf-dock-root')
  if (!el) {
    el = document.createElement('div')
    el.id = 'pf-dock-root'
    el.className = 'pf pf-dock-host'
    document.body.appendChild(el)
  }
  return el
}

export function Dock({ primary, secondary }: {
  primary: { label: string; onClick?: () => void; to?: string; disabled?: boolean; busy?: boolean }
  secondary?: { label: string; onClick?: () => void; to?: string; kind?: 'text' | 'outline' }   // outline: as visible as the primary, without the Ink
}) {
  const secClass = secondary?.kind === 'outline' ? 'pf-btn pf-btn--secondary' : 'pf-btn pf-btn--tertiary'
  const inner = primary.busy ? <ApertureLoader size={20} color="var(--action-text)" /> : primary.label
  // The dock is fixed to the viewport, so it lives outside the animated content (a filter creates a containing block).
  const root = dockRoot()
  const dock = (
    <div className="pf-dock">
      {secondary && (secondary.to
        ? <Link to={secondary.to} className={secClass}>{secondary.label}</Link>
        : <button type="button" className={secClass} onClick={secondary.onClick}>{secondary.label}</button>)}
      {primary.to
        ? <Link to={primary.to} className="pf-btn pf-btn--primary" aria-label={primary.label}>{inner}</Link>
        : <button type="button" className="pf-btn pf-btn--primary" onClick={primary.onClick} disabled={primary.disabled || primary.busy} aria-label={primary.label}>{inner}</button>}
    </div>
  )
  return root ? createPortal(dock, root) : dock
}

function Title({ over, title, lead }: { over: string; title: string; lead?: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 40, marginBottom: 36 }}>
      <p className="pf-over">{over}</p>
      <h1 className="pf-h2">{title}</h1>
      {lead && <p className="pf-body">{lead}</p>}
    </div>
  )
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="pf-fieldset">
      <span className="pf-cap pf-label">{label}</span>
      {children}
    </div>
  )
}

function fmtInt(n: number) { return new Intl.NumberFormat('en-IE', { maximumFractionDigits: 0 }).format(Math.round(n)) }

// ── 2 · Money · 30 sec ────────────────────────────────────────────────
// The answer first, the gap as a bar, the offers as one-tap chips. No target yet: three to tap, one to type.

export function StepMoney({ onNext, onBack }: { onNext: () => void; onBack: () => void }) {
  const month = monthKey()
  const rev = useRevenueStore()
  const target = rev.monthTarget(month)
  const revenue = rev.monthRevenue(month)
  const gap = Math.max(0, target - revenue)
  const last = rev.monthRevenue(shiftMonth(month, -1))
  const [custom, setCustom] = useState('')
  const [logged, setLogged] = useState<string | null>(null)
  useEffect(() => { if (!logged) return; const t = setTimeout(() => setLogged(null), 2400); return () => clearTimeout(t) }, [logged])

  const monthName = fmtDay(todayStr(), 'MMMM')
  const round = (n: number) => Math.max(500, Math.round(n / 100) * 100)
  const proposals = last > 0
    ? [{ label: `Same as last month, ${fmtInt(round(last))}`, n: round(last) }, { label: `A step up, ${fmtInt(round(last * 1.15))}`, n: round(last * 1.15) }, { label: `A stretch, ${fmtInt(round(last * 1.3))}`, n: round(last * 1.3) }]
    : [{ label: '5,000', n: 5000 }, { label: '8,000', n: 8000 }, { label: '12,000', n: 12000 }]
  function setCustomTarget() { const n = Number(custom.replace(/[^\d.]/g, '')); if (n > 0) { rev.setTarget(month, n); setCustom('') } }
  function logOffer(id: string) { const o = rev.offers.find(x => x.id === id); if (!o) return; rev.logSale({ offerId: id }); setLogged(`Logged. ${fmtInt(o.price)} eur.`) }

  const headline = target === 0 ? `No target for ${monthName} yet.` : gap > 0 ? `${fmtInt(gap)} eur to go in ${monthName}.` : `${monthName} is met.`
  const lead = target === 0 ? 'Tap one. It can change any time.' : gap > 0 ? 'One of your three can be about selling this week.' : 'Business and life sit level this week.'

  return (
    <>
      <Title over={`Money · 30 sec · ${monthName}`} title={headline} lead={lead} />

      {target === 0 ? (
        <div className="pf-fields" style={{ display: 'flex', flexDirection: 'column', gap: 18, marginBottom: 36 }}>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {proposals.map(p => <button key={p.n} type="button" className="pf-chip pf-chip--haze" onClick={() => rev.setTarget(month, p.n)}>{p.label}<span className="pf-unit">eur</span></button>)}
          </div>
          <Field label="Or your own number">
            <input className="pf-input pf-mono" inputMode="numeric" value={custom} onChange={e => setCustom(e.target.value)} onBlur={setCustomTarget} onKeyDown={e => e.key === 'Enter' && setCustomTarget()} aria-label="Monthly target in euro" style={{ maxWidth: 200 }} />
          </Field>
        </div>
      ) : (
        <div style={{ marginBottom: 36 }}>
          <span style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12 }}>
            <span className="pf-num pf-num--sm">{fmtInt(revenue)}<span className="pf-unit">/{fmtInt(target)} eur</span></span>
            <button type="button" className="pf-btn pf-btn--tertiary" style={{ padding: '4px 0', minHeight: 0 }} onClick={() => rev.setTarget(month, 0)}>Change the target</button>
          </span>
          <DepthBar pct={target > 0 ? (revenue / target) * 100 : 0} landed={gap === 0 && target > 0} style={{ marginTop: 6 }} />
        </div>
      )}

      <div className="pf-fields" style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        <Field label="Sold this week, one tap">
          {rev.offers.length > 0 ? (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
              {rev.offers.map(o => (
                <button key={o.id} type="button" className="pf-chip" onClick={() => logOffer(o.id)}>
                  {o.name} <span className="pf-unit pf-mono">{fmtInt(o.price)} eur</span>
                </button>
              ))}
            </div>
          ) : <p className="pf-small">Your offers appear here once you add them under Focus · Business.</p>}
        </Field>
        {logged && <p className="pf-small pf-enter" role="status">{logged}</p>}
      </div>
      <Dock primary={{ label: 'Continue', onClick: onNext }} secondary={{ label: 'Nothing sold', onClick: onNext, kind: 'outline' }} />
      <p className="pf-small" style={{ marginTop: 28 }}><button type="button" className="pf-btn pf-btn--tertiary" style={{ padding: 0, minHeight: 0, display: 'inline' }} onClick={onBack}>Back</button></p>
    </>
  )
}

// ── 3 · Your three · 2 min ────────────────────────────────────────────
// Three slots, filled before she arrives: from the goals, last week, the conversations and the content.
// She confirms, swaps one for another chip, or writes her own. The studio proposes on top when it is connected.

interface Candidate { id: string; title: string; goalId?: string; why: string }

export function StepThree({ week, onNext, onBack, drop, setDrop }: { week: WeekPlan; onNext: () => void; onBack: () => void; drop: string; setDrop: (s: string) => void }) {
  const goals = useGoalStore(s => s.goals)
  const setPriorities = useWeekStore(s => s.setPriorities)
  const prev = useWeekStore(s => s.weeks[prevWeekKey(week.key)])
  const leads = useSalesStore(s => s.leads)
  const posts = useContentStore(s => s.posts)
  const quarter = quarterKey()
  const quarterGoals = goals.filter(g => g.quarter === quarter && !g.done)
  const dates = weekDatesFromKey(week.key)

  const candidates: Candidate[] = [
    ...(prev?.priorities.filter(p => !p.done).map(p => ({ id: `prev-${p.id}`, title: p.title, goalId: p.goalId, why: 'Carried over from last week.' })) ?? []),
    ...quarterGoals.map(g => {
      const step = g.milestones.find(m => m.trim())
      return { id: `goal-${g.id}`, title: step ?? `A real step on: ${g.title}`, goalId: g.id, why: `Serves ${g.title}${g.target ? `, ${g.current ?? 0} of ${g.target} ${g.unit ?? ''}`.replace(/\s+$/, '') : ''}.` }
    }),
    ...leads.filter(l => ['conversation', 'proposal'].includes(l.stage)).slice(0, 3).map(l => ({ id: `lead-${l.id}`, title: `Close the conversation with ${l.name}`, why: `${l.value ? `${fmtInt(l.value)} eur in play. ` : ''}${l.nextStep ? l.nextStep + '.' : ''}`.trim() || 'Open conversation.' })),
    ...posts.filter(p => dates.includes(p.date) && p.status !== 'posted').slice(0, 2).map(p => ({ id: `post-${p.id}`, title: `Post: ${p.title}`, why: `Planned for ${fmtDay(p.date, 'EEEE')}.` })),
  ]

  // Prefill: one business, one life, then the strongest of the rest.
  function prefill(): Priority[] {
    const pick: Candidate[] = []
    const bus = candidates.find(c => c.goalId && goals.find(g => g.id === c.goalId)?.lane === 'business')
    const life = candidates.find(c => c.goalId && goals.find(g => g.id === c.goalId)?.lane === 'life')
    if (bus) pick.push(bus); if (life) pick.push(life)
    for (const c of candidates) { if (pick.length >= MAX_PRIORITIES) break; if (!pick.includes(c)) pick.push(c) }
    return pick.map(c => ({ id: crypto.randomUUID(), title: c.title, goalId: c.goalId, why: c.why, done: false }))
  }
  const [slots, setSlots] = useState<Priority[]>(() => week.priorities.length ? week.priorities.slice(0, MAX_PRIORITIES) : prefill())
  const [editing, setEditing] = useState<string | null>(null)
  const [own, setOwn] = useState('')
  const [busy, setBusy] = useState(false)
  const [note, setNote] = useState<string | null>(null)

  // The studio proposes once, on arrival, when nothing was chosen yet. Not connected: the prefill stands, quietly.
  useEffect(() => {
    if (week.priorities.length) return
    let live = true
    const t = setTimeout(async () => {
      setBusy(true)
      try {
        const out = await suggestPriorities({ ...week, priorities: [] })
        if (!live || !out.priorities.length) return
        setSlots(out.priorities.map(p => ({ id: crypto.randomUUID(), title: p.title, goalId: p.goalId, why: p.why, done: false })))
        setDrop(out.drop)
        setNote('The studio proposed these. Change any of them.')
      } catch (e) {
        if (live && !(e instanceof AIError)) setNote(null)
      } finally { if (live) setBusy(false) }
    }, 0)
    return () => { live = false; clearTimeout(t) }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const inSlots = (t: string) => slots.some(p => p.title === t)
  function take(c: Candidate) {
    if (inSlots(c.title)) return
    setSlots(s => s.length < MAX_PRIORITIES ? [...s, { id: crypto.randomUUID(), title: c.title, goalId: c.goalId, why: c.why, done: false }] : [...s.slice(0, MAX_PRIORITIES - 1), { id: crypto.randomUUID(), title: c.title, goalId: c.goalId, why: c.why, done: false }])
  }
  function remove(id: string) { setSlots(s => s.filter(p => p.id !== id)) }
  function rename(id: string, title: string) { setSlots(s => s.map(p => p.id === id ? { ...p, title } : p)) }
  function addOwn() { const t = own.trim(); if (!t) return; take({ id: `own-${t}`, title: t, why: 'Yours.' }); setOwn('') }
  function next() { setPriorities(week.key, slots.filter(p => p.title.trim()).map(p => ({ ...p, title: p.title.trim() }))); onNext() }
  function carry() { if (prev?.priorities.length) setSlots(prev.priorities.map(p => ({ ...p, id: crypto.randomUUID(), done: false }))) }

  const lead = busy ? 'Reading your goals, the money and last week.' : slots.length === 3 ? 'Three, not six. Confirm them, or swap one.' : `${slots.length} of 3. Tap one more, or write your own.`

  return (
    <>
      <Title over="Your three · 2 min" title="Three things this week." lead={lead} />

      <div className="pf-rows" style={{ marginBottom: 32 }}>
        {[0, 1, 2].map(i => {
          const p = slots[i]
          const goal = p?.goalId ? goals.find(g => g.id === p.goalId) : undefined
          return (
            <div key={p?.id ?? `empty-${i}`} className={`pf-row ${busy ? 'pf-dim' : ''}`} style={{ gridTemplateColumns: '32px minmax(0,1fr) auto', padding: '16px 0', alignItems: 'start' }}>
              <span className="pf-day" aria-hidden="true" style={{ cursor: 'default', marginTop: 2 }}>{i + 1}</span>
              {p ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0 }}>
                  {editing === p.id ? (
                    <input className="pf-inline" value={p.title} autoFocus onChange={e => rename(p.id, e.target.value)} onBlur={() => setEditing(null)} onKeyDown={e => e.key === 'Enter' && setEditing(null)} aria-label={`Priority ${i + 1}`} style={{ fontSize: 17 }} />
                  ) : (
                    <button type="button" onClick={() => setEditing(p.id)} aria-label={`Edit priority ${i + 1}`} style={{ background: 'none', border: 0, padding: 0, font: 'inherit', fontSize: 17, fontWeight: 500, color: 'inherit', textAlign: 'left', cursor: 'text' }}>{p.title}</button>
                  )}
                  <span className="pf-cap">{goal ? <>serves <span style={{ color: 'var(--text-brand)' }}>{goal.title}</span></> : p.why}</span>
                </div>
              ) : (
                <span className="pf-small" style={{ color: 'var(--text-3)', marginTop: 6 }}>Open.</span>
              )}
              {p ? <button type="button" className="pf-btn pf-btn--tertiary" style={{ padding: '4px 0', minHeight: 32 }} onClick={() => remove(p.id)}>Swap</button> : <span />}
            </div>
          )
        })}
      </div>

      {candidates.filter(c => !inSlots(c.title)).length > 0 && (
        <div style={{ marginBottom: 28 }}>
          <span className="pf-cap pf-label">More to choose from</span>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {candidates.filter(c => !inSlots(c.title)).map(c => (
              <button key={c.id} type="button" className="pf-chip pf-chip--haze pf-chip--goal" onClick={() => take(c)} title={c.why}>{c.title}</button>
            ))}
          </div>
        </div>
      )}

      <div className="pf-fieldset" style={{ marginBottom: 28 }}>
        <label className="pf-cap pf-label" htmlFor="own-priority">Your own, if the week needs it</label>
        <input id="own-priority" className="pf-input" value={own} onChange={e => setOwn(e.target.value)} onKeyDown={e => e.key === 'Enter' && addOwn()} onBlur={addOwn} />
      </div>

      {note && !busy && <p className="pf-small" style={{ marginBottom: 12 }}>{note}</p>}
      {drop && (
        <div className="pf-panel pf-enter">
          <span className="pf-cap pf-label">What you can leave this week</span>
          <p className="pf-body">{drop}</p>
        </div>
      )}
      {!!prev?.priorities.length && <p className="pf-small" style={{ marginTop: 20 }}><button type="button" className="pf-btn pf-btn--tertiary" style={{ padding: 0, minHeight: 0, display: 'inline' }} onClick={onBack}>Back</button></p>}
      <Dock primary={{ label: 'Continue', onClick: next, disabled: slots.length === 0 || busy }}
        secondary={prev?.priorities.length ? { label: "Last week's three", onClick: carry, kind: 'outline' } : { label: 'Back', onClick: onBack }} />
    </>
  )
}

// ── 4 · Success habits · 1 min ────────────────────────────────────────

export interface Prefs { workStart: string; workEnd: string; freeDays: number[] }

function spread(n: number): number[] { const step = 7 / n; return Array.from({ length: n }, (_, i) => Math.min(6, Math.round(i * step))) }
const HABIT_IDEAS: { name: string; times: number }[] = [
  { name: 'Run', times: 3 }, { name: 'Pilates', times: 2 }, { name: 'Strength', times: 2 }, { name: 'Walk', times: 4 },
  { name: 'Screen-free evening', times: 2 }, { name: 'Early night', times: 3 }, { name: 'Read', times: 3 }, { name: 'Sunday with a friend', times: 1 },
]

export function StepRituals({ week, prefs, setPrefs, onNext, onBack }: { week: WeekPlan; prefs: Prefs; setPrefs: (p: Prefs) => void; onNext: () => void; onBack: () => void }) {
  const rituals = useRitualStore(s => s.rituals)
  const addRitual = useRitualStore(s => s.addRitual)
  const cycleStart = useRitualStore(s => s.cycleStart)
  const phaseOn = useRitualStore(s => s.phaseOn)
  const setRitualDays = useWeekStore(s => s.setRitualDays)
  const prev = useWeekStore(s => s.weeks[prevWeekKey(week.key)])
  const events = useCalendarStore(s => s.events)
  const dates = weekDatesFromKey(week.key)
  const [own, setOwn] = useState('')

  // Days come filled: last week's, else her preferred days, else spread over the week.
  useEffect(() => {
    rituals.forEach(r => {
      if (week.ritualDays[r.id]?.length) return
      const days = prev?.ritualDays[r.id]?.length ? prev.ritualDays[r.id] : r.preferredDays.length ? r.preferredDays : spread(r.timesPerWeek)
      setRitualDays(week.key, r.id, days)
    })
  }, [rituals, week.key, week.ritualDays, setRitualDays, prev])

  function toggleDay(id: string, d: number) {
    const cur = week.ritualDays[id] ?? []
    setRitualDays(week.key, id, cur.includes(d) ? cur.filter(x => x !== d) : [...cur, d])
  }
  function addIdea(name: string, times: number) { addRitual(name, times, { emoji: '' }) }
  function addOwn() { const t = own.trim(); if (!t) return; addIdea(t, 3); setOwn('') }
  function toggleFree(d: number) { setPrefs({ ...prefs, freeDays: prefs.freeDays.includes(d) ? prefs.freeDays.filter(x => x !== d) : [...prefs.freeDays, d] }) }
  function sameAsLastWeek() { if (!prev) return; rituals.forEach(r => { if (prev.ritualDays[r.id]?.length) setRitualDays(week.key, r.id, prev.ritualDays[r.id]) }) }

  const weekEvents = events.filter(e => dates.includes(e.start.slice(0, 10)))
  const phase = cycleStart ? phaseOn(dates[0]) : null
  const planned = rituals.reduce((a, r) => a + (week.ritualDays[r.id]?.length ?? 0), 0)
  const ideas = HABIT_IDEAS.filter(h => !rituals.some(r => r.name.toLowerCase() === h.name.toLowerCase()))

  return (
    <>
      <Title over="Success habits · 1 min" title={rituals.length ? `${planned} habit mornings held.` : 'What stays in the diary.'} lead={phase ? `${PHASE_LABEL[phase]} this week. ${PHASE_HINT[phase]}` : rituals.length ? 'The days are filled in. Tap to move one.' : 'Tap the ones that keep the life side winning.'} />

      <div className="pf-rows" style={{ marginBottom: 28 }}>
        {rituals.map(r => {
          const days = week.ritualDays[r.id] ?? []
          return (
            <div key={r.id} className="pf-row" style={{ gridTemplateColumns: 'minmax(0,1fr)', gap: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12 }}>
                <span style={{ fontSize: 16, fontWeight: 500 }}>{r.name}</span>
                <span className="pf-cap"><span className="pf-mono">{days.length}/{r.timesPerWeek}</span> planned</span>
              </div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {dates.map((d, i) => {
                  const ph = cycleStart ? phaseOn(d) : null
                  return (
                    <button key={d} type="button" className="pf-day" aria-pressed={days.includes(i)} onClick={() => toggleDay(r.id, i)}
                      aria-label={`${r.name} on ${DAY_LONG[i]}${ph ? ', ' + PHASE_LABEL[ph] : ''}`}>{DAY_SHORT[i].slice(0, 2)}</button>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>

      {(
        <div className="pf-fields" style={{ display: 'flex', flexDirection: 'column', gap: 18, marginBottom: 36 }}>
          <Field label={rituals.length ? 'One more, if it earns its place' : 'Tap to add'}>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {ideas.map(h => <button key={h.name} type="button" className="pf-chip pf-chip--haze" onClick={() => addIdea(h.name, h.times)}>{h.name}<span className="pf-unit">{h.times}x</span></button>)}
            </div>
          </Field>
          <Field label="Or your own, three times a week to start">
            <input className="pf-input" value={own} onChange={e => setOwn(e.target.value)} onKeyDown={e => e.key === 'Enter' && addOwn()} onBlur={addOwn} aria-label="Your own habit" style={{ maxWidth: 320 }} />
          </Field>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 22, marginBottom: 32 }}>
        <Field label="Working day">
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <input className="pf-input pf-mono" type="time" value={prefs.workStart} onChange={e => setPrefs({ ...prefs, workStart: e.target.value })} aria-label="Work starts" style={{ padding: '10px 12px' }} />
            <span className="pf-cap">to</span>
            <input className="pf-input pf-mono" type="time" value={prefs.workEnd} onChange={e => setPrefs({ ...prefs, workEnd: e.target.value })} aria-label="Work ends" style={{ padding: '10px 12px' }} />
          </div>
        </Field>
        <Field label="Days off">
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {DAY_SHORT.map((d, i) => (
              <button key={d} type="button" className="pf-day" aria-pressed={prefs.freeDays.includes(i)} onClick={() => toggleFree(i)} aria-label={`${DAY_LONG[i]} off`}>{d.slice(0, 2)}</button>
            ))}
          </div>
        </Field>
      </div>

      <div className="pf-dim" style={{ marginBottom: 12 }}>
        <span className="pf-cap pf-label">Calendar</span>
        {weekEvents.length ? (
          <div className="pf-rows">
            {weekEvents.slice(0, 8).map(e => (
              <div key={e.id} className="pf-row" style={{ gridTemplateColumns: '84px minmax(0,1fr)' }}>
                <span className="pf-mono pf-cap">{fmtDay(e.start.slice(0, 10), 'EEE d')} {e.start.includes('T') ? e.start.slice(11, 16) : ''}</span>
                <span style={{ fontSize: 15 }}>{e.summary}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="pf-small">No calendar connected. The week is drafted around your habits only.</p>
        )}
      </div>
      {!!(prev && Object.keys(prev.ritualDays).length) && <p className="pf-small" style={{ marginTop: 8 }}><button type="button" className="pf-btn pf-btn--tertiary" style={{ padding: 0, minHeight: 0, display: 'inline' }} onClick={onBack}>Back</button></p>}
      <Dock primary={{ label: 'Draft my week', onClick: onNext }}
        secondary={prev && Object.keys(prev.ritualDays).length ? { label: 'Same as last week', onClick: sameAsLastWeek, kind: 'outline' } : { label: 'Back', onClick: onBack }} />
    </>
  )
}

// ── 5 · Your week · 2 min ─────────────────────────────────────────────
// The studio drafts; without it, the week is drafted here. Either way she gets a week to confirm, never a blank.

const DRAFT_LINES = ['Reading your three.', 'Holding the habits.', 'Fitting work around the calendar.', 'Leaving air.']

export function StepWeek({ week, prefs, drop, onDone, onBack }: { week: WeekPlan; prefs: Prefs; drop: string; onDone: () => void; onBack: () => void }) {
  const setDays = useWeekStore(s => s.setDays)
  const completeSession = useWeekStore(s => s.completeSession)
  const rituals = useRitualStore(s => s.rituals)
  const hasDays = Object.keys(week.days).length > 0
  const [busy, setBusy] = useState(!hasDays)
  const [line, setLine] = useState(0)
  const [offline, setOffline] = useState(false)

  useEffect(() => { if (!busy) return; const t = setInterval(() => setLine(l => (l + 1) % DRAFT_LINES.length), 1400); return () => clearInterval(t) }, [busy])

  async function generate(initial = false) {
    if (!initial) setBusy(true)
    try {
      const out = await draftWeek(week, prefs)
      setDays(week.key, out.days, out.note, drop || out.drop)
      setOffline(false)
    } catch {
      const out = localDraft(week, prefs, rituals)
      setDays(week.key, out.days, out.note, drop || out.drop)
      setOffline(true)
    } finally { setBusy(false) }
  }

  useEffect(() => {
    if (hasDays) return
    const t = setTimeout(() => { void generate(true) }, 0)
    return () => clearTimeout(t)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  if (busy) {
    return (
      <>
        <Title over="Your week · 2 min" title="Your week." />
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 22, marginTop: 40 }}>
          <ApertureLoader size={64} color="var(--depth-3)" />
          <p className="pf-body" aria-live="polite">{DRAFT_LINES[line]}</p>
        </div>
      </>
    )
  }

  return (
    <>
      <Title over="Your week · 2 min" title="Your week." lead={week.assistantNote || 'Seven days, three priorities, the habits held.'} />
      {offline && <p className="pf-small" style={{ marginBottom: 12 }}>Drafted here, without the studio. Move anything.</p>}
      {week.dropSuggestion && <p className="pf-small" style={{ marginBottom: 28 }}>Not this week: {week.dropSuggestion}</p>}
      <WeekGrid week={week} editable />
      <div style={{ marginTop: 28 }}>
        <button type="button" className="pf-btn pf-btn--tertiary" onClick={() => generate()}>Draft it again</button>
      </div>
      <Dock primary={{ label: 'This week holds', onClick: () => { completeSession(week.key); onDone() } }} secondary={{ label: 'Back', onClick: onBack }} />
    </>
  )
}

export function WeekGrid({ week, editable = false }: { week: WeekPlan; editable?: boolean }) {
  const updateBlock = useWeekStore(s => s.updateBlock)
  const replaceDay = useWeekStore(s => s.replaceDay)
  const dates = weekDatesFromKey(week.key)
  const today = todayStr()
  return (
    <div className="pf-week">
      {dates.map(d => {
        const day = week.days[d]
        const isToday = d === today
        return (
          <section key={d} aria-label={fmtDay(d, 'EEEE d MMMM')} className={isToday ? 'pf-sharp' : ''}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 6 }}>
              <span className="pf-h4">{DAY_SHORT[dayIndex(d)]}</span>
              <span className="pf-cap pf-mono">{fmtDay(d, 'd')}</span>
              {isToday && <span className="pf-cap">today</span>}
            </div>
            {day?.intention && <p className="pf-small" style={{ marginBottom: 8 }}>{day.intention}</p>}
            <div>
              {(day?.blocks ?? []).map(b => (
                <BlockRow key={b.id} block={b} editable={editable}
                  onChange={patch => updateBlock(week.key, d, b.id, patch)}
                  onDelete={() => replaceDay(week.key, d, (day?.blocks ?? []).filter(x => x.id !== b.id), day?.intention)} />
              ))}
              {(!day || day.blocks.length === 0) && <p className="pf-cap">Nothing planned. That's allowed.</p>}
            </div>
          </section>
        )
      })}
    </div>
  )
}

function BlockRow({ block, editable, onChange, onDelete }: { block: Block; editable: boolean; onChange: (p: Partial<Block>) => void; onDelete: () => void }) {
  const [edit, setEdit] = useState(false)
  const [title, setTitle] = useState(block.title)
  function commit() { onChange({ title: title.trim() || block.title }); setEdit(false) }
  return (
    <div className="pf-block" data-kind={block.kind}>
      <i aria-hidden="true" />
      <div>
        <time className="pf-mono">{block.start} to {block.end}</time>
        {edit ? (
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input className="pf-inline" value={title} autoFocus onChange={e => setTitle(e.target.value)} onBlur={commit} onKeyDown={e => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') setEdit(false) }} aria-label="Block title" />
            <button type="button" className="pf-btn pf-btn--tertiary" onClick={onDelete} style={{ padding: '6px 4px', minHeight: 32, fontSize: 13 }}>Remove</button>
          </div>
        ) : editable ? (
          <button type="button" onClick={() => setEdit(true)} style={{ background: 'none', border: 0, padding: 0, font: 'inherit', color: 'inherit', textAlign: 'left', cursor: 'text', fontSize: 15, lineHeight: 1.4 }} aria-label={`Edit ${block.title}`}>{block.title}</button>
        ) : (
          <span style={{ fontSize: 15, lineHeight: 1.4 }}>{block.title}</span>
        )}
      </div>
    </div>
  )
}
