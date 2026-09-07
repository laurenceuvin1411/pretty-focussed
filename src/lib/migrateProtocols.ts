import { useProtocolStore } from '../store/protocolStore'
import { useSkinProtocolStore, PROTOCOL_START } from '../store/skinProtocolStore'
import { useTeethProtocolStore, TEETH_PROTOCOL_START, PHASE1_NIGHTS, PHASE2_NIGHTS, AFTERCARE_NIGHTS } from '../store/teethProtocolStore'
import { useSupplementStore, SUPPLEMENTS } from '../store/supplementStore'
import type { Protocol } from '../store/protocolStore'

// Laurence' drie vastgezette protocollen worden eenmalig omgezet naar
// gewone, bewerkbare protocollen. Afgevinkte dagen gaan mee.
const FLAG = 'protocols-migrated-v1'

export function migrateLegacyProtocols() {
  try {
    if (localStorage.getItem(FLAG)) return
    const store = useProtocolStore.getState()
    if (store.protocols.length > 0) { localStorage.setItem(FLAG, '1'); return }

    const skinLogs = useSkinProtocolStore.getState().logs
    const teethLogs = useTeethProtocolStore.getState().logs
    const suppLogs = useSupplementStore.getState().logs

    const built: Protocol[] = []
    const now = new Date().toISOString()

    // ── Huidbehandeling ──
    if (Object.keys(skinLogs).length > 0) {
      const items = [
        { id: 'skin-morning',    label: 'Skin medication', sub: 'Ochtend',  color: '#C4935A' },
        { id: 'skin-evening',    label: 'Skin medication', sub: 'Avond',    color: '#A57A8B' },
        { id: 'skin-nightcream', label: 'Nachtcrème',      sub: 'Insmeren', color: '#7AACCF', perWeek: 2 },
      ]
      built.push({
        id: crypto.randomUUID(), name: 'Huidbehandeling', startDate: PROTOCOL_START,
        items,
        phases: [
          { id: crypto.randomUUID(), name: 'Fase 1', days: 42, itemIds: ['skin-morning', 'skin-evening', 'skin-nightcream'] },
          { id: crypto.randomUUID(), name: 'Fase 2', days: 42, itemIds: ['skin-morning'] },
        ],
        logs: Object.fromEntries(Object.entries(skinLogs).map(([date, doses]) => [
          date, doses.map(d => `skin-${d}`),
        ])),
        createdAt: now,
      })
    }

    // ── Bleaching ──
    if (Object.keys(teethLogs).length > 0) {
      const items = [
        { id: 'teeth-bleach', label: 'Bleaching',                    sub: "'s Nachts",                     color: '#7AACCF' },
        { id: 'teeth-mousse', label: 'GC Tooth Mousse',              sub: 'Ochtend, 15-30 min erna',       color: '#D4A96A' },
        { id: 'teeth-mould',  label: 'Bitje met GC Tooth Mousse',    sub: 'Volledige nacht',               color: '#A57A8B' },
      ]
      built.push({
        id: crypto.randomUUID(), name: 'Bleaching', startDate: TEETH_PROTOCOL_START,
        items,
        phases: [
          { id: crypto.randomUUID(), name: 'Fase 1 · 10% CP', days: PHASE1_NIGHTS, itemIds: ['teeth-bleach', 'teeth-mousse'] },
          { id: crypto.randomUUID(), name: 'Fase 2 · 16% CP', days: PHASE2_NIGHTS, itemIds: ['teeth-bleach', 'teeth-mousse'] },
          { id: crypto.randomUUID(), name: 'Nazorg',          days: AFTERCARE_NIGHTS, itemIds: ['teeth-mould'] },
        ],
        rules: 'Vooraf tanden poetsen 30 min voor het bleachen + interdentaal reinigen. Vermijd kleurende voeding (rode wijn, rood fruit, kurkuma, curry). Te gevoelig? Sla een nacht over en vul het bitje met GC Tooth Mousse.',
        logs: Object.fromEntries(Object.entries(teethLogs).map(([date, doses]) => [
          date, doses.map(d => `teeth-${d}`),
        ])),
        createdAt: now,
      })
    }

    // ── Supplementen ──
    if (Object.keys(suppLogs).length > 0) {
      built.push({
        id: crypto.randomUUID(), name: 'Supplementen',
        startDate: Object.keys(suppLogs).sort()[0] ?? new Date().toISOString().split('T')[0],
        items: SUPPLEMENTS.map(s => ({ id: `supp-${s.id}`, label: s.label, sub: s.sub, color: s.color })),
        phases: [],  // loopt gewoon door
        logs: Object.fromEntries(Object.entries(suppLogs).map(([date, ids]) => [
          date, ids.map(i => `supp-${i}`),
        ])),
        createdAt: now,
      })
    }

    if (built.length > 0) {
      useProtocolStore.setState({ protocols: built })
    }
    localStorage.setItem(FLAG, '1')
  } catch {
    // migratie mag nooit de app blokkeren
  }
}
