import { useState } from 'react'
import { ChevronDown, ChevronUp, CheckCircle, XCircle, Loader2, Clock, RefreshCw, Zap } from 'lucide-react'
import { useAutomationStore } from '../../store/automationStore'
import type { AutomationRun, StepLog } from '../../store/automationStore'
import { dispatchSkill } from '../../engine/skillRegistry'
import type { AutomationPayload } from '../../engine/automationEngine'

const STATUS_COLOR: Record<string, string> = {
  pending:   'var(--color-subtle)',
  running:   '#38BDF8',
  completed: '#7A9E8A',
  failed:    '#C4736A',
  skipped:   'var(--color-muted)',
}

const STATUS_LABEL: Record<string, string> = {
  pending:   'Wacht',
  running:   'Bezig',
  completed: 'Klaar',
  failed:    'Mislukt',
  skipped:   'Overgeslagen',
}

function StatusDot({ status }: { status: string }) {
  return (
    <span style={{
      display: 'inline-block', width: 7, height: 7, borderRadius: '50%',
      background: STATUS_COLOR[status] ?? 'var(--color-subtle)',
      flexShrink: 0,
    }} />
  )
}

function StepRow({ step, runId }: { step: StepLog; runId: string }) {
  const retryStep = useAutomationStore(s => s.retryStep)
  const run = useAutomationStore(s => s.runs.find(r => r.id === runId))

  const handleRetry = () => {
    if (!run) return
    retryStep(runId, step.id)
    // Re-dispatch the skill starting from this step
    const payload: AutomationPayload = {
      event: run.triggerEvent,
      data: run.payload,
      timestamp: new Date().toISOString(),
    }
    dispatchSkill(run.skillId, runId, payload)
  }

  return (
    <div style={{
      display: 'flex', alignItems: 'flex-start', gap: 10,
      padding: '6px 0', borderBottom: '1px solid var(--color-border)',
    }}>
      <div style={{ paddingTop: 3 }}>
        {step.status === 'running' ? (
          <Loader2 size={12} color="#38BDF8" style={{ animation: 'spin 1s linear infinite' }} />
        ) : step.status === 'completed' ? (
          <CheckCircle size={12} color="#7A9E8A" />
        ) : step.status === 'failed' ? (
          <XCircle size={12} color="#C4736A" />
        ) : (
          <Clock size={12} color="var(--color-subtle)" />
        )}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
          <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--color-ink)' }}>{step.name}</span>
          <span style={{ fontSize: 10, color: 'var(--color-subtle)', flexShrink: 0 }}>
            {new Date(step.timestamp).toLocaleTimeString('nl-BE', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </span>
        </div>

        {step.output && (
          <p style={{ fontSize: 11, color: 'var(--color-muted)', marginTop: 2, lineHeight: 1.4 }}>{step.output}</p>
        )}
        {step.error && (
          <div style={{ marginTop: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
            <p style={{ fontSize: 11, color: '#C4736A', flex: 1, lineHeight: 1.4 }}>{step.error}</p>
            {step.retryable && (
              <button
                onClick={handleRetry}
                style={{
                  display: 'flex', alignItems: 'center', gap: 4, padding: '2px 8px',
                  background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)',
                  borderRadius: 4, cursor: 'pointer', fontSize: 10, color: '#C4736A',
                  fontWeight: 600,
                }}
              >
                <RefreshCw size={9} />
                Retry
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function RunCard({ run }: { run: AutomationRun }) {
  const [expanded, setExpanded] = useState(run.status === 'running' || run.status === 'failed')

  const duration = run.completedAt
    ? Math.round((new Date(run.completedAt).getTime() - new Date(run.startedAt).getTime()) / 1000)
    : null

  const completedSteps = run.steps.filter(s => s.status === 'completed').length
  const failedSteps = run.steps.filter(s => s.status === 'failed').length

  return (
    <div style={{
      border: '1px solid var(--color-border)',
      borderLeft: `3px solid ${STATUS_COLOR[run.status]}`,
      borderRadius: 10,
      overflow: 'hidden',
      background: 'var(--color-card)',
    }}>
      {/* Header */}
      <button
        onClick={() => setExpanded(e => !e)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: 10,
          padding: '12px 14px', background: 'none', border: 'none',
          cursor: 'pointer', textAlign: 'left',
        }}
      >
        <StatusDot status={run.status} />

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-ink)' }}>
              {run.leadName ?? 'Onbekende client'}
            </span>
            <span style={{
              fontSize: 10, fontWeight: 600, padding: '1px 6px', borderRadius: 4,
              background: `${STATUS_COLOR[run.status]}20`,
              color: STATUS_COLOR[run.status],
            }}>
              {STATUS_LABEL[run.status]}
            </span>
            {run.status === 'running' && (
              <Loader2 size={11} color="#38BDF8" style={{ animation: 'spin 1s linear infinite' }} />
            )}
          </div>
          <div style={{ display: 'flex', align: 'center', gap: 8, marginTop: 2 }}>
            <span style={{ fontSize: 10, color: 'var(--color-subtle)' }}>
              {run.workflowName}
            </span>
            {run.steps.length > 0 && (
              <span style={{ fontSize: 10, color: 'var(--color-subtle)' }}>
                · {completedSteps}/{run.steps.length} stappen
                {failedSteps > 0 && ` · ${failedSteps} mislukt`}
                {duration !== null && ` · ${duration}s`}
              </span>
            )}
          </div>
        </div>

        {expanded ? <ChevronUp size={14} color="var(--color-subtle)" /> : <ChevronDown size={14} color="var(--color-subtle)" />}
      </button>

      {/* Step logs */}
      {expanded && run.steps.length > 0 && (
        <div style={{ padding: '0 14px 12px', borderTop: '1px solid var(--color-border)' }}>
          <div style={{ paddingTop: 8 }}>
            {run.steps.map(step => (
              <StepRow key={step.id} step={step} runId={run.id} />
            ))}
          </div>
        </div>
      )}

      {expanded && run.steps.length === 0 && (
        <div style={{ padding: '8px 14px 12px', borderTop: '1px solid var(--color-border)' }}>
          <p style={{ fontSize: 11, color: 'var(--color-subtle)' }}>Stappen worden geladen…</p>
        </div>
      )}
    </div>
  )
}

interface AutomationPanelProps {
  /** If provided, only show runs for this lead */
  filterLeadId?: string
  /** Compact mode — only show last 3 runs */
  compact?: boolean
}

export function AutomationPanel({ filterLeadId, compact = false }: AutomationPanelProps) {
  const allRuns = useAutomationStore(s => s.runs)
  const clearRuns = useAutomationStore(s => s.clearRuns)

  const runs = filterLeadId
    ? allRuns.filter(r => r.leadId === filterLeadId)
    : allRuns

  const displayed = compact ? runs.slice(0, 3) : runs

  if (runs.length === 0) return null

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <Zap size={13} color="var(--color-accent)" />
          <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'var(--color-muted)' }}>
            Automations
          </span>
        </div>
        {!compact && runs.length > 0 && (
          <button
            onClick={clearRuns}
            style={{ fontSize: 10, color: 'var(--color-subtle)', background: 'none', border: 'none', cursor: 'pointer' }}
          >
            Wis log
          </button>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {displayed.map(run => <RunCard key={run.id} run={run} />)}
      </div>

      {compact && runs.length > 3 && (
        <p style={{ fontSize: 11, color: 'var(--color-subtle)', marginTop: 8, textAlign: 'center' }}>
          +{runs.length - 3} eerdere runs — zie /automations voor volledig overzicht
        </p>
      )}
    </div>
  )
}
