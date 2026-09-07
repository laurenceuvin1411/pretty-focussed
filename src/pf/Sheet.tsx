// Sheets and modals: bottom-anchored on the phone, centred on desktop.
// The page behind goes out of focus, not merely dark. Enter 260ms from scale(.96), exit faster.
import { useEffect } from 'react'
import type { ReactNode } from 'react'
import { createPortal } from 'react-dom'

export function Sheet({ open, onClose, title, children, wide = false }: { open: boolean; onClose: () => void; title?: string; children: ReactNode; wide?: boolean }) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null
  const host = document.getElementById('pf-sheet-root') ?? createHost()
  return createPortal(
    <div className="pf pf-scrim" onClick={onClose} role="presentation">
      <div className={`pf-sheet ${wide ? 'pf-sheet--wide' : ''}`} role="dialog" aria-modal="true" aria-label={title} onClick={e => e.stopPropagation()}>
        <span className="pf-grab" aria-hidden="true" />
        {title && <h2 className="pf-h3" style={{ marginBottom: 18 }}>{title}</h2>}
        {children}
      </div>
    </div>,
    host,
  )
}

function createHost() {
  const el = document.createElement('div')
  el.id = 'pf-sheet-root'
  el.className = 'pf pf-dock-host'
  document.body.appendChild(el)
  return el
}
