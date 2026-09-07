// Goal progress as a bar (founder decision, 4 September 2026). Hairline grammar still holds:
// a dotted scaffold under it, a dashed tick where the target is, a solid value that deepens through the
// sage scale as it grows. When it lands, the fill goes Depth and the Ink dot arrives at the end: the full stop.
import type { CSSProperties } from 'react'
import { depthFor } from '../lib/pf/depth'

export function DepthBar({ pct, landed = false, height = 6, style, className }: { pct: number; landed?: boolean; height?: number; style?: CSSProperties; className?: string }) {
  const p = Math.min(100, Math.max(0, pct))
  const full = landed || p >= 100
  return (
    <div className={`pf-bar ${full ? 'is-full' : ''} ${className ?? ''}`} style={{ ...style, height: Math.max(height, 12) }} aria-hidden="true">
      <span className="pf-bar__track" />
      <span className="pf-bar__target" />
      <span className="pf-bar__fill" style={{ height, clipPath: `inset(0 ${100 - p}% 0 0 round 999px)`, background: full ? 'var(--depth-4)' : depthFor(p) }} />
      <span className="pf-bar__dot" style={{ width: height + 4, height: height + 4 }} />
    </div>
  )
}

