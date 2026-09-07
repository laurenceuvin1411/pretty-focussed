import { executeOnboarding1on1 } from '../skills/onboarding1on1'
import type { OnboardingPayload } from '../skills/onboarding1on1'
import type { AutomationPayload } from './automationEngine'

// Each skill receives (runId, payload.data) and is responsible for its own step logging
type SkillExecutor = (runId: string, data: Record<string, unknown>) => Promise<void>

const registry: Map<string, SkillExecutor> = new Map()

// Register all skills here — add future skills below without touching the engine
registry.set('onboarding-1on1', async (runId, data) => {
  await executeOnboarding1on1(runId, data as unknown as OnboardingPayload)
})

// registry.set('onboarding-group', async (runId, data) => { ... })
// registry.set('client-success',   async (runId, data) => { ... })
// registry.set('retention',        async (runId, data) => { ... })
// registry.set('project-kickoff',  async (runId, data) => { ... })

export function getSkill(skillId: string): SkillExecutor | undefined {
  return registry.get(skillId)
}

export function dispatchSkill(skillId: string, runId: string, payload: AutomationPayload): void {
  const skill = getSkill(skillId)
  if (!skill) {
    console.warn(`[SkillRegistry] Unknown skill: "${skillId}"`)
    return
  }
  // Fire-and-forget — the skill updates its own run state
  skill(runId, payload.data).catch(err => {
    console.error(`[SkillRegistry] Skill "${skillId}" threw an unhandled error:`, err)
  })
}
