import { format, getWeek } from 'date-fns'
import { nlBE } from 'date-fns/locale'
import { Sun, Moon, LogOut } from 'lucide-react'
import { useThemeStore } from '../../store/themeStore'
import { useAuthStore } from '../../store/authStore'

export function TopBar() {
  const now = new Date()
  const dateStr = format(now, "EEEE d MMMM", { locale: nlBE })
  const week = getWeek(now, { weekStartsOn: 1 })
  const { isDark, toggle } = useThemeStore()
  const { signOut } = useAuthStore()

  return (
    <header
      className="fixed top-0 right-0 z-10 flex items-center justify-between"
      style={{ left: 210, height: 56, background: 'transparent', padding: '0 64px' }}
    >
      <span style={{ fontSize: 11, letterSpacing: '0.08em', color: 'var(--color-subtle)', textTransform: 'capitalize' }}>
        {dateStr} · Week {week}
      </span>
      <button
        onClick={toggle}
        style={{
          width: 34, height: 34, borderRadius: 12,
          border: '1px solid var(--color-border)',
          background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', color: 'var(--color-muted)',
          transition: 'all 200ms ease',
        }}
        title={isDark ? 'Switch to day mode' : 'Switch to night mode'}
      >
        {isDark
          ? <Sun size={13} strokeWidth={1.5} />
          : <Moon size={13} strokeWidth={1.5} />
        }
      </button>
      <button
        onClick={signOut}
        style={{
          width: 34, height: 34, borderRadius: 12,
          border: '1px solid var(--color-border)',
          background: 'transparent',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', color: 'var(--color-muted)',
          marginLeft: 8,
        }}
        title="Uitloggen"
      >
        <LogOut size={13} strokeWidth={1.5} />
      </button>
    </header>
  )
}
