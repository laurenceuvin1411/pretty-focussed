// Focus: her four segments. Your focus (four chapters), your habits, your projects, your content.
// The habit, project and content systems are the full ones from Laurence OS, mounted in this room.
import { useLocation, useNavigate } from 'react-router-dom'
import { YourFocus } from './YourFocus'
import { HabitTracker } from '../../pages/HabitTracker'
import { Projects } from '../../pages/Projects'
import { ContentCreation } from '../../pages/ContentCreation'
import { Productivity } from '../../pages/Productivity'

const TABS = [
  { id: 'focus',    label: 'Your focus',    path: '/focus' },
  { id: 'priorities', label: 'Your priorities', path: '/focus/priorities' },
  { id: 'habits',   label: 'Your habits',   path: '/focus/habits' },
  { id: 'projects', label: 'Your projects', path: '/focus/projects' },
  { id: 'content',  label: 'Your content',  path: '/focus/content' },
] as const

export function Focus() {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const active = pathname.endsWith('/priorities') ? 'priorities' : pathname.endsWith('/habits') ? 'habits' : pathname.endsWith('/projects') ? 'projects' : pathname.endsWith('/content') ? 'content' : 'focus'
  return (
    <div className="pf-stack-lg" style={{ gap: 28 }}>
      <div className="pf-segments pf-segments--haze pf-segments--wrap" role="tablist" aria-label="Focus">
        {TABS.map(t => (
          <button key={t.id} type="button" role="tab" aria-selected={active === t.id} className="pf-segment" onClick={() => navigate(t.path)}>{t.label}</button>
        ))}
      </div>
      {active === 'focus' && <YourFocus />}
      {active === 'priorities' && <div className="pf-legacy"><Productivity /></div>}
      {active === 'habits' && <div className="pf-legacy"><HabitTracker /></div>}
      {active === 'projects' && <div className="pf-legacy"><Projects /></div>}
      {active === 'content' && <div className="pf-legacy"><ContentCreation /></div>}
    </div>
  )
}
