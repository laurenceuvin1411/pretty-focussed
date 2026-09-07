import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { scopedKey, isOwnerAccount } from '../lib/workspace'

export type Recurrence = 'weekly' | 'monthly' | 'quarterly' | 'yearly' | 'once'

export const RECURRENCE_LABEL: Record<Recurrence, string> = {
  weekly:    'Wekelijks',
  monthly:   'Maandelijks',
  quarterly: 'Per kwartaal',
  yearly:    'Jaarlijks',
  once:      'Eenmalig',
}

export interface ChecklistItem {
  id: string
  title: string
  description?: string
  recurrence: Recurrence
  dueDate?: string  // YYYY-MM-DD, optioneel
}

export interface Project {
  id: string
  name: string
  color: string
  emoji: string
  instagramUrl?: string
  checklists: { id: string; title: string; items: ChecklistItem[] }[]
  // Sub-tabs in de sidebar (zoals de Laurence Uvin / Bora groepen).
  // Zonder sections toont het project enkel de admin/overview-pagina.
  sections?: ProjectSection[]
}

export type ProjectSection = 'kompas' | 'sales' | 'content' | 'admin'

export const SECTION_LABEL: Record<ProjectSection, string> = {
  kompas:  'Kompas',
  sales:   'Sales',
  content: 'Content',
  admin:   'Admin',
}

export type CompletionKey = string  // `${itemId}::${period}`

// period key per recurrence type
export function getPeriodKey(recurrence: Recurrence, date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  if (recurrence === 'monthly')   return `${y}-${m}`
  if (recurrence === 'quarterly') return `${y}-Q${Math.ceil((date.getMonth() + 1) / 3)}`
  if (recurrence === 'yearly')    return `${y}`
  if (recurrence === 'weekly') {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7))
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
    const wk = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7)
    return `${d.getUTCFullYear()}-W${String(wk).padStart(2, '0')}`
  }
  return 'once'
}

// ── Seed data ──────────────────────────────────────────────────────
const SEED_PROJECTS: Project[] = [
  {
    id: 'laurence-uvin',
    name: 'Laurence Uvin Commv',
    color: '#C96840',
    emoji: '🦁',
    checklists: [
      {
        id: 'lu-maandelijks',
        title: 'Maandelijks',
        items: [
          {
            id: 'lu-outgoing-invoices',
            title: 'Upload uitgaande facturen',
            description: 'Exporteer & upload alle uitgaande facturen naar Falco',
            recurrence: 'monthly',
          },
          {
            id: 'lu-incoming-invoices',
            title: 'Upload inkomende facturen',
            description: 'Verzamel & upload alle inkomende facturen naar Falco',
            recurrence: 'monthly',
          },
          {
            id: 'lu-bankrekeningen-afstemmen',
            title: 'Bankrekeningen afstemmen',
            description: 'Controleer alle bankbewegingen en stem af met boekhouding',
            recurrence: 'monthly',
          },
        ],
      },
      {
        id: 'lu-kwartaal',
        title: 'Per kwartaal',
        items: [
          {
            id: 'lu-btw-aangifte',
            title: 'BTW-aangifte indienen',
            description: 'Kwartaalaangifte via MyMinfin — deadline: 20e van de maand na het kwartaal (20 april, 20 juli, 20 oktober, 20 januari)',
            recurrence: 'quarterly',
          },
          {
            id: 'lu-btw-betalen',
            title: 'BTW betalen',
            description: 'Betaal het verschuldigde BTW-bedrag aan de FOD Financiën — zelfde deadline als de aangifte',
            recurrence: 'quarterly',
          },
          {
            id: 'lu-intracom',
            title: 'Intracom-listing controleren',
            description: 'Controleer of er EU-diensten zijn die apart aangegeven moeten worden — zelfde deadline als BTW-aangifte',
            recurrence: 'quarterly',
          },
          {
            id: 'lu-voorafbetaling',
            title: 'Voorafbetaling vennootschapsbelasting',
            description: 'Vrijwillige voorafbetaling vermijdt belastingvermeerdering — deadlines: 10 april (VA1), 10 juli (VA2), 10 oktober (VA3), 20 december (VA4)',
            recurrence: 'quarterly',
          },
          {
            id: 'lu-sociale-bijdragen',
            title: 'Sociale bijdragen betalen',
            description: 'Kwartaalbijdrage als zelfstandige bestuurder — deadlines: 31 maart, 30 juni, 30 september, 31 december',
            recurrence: 'quarterly',
          },
          {
            id: 'lu-resultaat-opvolging',
            title: 'Kwartaalresultaat opvolgen',
            description: 'Bespreek tussentijdse cijfers met je boekhouder en pas ramingen voor de rest van het jaar aan',
            recurrence: 'quarterly',
          },
        ],
      },
      {
        id: 'lu-jaarlijks',
        title: 'Jaarlijks',
        items: [
          {
            id: 'lu-fiche-28150',
            title: 'Fiches 281.50 opmaken & indienen',
            description: 'Commissies, vergoedingen en erelonen aan derden (freelancers, etc.) aangeven via Belcotax-on-web — deadline: 1 maart',
            recurrence: 'yearly',
          },
          {
            id: 'lu-btw-klantenlisting',
            title: 'BTW-klantenlisting indienen',
            description: 'Jaarlijkse opgave van Belgische BTW-plichtige klanten via MyMinfin — deadline: 31 maart',
            recurrence: 'yearly',
          },
          {
            id: 'lu-aangifte-venb',
            title: 'Aangifte vennootschapsbelasting',
            description: 'Jaarlijkse aangifte VenB via Biztax — normaal uiterlijk 30 september (controleer jaarlijks de exacte deadline)',
            recurrence: 'yearly',
          },
          {
            id: 'lu-jaarrekening',
            title: 'Jaarrekening neerleggen bij NBB',
            description: 'Gedeponeerde jaarrekening via e-depositing — deadline: 7 maanden na afsluiting boekjaar (normaal 31 juli)',
            recurrence: 'yearly',
          },
          {
            id: 'lu-algemene-vergadering',
            title: 'Algemene vergadering houden',
            description: 'Jaarlijkse AV om jaarrekening goed te keuren — verplicht binnen 6 maanden na afsluiting boekjaar (vóór 30 juni)',
            recurrence: 'yearly',
          },
          {
            id: 'lu-vapz',
            title: 'VAPZ-storting overwegen',
            description: 'Vrij aanvullend pensioen voor zelfstandigen — fiscaal aftrekbaar, maximale storting vóór 31 december',
            recurrence: 'yearly',
          },
          {
            id: 'lu-verzekeringen',
            title: 'Professionele verzekeringen controleren',
            description: 'BA professioneel, arbeidsongevallen, hospitalisatie — tarieven vergelijken en polissen actualiseren',
            recurrence: 'yearly',
          },
          {
            id: 'lu-bezoldigingsbeleid',
            title: 'Bezoldigingsbeleid evalueren',
            description: 'Optimale verhouding loon / dividenden / kostenvergoedingen bespreken met boekhouder — idealiter voor het nieuwe boekjaar',
            recurrence: 'yearly',
          },
        ],
      },
    ],
  },
  {
    id: 'bora',
    name: 'Bora Coworking',
    color: '#7AACCF',
    emoji: '🏢',
    checklists: [
      {
        id: 'bora-maandelijks',
        title: 'Maandelijks',
        items: [
          {
            id: 'bora-outgoing-invoices',
            title: 'Upload uitgaande facturen',
            description: 'Exporteer & upload alle uitgaande facturen naar Falco',
            recurrence: 'monthly',
          },
          {
            id: 'bora-incoming-invoices',
            title: 'Upload inkomende facturen',
            description: 'Verzamel & upload alle inkomende facturen naar Falco',
            recurrence: 'monthly',
          },
        ],
      },
      {
        id: 'bora-kwartaal',
        title: 'Per kwartaal',
        items: [
          {
            id: 'bora-btw-aangifte',
            title: 'BTW-aangifte indienen',
            description: 'Kwartaalaangifte via MyMinfin — deadline: 20e van de maand na het kwartaal',
            recurrence: 'quarterly',
          },
          {
            id: 'bora-btw-betalen',
            title: 'BTW betalen',
            description: 'Betaal het verschuldigde BTW-bedrag aan de FOD Financiën',
            recurrence: 'quarterly',
          },
          {
            id: 'bora-sociale-bijdragen',
            title: 'Sociale bijdragen betalen',
            description: 'Kwartaalbijdrage als zelfstandige — deadlines: 31 maart, 30 juni, 30 september, 31 december',
            recurrence: 'quarterly',
          },
        ],
      },
      {
        id: 'bora-jaarlijks',
        title: 'Jaarlijks',
        items: [
          {
            id: 'bora-btw-klantenlisting',
            title: 'BTW-klantenlisting indienen',
            description: 'Jaarlijkse opgave van Belgische BTW-plichtige klanten — deadline: 31 maart',
            recurrence: 'yearly',
          },
          {
            id: 'bora-jaarrekening',
            title: 'Jaarrekening neerleggen bij NBB',
            description: 'Deadline: 7 maanden na afsluiting boekjaar (normaal 31 juli)',
            recurrence: 'yearly',
          },
          {
            id: 'bora-algemene-vergadering',
            title: 'Algemene vergadering houden',
            description: 'Verplicht binnen 6 maanden na afsluiting boekjaar (vóór 30 juni)',
            recurrence: 'yearly',
          },
        ],
      },
    ],
  },
]

// Export for Sidebar (still needs the project list for colors/labels)
export const PROJECTS = SEED_PROJECTS

// ── Completions store (persisted separately) ─────────────────────
interface CompletionState {
  completions: Record<CompletionKey, boolean>
  toggle: (itemId: string, period: string) => void
}

export const useProjectStore = create<CompletionState>()(
  persist(
    (set) => ({
      completions: {},
      toggle: (itemId, period) => set(s => {
        const key = `${itemId}::${period}`
        return { completions: { ...s.completions, [key]: !s.completions[key] } }
      }),
    }),
    { name: scopedKey('projects-v1') }
  )
)

// ── Project data store (projects + items, persisted) ────────────
interface ProjectDataState {
  projects: Project[]
  addProject: (project: Omit<Project, 'id'>) => string
  updateProject: (id: string, updates: Partial<Omit<Project, 'id' | 'checklists'>>) => void
  deleteProject: (id: string) => void
  addItem: (projectId: string, recurrence: Recurrence, title: string, description?: string, dueDate?: string) => void
  removeItem: (projectId: string, itemId: string) => void
}

export const useProjectDataStore = create<ProjectDataState>()(
  persist(
    (set) => ({
      projects: isOwnerAccount() ? SEED_PROJECTS : [],
      addProject: (project) => {
        const id = crypto.randomUUID()
        set(s => ({ projects: [...s.projects, { ...project, id }] }))
        return id
      },
      updateProject: (id, updates) => set(s => ({ projects: s.projects.map(p => p.id === id ? { ...p, ...updates } : p) })),
      deleteProject: (id) => {
        // Ruim ook de eigen opslag van de sub-tabs op
        for (const key of [`content-creation-${id}-v1`, `project-kompas-${id}-v1`, `project-sales-${id}-v1`]) {
          try { localStorage.removeItem(key) } catch { /* opslag niet beschikbaar */ }
        }
        set(s => ({ projects: s.projects.filter(p => p.id !== id) }))
      },
      addItem: (projectId, recurrence, title, description, dueDate) => set(s => ({
        projects: s.projects.map(p => {
          if (p.id !== projectId) return p
          const sectionTitle = RECURRENCE_LABEL[recurrence]
          const existing = p.checklists.find(c => c.title === sectionTitle)
          const newItem: ChecklistItem = { id: crypto.randomUUID(), title, description, recurrence, dueDate: dueDate || undefined }
          if (existing) {
            return {
              ...p,
              checklists: p.checklists.map(c =>
                c.title === sectionTitle ? { ...c, items: [...c.items, newItem] } : c
              ),
            }
          }
          return {
            ...p,
            checklists: [...p.checklists, { id: crypto.randomUUID(), title: sectionTitle, items: [newItem] }],
          }
        }),
      })),
      removeItem: (projectId, itemId) => set(s => ({
        projects: s.projects.map(p =>
          p.id !== projectId ? p : {
            ...p,
            checklists: p.checklists
              .map(c => ({ ...c, items: c.items.filter(i => i.id !== itemId) }))
              .filter(c => c.items.length > 0),
          }
        ),
      })),
    }),
    {
      name: 'projects-data-v2',
      merge: (persisted: unknown, current) => {
        // If persisted has no projects (first migration), use seed
        const p = persisted as Partial<ProjectDataState>
        if (!p?.projects?.length) return { ...current, projects: isOwnerAccount() ? SEED_PROJECTS : [] }
        return { ...current, ...p }
      },
    }
  )
)
