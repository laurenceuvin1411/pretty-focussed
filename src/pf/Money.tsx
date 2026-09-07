// Money: one place, three readings. Revenue against the target, the conversations that become revenue, and what she keeps.
import { useLocation, useNavigate } from 'react-router-dom'
import { Revenue } from './Revenue'
import { Sales } from './Sales'
import { Finance } from './Finance'

const TABS = [
  { id: 'revenue', label: 'Revenue', path: '/money' },
  { id: 'sales',   label: 'Sales',   path: '/money/sales' },
  { id: 'finance', label: 'Finance', path: '/money/finance' },
] as const

export function Money() {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const active = pathname.endsWith('/sales') ? 'sales' : pathname.endsWith('/finance') ? 'finance' : 'revenue'
  return (
    <div className="pf-stack-lg" style={{ gap: 28 }}>
      <div className="pf-segments" role="tablist" aria-label="Money">
        {TABS.map(t => (
          <button key={t.id} type="button" role="tab" aria-selected={active === t.id} className="pf-segment" onClick={() => navigate(t.path)}>{t.label}</button>
        ))}
      </div>
      {active === 'revenue' && <Revenue />}
      {active === 'sales' && <Sales />}
      {active === 'finance' && <Finance />}
    </div>
  )
}
