import { useState } from 'react'
import { format } from 'date-fns'
import { nlBE } from 'date-fns/locale'
import { Plus, Trash2, Check, Pill, ChevronDown, ChevronRight, Settings2 } from 'lucide-react'
import { useProtocolStore, getProtocolStatus, weekDates, PROTOCOL_COLORS } from '../store/protocolStore'
import type { Protocol, ProtocolItem } from '../store/protocolStore'

const ACCENT = '#4C6481'

const inputStyle: React.CSSProperties = {
  padding: '9px 12px', borderRadius: 12, border: '1px solid var(--color-border)',
  background: 'var(--color-surface)', color: 'var(--color-ink)', fontSize: 13,
  fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box',
}

const labelStyle: React.CSSProperties = {
  fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase',
  color: 'var(--color-subtle)', fontFamily: 'var(--font-mono)', display: 'block', marginBottom: 6,
}

// ── Eén afvinkbaar item voor vandaag ─────────────────────────────
function ItemRow({ protocol, item, dateStr, disabled }: {
  protocol: Protocol; item: ProtocolItem; dateStr: string; disabled: boolean
}) {
  const { toggleLog } = useProtocolStore()
  const done = (protocol.logs[dateStr] ?? []).includes(item.id)

  // doel per week halen we uit de logs van deze week
  const weekDone = item.perWeek
    ? weekDates(dateStr).filter(d => (protocol.logs[d] ?? []).includes(item.id)).length
    : 0

  return (
    <button
      onClick={() => !disabled && toggleLog(protocol.id, dateStr, item.id)}
      disabled={disabled}
      style={{
        display: 'flex', alignItems: 'center', gap: 14, padding: '13px 16px', width: '100%', textAlign: 'left',
        background: done ? `${item.color}12` : 'transparent',
        border: `1.5px solid ${done ? item.color + '55' : 'var(--color-border)'}`,
        borderRadius: 14, cursor: disabled ? 'default' : 'pointer',
        transition: 'all 180ms ease', opacity: disabled ? 0.4 : 1,
      }}
    >
      <div style={{
        width: 24, height: 24, borderRadius: 8, flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: done ? item.color : 'transparent',
        border: `2px solid ${done ? item.color : 'rgba(124,127,132,0.28)'}`,
        transition: 'all 180ms ease',
      }}>
        {done && <Check size={12} color="#fff" strokeWidth={3} />}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 13, fontWeight: 600, color: done ? 'var(--color-muted)' : 'var(--color-ink)', textDecoration: done ? 'line-through' : 'none' }}>
          {item.label}
        </p>
        {item.sub && <p style={{ fontSize: 10, color: 'var(--color-subtle)', marginTop: 1 }}>{item.sub}</p>}
      </div>

      {item.perWeek ? (
        <span style={{ fontSize: 10, fontWeight: 700, fontFamily: 'var(--font-mono)', color: weekDone >= item.perWeek ? item.color : 'var(--color-subtle)', flexShrink: 0 }}>
          {weekDone}/{item.perWeek} deze week
        </span>
      ) : done && (
        <span style={{ fontSize: 10, fontWeight: 700, color: item.color, background: `${item.color}15`, padding: '2px 10px', borderRadius: 99, flexShrink: 0 }}>Done</span>
      )}
    </button>
  )
}

// ── Instellingen van één protocol ────────────────────────────────
function ProtocolSettings({ protocol, onClose }: { protocol: Protocol; onClose: () => void }) {
  const { updateProtocol, deleteProtocol, addItem, updateItem, deleteItem, addPhase, updatePhase, deletePhase } = useProtocolStore()
  const [newItem, setNewItem] = useState('')
  const [newItemSub, setNewItemSub] = useState('')
  const [phaseName, setPhaseName] = useState('')
  const [phaseDays, setPhaseDays] = useState('')

  return (
    <div style={{ padding: 18, borderRadius: 16, border: `1px solid ${ACCENT}40`, background: 'var(--color-card)', marginBottom: 16, display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 160 }}>
          <label style={labelStyle}>Naam</label>
          <input value={protocol.name} onChange={e => updateProtocol(protocol.id, { name: e.target.value })} style={{ ...inputStyle, width: '100%' }} />
        </div>
        <div>
          <label style={labelStyle}>Startdatum</label>
          <input type="date" value={protocol.startDate} onChange={e => updateProtocol(protocol.id, { startDate: e.target.value })} style={{ ...inputStyle, colorScheme: 'light dark' }} />
        </div>
        <button onClick={onClose} style={{ padding: '9px 16px', borderRadius: 99, border: '1px solid var(--color-border)', background: 'transparent', color: 'var(--color-muted)', fontSize: 11.5, cursor: 'pointer', fontFamily: 'inherit' }}>Klaar</button>
      </div>

      {/* Items */}
      <div>
        <label style={labelStyle}>Dagelijkse handelingen</label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 8 }}>
          {protocol.items.map(i => (
            <div key={i.id} style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <button
                onClick={() => {
                  const next = PROTOCOL_COLORS[(PROTOCOL_COLORS.indexOf(i.color) + 1) % PROTOCOL_COLORS.length]
                  updateItem(protocol.id, i.id, { color: next })
                }}
                title="Kleur wisselen"
                style={{ width: 18, height: 18, borderRadius: '50%', background: i.color, border: 'none', cursor: 'pointer', flexShrink: 0 }}
              />
              <input value={i.label} onChange={e => updateItem(protocol.id, i.id, { label: e.target.value })} placeholder="Handeling" style={{ ...inputStyle, flex: 2, minWidth: 90, padding: '7px 10px', fontSize: 12.5 }} />
              <input value={i.sub ?? ''} onChange={e => updateItem(protocol.id, i.id, { sub: e.target.value || undefined })} placeholder="Wanneer" style={{ ...inputStyle, flex: 1, minWidth: 70, padding: '7px 10px', fontSize: 12 }} />
              <input
                type="number" min={1} max={7}
                value={i.perWeek ?? ''}
                onChange={e => updateItem(protocol.id, i.id, { perWeek: e.target.value ? Number(e.target.value) : undefined })}
                placeholder="/wk" title="Doel per week; leeg = elke dag"
                style={{ ...inputStyle, width: 58, padding: '7px 8px', fontSize: 12, fontFamily: 'var(--font-mono)' }}
              />
              <button onClick={() => deleteItem(protocol.id, i.id)} title="Verwijder" style={{ width: 26, height: 26, borderRadius: 8, border: '1px solid var(--color-border)', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-subtle)', flexShrink: 0 }}><Trash2 size={10} /></button>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <input value={newItem} onChange={e => setNewItem(e.target.value)} placeholder="Nieuwe handeling" data-testid="new-item"
            onKeyDown={e => { if (e.key === 'Enter' && newItem.trim()) { addItem(protocol.id, newItem.trim(), newItemSub.trim() || undefined); setNewItem(''); setNewItemSub('') } }}
            style={{ ...inputStyle, flex: 2, fontSize: 12.5 }} />
          <input value={newItemSub} onChange={e => setNewItemSub(e.target.value)} placeholder="Wanneer (optioneel)" style={{ ...inputStyle, flex: 1, fontSize: 12 }} />
          <button
            onClick={() => { if (newItem.trim()) { addItem(protocol.id, newItem.trim(), newItemSub.trim() || undefined); setNewItem(''); setNewItemSub('') } }}
            data-testid="add-item"
            style={{ padding: '9px 16px', borderRadius: 99, border: 'none', background: 'var(--color-ink)', color: 'var(--color-bg)', fontSize: 11.5, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0 }}>
            <Plus size={12} />
          </button>
        </div>
      </div>

      {/* Fases */}
      <div>
        <label style={labelStyle}>Fases (optioneel)</label>
        <p style={{ fontSize: 11, color: 'var(--color-subtle)', marginBottom: 8, lineHeight: 1.5 }}>
          Zonder fases loopt het protocol gewoon door. Met fases kan je per periode andere handelingen actief zetten, bijvoorbeeld 6 weken 2x per dag en daarna 6 weken 1x per dag.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 8 }}>
          {protocol.phases.map(ph => (
            <div key={ph.id} style={{ padding: '10px 12px', borderRadius: 12, background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 8 }}>
                <input value={ph.name} onChange={e => updatePhase(protocol.id, ph.id, { name: e.target.value })} placeholder="Fase" style={{ ...inputStyle, flex: 1, padding: '7px 10px', fontSize: 12.5, fontWeight: 700 }} />
                <input type="number" min={1} value={ph.days} onChange={e => updatePhase(protocol.id, ph.id, { days: Math.max(1, Number(e.target.value) || 1) })} title="Aantal dagen" style={{ ...inputStyle, width: 74, padding: '7px 8px', fontSize: 12, fontFamily: 'var(--font-mono)' }} />
                <span style={{ fontSize: 11, color: 'var(--color-subtle)', flexShrink: 0 }}>dagen</span>
                <button onClick={() => deletePhase(protocol.id, ph.id)} title="Verwijder fase" style={{ width: 26, height: 26, borderRadius: 8, border: '1px solid var(--color-border)', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-subtle)', flexShrink: 0 }}><Trash2 size={10} /></button>
              </div>
              <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                {protocol.items.map(i => {
                  const active = ph.itemIds.includes(i.id)
                  return (
                    <button key={i.id}
                      onClick={() => updatePhase(protocol.id, ph.id, {
                        itemIds: active ? ph.itemIds.filter(x => x !== i.id) : [...ph.itemIds, i.id],
                      })}
                      style={{
                        padding: '4px 11px', borderRadius: 99, fontSize: 10.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                        border: `1.5px solid ${active ? i.color : 'var(--color-border)'}`,
                        background: active ? `${i.color}18` : 'transparent',
                        color: active ? i.color : 'var(--color-subtle)',
                      }}>
                      {i.label || 'naamloos'}
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <input value={phaseName} onChange={e => setPhaseName(e.target.value)} placeholder="Fasenaam, bv. Fase 1" style={{ ...inputStyle, flex: 1, fontSize: 12.5 }} />
          <input type="number" min={1} value={phaseDays} onChange={e => setPhaseDays(e.target.value)} placeholder="dagen" style={{ ...inputStyle, width: 90, fontSize: 12, fontFamily: 'var(--font-mono)' }} />
          <button
            onClick={() => { if (phaseName.trim() && Number(phaseDays) > 0) { addPhase(protocol.id, phaseName.trim(), Number(phaseDays)); setPhaseName(''); setPhaseDays('') } }}
            style={{ padding: '9px 16px', borderRadius: 99, border: 'none', background: 'var(--color-ink)', color: 'var(--color-bg)', fontSize: 11.5, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0 }}>
            <Plus size={12} />
          </button>
        </div>
      </div>

      {/* Regels */}
      <div>
        <label style={labelStyle}>Aandachtspunten (optioneel)</label>
        <textarea
          value={protocol.rules ?? ''}
          onChange={e => updateProtocol(protocol.id, { rules: e.target.value || undefined })}
          placeholder="Bv. vooraf tanden poetsen, kleurende voeding vermijden, bij gevoeligheid een dag overslaan..."
          rows={3}
          style={{ ...inputStyle, width: '100%', resize: 'vertical', lineHeight: 1.6 }}
        />
      </div>

      <button
        onClick={() => { if (confirm(`Protocol "${protocol.name}" verwijderen?`)) { deleteProtocol(protocol.id); onClose() } }}
        style={{ alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 99, border: '1px solid var(--color-border)', background: 'transparent', color: 'var(--color-subtle)', fontSize: 11, cursor: 'pointer', fontFamily: 'inherit' }}>
        <Trash2 size={11} /> Protocol verwijderen
      </button>
    </div>
  )
}

// ── Één protocolkaart voor de geselecteerde dag ──────────────────
function ProtocolCard({ protocol, dateStr }: { protocol: Protocol; dateStr: string }) {
  const [settings, setSettings] = useState(false)
  const status = getProtocolStatus(protocol, dateStr)
  const todayStr = new Date().toISOString().split('T')[0]
  const isFuture = dateStr > todayStr

  if (settings) return <ProtocolSettings protocol={protocol} onClose={() => setSettings(false)} />

  const notStarted = status.dayNum < 1
  const startFmt = format(new Date(protocol.startDate + 'T12:00:00'), 'd MMMM yyyy', { locale: nlBE })

  return (
    <div className="card" style={{ padding: '20px 22px', marginBottom: 16 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
          <div style={{ width: 32, height: 32, borderRadius: 12, background: 'rgba(76,100,129,0.10)', border: '1px solid rgba(76,100,129,0.22)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Pill size={15} color={ACCENT} />
          </div>
          <div style={{ minWidth: 0 }}>
            <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: ACCENT, fontFamily: 'var(--font-mono)' }}>{protocol.name}</p>
            <p style={{ fontSize: 12, color: 'var(--color-muted)', marginTop: 1 }}>
              {notStarted ? `Start ${startFmt}`
                : status.finished ? 'Afgerond'
                : status.phase ? `${status.phase.name} · dag ${status.phaseDay}/${status.phase.days}`
                : `Dag ${status.dayNum}`}
            </p>
          </div>
        </div>
        <button onClick={() => setSettings(true)} title="Protocol aanpassen" data-testid="open-settings"
          style={{ width: 30, height: 30, borderRadius: 10, border: '1px solid var(--color-border)', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-subtle)', flexShrink: 0 }}>
          <Settings2 size={13} />
        </button>
      </div>

      {status.totalDays > 0 && !notStarted && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
            <span style={{ fontSize: 9, color: 'var(--color-subtle)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Voortgang</span>
            <span style={{ fontSize: 9, fontWeight: 700, color: 'var(--color-muted)' }}>{status.progressPct}%</span>
          </div>
          <div style={{ height: 4, borderRadius: 99, background: 'rgba(124,127,132,0.10)', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${status.progressPct}%`, borderRadius: 99, background: `linear-gradient(90deg, ${ACCENT}, #7AACCF)`, transition: 'width 0.8s cubic-bezier(.16,1,.3,1)' }} />
          </div>
        </div>
      )}

      {notStarted || status.finished ? null : status.activeItems.length === 0 ? (
        <p style={{ fontSize: 12.5, color: 'var(--color-subtle)' }}>
          Nog geen handelingen. Klik op het tandwiel om ze toe te voegen.
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }} data-testid="protocol-items">
          {status.activeItems.map(i => (
            <ItemRow key={i.id} protocol={protocol} item={i} dateStr={dateStr} disabled={isFuture} />
          ))}
        </div>
      )}

      {protocol.rules && (
        <div style={{ marginTop: 12, padding: '10px 14px', borderRadius: 12, background: 'rgba(76,100,129,0.05)', border: '1px solid rgba(76,100,129,0.12)' }}>
          <p style={{ fontSize: 10.5, color: 'var(--color-subtle)', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{protocol.rules}</p>
        </div>
      )}
    </div>
  )
}

// ── Lijst met alle protocollen ───────────────────────────────────
export function Protocols({ selectedDateStr }: { selectedDateStr: string }) {
  const { protocols, addProtocol } = useProtocolStore()
  const [adding, setAdding] = useState(false)
  const [name, setName] = useState('')
  const [start, setStart] = useState(new Date().toISOString().split('T')[0])
  const [collapsed, setCollapsed] = useState(false)

  function create() {
    if (!name.trim()) return
    addProtocol(name.trim(), start)
    setName('')
    setAdding(false)
  }

  return (
    <div style={{ marginBottom: 20 }}>
      <button
        onClick={() => setCollapsed(c => !c)}
        style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontFamily: 'inherit', marginBottom: collapsed ? 0 : 12 }}
      >
        {collapsed ? <ChevronRight size={13} color="var(--color-subtle)" /> : <ChevronDown size={13} color="var(--color-subtle)" />}
        <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--color-ink)', fontFamily: 'var(--font-mono)' }}>
          Protocollen{protocols.length > 0 && ` · ${protocols.length}`}
        </span>
      </button>

      {!collapsed && (
        <>
          {protocols.map(p => <ProtocolCard key={p.id} protocol={p} dateStr={selectedDateStr} />)}

          {adding ? (
            <div style={{ padding: 16, borderRadius: 16, border: `1px solid ${ACCENT}40`, background: 'var(--color-card)', display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'flex-end' }}>
              <div style={{ flex: 1, minWidth: 150 }}>
                <label style={labelStyle}>Naam</label>
                <input value={name} onChange={e => setName(e.target.value)} onKeyDown={e => e.key === 'Enter' && create()} placeholder="Bv. Huidbehandeling" autoFocus data-testid="protocol-name" style={{ ...inputStyle, width: '100%' }} />
              </div>
              <div>
                <label style={labelStyle}>Start</label>
                <input type="date" value={start} onChange={e => setStart(e.target.value)} style={{ ...inputStyle, colorScheme: 'light dark' }} />
              </div>
              <button onClick={create} disabled={!name.trim()} data-testid="create-protocol"
                style={{ padding: '10px 18px', borderRadius: 99, border: 'none', background: name.trim() ? 'var(--color-ink)' : 'var(--color-border)', color: name.trim() ? 'var(--color-bg)' : 'var(--color-muted)', fontSize: 12, fontWeight: 700, cursor: name.trim() ? 'pointer' : 'default', fontFamily: 'inherit' }}>
                Aanmaken
              </button>
              <button onClick={() => setAdding(false)} style={{ padding: '10px 14px', borderRadius: 99, border: '1px solid var(--color-border)', background: 'transparent', color: 'var(--color-subtle)', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>Annuleer</button>
            </div>
          ) : (
            <button onClick={() => setAdding(true)} data-testid="add-protocol"
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, width: '100%', padding: '12px 16px', borderRadius: 14, border: '1.5px dashed var(--color-border)', background: 'transparent', cursor: 'pointer', fontSize: 12.5, color: 'var(--color-subtle)', fontFamily: 'inherit' }}>
              <Plus size={13} /> Protocol toevoegen
            </button>
          )}
        </>
      )}
    </div>
  )
}
