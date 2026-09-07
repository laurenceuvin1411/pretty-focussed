// The day as one timeline: planned blocks and calendar events, what is on now, what comes next.
import type { Block } from '../../store/pf/weekStore'

export interface Slot { id: string; start: string; end: string; title: string; kind: Block['kind']; done: boolean; block?: Block }

export function slotsFor(blocks: Block[], events: { id: string; summary: string; start: string; end: string }[], date: string): Slot[] {
  const fromBlocks: Slot[] = blocks.map(b => ({ id: b.id, start: b.start, end: b.end, title: b.title, kind: b.kind, done: b.done, block: b }))
  const fromEvents: Slot[] = events
    .filter(e => e.start.slice(0, 10) === date && !blocks.some(b => b.title === e.summary))
    .map(e => ({ id: e.id, start: e.start.slice(11, 16), end: (e.end || e.start).slice(11, 16), title: e.summary, kind: 'event' as const, done: false }))
  return [...fromBlocks, ...fromEvents].filter(s => s.start && s.end).sort((a, b) => a.start.localeCompare(b.start))
}

export function currentSlot(slots: Slot[], now: string): Slot | undefined {
  return slots.find(s => s.start <= now && now < s.end && !s.done)
}
export function nextSlot(slots: Slot[], now: string, current?: Slot): Slot | undefined {
  return slots.find(s => s.start > now && s.id !== current?.id && !s.done) ?? slots.find(s => s.start >= now && s.id !== current?.id && !s.done)
}
export function fmtMin(n: number): string {
  if (n < 60) return `${n} min`
  const h = Math.floor(n / 60), m = n % 60
  return m ? `${h} h ${m} min` : `${h} h`
}
