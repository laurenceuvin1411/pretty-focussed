import { create } from 'zustand'
import type { User, Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

// Alleen deze adressen mogen zichzelf registreren. Zonder deze lijst kan
// iedereen die de URL kent een account maken en de app binnenkijken.
export const ALLOWED_SIGNUPS = [
  'hello@laurenceuvin.com',
  'elke@geldstroom.be',
]

interface AuthStore {
  user: User | null
  session: Session | null
  loading: boolean
  setSession: (session: Session | null) => void
  signIn: (email: string, password: string) => Promise<string | null>
  signUp: (email: string, password: string) => Promise<{ error: string | null; needsConfirm: boolean }>
  signOut: () => Promise<void>
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  session: null,
  loading: true,

  setSession: (session) => set({ session, user: session?.user ?? null, loading: false }),

  signIn: async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return error?.message ?? null
  },

  signUp: async (email, password) => {
    const clean = email.trim().toLowerCase()
    if (!ALLOWED_SIGNUPS.includes(clean)) {
      return { error: 'Dit e-mailadres heeft geen toegang. Vraag Laurence om je toe te voegen.', needsConfirm: false }
    }
    const { data, error } = await supabase.auth.signUp({ email: clean, password })
    if (error) return { error: error.message, needsConfirm: false }
    // Geen sessie terug = Supabase wacht op e-mailbevestiging
    return { error: null, needsConfirm: !data.session }
  },

  signOut: async () => {
    await supabase.auth.signOut()
    set({ user: null, session: null })
  },
}))
