import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type RunStatus = 'pending' | 'running' | 'completed' | 'failed'
export type StepStatus = 'pending' | 'running' | 'completed' | 'failed' | 'skipped'

export interface StepLog {
  id: string
  name: string
  status: StepStatus
  output?: string
  error?: string
  timestamp: string
  retryable: boolean
}

export interface AutomationRun {
  id: string
  workflowId: string
  workflowName: string
  skillId: string
  triggerEvent: string
  payload: Record<string, unknown>
  status: RunStatus
  steps: StepLog[]
  startedAt: string
  completedAt?: string
  leadId?: string
  leadName?: string
}

export interface WorkflowDefinition {
  id: string
  name: string
  description: string
  trigger: {
    event: string
    conditions: Record<string, unknown>
  }
  skillId: string
  enabled: boolean
  createdAt: string
}

export const DEFAULT_WORKFLOWS: WorkflowDefinition[] = [
  {
    id: 'wf-onboarding-1on1',
    name: '1:1 Coaching Onboarding',
    description: 'Automatisch onboarden zodra een 1:1 Coaching deal gewonnen wordt',
    trigger: {
      event: 'deal.won',
      conditions: { program: '1:1 Business Coaching' },
    },
    skillId: 'onboarding-1on1',
    enabled: true,
    createdAt: '2026-06-27T00:00:00.000Z',
  },
]

interface AutomationStore {
  workflows: WorkflowDefinition[]
  runs: AutomationRun[]

  addRun: (run: AutomationRun) => void
  updateRun: (id: string, updates: Partial<AutomationRun>) => void
  addStep: (runId: string, step: StepLog) => void
  updateStep: (runId: string, stepId: string, updates: Partial<StepLog>) => void
  toggleWorkflow: (id: string) => void
  retryStep: (runId: string, stepId: string) => void
  clearRuns: () => void
}

export const useAutomationStore = create<AutomationStore>()(
  persist(
    (set) => ({
      workflows: DEFAULT_WORKFLOWS,
      runs: [],

      addRun: (run) =>
        set(s => ({ runs: [run, ...s.runs].slice(0, 50) })),

      updateRun: (id, updates) =>
        set(s => ({ runs: s.runs.map(r => r.id === id ? { ...r, ...updates } : r) })),

      addStep: (runId, step) =>
        set(s => ({
          runs: s.runs.map(r =>
            r.id === runId ? { ...r, steps: [...r.steps, step] } : r
          ),
        })),

      updateStep: (runId, stepId, updates) =>
        set(s => ({
          runs: s.runs.map(r =>
            r.id === runId
              ? { ...r, steps: r.steps.map(st => st.id === stepId ? { ...st, ...updates } : st) }
              : r
          ),
        })),

      toggleWorkflow: (id) =>
        set(s => ({
          workflows: s.workflows.map(w => w.id === id ? { ...w, enabled: !w.enabled } : w),
        })),

      // Mark a failed step as pending so the skill runner can retry it
      retryStep: (runId, stepId) =>
        set(s => ({
          runs: s.runs.map(r =>
            r.id === runId
              ? {
                  ...r,
                  status: 'running',
                  steps: r.steps.map(st =>
                    st.id === stepId ? { ...st, status: 'pending', error: undefined } : st
                  ),
                }
              : r
          ),
        })),

      clearRuns: () => set({ runs: [] }),
    }),
    {
      name: 'automation-engine-v1',
      partialize: (s) => ({ workflows: s.workflows, runs: s.runs }),
      merge: (persisted: any, current) => ({
        ...current,
        ...(persisted ?? {}),
        // Always merge DEFAULT_WORKFLOWS for new workflow definitions
        workflows: mergeWorkflows(persisted?.workflows ?? [], current.workflows),
      }),
    }
  )
)

// Keeps persisted user toggles while adding any new default workflows
function mergeWorkflows(
  persisted: WorkflowDefinition[],
  defaults: WorkflowDefinition[]
): WorkflowDefinition[] {
  const map = new Map(persisted.map(w => [w.id, w]))
  defaults.forEach(d => { if (!map.has(d.id)) map.set(d.id, d) })
  return Array.from(map.values())
}
