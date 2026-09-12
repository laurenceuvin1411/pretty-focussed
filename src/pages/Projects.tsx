import { useState } from 'react'
import { NewProjectModal } from '../components/layout/Sidebar'
import { useParams } from 'react-router-dom'
import { format, subMonths, addMonths, subWeeks, addWeeks, subQuarters, addQuarters, subYears, addYears } from 'date-fns'
import { enGB, nlBE } from 'date-fns/locale'
import { useNavigate } from 'react-router-dom'
import { Check, ChevronLeft, ChevronRight, FolderOpen, Plus, Trash2, X } from 'lucide-react'
import { useProjectStore, useProjectDataStore, getPeriodKey, RECURRENCE_LABEL } from '../store/projectStore'
import type { ChecklistItem, Recurrence, Project } from '../store/projectStore'
import { TeamBoard } from './TeamBoard'
import { MarketingStrategy } from './MarketingStrategy'

const SEED_PROJECT_IDS = new Set(['laurence-uvin', 'bora'])

// ── Period navigation helpers ────────────────────────────────────
function prevPeriod(recurrence: Recurrence, date: Date): Date {
  if (recurrence === 'weekly')    return subWeeks(date, 1)
  if (recurrence === 'monthly')   return subMonths(date, 1)
  if (recurrence === 'quarterly') return subQuarters(date, 1)
  if (recurrence === 'yearly')    return subYears(date, 1)
  return date
}
function nextPeriod(recurrence: Recurrence, date: Date): Date {
  if (recurrence === 'weekly')    return addWeeks(date, 1)
  if (recurrence === 'monthly')   return addMonths(date, 1)
  if (recurrence === 'quarterly') return addQuarters(date, 1)
  if (recurrence === 'yearly')    return addYears(date, 1)
  return date
}

function periodLabel(recurrence: Recurrence, date: Date): string {
  if (recurrence === 'monthly')   return format(date, 'MMMM yyyy', { locale: enGB })
  if (recurrence === 'weekly')    return `Week van ${format(date, 'd MMM', { locale: nlBE })}`
  if (recurrence === 'quarterly') {
    const q = Math.ceil((date.getMonth() + 1) / 3)
    return `Q${q} ${date.getFullYear()}`
  }
  if (recurrence === 'yearly')    return String(date.getFullYear())
  return 'Eenmalig'
}

function isFuturePeriod(recurrence: Recurrence, date: Date): boolean {
  const now = new Date()
  if (recurrence === 'monthly')   return date.getFullYear() > now.getFullYear() || (date.getFullYear() === now.getFullYear() && date.getMonth() > now.getMonth())
  if (recurrence === 'weekly')    return date > now
  if (recurrence === 'quarterly') {
    const qNow = Math.ceil((now.getMonth() + 1) / 3)
    const qD   = Math.ceil((date.getMonth() + 1) / 3)
    return date.getFullYear() > now.getFullYear() || (date.getFullYear() === now.getFullYear() && qD > qNow)
  }
  if (recurrence === 'yearly')    return date.getFullYear() > now.getFullYear()
  return false
}

// ── Add Task Modal ───────────────────────────────────────────────
const RECURRENCE_OPTIONS: { value: Recurrence; label: string; sub: string }[] = [
  { value: 'weekly',    label: 'Wekelijks',    sub: 'elke week opnieuw' },
  { value: 'monthly',   label: 'Maandelijks',  sub: 'elke maand opnieuw' },
  { value: 'quarterly', label: 'Per kwartaal', sub: 'elk kwartaal opnieuw' },
  { value: 'yearly',    label: 'Jaarlijks',    sub: 'elk jaar opnieuw' },
  { value: 'once',      label: 'Eenmalig',     sub: 'één keer afvinken' },
]

function AddTaskModal({ projectId, onClose }: { projectId: string; onClose: () => void }) {
  const { addItem } = useProjectDataStore()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [recurrence, setRecurrence] = useState<Recurrence>('monthly')
  const [dueDate, setDueDate] = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) return
    addItem(projectId, recurrence, title.trim(), description.trim() || undefined, dueDate || undefined)
    onClose()
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '9px 12px', borderRadius: 16,
    border: '1px solid var(--color-border)', background: 'var(--color-surface)',
    color: 'var(--color-ink)', fontSize: 13, fontFamily: 'inherit',
    outline: 'none', boxSizing: 'border-box',
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgb(20 21 15 / .4)', backdropFilter: 'blur(6px)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ background: 'var(--color-card)', border: 'none', boxShadow: '0 4px 16px rgb(62 73 54 / .06)', borderRadius: 20, width: '100%', maxWidth: 480, padding: '28px 28px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22 }}>
          <div>
            <h2 style={{ fontSize: 17, fontWeight: 500, color: 'var(--color-ink)', letterSpacing: '-0.01em' }}>Taak toevoegen</h2>
            <p style={{ fontSize: 12, color: 'var(--color-subtle)', marginTop: 2 }}>Terugkerende checklist-taak</p>
          </div>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 14, border: '1px solid var(--color-border)', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-muted)' }}>
            <X size={14} />
          </button>
        </div>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ fontSize: 11, fontWeight: 500, color: 'var(--color-muted)', display: 'block', marginBottom: 5, letterSpacing: '0.06em' }}>Taak</label>
            <input
              style={inputStyle}
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Btw-aangifte indienen"
              autoFocus
              required
            />
          </div>
          <div>
            <label style={{ fontSize: 11, fontWeight: 500, color: 'var(--color-muted)', display: 'block', marginBottom: 5, letterSpacing: '0.06em' }}>Notitie (optioneel)</label>
            <input
              style={inputStyle}
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Extra uitleg of link..."
            />
          </div>
          <div>
            <label style={{ fontSize: 11, fontWeight: 500, color: 'var(--color-muted)', display: 'block', marginBottom: 5, letterSpacing: '0.06em' }}>Vervaldatum (optioneel)</label>
            <input
              type="date"
              style={{ ...inputStyle, colorScheme: 'light dark' }}
              value={dueDate}
              onChange={e => setDueDate(e.target.value)}
            />
          </div>
          <div>
            <label style={{ fontSize: 11, fontWeight: 500, color: 'var(--color-muted)', display: 'block', marginBottom: 8, letterSpacing: '0.06em' }}>Herhaling</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {RECURRENCE_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setRecurrence(opt.value)}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '10px 14px', borderRadius: 16, cursor: 'pointer', fontFamily: 'inherit',
                    border: `1.5px solid ${recurrence === opt.value ? 'var(--color-accent)' : 'var(--color-border)'}`,
                    background: recurrence === opt.value ? 'rgba(201,104,64,0.07)' : 'transparent',
                    transition: 'all 150ms',
                  }}
                >
                  <span style={{ fontSize: 13, fontWeight: 500, color: recurrence === opt.value ? 'var(--color-accent)' : 'var(--color-ink)' }}>{opt.label}</span>
                  <span style={{ fontSize: 11, color: 'var(--color-subtle)' }}>{opt.sub}</span>
                </button>
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
            <button type="button" onClick={onClose} style={{ flex: 1, padding: 11, borderRadius: 16, border: '1px solid var(--color-border)', background: 'transparent', color: 'var(--color-muted)', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>
              Annuleer
            </button>
            <button type="submit" style={{ flex: 2, padding: 11, borderRadius: 16, border: 'none', background: 'var(--color-accent)', color: 'var(--color-bg)', fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}>
              Toevoegen
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── CheckRow ─────────────────────────────────────────────────────
function CheckRow({ item, done, onToggle, onDelete }: {
  item: ChecklistItem; done: boolean; onToggle: () => void; onDelete?: () => void
}) {
  const [hover, setHover] = useState(false)
  return (
    <div
      style={{ display: 'flex', alignItems: 'flex-start', gap: 14, width: '100%', padding: '14px 18px', borderBottom: '1px solid var(--color-border)', background: hover ? 'rgba(255,255,255,0.03)' : 'transparent', transition: 'background 150ms' }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <button
        onClick={onToggle}
        style={{
          width: 22, height: 22, borderRadius: 14, flexShrink: 0, marginTop: 1,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: done ? 'var(--color-brand-green)' : 'transparent',
          border: `1.5px solid ${done ? 'var(--color-brand-green)' : 'rgba(210,180,145,0.28)'}`,
          transition: 'all 180ms ease', cursor: 'pointer',
          boxShadow: done ? '0 0 8px var(--pf-sage-soft)' : 'none',
        }}
      >
        {done && <Check size={12} color="var(--color-ink)" strokeWidth={3} />}
      </button>
      <div style={{ flex: 1, cursor: 'pointer' }} onClick={onToggle}>
        <p style={{ fontSize: 14, fontWeight: 500, color: done ? 'var(--color-muted)' : 'var(--color-ink)', textDecoration: done ? 'line-through' : 'none', transition: 'all 180ms' }}>
          {item.title}
        </p>
        {item.description && (
          <p style={{ fontSize: 12, color: 'var(--color-subtle)', marginTop: 3, lineHeight: 1.5 }}>
            {item.description}
          </p>
        )}
        {item.dueDate && !done && (() => {
          const today = new Date().toISOString().split('T')[0]
          const isToday = item.dueDate === today
          const isOverdue = item.dueDate < today
          return (
            <p style={{ fontSize: 11, fontWeight: 500, color: isOverdue ? 'var(--pf-depth-text)' : isToday ? 'var(--pf-depth-text)' : 'var(--color-subtle)', marginTop: 4, fontFamily: 'var(--font-mono)' }}>
              {isOverdue ? 'Verlopen · ' : isToday ? 'Vandaag · ' : ''}{item.dueDate}
            </p>
          )
        })()}
      </div>
      {done && (
        <span style={{ fontSize: 10, fontWeight: 500, color: 'var(--color-brand-green)', background: 'var(--pf-sage-soft)', padding: '2px 8px', borderRadius: 99, flexShrink: 0, marginTop: 2 }}>
          Klaar
        </span>
      )}
      {onDelete && hover && !done && (
        <button
          onClick={onDelete}
          title="Verwijder taak"
          style={{ width: 26, height: 26, borderRadius: 14, border: '1px solid var(--color-border)', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-subtle)', flexShrink: 0, marginTop: 0 }}
        >
          <Trash2 size={12} />
        </button>
      )}
    </div>
  )
}

// ── Checklist section with its own period navigator ──────────────
function ChecklistSection({ projectId, checklist, projectColor }: {
  projectId: string
  checklist: { id: string; title: string; items: ChecklistItem[] }
  projectColor: string
}) {
  const { completions, toggle } = useProjectStore()
  const { removeItem } = useProjectDataStore()
  const recurrence = checklist.items[0]?.recurrence ?? 'monthly'
  const [viewDate, setViewDate] = useState(new Date())
  const isFuture = isFuturePeriod(recurrence, viewDate)
  const period = getPeriodKey(recurrence, viewDate)
  const done = checklist.items.filter(i => completions[`${i.id}::${period}`]).length
  const total = checklist.items.length
  const allDone = done === total && total > 0

  // One-time checklists have no navigator
  const isOnce = recurrence === 'once'

  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '12px 18px 10px',
        background: allDone ? 'var(--pf-sage-soft)' : 'transparent',
        borderBottom: '1px solid var(--color-border)',
        borderTop: '1px solid var(--color-border)',
      }}>
        <div>
          <p style={{ fontSize: 11, fontWeight: 500, letterSpacing: '0.12em', textTransform: 'uppercase', color: projectColor }}>
            {checklist.title}
          </p>
          <p style={{ fontSize: 11, color: 'var(--color-subtle)', marginTop: 2 }}>
            {isOnce ? 'Eenmalig' : periodLabel(recurrence, viewDate)}
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {/* Mini progress dots */}
          <div style={{ display: 'flex', gap: 4 }}>
            {checklist.items.map(item => (
              <div key={item.id} style={{
                width: 8, height: 8, borderRadius: '50%',
                background: completions[`${item.id}::${period}`] ? 'var(--color-brand-green)' : 'rgba(210,180,145,0.20)',
                transition: 'background 200ms',
              }} />
            ))}
          </div>
          <span style={{ fontSize: 12, fontWeight: 500, color: allDone ? 'var(--color-brand-green)' : 'var(--color-muted)' }}>
            {done}/{total}
          </span>
          {allDone && (
            <span style={{ fontSize: 10, fontWeight: 500, color: 'var(--color-brand-green)', background: 'var(--pf-sage-soft)', padding: '2px 8px', borderRadius: 99 }}>
              Klaar
            </span>
          )}
          {/* Period navigator (not for once) */}
          {!isOnce && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginLeft: 8 }}>
              <button
                onClick={() => setViewDate(d => prevPeriod(recurrence, d))}
                style={{ width: 26, height: 26, borderRadius: 14, border: 'none', boxShadow: '0 4px 16px rgb(62 73 54 / .06)', background: 'var(--color-card)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-muted)' }}>
                <ChevronLeft size={12} />
              </button>
              <button
                onClick={() => setViewDate(d => nextPeriod(recurrence, d))}
                disabled={isFuture}
                style={{ width: 26, height: 26, borderRadius: 14, border: 'none', boxShadow: '0 4px 16px rgb(62 73 54 / .06)', background: 'var(--color-card)', cursor: isFuture ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-muted)', opacity: isFuture ? 0.3 : 1 }}>
                <ChevronRight size={12} />
              </button>
            </div>
          )}
        </div>
      </div>
      <div>
        {checklist.items.map(item => (
          <CheckRow
            key={item.id}
            item={item}
            done={!!completions[`${item.id}::${period}`]}
            onToggle={() => toggle(item.id, period)}
            onDelete={() => removeItem(projectId, item.id)}
          />
        ))}
      </div>
    </div>
  )
}

// ── ProjectCard ──────────────────────────────────────────────────
function ProjectCard({ project, onAddTask }: {
  project: Project
  onAddTask: () => void
}) {
  return (
    <div className="card" style={{ overflow: 'hidden', marginBottom: 24 }}>
      {/* Project header */}
      <div style={{ padding: '20px 22px 16px', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 10, height: 10, borderRadius: '50%', flexShrink: 0, background: project.color }} />
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 500, color: 'var(--color-ink)', letterSpacing: '-0.01em' }}>{project.name}</h2>
            <p style={{ fontSize: 11, color: 'var(--color-subtle)', marginTop: 1 }}>
              {project.checklists.reduce((n, c) => n + c.items.length, 0)} taken
            </p>
          </div>
        </div>
        <button
          onClick={onAddTask}
          style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 13px', borderRadius: 14, border: '1px solid var(--color-border)', background: 'transparent', color: 'var(--color-muted)', fontSize: 12, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 150ms' }}
        >
          <Plus size={13} /> Taak toevoegen
        </button>
      </div>

      {/* Checklists */}
      {project.checklists.length === 0 ? (
        <div style={{ padding: '40px 24px', textAlign: 'center', color: 'var(--color-subtle)', fontSize: 13 }}>
          Nog geen taken. Klik op "Taak toevoegen" om te beginnen.
        </div>
      ) : (
        <div>
          {project.checklists.map(checklist => (
            <ChecklistSection
              key={checklist.id}
              projectId={project.id}
              checklist={checklist}
              projectColor={project.color}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// ── Main ─────────────────────────────────────────────────────────
export function Projects({ fixedProjectId }: { fixedProjectId?: string } = {}) {
  const { id: paramId } = useParams<{ id: string }>()
  const { projects, deleteProject } = useProjectDataStore()
  const navigate = useNavigate()
  const resolvedId = fixedProjectId ?? paramId
  const [activeId, setActiveId] = useState(resolvedId ?? projects[0]?.id ?? '')
  const [showAddModal, setShowAddModal] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const showTabs = !resolvedId
  const activeProject = projects.find(p => p.id === (resolvedId ?? activeId)) ?? (showTabs ? projects.find(p => p.id === activeId) : undefined)
  const isCustomProject = activeProject && !SEED_PROJECT_IDS.has(activeProject.id)
  const isLU = resolvedId === 'laurence-uvin' || fixedProjectId === 'laurence-uvin'
  const [subTab, setSubTab] = useState<'admin' | 'team'>('admin')
  const [customTab, setCustomTab] = useState<'admin' | 'marketing'>('admin')

  function handleDeleteProject() {
    if (!activeProject) return
    if (!confirm(`Project "${activeProject.name}" verwijderen?`)) return
    deleteProject(activeProject.id)
    navigate('/')
  }

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: 24, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: 32, fontWeight: 500, letterSpacing: '-0.02em', lineHeight: 1, color: 'var(--color-ink)' }}>
            {resolvedId ? (activeProject?.name ?? 'Project') : 'Projects'}
          </h1>
          {resolvedId && (
            <p style={{ fontSize: 13, color: 'var(--color-subtle)', marginTop: 4 }}>Terugkerende taken per periode</p>
          )}
        </div>
        {showTabs && (
          <button
            onClick={() => setShowNew(true)}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '12px 22px', borderRadius: 999, border: 'none', background: 'var(--color-ink)', color: 'var(--color-bg)', fontSize: 14, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}
          >
            <Plus size={14} /> Nieuw project
          </button>
        )}
        {isCustomProject && !showTabs && (
          <button
            onClick={handleDeleteProject}
            style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 13px', borderRadius: 14, border: '1px solid var(--color-border)', background: 'transparent', color: 'var(--color-subtle)', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', marginTop: 4 }}
          >
            <Trash2 size={13} /> Verwijder project
          </button>
        )}
      </div>

      {/* Project tabs — hidden when fixedProjectId */}
      {showTabs && (
        <div style={{ display: 'flex', gap: 6, marginBottom: 24 }}>
          {projects.map(p => {
            const isActive = p.id === activeId
            return (
              <button
                key={p.id}
                onClick={() => setActiveId(p.id)}
                style={{
                  padding: '8px 18px', borderRadius: 16, fontSize: 13, fontWeight: 500, cursor: 'pointer',
                  border: `1.5px solid ${isActive ? p.color + '60' : 'var(--color-border)'}`,
                  background: isActive ? p.color + '14' : 'var(--color-card)',
                  color: isActive ? p.color : 'var(--color-muted)',
                  transition: 'all 160ms ease',
                }}
              >
                {p.name}
              </button>
            )
          })}
        </div>
      )}

      {/* Sub-tabs for LU project */}
      {isLU && activeProject && (
        <div style={{ display: 'flex', gap: 2, marginBottom: 24, borderBottom: '1px solid var(--color-border)', paddingBottom: 0 }}>
          {[
            { id: 'admin', label: 'Administratie' },
            { id: 'team',  label: 'Team' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setSubTab(tab.id as 'admin' | 'team')}
              style={{
                padding: '9px 18px', background: 'none', border: 'none', cursor: 'pointer',
                fontSize: 13, fontWeight: 500, fontFamily: 'inherit',
                color: subTab === tab.id ? 'var(--color-ink)' : 'var(--color-muted)',
                borderBottom: `2px solid ${subTab === tab.id ? 'var(--pf-depth-text)' : 'transparent'}`,
                marginBottom: -1,
                transition: 'all 150ms',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}

      {/* Sub-tabs for custom projects */}
      {isCustomProject && activeProject && (
        <div style={{ display: 'flex', gap: 2, marginBottom: 24, borderBottom: '1px solid var(--color-border)', paddingBottom: 0 }}>
          {[
            { id: 'admin',     label: 'Administratie' },
            { id: 'marketing', label: 'Marketing Strategy' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setCustomTab(tab.id as 'admin' | 'marketing')}
              style={{
                padding: '9px 18px', background: 'none', border: 'none', cursor: 'pointer',
                fontSize: 13, fontWeight: 500, fontFamily: 'inherit',
                color: customTab === tab.id ? 'var(--color-ink)' : 'var(--color-muted)',
                borderBottom: `2px solid ${customTab === tab.id ? 'var(--pf-depth-text)' : 'transparent'}`,
                marginBottom: -1,
                transition: 'all 150ms',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}

      {/* Active project content */}
      {isLU && subTab === 'team' ? (
        <TeamBoard />
      ) : isCustomProject && activeProject && customTab === 'marketing' ? (
        <MarketingStrategy projectId={activeProject.id} projectName={activeProject.name} />
      ) : activeProject ? (
        <ProjectCard project={activeProject} onAddTask={() => setShowAddModal(true)} />
      ) : (
        <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--color-subtle)' }}>
          <FolderOpen size={32} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
          <p style={{ fontSize: 14 }}>Nog geen projecten. Maak er een met de knop hierboven.</p>
        </div>
      )}

      {/* Add task modal */}
      {showNew && (
        <NewProjectModal onClose={() => setShowNew(false)} onCreated={path => { const id = path.split('/')[2]; setShowNew(false); if (id) setActiveId(id) }} />
      )}
      {showAddModal && activeProject && (
        <AddTaskModal projectId={activeProject.id} onClose={() => setShowAddModal(false)} />
      )}
    </div>
  )
}
