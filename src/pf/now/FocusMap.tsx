// The note: her focus as the plan map from prettyfocussed.com, once per lane. Professional focus, personal focus,
// three blocks each on atmosphere plates, area proportional to what is left, the number large, the goal under it.
// An empty slot says there is room, and opens the goals.
import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useFocusStore } from '../../store/pf/focusStore'
import { useGoalStore, goalProgress, LANE_LABEL, MAX_PER_LANE } from '../../store/pf/goalStore'
import type { Goal90, Lane } from '../../store/pf/goalStore'
import { yearInfo, monthKey, quarterInfo } from '../../lib/pf/week'

interface Blk { key: string; name: string; hrs: string; pct: number | null; focus: string; weight: number; plate: 1 | 2 | 3; empty?: boolean }

export function FocusMap() {
  const y = yearInfo()
  const years = useFocusStore(s => s.years)
  const months = useFocusStore(s => s.months)
  const plan = years[y.key] ?? {}
  const mp = months[monthKey()] ?? { goalIds: [] }
  return (
    <div className="pf-note">
      <span className="pf-glass" style={{ justifySelf: 'start' }}><b>{plan.word || 'Your focus'}</b>{plan.word && <span className="pf-mono">{y.key}</span>}</span>
      <LaneMap lane="business" chosen={mp.goalIds} />
      <LaneMap lane="life" chosen={mp.goalIds} />
      {mp.focus && <p className="pf-small pf-note__line">{mp.focus}</p>}
    </div>
  )
}

function LaneMap({ lane, chosen }: { lane: Lane; chosen: string[] }) {
  const goals = useGoalStore(s => s.goals)
  const q = quarterInfo().key
  const open = goals.filter(g => g.quarter === q && g.lane === lane && !g.done)
  const picked = chosen.map(id => open.find(g => g.id === id)).filter((g): g is Goal90 => !!g)
  const rest = open.filter(g => !picked.includes(g))
  const three = [...picked, ...rest].slice(0, MAX_PER_LANE)
  const ref = useRef<HTMLDivElement>(null)
  const [wide, setWide] = useState(false)
  useEffect(() => {
    const el = ref.current; if (!el || !('ResizeObserver' in window)) return
    const ro = new ResizeObserver(es => es.forEach(e => setWide(e.contentRect.width >= 620)))
    ro.observe(el); return () => ro.disconnect()
  }, [])

  const blocks: Blk[] = three.map((g, i) => {
    const pct = goalProgress(g)
    return { key: g.id, name: LANE_LABEL[lane], hrs: g.target ? `${g.current ?? 0} / ${g.target} ${g.unit ?? ''}`.trim() : 'open', pct, focus: g.title, weight: pct === null ? 50 : Math.max(12, 100 - pct), plate: ([1, 2, 3] as const)[i] }
  })
  while (blocks.length < MAX_PER_LANE) blocks.push({ key: `empty-${blocks.length}`, name: LANE_LABEL[lane], hrs: '', pct: null, focus: blocks.length === 0 ? 'Nothing here yet.' : 'Room for one more.', weight: 22, plate: ([1, 2, 3] as const)[blocks.length], empty: true })
  const sorted = [...blocks].sort((a, b) => b.weight - a.weight)
  const t = sorted.reduce((s, b) => s + b.weight, 0) || 1
  const a = sorted[0].weight / t
  const bc = sorted[1].weight + sorted[2].weight || 1
  const b = sorted[1].weight / bc, c = sorted[2].weight / bc
  const fr = (x: number) => `minmax(84px, ${(x * 100).toFixed(3)}fr)`
  const style = { '--tall-rows': `${fr(a)} ${fr(1 - a)}`, '--tall-cols': `${fr(b)} ${fr(c)}`, '--wide-cols': `${fr(a)} ${fr(1 - a)}`, '--wide-rows': `${fr(b)} ${fr(c)}` } as React.CSSProperties

  return (
    <div className="pf-note__lane">
      <p className="pf-over" style={{ padding: '0 4px' }}>{LANE_LABEL[lane]} focus · {three.length} of {MAX_PER_LANE}</p>
      <div ref={ref} className={`pf-map pf-map--lane ${wide ? 'is-wide' : ''}`} style={style}>
        {sorted.map(bk => bk.empty ? (
          <Link key={bk.key} to="/goals" className="pf-blk pf-blk--empty" data-plate={bk.plate} aria-label={`${bk.focus} Set a ${LANE_LABEL[lane].toLowerCase()} goal`}>
            <div className="b-top"><p className="b-name">{bk.name}</p></div>
            <div className="b-bot"><p className="b-focus">{bk.focus}</p></div>
          </Link>
        ) : (
          <div key={bk.key} className="pf-blk" data-plate={bk.plate}>
            <div className="b-top">
              <p className="b-name">{bk.name}</p>
              {bk.hrs && <p className="b-hrs">{bk.hrs}</p>}
            </div>
            <div className="b-bot">
              {bk.pct !== null ? <p className="b-pct pf-num">{bk.pct}<span className="pf-unit">%</span></p> : null}
              <p className="b-focus">{bk.focus}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
