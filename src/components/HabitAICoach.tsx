import { useState } from 'react'
import { X, Sparkles, Plus, Check, RefreshCw, ChevronDown, ChevronUp, AlertCircle } from 'lucide-react'
import { usePlannerStore } from '../store/plannerStore'
import { useHabitStore } from '../store/habitStore'
import type { Habit } from '../types'

const CATEGORY_OPTIONS = [
  { value: 'physical',      label: 'Physical',      color: '#C4935A' },
  { value: 'mental',        label: 'Mental',         color: '#7AACCF' },
  { value: 'professional',  label: 'Professional',  color: '#6DB889' },
  { value: 'financial',     label: 'Financial',     color: '#D4A96A' },
  { value: 'relationships', label: 'Relationships', color: '#B08EB0' },
] as const

const FREQ_OPTIONS = [
  { value: 'daily',    label: 'Dagelijks' },
  { value: 'weekdays', label: 'Weekdays' },
  { value: '3x-week',  label: '3× per week' },
  { value: '2x-week',  label: '2× per week' },
  { value: 'weekly',   label: 'Weekly' },
] as const

interface SuggestedHabit {
  name: string
  category: 'physical' | 'mental' | 'professional' | 'financial' | 'relationships'
  frequency: string
  why: string
  goalLink: string
  icon: string
}

const LAURENCE_CONTEXT = `Je bent een persoonlijke habit-coach voor Laurence Uvin, een Belgische vrouwelijke ondernemer (midden 20s) die twee bedrijven runt:
1. CEO Lifestyle — een premium business coaching brand voor ambitieuze ondernemers (1:1 coaching, CEO Club, CMO retainer)
2. Bora — een sportschool/wellness centrum met kinderopvang en community

Persoonlijkheidsprofiel:
- ADHD-tendensen: houdt van duidelijkheid, snelle resultaten, vermijdt overprikkeling
- Atletisch: actief bezig met krachttraining en gezonde levensstijl
- Gedreven door impact, autoriteit en vrijheid — geen 9-5 mentaliteit
- Sterk visueel ingesteld, houdt van esthetiek en design
- Waarden: consistentie > perfectie, momentum > perfecte planning, zichtbaarheid = omzet
- Zwaktes om rekening mee te houden: kan vervelen bij routinetaken, neigt naar overwerken

Jouw taak: geef de meest impactvolle habits die direct aansluiten bij haar doelen. Elke habit moet:
- Realistisch zijn voor iemand die twee bedrijven runt
- Passen bij haar energie en persoonlijkheid
- Een directe link hebben met een specifiek doel
- Klein genoeg zijn om elke dag vol te houden`

async function generateHabits(goals: string[], existingHabits: string[]): Promise<SuggestedHabit[]> {
  const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY
  if (!apiKey) throw new Error('NO_KEY')

  const goalsText = goals.length > 0
    ? goals.map(g => `- ${g}`).join('\n')
    : '(geen doelen gevonden — gebruik standaard CEO profiel)'

  const existingText = existingHabits.length > 0
    ? `Bestaande habits (niet opnieuw voorstellen): ${existingHabits.join(', ')}`
    : ''

  const prompt = `${LAURENCE_CONTEXT}

Haar actieve doelen:
${goalsText}

${existingText}

Geef exact 6 habits in dit JSON formaat (geen markdown, enkel pure JSON array):
[
  {
    "name": "Korte, actieve naam (max 5 woorden)",
    "category": "physical|mental|professional|financial|relationships",
    "frequency": "daily|weekdays|3x-week|2x-week|weekly",
    "why": "1 krachtige zin waarom dit specifiek voor Laurence werkt (max 20 woorden)",
    "goalLink": "Welk concreet doel dit dient (max 10 woorden)",
    "icon": "één emoji die perfect past"
  }
]

Prioriteer habits die de GROOTSTE hefboom hebben op haar doelen. Denk als een elite performance coach.`

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
      'anthropic-dangerous-allow-browser': 'true',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    }),
  })

  if (!response.ok) throw new Error(`API error: ${response.status}`)
  const data = await response.json()
  const text = data.content?.[0]?.text ?? ''

  // Extract JSON from response
  const match = text.match(/\[[\s\S]*\]/)
  if (!match) throw new Error('Could not parse response')
  return JSON.parse(match[0]) as SuggestedHabit[]
}

interface HabitAICoachProps {
  onClose: () => void
}

export function HabitAICoach({ onClose }: HabitAICoachProps) {
  const { goals } = usePlannerStore()
  const { habits, addHabit } = useHabitStore()
  const [suggestions, setSuggestions] = useState<SuggestedHabit[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [added, setAdded] = useState<Set<number>>(new Set())
  const [editing, setEditing] = useState<number | null>(null)
  const [editDrafts, setEditDrafts] = useState<Record<number, Partial<SuggestedHabit>>>({})
  const [generated, setGenerated] = useState(false)

  const activeGoals = goals
    .filter(g => g.status === 'active')
    .map(g => `${g.title} — ${g.whyItMatters}`)

  const existingNames = habits.filter(h => h.active).map(h => h.name)

  const generate = async () => {
    setLoading(true)
    setError(null)
    setSuggestions([])
    setAdded(new Set())
    setEditing(null)
    setEditDrafts({})
    try {
      const result = await generateHabits(activeGoals, existingNames)
      setSuggestions(result)
      setGenerated(true)
    } catch (e: unknown) {
      if (e instanceof Error && e.message === 'NO_KEY') {
        setError('NO_KEY')
      } else {
        setError('Er is iets misgelopen. Probeer opnieuw.')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleAdd = async (i: number) => {
    const s = { ...suggestions[i], ...(editDrafts[i] ?? {}) }
    const habit: Omit<Habit, 'id'> = {
      name: s.name,
      category: s.category as Habit['category'],
      icon: s.icon,
      targetFrequency: s.frequency as Habit['targetFrequency'],
      customDays: [],
      color: CATEGORY_OPTIONS.find(c => c.value === s.category)?.color ?? '#A8BDD0',
      order: habits.length + 1,
      active: true,
    }
    await addHabit(habit)
    setAdded(prev => new Set([...prev, i]))
    setEditing(null)
  }

  const getDraft = (i: number, field: keyof SuggestedHabit) =>
    (editDrafts[i]?.[field] ?? suggestions[i][field]) as string

  const setDraft = (i: number, field: keyof SuggestedHabit, value: string) =>
    setEditDrafts(prev => ({ ...prev, [i]: { ...prev[i], [field]: value } }))

  const catColor = (cat: string) => CATEGORY_OPTIONS.find(c => c.value === cat)?.color ?? '#A8BDD0'

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 200, display: 'flex', justifyContent: 'flex-end' }} onClick={onClose}>
      <div style={{ width: 520, height: '100%', background: 'var(--color-bg)', borderLeft: '1px solid var(--color-border)', display: 'flex', flexDirection: 'column', overflowY: 'auto', boxShadow: '-20px 0 80px rgba(0,0,0,0.2)' }} onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div style={{ padding: '32px 36px 24px', borderBottom: '1px solid var(--color-border)', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                <div style={{ width: 32, height: 32, borderRadius: 16, background: 'linear-gradient(135deg, rgba(168,189,208,0.2), rgba(212,169,106,0.15))', border: '1px solid rgba(168,189,208,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Sparkles size={14} color="var(--color-accent)" />
                </div>
                <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--color-ink)' }}>Habit Coach</h2>
              </div>
              <p style={{ fontSize: 13, color: 'var(--color-muted)', lineHeight: 1.5 }}>
                Gebaseerd op jouw {activeGoals.length} actieve doelen en wie jij bent als persoon.
              </p>
            </div>
            <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 16, border: '1px solid var(--color-border)', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-muted)', flexShrink: 0 }}>
              <X size={14} />
            </button>
          </div>

          {/* Goals preview */}
          {activeGoals.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginTop: 12 }}>
              {goals.filter(g => g.status === 'active').slice(0, 5).map(g => (
                <span key={g.id} style={{ fontSize: 10, padding: '3px 9px', borderRadius: 20, background: 'var(--color-surface)', border: '1px solid var(--color-border)', color: 'var(--color-muted)', whiteSpace: 'nowrap' }}>
                  {g.icon} {g.title}
                </span>
              ))}
              {activeGoals.length > 5 && (
                <span style={{ fontSize: 10, padding: '3px 9px', borderRadius: 20, background: 'var(--color-surface)', border: '1px solid var(--color-border)', color: 'var(--color-subtle)' }}>
                  +{activeGoals.length - 5} meer
                </span>
              )}
            </div>
          )}
        </div>

        {/* Content */}
        <div style={{ flex: 1, padding: '24px 36px', overflowY: 'auto' }}>

          {/* Error: no API key */}
          {error === 'NO_KEY' && (
            <div style={{ padding: 20, borderRadius: 14, background: 'rgba(212,169,106,0.08)', border: '1px solid rgba(212,169,106,0.25)', marginBottom: 20 }}>
              <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <AlertCircle size={16} color="#D4A96A" style={{ flexShrink: 0, marginTop: 1 }} />
                <div>
                  <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-ink)', marginBottom: 4 }}>Anthropic API key nodig</p>
                  <p style={{ fontSize: 12, color: 'var(--color-muted)', lineHeight: 1.6 }}>
                    Voeg <code style={{ background: 'var(--color-surface)', padding: '1px 5px', borderRadius: 4, fontSize: 11 }}>VITE_ANTHROPIC_API_KEY=sk-ant-…</code> toe aan je <code style={{ background: 'var(--color-surface)', padding: '1px 5px', borderRadius: 4, fontSize: 11 }}>.env</code> bestand en herstart de app.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Generic error */}
          {error && error !== 'NO_KEY' && (
            <div style={{ padding: 16, borderRadius: 12, background: 'rgba(190,100,100,0.08)', border: '1px solid rgba(190,100,100,0.2)', marginBottom: 20 }}>
              <p style={{ fontSize: 13, color: 'var(--color-ink)' }}>{error}</p>
            </div>
          )}

          {/* Generate CTA */}
          {!generated && !loading && (
            <div style={{ textAlign: 'center', paddingTop: 40 }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>🎯</div>
              <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--color-ink)', marginBottom: 8 }}>
                Klaar om jouw ideale habits te vinden?
              </p>
              <p style={{ fontSize: 13, color: 'var(--color-muted)', marginBottom: 28, lineHeight: 1.6, maxWidth: 340, margin: '0 auto 28px' }}>
                Claude analyseert jouw doelen en persoonlijkheid en stelt de meest impactvolle habits voor.
              </p>
              <button onClick={generate} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '13px 28px', borderRadius: 12, border: 'none', background: 'var(--color-accent)', color: 'var(--color-bg)', fontSize: 14, fontWeight: 700, cursor: 'pointer', letterSpacing: '0.01em' }}>
                <Sparkles size={15} />Genereer mijn habits
              </button>
            </div>
          )}

          {/* Loading */}
          {loading && (
            <div style={{ textAlign: 'center', paddingTop: 60 }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, color: 'var(--color-muted)', fontSize: 13 }}>
                <RefreshCw size={16} style={{ animation: 'spin 1s linear infinite' }} />
                Claude analyseert jouw doelen…
              </div>
              <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
            </div>
          )}

          {/* Suggestions */}
          {suggestions.length > 0 && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--color-subtle)' }}>
                  {suggestions.length} habits aanbevolen
                </p>
                <button onClick={generate} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 16, border: '1px solid var(--color-border)', background: 'transparent', color: 'var(--color-muted)', fontSize: 11, cursor: 'pointer' }}>
                  <RefreshCw size={10} /> Opnieuw
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {suggestions.map((s, i) => {
                  const isAdded   = added.has(i)
                  const isEditing = editing === i
                  const cat       = getDraft(i, 'category')
                  const color     = catColor(cat)

                  return (
                    <div key={i} style={{ borderRadius: 14, border: `1px solid ${isAdded ? 'rgba(34,197,94,0.3)' : 'var(--color-border)'}`, background: isAdded ? 'rgba(34,197,94,0.04)' : 'var(--color-surface)', overflow: 'hidden', transition: 'all 200ms' }}>
                      {/* Color bar */}
                      <div style={{ height: 3, background: `linear-gradient(90deg, ${color}, ${color}60)` }} />

                      <div style={{ padding: '14px 16px' }}>
                        {/* Top row */}
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
                              <span style={{ fontSize: 18 }}>{getDraft(i, 'icon')}</span>
                              {isEditing ? (
                                <input value={getDraft(i, 'name')} onChange={e => setDraft(i, 'name', e.target.value)}
                                  style={{ flex: 1, fontSize: 14, fontWeight: 600, color: 'var(--color-ink)', background: 'transparent', border: 'none', borderBottom: '1px solid var(--color-accent)', outline: 'none', padding: '2px 0' }} />
                              ) : (
                                <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-ink)' }}>{getDraft(i, 'name')}</span>
                              )}
                            </div>
                            <p style={{ fontSize: 12, color: 'var(--color-muted)', lineHeight: 1.5, marginBottom: 6 }}>{s.why}</p>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 6, background: `${color}15`, color, fontWeight: 600 }}>
                                {CATEGORY_OPTIONS.find(c => c.value === cat)?.label}
                              </span>
                              <span style={{ fontSize: 10, color: 'var(--color-subtle)' }}>·</span>
                              {isEditing ? (
                                <select value={getDraft(i, 'frequency')} onChange={e => setDraft(i, 'frequency', e.target.value)}
                                  style={{ fontSize: 10, color: 'var(--color-muted)', background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 5, padding: '1px 4px', outline: 'none' }}>
                                  {FREQ_OPTIONS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
                                </select>
                              ) : (
                                <span style={{ fontSize: 10, color: 'var(--color-muted)' }}>
                                  {FREQ_OPTIONS.find(f => f.value === getDraft(i, 'frequency'))?.label ?? getDraft(i, 'frequency')}
                                </span>
                              )}
                            </div>
                            {isEditing && (
                              <div style={{ marginTop: 8 }}>
                                <p style={{ fontSize: 10, color: 'var(--color-subtle)', marginBottom: 4 }}>Categorie</p>
                                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                                  {CATEGORY_OPTIONS.map(c => (
                                    <button key={c.value} onClick={() => setDraft(i, 'category', c.value)}
                                      style={{ padding: '2px 8px', borderRadius: 6, border: `1px solid ${cat === c.value ? c.color : 'var(--color-border)'}`, background: cat === c.value ? `${c.color}15` : 'transparent', color: cat === c.value ? c.color : 'var(--color-muted)', fontSize: 10, cursor: 'pointer', fontWeight: cat === c.value ? 700 : 400 }}>
                                      {c.label}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            )}
                            <p style={{ fontSize: 10, color: 'var(--color-subtle)', marginTop: 6 }}>
                              → {s.goalLink}
                            </p>
                          </div>

                          {/* Actions */}
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flexShrink: 0 }}>
                            {isAdded ? (
                              <div style={{ width: 32, height: 32, borderRadius: 16, background: 'rgba(34,197,94,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Check size={14} color="#7A9E8A" />
                              </div>
                            ) : (
                              <>
                                <button onClick={() => handleAdd(i)}
                                  style={{ width: 32, height: 32, borderRadius: 16, border: 'none', background: 'var(--color-accent)', color: 'var(--color-bg)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                  <Plus size={14} />
                                </button>
                                <button onClick={() => setEditing(isEditing ? null : i)}
                                  style={{ width: 32, height: 32, borderRadius: 16, border: '1px solid var(--color-border)', background: 'transparent', color: 'var(--color-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                  {isEditing ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Add all */}
              {added.size < suggestions.length && (
                <button onClick={() => suggestions.forEach((_, i) => { if (!added.has(i)) handleAdd(i) })}
                  style={{ width: '100%', marginTop: 16, padding: '12px 0', borderRadius: 12, border: '1px dashed var(--color-border)', background: 'transparent', color: 'var(--color-muted)', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                  Alle habits toevoegen ({suggestions.length - added.size} resterend)
                </button>
              )}

              {added.size === suggestions.length && suggestions.length > 0 && (
                <div style={{ textAlign: 'center', padding: '20px 0', color: '#7A9E8A', fontSize: 13, fontWeight: 600 }}>
                  ✓ Alle habits toegevoegd aan jouw tracker
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
