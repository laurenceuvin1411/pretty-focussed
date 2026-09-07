import { useTeethProtocolStore, getTeethProgress, TEETH_PROTOCOL_START, PHASE1_NIGHTS, PHASE2_NIGHTS, AFTERCARE_NIGHTS, TOTAL_NIGHTS } from '../store/teethProtocolStore'
import type { TeethDoseKey } from '../store/teethProtocolStore'
import { Check, Sparkles, Moon, Sun } from 'lucide-react'
import { format } from 'date-fns'
import { nlBE } from 'date-fns/locale'

const DOSE_CONFIG: Record<TeethDoseKey, { label: string; sub: string; icon: typeof Moon; color: string }> = {
  bleach: { label: 'Bleaching',       sub: '',                                        icon: Moon, color: '#7AACCF' },
  mousse: { label: 'GC Tooth Mousse', sub: 'Ochtend, 15-30 min na het bleachen',      icon: Sun,  color: '#D4A96A' },
  mould:  { label: 'Bitje met GC Tooth Mousse', sub: 'Volledige nacht',               icon: Moon, color: '#A57A8B' },
}

function DoseRow({ dose, subOverride, done, onToggle, disabled }: {
  dose: TeethDoseKey; subOverride?: string; done: boolean; onToggle: () => void; disabled?: boolean
}) {
  const cfg = DOSE_CONFIG[dose]
  const Icon = cfg.icon
  return (
    <button
      onClick={onToggle}
      disabled={disabled}
      style={{
        display: 'flex', alignItems: 'center', gap: 14,
        padding: '13px 16px', width: '100%', textAlign: 'left',
        background: done ? `${cfg.color}12` : 'transparent',
        border: `1.5px solid ${done ? cfg.color + '55' : 'var(--color-border)'}`,
        borderRadius: 12, cursor: disabled ? 'default' : 'pointer',
        transition: 'all 180ms ease', opacity: disabled ? 0.4 : 1,
      }}
    >
      <div style={{
        width: 24, height: 24, borderRadius: 7, flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: done ? cfg.color : 'transparent',
        border: `2px solid ${done ? cfg.color : 'rgba(124,127,132,0.28)'}`,
        transition: 'all 180ms ease',
        boxShadow: done ? `0 0 10px ${cfg.color}50` : 'none',
      }}>
        {done && <Check size={12} color="#0A0805" strokeWidth={3} />}
      </div>

      <Icon size={15} color={done ? cfg.color : 'var(--color-subtle)'} style={{ flexShrink: 0 }} />

      <div style={{ flex: 1 }}>
        <p style={{
          fontSize: 13, fontWeight: 600,
          color: done ? 'var(--color-muted)' : 'var(--color-ink)',
          textDecoration: done ? 'line-through' : 'none',
          transition: 'all 180ms',
        }}>{cfg.label}</p>
        <p style={{ fontSize: 10, color: 'var(--color-subtle)', marginTop: 1 }}>{subOverride ?? cfg.sub}</p>
      </div>

      {done && (
        <span style={{ fontSize: 10, fontWeight: 700, color: cfg.color, background: `${cfg.color}15`, padding: '2px 8px', borderRadius: 99 }}>
          Done
        </span>
      )}
    </button>
  )
}

export function TeethProtocol({ selectedDateStr }: { selectedDateStr: string }) {
  const { logs, toggleDose } = useTeethProtocolStore()
  const takenToday = logs[selectedDateStr] ?? []

  const todayStr = new Date().toISOString().split('T')[0]
  const isFuture = selectedDateStr > todayStr

  const { phase, bleachNights, mouldNights, nightsDone, progressPct } = getTeethProgress(logs, selectedDateStr)

  if (phase === 'notstarted') {
    const startFmt = format(new Date(TEETH_PROTOCOL_START + 'T12:00:00'), 'd MMMM yyyy', { locale: nlBE })
    return (
      <div className="card" style={{ padding: '20px 22px', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
          <Sparkles size={15} color="#7AACCF" />
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#7AACCF' }}>Bleaching Protocol</span>
        </div>
        <p style={{ fontSize: 13, color: 'var(--color-muted)' }}>Start <strong style={{ color: 'var(--color-ink)' }}>{startFmt}</strong></p>
      </div>
    )
  }

  if (phase === 'done') {
    return (
      <div className="card" style={{ padding: '20px 22px', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
          <Sparkles size={15} color="#6DB889" />
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#6DB889' }}>Bleaching Protocol — Klaar</span>
        </div>
        <p style={{ fontSize: 13, color: 'var(--color-muted)' }}>Alle {TOTAL_NIGHTS} nachten afgerond. Stralend resultaat.</p>
      </div>
    )
  }

  const phaseLabel = phase === 'phase1'
    ? `Fase 1 · 10% CP · nacht ${Math.min(bleachNights + 1, PHASE1_NIGHTS)}/${PHASE1_NIGHTS} · min 4u tot volledige nacht`
    : phase === 'phase2'
      ? `Fase 2 · 16% CP · nacht ${Math.min(bleachNights - PHASE1_NIGHTS + 1, PHASE2_NIGHTS)}/${PHASE2_NIGHTS} · min 2u, liefst volledige nacht`
      : `Nazorg · bitje met Tooth Mousse · nacht ${Math.min(mouldNights + 1, AFTERCARE_NIGHTS)}/${AFTERCARE_NIGHTS}`

  const bleachSub = phase === 'phase1'
    ? '10% CP · minimum 4 uur tot volledige nacht'
    : '16% CP · minimum 2 uur, liefst volledige nacht'

  const dosesToShow: TeethDoseKey[] = phase === 'aftercare' ? ['mould'] : ['bleach', 'mousse']

  return (
    <div className="card" style={{ padding: '20px 22px', marginBottom: 20 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 16, background: 'rgba(122,172,207,0.12)', border: '1px solid rgba(122,172,207,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Sparkles size={15} color="#7AACCF" />
          </div>
          <div>
            <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#7AACCF', marginBottom: 1 }}>Bleaching Protocol</p>
            <p style={{ fontSize: 12, color: 'var(--color-muted)' }}>{phaseLabel}</p>
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <p style={{ fontSize: 11, color: 'var(--color-subtle)' }}>{TOTAL_NIGHTS - nightsDone} nachten te gaan</p>
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ marginBottom: 18 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
          <span style={{ fontSize: 9, color: 'var(--color-subtle)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Voortgang</span>
          <span style={{ fontSize: 9, fontWeight: 700, color: 'var(--color-muted)' }}>{progressPct}%</span>
        </div>
        <div style={{ height: 4, borderRadius: 99, background: 'rgba(124,127,132,0.10)', overflow: 'hidden' }}>
          <div style={{
            height: '100%', borderRadius: 99,
            width: `${progressPct}%`,
            background: phase === 'phase1'
              ? 'linear-gradient(90deg, #7AACCF, #4C6481)'
              : phase === 'phase2'
                ? 'linear-gradient(90deg, #4C6481, #A57A8B)'
                : 'linear-gradient(90deg, #A57A8B, #6DB889)',
            transition: 'width 0.8s cubic-bezier(.16,1,.3,1)',
          }} />
        </div>
        {/* Fase-markers */}
        <div style={{ position: 'relative', marginTop: 4, height: 14 }}>
          <div style={{ position: 'absolute', left: `${(PHASE1_NIGHTS / TOTAL_NIGHTS) * 100}%`, top: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', transform: 'translateX(-50%)' }}>
            <div style={{ width: 1, height: 6, background: 'rgba(124,127,132,0.25)' }} />
            <span style={{ fontSize: 8, color: 'rgba(124,127,132,0.5)', whiteSpace: 'nowrap' }}>16% →</span>
          </div>
          <div style={{ position: 'absolute', left: `${((PHASE1_NIGHTS + PHASE2_NIGHTS) / TOTAL_NIGHTS) * 100}%`, top: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', transform: 'translateX(-50%)' }}>
            <div style={{ width: 1, height: 6, background: 'rgba(124,127,132,0.25)' }} />
            <span style={{ fontSize: 8, color: 'rgba(124,127,132,0.5)', whiteSpace: 'nowrap' }}>nazorg →</span>
          </div>
        </div>
      </div>

      {/* Dose checkboxes */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {dosesToShow.map(dose => (
          <DoseRow
            key={dose}
            dose={dose}
            subOverride={dose === 'bleach' ? bleachSub : undefined}
            done={takenToday.includes(dose)}
            onToggle={() => toggleDose(selectedDateStr, dose)}
            disabled={isFuture}
          />
        ))}
      </div>

      {/* Regels */}
      <div style={{ marginTop: 12, padding: '10px 14px', borderRadius: 16, background: 'rgba(122,172,207,0.06)', border: '1px solid rgba(122,172,207,0.14)' }}>
        <p style={{ fontSize: 10, color: 'var(--color-subtle)', lineHeight: 1.7 }}>
          Vooraf: tanden poetsen 30 min voor het bleachen + interdentaal reinigen.
          Vermijd kleurende voeding tijdens het traject (rode wijn, rood fruit, kurkuma, curry).
          Te gevoelig? Sla 1 nacht over en vul het bitje met GC Tooth Mousse; het protocol schuift vanzelf mee op.
        </p>
      </div>
    </div>
  )
}
