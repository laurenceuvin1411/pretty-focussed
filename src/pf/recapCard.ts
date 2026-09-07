// The recap card: a Bone ground with a faint depth field, the mark, one headline, three lists, one Ink pill.
// The same numbers draw it twice: on screen as a div (Recap.tsx, in cqw) and here on a 1080x1350 canvas for sharing.
import type { Recap } from '../store/pf/weekStore'

export interface RecapCardOptions {
  recap: Recap
  weekNumber: number
  weekLabel: string
  name: string
}

// Sizes in canvas pixels on a 1080 wide card. The preview divides by W to get cqw.
export const CARD = {
  W: 1080, H: 1350, M: 72,
  mark: 150,
  week: 26, weekTrack: 0.14,
  headTop: 292, head: 84, headLh: 92, headTrack: -0.03, headLines: 3,
  listsGap: 48, label: 26, labelTrack: 0.14, labelGap: 12, item: 38, itemLh: 48, sectionGap: 28,
  hint: 34, hintLh: 42, hintLines: 2, pillText: 30, pillH: 54, pillPad: 30, footGap: 28,
  bone: '#F4F2EE', veil: '226 231 218', ink: '#14150F', muted: '#6B675F', slate: '#55534E',
  sage: '#98A886', sageMid: '#8B9C79', focus: '#6E7F5E',
} as const

export const CARD_LISTS: readonly { key: 'moved' | 'protected' | 'dropped'; label: string }[] = [
  { key: 'moved', label: 'Moved' },
  { key: 'protected', label: 'Protected' },
  { key: 'dropped', label: 'Left' },
]
export const STILL = 'Still.'
export const PILL_TEXT = 'Pretty Focussed'

export function recapCardFileName(weekNumber: number): string {
  return `pretty-focussed-week-${weekNumber}.png`
}

// ── Fonts ─────────────────────────────────────────────────────────────

type Ctx = CanvasRenderingContext2D & { letterSpacing?: string }
interface Fonts { sans: string; mono: string }

const FALLBACK: Fonts = { sans: 'system-ui, sans-serif', mono: 'ui-monospace, monospace' }

async function fontReady(spec: string): Promise<boolean> {
  try {
    const timeout = new Promise<FontFace[]>(res => setTimeout(() => res([]), 4000))
    const faces = await Promise.race([document.fonts.load(spec), timeout])
    return faces.length > 0
  } catch {
    return false
  }
}

async function loadFonts(): Promise<Fonts> {
  if (typeof document === 'undefined' || !document.fonts) return FALLBACK
  const [medium, regular, mono] = await Promise.all([
    fontReady('500 60px "Instrument Sans"'),
    fontReady('400 30px "Instrument Sans"'),
    fontReady('400 24px "JetBrains Mono"'),
  ])
  return {
    sans: medium || regular ? `"Instrument Sans", ${FALLBACK.sans}` : FALLBACK.sans,
    mono: mono ? `"JetBrains Mono", ${FALLBACK.mono}` : FALLBACK.mono,
  }
}

// ── Text helpers ──────────────────────────────────────────────────────

function setTracking(ctx: Ctx, em: number, px: number) {
  if ('letterSpacing' in ctx) ctx.letterSpacing = `${em * px}px`
}

function ellipsize(ctx: Ctx, text: string, maxWidth: number): string {
  if (ctx.measureText(text).width <= maxWidth) return text
  let t = text
  while (t.length > 1 && ctx.measureText(t + '…').width > maxWidth) t = t.slice(0, -1).trimEnd()
  return t + '…'
}

function wrapLines(ctx: Ctx, text: string, maxWidth: number, maxLines: number): string[] {
  const words = text.trim().split(/\s+/).filter(Boolean)
  const lines: string[] = []
  let cur = ''
  for (const w of words) {
    const test = cur ? `${cur} ${w}` : w
    if (!cur || ctx.measureText(test).width <= maxWidth) cur = test
    else { lines.push(cur); cur = w }
  }
  if (cur) lines.push(cur)
  if (lines.length <= maxLines) return lines
  const kept = lines.slice(0, maxLines)
  kept[maxLines - 1] = ellipsize(ctx, [kept[maxLines - 1], ...lines.slice(maxLines)].join(' '), maxWidth)
  return kept
}

// Letterspaced caps, one character at a time, so tracking is identical in every browser.
interface CapsRun { text: string; font: string }
function drawCaps(ctx: Ctx, runs: CapsRun[], x: number, y: number, spacing: number, align: 'left' | 'right') {
  const glyphs = runs.flatMap(r => [...r.text.toUpperCase()].map(c => ({ c, font: r.font })))
  const widths = glyphs.map(g => { ctx.font = g.font; return ctx.measureText(g.c).width })
  const total = widths.reduce((a, b) => a + b, 0) + spacing * Math.max(0, glyphs.length - 1)
  let cx = align === 'left' ? x : x - total
  ctx.textAlign = 'left'
  glyphs.forEach((g, i) => { ctx.font = g.font; ctx.fillText(g.c, cx, y); cx += widths[i] + spacing })
}

function roundedRect(ctx: Ctx, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + w - r, y)
  ctx.quadraticCurveTo(x + w, y, x + w, y + r)
  ctx.lineTo(x + w, y + h - r)
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
  ctx.lineTo(x + r, y + h)
  ctx.quadraticCurveTo(x, y + h, x, y + h - r)
  ctx.lineTo(x, y + r)
  ctx.quadraticCurveTo(x, y, x + r, y)
  ctx.closePath()
}

// The mark: a sage arc sweeping 300 degrees clockwise from twelve, and one Ink dot that never moves.
function drawMark(ctx: Ctx, cx: number, cy: number, size: number) {
  const r = size * 0.42
  const g = ctx.createLinearGradient(cx - r, cy - r, cx + r, cy + r)
  g.addColorStop(0, CARD.sage)
  g.addColorStop(0.55, CARD.sageMid)
  g.addColorStop(1, CARD.focus)
  ctx.beginPath()
  ctx.arc(cx, cy, r, -Math.PI / 2, -Math.PI / 2 + (300 * Math.PI) / 180, false)
  ctx.strokeStyle = g
  ctx.lineWidth = size * 0.1
  ctx.lineCap = 'round'
  ctx.stroke()
  ctx.beginPath()
  ctx.arc(cx, cy, size * 0.1, 0, Math.PI * 2)
  ctx.fillStyle = CARD.ink
  ctx.fill()
}

// ── The card ──────────────────────────────────────────────────────────

function drawCard(ctx: Ctx, o: RecapCardOptions, f: Fonts) {
  const C = CARD
  const { W, H, M } = C
  const innerW = W - 2 * M
  const { recap } = o

  // Ground and the depth field, top-left, at 60 percent.
  ctx.fillStyle = C.bone
  ctx.fillRect(0, 0, W, H)
  const field = ctx.createRadialGradient(W * 0.18, H * 0.12, 0, W * 0.18, H * 0.12, W * 0.6)
  field.addColorStop(0, `rgb(${C.veil} / .6)`)
  field.addColorStop(1, `rgb(${C.veil} / 0)`)
  ctx.fillStyle = field
  ctx.fillRect(0, 0, W, H)

  // The mark, top-left.
  drawMark(ctx, M + C.mark / 2, M + C.mark / 2, C.mark)

  // WEEK n, top-right, on the mark's centre line.
  ctx.textBaseline = 'middle'
  ctx.fillStyle = C.muted
  drawCaps(ctx, [
    { text: 'WEEK ', font: `500 ${C.week}px ${f.sans}` },
    { text: String(o.weekNumber), font: `400 ${C.week}px ${f.mono}` },
  ], W - M, M + C.mark / 2, C.week * C.weekTrack, 'right')

  // Headline, three lines at most.
  ctx.textBaseline = 'alphabetic'
  ctx.textAlign = 'left'
  ctx.fillStyle = C.ink
  ctx.font = `500 ${C.head}px ${f.sans}`
  setTracking(ctx, C.headTrack, C.head)
  const head = wrapLines(ctx, recap.headline || 'This week held.', innerW, C.headLines)
  head.forEach((line, i) => ctx.fillText(line, M, C.headTop + C.head * 0.78 + i * C.headLh))
  setTracking(ctx, 0, 0)

  // Three lists. When the week is full they compress to fit above the foot, fonts unchanged.
  const listsTop = C.headTop + head.length * C.headLh + C.listsGap
  const footTop = H - M - C.pillH
  const sections = CARD_LISTS.map(l => ({ label: l.label, items: recap[l.key].slice(0, 3) }))
  const natural = sections.reduce((a, s) => a + C.label + C.labelGap + Math.max(1, s.items.length) * C.itemLh, 0)
    + C.sectionGap * (sections.length - 1)
  const scale = Math.min(1, (footTop - C.footGap - listsTop) / natural)
  const itemLh = C.itemLh * scale
  const sectionGap = C.sectionGap * scale
  let y = listsTop
  for (const s of sections) {
    ctx.fillStyle = C.muted
    ctx.font = `500 ${C.label}px ${f.sans}`; ctx.fillStyle = CARD.muted; ctx.textAlign = 'left'; ctx.fillText(s.label, M, y + C.label * 0.78)
    y += C.label + C.labelGap
    ctx.font = `400 ${C.item}px ${f.sans}`
    ctx.textAlign = 'left'
    if (s.items.length === 0) {
      ctx.fillStyle = C.muted
      ctx.fillText(STILL, M, y + C.item * 0.78)
      y += itemLh
    } else {
      ctx.fillStyle = C.ink
      for (const item of s.items) {
        ctx.fillText(ellipsize(ctx, item, innerW), M, y + C.item * 0.78)
        y += itemLh
      }
    }
    y += sectionGap
  }

  // The one dense object: an Ink pill, bottom-right.
  ctx.font = `500 ${C.pillText}px ${f.sans}`
  const pillW = ctx.measureText(PILL_TEXT).width + 2 * C.pillPad
  const pillX = W - M - pillW
  roundedRect(ctx, pillX, footTop, pillW, C.pillH, C.pillH / 2)
  ctx.fillStyle = C.ink
  ctx.fill()
  ctx.fillStyle = C.bone
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(PILL_TEXT, pillX + pillW / 2, footTop + C.pillH / 2 + 1)

  // Next week's hint, bottom-left, centred on the pill.
  if (recap.nextWeekHint) {
    ctx.textAlign = 'left'
    ctx.textBaseline = 'alphabetic'
    ctx.fillStyle = C.slate
    ctx.font = `400 ${C.hint}px ${f.sans}`
    const hint = wrapLines(ctx, recap.nextWeekHint, innerW - pillW - 40, C.hintLines)
    const top = footTop + C.pillH / 2 - (hint.length * C.hintLh) / 2
    hint.forEach((line, i) => ctx.fillText(line, M, top + i * C.hintLh + C.hint * 0.78))
  }
}

// ── Export ────────────────────────────────────────────────────────────

export async function renderRecapCard(opts: RecapCardOptions): Promise<Blob> {
  if (typeof document === 'undefined') throw new Error('The card needs a browser to draw in.')
  const fonts = await loadFonts()
  // A detached canvas in the document context sees the web fonts.
  const canvas = document.createElement('canvas')
  canvas.width = CARD.W
  canvas.height = CARD.H
  const ctx = canvas.getContext('2d') as Ctx | null
  if (!ctx) throw new Error('The card could not be drawn in this browser.')
  drawCard(ctx, opts, fonts)
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(b => (b ? resolve(b) : reject(new Error('The card could not be saved as a PNG.'))), 'image/png')
  })
}

function triggerDownload(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = fileName
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 10_000)
}

export async function downloadRecapCard(opts: RecapCardOptions): Promise<void> {
  const blob = await renderRecapCard(opts)
  triggerDownload(blob, recapCardFileName(opts.weekNumber))
}

// The system share sheet where it exists (phones), a download everywhere else.
export async function shareRecapCard(opts: RecapCardOptions): Promise<'shared' | 'downloaded'> {
  const blob = await renderRecapCard(opts)
  const fileName = recapCardFileName(opts.weekNumber)
  const file = new File([blob], fileName, { type: 'image/png' })
  const who = opts.name.trim() ? `${opts.name.trim()}, week ${opts.weekNumber}` : `Week ${opts.weekNumber}`
  const data: ShareData = { files: [file], title: `${PILL_TEXT} · week ${opts.weekNumber}`, text: `${who}. ${opts.weekLabel}.` }
  if (typeof navigator.canShare === 'function' && typeof navigator.share === 'function' && navigator.canShare(data)) {
    try {
      await navigator.share(data)
      return 'shared'
    } catch (e) {
      if (e instanceof DOMException && e.name === 'AbortError') return 'shared'
    }
  }
  triggerDownload(blob, fileName)
  return 'downloaded'
}
