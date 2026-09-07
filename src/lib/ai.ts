// One entry point for every call to the Studio assistant.
// In production everything goes through the Netlify function (the key stays server-side).
// In dev Vite does not serve that function, so we fall back to a direct browser call
// with VITE_ANTHROPIC_API_KEY, only when it is set.

export type ModelTier = 'sonnet' | 'haiku'

const MODELS: Record<ModelTier, string> = {
  sonnet: import.meta.env.VITE_PF_MODEL_SONNET || 'claude-sonnet-5',
  haiku:  import.meta.env.VITE_PF_MODEL_HAIKU  || 'claude-haiku-4-5-20251001',
}

export interface AskOptions {
  system: string
  user: string
  model?: ModelTier
  maxTokens?: number
}

export class AIError extends Error {}

// The proxy lives on Netlify. From GitHub Pages or any other host the build points at it with VITE_AI_PROXY.
const PROXY = import.meta.env.VITE_AI_PROXY || '/.netlify/functions/anthropic'

async function viaProxy(body: unknown): Promise<string | null> {
  const res = await fetch(PROXY, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })
  const type = res.headers.get('content-type') || ''
  // Vite dev returns the SPA index: no JSON, so no proxy available.
  if (!type.includes('application/json')) return null
  const data = await res.json()
  if (res.status === 401 || res.status === 403) throw new AIError(NOT_CONNECTED)
  if (!res.ok) throw new AIError(friendly(typeof data?.error === 'string' ? data.error : data?.error?.message, res.status))
  return data.content?.[0]?.text ?? ''
}

async function viaBrowser(body: unknown): Promise<string> {
  const key = import.meta.env.VITE_ANTHROPIC_API_KEY
  if (!key) throw new AIError(NOT_CONNECTED)
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': key,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
      'content-type': 'application/json',
    },
    body: JSON.stringify(body),
  })
  const data = await res.json()
  if (res.status === 401 || res.status === 403) throw new AIError(NOT_CONNECTED)
  if (!res.ok) throw new AIError(friendly(data?.error?.message, res.status))
  return data.content?.[0]?.text ?? ''
}

// Errors read as facts with a next step, never as a stack trace.
const NOT_CONNECTED = 'The assistant is not connected yet. Add the API key and try again.'
function friendly(message: string | undefined, status: number): string {
  if (status === 429) return 'The assistant is busy. Try again in a minute.'
  if (status >= 500) return 'The assistant did not answer. Nothing is lost; try again in a moment.'
  return message ? `The assistant did not answer (${message}).` : 'The assistant did not answer. Try again in a moment.'
}

export async function askClaude({ system, user, model = 'sonnet', maxTokens = 2500 }: AskOptions): Promise<string> {
  const body = {
    model: MODELS[model],
    max_tokens: maxTokens,
    system,
    messages: [{ role: 'user', content: user }],
  }
  const proxied = await viaProxy(body)
  if (proxied !== null) return proxied
  return viaBrowser(body)
}

// Pulls the first JSON object or array out of an answer, even with text around it.
export function extractJSON<T = unknown>(text: string): T {
  const cleaned = text.replace(/```(?:json)?/g, '').trim()
  const startObj = cleaned.indexOf('{')
  const startArr = cleaned.indexOf('[')
  const starts = [startObj, startArr].filter(i => i >= 0)
  if (starts.length === 0) throw new AIError('The assistant answered in the wrong shape. Try again.')
  const start = Math.min(...starts)
  const open = cleaned[start]
  const close = open === '{' ? '}' : ']'
  let depth = 0
  let inStr = false
  for (let i = start; i < cleaned.length; i++) {
    const ch = cleaned[i]
    if (inStr) {
      if (ch === '\\') i++
      else if (ch === '"') inStr = false
      continue
    }
    if (ch === '"') inStr = true
    else if (ch === '{' || ch === '[') depth++
    else if (ch === '}' || ch === ']') {
      depth--
      if (depth === 0 && ch === close) return JSON.parse(cleaned.slice(start, i + 1)) as T
    }
  }
  throw new AIError('The assistant stopped mid-answer. Try again.')
}

// The assistant's voice.
export const STUDIO_SYSTEM = `You are the assistant inside Pretty Focussed, the weekly operating system for women who run their own business and want a life to match.

Voice: declarative, spare, precise, dry, warm in what is said rather than how. Average sentence eleven words. Second person. Sentence case. No exclamation marks, no emoji, no ellipses, no em dashes, no softeners (just, simply, maybe). Never open with the problem; open with the answer. Never guilt, urgency, shame or hype. Banned words: girlboss, hustle, grind, slay, queen, bestie, self-care, manifest, unlock, supercharge, seamless, effortless, empower, elevate, journey, mindset, crush.

Principles:
- Three priorities a week, never six. Say plainly what she can leave.
- Business and life are two lanes and both win. Protect rest, training and friends as seriously as revenue.
- Use her real data (goals, revenue gap, calendar, rituals). Invent nothing. Numerals carry their unit.
- You propose, she decides. Answer only with valid JSON in the requested schema, no text around it.`
