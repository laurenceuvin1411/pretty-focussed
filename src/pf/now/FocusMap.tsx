// The note: her focus as the plan map from prettyfocussed.com. Three blocks on atmosphere plates,
// area proportional to weight, the number large, her words under it. It reads at a glance and stays in view.
import { useEffect, useRef, useState } from 'react'
import { useFocusStore } from '../../store/pf/focusStore'
import { useGoalStore, goalProgress, LANE_LABEL } from '../../store/pf/goalStore'
import type { Goal90 } from '../../store/pf/goalStore'
import { yearInfo, monthKey, monthInfo, quarterInfo } from '../../lib/pf/week'

interface Blk { key: string; name: string; hrs: string; pct: number | null; focus: string; weight: number; plate: 1 | 2 | 3 }

export function FocusMap() {
  const y = yearInfo()
  const month = monthKey()
  const m = monthInfo(month)
  const years = useFocusStore(s => s.years)
  const months = useFocusStore(s => s.months)
  const obstacles = useFocusStore(s => s.obstacles)
  const goals = useGoalStore(s => s.goals)
  const plan = years[y.key] ?? {}
  const mp = months[month] ?? { goalIds: [] }
  const q = quarterInfo().key
  const open = goals.filter(g => g.quarter === q && !g.done)
  const chosen = mp.goalIds.map(id => open.find(g => g.id === id)).filter((g): g is Goal90 => !!g)
  const three = (chosen.length ? chosen : open).slice(0, 3)
  const ref = useRef<HTMLDivElement>(null)
  const [wide, setWide] = useState(false)
  useEffect(() => {
    const el = ref.current; if (!el || !('ResizeObserver' in window)) return
    const ro = new ResizeObserver(es => es.forEach(e => setWide(e.contentRect.width >= 620)))
    ro.observe(el); return () => ro.disconnect()
  }, [])

  // Weight: what is left on a measurable goal counts more; a goal without a number sits at the median.
  const blocks: Blk[] = three.map((g, i) => {
    const pct = goalProgress(g)
    const left = pct === null ? 50 : Math.max(10, 100 - pct)
    return { key: g.id, name: LANE_LABEL[g.lane], hrs: g.target ? `${g.current ?? 0} / ${g.target} ${g.unit ?? ''}`.trim() : 'open', pct, focus: g.title, weight: left, plate: ([1, 2, 3] as const)[i] }
  })
  if (blocks.length === 0) {
    blocks.push({ key: 'word', name: y.key, hrs: `${y.daysLeft} days left`, pct: null, focus: plan.word ? `${plan.word}.` : 'One word for the year.', weight: 60, plate: 1 })
    blocks.push({ key: 'month', name: m.name, hrs: `${m.daysLeft} days left`, pct: null, focus: mp.focus || 'One focus for the month.', weight: 25, plate: 2 })
    blocks.push({ key: 'way', name: 'In the way', hrs: '', pct: null, focus: obstacles.find(o => o.on)?.text || 'Nothing named yet.', weight: 15, plate: 3 })
  }
  while (blocks.length < 3) blocks.push({ key: `pad${blocks.length}`, name: blocks.length === 1 ? m.name : 'In the way', hrs: '', pct: null, focus: blocks.length === 1 ? (mp.focus || 'One focus for the month.') : (obstacles.find(o => o.on)?.text || 'Nothing named yet.'), weight: 20, plate: ([1, 2, 3] as const)[blocks.length] })
  const sorted = [...blocks].sort((a, b) => b.weight - a.weight)
  const t = sorted.reduce((s, b) => s + b.weight, 0) || 1
  const a = sorted[0].weight / t
  const bc = sorted[1].weight + sorted[2].weight || 1
  const b = sorted[1].weight / bc, c = sorted[2].weight / bc
  const fr = (x: number) => `minmax(84px, ${(x * 100).toFixed(3)}fr)`
  const style = { '--tall-rows': `${fr(a)} ${fr(1 - a)}`, '--tall-cols': `${fr(b)} ${fr(c)}`, '--wide-cols': `${fr(a)} ${fr(1 - a)}`, '--wide-rows': `${fr(b)} ${fr(c)}` } as React.CSSProperties

  return (
    <div className="pf-note">
      <span className="pf-glass pf-note__tag"><b>{plan.word || 'Your focus'}</b>{plan.word && <span className="pf-mono">{y.key}</span>}</span>
      <div ref={ref} className={`pf-map ${wide ? 'is-wide' : ''}`} style={style}>
        {sorted.map(bk => (
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
      {mp.focus && three.length > 0 && <p className="pf-small pf-note__line">{mp.focus}</p>}
    </div>
  )
}
