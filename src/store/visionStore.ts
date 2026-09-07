import { create } from 'zustand'
import { supabase } from '../lib/supabase'

export interface VisionStore {
  lifeVision: string
  annualWord: string
  coreWhy: string
  annualTheme: string
  whatILove: string[]
  whatImBestAt: string[]
  economicsEngine: string[]
  specificKnowledge: string[]
  leverageTypes: string[]
  identityStatements: string[]
  enoughMonthlyIncome: number
  enoughNetWorth: number
  financialIndependenceDate: string
  vision10Year: string
  vision3Year: string
  vision1Year: string
  resistanceCheckedToday: boolean
  lastResistanceDate: string
  currentProject: string
  morningIntention: string
  lastIntentionDate: string
  hydrate: (data: Partial<Omit<VisionStore, 'hydrate' | 'update' | 'checkResistance' | 'setMorningIntention'>>) => void
  update: (updates: Partial<Omit<VisionStore, 'update' | 'hydrate' | 'checkResistance' | 'setMorningIntention'>>) => void
  checkResistance: () => void
  setMorningIntention: (intention: string) => void
}

const defaults = {
  lifeVision: 'I live a life of complete freedom: financially, temporally, and geographically. I run 2 thriving businesses that create real value, I compete at elite Hyrox events, and I inspire thousands of people to design their own operating system for life. My work and my life are one.',
  annualWord: 'Momentum',
  annualTheme: '2026: The Year of Compounding',
  coreWhy: 'To prove that you can build wealth, health, and freedom simultaneously: and document the entire system so others can replicate it.',
  whatILove: ['Coaching high performers and entrepreneurs', 'Creating content that changes how people think', 'Building systems that run without me', 'Endurance sports and physical excellence', 'Deep conversations about business and life design'],
  whatImBestAt: ['Simplifying complex ideas into actionable frameworks', 'Building community and creating belonging', 'Sales and conversion: making irresistible offers', 'Designing systems and operating procedures', 'Creating content that educates and entertains'],
  economicsEngine: ['High-ticket coaching (CEO Lifestyle)', 'Memberships en coworking (Bora)', 'Digitale producten en online programmas', 'Brand partnerships en sponsorships'],
  specificKnowledge: ['Personal branding en positionering voor ondernemers', 'Business systems en automation voor solopreneurs', 'High-performance habits, voeding en lichaam', 'Belgische ondernemer- en coworkingmarkt', 'Content-led business building'],
  leverageTypes: ['media', 'labor', 'capital'],
  identityStatements: ['I am an elite athlete who trains daily', 'I am a creator who ships work every day', 'I am a systems builder who designs for freedom', 'I am a coach who transforms lives', 'I am someone who does the hard thing first'],
  enoughMonthlyIncome: 15000,
  enoughNetWorth: 1000000,
  financialIndependenceDate: '2030-01-01',
  vision10Year: 'I have built a personal brand known across Europe for lifestyle entrepreneurship. My businesses generate €500k+ annually on autopilot. I compete in Hyrox World Championships. I own real estate across Belgium and Portugal. I have complete location and time freedom.',
  vision3Year: 'CEO Lifestyle has 50+ active coaching clients. Bora has 200+ members. Net worth exceeds €500k. I train 5× per week and compete quarterly.',
  vision1Year: 'Revenue hits €100k. Net worth reaches €100k. I build a consistent content engine publishing 5× per week. Hyrox sub-60 min. Bora grows to 50+ members.',
  resistanceCheckedToday: false,
  lastResistanceDate: '',
  currentProject: 'CEO Lifestyle content flywheel: 5 posts per week',
  morningIntention: '',
  lastIntentionDate: '',
}

async function saveVision(data: object) {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return
  await supabase.from('user_vision').upsert({ user_id: session.user.id, data }, { onConflict: 'user_id' })
}

export const useVisionStore = create<VisionStore>((set, get) => ({
  ...defaults,

  hydrate: (data) => set(s => ({ ...s, ...data })),

  update: (updates) => {
    set(s => ({ ...s, ...updates }))
    // debounce: save after short delay
    setTimeout(() => {
      const state = get()
      const { hydrate, update, checkResistance, setMorningIntention, ...data } = state
      saveVision(data)
    }, 500)
  },

  checkResistance: () => {
    const today = new Date().toISOString().split('T')[0]
    set({ resistanceCheckedToday: true, lastResistanceDate: today })
    const state = get()
    const { hydrate, update, checkResistance, setMorningIntention, ...data } = state
    saveVision(data)
  },

  setMorningIntention: (intention) => {
    const today = new Date().toISOString().split('T')[0]
    set({ morningIntention: intention, lastIntentionDate: today })
    const state = get()
    const { hydrate, update, checkResistance, setMorningIntention, ...data } = state
    saveVision(data)
  },
}))
