import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { scopedKey } from '../lib/workspace'

export type Month = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12
export const MONTHS_NL = ['Jan','Feb','Mrt','Apr','Mei','Jun','Jul','Aug','Sep','Okt','Nov','Dec']
export const MONTHS_FULL = ['Januari','Februari','Maart','April','Mei','Juni','Juli','Augustus','September','Oktober','November','December']

export const CHANNELS = ['Instagram','LinkedIn','TikTok','YouTube','Pinterest','Podcast','Nieuwsbrief','PR','Ads','Partners','Community','Website/SEO'] as const
export type Channel = typeof CHANNELS[number]
export type ChannelStatus = 'active' | 'campaign' | 'maintenance' | 'off'

export const FUNNEL_STAGES = ['awareness','interest','lead','nurture','sales','retention','referral'] as const
export type FunnelStage = typeof FUNNEL_STAGES[number]

export const AUDIENCE_TYPES = ['Primary','Secondary','Warm','Cold','Partners','Pers','Investeerders','Community'] as const
export type AudienceType = typeof AUDIENCE_TYPES[number]

export const KPI_KEYS = ['reach','followers','website','newsletter','leads','salesCalls','conversie','omzet','roas','cac','ltv'] as const
export type KpiKey = typeof KPI_KEYS[number]
export const KPI_LABELS: Record<KpiKey, string> = {
  reach: 'Reach', followers: 'Followers', website: 'Website', newsletter: 'Nieuwsbrief',
  leads: 'Leads', salesCalls: 'Sales Calls', conversie: 'Conversie %', omzet: 'Omzet €',
  roas: 'ROAS', cac: 'CAC €', ltv: 'LTV €',
}

export interface MonthData {
  primaryFocus: string
  campaign: string
  launch: string
  events: string
  contentTheme: string
  primaryAudience: string
  mainKpi: string
  channels: Partial<Record<Channel, ChannelStatus>>
  audiences: Partial<Record<AudienceType, string>>
  funnelFocus: FunnelStage | ''
  heroTopic: string
  supportingTopics: string[]
  cta: string
  leadMagnet: string
  offer: string
  kpis: Partial<Record<KpiKey, number>>
  aiSuggestions: string[]
}

export interface Launch {
  id: string
  name: string
  quarter: 1 | 2 | 3 | 4
  prelaunchWeeks: number
  waitlistDays: number
  liveDays: number
  followupDays: number
  revenueGoal: number | null
  notes: string
}

export interface MarketingEvent {
  id: string
  name: string
  date: string
  location: string
  type: string
  goal: string
  leadGoal: number | null
  revenueGoal: number | null
  contentOpportunities: string
  needsAftermovie: boolean
  needsPhotographer: boolean
  hasSponsor: boolean
}

export interface YearPlan {
  brief: string
  months: Partial<Record<Month, Partial<MonthData>>>
  launches: Launch[]
  events: MarketingEvent[]
  lastGenerated: string | null
}

// keyed: projectId -> year
interface MarketingStrategyStore {
  plans: Record<string, Record<number, YearPlan>>
  setBrief: (projectId: string, year: number, brief: string) => void
  setMonthData: (projectId: string, year: number, month: Month, data: Partial<MonthData>) => void
  setYearPlan: (projectId: string, year: number, plan: Partial<YearPlan>) => void
  addLaunch: (projectId: string, year: number, launch: Omit<Launch, 'id'>) => void
  updateLaunch: (projectId: string, year: number, id: string, updates: Partial<Launch>) => void
  removeLaunch: (projectId: string, year: number, id: string) => void
  addEvent: (projectId: string, year: number, event: Omit<MarketingEvent, 'id'>) => void
  updateEvent: (projectId: string, year: number, id: string, updates: Partial<MarketingEvent>) => void
  removeEvent: (projectId: string, year: number, id: string) => void
}

function emptyYear(): YearPlan {
  return { brief: '', months: {}, launches: [], events: [], lastGenerated: null }
}

function getOrCreate(plans: Record<string, Record<number, YearPlan>>, projectId: string, year: number): YearPlan {
  return plans[projectId]?.[year] ?? emptyYear()
}

export const useMarketingStrategyStore = create<MarketingStrategyStore>()(
  persist(
    (set, get) => ({
      plans: {},

      setBrief: (projectId, year, brief) => set(s => {
        const plan = getOrCreate(s.plans, projectId, year)
        return { plans: { ...s.plans, [projectId]: { ...s.plans[projectId], [year]: { ...plan, brief } } } }
      }),

      setMonthData: (projectId, year, month, data) => set(s => {
        const plan = getOrCreate(s.plans, projectId, year)
        const existing = plan.months[month] ?? {}
        return {
          plans: {
            ...s.plans,
            [projectId]: {
              ...s.plans[projectId],
              [year]: { ...plan, months: { ...plan.months, [month]: { ...existing, ...data } } },
            },
          },
        }
      }),

      setYearPlan: (projectId, year, update) => set(s => {
        const plan = getOrCreate(s.plans, projectId, year)
        return {
          plans: {
            ...s.plans,
            [projectId]: { ...s.plans[projectId], [year]: { ...plan, ...update, lastGenerated: new Date().toISOString() } },
          },
        }
      }),

      addLaunch: (projectId, year, launch) => set(s => {
        const plan = getOrCreate(s.plans, projectId, year)
        return {
          plans: {
            ...s.plans,
            [projectId]: { ...s.plans[projectId], [year]: { ...plan, launches: [...plan.launches, { ...launch, id: crypto.randomUUID() }] } },
          },
        }
      }),

      updateLaunch: (projectId, year, id, updates) => set(s => {
        const plan = getOrCreate(s.plans, projectId, year)
        return {
          plans: {
            ...s.plans,
            [projectId]: { ...s.plans[projectId], [year]: { ...plan, launches: plan.launches.map(l => l.id === id ? { ...l, ...updates } : l) } },
          },
        }
      }),

      removeLaunch: (projectId, year, id) => set(s => {
        const plan = getOrCreate(s.plans, projectId, year)
        return {
          plans: {
            ...s.plans,
            [projectId]: { ...s.plans[projectId], [year]: { ...plan, launches: plan.launches.filter(l => l.id !== id) } },
          },
        }
      }),

      addEvent: (projectId, year, event) => set(s => {
        const plan = getOrCreate(s.plans, projectId, year)
        return {
          plans: {
            ...s.plans,
            [projectId]: { ...s.plans[projectId], [year]: { ...plan, events: [...plan.events, { ...event, id: crypto.randomUUID() }] } },
          },
        }
      }),

      updateEvent: (projectId, year, id, updates) => set(s => {
        const plan = getOrCreate(s.plans, projectId, year)
        return {
          plans: {
            ...s.plans,
            [projectId]: { ...s.plans[projectId], [year]: { ...plan, events: plan.events.map(e => e.id === id ? { ...e, ...updates } : e) } },
          },
        }
      }),

      removeEvent: (projectId, year, id) => set(s => {
        const plan = getOrCreate(s.plans, projectId, year)
        return {
          plans: {
            ...s.plans,
            [projectId]: { ...s.plans[projectId], [year]: { ...plan, events: plan.events.filter(e => e.id !== id) } },
          },
        }
      }),
    }),
    { name: scopedKey('marketing-strategy-v1') }
  )
)
