import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type BusinessGoal =
  | 'authority' | 'education' | 'storytelling' | 'lifestyle'
  | 'sales' | 'behind-scenes' | 'mindset' | 'health' | 'ai' | 'travel'

export type ContentFormat = 'reel' | 'carousel' | 'story' | 'linkedin' | 'newsletter' | 'thread'
export type Priority = 'high' | 'medium' | 'low'
export type Difficulty = 'easy' | 'medium' | 'hard'
export type Engagement = 'high' | 'medium' | 'low'

export const GOAL_COLOR: Record<BusinessGoal, string> = {
  authority:      '#7AACCF',
  education:      '#7AACCF',
  storytelling:   '#B8956A',
  lifestyle:      '#7A9E8A',
  sales:          '#C96840',
  'behind-scenes':'#C4935A',
  mindset:        '#6DB889',
  health:         '#C4736A',
  ai:             '#38BDF8',
  travel:         '#9C8FDC',
}

export const GOAL_LABEL: Record<BusinessGoal, string> = {
  authority:      'Authority',
  education:      'Education',
  storytelling:   'Storytelling',
  lifestyle:      'Lifestyle',
  sales:          'Sales',
  'behind-scenes':'Behind the scenes',
  mindset:        'Mindset',
  health:         'Health',
  ai:             'AI',
  travel:         'Travel',
}

export interface ContentOpportunity {
  id: string
  title: string
  whyNow: string
  priority: Priority
  businessGoal: BusinessGoal
  targetAudience: string
  estimatedEngagement: Engagement
  recordingTime: string
  difficulty: Difficulty
  cta: string
  formats: ContentFormat[]
  trigger: string
  hooks: string[]
  talkingPoints: string[]
  caption: string
}

export interface WeekPlanItem {
  day: string
  contentType: string
  topic: string
  format: ContentFormat
  goal: BusinessGoal
}

export interface ContentStore {
  opportunities: ContentOpportunity[]
  weekPlan: WeekPlanItem[]
  insights: string[]
  savedIds: Set<string>
  lastGenerated: string | null
  loading: boolean
  error: string | null
  expandedScript: Record<string, string>   // id → generated script
  scriptLoading: Record<string, boolean>
  setLoading: (v: boolean) => void
  setResult: (o: ContentOpportunity[], w: WeekPlanItem[], i: string[]) => void
  setError: (e: string | null) => void
  toggleSaved: (id: string) => void
  dismiss: (id: string) => void
  setScript: (id: string, script: string) => void
  setScriptLoading: (id: string, v: boolean) => void
}

function makeContentStore(storeName: string) {
  return create<ContentStore>()(
    persist(
      (set) => ({
        opportunities: [],
        weekPlan: [],
        insights: [],
        savedIds: new Set(),
        lastGenerated: null,
        loading: false,
        error: null,
        expandedScript: {},
        scriptLoading: {},

        setLoading: (loading) => set({ loading }),
        setResult: (opportunities, weekPlan, insights) =>
          set({ opportunities, weekPlan, insights, lastGenerated: new Date().toISOString(), error: null, loading: false }),
        setError: (error) => set({ error, loading: false }),
        toggleSaved: (id) => set(s => {
          const next = new Set(s.savedIds)
          next.has(id) ? next.delete(id) : next.add(id)
          return { savedIds: next }
        }),
        dismiss: (id) => set(s => ({ opportunities: s.opportunities.filter(o => o.id !== id) })),
        setScript: (id, script) => set(s => ({ expandedScript: { ...s.expandedScript, [id]: script } })),
        setScriptLoading: (id, v) => set(s => ({ scriptLoading: { ...s.scriptLoading, [id]: v } })),
      }),
      {
        name: storeName,
        partialize: (s) => ({
          opportunities: s.opportunities,
          weekPlan: s.weekPlan,
          insights: s.insights,
          savedIds: Array.from(s.savedIds),
          lastGenerated: s.lastGenerated,
          expandedScript: s.expandedScript,
        }),
        merge: (persisted: any, current) => ({
          ...current,
          ...(persisted ?? {}),
          savedIds: new Set(persisted?.savedIds ?? []),
          loading: false,
          error: null,
          scriptLoading: {},
        }),
      }
    )
  )
}

export const useContentStore     = makeContentStore('content-strategist-v1')
export const useBoraContentStore = makeContentStore('content-strategist-bora-v1')
