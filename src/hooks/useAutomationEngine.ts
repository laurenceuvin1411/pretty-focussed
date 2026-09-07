import { useEffect } from 'react'
import { onEvent, matchesConditions } from '../engine/automationEngine'
import { dispatchSkill } from '../engine/skillRegistry'
import { useAutomationStore } from '../store/automationStore'
import type { AutomationPayload } from '../engine/automationEngine'
import type { AutomationRun } from '../store/automationStore'

// Mounted once in AppShell — registers all workflow event handlers
export function useAutomationEngine() {
  const workflows = useAutomationStore(s => s.workflows)
  const addRun = useAutomationStore(s => s.addRun)

  useEffect(() => {
    // Register one handler per unique event across all enabled workflows
    const eventSet = new Set(workflows.filter(w => w.enabled).map(w => w.trigger.event))

    const unsubscribers = Array.from(eventSet).map(event =>
      onEvent(event, (payload: AutomationPayload) => {
        // Find all enabled workflows that match this event + conditions
        const matched = workflows.filter(w =>
          w.enabled &&
          w.trigger.event === event &&
          matchesConditions(payload.data, w.trigger.conditions)
        )

        matched.forEach(workflow => {
          const run: AutomationRun = {
            id: crypto.randomUUID(),
            workflowId: workflow.id,
            workflowName: workflow.name,
            skillId: workflow.skillId,
            triggerEvent: event,
            payload: payload.data,
            status: 'pending',
            steps: [],
            startedAt: payload.timestamp,
            leadId: payload.data.leadId as string | undefined,
            leadName: payload.data.leadName as string | undefined,
          }

          addRun(run)
          dispatchSkill(workflow.skillId, run.id, payload)
        })
      })
    )

    return () => unsubscribers.forEach(unsub => unsub())
  }, [workflows, addRun])
}
