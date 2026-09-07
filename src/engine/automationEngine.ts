// Singleton event bus — import { emit } anywhere, handlers registered via useAutomationEngine

type EventHandler = (payload: AutomationPayload) => void | Promise<void>

export interface AutomationPayload {
  event: string
  data: Record<string, unknown>
  timestamp: string
}

const _handlers: Map<string, EventHandler[]> = new Map()

export function onEvent(event: string, handler: EventHandler): () => void {
  const existing = _handlers.get(event) ?? []
  _handlers.set(event, [...existing, handler])
  return () => {
    const current = _handlers.get(event) ?? []
    _handlers.set(event, current.filter(h => h !== handler))
  }
}

export function emit(event: string, data: Record<string, unknown>): void {
  const payload: AutomationPayload = { event, data, timestamp: new Date().toISOString() }
  const handlers = _handlers.get(event) ?? []
  handlers.forEach(h => {
    try { h(payload) } catch (err) { console.error(`[AutomationEngine] Handler error for "${event}":`, err) }
  })
}

// Check if all condition keys match the data
export function matchesConditions(data: Record<string, unknown>, conditions: Record<string, unknown>): boolean {
  return Object.entries(conditions).every(([key, val]) => data[key] === val)
}
