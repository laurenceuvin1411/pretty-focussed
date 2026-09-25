// Focus: her four segments. Your focus (four chapters), your habits, your projects, your content.
// The habit, project and content systems are the full ones from Laurence OS, mounted in this room.
import { useLocation } from 'react-router-dom'
import { YourFocus } from './YourFocus'
import { HabitTracker } from '../../pages/HabitTracker'
import { Projects } from '../../pages/Projects'
import { ContentCreation } from '../../pages/ContentCreation'
import { Productivity } from '../../pages/Productivity'


export function Focus() {
  const { pathname } = useLocation()
  const active = pathname.endsWith('/priorities') ? 'priorities' : pathname.endsWith('/habits') ? 'habits' : pathname.endsWith('/projects') ? 'projects' : pathname.endsWith('/content') ? 'content' : 'focus'
  return (
    <div className="pf-stack-lg" style={{ gap: 28 }}>
      {/* the segments live in the shell now */}
      {active === 'focus' && <YourFocus />}
      {active === 'priorities' && <div className="pf-legacy"><Productivity /></div>}
      {active === 'habits' && <div className="pf-legacy"><HabitTracker /></div>}
      {active === 'projects' && <div className="pf-legacy"><Projects /></div>}
      {active === 'content' && <div className="pf-legacy"><ContentCreation /></div>}
    </div>
  )
}
