import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { scopedKey } from '../lib/workspace'

// Bewerkbare diensten voor de sales-pipeline. Elke gebruiker heeft haar eigen lijst.
export interface Service {
  id: string
  name: string
  defaultValue: number   // standaard dealwaarde bij nieuwe lead
  priceLabel: string     // bv. "€2.500 / 3mnd"
}

const DEFAULT_SERVICES: Service[] = [
  { id: 'svc-ceo-club', name: 'CEO Club',              defaultValue: 2500, priceLabel: '€2.500 / 3mnd' },
  { id: 'svc-1on1',     name: '1:1 Business Coaching', defaultValue: 5000, priceLabel: '€5.000 / 3mnd' },
  { id: 'svc-cmo',      name: 'CMO',                   defaultValue: 6000, priceLabel: '€2.000 / mnd' },
  { id: 'svc-web',      name: 'Website / app',         defaultValue: 3500, priceLabel: 'op maat' },
  { id: 'svc-other',    name: 'Andere',                defaultValue: 0,    priceLabel: '' },
]

interface ServiceStore {
  services: Service[]
  addService: (name: string, defaultValue: number, priceLabel: string) => void
  updateService: (id: string, updates: Partial<Omit<Service, 'id'>>) => void
  deleteService: (id: string) => void
}

export const useServiceStore = create<ServiceStore>()(
  persist(
    (set) => ({
      services: DEFAULT_SERVICES,

      addService: (name, defaultValue, priceLabel) => set(s => ({
        services: [...s.services, { id: crypto.randomUUID(), name: name.trim(), defaultValue, priceLabel: priceLabel.trim() }],
      })),

      updateService: (id, updates) => set(s => ({
        services: s.services.map(x => x.id === id ? { ...x, ...updates } : x),
      })),

      deleteService: (id) => set(s => ({ services: s.services.filter(x => x.id !== id) })),
    }),
    { name: scopedKey('services-v1') }
  )
)

// Hulpjes voor bestaande leads: een lead bewaart de dienstnaam als tekst,
// dus oude leads blijven werken ook als een dienst hernoemd of verwijderd is.
export function serviceValue(services: Service[], name: string): number {
  return services.find(s => s.name === name)?.defaultValue ?? 0
}

export function servicePriceLabel(services: Service[], name: string): string {
  return services.find(s => s.name === name)?.priceLabel ?? ''
}
