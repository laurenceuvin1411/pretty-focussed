import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { scopedKey } from '../lib/workspace'

export type SupplementId = 'creatine' | 'collagen' | 'omega3' | 'probiotics' | 'magnesium'

export const SUPPLEMENTS: { id: SupplementId; label: string; sub: string; color: string; emoji: string }[] = [
  { id: 'creatine',   label: 'Creatine',    sub: '5g',          color: '#C4935A', emoji: '💪' },
  { id: 'collagen',   label: 'Collageen',   sub: 'Powder/caps', color: '#D4A96A', emoji: '✨' },
  { id: 'omega3',     label: 'Omega 3',     sub: '2 caps',      color: '#7AACCF', emoji: '🐟' },
  { id: 'probiotics', label: 'Probiotica',  sub: '1 cap',       color: '#6DB889', emoji: '🌿' },
  { id: 'magnesium',  label: 'Magnesium',   sub: 'Evening',     color: '#A57A8B', emoji: '🌙' },
]

interface SupplementState {
  logs: Record<string, SupplementId[]>  // date -> taken supplements
  toggle: (date: string, id: SupplementId) => void
}

export const useSupplementStore = create<SupplementState>()(
  persist(
    (set) => ({
      logs: {},
      toggle: (date, id) => set(s => {
        const current = s.logs[date] ?? []
        const next = current.includes(id)
          ? current.filter(x => x !== id)
          : [...current, id]
        return { logs: { ...s.logs, [date]: next } }
      }),
    }),
    { name: scopedKey('supplements-v1') }
  )
)
