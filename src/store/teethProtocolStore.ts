import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { scopedKey } from '../lib/workspace'

export const TEETH_PROTOCOL_START = '2026-07-30'

export type TeethDoseKey = 'bleach' | 'mousse' | 'mould'

// Fase-doelen in nachten (protocol: 7-10 nachten per CP-fase, 3-10 nachten bitje na)
export const PHASE1_NIGHTS = 8   // 10% CP
export const PHASE2_NIGHTS = 8   // 16% CP
export const AFTERCARE_NIGHTS = 5 // bitje met Tooth Mousse
export const TOTAL_NIGHTS = PHASE1_NIGHTS + PHASE2_NIGHTS + AFTERCARE_NIGHTS

export type TeethPhase = 'notstarted' | 'phase1' | 'phase2' | 'aftercare' | 'done'

interface TeethProtocolState {
  logs: Record<string, TeethDoseKey[]>  // date -> doses gedaan
  toggleDose: (date: string, dose: TeethDoseKey) => void
}

export const useTeethProtocolStore = create<TeethProtocolState>()(
  persist(
    (set) => ({
      logs: {},
      toggleDose: (date, dose) => set(s => {
        const current = s.logs[date] ?? []
        const next = current.includes(dose)
          ? current.filter(d => d !== dose)
          : [...current, dose]
        return { logs: { ...s.logs, [date]: next } }
      }),
    }),
    { name: scopedKey('teeth-protocol-v1') }
  )
)

// Fase wordt bepaald door afgevinkte nachten, niet door kalenderdagen.
// Een nacht overslaan (bv. bij gevoeligheid) schuift het protocol gewoon op.
export function getTeethProgress(logs: Record<string, TeethDoseKey[]>, uptoDate: string) {
  let bleachNights = 0
  let mouldNights = 0
  for (const [date, doses] of Object.entries(logs)) {
    if (date > uptoDate) continue
    if (doses.includes('bleach')) bleachNights++
    if (doses.includes('mould')) mouldNights++
  }

  let phase: TeethPhase
  if (uptoDate < TEETH_PROTOCOL_START) phase = 'notstarted'
  else if (bleachNights < PHASE1_NIGHTS) phase = 'phase1'
  else if (bleachNights < PHASE1_NIGHTS + PHASE2_NIGHTS) phase = 'phase2'
  else if (mouldNights < AFTERCARE_NIGHTS) phase = 'aftercare'
  else phase = 'done'

  const nightsDone = Math.min(TOTAL_NIGHTS, bleachNights + mouldNights)
  return { phase, bleachNights, mouldNights, nightsDone, progressPct: Math.round((nightsDone / TOTAL_NIGHTS) * 100) }
}
