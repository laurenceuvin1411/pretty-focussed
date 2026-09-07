import { useSkinProtocolStore, getProtocolDay, getWeekDates, PROTOCOL_START } from '../store/skinProtocolStore'
import type { DoseKey } from '../store/skinProtocolStore'
import { Check, Pill, Moon, Droplets } from 'lucide-react'
import { format } from 'date-fns'
import { enGB } from 'date-fns/locale'

const DOSE_CONFIG: Record<DoseKey, { label: string; sub: string; icon: typeof Pill; color: string }> = {
  morning:   { label: 'Skin medication',  sub: 'Morning',   icon: Droplets, color: '#D4835C' },
  evening:   { label: 'Skin medication',  sub: 'Evening',   icon: Droplets, color: '#A57A8B' },
  nightcream:{ label: 'Night cream',      sub: 'Smear',     icon: Moon,     color: '#7AACCF' },
}

function DoseRow({ dose, done, onToggle, disabled }: {
  dose: DoseKey; done: boolean; onToggle: () => void; disabled?: boolean
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
      {/* Checkbox */}
      <div style={{
        width: 24, height: 24, borderRadius: 7, flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: done ? cfg.color : 'transparent',
        border: `2px solid ${done ? cfg.color : 'rgba(210,180,145,0.3)'}`,
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
        <p style={{ fontSize: 10, color: 'var(--color-subtle)', marginTop: 1 }}>{cfg.sub}</p>
      </div>

      {done && (
        <span style={{ fontSize: 10, fontWeight: 700, color: cfg.color, background: `${cfg.color}15`, padding: '2px 8px', borderRadius: 99 }}>
          Done
        </span>
      )}
    </button>
  )
}

export function SkinProtocol({ selectedDateStr }: { selectedDateStr: string }) {
  const { logs, toggleDose } = useSkinProtocolStore()
  const protocol = getProtocolDay(selectedDateStr)
  const takenToday = logs[selectedDateStr] ?? []

  const todayStr = new Date().toISOString().split('T')[0]
  const isFuture = selectedDateStr > todayStr

  // Nightcream: count how many times this week (phase 1 only)
  const weekDates = getWeekDates(selectedDateStr)
  const nightcreamThisWeek = weekDates.filter(d => (logs[d] ?? []).includes('nightcream')).length
  const nightcreamGoal = protocol.nightcreamGoalPerWeek

  // Days remaining in protocol
  const startDate = new Date(PROTOCOL_START + 'T00:00:00')
  const endDate = new Date(startDate)
  endDate.setDate(startDate.getDate() + 83)
  const today = new Date(todayStr + 'T00:00:00')
  const daysLeft = Math.max(0, Math.ceil((endDate.getTime() - today.getTime()) / 86400000))
  const totalDays = 84
  const daysElapsed = Math.min(totalDays, Math.max(0, Math.ceil((today.getTime() - startDate.getTime()) / 86400000)))
  const overallProgress = Math.round((daysElapsed / totalDays) * 100)

  if (protocol.phase === 'notstarted') {
    const startFmt = format(new Date(PROTOCOL_START + 'T12:00:00'), 'd MMMM yyyy', { locale: enGB })
    return (
      <div className="card" style={{ padding: '20px 22px', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
          <Pill size={15} color="var(--color-accent)" />
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--color-accent)' }}>Skin Protocol</span>
        </div>
        <p style={{ fontSize: 13, color: 'var(--color-muted)' }}>Starts <strong style={{ color: 'var(--color-ink)' }}>{startFmt}</strong></p>
      </div>
    )
  }

  if (protocol.phase === 'done') {
    return (
      <div className="card" style={{ padding: '20px 22px', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
          <Pill size={15} color="#6DB889" />
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#6DB889' }}>Skin Protocol — Complete</span>
        </div>
        <p style={{ fontSize: 13, color: 'var(--color-muted)' }}>12-week treatment finished. Well done.</p>
      </div>
    )
  }

  const phaseLabel = protocol.phase === 'phase1'
    ? `Phase 1 — Week ${protocol.weekNum}/6 · 2×/dag + nachtcrème`
    : `Phase 2 — Week ${protocol.weekNum}/12 · 1×/dag`

  const dosesToShow: DoseKey[] = protocol.phase === 'phase1'
    ? ['morning', 'evening', 'nightcream']
    : ['morning']

  return (
    <div className="card" style={{ padding: '20px 22px', marginBottom: 20 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 16, background: 'rgba(201,104,64,0.12)', border: '1px solid rgba(201,104,64,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Pill size={15} color="var(--color-accent)" />
          </div>
          <div>
            <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--color-accent)', marginBottom: 1 }}>Skin Protocol</p>
            <p style={{ fontSize: 12, color: 'var(--color-muted)' }}>{phaseLabel}</p>
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <p style={{ fontSize: 11, color: 'var(--color-subtle)' }}>{daysLeft} days left</p>
        </div>
      </div>

      {/* Overall progress bar */}
      <div style={{ marginBottom: 18 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
          <span style={{ fontSize: 9, color: 'var(--color-subtle)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Overall progress</span>
          <span style={{ fontSize: 9, fontWeight: 700, color: 'var(--color-muted)' }}>{overallProgress}%</span>
        </div>
        <div style={{ height: 4, borderRadius: 99, background: 'rgba(210,180,145,0.10)', overflow: 'hidden' }}>
          <div style={{
            height: '100%', borderRadius: 99,
            width: `${overallProgress}%`,
            background: protocol.phase === 'phase1'
              ? 'linear-gradient(90deg, #D4835C, #C96840)'
              : 'linear-gradient(90deg, #A57A8B, #7AACCF)',
            transition: 'width 0.8s cubic-bezier(.16,1,.3,1)',
          }} />
        </div>

        {/* Phase markers */}
        <div style={{ position: 'relative', marginTop: 4 }}>
          <div style={{ position: 'absolute', left: '50%', top: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', transform: 'translateX(-50%)' }}>
            <div style={{ width: 1, height: 6, background: 'rgba(210,180,145,0.20)' }} />
            <span style={{ fontSize: 8, color: 'rgba(210,180,145,0.35)', whiteSpace: 'nowrap' }}>Phase 2 →</span>
          </div>
        </div>
      </div>

      {/* Dose checkboxes */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {dosesToShow.map(dose => {
          // For nightcream: if already done 2x this week on OTHER days, still allow toggling today
          const done = takenToday.includes(dose)
          return (
            <DoseRow
              key={dose}
              dose={dose}
              done={done}
              onToggle={() => toggleDose(selectedDateStr, dose)}
              disabled={isFuture}
            />
          )
        })}
      </div>

      {/* Nightcream week counter (phase 1 only) */}
      {protocol.phase === 'phase1' && (
        <div style={{ marginTop: 12, padding: '10px 14px', borderRadius: 16, background: 'rgba(122,172,207,0.07)', border: '1px solid rgba(122,172,207,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Moon size={12} color="#7AACCF" />
            <span style={{ fontSize: 11, color: 'var(--color-muted)' }}>Night cream this week</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {Array.from({ length: nightcreamGoal }, (_, i) => (
              <div key={i} style={{
                width: 18, height: 18, borderRadius: 5,
                background: i < nightcreamThisWeek ? '#7AACCF' : 'rgba(122,172,207,0.12)',
                border: `1.5px solid ${i < nightcreamThisWeek ? '#7AACCF' : 'rgba(122,172,207,0.25)'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {i < nightcreamThisWeek && <Check size={9} color="#0A0805" strokeWidth={3} />}
              </div>
            ))}
            <span style={{ fontSize: 11, fontWeight: 700, color: nightcreamThisWeek >= nightcreamGoal ? '#7AACCF' : 'var(--color-subtle)' }}>
              {nightcreamThisWeek}/{nightcreamGoal}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
