// Look back, thirty seconds. Three questions, one at a time, answered by tapping what the week already knows.
// The end is visible before she starts: the next questions sit under the current one, soft but present.
// She may say "Nothing this week" and move on, or speak for twenty seconds and let the app sort it.
import { useEffect, useRef, useState } from 'react'
import { useWeekStore } from '../store/pf/weekStore'
import type { WeekPlan, Review } from '../store/pf/weekStore'
import { useRitualStore } from '../store/pf/ritualStore'
import { useSalesStore } from '../store/pf/salesStore'
import { useContentStore } from '../store/pf/contentStore'
import { askClaude, extractJSON, AIError, STUDIO_SYSTEM } from '../lib/ai'
import { prevWeekKey, weekDatesFromKey } from '../lib/pf/week'
import { ApertureLoader } from './Aperture'
import { Dock } from './SessionSteps'

type Q = 'wins' | 'drops' | 'lesson'
const ORDER: Q[] = ['wins', 'drops', 'lesson']
const TITLE: Record<Q, string> = { wins: 'What worked.', drops: 'What you are letting go.', lesson: 'One thing you keep.' }
const SHORT: Record<Q, string> = { wins: 'What worked', drops: 'What you let go', lesson: 'One thing you keep' }

interface Chip { id: string; label: string; on: boolean }
type Picks = Record<Q, Chip[]>
type Notes = Record<Q, string>

// The chips come from the week itself: nothing to invent, only to confirm or adjust.
function buildChips(prev: WeekPlan | undefined, dates: string[], logs: Record<string, string[]>, rituals: { id: string; name: string; timesPerWeek: number; preferredDays: number[] }[], won: string[], lost: string[], posted: string[], unposted: string[]): Picks {
  const wins: Chip[] = [], drops: Chip[] = [], lesson: Chip[] = []
  const ps = prev?.priorities ?? []
  for (const p of ps) (p.done ? wins : drops).push({ id: `p-${p.id}`, label: p.title, on: true })
  const blocks = Object.values(prev?.days ?? {}).flatMap(d => d.blocks)
  const seen = new Set<string>()
  for (const b of blocks) {
    if (b.kind === 'ritual' || b.kind === 'rest' || seen.has(b.title)) continue
    seen.add(b.title)
    if (ps.some(p => p.title === b.title)) continue
    if (b.done) wins.push({ id: `b-${b.id}`, label: b.title, on: false })
    else if (b.kind === 'priority') drops.push({ id: `b-${b.id}`, label: b.title, on: false })
  }
  for (const r of rituals) {
    const planned = prev?.ritualDays[r.id] ?? r.preferredDays
    const kept = dates.filter(d => (logs[d] ?? []).includes(r.id)).length
    if (kept >= Math.min(r.timesPerWeek, planned.length || r.timesPerWeek) && kept > 0) wins.push({ id: `r-${r.id}`, label: `${r.name}, ${kept} of ${r.timesPerWeek}`, on: true })
    else if (kept < r.timesPerWeek) drops.push({ id: `r-${r.id}`, label: `${r.name}, ${kept} of ${r.timesPerWeek}`, on: false })
  }
  for (const w of won) wins.push({ id: `w-${w}`, label: `Won: ${w}`, on: true })
  for (const l of lost) drops.push({ id: `l-${l}`, label: `Not now: ${l}`, on: false })
  for (const p of posted) wins.push({ id: `c-${p}`, label: `Posted: ${p}`, on: false })
  for (const p of unposted) drops.push({ id: `u-${p}`, label: `Not posted: ${p}`, on: false })
  if (prev?.dropSuggestion) drops.push({ id: 'drop-hint', label: prev.dropSuggestion.replace(/\.$/, ''), on: false })

  // Lessons the week suggests. She confirms one or writes her own.
  const doneN = ps.filter(p => p.done).length
  if (ps.length > 0 && doneN === ps.length) lesson.push({ id: 'l1', label: 'Three, not six. It held.', on: true })
  if (ps.length > 0 && doneN === 0) lesson.push({ id: 'l2', label: 'The week set the plan, not me.', on: false })
  if (ps.length > 0 && doneN > 0 && doneN < ps.length) lesson.push({ id: 'l3', label: `${doneN} of ${ps.length} stood. That is a week.`, on: true })
  const morning = blocks.filter(b => b.done && b.start < '12:00').length, afternoon = blocks.filter(b => b.done && b.start >= '12:00').length
  if (morning > afternoon + 1) lesson.push({ id: 'l4', label: 'Mornings carry the work.', on: false })
  if (afternoon > morning + 1) lesson.push({ id: 'l5', label: 'Afternoons carry the work.', on: false })
  const missed = rituals.filter(r => dates.filter(d => (logs[d] ?? []).includes(r.id)).length < r.timesPerWeek)
  if (missed.length > 0) lesson.push({ id: 'l6', label: `${missed[0].name} slips when the week fills.`, on: false })
  if (won.length > 0) lesson.push({ id: 'l7', label: 'Conversations close when they get a day.', on: false })
  if (lesson.length === 0) lesson.push({ id: 'l0', label: 'A plan on paper beats a plan in my head.', on: false })
  return { wins: wins.slice(0, 8), drops: drops.slice(0, 8), lesson: lesson.slice(0, 4) }
}

function joined(chips: Chip[], note: string): string {
  const parts = chips.filter(c => c.on).map(c => c.label)
  if (note.trim()) parts.push(note.trim())
  return parts.join('; ')
}

export function StepLookBack({ week, onNext, onSkip }: { week: WeekPlan; onNext: () => void; onSkip: () => void }) {
  const prevKey = prevWeekKey(week.key)
  const prev = useWeekStore(s => s.weeks[prevKey])
  const setReview = useWeekStore(s => s.setReview)
  const rituals = useRitualStore(s => s.rituals)
  const logs = useRitualStore(s => s.logs)
  const leads = useSalesStore(s => s.leads)
  const posts = useContentStore(s => s.posts)
  const dates = weekDatesFromKey(prevKey)
  const from = dates[0], to = dates[6]

  const [picks, setPicks] = useState<Picks>(() => buildChips(
    prev, dates, logs, rituals,
    leads.filter(l => l.stage === 'won' && l.closedAt && l.closedAt >= from && l.closedAt <= to).map(l => l.name),
    leads.filter(l => l.stage === 'lost' && l.closedAt && l.closedAt >= from && l.closedAt <= to).map(l => l.name),
    posts.filter(p => p.date >= from && p.date <= to && p.status === 'posted').map(p => p.title),
    posts.filter(p => p.date >= from && p.date <= to && p.status !== 'posted').map(p => p.title),
  ))
  const [notes, setNotes] = useState<Notes>({ wins: '', drops: '', lesson: '' })
  const [energy, setEnergy] = useState<number>(week.review?.energy ?? 3)
  const [i, setI] = useState(0)
  const q = ORDER[i]
  const first = !prev?.priorities.length && !Object.keys(prev?.days ?? {}).length

  function toggle(qq: Q, id: string) { setPicks(p => ({ ...p, [qq]: p[qq].map(c => c.id === id ? { ...c, on: !c.on } : c) })) }
  function review(): Review {
    return { wins: joined(picks.wins, notes.wins), drops: joined(picks.drops, notes.drops), lesson: joined(picks.lesson, notes.lesson), energy }
  }
  function next() {
    setReview(week.key, review())
    if (i < 2) setI(i + 1); else onNext()
  }
  function skip() { setReview(week.key, { wins: '', drops: '', lesson: '', energy }); onSkip() }

  // Twenty seconds of speech, sorted over the three questions by the studio. Falls back to the first question.
  function takeSpeech(text: string, sorted: Partial<Record<Q, string>> | null) {
    const add = (qq: Q, v?: string) => { if (v?.trim()) setNotes(n => ({ ...n, [qq]: n[qq] ? `${n[qq]} ${v.trim()}` : v.trim() })) }
    if (sorted) { add('wins', sorted.wins); add('drops', sorted.drops); add('lesson', sorted.lesson) }
    else add(q, text)
  }

  return (
    <>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 40, marginBottom: 28 }}>
        <p className="pf-over">Look back · 30 sec · {i + 1} of 3</p>
        <h1 className="pf-h2">{TITLE[q]}</h1>
        <p className="pf-body">{first ? 'First week. Nothing to confirm yet, so anything you tap or say is a start.' : 'Tap what fits. Everything here comes from last week; nothing to invent.'}</p>
      </div>

      <div className="pf-lb">
        {ORDER.map((qq, k) => {
          const state = k === i ? 'now' : k < i ? 'done' : 'ahead'
          return (
            <section key={qq} className={`pf-lb__q ${state === 'now' ? 'is-now' : state === 'done' ? 'is-done' : 'is-ahead'}`} aria-current={state === 'now' ? 'step' : undefined}>
              {state === 'now' ? (
                <>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }} role="group" aria-label={SHORT[qq]}>
                    {picks[qq].map(c => (
                      <button key={c.id} type="button" className="pf-chip pf-chip--haze pf-chip--goal" aria-pressed={c.on} onClick={() => toggle(qq, c.id)}>{c.label}</button>
                    ))}
                    {picks[qq].length === 0 && <p className="pf-small">Nothing on record for this one. Say it or type it, or leave it.</p>}
                  </div>
                  <div className="pf-fieldset" style={{ marginTop: 18 }}>
                    <label className="pf-cap pf-label" htmlFor={`lb-${qq}`}>In your own words, if you want</label>
                    <input id={`lb-${qq}`} className="pf-input" value={notes[qq]} onChange={e => setNotes(n => ({ ...n, [qq]: e.target.value }))} />
                  </div>
                  {qq === 'lesson' && (
                    <div className="pf-fieldset" style={{ marginTop: 18 }}>
                      <span className="pf-cap pf-label">Energy this week</span>
                      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }} role="radiogroup" aria-label="Energy, 1 to 5">
                        {[1, 2, 3, 4, 5].map(n => (
                          <button key={n} type="button" role="radio" aria-checked={energy === n} aria-label={`${n} of 5`} className="pf-day" aria-pressed={n === energy} onClick={() => setEnergy(n)}>{n}</button>
                        ))}
                        <span className="pf-cap" style={{ marginLeft: 6 }}>{energy} <span className="pf-mono">/5</span></span>
                      </div>
                    </div>
                  )}
                  <Speak onText={takeSpeech} />
                </>
              ) : (
                <button type="button" className="pf-lb__row" onClick={() => state === 'done' && setI(k)} disabled={state !== 'done'} aria-label={state === 'done' ? `Back to ${SHORT[qq]}` : `${SHORT[qq]}, coming up`}>
                  <span className="pf-cap pf-mono">{k + 1}</span>
                  <span style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
                    <span style={{ fontSize: 16, fontWeight: 500 }}>{SHORT[qq]}</span>
                    {state === 'done' && <span className="pf-small" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{joined(picks[qq], notes[qq]) || 'Nothing.'}</span>}
                  </span>
                  <span className="pf-cap">{state === 'done' ? 'change' : 'next'}</span>
                </button>
              )}
            </section>
          )
        })}
      </div>

      <Dock primary={{ label: i < 2 ? 'Next' : 'Continue', onClick: next }} secondary={{ label: 'Nothing this week', onClick: skip, kind: 'outline' }} />
    </>
  )
}

// One button. Twenty seconds. The transcript goes to the studio, which sorts it over the three questions.
type Recognizer = { lang: string; interimResults: boolean; continuous: boolean; start: () => void; stop: () => void; onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null; onend: (() => void) | null; onerror: (() => void) | null }
function getRecognizer(): Recognizer | null {
  const w = window as unknown as { SpeechRecognition?: new () => Recognizer; webkitSpeechRecognition?: new () => Recognizer }
  const C = w.SpeechRecognition ?? w.webkitSpeechRecognition
  return C ? new C() : null
}

function Speak({ onText }: { onText: (text: string, sorted: Partial<Record<Q, string>> | null) => void }) {
  const [state, setState] = useState<'idle' | 'listening' | 'sorting' | 'off'>(() => (typeof window !== 'undefined' && getRecognizer() ? 'idle' : 'off'))
  const [left, setLeft] = useState(20)
  const rec = useRef<Recognizer | null>(null)
  const heard = useRef('')

  useEffect(() => {
    if (state !== 'listening') return
    const t = setInterval(() => setLeft(l => { if (l <= 1) { rec.current?.stop(); return 0 } return l - 1 }), 1000)
    return () => clearInterval(t)
  }, [state])

  async function sort(text: string) {
    setState('sorting')
    try {
      const raw = await askClaude({
        system: STUDIO_SYSTEM,
        user: `She spoke her weekly look-back in one breath. Sort it over three fields and return JSON only: {"wins": "...", "drops": "...", "lesson": "..."}. wins = what worked; drops = what she is letting go or stopping; lesson = the one thing she keeps. Keep her words, sentence case, no quotes around them, empty string where nothing fits.\n\nTranscript: ${text}`,
        model: 'haiku', maxTokens: 400,
      })
      onText(text, extractJSON<Partial<Record<Q, string>>>(raw))
    } catch (e) {
      void (e instanceof AIError)
      onText(text, null)
    }
    setState('idle')
  }

  function start() {
    const r = getRecognizer()
    if (!r) { setState('off'); return }
    rec.current = r
    heard.current = ''
    r.lang = 'en-GB'; r.interimResults = false; r.continuous = true
    r.onresult = e => { heard.current = Array.from(e.results).map(rs => rs[0]?.transcript ?? '').join(' ').trim() }
    r.onend = () => { const t = heard.current; rec.current = null; if (t) void sort(t); else setState('idle') }
    r.onerror = () => { rec.current = null; setState('idle') }
    setLeft(20)
    setState('listening')
    r.start()
  }

  if (state === 'off') return null
  return (
    <div style={{ marginTop: 22, display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
      {state === 'idle' && <button type="button" className="pf-btn pf-btn--secondary" onClick={start}>Say it instead</button>}
      {state === 'listening' && (
        <>
          <button type="button" className="pf-btn pf-btn--secondary" onClick={() => rec.current?.stop()}>Done talking</button>
          <span className="pf-small" aria-live="polite"><span className="pf-mono">{left} s</span> left. Say what worked, what you let go, what you keep.</span>
        </>
      )}
      {state === 'sorting' && (
        <>
          <ApertureLoader size={24} color="var(--depth-3)" />
          <span className="pf-small">Sorting it over the three.</span>
        </>
      )}
    </div>
  )
}
