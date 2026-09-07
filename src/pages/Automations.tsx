import { useState } from 'react'
import { Zap, ToggleLeft, ToggleRight, ChevronDown, ChevronUp, CheckCircle, XCircle, Clock, Loader2, RefreshCw, Trash2 } from 'lucide-react'
import { useAutomationStore } from '../store/automationStore'
import { AutomationPanel } from '../components/automation/AutomationPanel'
import type { WorkflowDefinition } from '../store/automationStore'

const EVENT_LABEL: Record<string, string> = {
  'deal.won':              'Deal gewonnen',
  'invoice.paid':          'Factuur betaald',
  'subscription.cancelled':'Abonnement opgezegd',
  'proposal.accepted':     'Voorstel aanvaard',
  'employee.new':          'Nieuwe medewerker',
}

const SKILL_LABEL: Record<string, string> = {
  'onboarding-1on1':   '/onboarding-1on1',
  'onboarding-group':  '/onboarding-group',
  'client-success':    '/client-success',
  'retention':         '/retention',
  'project-kickoff':   '/project-kickoff',
}

function ConditionBadge({ label, value }: { label: string; value: string }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '2px 8px', borderRadius: 4,
      background: 'var(--color-surface)', border: '1px solid var(--color-border)',
      fontSize: 11, color: 'var(--color-muted)', fontFamily: 'monospace',
    }}>
      <span style={{ color: 'var(--color-subtle)' }}>{label}:</span>
      <span style={{ color: 'var(--color-ink)', fontWeight: 600 }}>{value}</span>
    </span>
  )
}

function WorkflowCard({ workflow }: { workflow: WorkflowDefinition }) {
  const [expanded, setExpanded] = useState(false)
  const toggleWorkflow = useAutomationStore(s => s.toggleWorkflow)
  const runs = useAutomationStore(s => s.runs.filter(r => r.workflowId === workflow.id))

  const lastRun = runs[0]
  const successCount = runs.filter(r => r.status === 'completed').length
  const failCount = runs.filter(r => r.status === 'failed').length

  return (
    <div style={{
      border: '1px solid var(--color-border)',
      borderLeft: `3px solid ${workflow.enabled ? 'var(--color-brand-green)' : 'var(--color-border)'}`,
      borderRadius: 12, background: 'var(--color-card)',
      opacity: workflow.enabled ? 1 : 0.6,
      transition: 'opacity 200ms',
    }}>
      {/* Header row */}
      <div style={{ padding: '16px 18px', display: 'flex', alignItems: 'flex-start', gap: 14 }}>
        {/* Toggle */}
        <button
          onClick={() => toggleWorkflow(workflow.id)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginTop: 2, flexShrink: 0 }}
          title={workflow.enabled ? 'Deactiveer' : 'Activeer'}
        >
          {workflow.enabled
            ? <ToggleRight size={22} color="var(--color-brand-green)" />
            : <ToggleLeft size={22} color="var(--color-subtle)" />
          }
        </button>

        {/* Main info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-ink)' }}>{workflow.name}</span>
            {!workflow.enabled && (
              <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 4, background: 'var(--color-surface)', color: 'var(--color-subtle)', fontWeight: 600 }}>
                INACTIEF
              </span>
            )}
          </div>
          <p style={{ fontSize: 12, color: 'var(--color-muted)', marginTop: 3 }}>{workflow.description}</p>

          {/* Trigger → Skill flow */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
            <div style={{
              padding: '4px 10px', borderRadius: 14,
              background: 'rgba(120,119,198,0.12)', border: '1px solid rgba(120,119,198,0.25)',
              fontSize: 11, fontWeight: 600, color: '#9B8FE8',
            }}>
              ⚡ {EVENT_LABEL[workflow.trigger.event] ?? workflow.trigger.event}
            </div>

            {Object.entries(workflow.trigger.conditions).map(([k, v]) => (
              <ConditionBadge key={k} label={k} value={String(v)} />
            ))}

            <span style={{ fontSize: 12, color: 'var(--color-subtle)' }}>→</span>

            <div style={{
              padding: '4px 10px', borderRadius: 14,
              background: 'rgba(99,210,124,0.12)', border: '1px solid rgba(99,210,124,0.25)',
              fontSize: 11, fontWeight: 600, color: 'var(--color-brand-green)',
            }}>
              {SKILL_LABEL[workflow.skillId] ?? workflow.skillId}
            </div>
          </div>

          {/* Stats row */}
          {runs.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 10 }}>
              <span style={{ fontSize: 11, color: 'var(--color-subtle)' }}>
                {runs.length} run{runs.length !== 1 ? 's' : ''}
              </span>
              {successCount > 0 && (
                <span style={{ fontSize: 11, color: '#4C6481' }}>✓ {successCount} geslaagd</span>
              )}
              {failCount > 0 && (
                <span style={{ fontSize: 11, color: 'var(--color-muted)' }}>✗ {failCount} mislukt</span>
              )}
              {lastRun && (
                <span style={{ fontSize: 11, color: 'var(--color-subtle)' }}>
                  Laatste: {new Date(lastRun.startedAt).toLocaleDateString('nl-BE', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Expand runs */}
        {runs.length > 0 && (
          <button
            onClick={() => setExpanded(e => !e)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, flexShrink: 0 }}
          >
            {expanded ? <ChevronUp size={16} color="var(--color-subtle)" /> : <ChevronDown size={16} color="var(--color-subtle)" />}
          </button>
        )}
      </div>

      {/* Run log */}
      {expanded && (
        <div style={{ padding: '0 18px 16px', borderTop: '1px solid var(--color-border)' }}>
          <div style={{ paddingTop: 14 }}>
            <AutomationPanel filterLeadId={undefined} compact={false} />
          </div>
        </div>
      )}
    </div>
  )
}

export function Automations() {
  const workflows = useAutomationStore(s => s.workflows)
  const runs = useAutomationStore(s => s.runs)
  const clearRuns = useAutomationStore(s => s.clearRuns)

  const activeCount = workflows.filter(w => w.enabled).length
  const runningCount = runs.filter(r => r.status === 'running').length
  const completedCount = runs.filter(r => r.status === 'completed').length
  const failedCount = runs.filter(r => r.status === 'failed').length

  return (
    <div style={{ maxWidth: 800 }}>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
          <Zap size={20} color="var(--color-accent)" />
          <h1 style={{ fontSize: 26, fontWeight: 800, color: 'var(--color-ink)', fontFamily: 'Syne, sans-serif' }}>
            Automation Engine
          </h1>
        </div>
        <p style={{ fontSize: 14, color: 'var(--color-muted)', maxWidth: 540 }}>
          Event-driven workflows die automatisch starten wanneer iets gebeurt in je OS.
          Elk event triggert een skill — geen handmatige interventie nodig.
        </p>
      </div>

      {/* Stats bar */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 32,
      }}>
        {[
          { label: 'Actieve workflows', value: activeCount, color: 'var(--color-brand-green)' },
          { label: 'Bezig', value: runningCount, color: '#38BDF8' },
          { label: 'Geslaagd', value: completedCount, color: '#4C6481' },
          { label: 'Mislukt', value: failedCount, color: 'var(--color-muted)' },
        ].map(s => (
          <div key={s.label} style={{
            padding: '14px 16px', borderRadius: 16,
            background: 'var(--color-card)', border: '1px solid var(--color-border)',
          }}>
            <div style={{ fontSize: 24, fontWeight: 800, color: s.color, fontVariantNumeric: 'tabular-nums' }}>
              {s.value}
            </div>
            <div style={{ fontSize: 11, color: 'var(--color-subtle)', marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Architecture explanation */}
      <div style={{
        padding: '14px 18px', borderRadius: 16, marginBottom: 28,
        background: 'var(--color-surface)', border: '1px solid var(--color-border)',
        display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap',
      }}>
        {['CRM Event', 'Conditie check', 'Skill launch', 'Stap logging', 'CRM timeline'].map((s, i, arr) => (
          <span key={s} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-muted)' }}>{s}</span>
            {i < arr.length - 1 && <span style={{ color: 'var(--color-subtle)', fontSize: 16 }}>→</span>}
          </span>
        ))}
      </div>

      {/* Workflow definitions */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <h2 style={{ fontSize: 13, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--color-muted)' }}>
            Workflows ({workflows.length})
          </h2>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {workflows.map(w => <WorkflowCard key={w.id} workflow={w} />)}
        </div>
      </div>

      {/* Recent runs */}
      {runs.length > 0 && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <h2 style={{ fontSize: 13, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--color-muted)' }}>
              Recente runs ({runs.length})
            </h2>
            <button
              onClick={clearRuns}
              style={{
                display: 'flex', alignItems: 'center', gap: 5, padding: '4px 10px',
                background: 'none', border: '1px solid var(--color-border)',
                borderRadius: 14, cursor: 'pointer', fontSize: 11, color: 'var(--color-subtle)',
              }}
            >
              <Trash2 size={11} />
              Wis log
            </button>
          </div>
          <AutomationPanel />
        </div>
      )}

      {runs.length === 0 && (
        <div style={{
          padding: '40px 24px', textAlign: 'center',
          border: '1px dashed var(--color-border)', borderRadius: 12,
        }}>
          <Zap size={24} color="var(--color-subtle)" style={{ margin: '0 auto 12px' }} />
          <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-muted)', marginBottom: 6 }}>
            Nog geen automations gestart
          </p>
          <p style={{ fontSize: 12, color: 'var(--color-subtle)', maxWidth: 320, margin: '0 auto' }}>
            Zodra je een 1:1 Coaching deal markeert als gewonnen in Sales, start het onboarding-proces automatisch.
          </p>
        </div>
      )}
    </div>
  )
}
