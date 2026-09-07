// Depth helpers for goal progress bars: the colour step for a percentage, and a number that pops when it changes.
import { useEffect, useRef, useState } from 'react'

export function depthFor(pct: number): string {
  if (pct >= 100) return 'var(--depth-4)'
  if (pct >= 66) return 'var(--depth-3)'
  if (pct >= 33) return 'var(--depth-2)'
  return 'var(--depth-1)'
}

// A number that pops when it changes: 1 to 1.08 and back, 200ms, transform only.
export function usePop(value: number): boolean {
  const [pop, setPop] = useState(false)
  const last = useRef(value)
  useEffect(() => {
    if (last.current === value) return
    last.current = value
    setPop(true)
    const t = setTimeout(() => setPop(false), 220)
    return () => clearTimeout(t)
  }, [value])
  return pop
}
