import { useState, useEffect, useMemo, useRef, createContext, useContext } from 'react'
import { format, addMonths, subMonths, getDaysInMonth, startOfMonth, getDay } from 'date-fns'
import { nlBE } from 'date-fns/locale'
import {
  Plus, Check, Trash2, Copy, ChevronDown, ChevronRight, ChevronLeft,
  Sparkles, TrendingUp, Mic, Search, X, Flame, Calendar as CalendarIcon,
  GripVertical, Lightbulb, Film, LayoutGrid, Download, Upload,
} from 'lucide-react'
import {
  useContentCreationStore, useBoraContentCreationStore, getProjectContentStore, getContentStats, PILLAR_CFG,
} from '../store/contentCreationStore'
import type { Pillar, Script, ContentCard, ScriptStatus, CardStatus, ContentFormat, ContentCreationStoreHook } from '../store/contentCreationStore'

// Elke merk-variant (LU, Bora) krijgt zijn eigen store via deze context
const StoreCtx = createContext<ContentCreationStoreHook>(useContentCreationStore)
const useStore = () => useContext(StoreCtx)()
const BizCtx = createContext<'lu' | 'bora'>('lu')

// Bora: geen 100-challenge maar een weekdoel van 2 posts

function weekRange(d = new Date()): [string, string] {
  const x = new Date(d)
  const day = (x.getDay() + 6) % 7
  x.setDate(x.getDate() - day)
  const mon = x.toISOString().split('T')[0]
  x.setDate(x.getDate() + 6)
  return [mon, x.toISOString().split('T')[0]]
}

function postsInWeek(scripts: Script[], postedDays: Record<string, Pillar>, ref = new Date()) {
  const [mon, sun] = weekRange(ref)
  const scriptCount = scripts.filter(s => s.posted && s.postedAt && s.postedAt >= mon && s.postedAt <= sun).length
  const dayCount = Object.keys(postedDays).filter(d => d >= mon && d <= sun).length
  return scriptCount + dayCount
}
import { saveContentFile, deleteContentFile, downloadContentFile } from '../utils/contentFiles'

const ACCENT = 'var(--pf-sage)'
const GOLD = 'var(--pf-depth-text)'

const PILLAR_ICON: Record<Pillar, React.ReactNode> = {
  brand: <Sparkles size={12} />,
  followers: <TrendingUp size={12} />,
  customers: <Mic size={12} />,
}

const SCRIPT_STATUS_CFG: Record<ScriptStatus, { label: string; color: string }> = {
  draft:  { label: 'Draft',   color: 'var(--color-subtle)' },
  ready:  { label: 'Klaar',   color: 'var(--pf-depth-text)' },
  filmed: { label: 'Gefilmd', color: 'var(--pf-depth-text)' },
  posted: { label: 'Gepost',  color: 'var(--pf-depth-text)' },
}

const CARD_STATUS_CFG: Record<CardStatus, { label: string; color: string }> = {
  'idea':        { label: 'Idee',    color: 'var(--color-subtle)' },
  'planned':     { label: 'Gepland', color: 'var(--pf-depth-text)' },
  'in-progress': { label: 'Bezig',   color: 'var(--pf-depth-text)' },
  'posted':      { label: 'Gepost',  color: 'var(--pf-depth-text)' },
}

const inputStyle: React.CSSProperties = {
  padding: '8px 12px', borderRadius: 14, border: '1px solid var(--color-border)',
  background: 'var(--color-surface)', color: 'var(--color-ink)', fontSize: 12,
  fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box',
}

function Mono({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return <span style={{ fontFamily: 'var(--font-mono)', ...style }}>{children}</span>
}

const FORMAT_CFG: Record<ContentFormat, { label: string; icon: React.ReactNode }> = {
  reel:      { label: 'Reel',      icon: <Film size={11} /> },
  carrousel: { label: 'Carrousel', icon: <LayoutGrid size={11} /> },
}

function FormatToggle({ value, onChange }: { value?: ContentFormat; onChange: (f?: ContentFormat) => void }) {
  return (
    <div style={{ display: 'flex', gap: 6 }}>
      {(Object.keys(FORMAT_CFG) as ContentFormat[]).map(f => {
        const active = value === f
        return (
          <button
            key={f}
            onClick={() => onChange(active ? undefined : f)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 14,
              fontSize: 11.5, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 150ms',
              border: `1.5px solid ${active ? ACCENT : 'var(--color-border)'}`,
              background: active ? 'var(--pf-sage-soft)' : 'transparent',
              color: active ? ACCENT : 'var(--color-muted)',
            }}
          >
            {FORMAT_CFG[f].icon} {FORMAT_CFG[f].label}
          </button>
        )
      })}
    </div>
  )
}

function SectionShell({ title, icon, defaultOpen = true, badge, children }: {
  title: string; icon: React.ReactNode; defaultOpen?: boolean; badge?: string; children: React.ReactNode
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <section style={{ marginBottom: 36 }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{ display: 'flex', alignItems: 'center', gap: 9, background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontFamily: 'inherit', marginBottom: open ? 16 : 0, width: '100%' }}
      >
        {open ? <ChevronDown size={13} color="var(--color-subtle)" /> : <ChevronRight size={13} color="var(--color-subtle)" />}
        {icon}
        <span style={{ fontSize: 12, fontWeight: 500, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--color-ink)', fontFamily: 'var(--font-mono)' }}>{title}</span>
        {badge && <span style={{ fontSize: 10, fontWeight: 500, color: 'var(--color-subtle)', fontFamily: 'var(--font-mono)' }}>{badge}</span>}
      </button>
      {open && children}
    </section>
  )
}

// ═══════════════════════════════════════════════════════════════
// SECTIE 1 · Dashboard
// ═══════════════════════════════════════════════════════════════
function Dashboard() {
  const { scripts, cards, baselinePosted, postedDays, weekGoal } = useStore()
  const stats = useMemo(() => getContentStats(scripts, cards, baselinePosted, postedDays), [scripts, cards, baselinePosted, postedDays])
  const thisWeek = postsInWeek(scripts, postedDays)

  const kpis = [
    { label: 'Posts dit jaar', value: stats.postsThisYear, sub: 'alle pillars' },
    { label: 'Deze week', value: `${thisWeek}/${weekGoal}`, sub: 'weekdoel', color: thisWeek >= weekGoal ? 'var(--pf-depth-text)' : GOLD },
    { label: 'Weekdoel', value: `${Math.min(100, Math.round((thisWeek / weekGoal) * 100))}%`, sub: 'deze week', bar: Math.min(100, Math.round((thisWeek / weekGoal) * 100)) },
    { label: 'Streak', value: stats.streak, sub: stats.streak === 1 ? 'week' : 'weken', icon: <Flame size={13} color={stats.streak > 0 ? 'var(--pf-depth-text)' : 'var(--color-subtle)'} /> },
    { label: 'Deze maand', value: stats.postedThisMonth, sub: 'gepost' },
  ]

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12 }}>
      {kpis.map(k => (
        <div key={k.label} style={{ borderRadius: 16, border: 'none', boxShadow: '0 4px 16px rgb(62 73 54 / .06)', background: 'var(--color-card)', padding: '16px 18px' }}>
          <p style={{ fontSize: 9, fontWeight: 500, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--color-subtle)', fontFamily: 'var(--font-mono)', marginBottom: 10 }}>{k.label}</p>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
            {k.icon}
            <span style={{ fontSize: 26, fontWeight: 500, letterSpacing: '-0.03em', color: k.color ?? 'var(--color-ink)', fontFamily: 'var(--font-mono)', lineHeight: 1 }}>{k.value}</span>
          </div>
          <p style={{ fontSize: 10, color: 'var(--color-subtle)', marginTop: 4 }}>{k.sub}</p>
          {k.bar !== undefined && (
            <div style={{ height: 3, borderRadius: 99, background: 'var(--color-border)', overflow: 'hidden', marginTop: 10 }}>
              <div style={{ height: '100%', width: `${k.bar}%`, background: 'var(--pf-sage)', borderRadius: 99, transition: 'width 800ms cubic-bezier(.16,1,.3,1)' }} />
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// SECTIE 2 · Authority tracker
// ═══════════════════════════════════════════════════════════════
// Het weekdoel: zij kiest hoeveel posts per week, de app telt.
function WeekGoalHeader() {
  const { scripts, postedDays, weekGoal, setWeekGoal } = useStore()
  const thisWeek = postsInWeek(scripts, postedDays)
  const pct = Math.min(100, Math.round((thisWeek / weekGoal) * 100))
  const done = thisWeek >= weekGoal

  return (
    <div style={{ borderRadius: 16, border: `1.5px solid ${done ? 'var(--pf-sage-soft)' : 'var(--pf-sage-soft)'}`, background: 'transparent', padding: '20px 24px', marginBottom: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 14 }}>
        <div>
          <p style={{ fontSize: 10, fontWeight: 500, letterSpacing: '0.14em', textTransform: 'uppercase', color: done ? 'var(--pf-depth-text)' : GOLD, fontFamily: 'var(--font-mono)', marginBottom: 4 }}>Weekdoel</p>
          <p style={{ fontSize: 18, fontWeight: 500, letterSpacing: '-0.02em', color: 'var(--color-ink)', display: 'flex', alignItems: 'center', gap: 6 }}>
            <input
              type="number"
              min={1}
              max={14}
              value={weekGoal}
              onChange={e => setWeekGoal(Number(e.target.value))}
              title="Pas je weekdoel aan"
              style={{ width: 44, padding: '2px 6px', borderRadius: 14, border: '1px solid var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-ink)', fontSize: 16, fontWeight: 500, fontFamily: 'inherit', textAlign: 'center', outline: 'none' }}
            />
            posts per week
          </p>
        </div>
        <p style={{ fontSize: 28, fontWeight: 500, fontFamily: 'var(--font-mono)', letterSpacing: '-0.02em', color: done ? 'var(--pf-depth-text)' : GOLD, lineHeight: 1 }}>
          {thisWeek}<span style={{ fontSize: 15, color: 'var(--color-subtle)' }}>/{weekGoal}</span>
        </p>
      </div>
      <div style={{ height: 6, borderRadius: 99, background: 'var(--color-surface-stone)', overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: done ? 'var(--pf-depth-text)' : 'var(--pf-sage)', borderRadius: 99, transition: 'width 800ms cubic-bezier(.16,1,.3,1)' }} />
      </div>
      {done && <p style={{ fontSize: 11, color: 'var(--pf-depth-text)', fontWeight: 500, marginTop: 10 }}>Weekdoel gehaald. Alles erboven is bonus.</p>}
    </div>
  )
}

function ScriptRow({ script, expanded, onToggleExpand, onDragStart, onDragOver, onDrop }: {
  script: Script; expanded: boolean; onToggleExpand: () => void
  onDragStart: (e: React.DragEvent) => void; onDragOver: (e: React.DragEvent) => void; onDrop: (e: React.DragEvent) => void
}) {
  const { togglePosted, updateScript, duplicateScript, deleteScript } = useStore()
  const [hover, setHover] = useState(false)
  const [justCompleted, setJustCompleted] = useState(false)

  function handleToggle() {
    if (!script.posted) {
      setJustCompleted(true)
      setTimeout(() => setJustCompleted(false), 900)
    }
    togglePosted(script.id)
  }

  return (
    <div
      draggable={!expanded}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        borderBottom: '1px solid var(--color-border)',
        background: justCompleted ? 'var(--pf-sage-soft)' : hover ? 'var(--color-surface-stone)' : 'transparent',
        transition: 'background 400ms',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 14px' }}>
        <GripVertical size={12} color={hover ? 'var(--color-subtle)' : 'transparent'} style={{ cursor: 'grab', flexShrink: 0 }} />

        <button
          onClick={handleToggle}
          aria-label={script.posted ? 'Markeer als niet gepost' : 'Markeer als gepost'}
          style={{
            width: 22, height: 22, borderRadius: 14, flexShrink: 0, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: script.posted ? 'var(--pf-depth-text)' : 'transparent',
            border: `2px solid ${script.posted ? 'var(--pf-depth-text)' : 'var(--color-surface-stone)'}`,
            transition: 'all 250ms cubic-bezier(.16,1,.3,1)',
            transform: justCompleted ? 'scale(1.15)' : 'scale(1)',
          }}
        >
          {script.posted && <Check size={12} color="#fff" strokeWidth={3} />}
        </button>

        <input
          value={script.title}
          onChange={e => updateScript(script.id, { title: e.target.value })}
          placeholder="Titel van de video..."
          style={{
            flex: 1, border: 'none', background: 'transparent', outline: 'none',
            fontSize: 13.5, fontWeight: 500, fontFamily: 'inherit', letterSpacing: '-0.01em',
            color: script.posted ? 'var(--color-muted)' : 'var(--color-ink)',
            textDecoration: script.posted ? 'line-through' : 'none', minWidth: 0,
          }}
        />

        <span style={{ fontSize: 9, fontWeight: 500, padding: '2px 8px', borderRadius: 99, flexShrink: 0, fontFamily: 'var(--font-mono)', background: `${SCRIPT_STATUS_CFG[script.status].color}15`, color: SCRIPT_STATUS_CFG[script.status].color }}>
          {SCRIPT_STATUS_CFG[script.status].label}
        </span>

        {script.postedAt && (
          <Mono style={{ fontSize: 9, color: 'var(--color-subtle)', flexShrink: 0 }}>{script.postedAt}</Mono>
        )}

        {hover && (
          <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
            <button onClick={() => duplicateScript(script.id)} title="Dupliceer" style={{ width: 24, height: 24, borderRadius: 14, border: '1px solid var(--color-border)', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-subtle)' }}><Copy size={10} /></button>
            <button onClick={() => deleteScript(script.id)} title="Verwijder" style={{ width: 24, height: 24, borderRadius: 14, border: '1px solid var(--color-border)', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-subtle)' }}><Trash2 size={10} /></button>
          </div>
        )}

        <button onClick={onToggleExpand} aria-label={expanded ? 'Inklappen' : 'Script openen'} style={{ width: 24, height: 24, borderRadius: 14, border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-subtle)', flexShrink: 0 }}>
          {expanded ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
        </button>
      </div>

      {expanded && (
        <div style={{ padding: '4px 46px 18px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <label style={{ fontSize: 9, fontWeight: 500, letterSpacing: '0.10em', textTransform: 'uppercase', color: GOLD, fontFamily: 'var(--font-mono)', display: 'block', marginBottom: 5 }}>Script</label>
            <textarea
              value={script.script}
              onChange={e => updateScript(script.id, { script: e.target.value })}
              placeholder={'Hook...\n\nBody...\n\nAfsluiter...'}
              rows={Math.max(5, script.script.split('\n').length + 1)}
              style={{ width: '100%', border: '1px solid var(--color-border)', borderRadius: 16, background: 'var(--color-surface)', outline: 'none', resize: 'vertical', fontSize: 13, lineHeight: 1.7, color: 'var(--color-ink)', fontFamily: 'inherit', boxSizing: 'border-box', padding: '12px 14px' }}
            />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 10 }}>
            <div>
              <label style={{ fontSize: 9, fontWeight: 500, letterSpacing: '0.10em', textTransform: 'uppercase', color: 'var(--color-subtle)', fontFamily: 'var(--font-mono)', display: 'block', marginBottom: 5 }}>CTA</label>
              <input value={script.cta} onChange={e => updateScript(script.id, { cta: e.target.value })} placeholder="Link in bio / DM me..." style={{ ...inputStyle, width: '100%' }} />
            </div>
            <div>
              <label style={{ fontSize: 9, fontWeight: 500, letterSpacing: '0.10em', textTransform: 'uppercase', color: 'var(--color-subtle)', fontFamily: 'var(--font-mono)', display: 'block', marginBottom: 5 }}>Platform</label>
              <select value={script.platform} onChange={e => updateScript(script.id, { platform: e.target.value })} style={{ ...inputStyle, width: '100%', cursor: 'pointer' }}>
                {['Instagram', 'TikTok', 'YouTube', 'LinkedIn', 'Meerdere'].map(p => <option key={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 9, fontWeight: 500, letterSpacing: '0.10em', textTransform: 'uppercase', color: 'var(--color-subtle)', fontFamily: 'var(--font-mono)', display: 'block', marginBottom: 5 }}>Status</label>
              <select value={script.status} onChange={e => updateScript(script.id, { status: e.target.value as ScriptStatus })} style={{ ...inputStyle, width: '100%', cursor: 'pointer' }}>
                {(Object.keys(SCRIPT_STATUS_CFG) as ScriptStatus[]).map(st => <option key={st} value={st}>{SCRIPT_STATUS_CFG[st].label}</option>)}
              </select>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 160px', gap: 10 }}>
            <div>
              <label style={{ fontSize: 9, fontWeight: 500, letterSpacing: '0.10em', textTransform: 'uppercase', color: 'var(--color-subtle)', fontFamily: 'var(--font-mono)', display: 'block', marginBottom: 5 }}>Notities</label>
              <input value={script.notes} onChange={e => updateScript(script.id, { notes: e.target.value })} placeholder="B-roll, outfit, locatie..." style={{ ...inputStyle, width: '100%' }} />
            </div>
            <div>
              <label style={{ fontSize: 9, fontWeight: 500, letterSpacing: '0.10em', textTransform: 'uppercase', color: 'var(--color-subtle)', fontFamily: 'var(--font-mono)', display: 'block', marginBottom: 5 }}>Geplande datum</label>
              <input type="date" value={script.plannedDate ?? ''} onChange={e => updateScript(script.id, { plannedDate: e.target.value || undefined })} style={{ ...inputStyle, width: '100%', colorScheme: 'light dark' }} />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function AuthorityTracker() {
  const { scripts, addScript, reorderScripts } = useStore()
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | ScriptStatus>('all')
  const [sortBy, setSortBy] = useState<'manual' | 'newest' | 'title'>('manual')
  const dragId = useRef<string | null>(null)

  const visible = useMemo(() => {
    let list = [...scripts]
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(s => s.title.toLowerCase().includes(q) || s.script.toLowerCase().includes(q))
    }
    if (statusFilter !== 'all') list = list.filter(s => s.status === statusFilter)
    if (sortBy === 'newest') list.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    if (sortBy === 'title') list.sort((a, b) => a.title.localeCompare(b.title))
    return list
  }, [scripts, search, statusFilter, sortBy])


  function newScript() {
    const id = addScript()
    setExpandedId(id)
  }

  return (
    <div>
      <WeekGoalHeader />

      {/* Toolbar */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        <button
          onClick={newScript}
          data-testid="new-script"
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px', borderRadius: 16, border: 'none', background: 'var(--color-ink)', color: 'var(--color-bg)', fontSize: 12, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}
        >
          <Plus size={13} /> Nieuw script
        </button>
        <div style={{ position: 'relative', flex: 1, minWidth: 160 }}>
          <Search size={12} color="var(--color-subtle)" style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)' }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Zoek scripts..." style={{ ...inputStyle, width: '100%', paddingLeft: 30 }} />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as any)} style={{ ...inputStyle, cursor: 'pointer' }}>
          <option value="all">Alle statussen</option>
          {(Object.keys(SCRIPT_STATUS_CFG) as ScriptStatus[]).map(st => <option key={st} value={st}>{SCRIPT_STATUS_CFG[st].label}</option>)}
        </select>
        <select value={sortBy} onChange={e => setSortBy(e.target.value as any)} style={{ ...inputStyle, cursor: 'pointer' }}>
          <option value="manual">Eigen volgorde</option>
          <option value="newest">Nieuwste eerst</option>
          <option value="title">Op titel</option>
        </select>
      </div>

      {/* Rows */}
      {visible.length === 0 ? (
        <div style={{ padding: '36px 24px', borderRadius: 14, border: '1.5px dashed var(--color-border)', textAlign: 'center' }}>
          <Mic size={18} color={GOLD} style={{ marginBottom: 8 }} />
          <p style={{ fontSize: 13, color: 'var(--color-subtle)' }}>
            {scripts.length === 0 ? 'Schrijf hier je eerste script.' : 'Geen scripts gevonden met deze filters.'}
          </p>
        </div>
      ) : (
        <div style={{ borderRadius: 14, border: 'none', boxShadow: '0 4px 16px rgb(62 73 54 / .06)', background: 'var(--color-card)', overflow: 'hidden' }}>
          {visible.map(s => (
            <ScriptRow
              key={s.id}
              script={s}
              expanded={expandedId === s.id}
              onToggleExpand={() => setExpandedId(expandedId === s.id ? null : s.id)}
              onDragStart={() => { dragId.current = s.id }}
              onDragOver={e => { if (sortBy === 'manual') e.preventDefault() }}
              onDrop={e => {
                e.preventDefault()
                if (sortBy === 'manual' && dragId.current && dragId.current !== s.id) reorderScripts(dragId.current, s.id)
                dragId.current = null
              }}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// SECTIE 3 · Planner board
// ═══════════════════════════════════════════════════════════════
function PlannerCard({ card, onOpen, onDragStart }: { card: ContentCard; onOpen: () => void; onDragStart: (e: React.DragEvent) => void }) {
  const cfg = PILLAR_CFG[card.pillar]
  const st = CARD_STATUS_CFG[card.status]
  return (
    <div
      draggable
      onDragStart={onDragStart}
      onClick={onOpen}
      style={{ borderRadius: 14, border: 'none', boxShadow: '0 4px 16px rgb(62 73 54 / .06)', background: 'var(--color-card)', padding: '11px 13px', cursor: 'pointer', transition: 'border-color 150ms' }}
      onMouseEnter={e => (e.currentTarget.style.borderColor = cfg.color + '60')}
      onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--color-border)')}
    >
      <p style={{ fontSize: 12.5, fontWeight: 500, color: 'var(--color-ink)', lineHeight: 1.4, marginBottom: 7, letterSpacing: '-0.01em' }}>
        {card.priority === 'high' && <span style={{ color: 'var(--pf-depth-text)', marginRight: 4 }}>!</span>}
        {card.title}
      </p>
      <div style={{ display: 'flex', gap: 5, alignItems: 'center', flexWrap: 'wrap' }}>
        <span style={{ fontSize: 8.5, fontWeight: 500, padding: '2px 7px', borderRadius: 99, fontFamily: 'var(--font-mono)', background: `${st.color}15`, color: st.color }}>{st.label}</span>
        {card.format && (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 8.5, fontWeight: 500, padding: '2px 7px', borderRadius: 99, fontFamily: 'var(--font-mono)', background: 'var(--pf-sage-soft)', color: ACCENT }}>
            {FORMAT_CFG[card.format].icon} {FORMAT_CFG[card.format].label}
          </span>
        )}
        {card.hasFile && <Download size={9} color="var(--pf-depth-text)" />}
        {card.date && <Mono style={{ fontSize: 8.5, color: 'var(--color-subtle)' }}>{format(new Date(card.date + 'T12:00:00'), 'd MMM', { locale: nlBE })}</Mono>}
        <Mono style={{ fontSize: 8.5, color: 'var(--color-subtle)' }}>{card.platform}</Mono>
      </div>
    </div>
  )
}

function PlannerBoard({ onOpenCard }: { onOpenCard: (id: string) => void }) {
  const { cards, addCard, moveCard } = useStore()
  const dragId = useRef<string | null>(null)
  const [quickAdd, setQuickAdd] = useState<Record<Pillar, string>>({ brand: '', followers: '', customers: '' })
  const [quickDate, setQuickDate] = useState<Record<Pillar, string>>({ brand: '', followers: '', customers: '' })

  function submitQuickAdd(p: Pillar) {
    if (!quickAdd[p].trim()) return
    addCard(p, quickAdd[p].trim(), quickDate[p] || undefined)
    setQuickAdd(q => ({ ...q, [p]: '' }))
    setQuickDate(q => ({ ...q, [p]: '' }))
  }

  const pillars: Pillar[] = ['brand', 'followers', 'customers']

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, alignItems: 'start' }}>
      {pillars.map(p => {
        const cfg = PILLAR_CFG[p]
        const colCards = cards.filter(c => c.pillar === p).sort((a, b) => a.order - b.order)
        return (
          <div
            key={p}
            onDragOver={e => e.preventDefault()}
            onDrop={e => {
              e.preventDefault()
              if (dragId.current) { moveCard(dragId.current, p); dragId.current = null }
            }}
            style={{ borderRadius: 16, background: cfg.bg, padding: '14px 12px', minHeight: 120 }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 12, padding: '0 4px' }}>
              <span style={{ color: cfg.color }}>{PILLAR_ICON[p]}</span>
              <span style={{ fontSize: 10, fontWeight: 500, letterSpacing: '0.10em', textTransform: 'uppercase', color: cfg.color, fontFamily: 'var(--font-mono)', flex: 1 }}>{cfg.label}</span>
              <Mono style={{ fontSize: 10, fontWeight: 500, color: cfg.color }}>{colCards.length}</Mono>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 7, marginBottom: 10 }}>
              {colCards.map(c => (
                <div
                  key={c.id}
                  onDragOver={e => e.preventDefault()}
                  onDrop={e => {
                    e.preventDefault(); e.stopPropagation()
                    if (dragId.current && dragId.current !== c.id) { moveCard(dragId.current, p, c.id); dragId.current = null }
                  }}
                >
                  <PlannerCard card={c} onOpen={() => onOpenCard(c.id)} onDragStart={() => { dragId.current = c.id }} />
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: 5 }}>
              <input
                value={quickAdd[p]}
                onChange={e => setQuickAdd(q => ({ ...q, [p]: e.target.value }))}
                onKeyDown={e => { if (e.key === 'Enter') submitQuickAdd(p) }}
                placeholder="+ Snel idee toevoegen"
                style={{ ...inputStyle, flex: 1, minWidth: 0, background: 'transparent', border: '1px dashed var(--color-border)', fontSize: 11.5 }}
              />
              <input
                type="date"
                value={quickDate[p]}
                onChange={e => setQuickDate(q => ({ ...q, [p]: e.target.value }))}
                onKeyDown={e => { if (e.key === 'Enter') submitQuickAdd(p) }}
                title="Publicatiedatum (optioneel)"
                aria-label={`Datum voor nieuw idee in ${cfg.label}`}
                style={{ ...inputStyle, width: 112, background: 'transparent', border: '1px dashed var(--color-border)', fontSize: 10.5, colorScheme: 'light dark', flexShrink: 0 }}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// Kaart-detail zijpaneel
// ═══════════════════════════════════════════════════════════════
function CardPanel({ cardId, onClose }: { cardId: string; onClose: () => void }) {
  const { cards, updateCard, deleteCard } = useStore()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const card = cards.find(c => c.id === cardId)
  if (!card) return null
  const cfg = PILLAR_CFG[card.pillar]

  async function handleFile(file: File) {
    setUploading(true)
    try {
      await saveContentFile(cardId, file)
      updateCard(cardId, { hasFile: true, fileName: file.name })
    } finally {
      setUploading(false)
    }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 300, display: 'flex', justifyContent: 'flex-end' }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgb(20 21 15 / .4)', backdropFilter: 'blur(3px)' }} />
      <div style={{ position: 'relative', width: 380, maxWidth: '90vw', height: '100%', background: 'var(--color-bg)', borderLeft: '1px solid var(--color-border)', padding: '28px 26px', overflowY: 'auto', boxSizing: 'border-box' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 10, fontWeight: 500, letterSpacing: '0.10em', textTransform: 'uppercase', color: cfg.color, fontFamily: 'var(--font-mono)' }}>
            {PILLAR_ICON[card.pillar]} {cfg.label}
          </span>
          <button onClick={onClose} aria-label="Sluit paneel" style={{ width: 28, height: 28, borderRadius: 16, border: '1px solid var(--color-border)', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-subtle)' }}><X size={13} /></button>
        </div>

        <textarea
          value={card.title}
          onChange={e => updateCard(card.id, { title: e.target.value })}
          rows={2}
          style={{ width: '100%', border: 'none', background: 'transparent', outline: 'none', resize: 'none', fontSize: 18, fontWeight: 500, color: 'var(--color-ink)', fontFamily: 'inherit', letterSpacing: '-0.01em', lineHeight: 1.35, marginBottom: 18, boxSizing: 'border-box', padding: 0 }}
        />

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <label style={{ fontSize: 9, fontWeight: 500, letterSpacing: '0.10em', textTransform: 'uppercase', color: 'var(--color-subtle)', fontFamily: 'var(--font-mono)', display: 'block', marginBottom: 5 }}>Pillar</label>
              <select value={card.pillar} onChange={e => updateCard(card.id, { pillar: e.target.value as Pillar })} style={{ ...inputStyle, width: '100%', cursor: 'pointer' }}>
                {(Object.keys(PILLAR_CFG) as Pillar[]).map(p => <option key={p} value={p}>{PILLAR_CFG[p].label}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 9, fontWeight: 500, letterSpacing: '0.10em', textTransform: 'uppercase', color: 'var(--color-subtle)', fontFamily: 'var(--font-mono)', display: 'block', marginBottom: 5 }}>Status</label>
              <select value={card.status} onChange={e => updateCard(card.id, { status: e.target.value as CardStatus })} style={{ ...inputStyle, width: '100%', cursor: 'pointer' }}>
                {(Object.keys(CARD_STATUS_CFG) as CardStatus[]).map(st => <option key={st} value={st}>{CARD_STATUS_CFG[st].label}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 9, fontWeight: 500, letterSpacing: '0.10em', textTransform: 'uppercase', color: 'var(--color-subtle)', fontFamily: 'var(--font-mono)', display: 'block', marginBottom: 5 }}>Prioriteit</label>
              <select value={card.priority} onChange={e => updateCard(card.id, { priority: e.target.value as any })} style={{ ...inputStyle, width: '100%', cursor: 'pointer' }}>
                <option value="normal">Normaal</option>
                <option value="high">Hoog</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: 9, fontWeight: 500, letterSpacing: '0.10em', textTransform: 'uppercase', color: 'var(--color-subtle)', fontFamily: 'var(--font-mono)', display: 'block', marginBottom: 5 }}>Platform</label>
              <select value={card.platform} onChange={e => updateCard(card.id, { platform: e.target.value })} style={{ ...inputStyle, width: '100%', cursor: 'pointer' }}>
                {['Instagram', 'TikTok', 'YouTube', 'LinkedIn', 'Meerdere'].map(p => <option key={p}>{p}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label style={{ fontSize: 9, fontWeight: 500, letterSpacing: '0.10em', textTransform: 'uppercase', color: 'var(--color-subtle)', fontFamily: 'var(--font-mono)', display: 'block', marginBottom: 5 }}>Format</label>
            <FormatToggle value={card.format} onChange={f => updateCard(card.id, { format: f })} />
          </div>

          <div>
            <label style={{ fontSize: 9, fontWeight: 500, letterSpacing: '0.10em', textTransform: 'uppercase', color: 'var(--color-subtle)', fontFamily: 'var(--font-mono)', display: 'block', marginBottom: 5 }}>Publicatiedatum</label>
            <input type="date" value={card.date ?? ''} onChange={e => updateCard(card.id, { date: e.target.value || undefined })} style={{ ...inputStyle, width: '100%', colorScheme: 'light dark' }} />
          </div>

          {/* Bestand klaarzetten om op de postdag te downloaden */}
          <div>
            <label style={{ fontSize: 9, fontWeight: 500, letterSpacing: '0.10em', textTransform: 'uppercase', color: 'var(--color-subtle)', fontFamily: 'var(--font-mono)', display: 'block', marginBottom: 5 }}>Content-bestand</label>
            <input
              ref={fileInputRef}
              type="file"
              accept="video/*,image/*,.zip"
              style={{ display: 'none' }}
              onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = '' }}
            />
            {card.hasFile ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '11px 14px', borderRadius: 16, border: `1px solid var(--pf-sage-soft)`, background: 'var(--pf-sage-soft)' }}>
                <Check size={12} color="var(--pf-depth-text)" strokeWidth={3} />
                <span style={{ fontSize: 12, color: 'var(--color-ink)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{card.fileName ?? 'bestand'}</span>
                <button
                  onClick={() => downloadContentFile(card.id)}
                  title="Download om te posten"
                  style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 16, border: 'none', background: 'var(--color-ink)', color: 'var(--color-bg)', fontSize: 11, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0 }}
                >
                  <Download size={11} /> Download
                </button>
                <button
                  onClick={async () => { await deleteContentFile(card.id); updateCard(card.id, { hasFile: false, fileName: undefined }) }}
                  title="Verwijder bestand"
                  style={{ width: 26, height: 26, borderRadius: 14, border: '1px solid var(--color-border)', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-subtle)', flexShrink: 0 }}
                >
                  <Trash2 size={11} />
                </button>
              </div>
            ) : (
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, width: '100%', padding: '13px 14px', borderRadius: 16, border: '1.5px dashed var(--color-border)', background: 'transparent', color: 'var(--color-subtle)', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}
              >
                <Upload size={12} /> {uploading ? 'Bezig...' : 'Reel of carrousel klaarzetten'}
              </button>
            )}
            <p style={{ fontSize: 9.5, color: 'var(--color-subtle)', marginTop: 5, lineHeight: 1.5 }}>
              Bestand wordt op dit toestel bewaard. Op de postdag: open de kaart en klik Download.
            </p>
          </div>

          <div>
            <label style={{ fontSize: 9, fontWeight: 500, letterSpacing: '0.10em', textTransform: 'uppercase', color: 'var(--color-subtle)', fontFamily: 'var(--font-mono)', display: 'block', marginBottom: 5 }}>Notities</label>
            <textarea
              value={card.notes}
              onChange={e => updateCard(card.id, { notes: e.target.value })}
              placeholder="Hook, b-roll, audio, referenties..."
              rows={6}
              style={{ ...inputStyle, width: '100%', resize: 'vertical', lineHeight: 1.6 }}
            />
          </div>

          <button
            onClick={() => { deleteCard(card.id); onClose() }}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 14px', borderRadius: 14, border: '1px solid var(--color-border)', background: 'transparent', color: 'var(--color-subtle)', fontSize: 11, cursor: 'pointer', fontFamily: 'inherit', alignSelf: 'flex-start' }}
          >
            <Trash2 size={11} /> Verwijder idee
          </button>
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// SECTIE 4 · Maandkalender
// ═══════════════════════════════════════════════════════════════
function ContentCalendar({ onOpenCard }: { onOpenCard: (id: string) => void }) {
  const { cards, scripts, updateCard, updateScript, addCard, postedDays, setPostedDay, clearPostedDay } = useStore()
  const calBusiness = useContext(BizCtx)
  const [pillarPickDate, setPillarPickDate] = useState<string | null>(null)
  const [viewDate, setViewDate] = useState(new Date())
  const [addingDate, setAddingDate] = useState<string | null>(null)
  const [addTitle, setAddTitle] = useState('')
  const [addPillar, setAddPillar] = useState<Pillar>('brand')
  const dragRef = useRef<{ type: 'card' | 'script'; id: string } | null>(null)

  function saveQuickAdd() {
    if (!addingDate || !addTitle.trim()) return
    addCard(addPillar, addTitle.trim(), addingDate)
    setAddTitle('')
    setAddingDate(null)
  }

  const year = viewDate.getFullYear()
  const month = viewDate.getMonth()
  const daysInMonth = getDaysInMonth(viewDate)
  const firstDow = (getDay(startOfMonth(viewDate)) + 6) % 7
  const todayStr = new Date().toISOString().split('T')[0]

  type CalItem = { type: 'card' | 'script'; id: string; title: string; pillar: Pillar; done: boolean; hasFile?: boolean; format?: ContentFormat }
  const byDate = useMemo(() => {
    const map: Record<string, CalItem[]> = {}
    cards.forEach(c => { if (c.date) (map[c.date] ??= []).push({ type: 'card', id: c.id, title: c.title, pillar: c.pillar, done: c.status === 'posted', hasFile: c.hasFile, format: c.format }) })
    scripts.forEach(s => {
      const d = s.postedAt ?? s.plannedDate
      if (d) (map[d] ??= []).push({ type: 'script', id: s.id, title: s.title, pillar: 'customers', done: s.posted })
    })
    return map
  }, [cards, scripts])

  const cells: (number | null)[] = [
    ...Array.from({ length: firstDow }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]

  return (
    <div style={{ borderRadius: 16, border: 'none', boxShadow: '0 4px 16px rgb(62 73 54 / .06)', background: 'var(--color-card)', padding: 18 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <p style={{ fontSize: 14, fontWeight: 500, color: 'var(--color-ink)', textTransform: 'capitalize', letterSpacing: '-0.01em' }}>
          {format(viewDate, 'MMMM yyyy', { locale: nlBE })}
        </p>
        <div style={{ display: 'flex', gap: 6 }}>
          <button onClick={() => setViewDate(d => subMonths(d, 1))} aria-label="Vorige maand" style={{ width: 26, height: 26, borderRadius: 14, border: '1px solid var(--color-border)', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-muted)' }}><ChevronLeft size={12} /></button>
          <button onClick={() => setViewDate(d => addMonths(d, 1))} aria-label="Volgende maand" style={{ width: 26, height: 26, borderRadius: 14, border: '1px solid var(--color-border)', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-muted)' }}><ChevronRight size={12} /></button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 5, marginBottom: 5 }}>
        {['Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za', 'Zo'].map(d => (
          <div key={d} style={{ textAlign: 'center', fontSize: 8.5, fontWeight: 500, color: 'var(--color-subtle)', fontFamily: 'var(--font-mono)', letterSpacing: '0.08em', padding: '3px 0' }}>{d}</div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 5 }}>
        {cells.map((d, i) => {
          if (d === null) return <div key={`e${i}`} />
          const dateStr = format(new Date(year, month, d), 'yyyy-MM-dd')
          const items = byDate[dateStr] ?? []
          const isToday = dateStr === todayStr
          return (
            <div
              key={d}
              onDragOver={e => e.preventDefault()}
              onDrop={e => {
                e.preventDefault()
                const drag = dragRef.current
                if (!drag) return
                if (drag.type === 'card') updateCard(drag.id, { date: dateStr })
                else updateScript(drag.id, { plannedDate: dateStr })
                dragRef.current = null
              }}
              className="cal-day"
              style={{ minHeight: 74, borderRadius: 16, border: `1px solid ${isToday ? 'var(--pf-sage-soft)' : 'var(--color-border)'}`, background: isToday ? 'var(--pf-sage-soft)' : 'transparent', padding: '5px 6px', display: 'flex', flexDirection: 'column', gap: 3, position: 'relative' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 9.5, fontWeight: isToday ? 800 : 500, color: isToday ? ACCENT : 'var(--color-subtle)', fontFamily: 'var(--font-mono)' }}>{d}</span>
                <div style={{ display: 'flex', gap: 3, alignItems: 'center' }}>
                  <button
                    onClick={() => { setAddingDate(dateStr); setAddTitle(''); setAddPillar('brand') }}
                    aria-label={`Content toevoegen op ${dateStr}`}
                    className="cal-day-add"
                    style={{ width: 16, height: 16, borderRadius: 14, border: 'none', background: 'var(--pf-sage-soft)', color: ACCENT, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}
                  >
                    <Plus size={10} />
                  </button>
                  {(() => {
                    const dayPillar = postedDays[dateStr]
                    const pillarColor = dayPillar ? PILLAR_CFG[dayPillar].color : null
                    return (
                      <button
                        onClick={() => dayPillar ? clearPostedDay(dateStr) : setPillarPickDate(dateStr)}
                        aria-label={dayPillar ? `Gepost op ${dateStr} ongedaan maken` : `Markeer ${dateStr} als gepost`}
                        title={dayPillar ? `Gepost · ${PILLAR_CFG[dayPillar].label} · klik om te verwijderen` : 'Vink af als je die dag gepost hebt'}
                        className={dayPillar ? '' : 'cal-day-add'}
                        style={{
                          width: 16, height: 16, borderRadius: 14, cursor: 'pointer', padding: 0,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          border: `1.5px solid ${pillarColor ?? 'var(--color-surface-stone)'}`,
                          background: pillarColor ?? 'transparent',
                          color: '#fff', transition: 'all 150ms',
                        }}
                      >
                        {dayPillar && <Check size={9} strokeWidth={3.5} />}
                      </button>
                    )
                  })()}
                </div>
              </div>
              {items.slice(0, 3).map(item => {
                const cfg = PILLAR_CFG[item.pillar]
                return (
                  <div
                    key={`${item.type}-${item.id}`}
                    draggable
                    onDragStart={() => { dragRef.current = { type: item.type, id: item.id } }}
                    onClick={() => item.type === 'card' && onOpenCard(item.id)}
                    title={item.title}
                    style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 8.5, fontWeight: 500, padding: '3px 6px', borderRadius: 14, background: cfg.bg, color: item.done ? 'var(--color-subtle)' : cfg.color, cursor: item.type === 'card' ? 'pointer' : 'grab', textDecoration: item.done ? 'line-through' : 'none', borderLeft: `2px solid ${cfg.color}` }}
                  >
                    {item.format && <span style={{ flexShrink: 0, display: 'inline-flex' }}>{item.format === 'reel' ? <Film size={8} /> : <LayoutGrid size={8} />}</span>}
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{item.title || 'Zonder titel'}</span>
                    {item.hasFile && (
                      <button
                        onClick={e => { e.stopPropagation(); downloadContentFile(item.id) }}
                        title="Download bestand om te posten"
                        style={{ border: 'none', background: 'none', cursor: 'pointer', padding: 0, color: 'var(--pf-depth-text)', display: 'inline-flex', flexShrink: 0 }}
                      >
                        <Download size={9} />
                      </button>
                    )}
                  </div>
                )
              })}
              {items.length > 3 && <span style={{ fontSize: 8, color: 'var(--color-subtle)', fontFamily: 'var(--font-mono)' }}>+{items.length - 3}</span>}
            </div>
          )
        })}
      </div>

      <style>{`
        .cal-day-add { opacity: 0.35; transition: opacity 120ms; }
        .cal-day:hover .cal-day-add { opacity: 1; }
      `}</style>

      {/* Pillar-keuze bij dag afvinken */}
      {pillarPickDate && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 300, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: '26vh', background: 'rgb(20 21 15 / .4)', backdropFilter: 'blur(4px)' }}
          onClick={() => setPillarPickDate(null)}>
          <div onClick={e => e.stopPropagation()} style={{ width: 340, maxWidth: '90vw', borderRadius: 16, background: 'var(--color-bg)', border: '1px solid var(--color-border)', boxShadow: '0 24px 64px rgba(0,0,0,0.30)', padding: '18px 18px 14px' }}>
            <p style={{ fontSize: 10, fontWeight: 500, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--color-subtle)', fontFamily: 'var(--font-mono)', marginBottom: 12 }}>
              Wat postte je op {format(new Date(pillarPickDate + 'T12:00:00'), 'd MMMM', { locale: nlBE })}?
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {(Object.keys(PILLAR_CFG) as Pillar[]).map(p => {
                const cfg = PILLAR_CFG[p]
                return (
                  <button
                    key={p}
                    onClick={() => { setPostedDay(pillarPickDate, p); setPillarPickDate(null) }}
                    style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 14px', borderRadius: 14, border: '1.5px solid var(--color-border)', background: cfg.bg, cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left', transition: 'border-color 150ms' }}
                    onMouseEnter={e => (e.currentTarget.style.borderColor = cfg.color)}
                    onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--color-border)')}
                  >
                    <span style={{ color: cfg.color }}>{PILLAR_ICON[p]}</span>
                    <span style={{ fontSize: 12.5, fontWeight: 500, color: 'var(--color-ink)', flex: 1 }}>{cfg.label}</span>
                    {p === 'customers' && calBusiness === 'lu' && <Mono style={{ fontSize: 9, color: GOLD, fontWeight: 500 }}>telt voor de 100</Mono>}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* Quick add popover */}
      {addingDate && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 300, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: '22vh', background: 'rgb(20 21 15 / .4)', backdropFilter: 'blur(4px)' }}
          onClick={() => setAddingDate(null)}>
          <div onClick={e => e.stopPropagation()} style={{ width: 400, maxWidth: '90vw', borderRadius: 16, background: 'var(--color-bg)', border: '1px solid var(--color-border)', boxShadow: '0 24px 64px rgba(0,0,0,0.30)', padding: '20px 20px 16px' }}>
            <p style={{ fontSize: 10, fontWeight: 500, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--color-subtle)', fontFamily: 'var(--font-mono)', marginBottom: 12 }}>
              Content op {format(new Date(addingDate + 'T12:00:00'), 'EEEE d MMMM', { locale: nlBE })}
            </p>
            <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
              {(Object.keys(PILLAR_CFG) as Pillar[]).map(p => {
                const cfg = PILLAR_CFG[p]
                const active = addPillar === p
                return (
                  <button key={p} onClick={() => setAddPillar(p)}
                    style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 12px', borderRadius: 14, fontSize: 10.5, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 150ms',
                      border: `1.5px solid ${active ? cfg.color : 'var(--color-border)'}`,
                      background: active ? cfg.bg : 'transparent',
                      color: active ? cfg.color : 'var(--color-muted)' }}>
                    {PILLAR_ICON[p]} {cfg.short}
                  </button>
                )
              })}
            </div>
            <input
              autoFocus
              value={addTitle}
              onChange={e => setAddTitle(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') saveQuickAdd(); if (e.key === 'Escape') setAddingDate(null) }}
              placeholder="Wat post je die dag?"
              style={{ ...inputStyle, width: '100%', fontSize: 13, padding: '11px 13px' }}
            />
            <div style={{ display: 'flex', gap: 8, marginTop: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setAddingDate(null)} style={{ padding: '7px 13px', borderRadius: 16, border: '1px solid var(--color-border)', background: 'transparent', color: 'var(--color-subtle)', fontSize: 11.5, cursor: 'pointer', fontFamily: 'inherit' }}>Annuleer</button>
              <button onClick={saveQuickAdd} disabled={!addTitle.trim()} style={{ padding: '7px 16px', borderRadius: 16, border: 'none', background: addTitle.trim() ? 'var(--color-ink)' : 'var(--color-border)', color: addTitle.trim() ? 'var(--color-bg)' : 'var(--color-muted)', fontSize: 11.5, fontWeight: 500, cursor: addTitle.trim() ? 'pointer' : 'default', fontFamily: 'inherit' }}>Inplannen</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// SECTIE 5 · Brain dump
// ═══════════════════════════════════════════════════════════════
function BrainDump() {
  const { brainDump, setBrainDump } = useStore()
  return (
    <textarea
      value={brainDump}
      onChange={e => setBrainDump(e.target.value)}
      placeholder={'Alles wat in je opkomt...\n\nreel over ochtendroutine\nquote over consistency\nvlog van retraite'}
      rows={Math.max(8, brainDump.split('\n').length + 2)}
      style={{ width: '100%', border: '1px solid var(--color-border)', borderRadius: 14, background: 'var(--color-card)', outline: 'none', resize: 'vertical', fontSize: 14, lineHeight: 1.8, color: 'var(--color-ink)', fontFamily: 'inherit', boxSizing: 'border-box', padding: '18px 20px' }}
    />
  )
}

// ═══════════════════════════════════════════════════════════════
// SECTIE 6 · Quick capture
// ═══════════════════════════════════════════════════════════════
function QuickCapture() {
  const { addCard } = useStore()
  const [open, setOpen] = useState(false)
  const [pillar, setPillar] = useState<Pillar | null>(null)
  const [title, setTitle] = useState('')
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement)?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return
      if (e.key.toLowerCase() === 'n' && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault()
        setOpen(true)
      }
      if (e.key === 'Escape') { setOpen(false); setPillar(null); setTitle('') }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  function save() {
    if (!pillar || !title.trim()) return
    addCard(pillar, title.trim())
    setSaved(true)
    setTimeout(() => setSaved(false), 1200)
    setTitle('')
    setPillar(null)
    setOpen(false)
  }

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen(true)}
        data-testid="quick-capture-fab"
        title="Nieuw content-idee (N)"
        style={{
          display: 'none', position: 'fixed', bottom: 28, right: 28, zIndex: 250,   // no floating buttons in this room; N and the Nieuw script pill remain
          width: 52, height: 52, borderRadius: 18, border: 'none',
          background: 'var(--color-ink)', color: 'var(--color-bg)', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 8px 28px rgba(0,0,0,0.22)',
          transition: 'transform 200ms cubic-bezier(.16,1,.3,1)',
        }}
        onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.06)')}
        onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
      >
        {saved ? <Check size={20} color="var(--pf-depth-text)" strokeWidth={3} /> : <Plus size={20} />}
      </button>

      {/* Popup */}
      {open && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 300, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: '18vh', background: 'rgb(20 21 15 / .4)', backdropFilter: 'blur(4px)' }}
          onClick={() => { setOpen(false); setPillar(null); setTitle('') }}>
          <div onClick={e => e.stopPropagation()} style={{ width: 440, maxWidth: '90vw', borderRadius: 18, background: 'var(--color-bg)', border: '1px solid var(--color-border)', boxShadow: '0 24px 64px rgba(0,0,0,0.30)', padding: '22px 22px 18px' }}>
            <p style={{ fontSize: 10, fontWeight: 500, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--color-subtle)', fontFamily: 'var(--font-mono)', marginBottom: 14 }}>
              Nieuw content-idee <Mono style={{ opacity: 0.6 }}>· druk N</Mono>
            </p>

            {!pillar ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                {(Object.keys(PILLAR_CFG) as Pillar[]).map(p => {
                  const cfg = PILLAR_CFG[p]
                  return (
                    <button
                      key={p}
                      onClick={() => setPillar(p)}
                      style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '13px 16px', borderRadius: 14, border: '1.5px solid var(--color-border)', background: cfg.bg, cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left', transition: 'border-color 150ms' }}
                      onMouseEnter={e => (e.currentTarget.style.borderColor = cfg.color)}
                      onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--color-border)')}
                    >
                      <span style={{ color: cfg.color }}>{PILLAR_ICON[p]}</span>
                      <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-ink)', flex: 1 }}>{cfg.label}</span>
                      <ChevronRight size={13} color="var(--color-subtle)" />
                    </button>
                  )
                })}
              </div>
            ) : (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                  <span style={{ color: PILLAR_CFG[pillar].color }}>{PILLAR_ICON[pillar]}</span>
                  <span style={{ fontSize: 11, fontWeight: 500, color: PILLAR_CFG[pillar].color, fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{PILLAR_CFG[pillar].label}</span>
                </div>
                <input
                  autoFocus
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') save() }}
                  placeholder="Waar gaat het over?"
                  style={{ ...inputStyle, width: '100%', fontSize: 14, padding: '12px 14px' }}
                />
                <div style={{ display: 'flex', gap: 8, marginTop: 12, justifyContent: 'flex-end' }}>
                  <button onClick={() => setPillar(null)} style={{ padding: '8px 14px', borderRadius: 14, border: '1px solid var(--color-border)', background: 'transparent', color: 'var(--color-subtle)', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>Terug</button>
                  <button onClick={save} disabled={!title.trim()} style={{ padding: '8px 18px', borderRadius: 14, border: 'none', background: title.trim() ? 'var(--color-ink)' : 'var(--color-border)', color: title.trim() ? 'var(--color-bg)' : 'var(--color-muted)', fontSize: 12, fontWeight: 500, cursor: title.trim() ? 'pointer' : 'default', fontFamily: 'inherit' }}>Toevoegen</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}

// ═══════════════════════════════════════════════════════════════
// Main
// ═══════════════════════════════════════════════════════════════
export function ContentCreation({ business = 'lu', projectId, projectName }: { business?: 'lu' | 'bora'; projectId?: string; projectName?: string }) {
  const [openCardId, setOpenCardId] = useState<string | null>(null)
  // Custom projecten krijgen hun eigen store en gedragen zich als 'bora'
  // (weekdoel-header, geen 100-challenge die aan Laurence Uvin hangt).
  const biz = projectId ? 'bora' : business
  const storeHook = projectId
    ? getProjectContentStore(projectId)
    : business === 'bora' ? useBoraContentCreationStore : useContentCreationStore

  return (
    <StoreCtx.Provider value={storeHook}>
    <BizCtx.Provider value={biz}>
    <div style={{ maxWidth: 900 }}>
      <div style={{ marginBottom: 30 }}>
        <h1 style={{ fontSize: 24, fontWeight: 500, letterSpacing: '-0.02em', color: 'var(--color-ink)', lineHeight: 1.2, marginBottom: 4 }}>
          Content{projectName ? ` · ${projectName}` : business === 'bora' ? ' · Bora' : ''}
        </h1>
        <p style={{ fontSize: 12, color: 'var(--color-subtle)', fontFamily: 'var(--font-mono)' }}>
          Plan · schrijf · publiceer · druk <span style={{ fontWeight: 500, color: 'var(--color-ink)' }}>N</span> voor een nieuw idee
        </p>
      </div>

      <SectionShell title="Dashboard" icon={<TrendingUp size={13} color={ACCENT} />}>
        <Dashboard />
      </SectionShell>

      <SectionShell title="Scripts · weekdoel" icon={<Mic size={13} color={GOLD} />}>
        <AuthorityTracker />
      </SectionShell>

      <SectionShell title="Planner" icon={<Sparkles size={13} color="var(--pf-depth-text)" />}>
        <PlannerBoard onOpenCard={setOpenCardId} />
      </SectionShell>

      <SectionShell title="Kalender" icon={<CalendarIcon size={13} color={ACCENT} />}>
        <ContentCalendar onOpenCard={setOpenCardId} />
      </SectionShell>

      <SectionShell title="Brain Dump" icon={<Lightbulb size={13} color="var(--pf-depth-text)" />} defaultOpen={false}>
        <BrainDump />
      </SectionShell>

      <QuickCapture />
      {openCardId && <CardPanel cardId={openCardId} onClose={() => setOpenCardId(null)} />}
    </div>
    </BizCtx.Provider>
    </StoreCtx.Provider>
  )
}
