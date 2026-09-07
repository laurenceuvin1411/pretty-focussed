import { useLeadStore } from '../store/leadStore'
import { useTaskStore } from '../store/taskStore'
import { useAutomationStore } from '../store/automationStore'
import type { StepLog } from '../store/automationStore'

export interface OnboardingPayload {
  leadId: string
  leadName: string
  companyName?: string
  email?: string
  phone?: string
  vatNumber?: string
  program: string
  value: number
  channel: string
  notes?: string
  wonAt: string
}

interface AIOnboardingContent {
  welcomeEmail: { subject: string; body: string }
  contractSummary: string
  kickoffAgenda: string[]
  firstSessionPrep: string[]
  driveStructure: string[]
}

async function callClaude(prompt: string): Promise<string> {
  const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY
  if (!apiKey) throw new Error('VITE_ANTHROPIC_API_KEY ontbreekt in .env')

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-allow-browser': 'true',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 2000,
      messages: [{ role: 'user', content: prompt }],
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Claude API fout: ${res.status} — ${err}`)
  }

  const json = await res.json()
  return json.content?.[0]?.text ?? ''
}

function makeStep(name: string, retryable = true): StepLog {
  return {
    id: crypto.randomUUID(),
    name,
    status: 'pending',
    timestamp: new Date().toISOString(),
    retryable,
  }
}

// Run a step: update to running, execute fn, update to completed/failed
// Returns { stepId, success, output, error }
async function runStep(
  runId: string,
  step: StepLog,
  fn: () => Promise<string>
): Promise<{ stepId: string; success: boolean; output?: string; error?: string }> {
  const store = useAutomationStore.getState()
  store.addStep(runId, step)
  store.updateStep(runId, step.id, { status: 'running', timestamp: new Date().toISOString() })

  try {
    const output = await fn()
    store.updateStep(runId, step.id, { status: 'completed', output, timestamp: new Date().toISOString() })
    return { stepId: step.id, success: true, output }
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err)
    store.updateStep(runId, step.id, { status: 'failed', error, timestamp: new Date().toISOString() })
    return { stepId: step.id, success: false, error }
  }
}

export async function executeOnboarding1on1(runId: string, payload: OnboardingPayload): Promise<void> {
  const automationStore = useAutomationStore.getState()
  const leadStore = useLeadStore.getState()
  const taskStore = useTaskStore.getState()

  automationStore.updateRun(runId, { status: 'running' })

  let allSuccess = true

  // ── Step 1: Validate client data ─────────────────────────────────────────
  const s1 = makeStep('Client data valideren', false)
  const v1 = await runStep(runId, s1, async () => {
    const missing: string[] = []
    if (!payload.email) missing.push('e-mailadres')
    if (!payload.leadName) missing.push('naam')
    if (missing.length > 0) {
      return `⚠️ Gedeeltelijke data — ontbreekt: ${missing.join(', ')}. Onboarding gaat door.`
    }
    return `✓ Alle vereiste velden aanwezig voor ${payload.leadName}`
  })
  if (!v1.success) allSuccess = false

  // ── Step 2: Generate all AI content in one call ───────────────────────────
  const s2 = makeStep('AI-content genereren (welkomstmail + contract + agenda)')
  let aiContent: AIOnboardingContent | null = null

  const v2 = await runStep(runId, s2, async () => {
    const prompt = `Je bent de persoonlijke business assistant van Laurence Uvin, een executive coach.

Een nieuwe 1:1 Business Coaching client is net onboard gegaan. Genereer alle onboarding-content in één JSON-object.

CLIENT:
- Naam: ${payload.leadName}
- Bedrijf: ${payload.companyName || 'niet opgegeven'}
- E-mail: ${payload.email || 'niet opgegeven'}
- Pakket: ${payload.program}
- Waarde: €${payload.value.toLocaleString('nl-BE')}
- Kanaal: ${payload.channel}
- Notities: ${payload.notes || 'geen'}
- Startdatum: ${new Date(payload.wonAt).toLocaleDateString('nl-BE', { day: 'numeric', month: 'long', year: 'numeric' })}

Geef antwoord UITSLUITEND als geldig JSON in dit exact formaat:
{
  "welcomeEmail": {
    "subject": "...",
    "body": "..."
  },
  "contractSummary": "...",
  "kickoffAgenda": ["...", "...", "..."],
  "firstSessionPrep": ["...", "...", "..."],
  "driveStructure": ["📁 ${payload.leadName} — Coaching", "  📄 Intakeformulier", "  📄 Sessie-notities", "  📄 Actieplan", "  📁 Resources"]
}

Schrijf in het Nederlands. De welkomstmail is warm, persoonlijk en professioneel. Het contractsamenvatting is 2-3 zinnen. De kick-off agenda heeft 5-6 punten. De eerste sessie prep heeft 4-5 actiepunten voor de client.`

    const raw = await callClaude(prompt)

    // Extract JSON from response
    const match = raw.match(/\{[\s\S]*\}/)
    if (!match) throw new Error('AI gaf geen geldig JSON terug')

    aiContent = JSON.parse(match[0]) as AIOnboardingContent

    return `✓ Welkomstmail, contractsamenvatting, kick-off agenda en Drive-structuur gegenereerd`
  })
  if (!v2.success) allSuccess = false

  // ── Step 3: Create kick-off tasks in task store ───────────────────────────
  const s3 = makeStep('Kick-off checklist aanmaken in Tasks')
  const v3 = await runStep(runId, s3, async () => {
    const items = aiContent?.kickoffAgenda ?? [
      'Intakeformulier versturen',
      'Eerste sessie inplannen',
      'Coaching pakket bevestigen',
      'Google Drive map aanmaken',
      'Welkomstmail versturen',
    ]

    const today = new Date().toISOString().split('T')[0]
    let created = 0

    for (const item of items) {
      try {
        await taskStore.addTask({
          title: `[${payload.leadName}] ${item}`,
          description: `Onboarding taak voor 1:1 Coaching client ${payload.leadName}`,
          business: 'laurence-uvin',
          category: 'admin',
          priority: 'high',
          needleMover: false,
          status: 'todo',
          dueDate: today,
          estimatedMinutes: 15,
          tags: ['onboarding', '1on1-coaching'],
        })
        created++
      } catch {
        // Non-fatal: continue with remaining tasks
      }
    }

    return `✓ ${created}/${items.length} taken aangemaakt in je Focus-lijst`
  })
  if (!v3.success) allSuccess = false

  // ── Step 4: Log welcome email draft to CRM ────────────────────────────────
  const s4 = makeStep('Welkomstmail gelogd in CRM timeline')
  const v4 = await runStep(runId, s4, async () => {
    if (!aiContent?.welcomeEmail) {
      return 'Overgeslagen — geen AI content beschikbaar'
    }
    const { subject, body } = aiContent.welcomeEmail
    const content = `📧 Welkomstmail draft\n\nOnderwerp: ${subject}\n\n${body}`
    await leadStore.addActivity(payload.leadId, 'email', content)
    return `✓ Welkomstmail klaargemaakt — onderwerp: "${subject}"`
  })
  if (!v4.success) allSuccess = false

  // ── Step 5: Log contract summary to CRM ──────────────────────────────────
  const s5 = makeStep('Contractsamenvatting gelogd in CRM timeline')
  const v5 = await runStep(runId, s5, async () => {
    const summary = aiContent?.contractSummary ?? 'Standaard 1:1 Business Coaching overeenkomst'
    await leadStore.addActivity(
      payload.leadId,
      'note',
      `📋 Contractsamenvatting\n\n${summary}`
    )
    return `✓ Contractsamenvatting gelogd`
  })
  if (!v5.success) allSuccess = false

  // ── Step 6: Log Google Drive structure to CRM ─────────────────────────────
  const s6 = makeStep('Google Drive mapstructuur aangemaakt')
  const v6 = await runStep(runId, s6, async () => {
    const structure = aiContent?.driveStructure ?? [
      `📁 ${payload.leadName} — Coaching`,
      '  📄 Intakeformulier',
      '  📄 Sessie-notities',
      '  📄 Actieplan',
      '  📁 Resources',
    ]
    await leadStore.addActivity(
      payload.leadId,
      'note',
      `📁 Google Drive mapstructuur\n\n${structure.join('\n')}\n\n(Maak deze mappen aan in Google Drive)`
    )
    return `✓ Mapstructuur gedocumenteerd: ${structure[0]}`
  })
  if (!v6.success) allSuccess = false

  // ── Step 7: Log first session prep to CRM ────────────────────────────────
  const s7 = makeStep('Eerste sessie voorbereiding gelogd')
  const v7 = await runStep(runId, s7, async () => {
    const prep = aiContent?.firstSessionPrep ?? ['Intake invullen', 'Doelen formuleren', 'Agenda voorbereiden']
    await leadStore.addActivity(
      payload.leadId,
      'note',
      `🎯 Eerste sessie — voorbereiding voor client\n\n${prep.map((p, i) => `${i + 1}. ${p}`).join('\n')}`
    )
    return `✓ ${prep.length} voorbereidingspunten gelogd`
  })
  if (!v7.success) allSuccess = false

  // ── Step 8: Final CRM status update ──────────────────────────────────────
  const s8 = makeStep('Onboarding voltooid — CRM bijgewerkt', false)
  await runStep(runId, s8, async () => {
    const stepResults = [v1, v2, v3, v4, v5, v6, v7]
    const succeeded = stepResults.filter(r => r.success).length
    const failed = stepResults.filter(r => !r.success).length

    const summary = `🚀 Onboarding ${payload.leadName} — ${succeeded}/${stepResults.length} stappen geslaagd${failed > 0 ? ` (${failed} mislukt)` : ''}`
    await leadStore.addActivity(payload.leadId, 'note', summary)
    return summary
  })

  // ── Finalize run ──────────────────────────────────────────────────────────
  automationStore.updateRun(runId, {
    status: allSuccess ? 'completed' : 'failed',
    completedAt: new Date().toISOString(),
  })
}
