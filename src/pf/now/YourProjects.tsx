// Your projects: what she is building, one line each, and the next step. No sections, no periods, no colours.
// A project is a name, what done looks like, a date if it has one, and a handful of steps. That is all.
import { useState } from 'react'
import { useProjectDataStore, useProjectStore, getPeriodKey } from '../../store/projectStore'
import type { Project, ChecklistItem } from '../../store/projectStore'
import { fmtDay, todayStr } from '../../lib/pf/week'
import { DepthBar } from '../DepthBar'
import { CircleCheck } from '../Aperture'
import { Sheet } from '../Sheet'
import { HoldToRemove } from '../Goals'
import { useDraft } from './contextStore'

const SEED_IDS = new Set(['laurence-uvin', 'bora'])

function steps(p: Project): ChecklistItem[] { return p.checklists.flatMap(c => c.items) }
function periodOf(it: ChecklistItem) { return getPeriodKey(it.recurrence, new Date()) }

export function YourProjects() {
  const projects = useProjectDataStore(s => s.projects)
  const completions = useProjectStore(s => s.completions)
  const [open, setOpen] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const today = todayStr()

  const mine = projects.filter(p => !SEED_IDS.has(p.id))
  const live = mine.filter(p => !p.done)
  const done = mine.filter(p => p.done)
  const isDone = (it: ChecklistItem) => !!completions[`${it.id}::${periodOf(it)}`]
  const nextOf = (p: Project) => steps(p).find(it => !isDone(it))
  const soonest = [...live].filter(p => p.due).sort((a, b) => a.due!.localeCompare(b.due!))[0]

  const headline = live.length === 0 ? 'Nothing in motion.' : live.length === 1 ? `${live[0].name}.` : `${live.length} projects in motion.`
  const first = live[0] ? nextOf(live[0]) : undefined
  const lead = live.length === 0 ? 'One thing you are building. Name it, and give it a first step.'
    : soonest && soonest.due! < today ? `${soonest.name} was due ${fmtDay(soonest.due!, 'd MMMM')}. Move the date or finish it.`
    : first ? `Next: ${first.title}${live.length > 1 ? `, for ${live[0].name}` : ''}.`
    : soonest ? `${soonest.name} is due ${fmtDay(soonest.due!, 'd MMMM')}.` : 'Every project has its steps. Tap one to add the next.'

  const current = projects.find(p => p.id === open) ?? null

  return (
    <div className="pf-enter pf-stack-lg" style={{ gap: 44 }}>
      <header className="pf-stack" style={{ gap: 14 }}>
        <p className="pf-over">Your projects</p>
        <h1 className="pf-h1">{headline}</h1>
        <p className="pf-body">{lead}</p>
        <div style={{ marginTop: 10 }}>
          <button type="button" className="pf-btn pf-btn--primary" onClick={() => setCreating(true)}>New project</button>
        </div>
      </header>

      {live.length > 0 && (
        <section aria-label="In motion">
          <span className="pf-cap pf-label">In motion</span>
          <div className="pf-rows">
            {live.map(p => {
              const all = steps(p), d = all.filter(isDone).length, next = nextOf(p)
              return (
                <button key={p.id} type="button" className="pf-row pf-row--press" onClick={() => setOpen(p.id)} aria-label={`Open ${p.name}`}
                  style={{ width: '100%', background: 'none', border: 0, borderBottom: '1px dotted var(--border)', font: 'inherit', color: 'inherit', textAlign: 'left', cursor: 'pointer', gridTemplateColumns: 'minmax(0,1fr) auto', padding: '16px 0', alignItems: 'start' }}>
                  <span style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 0 }}>
                    <span className="pf-h4">{p.name}</span>
                    {p.outcome && <span className="pf-small">{p.outcome}</span>}
                    <span className="pf-cap" style={{ display: 'flex', gap: 8, alignItems: 'baseline', minWidth: 0 }}>
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{next ? `next: ${next.title}` : all.length ? 'all steps done' : 'no steps yet'}</span>
                      {p.due && <span className="pf-mono" style={{ flexShrink: 0, color: p.due < today ? 'var(--text)' : 'var(--text-3)' }}>{fmtDay(p.due, 'd MMM')}</span>}
                    </span>
                    <span style={{ width: 120, marginTop: 2 }}><DepthBar pct={all.length ? (d / all.length) * 100 : 0} height={4} /></span>
                  </span>
                  <span className="pf-num pf-num--sm" style={{ opacity: all.length ? 1 : .4 }}>{d}<span className="pf-unit">/{all.length}</span></span>
                </button>
              )
            })}
          </div>
        </section>
      )}

      {done.length > 0 && (
        <section aria-label="Done">
          <span className="pf-cap pf-label">Done</span>
          <div className="pf-rows">
            {done.map(p => (
              <button key={p.id} type="button" className="pf-row pf-row--press pf-faded" onClick={() => setOpen(p.id)} aria-label={`Open ${p.name}`}
                style={{ width: '100%', background: 'none', border: 0, borderBottom: '1px dotted var(--border)', font: 'inherit', color: 'inherit', textAlign: 'left', cursor: 'pointer', gridTemplateColumns: 'minmax(0,1fr)', padding: '14px 0' }}>
                <span style={{ fontSize: 16 }}>{p.name}.</span>
              </button>
            ))}
          </div>
        </section>
      )}

      <Sheet open={creating} onClose={() => setCreating(false)} title="A project.">
        <NewProject onDone={id => { setCreating(false); setOpen(id) }} />
      </Sheet>

      {current && (
        <Sheet open onClose={() => setOpen(null)} title={current.name}>
          <ProjectSheet key={current.id} project={current} onClose={() => setOpen(null)} />
        </Sheet>
      )}
    </div>
  )
}

function NewProject({ onDone }: { onDone: (id: string) => void }) {
  const addProject = useProjectDataStore(s => s.addProject)
  const addItem = useProjectDataStore(s => s.addItem)
  const [name, setName] = useDraft('project-name')
  const [outcome, setOutcome] = useDraft('project-outcome')
  const [due, setDue] = useState('')
  const [step, setStep] = useState('')
  const ok = name.trim().length > 0
  function save() {
    if (!ok) return
    const id = addProject({ name: name.trim(), color: '#98A886', emoji: '', checklists: [], sections: ['admin'], outcome: outcome.trim() || undefined, due: due || undefined })
    if (step.trim()) addItem(id, 'once', step.trim())
    setName(''); setOutcome('')
    onDone(id)
  }
  return (
    <form className="pf-fields" style={{ display: 'flex', flexDirection: 'column', gap: 18 }} onSubmit={e => { e.preventDefault(); save() }}>
      <div className="pf-fieldset">
        <label className="pf-cap pf-label" htmlFor="np-name">What you are building</label>
        <input id="np-name" className="pf-input" value={name} onChange={e => setName(e.target.value)} autoFocus />
      </div>
      <div className="pf-fieldset">
        <label className="pf-cap pf-label" htmlFor="np-out">What done looks like, one line</label>
        <input id="np-out" className="pf-input" value={outcome} onChange={e => setOutcome(e.target.value)} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) auto', gap: 10, alignItems: 'end' }}>
        <div className="pf-fieldset">
          <label className="pf-cap pf-label" htmlFor="np-step">The first step</label>
          <input id="np-step" className="pf-input" value={step} onChange={e => setStep(e.target.value)} />
        </div>
        <div className="pf-fieldset">
          <label className="pf-cap pf-label" htmlFor="np-due">Due, if it has one</label>
          <input id="np-due" className="pf-input pf-mono" type="date" value={due} onChange={e => setDue(e.target.value)} style={{ width: 'auto' }} />
        </div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 6 }}>
        <button type="submit" className="pf-btn pf-btn--primary" disabled={!ok}>Start it</button>
      </div>
    </form>
  )
}

// One project: the line, the date, the steps as check rows, one inline line to add the next, and the way out.
function ProjectSheet({ project, onClose }: { project: Project; onClose: () => void }) {
  const updateProject = useProjectDataStore(s => s.updateProject)
  const deleteProject = useProjectDataStore(s => s.deleteProject)
  const addItem = useProjectDataStore(s => s.addItem)
  const removeItem = useProjectDataStore(s => s.removeItem)
  const completions = useProjectStore(s => s.completions)
  const toggle = useProjectStore(s => s.toggle)
  const [name, setName] = useState(project.name)
  const [outcome, setOutcome] = useState(project.outcome ?? '')
  const [step, setStep] = useState('')
  const all = steps(project)
  const isDone = (it: ChecklistItem) => !!completions[`${it.id}::${periodOf(it)}`]
  const d = all.filter(isDone).length
  function addStep() { const t = step.trim(); if (!t) return; addItem(project.id, 'once', t); setStep('') }
  function commitName() { const t = name.trim(); if (t && t !== project.name) updateProject(project.id, { name: t }); else setName(project.name) }
  function commitOutcome() { const t = outcome.trim(); if (t !== (project.outcome ?? '')) updateProject(project.id, { outcome: t || undefined }) }

  return (
    <div className="pf-fields" style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
      <div>
        <span style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12 }}>
          <span className="pf-num pf-num--sm">{d}<span className="pf-unit">/{all.length} steps</span></span>
          {project.due && <span className="pf-cap pf-mono">due {fmtDay(project.due, 'd MMM')}</span>}
        </span>
        <DepthBar pct={all.length ? (d / all.length) * 100 : 0} landed={!!project.done} style={{ marginTop: 6 }} />
      </div>

      <div className="pf-fieldset">
        <label className="pf-cap pf-label" htmlFor="pj-name">Name</label>
        <input id="pj-name" className="pf-input" value={name} onChange={e => setName(e.target.value)} onBlur={commitName} onKeyDown={e => e.key === 'Enter' && commitName()} />
      </div>
      <div className="pf-fieldset">
        <label className="pf-cap pf-label" htmlFor="pj-out">What done looks like</label>
        <input id="pj-out" className="pf-input" value={outcome} onChange={e => setOutcome(e.target.value)} onBlur={commitOutcome} onKeyDown={e => e.key === 'Enter' && commitOutcome()} />
      </div>
      <div className="pf-fieldset">
        <label className="pf-cap pf-label" htmlFor="pj-due">Due</label>
        <input id="pj-due" className="pf-input pf-mono" type="date" value={project.due ?? ''} onChange={e => updateProject(project.id, { due: e.target.value || undefined })} style={{ width: 'auto' }} />
      </div>

      <section aria-label="Steps">
        <span className="pf-cap pf-label">Steps</span>
        <div className="pf-rows">
          {all.map(it => (
            <div key={it.id} className={`pf-row ${isDone(it) ? 'pf-faded' : ''}`} style={{ gridTemplateColumns: 'auto minmax(0,1fr) auto', padding: '12px 0' }}>
              <CircleCheck checked={isDone(it)} onChange={() => toggle(it.id, periodOf(it))} label={it.title} />
              <span style={{ fontSize: 16 }}>{it.title}</span>
              <button type="button" className="pf-btn pf-btn--tertiary" style={{ padding: '4px 0', minHeight: 32, fontSize: 13 }} onClick={() => removeItem(project.id, it.id)}>Remove</button>
            </div>
          ))}
          <div className="pf-row" style={{ gridTemplateColumns: 'minmax(0,1fr)' }}>
            <input className="pf-inline" value={step} onChange={e => setStep(e.target.value)} onKeyDown={e => e.key === 'Enter' && addStep()} onBlur={addStep} aria-label="Add a step" placeholder={all.length ? 'The next step' : 'The first step'} />
          </div>
        </div>
      </section>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 18, flexWrap: 'wrap', marginTop: 6 }}>
        <HoldToRemove onConfirm={() => { deleteProject(project.id); onClose() }} />
        <button type="button" className="pf-btn pf-btn--primary" onClick={() => { updateProject(project.id, { done: !project.done }); onClose() }}>{project.done ? 'Back in motion' : 'Done'}</button>
      </div>
    </div>
  )
}
