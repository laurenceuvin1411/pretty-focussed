import { useState, useCallback, useRef, useEffect, useTransition } from 'react'
import confetti from 'canvas-confetti'
import { useLeadStore, PROGRAM_VALUE, PROGRAM_LABEL, STAGE_ORDER, STAGE_PROBABILITY } from '../store/leadStore'
import type { Lead, LeadProgram, LeadChannel, LeadTemperature, LeadStatus, ActivityType, NextActionPriority } from '../store/leadStore'
import { ChevronRight, X, Plus, Clock, Phone, Mail, MessageSquare, Users, ArrowRight, AlertCircle, Zap, CheckCircle, Check, CalendarDays, Trophy, Edit3, Send, FileText, Star, ChevronDown, Search, Loader2 } from 'lucide-react'
import { AutomationPanel } from '../components/automation/AutomationPanel'
import { useServiceStore, serviceValue, servicePriceLabel } from '../store/serviceStore'
import { Trash2, Settings2 } from 'lucide-react'

function IgIcon({ size = 14, color = '#E1306C' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
    </svg>
  )
}

// ── Diensten beheren ─────────────────────────────────────────────
function ServicesModal({ onClose }: { onClose: () => void }) {
  const { services, addService, updateService, deleteService } = useServiceStore()
  const [name, setName] = useState('')
  const [value, setValue] = useState('')
  const [label, setLabel] = useState('')

  const inp: React.CSSProperties = {
    padding: '9px 12px', borderRadius: 12, border: '1px solid var(--color-border)',
    background: 'var(--color-surface)', color: 'var(--color-ink)', fontSize: 13,
    fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box',
  }

  function add() {
    if (!name.trim()) return
    addService(name, Number(value) || 0, label)
    setName(''); setValue(''); setLabel('')
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(6px)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ background: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: 22, width: '100%', maxWidth: 560, padding: '26px 26px 22px', maxHeight: '85vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
          <h2 style={{ fontSize: 17, fontWeight: 800, color: 'var(--color-ink)', letterSpacing: '-0.01em' }}>Diensten</h2>
          <button onClick={onClose} aria-label="Sluiten" style={{ width: 30, height: 30, borderRadius: 10, border: '1px solid var(--color-border)', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-muted)' }}><X size={14} /></button>
        </div>
        <p style={{ fontSize: 12, color: 'var(--color-subtle)', marginBottom: 18, lineHeight: 1.5 }}>
          Naam, standaard dealwaarde en prijslabel. Bestaande leads behouden hun waarde.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 18 }}>
          {services.map(svc => (
            <div key={svc.id} style={{ display: 'flex', gap: 8, alignItems: 'center' }} data-testid="service-row">
              <input value={svc.name} onChange={e => updateService(svc.id, { name: e.target.value })} aria-label="Dienstnaam" style={{ ...inp, flex: 2, minWidth: 0 }} />
              <input type="number" value={svc.defaultValue || ''} onChange={e => updateService(svc.id, { defaultValue: Number(e.target.value) || 0 })} placeholder="€" aria-label="Standaardwaarde" style={{ ...inp, width: 92, fontFamily: 'var(--font-mono)' }} />
              <input value={svc.priceLabel} onChange={e => updateService(svc.id, { priceLabel: e.target.value })} placeholder="€2.500 / 3mnd" aria-label="Prijslabel" style={{ ...inp, flex: 1.4, minWidth: 0 }} />
              <button onClick={() => deleteService(svc.id)} title="Verwijder dienst" style={{ width: 30, height: 30, borderRadius: 9, border: '1px solid var(--color-border)', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-subtle)', flexShrink: 0 }}><Trash2 size={12} /></button>
            </div>
          ))}
        </div>

        <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: 14 }}>
          <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--color-subtle)', fontFamily: 'var(--font-mono)', marginBottom: 8 }}>Nieuwe dienst</p>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input value={name} onChange={e => setName(e.target.value)} onKeyDown={e => e.key === 'Enter' && add()} placeholder="Naam..." data-testid="new-service-name" style={{ ...inp, flex: 2, minWidth: 0 }} />
            <input type="number" value={value} onChange={e => setValue(e.target.value)} placeholder="€" data-testid="new-service-value" style={{ ...inp, width: 92, fontFamily: 'var(--font-mono)' }} />
            <input value={label} onChange={e => setLabel(e.target.value)} onKeyDown={e => e.key === 'Enter' && add()} placeholder="Prijslabel" style={{ ...inp, flex: 1.4, minWidth: 0 }} />
            <button onClick={add} disabled={!name.trim()} data-testid="new-service-add"
              style={{ width: 34, height: 34, borderRadius: 11, border: 'none', background: name.trim() ? 'var(--color-ink)' : 'var(--color-border)', color: name.trim() ? 'var(--color-bg)' : 'var(--color-muted)', cursor: name.trim() ? 'pointer' : 'default', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Plus size={15} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

const QUICK_VALUES = [997, 2500, 5000, 6000, 10000]
const WIN_WIN_VALUE = 0

// Fairy dust — vivid iridescent burst, clearly visible shimmer
function fireConfetti() {
  const fairyColors = ['#E8B4FF','#FFB3E6','#FFD4A8','#B3E8FF','#B8FFD4','#FFB3C6','#D4B3FF','#FFECB3','#FF9ECD','#C4EEFF']
  const dustDefaults = {
    ticks: 220,
    gravity: 0.20,
    decay: 0.95,
    startVelocity: 26,
    shapes: ['circle' as const],
    scalar: 1.1,
    zIndex: 9999,
  }
  // Big burst from center
  confetti({ ...dustDefaults, particleCount: 120, spread: 160, origin: { x: 0.5, y: 0.4 }, colors: fairyColors })
  // Left sweep
  confetti({ ...dustDefaults, particleCount: 70, spread: 70, angle: 60, origin: { x: 0.1, y: 0.5 }, colors: fairyColors })
  // Right sweep
  confetti({ ...dustDefaults, particleCount: 70, spread: 70, angle: 120, origin: { x: 0.9, y: 0.5 }, colors: fairyColors })
  // Second wave — floaty trail
  setTimeout(() => {
    confetti({ ...dustDefaults, particleCount: 90, spread: 200, startVelocity: 16, gravity: 0.12, scalar: 0.9, origin: { x: 0.5, y: 0.35 }, colors: fairyColors })
  }, 250)
  // Final sparkle shower
  setTimeout(() => {
    confetti({ ...dustDefaults, particleCount: 60, spread: 100, startVelocity: 10, gravity: 0.10, scalar: 0.7, origin: { x: 0.3, y: 0.2 }, colors: fairyColors })
    confetti({ ...dustDefaults, particleCount: 60, spread: 100, startVelocity: 10, gravity: 0.10, scalar: 0.7, origin: { x: 0.7, y: 0.2 }, colors: fairyColors })
  }, 550)
}

const STATUS_LABEL: Record<LeadStatus, string> = {
  new:         'New',
  contacted:   'Contacted',
  discovery:   'Discovery',
  proposal:    'Proposal',
  negotiation: 'Negotiation',
  won:         'Won',
  lost:        'Lost',
}

const STATUS_COLOR: Record<LeadStatus, string> = {
  new:         '#8BAEBE',
  contacted:   '#7AACCF',
  discovery:   '#38BDF8',
  proposal:    '#B8956A',
  negotiation: '#C4935A',
  won:         '#7A9E8A',
  lost:        '#94A3B8',
}

const TEMP_COLOR: Record<LeadTemperature, string> = { Hot: '#C4935A', Warm: '#D97706', Cold: '#8BAEBE' }
const TEMP_BG: Record<LeadTemperature, string> = { Hot: 'rgba(249,115,22,0.10)', Warm: 'rgba(217,119,6,0.10)', Cold: 'rgba(96,165,250,0.10)' }

const CHANNELS: LeadChannel[] = ['WhatsApp','Instagram DM','In-person','Email','LinkedIn']
const TEMPS: LeadTemperature[] = ['Hot','Warm','Cold']
const ACTIVE_STAGES: LeadStatus[] = ['new','contacted','discovery','proposal','negotiation']

const ACTIVITY_ICONS: Record<ActivityType, typeof MessageSquare> = {
  note:          MessageSquare,
  contact:       MessageSquare,
  call:          Phone,
  email:         Mail,
  meeting:       Users,
  status_change: ArrowRight,
}

function daysSince(dateStr: string) {
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000)
}

function fmt(n: number) {
  return new Intl.NumberFormat('nl-BE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n)
}

function fmtTime(iso: string) {
  return new Date(iso).toLocaleString('nl-BE', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
}

function Badge({ label, color, bg }: { label: string; color: string; bg: string }) {
  return (
    <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color, background: bg, padding: '2px 8px', borderRadius: 99 }}>
      {label}
    </span>
  )
}

/* ── Instagram fetch helper ─────────────────────────────────────────── */
async function fetchInstagram(input: string): Promise<{ fullName: string; profilePicUrl: string; bio: string; username: string } | null> {
  // Extract username from URL or raw handle
  const match = input.match(/instagram\.com\/([^/?#]+)/) || input.match(/^@?([A-Za-z0-9._]+)$/)
  const username = match?.[1]?.replace(/^@/, '')
  if (!username) return null
  const res = await fetch(`/.netlify/functions/instagram?username=${encodeURIComponent(username)}`)
  if (!res.ok) return null
  return res.json()
}

/* ── Add Lead Modal ─────────────────────────────────────────────────── */
function AddLeadModal({ onClose }: { onClose: () => void }) {
  const { addLead } = useLeadStore()
  const [igInput, setIgInput] = useState('')
  const [igLoading, setIgLoading] = useState(false)
  const [igError, setIgError] = useState('')
  const [preview, setPreview] = useState<{ name: string; photo: string; handle: string } | null>(null)
  const [form, setForm] = useState({
    name: '', channel: 'Instagram DM' as LeadChannel, temperature: 'Warm' as LeadTemperature,
    program: (useServiceStore.getState().services[0]?.name ?? 'Andere') as LeadProgram, status: 'new' as LeadStatus,
    lastContact: new Date().toISOString().split('T')[0], notes: '',
    photoUrl: '', instagramHandle: '',
  })
  const setF = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const lookupInstagram = async () => {
    if (!igInput.trim()) return
    setIgLoading(true); setIgError('')
    try {
      const data = await fetchInstagram(igInput.trim())
      if (!data) { setIgError('Profile not found or private'); setIgLoading(false); return }
      setPreview({ name: data.fullName, photo: data.profilePicUrl, handle: data.username })
      setForm(f => ({
        ...f,
        name: data.fullName || f.name,
        notes: data.bio ? `Bio: ${data.bio}` : f.notes,
        channel: 'Instagram DM',
        photoUrl: data.profilePicUrl,
        instagramHandle: data.username,
      }))
    } catch {
      setIgError('Fetch failed — check the profile')
    }
    setIgLoading(false)
  }

  const submit = () => {
    if (!form.name.trim()) return
    addLead({ ...form, value: serviceValue(useServiceStore.getState().services, form.program) })
    onClose()
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '9px 12px', borderRadius: 16,
    border: '1px solid var(--color-border)', background: 'var(--color-surface)',
    color: 'var(--color-ink)', fontSize: 13, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit',
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={onClose}>
      <div style={{ background: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: 20, padding: 32, width: 460, boxShadow: '0 24px 80px rgba(0,0,0,0.3)', maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 22, color: 'var(--color-ink)', marginBottom: 6 }}>New lead</h3>
        <p style={{ fontSize: 12, color: 'var(--color-subtle)', marginBottom: 20 }}>Paste an Instagram link to auto-fill</p>

        {/* Instagram import */}
        <div style={{ marginBottom: 20, padding: 16, borderRadius: 14, border: '1px solid rgba(225,48,108,0.25)', background: 'rgba(225,48,108,0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <IgIcon size={14} />
            <span style={{ fontSize: 12, fontWeight: 600, color: '#E1306C', letterSpacing: '0.05em' }}>INSTAGRAM IMPORT</span>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              style={{ ...inputStyle, flex: 1 }}
              placeholder="instagram.com/username or @handle"
              value={igInput}
              onChange={e => { setIgInput(e.target.value); setIgError('') }}
              onKeyDown={e => e.key === 'Enter' && lookupInstagram()}
              autoFocus
            />
            <button
              onClick={lookupInstagram}
              disabled={igLoading || !igInput.trim()}
              style={{ padding: '9px 14px', borderRadius: 16, border: 'none', background: '#E1306C', color: '#fff', cursor: igLoading ? 'default' : 'pointer', opacity: !igInput.trim() ? 0.5 : 1, display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, fontFamily: 'inherit', flexShrink: 0 }}
            >
              {igLoading ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Search size={14} />}
              {igLoading ? '' : 'Search'}
            </button>
          </div>
          {igError && <p style={{ fontSize: 12, color: '#C4935A', marginTop: 8 }}>{igError}</p>}

          {/* Profile preview */}
          {preview && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 12, padding: '10px 12px', borderRadius: 16, background: 'rgba(225,48,108,0.08)', border: '1px solid rgba(225,48,108,0.2)' }}>
              {preview.photo
                ? <img src={preview.photo} alt={preview.name} style={{ width: 44, height: 44, borderRadius: '50%', objectFit: 'cover', border: '2px solid rgba(225,48,108,0.4)', flexShrink: 0 }} />
                : <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(225,48,108,0.2)', flexShrink: 0 }} />
              }
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-ink)' }}>{preview.name}</div>
                <div style={{ fontSize: 12, color: '#E1306C' }}>@{preview.handle}</div>
              </div>
              <CheckCircle size={16} color="#7A9E8A" style={{ marginLeft: 'auto' }} />
            </div>
          )}
        </div>

        {/* Manual fields */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <input style={inputStyle} placeholder="Naam *" value={form.name} onChange={e => setF('name', e.target.value)} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <select style={inputStyle} value={form.channel} onChange={e => setF('channel', e.target.value)}>
              {CHANNELS.map(c => <option key={c}>{c}</option>)}
            </select>
            <select style={inputStyle} value={form.temperature} onChange={e => setF('temperature', e.target.value)}>
              {TEMPS.map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
          <select style={inputStyle} value={form.program} onChange={e => setF('program', e.target.value)}>
            {useServiceStore.getState().services.map(p => <option key={p.id}>{p.name}</option>)}
          </select>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <select style={inputStyle} value={form.status} onChange={e => setF('status', e.target.value)}>
              {ACTIVE_STAGES.map(s => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
            </select>
            <input type="date" style={inputStyle} value={form.lastContact} onChange={e => setF('lastContact', e.target.value)} />
          </div>
          <textarea style={{ ...inputStyle, height: 68, resize: 'none' }} placeholder="Notities…" value={form.notes} onChange={e => setF('notes', e.target.value)} />
        </div>

        <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
          <button onClick={onClose} style={{ flex: 1, padding: '10px', borderRadius: 16, border: '1px solid var(--color-border)', background: 'transparent', color: 'var(--color-muted)', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
          <button onClick={submit} disabled={!form.name.trim()} style={{ flex: 2, padding: '10px', borderRadius: 16, border: 'none', background: 'var(--color-accent)', color: 'var(--color-bg)', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', opacity: !form.name.trim() ? 0.5 : 1 }}>Save lead</button>
        </div>
      </div>
    </div>
  )
}

/* ── Lead Detail Panel ──────────────────────────────────────────────── */
function InlineEdit({ value, onSave, style: s }: { value: string; onSave: (v: string) => void; style?: React.CSSProperties }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value)
  const ref = useRef<HTMLInputElement>(null)
  useEffect(() => { if (editing) ref.current?.focus() }, [editing])
  if (!editing) return (
    <span onClick={() => { setDraft(value); setEditing(true) }} style={{ cursor: 'text', borderBottom: '1px dashed var(--color-border)', ...s }}>{value || <span style={{ color: 'var(--color-subtle)', fontStyle: 'italic' }}>—</span>}</span>
  )
  return <input ref={ref} value={draft} onChange={e => setDraft(e.target.value)}
    onBlur={() => { onSave(draft); setEditing(false) }}
    onKeyDown={e => { if (e.key === 'Enter') { onSave(draft); setEditing(false) } if (e.key === 'Escape') setEditing(false) }}
    style={{ border: 'none', outline: 'none', background: 'transparent', borderBottom: '1px solid var(--color-accent)', ...s }} />
}

function LeadPanel({ lead: initialLead, onClose }: { lead: Lead; onClose: () => void }) {
  const { leads, updateLead, markContacted, wonLead, lostLead, advanceStage, setFollowUp, addActivity, getLeadActivities, deleteLead } = useLeadStore()
  const lead = leads.find(l => l.id === initialLead.id) ?? initialLead
  const activities = getLeadActivities(lead.id)
  const [note, setNote] = useState('')
  const [actType, setActType] = useState<ActivityType>('note')
  const [followUpDate, setFollowUpDate] = useState(lead.nextFollowUp ?? '')
  const [editingValue, setEditingValue] = useState(false)
  const [valueDraft, setValueDraft] = useState(String(lead.value))
  const skipBlurRef = useRef(false)
  const [showProgramPicker, setShowProgramPicker] = useState(false)
  const [nextAction, setNextAction] = useState(lead.nextAction ?? '')
  const [nextActionPriority, setNextActionPriority] = useState<NextActionPriority>(lead.nextActionPriority ?? 'medium')
  const valueInputRef = useRef<HTMLInputElement>(null)

  const isActive = lead.status !== 'won' && lead.status !== 'lost'
  const currentIdx = ACTIVE_STAGES.indexOf(lead.status)
  const nextStage = currentIdx >= 0 && currentIdx < ACTIVE_STAGES.length - 1 ? ACTIVE_STAGES[currentIdx + 1] : null

  useEffect(() => { if (editingValue) valueInputRef.current?.focus() }, [editingValue])

  const submitNote = () => {
    if (!note.trim()) return
    addActivity(lead.id, actType, note.trim())
    setNote('')
  }

  const saveNextAction = () => {
    updateLead(lead.id, { nextAction: nextAction.trim(), nextActionPriority })
  }

  const PRIORITY_COLOR: Record<NextActionPriority, string> = { high: '#c4736a', medium: '#B8956A', low: '#8BAEBE' }

  const STAGE_LABELS_SHORT: Record<LeadStatus, string> = {
    new: 'New', contacted: 'Contact', discovery: 'Discovery',
    proposal: 'Proposal', negotiation: 'Nego', won: 'Won', lost: 'Lost',
  }

  const quickLog = (type: ActivityType, label: string) => {
    addActivity(lead.id, type, label)
    if (type === 'contact' || type === 'call') {
      const today = new Date().toISOString().split('T')[0]
      const in14  = new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0]
      updateLead(lead.id, { lastContact: today, nextFollowUp: in14, status: lead.status === 'new' ? 'contacted' : lead.status })
      setFollowUpDate(in14)
    }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 200, display: 'flex', justifyContent: 'flex-end' }} onClick={onClose}>
      <div style={{ width: 500, height: '100%', background: 'var(--color-bg)', borderLeft: '1px solid var(--color-border)', display: 'flex', flexDirection: 'column', overflowY: 'auto', boxShadow: '-20px 0 80px rgba(0,0,0,0.18)' }} onClick={e => e.stopPropagation()}>

        {/* ── Header ── */}
        <div style={{ padding: '32px 40px 24px', borderBottom: '1px solid var(--color-border)', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, flex: 1, minWidth: 0 }}>
              {/* Avatar */}
              {lead.photoUrl
                ? <img src={lead.photoUrl} alt={lead.name} style={{ width: 56, height: 56, borderRadius: '50%', objectFit: 'cover', border: '2px solid rgba(225,48,108,0.4)', flexShrink: 0, marginTop: 2 }} onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
                : <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(255,255,255,0.06)', border: '2px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 }}>
                    <span style={{ fontSize: 22, fontWeight: 700, color: 'var(--color-muted)' }}>{lead.name[0]?.toUpperCase()}</span>
                  </div>
              }
            <div style={{ flex: 1, minWidth: 0 }}>
              <InlineEdit
                value={lead.name}
                onSave={v => { if (v.trim()) updateLead(lead.id, { name: v.trim() }) }}
                style={{ fontSize: 24, fontWeight: 700, color: 'var(--color-ink)', lineHeight: 1.2, display: 'block', marginBottom: lead.instagramHandle ? 2 : 8 }}
              />
              {lead.instagramHandle && (
                <a href={`https://www.instagram.com/${lead.instagramHandle}/`} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: '#E1306C', display: 'inline-flex', alignItems: 'center', gap: 4, marginBottom: 8, textDecoration: 'none' }}>
                  <IgIcon size={11} /> @{lead.instagramHandle}
                </a>
              )}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {/* Editable program */}
                <div style={{ position: 'relative', display: 'inline-block' }}>
                  <button onClick={() => setShowProgramPicker(v => !v)} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '3px 10px', borderRadius: 20, border: '1px solid var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-muted)', fontSize: 11, cursor: 'pointer', fontFamily: 'inherit' }}>
                    {lead.program} <ChevronDown size={10} />
                  </button>
                  {showProgramPicker && (
                    <div style={{ position: 'absolute', top: '100%', left: 0, marginTop: 4, background: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: 12, padding: 6, zIndex: 300, boxShadow: '0 8px 32px rgba(0,0,0,0.25)', minWidth: 210 }}>
                      {useServiceStore.getState().services.map(p => (
                        <button key={p.id} onClick={() => { updateLead(lead.id, { program: p.name, value: p.defaultValue || lead.value }); setShowProgramPicker(false) }}
                          style={{ display: 'block', width: '100%', padding: '8px 12px', borderRadius: 16, border: 'none', background: lead.program === p.name ? 'var(--color-surface)' : 'var(--color-card)', color: lead.program === p.name ? 'var(--color-accent)' : 'var(--color-ink)', fontSize: 12, cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit', fontWeight: lead.program === p.name ? 600 : 400 }}>
                          {p.name} <span style={{ color: 'var(--color-subtle)', fontSize: 11 }}>{p.priceLabel}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <button
                  onClick={() => {
                    const next: LeadTemperature = lead.temperature === 'Hot' ? 'Warm' : lead.temperature === 'Warm' ? 'Cold' : 'Hot'
                    updateLead(lead.id, { temperature: next })
                  }}
                  title="Klik om te wijzigen"
                  style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
                >
                  <Badge label={lead.temperature} color={TEMP_COLOR[lead.temperature]} bg={TEMP_BG[lead.temperature]} />
                </button>
              </div>
            </div>
            </div>{/* end avatar+info wrapper */}
            <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 16, border: '1px solid var(--color-border)', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-muted)', flexShrink: 0, marginLeft: 16 }}>
              <X size={14} />
            </button>
          </div>

          {/* Editable value + meta */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
            {editingValue ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 20, fontWeight: 700, color: 'var(--color-accent)' }}>€</span>
                <input ref={valueInputRef} value={valueDraft} onChange={e => setValueDraft(e.target.value)}
                  onBlur={() => { if (skipBlurRef.current) { skipBlurRef.current = false; return } updateLead(lead.id, { value: parseInt(valueDraft.replace(/\D/g,'')) || 0 }); setEditingValue(false) }}
                  onKeyDown={e => { if (e.key === 'Enter') { updateLead(lead.id, { value: parseInt(valueDraft.replace(/\D/g,'')) || 0 }); setEditingValue(false) }}}
                  style={{ fontSize: 20, fontWeight: 700, color: 'var(--color-accent)', background: 'transparent', border: 'none', borderBottom: '2px solid var(--color-accent)', outline: 'none', width: 90, fontVariantNumeric: 'tabular-nums' }} />
                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                  {QUICK_VALUES.map(v => (
                    <button key={v} onMouseDown={() => { skipBlurRef.current = true }} onClick={() => { updateLead(lead.id, { value: v }); setEditingValue(false) }}
                      style={{ padding: '2px 8px', borderRadius: 14, border: '1px solid var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-muted)', fontSize: 10, cursor: 'pointer' }}>
                      {v >= 1000 ? `${v/1000}k` : v}
                    </button>
                  ))}
                  <button onMouseDown={() => { skipBlurRef.current = true }} onClick={() => { updateLead(lead.id, { value: WIN_WIN_VALUE }); setEditingValue(false) }}
                    style={{ padding: '2px 8px', borderRadius: 14, border: '1px solid rgba(123,191,160,0.4)', background: 'rgba(123,191,160,0.1)', color: '#7BBFA0', fontSize: 10, cursor: 'pointer', fontWeight: 600 }}>
                    🤝 win-win
                  </button>
                </div>
              </div>
            ) : (
              <button onClick={() => { setValueDraft(String(lead.value)); setEditingValue(true) }}
                style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                <span style={{ fontSize: 26, fontWeight: 700, color: 'var(--color-accent)', fontVariantNumeric: 'tabular-nums' }}>{fmt(lead.value)}</span>
                <Edit3 size={12} color="var(--color-subtle)" />
              </button>
            )}
            <span style={{ fontSize: 11, color: 'var(--color-subtle)' }}>·</span>
            <span style={{ fontSize: 12, color: 'var(--color-muted)' }}>{lead.probability}% kans</span>
          </div>

          {/* Stage stepper — clickable */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 6 }}>
              {ACTIVE_STAGES.map((s, i) => {
                const idx = ACTIVE_STAGES.indexOf(lead.status as LeadStatus)
                const isPast = i < idx; const isCurrent = i === idx; const isFuture = i > idx
                const color = isFuture ? 'var(--color-border)' : STATUS_COLOR[s]
                return (
                  <div key={s} style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                    <div onClick={() => isActive && advanceStage(lead.id, s)} style={{ width: isCurrent ? 14 : 9, height: isCurrent ? 14 : 9, borderRadius: '50%', background: isFuture ? 'var(--color-border)' : color, border: isCurrent ? `2px solid ${color}` : 'none', outline: isCurrent ? `3px solid ${color}30` : 'none', cursor: isActive ? 'pointer' : 'default', transition: 'all 0.2s', flexShrink: 0 }} />
                    {i < ACTIVE_STAGES.length - 1 && <div style={{ flex: 1, height: 2, background: isPast ? 'var(--color-accent)' : 'var(--color-border)', margin: '0 2px' }} />}
                  </div>
                )
              })}
            </div>
            <div style={{ display: 'flex' }}>
              {ACTIVE_STAGES.map((s, i) => {
                const idx = ACTIVE_STAGES.indexOf(lead.status as LeadStatus)
                return <div key={s} style={{ flex: 1, textAlign: i === 0 ? 'left' : i === ACTIVE_STAGES.length - 1 ? 'right' : 'center' }}>
                  <span style={{ fontSize: 9, fontWeight: i === idx ? 700 : 400, color: i === idx ? STATUS_COLOR[s] : 'var(--color-subtle)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>{STAGE_LABELS_SHORT[s]}</span>
                </div>
              })}
            </div>
          </div>
        </div>

        {/* ── Acties ── */}
        {isActive && (
          <div style={{ padding: '24px 40px', borderBottom: '1px solid var(--color-border)', flexShrink: 0 }}>
            {/* Won = primary CTA */}
            <button onClick={() => { wonLead(lead.id); fireConfetti(); onClose() }}
              style={{ width: '100%', padding: '14px 0', borderRadius: 12, border: 'none', background: 'rgba(34,197,94,0.12)', color: '#7A9E8A', fontSize: 14, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 10 }}>
              <Trophy size={14} />Deal sluiten
            </button>

            {/* Secondary row: stage advance + log actions + lost */}
            <div style={{ display: 'flex', gap: 6 }}>
              {nextStage && (
                <button onClick={() => advanceStage(lead.id, nextStage)}
                  style={{ flex: 2, padding: '8px 12px', borderRadius: 9, border: '1px solid var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-ink)', fontSize: 11, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, whiteSpace: 'nowrap' }}>
                  <ChevronRight size={11} style={{ color: STATUS_COLOR[nextStage] }} />Naar {STATUS_LABEL[nextStage]}
                </button>
              )}
              {[
                { icon: <Phone size={12}/>, tip: 'Bel', action: () => quickLog('call', 'Gebeld') },
                { icon: <Mail size={12}/>, tip: 'Email', action: () => quickLog('email', 'Email verstuurd') },
                { icon: <FileText size={12}/>, tip: 'Voorstel', action: () => quickLog('email', 'Voorstel verstuurd') },
                { icon: <Users size={12}/>, tip: 'Meeting', action: () => quickLog('meeting', 'Meeting gepland') },
              ].map(a => (
                <button key={a.tip} onClick={a.action} title={a.tip}
                  style={{ width: 36, height: 36, borderRadius: 9, border: '1px solid var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {a.icon}
                </button>
              ))}
              <button onClick={() => { lostLead(lead.id); onClose() }}
                style={{ width: 36, height: 36, borderRadius: 9, border: '1px solid var(--color-border)', background: 'transparent', color: 'var(--color-subtle)', fontSize: 10, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <X size={12} />
              </button>
            </div>
          </div>
        )}

        {/* ── Volgende actie ── */}
        {isActive && (
          <div style={{ padding: '24px 40px', borderBottom: '1px solid var(--color-border)', flexShrink: 0 }}>
            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--color-subtle)', marginBottom: 12 }}>Volgende actie</p>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: PRIORITY_COLOR[nextActionPriority], flexShrink: 0 }} />
              <input value={nextAction} onChange={e => setNextAction(e.target.value)} onBlur={saveNextAction}
                onKeyDown={e => e.key === 'Enter' && saveNextAction()}
                placeholder="Wat is de volgende stap?"
                style={{ flex: 1, padding: '9px 12px', borderRadius: 9, border: '1px solid var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-ink)', fontSize: 13, outline: 'none', fontFamily: 'inherit' }} />
              <input type="date" value={followUpDate} onChange={e => { setFollowUpDate(e.target.value); setFollowUp(lead.id, e.target.value) }}
                style={{ padding: '8px 10px', borderRadius: 9, border: '1px solid var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-ink)', fontSize: 11, outline: 'none', flexShrink: 0 }} />
            </div>
            <div style={{ display: 'flex', gap: 4, marginTop: 8 }}>
              {(['high','medium','low'] as NextActionPriority[]).map(p => (
                <button key={p} onClick={() => { setNextActionPriority(p); saveNextAction() }}
                  style={{ padding: '2px 8px', borderRadius: 14, border: `1px solid ${nextActionPriority === p ? PRIORITY_COLOR[p] : 'var(--color-border)'}`, background: nextActionPriority === p ? `${PRIORITY_COLOR[p]}15` : 'transparent', color: nextActionPriority === p ? PRIORITY_COLOR[p] : 'var(--color-subtle)', fontSize: 10, cursor: 'pointer', fontWeight: nextActionPriority === p ? 700 : 400 }}>
                  {p === 'high' ? 'Hoog' : p === 'medium' ? 'Midden' : 'Laag'}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Notitie ── */}
        {isActive && (
          <div style={{ padding: '24px 40px', borderBottom: '1px solid var(--color-border)', flexShrink: 0 }}>
            <div style={{ display: 'flex', gap: 8 }}>
              <input value={note} onChange={e => setNote(e.target.value)} onKeyDown={e => e.key === 'Enter' && submitNote()} placeholder="Log een notitie, call of meeting…"
                style={{ flex: 1, padding: '9px 12px', borderRadius: 9, border: '1px solid var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-ink)', fontSize: 13, outline: 'none' }} />
              <button onClick={submitNote} style={{ width: 38, height: 38, borderRadius: 9, border: 'none', background: 'var(--color-accent)', color: 'var(--color-bg)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Plus size={14} />
              </button>
            </div>
          </div>
        )}

        {/* ── Notes ── */}
        {lead.notes && (
          <div style={{ padding: '14px 28px', borderBottom: '1px solid var(--color-border)', flexShrink: 0 }}>
            <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--color-subtle)', marginBottom: 6 }}>Notities</p>
            <p style={{ fontSize: 13, color: 'var(--color-ink)', lineHeight: 1.6 }}>{lead.notes}</p>
          </div>
        )}

        {/* ── Automation runs for this lead ── */}
        <div style={{ padding: '0 28px 16px' }}>
          <AutomationPanel filterLeadId={lead.id} compact />
        </div>

        {/* ── Tijdlijn ── */}
        <div style={{ padding: '20px 28px', flex: 1 }}>
          <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--color-subtle)', marginBottom: 16 }}>Tijdlijn</p>
          {activities.length === 0 && <p style={{ fontSize: 12, color: 'var(--color-subtle)', fontStyle: 'italic' }}>Nog geen activiteiten gelogd.</p>}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {activities.map((a, i) => {
              const Icon = ACTIVITY_ICONS[a.type] || MessageSquare
              const isStatusChange = a.type === 'status_change'
              return (
                <div key={a.id} style={{ display: 'flex', gap: 14, paddingBottom: i < activities.length - 1 ? 16 : 0 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
                    <div style={{ width: 28, height: 28, borderRadius: '50%', background: isStatusChange ? 'rgba(212,169,106,0.12)' : 'var(--color-surface)', border: `1px solid ${isStatusChange ? 'rgba(212,169,106,0.3)' : 'var(--color-border)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Icon size={11} style={{ color: isStatusChange ? 'var(--color-accent)' : 'var(--color-muted)' }} />
                    </div>
                    {i < activities.length - 1 && <div style={{ width: 1, flex: 1, background: 'var(--color-border)', marginTop: 4 }} />}
                  </div>
                  <div style={{ paddingTop: 4, flex: 1 }}>
                    <p style={{ fontSize: 13, color: 'var(--color-ink)', lineHeight: 1.4, fontWeight: isStatusChange ? 500 : 400 }}>{a.content}</p>
                    <p style={{ fontSize: 10, color: 'var(--color-subtle)', marginTop: 3 }}>{fmtTime(a.createdAt)}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* ── Archive ── */}
        {!isActive && (
          <div style={{ padding: '16px 28px', borderTop: '1px solid var(--color-border)', flexShrink: 0 }}>
            <button onClick={() => { deleteLead(lead.id); onClose() }} style={{ fontSize: 11, color: 'var(--color-subtle)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
              Archiveer en verwijder
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

/* ── Lead Row ──────────────────────────────────────────────────────── */
function daysUntil(dateStr?: string): number | null {
  if (!dateStr) return null
  const today = new Date(); today.setHours(0,0,0,0)
  const target = new Date(dateStr); target.setHours(0,0,0,0)
  return Math.round((target.getTime() - today.getTime()) / 86400000)
}

function LeadCard({ lead, onClick }: { lead: Lead; onClick: () => void }) {
  const { updateLead } = useLeadStore()
  const [doneFlash, setDoneFlash] = useState(false)
  const days = daysSince(lead.lastContact)
  const today = new Date().toISOString().split('T')[0]
  const followUpOverdue = lead.nextFollowUp && lead.nextFollowUp < today
  const followUpToday   = lead.nextFollowUp && lead.nextFollowUp === today
  const daysLeft        = daysUntil(lead.nextFollowUp)
  const stale = days >= 7 && lead.status !== 'won' && lead.status !== 'lost'
  const urgent = (days >= 3 && lead.status !== 'won' && lead.status !== 'lost') || !!followUpOverdue || !!followUpToday
  const statusColor = STATUS_COLOR[lead.status]
  const tempColor = TEMP_COLOR[lead.temperature]
  const isClosedDeal = lead.status === 'won' || lead.status === 'lost'

  const handleFollowUp = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    const today = new Date().toISOString().split('T')[0]
    const in14  = new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0]
    updateLead(lead.id, { lastContact: today, nextFollowUp: in14 })
    setDoneFlash(true)
    setTimeout(() => setDoneFlash(false), 2000)
  }, [lead.id, updateLead])

  return (
    <div onClick={onClick} style={{
      background: 'var(--color-card)', border: `1px solid ${urgent ? 'rgba(249,115,22,0.25)' : 'var(--color-border)'}`,
      borderRadius: 16, padding: '18px 20px', cursor: 'pointer', position: 'relative',
      overflow: 'hidden', transition: 'transform 0.15s, box-shadow 0.15s',
      display: 'flex', flexDirection: 'column', gap: 14,
    }}
      onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)'; (e.currentTarget as HTMLDivElement).style.boxShadow = '0 8px 24px rgba(0,0,0,0.12)' }}
      onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = ''; (e.currentTarget as HTMLDivElement).style.boxShadow = '' }}
    >
      {/* Urgency strip */}
      {urgent && <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg, ${stale ? '#c4736a' : '#C4935A'}, #FBBF24)` }} />}

      {/* Top row: avatar + name + temp badge */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
          {lead.photoUrl
            ? <img src={lead.photoUrl} alt={lead.name} style={{ width: 38, height: 38, borderRadius: '50%', objectFit: 'cover', border: '2px solid rgba(225,48,108,0.3)', flexShrink: 0 }} onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
            : <div style={{ width: 38, height: 38, borderRadius: '50%', background: `${statusColor}20`, border: `2px solid ${statusColor}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span style={{ fontSize: 15, fontWeight: 700, color: statusColor }}>{lead.name[0]?.toUpperCase()}</span>
              </div>
          }
          <div style={{ minWidth: 0 }}>
            <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-ink)', lineHeight: 1.2, marginBottom: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{lead.name}</p>
            <p style={{ fontSize: 11, color: 'var(--color-muted)' }}>{lead.instagramHandle ? `@${lead.instagramHandle}` : lead.channel}</p>
          </div>
        </div>
        <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: tempColor, background: TEMP_BG[lead.temperature], padding: '3px 8px', borderRadius: 99, flexShrink: 0 }}>
          {lead.temperature}
        </span>
      </div>

      {/* Program + stage */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <div style={{ width: 6, height: 6, borderRadius: '50%', background: statusColor, flexShrink: 0 }} />
        <span style={{ fontSize: 11, color: 'var(--color-muted)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{lead.program}</span>
        <Badge label={STATUS_LABEL[lead.status]} color={statusColor} bg={`${statusColor}15`} />
      </div>

      {/* Bottom row: follow-up btn + value */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 10, borderTop: '1px solid var(--color-border)', gap: 8 }}>
        {isClosedDeal ? (
          <span style={{ fontSize: 11, color: 'var(--color-subtle)', display: 'flex', alignItems: 'center', gap: 4 }}>
            <CalendarDays size={10} />
            {days === 0 ? 'Vandaag' : days === 1 ? 'Gisteren' : `${days}d geleden`}
          </span>
        ) : (
          <button
            onClick={handleFollowUp}
            title="Markeer als opgevolgd — reminder over 14 dagen"
            style={{
              display: 'flex', alignItems: 'center', gap: 5, padding: '5px 10px',
              borderRadius: 16,
              border: `1px solid ${doneFlash ? 'rgba(34,197,94,0.4)' : (followUpOverdue || followUpToday) ? 'rgba(249,115,22,0.3)' : daysLeft !== null && daysLeft > 0 ? 'rgba(99,179,237,0.3)' : 'var(--color-border)'}`,
              background: doneFlash ? 'rgba(34,197,94,0.1)' : (followUpOverdue || followUpToday) ? 'rgba(249,115,22,0.06)' : daysLeft !== null && daysLeft > 0 ? 'rgba(99,179,237,0.06)' : 'transparent',
              color: doneFlash ? '#7A9E8A' : (followUpOverdue || followUpToday) ? '#C4935A' : daysLeft !== null && daysLeft > 0 ? '#63B3ED' : 'var(--color-subtle)',
              fontSize: 11, fontWeight: 600, cursor: 'pointer', transition: 'all 200ms', fontFamily: 'inherit',
            }}
          >
            {doneFlash
              ? <><Check size={11} /> Opgevolgd! +14d</>
              : (followUpOverdue || followUpToday)
              ? <><AlertCircle size={11} /> Opvolgen vandaag</>
              : daysLeft !== null && daysLeft > 0
              ? <><Clock size={11} /> nog {daysLeft}d</>
              : <><CalendarDays size={11} /> {days === 0 ? 'Vandaag contact' : `${days}d geleden`}</>
            }
          </button>
        )}
        <span style={{ fontSize: 16, fontWeight: 800, color: 'var(--color-accent)', fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.02em', flexShrink: 0 }}>
          {fmt(lead.value)}
        </span>
      </div>
    </div>
  )
}

/* ── Won Drilldown Modal ─────────────────────────────────────────── */
function WonDrilldown({ leads, onClose }: { leads: Lead[]; onClose: () => void }) {
  const { updateLead, leads: allLeads } = useLeadStore()
  // Always read live from store so checkboxes update instantly
  const liveLeads = leads.map(l => allLeads.find(a => a.id === l.id) ?? l)
  const byProgram: Record<string, Lead[]> = {}
  liveLeads.forEach(l => { (byProgram[l.program] = byProgram[l.program] || []).push(l) })
  const total   = liveLeads.reduce((s, l) => s + l.value, 0)
  const paid    = liveLeads.filter(l => l.paidAt).reduce((s, l) => s + l.value, 0)
  const openstaand = total - paid

  const togglePaid = (l: Lead) => {
    updateLead(l.id, { paidAt: l.paidAt ? undefined : new Date().toISOString() })
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={onClose}>
      <div style={{ background: '#0E1524', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, padding: 32, width: 500, maxHeight: '82vh', overflowY: 'auto', boxShadow: '0 24px 80px rgba(0,0,0,0.5)' } as React.CSSProperties} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <div>
            <h3 style={{ fontSize: 20, fontWeight: 700, color: 'rgba(228,236,248,0.95)', marginBottom: 4 }}>Gewonnen 2026</h3>
            <p style={{ fontSize: 13, color: 'rgba(180,200,224,0.65)' }}>{liveLeads.length} deals · {fmt(total)}</p>
          </div>
          <button onClick={onClose} style={{ width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 16, cursor: 'pointer', color: 'rgba(180,200,224,0.65)' }}>
            <X size={14} />
          </button>
        </div>

        {liveLeads.length === 0 ? (
          <p style={{ textAlign: 'center', color: 'rgba(160,185,210,0.4)', padding: '32px 0', fontSize: 13 }}>Nog geen gewonnen deals.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {Object.entries(byProgram).map(([program, pLeads]) => (
              <div key={program}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#7A9E8A' }}>{program}</span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: 'rgba(180,200,224,0.65)' }}>{fmt(pLeads.reduce((s, l) => s + l.value, 0))}</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {pLeads.map(l => {
                    const isPaid = !!l.paidAt
                    return (
                      <div key={l.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderRadius: 16, background: isPaid ? 'rgba(34,197,94,0.08)' : 'rgba(249,115,22,0.06)', border: `1px solid ${isPaid ? 'rgba(34,197,94,0.2)' : 'rgba(249,115,22,0.2)'}`, transition: 'all 200ms' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          {/* Paid checkbox */}
                          <button
                            onClick={() => togglePaid(l)}
                            title={isPaid ? 'Markeer als onbetaald' : 'Markeer als betaald'}
                            style={{ width: 20, height: 20, borderRadius: 14, border: `2px solid ${isPaid ? '#7A9E8A' : 'rgba(255,255,255,0.2)'}`, background: isPaid ? '#7A9E8A' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0, transition: 'all 150ms' }}
                          >
                            {isPaid && <Check size={11} color="#0E1524" strokeWidth={3} />}
                          </button>
                          {l.photoUrl
                            ? <img src={l.photoUrl} alt={l.name} style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover', border: '1px solid rgba(255,255,255,0.1)' }} onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
                            : null
                          }
                          <div>
                            <span style={{ fontSize: 13, fontWeight: 600, color: 'rgba(228,236,248,0.95)' }}>{l.name}</span>
                            {isPaid && l.paidAt && (
                              <p style={{ fontSize: 10, color: '#7A9E8A', marginTop: 1 }}>
                                Betaald op {new Date(l.paidAt).toLocaleDateString('nl-BE', { day: '2-digit', month: 'short' })}
                              </p>
                            )}
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          {!isPaid && (
                            <span style={{ fontSize: 10, fontWeight: 600, color: '#C4935A', background: 'rgba(249,115,22,0.1)', padding: '2px 7px', borderRadius: 99 }}>OPENSTAAND</span>
                          )}
                          <span style={{ fontSize: 14, fontWeight: 700, color: isPaid ? '#7A9E8A' : 'rgba(228,236,248,0.6)', fontVariantNumeric: 'tabular-nums' }}>{fmt(l.value)}</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}

            {/* Footer summary */}
            <div style={{ paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', flexDirection: 'column', gap: 8 }}>
              {openstaand > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 12, color: '#C4935A', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#C4935A' }} /> Openstaand
                  </span>
                  <span style={{ fontSize: 14, fontWeight: 600, color: '#C4935A', fontVariantNumeric: 'tabular-nums' }}>{fmt(openstaand)}</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 12, color: '#7A9E8A', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#7A9E8A' }} /> Betaald ontvangen
                </span>
                <span style={{ fontSize: 14, fontWeight: 600, color: '#7A9E8A', fontVariantNumeric: 'tabular-nums' }}>{fmt(paid)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 8, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: 'rgba(228,236,248,0.95)' }}>Totaal gewonnen</span>
                <span style={{ fontSize: 20, fontWeight: 800, color: '#7A9E8A', fontVariantNumeric: 'tabular-nums' }}>{fmt(total)}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

/* ── Main Dashboard ────────────────────────────────────────────────── */
export function SalesDashboard() {
  const { leads } = useLeadStore()
  const [showAdd, setShowAdd] = useState(false)
  const [showServices, setShowServices] = useState(false)
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)
  const [filter, setFilter] = useState<'active' | 'all' | 'won' | 'lost'>('active')
  const [showWonDrilldown, setShowWonDrilldown] = useState(false)

  const active    = leads.filter(l => l.status !== 'won' && l.status !== 'lost')
  const won       = leads.filter(l => l.status === 'won')
  const lost      = leads.filter(l => l.status === 'lost')

  const today = new Date().toISOString().split('T')[0]

  // Revenue forecast tiers
  const committed = active.filter(l => l.probability >= 70).reduce((s, l) => s + l.value, 0)
  const likely    = active.filter(l => l.probability >= 35 && l.probability < 70).reduce((s, l) => s + l.value, 0)
  const pipeline  = active.reduce((s, l) => s + l.value, 0)
  const wonValue  = won.reduce((s, l) => s + l.value, 0)

  // Expected value = sum(value × probability)
  const expectedValue = active.reduce((s, l) => s + l.value * (l.probability / 100), 0)

  // Follow-up alerts
  const followUpToday  = active.filter(l => l.nextFollowUp && l.nextFollowUp <= today)
  const stale7         = active.filter(l => !followUpToday.includes(l) && daysSince(l.lastContact) >= 7)
  const urgentCount    = followUpToday.length + stale7.length

  const [search, setSearch] = useState('')
  const [serviceFilter, setServiceFilter] = useState<string>('all')

  const usedPrograms = [...new Set(leads.map(l => l.program))] as LeadProgram[]

  const displayed = filter === 'all' ? leads : filter === 'won' ? won : filter === 'lost' ? lost : active
  const sorted    = [...displayed]
    .filter(l => !search.trim() || l.name.toLowerCase().includes(search.toLowerCase()))
    .filter(l => serviceFilter === 'all' || l.program === serviceFilter)
    .sort((a, b) => {
      const tOrder = { Hot: 0, Warm: 1, Cold: 2 }
      if (tOrder[a.temperature] !== tOrder[b.temperature]) return tOrder[a.temperature] - tOrder[b.temperature]
      return STAGE_ORDER.indexOf(b.status) - STAGE_ORDER.indexOf(a.status)
    })

  // Pipeline by stage
  const byStage = ACTIVE_STAGES.map(s => ({
    stage: s,
    leads: active.filter(l => l.status === s),
    value: active.filter(l => l.status === s).reduce((sum, l) => sum + l.value, 0),
  })).filter(g => g.leads.length > 0)

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto' }}>
      {showAdd && <AddLeadModal onClose={() => setShowAdd(false)} />}
      {showServices && <ServicesModal onClose={() => setShowServices(false)} />}
      {selectedLead && <LeadPanel lead={selectedLead} onClose={() => setSelectedLead(null)} />}
      {showWonDrilldown && <WonDrilldown leads={won} onClose={() => setShowWonDrilldown(false)} />}

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 32 }}>
        <div>
          <h1 style={{ fontSize: 32, fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1, color: 'var(--color-ink)', marginBottom: 6 }}>
            Sales Pipeline
          </h1>
          <p style={{ fontSize: 13, color: 'var(--color-muted)' }}>Wie moet je opvolgen? Wat staat er open?</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => setShowServices(true)} data-testid="manage-services" title="Diensten en prijzen aanpassen"
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 16px', borderRadius: 99, border: '1px solid var(--color-border)', background: 'transparent', color: 'var(--color-muted)', fontSize: 12.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
            <Settings2 size={13} /> Diensten
          </button>
          <button onClick={() => setShowAdd(true)} style={{ padding: '10px 20px', borderRadius: 99, border: 'none', background: 'var(--color-accent)', color: 'var(--color-bg)', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
            + Nieuwe lead
          </button>
        </div>
      </div>

      {/* Revenue forecast */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 20 }}>
        {[
          { label: 'Gewonnen 2026', value: fmt(wonValue), sub: `${won.length} deals`, color: '#7A9E8A', onClick: () => setShowWonDrilldown(true) },
          { label: 'Committed (≥70%)', value: fmt(committed), sub: 'Onderhandeling+', color: '#B8956A' },
          { label: 'Expected value', value: fmt(expectedValue), sub: 'Gewogen pipeline', color: 'var(--color-accent)' },
          { label: 'Totale pipeline', value: fmt(pipeline), sub: `${active.length} actieve leads`, color: 'var(--color-ink)' },
        ].map(s => (
          <div key={s.label} className="card" onClick={(s as any).onClick} style={{ padding: '18px 20px', cursor: (s as any).onClick ? 'pointer' : 'default' }}>
            <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--color-subtle)', marginBottom: 8 }}>{s.label}</p>
            <p style={{ fontSize: 22, fontWeight: 700, color: s.color, lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>{s.value}</p>
            <p style={{ fontSize: 11, color: 'var(--color-muted)', marginTop: 4 }}>{s.sub}</p>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 220px', gap: 16, marginBottom: 24 }}>

        {/* Urgent follow-up */}
        <div style={{ background: urgentCount > 0 ? 'rgba(249,115,22,0.05)' : 'rgba(34,197,94,0.05)', border: `1px solid ${urgentCount > 0 ? 'rgba(249,115,22,0.25)' : 'rgba(34,197,94,0.2)'}`, borderRadius: 14, padding: '16px 20px' }}>
          <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: urgentCount > 0 ? '#C4935A' : '#7A9E8A', marginBottom: 12 }}>
            {urgentCount > 0
              ? <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><Zap size={10} />Opvolgen ({urgentCount})</span>
              : <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><CheckCircle size={10} />All updated</span>
            }
          </p>
          {followUpToday.length > 0 && (
            <div style={{ marginBottom: 10 }}>
              <p style={{ fontSize: 10, color: '#c4736a', fontWeight: 600, marginBottom: 6 }}>Follow-up vandaag gepland</p>
              {followUpToday.map(l => (
                <div key={l.id} onClick={() => setSelectedLead(l)} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 10px', background: 'var(--color-card)', borderRadius: 16, marginBottom: 4, cursor: 'pointer', border: '1px solid rgba(239,68,68,0.2)' }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-ink)' }}>{l.name}</span>
                  <span style={{ fontSize: 11, color: '#c4736a', display: 'flex', alignItems: 'center', gap: 4 }}><CalendarDays size={10} />vandaag</span>
                </div>
              ))}
            </div>
          )}
          {stale7.map(l => (
            <div key={l.id} onClick={() => setSelectedLead(l)} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 10px', background: 'var(--color-card)', borderRadius: 16, marginBottom: 4, cursor: 'pointer', border: '1px solid var(--color-border)' }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-ink)' }}>{l.name}</span>
              <span style={{ fontSize: 11, color: '#C4935A' }}>{daysSince(l.lastContact)}d geleden</span>
            </div>
          ))}
          {urgentCount === 0 && (
            <p style={{ fontSize: 12, color: 'var(--color-muted)' }}>Alle leads zijn recent gecontacteerd.</p>
          )}
        </div>

        {/* Pipeline by stage */}
        <div className="card" style={{ padding: '16px 18px' }}>
          <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--color-subtle)', marginBottom: 12 }}>Per stage</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {byStage.map(({ stage, leads: sLeads, value }) => (
              <div key={stage}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                  <span style={{ fontSize: 11, color: STATUS_COLOR[stage], fontWeight: 600 }}>{STATUS_LABEL[stage]}</span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-accent)' }}>{fmt(value)}</span>
                </div>
                <div style={{ height: 4, background: 'var(--color-border)', borderRadius: 2 }}>
                  <div style={{ height: '100%', width: pipeline > 0 ? `${Math.round(value / pipeline * 100)}%` : '0%', background: STATUS_COLOR[stage], borderRadius: 2, opacity: 0.7 }} />
                </div>
                <p style={{ fontSize: 10, color: 'var(--color-subtle)', marginTop: 2 }}>{sLeads.length} lead{sLeads.length > 1 ? 's' : ''}</p>
              </div>
            ))}
            {byStage.length === 0 && <p style={{ fontSize: 12, color: 'var(--color-subtle)' }}>No active leads</p>}
          </div>
        </div>
      </div>

      {/* Lead list */}
      <div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 14 }}>
          {/* Search + service filter row */}
          <div style={{ display: 'flex', gap: 10 }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <Search size={13} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-subtle)', pointerEvents: 'none' }} />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Zoek op naam…"
                style={{ width: '100%', padding: '8px 12px 8px 32px', borderRadius: 16, border: '1px solid var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-ink)', fontSize: 13, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }}
              />
              {search && (
                <button onClick={() => setSearch('')} style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-subtle)', display: 'flex', padding: 2 }}>
                  <X size={12} />
                </button>
              )}
            </div>
            <select
              value={serviceFilter}
              onChange={e => setServiceFilter(e.target.value)}
              style={{ padding: '8px 12px', borderRadius: 16, border: '1px solid var(--color-border)', background: 'var(--color-surface)', color: serviceFilter === 'all' ? 'var(--color-subtle)' : 'var(--color-ink)', fontSize: 13, outline: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
            >
              <option value="all">Alle diensten</option>
              {usedPrograms.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>

          {/* Status filter + count */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <p style={{ fontSize: 12, color: 'var(--color-subtle)' }}>{sorted.length} lead{sorted.length !== 1 ? 's' : ''}</p>
            <div style={{ display: 'flex', gap: 6 }}>
              {(['active','all','won','lost'] as const).map(f => (
                <button key={f} onClick={() => setFilter(f)} style={{ padding: '5px 12px', borderRadius: 20, border: '1px solid var(--color-border)', background: filter === f ? 'var(--color-accent)' : 'transparent', color: filter === f ? '#fff' : 'var(--color-muted)', fontSize: 11, cursor: 'pointer', fontWeight: filter === f ? 600 : 400, fontFamily: 'inherit' }}>
                  {f === 'active' ? 'Active' : f === 'all' ? 'All' : f === 'won' ? 'Won' : 'Lost'}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
          {sorted.map(l => <LeadCard key={l.id} lead={l} onClick={() => setSelectedLead(l)} />)}
          {sorted.length === 0 && (
            <div style={{ gridColumn: '1/-1', padding: 40, textAlign: 'center', color: 'var(--color-subtle)', fontSize: 13 }}>
              No leads in this category
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
