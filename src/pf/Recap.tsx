// Recap: the Friday reward. What moved, what she protected, what she left. Honest, and shareable.
import { useEffect, useId, useState } from 'react'
import type { CSSProperties } from 'react'
import { Link } from 'react-router-dom'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useWeekStore } from '../store/pf/weekStore'
import type { Recap as RecapText, WeekPlan } from '../store/pf/weekStore'
import { useRitualStore } from '../store/pf/ritualStore'
import { useRevenueStore } from '../store/pf/revenueStore'
import { useSalesStore } from '../store/pf/salesStore'
import { writeRecap, localRecap } from '../lib/pf/assistant'
import { AIError } from '../lib/ai'
import { firstName } from '../lib/workspace'
import { weekKey, prevWeekKey, nextWeekKey, weekNumber, weekLabel, weekDatesFromKey } from '../lib/pf/week'
import { ApertureLoader } from './Aperture'
import { CARD, CARD_LISTS, STILL, PILL_TEXT, shareRecapCard, downloadRecapCard } from './recapCard'
import type { RecapCardOptions } from './recapCard'

const GENERIC = 'The assistant did not answer. Try again in a moment.'

export function Recap() {
  const [key, setKey] = useState(() => weekKey())
  const week = useWeekStore(s => s.weeks[key])
  const n = weekNumber(key)
  const isNow = key === weekKey()

  return (
    <div className="pf-enter pf-stack-lg" style={{ gap: 44 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <p className="pf-over">Recap · week {n}</p>
        <div style={{ display: 'flex', gap: 8 }}>
          <button type="button" className="pf-chev" aria-label="Previous week" onClick={() => setKey(prevWeekKey(key))}>
            <ChevronLeft size={16} strokeWidth={1.5} aria-hidden="true" />
          </button>
          <button type="button" className="pf-chev" aria-label="Next week" disabled={isNow} onClick={() => setKey(nextWeekKey(key))}>
            <ChevronRight size={16} strokeWidth={1.5} aria-hidden="true" />
          </button>
        </div>
      </div>
      {week && week.priorities.length > 0 ? <WeekRecap key={key} week={week} /> : <EmptyWeek isNow={isNow} />}
    </div>
  )
}

function EmptyWeek({ isNow }: { isNow: boolean }) {
  return (
    <header className="pf-stack" style={{ gap: 14 }}>
      <h1 className="pf-h1">Nothing to look back on yet.</h1>
      <p className="pf-body">{isNow ? 'The session sets the three. Friday reads them back.' : 'No plan that week.'}</p>
      {isNow && <div style={{ marginTop: 10 }}><Link to="/session" className="pf-btn pf-btn--primary">Start the session</Link></div>}
    </header>
  )
}

// One line on the card, tapped on or off. Everything comes from the week; nothing to invent.
interface Line { id: string; text: string; on: boolean }
const pick = (lines: Line[]) => lines.filter(l => l.on).map(l => l.text)

// The week read back: a draft from the data at once, the studio's words on top when it is connected,
// every line a chip she confirms or taps away, the card drawn live from what stands. One pill: share it.
function WeekRecap({ week }: { week: WeekPlan }) {
  const setRecap = useWeekStore(s => s.setRecap)
  const rit = useRitualStore()
  const rev = useRevenueStore()
  const leads = useSalesStore(s => s.leads)
  const dates = weekDatesFromKey(week.key)
  const n = weekNumber(week.key)
  const fmt = (x: number) => new Intl.NumberFormat('en-IE', { maximumFractionDigits: 0 }).format(x)

  const done = week.priorities.filter(p => p.done)
  const open = week.priorities.filter(p => !p.done)
  const ritualRows = rit.rituals.map(r => ({ id: r.id, name: r.name, count: rit.weekCount(r.id, dates), times: r.timesPerWeek }))
  const ritualDone = ritualRows.reduce((a, r) => a + Math.min(r.count, r.times), 0)
  const ritualTotal = ritualRows.reduce((a, r) => a + r.times, 0)
  const moved = rev.revenueBetween(dates[0], dates[6])
  const won = leads.filter(l => l.stage === 'won' && l.closedAt && l.closedAt >= dates[0] && l.closedAt <= dates[6])
  const blocks = Object.values(week.days).flatMap(d => d.blocks)
  const restKept = blocks.filter(b => b.kind === 'rest' && b.done).length
  const seed = week.recap ?? localRecap(week)

  // Candidate lines per list, the draft's own lines switched on.
  const build = (): Record<'moved' | 'protected' | 'dropped', Line[]> => {
    const has = (list: string[], t: string) => list.some(x => x.toLowerCase() === t.toLowerCase())
    const mk = (prefix: string, texts: string[], onList: string[]) => texts.map((t, i) => ({ id: `${prefix}-${i}`, text: t, on: has(onList, t) }))
    const movedC = [...done.map(p => p.title), ...won.map(l => `Won: ${l.name}`), ...blocks.filter(b => b.done && b.kind === 'priority' && !week.priorities.some(p => p.title === b.title)).map(b => b.title)]
    const protC = [...ritualRows.filter(r => r.count >= r.times).map(r => r.name), ...ritualRows.filter(r => r.count > 0 && r.count < r.times).map(r => `${r.name}, ${r.count} of ${r.times}`), ...(restKept ? [`Rest, ${restKept} ${restKept === 1 ? 'block' : 'blocks'}`] : [])]
    const dropC = [...open.map(p => p.title), ...(week.dropSuggestion ? [week.dropSuggestion] : []), ...ritualRows.filter(r => r.count === 0).map(r => r.name)]
    const uniq = (a: string[]) => a.filter((t, i) => a.findIndex(x => x.toLowerCase() === t.toLowerCase()) === i)
    const withSeed = (c: string[], s: string[]) => uniq([...c, ...s])
    return {
      moved: mk('m', withSeed(movedC, seed.moved), seed.moved),
      protected: mk('p', withSeed(protC, seed.protected), seed.protected),
      dropped: mk('d', withSeed(dropC, seed.dropped), seed.dropped),
    }
  }
  const [lines, setLines] = useState(build)
  const headlines = [
    done.length === week.priorities.length ? 'Three of three. They stand.' : `${done.length} of ${week.priorities.length} moved.`,
    ritualDone >= ritualTotal && ritualTotal > 0 ? 'The life side held.' : 'A week to learn from.',
    moved > 0 ? `${fmt(moved)} eur moved.` : 'Quiet on the money, steady on the rest.',
  ]
  const [headline, setHeadline] = useState(seed.headline)
  const [ownHead, setOwnHead] = useState('')
  const [hint, setHint] = useState(seed.nextWeekHint)
  const [busy, setBusy] = useState(!week.recap)
  const [note, setNote] = useState<string | null>(null)
  const [sharing, setSharing] = useState(false)
  const [status, setStatus] = useState<string | null>(null)

  // The studio writes on arrival when nothing is written yet; not connected, the draft stands quietly.
  useEffect(() => {
    if (week.recap) return
    let live = true
    const t = setTimeout(async () => {
      try {
        const r = await writeRecap(week)
        if (!live) return
        setHeadline(r.headline)
        setHint(r.nextWeekHint)
        setLines(l => ({
          moved: mergeIn(l.moved, r.moved, 'm'), protected: mergeIn(l.protected, r.protected, 'p'), dropped: mergeIn(l.dropped, r.dropped, 'd'),
        }))
        setNote('The studio wrote this. Tap any line away, or pick another headline.')
      } catch (e) {
        if (live && !(e instanceof AIError)) setNote(GENERIC)
      } finally { if (live) setBusy(false) }
    }, 0)
    return () => { live = false; clearTimeout(t) }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  function toggle(k: 'moved' | 'protected' | 'dropped', id: string) { setLines(l => ({ ...l, [k]: l[k].map(x => x.id === id ? { ...x, on: !x.on } : x) })) }
  const current: RecapText = { headline: ownHead.trim() || headline, moved: pick(lines.moved), protected: pick(lines.protected), dropped: pick(lines.dropped), nextWeekHint: hint, generatedAt: week.recap?.generatedAt ?? new Date().toISOString() }
  const cardOpts: RecapCardOptions = { recap: current, weekNumber: n, weekLabel: weekLabel(week.key), name: firstName() }

  function keep() { setRecap(week.key, current); setStatus('Kept. The week is closed.') }
  async function share(how: 'share' | 'download') {
    setRecap(week.key, current)
    setSharing(true); setStatus(null)
    try {
      if (how === 'download') { await downloadRecapCard(cardOpts); setStatus('Saved as a PNG.') }
      else if ((await shareRecapCard(cardOpts)) === 'downloaded') setStatus('No share sheet here. Saved as a PNG instead.')
      else setStatus('Shared.')
    } catch (e) {
      setStatus(e instanceof Error ? e.message : 'The card could not be drawn. Try again in a moment.')
    } finally { setSharing(false) }
  }

  const lead = `${weekLabel(week.key)}. ${done.length} of ${week.priorities.length} priorities${ritualTotal ? `, ${ritualDone} of ${ritualTotal} habits` : ''}${moved > 0 ? `, ${fmt(moved)} eur moved` : ''}. ${week.recap ? 'Closed.' : busy ? 'Reading it back.' : 'Confirm what stands, then share it or keep it.'}`

  return (
    <>
      <header className="pf-stack" style={{ gap: 14 }}>
        <h1 className="pf-h1">{current.headline}</h1>
        <p className="pf-body">{lead}</p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 22, flexWrap: 'wrap', marginTop: 10 }}>
          <button type="button" className="pf-btn pf-btn--primary" disabled={sharing || busy} onClick={() => share('share')}>{sharing ? <ApertureLoader size={20} color="var(--action-text)" /> : 'Share the card'}</button>
          <button type="button" className="pf-btn pf-btn--secondary" disabled={busy} onClick={keep}>Keep it here</button>
        </div>
        {status && <p className="pf-small pf-enter" role="status">{status}</p>}
      </header>

      <section aria-label="Headline" className={busy ? 'pf-dim' : ''}>
        <span className="pf-cap pf-label">The line</span>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {[headline, ...headlines].filter((h, i, a) => a.indexOf(h) === i).map(h => (
            <button key={h} type="button" className="pf-chip pf-chip--haze pf-chip--goal" aria-pressed={!ownHead.trim() && h === headline} onClick={() => { setHeadline(h); setOwnHead('') }}>{h}</button>
          ))}
        </div>
        <div className="pf-fieldset" style={{ marginTop: 14 }}>
          <label className="pf-cap pf-label" htmlFor="recap-own">Or your own line</label>
          <input id="recap-own" className="pf-input" value={ownHead} onChange={e => setOwnHead(e.target.value)} />
        </div>
      </section>

      {CARD_LISTS.map(l => (
        <section key={l.key} aria-label={l.label} className={busy ? 'pf-dim' : ''}>
          <span className="pf-cap pf-label">{l.label}</span>
          {lines[l.key].length === 0 ? <p className="pf-small">{STILL}</p> : (
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {lines[l.key].map(x => <button key={x.id} type="button" className="pf-chip pf-chip--haze pf-chip--goal" aria-pressed={x.on} onClick={() => toggle(l.key, x.id)}>{x.text}</button>)}
            </div>
          )}
        </section>
      ))}

      <section aria-label="Next week" className={busy ? 'pf-dim' : ''}>
        <label className="pf-cap pf-label" htmlFor="recap-hint">Next week, in one line</label>
        <input id="recap-hint" className="pf-input" value={hint} onChange={e => setHint(e.target.value)} />
        {note && !busy && <p className="pf-small" style={{ marginTop: 12 }}>{note}</p>}
      </section>

      <section aria-label="The card">
        <span className="pf-cap pf-label">The card, as it stands</span>
        <RecapCard recap={current} weekNumber={n} />
        <p className="pf-small" style={{ marginTop: 12 }}>
          <button type="button" className="pf-btn pf-btn--tertiary" style={{ padding: 0, minHeight: 0, display: 'inline' }} disabled={sharing} onClick={() => share('download')}>Save as PNG</button>
          {moved > 0 && <> · Revenue stays here, not on the card.</>}
        </p>
      </section>

      <div className="pf-dim">
        <HonestVersion week={week} rituals={ritualRows} />
      </div>
    </>
  )
}

// The studio's lines join the chips, switched on; hers keep their state.
function mergeIn(existing: Line[], incoming: string[], prefix: string): Line[] {
  const out = existing.map(l => ({ ...l, on: l.on || incoming.some(t => t.toLowerCase() === l.text.toLowerCase()) }))
  incoming.forEach((t, i) => { if (!out.some(l => l.text.toLowerCase() === t.toLowerCase())) out.push({ id: `${prefix}-ai-${i}`, text: t, on: true }) })
  return out
}

// ── The card, on screen. Brand-locked: it looks the same in every room and every theme. ──

const cq = (n: number) => `${((n / CARD.W) * 100).toFixed(3)}cqw`
const capsStyle: CSSProperties = { fontSize: cq(CARD.label), lineHeight: 1, letterSpacing: '0.06em', color: CARD.muted, fontWeight: 500 }

function RecapCard({ recap, weekNumber }: { recap: RecapText; weekNumber: number }) {
  const id = useId()
  return (
    <div style={{ containerType: 'inline-size', maxWidth: 400 }}>
      <div aria-label={`Week ${weekNumber} card`} role="img" style={{
        aspectRatio: '4 / 5', boxSizing: 'border-box', padding: cq(CARD.M), borderRadius: 'var(--r-card)', overflow: 'hidden',
        background: `radial-gradient(60% 50% at 18% 12%, rgb(${CARD.veil} / .6), transparent 70%) ${CARD.bone}`,
        color: CARD.ink, fontFamily: "'Instrument Sans', 'Inter', system-ui, sans-serif", fontWeight: 400,
        display: 'flex', flexDirection: 'column', boxShadow: 'var(--sh-md)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <svg viewBox="0 0 100 100" aria-hidden="true" style={{ width: cq(CARD.mark), height: cq(CARD.mark), display: 'block' }}>
            <defs>
              <linearGradient id={`${id}-g`} x1="0.15" y1="0" x2="0.85" y2="1">
                <stop offset="0" stopColor={CARD.sage} /><stop offset=".55" stopColor={CARD.sageMid} /><stop offset="1" stopColor={CARD.focus} />
              </linearGradient>
            </defs>
            <circle cx="50" cy="50" r="42" fill="none" stroke={`url(#${id}-g)`} strokeWidth="10" strokeLinecap="round"
              strokeDasharray="220 300" transform="rotate(-90 50 50)" />
            <circle cx="50" cy="50" r="10" fill={CARD.ink} />
          </svg>
          <span style={{ ...capsStyle, fontSize: cq(CARD.week), letterSpacing: `${CARD.weekTrack}em`, textTransform: 'uppercase' }}>
            Week <span className="pf-mono" style={{ fontWeight: 400 }}>{weekNumber}</span>
          </span>
        </div>

        <p style={{
          margin: 0, marginTop: cq(CARD.headTop - CARD.M - CARD.mark), fontSize: cq(CARD.head), lineHeight: `${CARD.headLh / CARD.head}`,
          letterSpacing: `${CARD.headTrack}em`, fontWeight: 500, color: CARD.ink,
          display: '-webkit-box', WebkitLineClamp: CARD.headLines, WebkitBoxOrient: 'vertical', overflow: 'hidden',
        }}>{recap.headline || 'This week held.'}</p>

        <div style={{ marginTop: cq(CARD.listsGap), flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', gap: cq(CARD.sectionGap), overflow: 'hidden' }}>
          {CARD_LISTS.map(l => {
            const items = recap[l.key].slice(0, 3)
            return (
              <div key={l.key}>
                <span style={{ ...capsStyle, display: 'block', marginBottom: cq(CARD.labelGap) }}>{l.label}</span>
                {items.length === 0 ? (
                  <span style={{ display: 'block', fontSize: cq(CARD.item), lineHeight: `${CARD.itemLh / CARD.item}`, color: CARD.muted }}>{STILL}</span>
                ) : items.map((it, i) => (
                  <span key={i} style={{ display: 'block', fontSize: cq(CARD.item), lineHeight: `${CARD.itemLh / CARD.item}`, color: CARD.ink, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{it}</span>
                ))}
              </div>
            )
          })}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: cq(40), marginTop: cq(CARD.footGap) }}>
          <span style={{
            fontSize: cq(CARD.hint), lineHeight: `${CARD.hintLh / CARD.hint}`, color: CARD.slate,
            display: '-webkit-box', WebkitLineClamp: CARD.hintLines, WebkitBoxOrient: 'vertical', overflow: 'hidden',
          }}>{recap.nextWeekHint}</span>
          <span style={{
            flexShrink: 0, display: 'inline-flex', alignItems: 'center', height: cq(CARD.pillH), padding: `0 ${cq(CARD.pillPad)}`,
            borderRadius: 999, background: CARD.ink, color: CARD.bone, fontSize: cq(CARD.pillText), fontWeight: 500, whiteSpace: 'nowrap',
          }}>{PILL_TEXT}</span>
        </div>
      </div>
    </div>
  )
}

// ── Under the card: the numbers the card leaves out. ──────────────────

function HonestVersion({ week, rituals }: { week: WeekPlan; rituals: { id: string; name: string; count: number; times: number }[] }) {
  const rv = week.review
  return (
    <section>
      <span className="pf-cap pf-label">The honest version</span>
      <div className="pf-rows">
        {week.priorities.map(p => (
          <div key={p.id} className={`pf-row ${p.done ? 'pf-faded' : ''}`} style={{ gridTemplateColumns: 'auto minmax(0,1fr)' }}>
            <i aria-hidden="true" style={{ display: 'block', width: 10, height: 10, borderRadius: '50%', border: '1px solid var(--border)', background: p.done ? 'var(--text)' : 'transparent', borderColor: p.done ? 'var(--text)' : undefined }} />
            <span style={{ fontSize: 15 }}>{p.title}</span>
          </div>
        ))}
        {rituals.map(r => (
          <div key={r.id} className="pf-row" style={{ gridTemplateColumns: 'minmax(0,1fr) auto' }}>
            <span style={{ fontSize: 15, color: 'var(--text-2)' }}>{r.name}</span>
            <span className="pf-mono" style={{ fontSize: 13, color: r.count >= r.times ? 'var(--text-brand)' : 'var(--text-3)' }}>{r.count}/{r.times}</span>
          </div>
        ))}
      </div>
      {rv && (
        <div className="pf-stack" style={{ marginTop: 18 }}>
          {rv.wins && <p className="pf-small"><span className="pf-cap" style={{ display: 'block' }}>Worked</span>{rv.wins}</p>}
          {rv.drops && <p className="pf-small"><span className="pf-cap" style={{ display: 'block' }}>Let go</span>{rv.drops}</p>}
          {rv.lesson && <p className="pf-small"><span className="pf-cap" style={{ display: 'block' }}>Lesson</span>{rv.lesson}</p>}
          <p className="pf-small"><span className="pf-cap" style={{ display: 'block', marginBottom: 4 }}>Energy</span>
            <span className="pf-num pf-num--sm">{rv.energy}<span className="pf-unit">/5</span></span>
          </p>
        </div>
      )}
    </section>
  )
}
