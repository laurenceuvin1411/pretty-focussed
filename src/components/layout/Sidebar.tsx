import { useState, useEffect } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useHabitStore } from '../../store/habitStore'
import { useProjectDataStore, SECTION_LABEL } from '../../store/projectStore'
import type { Project, ProjectSection } from '../../store/projectStore'
import { format } from 'date-fns'
import { nlBE } from 'date-fns/locale'
import { Plus, X, Trash2, Sparkles } from 'lucide-react'
import { isOwner, firstName } from '../../lib/workspace'

const TODAY = format(new Date(), 'yyyy-MM-dd')

const mainItems = [
  { path: '/habits',       label: 'Habits'       },
  { path: '/health',       label: 'Sports'       },
  { path: '/recipes',      label: 'Recipes'      },
]

const planningItems = [
  { path: '/planner',      label: 'Goals'        },
  { path: '/productivity', label: 'Productivity' },
]

const systemItems = [
  { path: '/automations', label: 'Automations' },
]

const SEED_PROJECT_IDS = new Set(['laurence-uvin', 'bora'])

const seedProjectGroups = [
  {
    id: 'lu',
    label: 'Laurence Uvin',
    accent: '#4C6481',
    items: [
      { path: '/lu-kompas',   label: 'Kompas'   },
      { path: '/sales',       label: 'Sales'    },
      { path: '/finance',     label: 'Finance'  },
      { path: '/lu-content',  label: 'Content'  },
      { path: '/lu-admin',    label: 'Admin'    },
    ],
  },
  {
    id: 'bora',
    label: 'Bora',
    accent: '#4C6481',
    items: [
      { path: '/bora-content', label: 'Content' },
      { path: '/bora-admin',   label: 'Admin'   },
    ],
  },
]

// ── Template definitions ─────────────────────────────────────────
const TEMPLATE_COLORS = ['#4C6481', '#7C7F84', '#3C3E42', '#B9BBBE', '#6B7B8D', '#5A6878']

interface Template {
  id: string
  label: string
  sub: string
  checklists: { title: string; items: { title: string; description?: string; recurrence: 'weekly' | 'monthly' | 'quarterly' | 'yearly' | 'once' }[] }[]
}

const TEMPLATES: Template[] = [
  {
    id: 'bv',
    label: 'Vennootschap / BV',
    sub: 'BTW, RSZ, jaarrekening',
    checklists: [
      {
        title: 'Maandelijks',
        items: [
          { title: 'Upload uitgaande facturen', description: 'Exporteer alle uitgaande facturen naar je boekhoudprogramma', recurrence: 'monthly' },
          { title: 'Upload inkomende facturen', description: 'Verzamel en upload alle ontvangen facturen', recurrence: 'monthly' },
        ],
      },
      {
        title: 'Per kwartaal',
        items: [
          { title: 'BTW-aangifte indienen', description: 'Kwartaalaangifte via MyMinfin', recurrence: 'quarterly' },
          { title: 'BTW betalen', description: 'Betaal het verschuldigde BTW-bedrag', recurrence: 'quarterly' },
          { title: 'Sociale bijdragen betalen', description: 'Kwartaalbijdrage als zelfstandige', recurrence: 'quarterly' },
        ],
      },
      {
        title: 'Jaarlijks',
        items: [
          { title: 'BTW-klantenlisting indienen', description: 'Deadline: 31 maart', recurrence: 'yearly' },
          { title: 'Jaarrekening neerleggen bij NBB', description: 'Deadline: 7 maanden na boekjaarafsluiting', recurrence: 'yearly' },
          { title: 'Aangifte vennootschapsbelasting', description: 'Via Biztax, normaal voor 30 september', recurrence: 'yearly' },
        ],
      },
    ],
  },
  {
    id: 'freelance',
    label: 'Freelance',
    sub: 'Facturen, BTW, voorafbetalingen',
    checklists: [
      {
        title: 'Maandelijks',
        items: [
          { title: 'Facturen versturen', description: 'Verzend openstaande facturen naar klanten', recurrence: 'monthly' },
          { title: 'Inkomsten & uitgaven bijhouden', description: 'Update je financieel overzicht', recurrence: 'monthly' },
        ],
      },
      {
        title: 'Per kwartaal',
        items: [
          { title: 'BTW-aangifte indienen', description: 'Kwartaalaangifte via MyMinfin', recurrence: 'quarterly' },
          { title: 'Voorafbetaling belasting', description: 'Vrijwillige voorafbetaling om vermeerdering te vermijden', recurrence: 'quarterly' },
        ],
      },
    ],
  },
  {
    id: 'project',
    label: 'Side project',
    sub: 'Wekelijkse check-ins + mijlpalen',
    checklists: [
      {
        title: 'Wekelijks',
        items: [
          { title: 'Weekly review', description: 'Wat liep goed? Wat beter? Volgende stap?', recurrence: 'weekly' },
          { title: 'Taken updaten', description: 'Prioriteiten herzien en backlog opkuisen', recurrence: 'weekly' },
        ],
      },
      {
        title: 'Maandelijks',
        items: [
          { title: 'Metrics bijhouden', description: 'Noteer groei, gebruikers, inkomsten', recurrence: 'monthly' },
          { title: 'Roadmap aanpassen', description: 'Pas je plan aan op basis van feedback', recurrence: 'monthly' },
        ],
      },
    ],
  },
  {
    id: 'blank',
    label: 'Blanco',
    sub: 'Start met een leeg project',
    checklists: [],
  },
]

// ── New Project Modal ────────────────────────────────────────────
export function NewProjectModal({ onClose, onCreated }: { onClose: () => void; onCreated: (path: string) => void }) {
  const { addProject } = useProjectDataStore()
  const [name, setName] = useState('')
  const [templateId, setTemplateId] = useState('bv')
  const [colorIdx, setColorIdx] = useState(0)
  const [sections, setSections] = useState<ProjectSection[]>(['content', 'admin'])

  const ALL_SECTIONS: ProjectSection[] = ['kompas', 'sales', 'content', 'admin']
  const SECTION_SUB: Record<ProjectSection, string> = {
    kompas:  'richting & doelen',
    sales:   'leads & pipeline',
    content: 'planner & kalender',
    admin:   'checklists van de template',
  }

  function toggleSection(sec: ProjectSection) {
    setSections(s => s.includes(sec) ? s.filter(x => x !== sec) : [...s, sec])
  }

  const canCreate = !!name.trim() && sections.length > 0

  function handleCreate() {
    if (!canCreate) return
    const template = TEMPLATES.find(t => t.id === templateId)!
    const checklists = template.checklists.map(cl => ({
      id: crypto.randomUUID(),
      title: cl.title,
      items: cl.items.map(item => ({ id: crypto.randomUUID(), ...item })),
    }))
    const ordered = ALL_SECTIONS.filter(s => sections.includes(s))
    const id = addProject({
      name: name.trim(),
      color: TEMPLATE_COLORS[colorIdx],
      emoji: '',
      checklists,
      sections: ordered,
    })
    const first = ordered[0]
    onCreated(first === 'admin' ? `/projects/${id}` : `/projects/${id}/${first}`)
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '9px 12px', borderRadius: 10,
    border: '1px solid var(--color-border)', background: 'var(--color-surface)',
    color: 'var(--color-ink)', fontSize: 13, fontFamily: 'inherit',
    outline: 'none', boxSizing: 'border-box',
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(6px)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ background: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: 20, width: '100%', maxWidth: 460, padding: '28px 28px 24px' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22 }}>
          <div>
            <h2 style={{ fontSize: 17, fontWeight: 700, color: 'var(--color-ink)', letterSpacing: '-0.01em' }}>Nieuw project</h2>
            <p style={{ fontSize: 12, color: 'var(--color-subtle)', marginTop: 2 }}>Kies een template en geef het een naam</p>
          </div>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 9, border: '1px solid var(--color-border)', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-muted)' }}>
            <X size={14} />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          {/* Name */}
          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-muted)', display: 'block', marginBottom: 5, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Naam</label>
            <input
              style={inputStyle}
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="My New Project"
              autoFocus
              onKeyDown={e => e.key === 'Enter' && handleCreate()}
            />
          </div>

          {/* Color */}
          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-muted)', display: 'block', marginBottom: 8, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Kleur</label>
            <div style={{ display: 'flex', gap: 8 }}>
              {TEMPLATE_COLORS.map((c, i) => (
                <button
                  key={c}
                  onClick={() => setColorIdx(i)}
                  style={{
                    width: 26, height: 26, borderRadius: '50%', background: c, border: `2px solid ${colorIdx === i ? 'var(--color-ink)' : 'transparent'}`,
                    cursor: 'pointer', padding: 0, outline: colorIdx === i ? '2px solid var(--color-bg)' : 'none', outlineOffset: -4,
                    transition: 'all 150ms',
                  }}
                />
              ))}
            </div>
          </div>

          {/* Onderdelen */}
          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-muted)', display: 'block', marginBottom: 8, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Onderdelen</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
              {ALL_SECTIONS.map(sec => {
                const active = sections.includes(sec)
                return (
                  <button
                    key={sec}
                    type="button"
                    onClick={() => toggleSection(sec)}
                    style={{
                      display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 1,
                      padding: '9px 12px', borderRadius: 10, cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left',
                      border: `1.5px solid ${active ? '#4C6481' : 'var(--color-border)'}`,
                      background: active ? 'rgba(76,100,129,0.08)' : 'transparent',
                      transition: 'all 150ms',
                    }}
                  >
                    <span style={{ fontSize: 12.5, fontWeight: 700, color: active ? '#4C6481' : 'var(--color-ink)' }}>{SECTION_LABEL[sec]}</span>
                    <span style={{ fontSize: 10.5, color: 'var(--color-subtle)' }}>{SECTION_SUB[sec]}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Template */}
          {sections.includes('admin') && (
          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-muted)', display: 'block', marginBottom: 8, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Admin-template</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {TEMPLATES.map(t => {
                const active = templateId === t.id
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setTemplateId(t.id)}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '10px 14px', borderRadius: 10, cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left',
                      border: `1.5px solid ${active ? '#4C6481' : 'var(--color-border)'}`,
                      background: active ? 'rgba(76,100,129,0.08)' : 'transparent',
                      transition: 'all 150ms',
                    }}
                  >
                    <span style={{ fontSize: 13, fontWeight: 600, color: active ? '#4C6481' : 'var(--color-ink)' }}>{t.label}</span>
                    <span style={{ fontSize: 11, color: 'var(--color-subtle)' }}>{t.sub}</span>
                  </button>
                )
              })}
            </div>
          </div>
          )}

          {/* Actions */}
          <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
            <button onClick={onClose} style={{ flex: 1, padding: 11, borderRadius: 10, border: '1px solid var(--color-border)', background: 'transparent', color: 'var(--color-muted)', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>
              Annuleer
            </button>
            <button
              onClick={handleCreate}
              disabled={!canCreate}
              style={{ flex: 2, padding: 11, borderRadius: 10, border: 'none', background: canCreate ? '#4C6481' : 'var(--color-border)', color: canCreate ? '#fff' : 'var(--color-muted)', fontSize: 13, fontWeight: 700, cursor: canCreate ? 'pointer' : 'default', fontFamily: 'inherit', transition: 'all 150ms' }}
            >
              Project aanmaken
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Seed project group component ─────────────────────────────────
function ProjectGroup({ group, defaultOpen, activePath, onDelete, footer }: { group: typeof seedProjectGroups[0]; defaultOpen: boolean; activePath?: string; onDelete?: () => void; footer?: React.ReactNode }) {
  const [open, setOpen] = useState(defaultOpen)
  const [hover, setHover] = useState(false)

  // Klap open zodra een sub-pagina van deze groep actief wordt
  useEffect(() => {
    if (activePath && group.items.some(i => i.path === activePath)) setOpen(true)
  }, [activePath])

  return (
    <div onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <button
          onClick={() => setOpen(o => !o)}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            flex: 1, minWidth: 0, padding: '4px 14px', background: 'none', border: 'none',
            cursor: 'pointer', textAlign: 'left',
          }}
        >
          <div style={{ width: 4, height: 4, borderRadius: '50%', background: group.accent, flexShrink: 0, opacity: 0.8 }} />
          <span style={{ fontSize: 11, color: 'var(--color-subtle)', letterSpacing: '0.01em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {group.label}
          </span>
        </button>
        {onDelete && hover && (
          <button
            onClick={onDelete}
            title="Verwijder project"
            style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--color-subtle)', padding: '2px 10px 2px 4px', display: 'flex', alignItems: 'center' }}
          >
            <Trash2 size={11} />
          </button>
        )}
      </div>

      {open && (
        <div style={{ paddingLeft: 24, borderLeft: '1px solid var(--color-border)', marginLeft: 16, marginTop: 2 }}>
          {group.items.map(({ path, label }) => (
            <NavLink
              key={path}
              to={path}
              end
              className={({ isActive }) => `sidebar-item sidebar-item--sub ${isActive ? 'active' : ''}`}
            >
              {label}
            </NavLink>
          ))}
          {footer}
        </div>
      )}
    </div>
  )
}

// ── Custom project nav item ──────────────────────────────────────
// Projecten met sections renderen als groep met sub-tabs, net zoals
// de Laurence Uvin / Bora groepen. Oudere projecten zonder sections
// blijven een enkel linkje naar hun overview.
function CustomProjectItem({ project, pathname }: { project: Project; pathname: string }) {
  const base = `/projects/${project.id}`
  const sections = project.sections ?? []
  const { deleteProject, updateProject } = useProjectDataStore()
  const navigate = useNavigate()
  const [hover, setHover] = useState(false)
  const [showAddSection, setShowAddSection] = useState(false)

  function handleDelete() {
    if (!confirm(`Project "${project.name}" verwijderen? Alle data van dit project gaat verloren.`)) return
    deleteProject(project.id)
    if (pathname.startsWith(base)) navigate('/')
  }

  const ALL_SECTIONS: ProjectSection[] = ['kompas', 'sales', 'content', 'admin']
  const missing = ALL_SECTIONS.filter(s => !sections.includes(s))

  function handleAddSection(sec: ProjectSection) {
    updateProject(project.id, { sections: ALL_SECTIONS.filter(s => sections.includes(s) || s === sec) })
    setShowAddSection(false)
    navigate(sec === 'admin' ? base : `${base}/${sec}`)
  }

  if (sections.length > 0) {
    const items = [
      ...(sections.includes('kompas')  ? [{ path: `${base}/kompas`,  label: 'Kompas'  }] : []),
      ...(sections.includes('sales')   ? [{ path: `${base}/sales`,   label: 'Sales'   }] : []),
      ...(sections.includes('content') ? [{ path: `${base}/content`, label: 'Content' }] : []),
      ...(sections.includes('admin')   ? [{ path: base,              label: 'Admin'   }] : []),
    ]
    const footer = missing.length > 0 ? (
      <div>
        <button
          onClick={() => setShowAddSection(o => !o)}
          style={{
            display: 'flex', alignItems: 'center', gap: 5, padding: '4px 12px',
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'var(--color-subtle)', fontSize: 10.5, fontFamily: 'inherit',
          }}
        >
          <Plus size={10} /> onderdeel
        </button>
        {showAddSection && missing.map(sec => (
          <button
            key={sec}
            onClick={() => handleAddSection(sec)}
            style={{
              display: 'block', width: '100%', textAlign: 'left', padding: '4px 12px 4px 26px',
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--color-ink)', fontSize: 11, fontWeight: 600, fontFamily: 'inherit',
            }}
          >
            {SECTION_LABEL[sec]}
          </button>
        ))}
      </div>
    ) : undefined
    return (
      <ProjectGroup
        group={{ id: project.id, label: project.name, accent: project.color, items }}
        defaultOpen={items.some(i => i.path === pathname)}
        activePath={pathname}
        onDelete={handleDelete}
        footer={footer}
      />
    )
  }

  return (
    <div onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)} style={{ display: 'flex', alignItems: 'center' }}>
      <NavLink
        to={base}
        className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}
        style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 }}
      >
        <div style={{ width: 4, height: 4, borderRadius: '50%', background: project.color, flexShrink: 0, opacity: 0.8 }} />
        <span style={{ fontSize: 11, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{project.name}</span>
      </NavLink>
      {hover && (
        <button
          onClick={handleDelete}
          title="Verwijder project"
          style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--color-subtle)', padding: '2px 10px 2px 4px', display: 'flex', alignItems: 'center' }}
        >
          <Trash2 size={11} />
        </button>
      )}
    </div>
  )
}

export function Sidebar() {
  const { habits, getLogForDate } = useHabitStore()
  const { projects } = useProjectDataStore()
  const location = useLocation()
  const navigate = useNavigate()
  const [showNewProject, setShowNewProject] = useState(false)

  const done = getLogForDate(TODAY).filter(l => l.completed).length
  const total = habits.filter(h => h.active).length
  const dayLabel = format(new Date(), 'EEEE', { locale: nlBE })

  const customProjects = projects.filter(p => !SEED_PROJECT_IDS.has(p.id))

  function handleProjectCreated(path: string) {
    setShowNewProject(false)
    navigate(path)
  }

  return (
    <>
      <aside
        className="fixed left-0 top-0 h-screen flex flex-col z-20"
        style={{
          width: 200,
          background: 'var(--sidebar-bg)',
          backdropFilter: 'blur(40px) saturate(180%)',
          WebkitBackdropFilter: 'blur(40px) saturate(180%)',
          borderRight: '1px solid var(--color-border)',
        }}
      >
        {/* Name */}
        <div style={{ padding: '28px 18px 20px' }}>
          <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-ink)', letterSpacing: '-0.01em', lineHeight: 1 }}>
            {firstName()}
          </p>
          <p style={{ fontSize: 11, color: 'var(--color-subtle)', marginTop: 5, textTransform: 'capitalize' }}>
            {dayLabel}
          </p>
        </div>

        <div style={{ height: 1, background: 'var(--color-border)', margin: '0 18px' }} />

        {/* Nav */}
        <nav style={{ padding: '12px 8px', flex: 1, display: 'flex', flexDirection: 'column', gap: 1, overflowY: 'auto' }}>

          {/* Pretty Focussed: the studio is the front door */}
          <NavLink
            to="/"
            end
            className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}
            style={{ fontWeight: 500, letterSpacing: '-0.01em' }}
          >
            Studio
          </NavLink>

          {/* Overview — startpunt van de dag */}
          <NavLink
            to="/os"
            end
            className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}
            style={({ isActive }) => ({
              fontWeight: 800,
              letterSpacing: '-0.01em',
              color: isActive ? undefined : '#4C6481',
            })}
          >
            Overview
          </NavLink>

          <div style={{ height: 1, background: 'var(--color-border)', margin: '6px 6px' }} />

          {mainItems.map(({ path, label }) => (
            <NavLink
              key={path}
              to={path}
              end={path === '/'}
              className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}
            >
              {label}
            </NavLink>
          ))}

          <div style={{ height: 1, background: 'var(--color-border)', margin: '8px 6px' }} />

          {planningItems.map(({ path, label }) => (
            <NavLink
              key={path}
              to={path}
              className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}
            >
              {label}
            </NavLink>
          ))}

          <div style={{ height: 1, background: 'var(--color-border)', margin: '8px 6px' }} />

          {/* Seed project groups */}
          {isOwner() && seedProjectGroups.map(group => (
            <ProjectGroup
              key={group.id}
              group={group}
              defaultOpen={group.items.some(i => i.path === location.pathname)}
            />
          ))}

          {/* Custom projects — same level as seed groups */}
          {customProjects.map(p => (
            <CustomProjectItem key={p.id} project={p} pathname={location.pathname} />
          ))}

          {/* Add project button */}
          <button
            onClick={() => setShowNewProject(true)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '5px 14px', background: 'none', border: 'none',
              cursor: 'pointer', color: 'var(--color-subtle)', fontSize: 11,
              fontFamily: 'inherit', letterSpacing: '0.01em',
              transition: 'color 150ms',
            }}
            onMouseEnter={e => (e.currentTarget.style.color = '#4C6481')}
            onMouseLeave={e => (e.currentTarget.style.color = 'var(--color-subtle)')}
          >
            <Plus size={11} />
            Nieuw project
          </button>

          <div style={{ height: 1, background: 'var(--color-border)', margin: '8px 6px' }} />

          {systemItems.map(({ path, label }) => (
            <NavLink
              key={path}
              to={path}
              className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}
            >
              {label}
            </NavLink>
          ))}

          <div style={{ flex: 1 }} />
        </nav>

        {/* Werk met Laurence — alleen voor gasten */}
        {!isOwner() && (
          <NavLink
            to="/coaching"
            style={({ isActive }) => ({
              display: 'block', margin: '0 10px 10px', padding: '13px 14px', borderRadius: 16, textDecoration: 'none',
              background: isActive ? 'rgba(76,100,129,0.14)' : 'linear-gradient(135deg, rgba(242,220,227,0.55), rgba(214,229,238,0.45))',
              border: '1px solid rgba(255,255,255,0.7)',
              boxShadow: '0 4px 14px rgba(120,100,110,0.10)',
            })}
          >
            <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#4C6481', fontFamily: 'var(--font-mono)', display: 'flex', alignItems: 'center', gap: 5, marginBottom: 4 }}>
              <Sparkles size={9} /> Werk met Laurence
            </p>
            <p style={{ fontSize: 11.5, color: 'var(--color-ink)', lineHeight: 1.4, fontWeight: 600 }}>Private coaching</p>
            <p style={{ fontSize: 10, color: 'var(--color-subtle)', marginTop: 2 }}>Bekijk de opties →</p>
          </NavLink>
        )}

        {/* Bottom */}
        {total > 0 && (
          <div style={{ padding: '12px 18px 20px', borderTop: '1px solid var(--color-border)' }}>
            <p style={{ fontSize: 10, color: 'var(--color-subtle)', letterSpacing: '0.01em' }}>
              {done} / {total} habits vandaag
            </p>
            <div style={{ marginTop: 6, height: 2, background: 'var(--color-border)', borderRadius: 2, overflow: 'hidden' }}>
              <div style={{
                height: '100%',
                width: `${total > 0 ? (done / total) * 100 : 0}%`,
                background: '#4C6481',
                borderRadius: 2,
                transition: 'width 600ms cubic-bezier(.16,1,.3,1)',
              }} />
            </div>
          </div>
        )}
      </aside>

      {showNewProject && (
        <NewProjectModal
          onClose={() => setShowNewProject(false)}
          onCreated={handleProjectCreated}
        />
      )}
    </>
  )
}
