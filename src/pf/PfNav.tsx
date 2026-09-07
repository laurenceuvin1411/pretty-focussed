// The floating Ink pill: the brand's most repeated device. It does not animate on tab change.
import { NavLink } from 'react-router-dom'
import { Circle, Sun, Target, Coins, Repeat, PenLine, Sparkles, Settings2 } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

const ITEMS: { to: string; label: string; icon: LucideIcon; end?: boolean }[] = [
  { to: '/',         label: 'Field',    icon: Circle, end: true },
  { to: '/today',    label: 'Today',    icon: Sun },
  { to: '/goals',    label: 'Goals',    icon: Target },
  { to: '/money',    label: 'Money',    icon: Coins },
  { to: '/rituals',  label: 'Success habits', icon: Repeat },
  { to: '/content',  label: 'Content',  icon: PenLine },
  { to: '/recap',    label: 'Recap',    icon: Sparkles },
  { to: '/settings', label: 'Settings', icon: Settings2 },
]

export function PfNav() {
  return (
    <nav className="pf-nav" aria-label="Pretty Focussed">
      {ITEMS.map(({ to, label, icon: Icon, end }) => (
        <NavLink key={to} to={to} end={end} className={({ isActive }) => `pf-nav__item ${isActive ? 'is-on' : ''}`} aria-label={label} title={label}>
          <Icon size={18} strokeWidth={1.5} aria-hidden="true" />
        </NavLink>
      ))}
    </nav>
  )
}
