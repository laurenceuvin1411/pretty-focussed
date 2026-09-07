import { useState } from 'react'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { Plus, X, Compass, Target, Layers, PenLine } from 'lucide-react'

// ── Eigen kompas-store per project ───────────────────────────────
interface Pijler { id: string; title: string; detail: string }
interface Doel { id: string; title: string; done: boolean }

interface KompasStore {
  noordster: string
  pijlers: Pijler[]
  doelen: Doel[]
  notities: string
  setNoordster: (v: string) => void
  setNotities: (v: string) => void
  addPijler: (title: string, detail: string) => void
  updatePijler: (id: string, updates: Partial<Omit<Pijler, 'id'>>) => void
  removePijler: (id: string) => void
  addDoel: (title: string) => void
  toggleDoel: (id: string) => void
  removeDoel: (id: string) => void
}

type KompasHook = ReturnType<typeof makeKompasStore>

function makeKompasStore(storageName: string) {
  return create<KompasStore>()(
    persist(
      (set) => ({
        noordster: '',
        pijlers: [],
        doelen: [],
        notities: '',
        setNoordster: (v) => set({ noordster: v }),
        setNotities: (v) => set({ notities: v }),
        addPijler: (title, detail) => set(s => ({ pijlers: [...s.pijlers, { id: crypto.randomUUID(), title: title.trim(), detail: detail.trim() }] })),
        updatePijler: (id, updates) => set(s => ({ pijlers: s.pijlers.map(p => p.id === id ? { ...p, ...updates } : p) })),
        removePijler: (id) => set(s => ({ pijlers: s.pijlers.filter(p => p.id !== id) })),
        addDoel: (title) => set(s => ({ doelen: [...s.doelen, { id: crypto.randomUUID(), title: title.trim(), done: false }] })),
        toggleDoel: (id) => set(s => ({ doelen: s.doelen.map(d => d.id === id ? { ...d, done: !d.done } : d) })),
        removeDoel: (id) => set(s => ({ doelen: s.doelen.filter(d => d.id !== id) })),
      }),
      { name: storageName }
    )
  )
}

const kompasStores = new Map<string, KompasHook>()
function getKompasStore(projectId: string): KompasHook {
  let store = kompasStores.get(projectId)
  if (!store) {
    store = makeKompasStore(`project-kompas-${projectId}-v1`)
    kompasStores.set(projectId, store)
  }
  return store
}

// ── UI ───────────────────────────────────────────────────────────
const ACCENT = '#4C6481'

function SectionCard({ icon, title, sub, children }: { icon: React.ReactNode; title: string; sub: string; children: React.ReactNode }) {
  return (
    <div className="card" style={{ padding: '22px 24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
        {icon}
        <h2 style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--color-ink)', fontFamily: 'var(--font-mono)' }}>{title}</h2>
      </div>
      <p style={{ fontSize: 11.5, color: 'var(--color-subtle)', marginBottom: 14 }}>{sub}</p>
      {children}
    </div>
  )
}

export function ProjectKompas({ projectId, projectName }: { projectId: string; projectName: string }) {
  const useKompas = getKompasStore(projectId)
  const store = useKompas()
  const [newPijler, setNewPijler] = useState('')
  const [newPijlerDetail, setNewPijlerDetail] = useState('')
  const [newDoel, setNewDoel] = useState('')

  return (
    <div style={{ maxWidth: 760 }}>
      <div style={{ marginBottom: 30 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--color-ink)', lineHeight: 1.2, marginBottom: 4 }}>
          Kompas · {projectName}
        </h1>
        <p style={{ fontSize: 12, color: 'var(--color-subtle)', fontFamily: 'var(--font-mono)' }}>
          Richting, pijlers en doelen voor dit project
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <SectionCard icon={<Compass size={13} color={ACCENT} />} title="Noordster" sub="Waar wil je met dit project naartoe? Eén heldere zin.">
          <textarea
            className="textarea"
            style={{ width: '100%', minHeight: 64, boxSizing: 'border-box', fontSize: 14, fontWeight: 600 }}
            placeholder="Bv. Dé referentie worden in mijn niche tegen eind 2027."
            value={store.noordster}
            onChange={e => store.setNoordster(e.target.value)}
          />
        </SectionCard>

        <SectionCard icon={<Layers size={13} color={ACCENT} />} title="Pijlers" sub="De 2 tot 4 dingen waar dit project op steunt.">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {store.pijlers.map((p, i) => (
              <div key={p.id} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', padding: '10px 12px', borderRadius: 12, border: '1px solid var(--color-border)', background: 'var(--color-surface)' }}>
                <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: ACCENT, fontWeight: 700, marginTop: 3 }}>{String(i + 1).padStart(2, '0')}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <input
                    value={p.title}
                    onChange={e => store.updatePijler(p.id, { title: e.target.value })}
                    style={{ width: '100%', border: 'none', background: 'none', fontSize: 13, fontWeight: 700, color: 'var(--color-ink)', fontFamily: 'inherit', outline: 'none' }}
                  />
                  <input
                    value={p.detail}
                    onChange={e => store.updatePijler(p.id, { detail: e.target.value })}
                    placeholder="Korte toelichting"
                    style={{ width: '100%', border: 'none', background: 'none', fontSize: 12, color: 'var(--color-subtle)', fontFamily: 'inherit', outline: 'none' }}
                  />
                </div>
                <button onClick={() => store.removePijler(p.id)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--color-subtle)', padding: 2 }}>
                  <X size={13} />
                </button>
              </div>
            ))}
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                className="input"
                style={{ flex: 1 }}
                placeholder="Nieuwe pijler"
                value={newPijler}
                onChange={e => setNewPijler(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && newPijler.trim()) { store.addPijler(newPijler, newPijlerDetail); setNewPijler(''); setNewPijlerDetail('') } }}
              />
              <input
                className="input"
                style={{ flex: 1 }}
                placeholder="Toelichting (optioneel)"
                value={newPijlerDetail}
                onChange={e => setNewPijlerDetail(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && newPijler.trim()) { store.addPijler(newPijler, newPijlerDetail); setNewPijler(''); setNewPijlerDetail('') } }}
              />
              <button
                className="btn-ghost"
                disabled={!newPijler.trim()}
                onClick={() => { store.addPijler(newPijler, newPijlerDetail); setNewPijler(''); setNewPijlerDetail('') }}
              >
                <Plus size={13} />
              </button>
            </div>
          </div>
        </SectionCard>

        <SectionCard icon={<Target size={13} color={ACCENT} />} title="Doelen dit kwartaal" sub="Concreet en afvinkbaar.">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {store.doelen.map(d => (
              <div key={d.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', borderRadius: 12, border: '1px solid var(--color-border)', background: 'var(--color-surface)' }}>
                <input type="checkbox" checked={d.done} onChange={() => store.toggleDoel(d.id)} style={{ cursor: 'pointer' }} />
                <span style={{ flex: 1, fontSize: 13, color: d.done ? 'var(--color-subtle)' : 'var(--color-ink)', textDecoration: d.done ? 'line-through' : 'none', fontWeight: 600 }}>
                  {d.title}
                </span>
                <button onClick={() => store.removeDoel(d.id)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--color-subtle)', padding: 2 }}>
                  <X size={13} />
                </button>
              </div>
            ))}
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                className="input"
                style={{ flex: 1 }}
                placeholder="Nieuw doel"
                value={newDoel}
                onChange={e => setNewDoel(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && newDoel.trim()) { store.addDoel(newDoel); setNewDoel('') } }}
              />
              <button
                className="btn-ghost"
                disabled={!newDoel.trim()}
                onClick={() => { store.addDoel(newDoel); setNewDoel('') }}
              >
                <Plus size={13} />
              </button>
            </div>
          </div>
        </SectionCard>

        <SectionCard icon={<PenLine size={13} color={ACCENT} />} title="Beslissingen & notities" sub="Wat je besloten hebt en waarom, zodat je niet blijft twijfelen.">
          <textarea
            className="textarea"
            style={{ width: '100%', minHeight: 110, boxSizing: 'border-box' }}
            placeholder="Schrijf hier je beslissingen, inzichten en open vragen."
            value={store.notities}
            onChange={e => store.setNotities(e.target.value)}
          />
        </SectionCard>
      </div>
    </div>
  )
}
