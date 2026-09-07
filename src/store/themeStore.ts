import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface ThemeStore {
  isDark: boolean
  toggle: () => void
}

export const useThemeStore = create<ThemeStore>()(
  persist(
    (set, get) => ({
      isDark: false,  // Default: airy light mode
      toggle: () => {
        const next = !get().isDark
        set({ isDark: next })
        applyTheme(next)
      },
    }),
    { name: 'laurence-theme' }
  )
)

export function applyTheme(isDark: boolean) {
  const root = document.documentElement
  if (isDark) {
    root.removeAttribute('data-theme')  // Warm amber = default CSS (no attribute)
  } else {
    root.setAttribute('data-theme', 'light')
  }
}
