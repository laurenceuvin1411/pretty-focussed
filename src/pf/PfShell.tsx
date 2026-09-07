// The room every Pretty Focussed page lives in: her ground, the soft field, the grain, the nav pill.
import { Link, Outlet } from 'react-router-dom'
import './pf.css'
import { ApertureMark } from './Aperture'
import { PfNav } from './PfNav'
import { useSettingsStore } from './settingsStore'

export function PfShell() {
  const ground = useSettingsStore(s => s.ground)
  return (
    <div className="pf pf-app" data-ground={ground}>
      <div className="pf-field" aria-hidden="true" />
      <div className="pf-grain" aria-hidden="true" />
      <header className="pf-app__head">
        <Link to="/" className="pf-brand" aria-label="Field">
          <ApertureMark size={22} /> Pretty Focussed
        </Link>
      </header>
      <main className="pf-page">
        <Outlet />
      </main>
      <PfNav />
    </div>
  )
}
