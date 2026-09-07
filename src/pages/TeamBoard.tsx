import { useState } from 'react'
import { Check, Plus, Trash2, Download, X } from 'lucide-react'
import { useTeamStore } from '../store/teamStore'
import type { TeamTask, TeamPriority } from '../store/teamStore'
import { format } from 'date-fns'
import { nlBE } from 'date-fns/locale'

const PRIORITY = {
  urgent: { label: 'NU DOEN',    color: '#4C6481', bg: 'rgba(76,100,129,0.10)', rank: 0 },
  week:   { label: 'DEZE WEEK',  color: '#7C7F84', bg: 'rgba(124,127,132,0.08)', rank: 1 },
  later:  { label: 'LATER',      color: '#B9BBBE', bg: 'rgba(185,187,190,0.08)', rank: 2 },
}

function deadlineInfo(d: string | undefined, todayStr: string) {
  if (!d) return null
  const isToday   = d === todayStr
  const isOverdue = d < todayStr
  const label     = isToday ? 'Vandaag' : format(new Date(d + 'T00:00:00'), 'd MMM', { locale: nlBE })
  return { label, urgent: isToday || isOverdue }
}

// ── PDF generator ────────────────────────────────────────────────
function generatePrintHTML(tasks: TeamTask[], todayStr: string): string {
  const groups: TeamPriority[] = ['urgent', 'week', 'later']
  const dateLabel = format(new Date(todayStr + 'T00:00:00'), 'EEEE d MMMM yyyy', { locale: nlBE })

  const taskRows = (p: TeamPriority) =>
    tasks.filter(t => t.priority === p && !t.done).map(t => {
      const dl = deadlineInfo(t.deadline, todayStr)
      return `
        <div class="task-row">
          <div class="task-checkbox"></div>
          <div class="task-body">
            <span class="task-title">${t.title}</span>
            ${t.notes ? `<span class="task-notes">${t.notes}</span>` : ''}
          </div>
          ${dl ? `<span class="task-deadline${dl.urgent ? ' urgent' : ''}">${dl.label}</span>` : ''}
        </div>`
    }).join('')

  const sections = groups.map(p => {
    const rows = taskRows(p)
    if (!rows) return ''
    return `
      <div class="section">
        <div class="section-label">${PRIORITY[p].label}</div>
        ${rows}
      </div>`
  }).join('')

  const doneTasks = tasks.filter(t => t.done)
  const doneSection = doneTasks.length ? `
    <div class="section done-section">
      <div class="section-label" style="color:#ccc">AFGEROND</div>
      ${doneTasks.map(t => `
        <div class="task-row done-row">
          <div class="task-checkbox checked">✓</div>
          <span class="task-title done-title">${t.title}</span>
        </div>`).join('')}
    </div>` : ''

  return `<!DOCTYPE html>
<html lang="nl">
<head>
  <meta charset="UTF-8">
  <title>Teamoverzicht — ${dateLabel}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Archivo:wght@400;600;700;800&family=Space+Mono&display=swap');
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Archivo', sans-serif;
      background: #fff;
      color: #121316;
      padding: 48px 56px;
      max-width: 780px;
      margin: 0 auto;
      font-size: 13px;
    }
    .header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      margin-bottom: 40px;
      padding-bottom: 24px;
      border-bottom: 1.5px solid #121316;
    }
    .brand {
      font-family: 'Archivo', sans-serif;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.18em;
      color: #7C7F84;
      text-transform: uppercase;
    }
    .doc-title {
      font-size: 22px;
      font-weight: 800;
      letter-spacing: -0.02em;
      line-height: 1;
      color: #121316;
    }
    .doc-date {
      font-family: 'Space Mono', monospace;
      font-size: 10px;
      color: #7C7F84;
      margin-top: 5px;
      text-transform: capitalize;
    }
    .section {
      margin-bottom: 32px;
    }
    .section-label {
      font-family: 'Space Mono', monospace;
      font-size: 9px;
      letter-spacing: 0.20em;
      color: #3C3E42;
      text-transform: uppercase;
      margin-bottom: 10px;
      padding-bottom: 6px;
      border-bottom: 1px solid #E4E5E6;
    }
    .task-row {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      padding: 9px 0;
      border-bottom: 1px solid #F4F4F2;
    }
    .task-checkbox {
      width: 16px;
      height: 16px;
      border: 1.5px solid #3C3E42;
      border-radius: 3px;
      flex-shrink: 0;
      margin-top: 1px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 10px;
      font-weight: 700;
    }
    .task-checkbox.checked {
      background: #4C6481;
      border-color: #4C6481;
      color: #fff;
    }
    .task-body {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    .task-title {
      font-size: 13px;
      font-weight: 600;
      color: #121316;
      line-height: 1.3;
    }
    .task-notes {
      font-size: 11px;
      color: #7C7F84;
    }
    .task-deadline {
      font-family: 'Space Mono', monospace;
      font-size: 10px;
      color: #7C7F84;
      flex-shrink: 0;
      margin-top: 2px;
    }
    .task-deadline.urgent {
      color: #4C6481;
      font-weight: 700;
    }
    .done-section { opacity: 0.5; }
    .done-title { text-decoration: line-through; color: #7C7F84; }
    .done-row { opacity: 0.6; }
    .footer {
      margin-top: 48px;
      padding-top: 16px;
      border-top: 1px solid #E4E5E6;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .footer-brand {
      font-family: 'Space Mono', monospace;
      font-size: 9px;
      color: #B9BBBE;
      letter-spacing: 0.12em;
      text-transform: uppercase;
    }
    .summary {
      font-family: 'Space Mono', monospace;
      font-size: 9px;
      color: #B9BBBE;
    }
    @media print {
      body { padding: 32px 40px; }
    }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="brand">Laurence Uvin Commv</div>
      <div class="doc-title">Teamoverzicht</div>
      <div class="doc-date">${dateLabel}</div>
    </div>
    <div class="brand" style="text-align:right;margin-top:4px">E&amp;L</div>
  </div>

  ${sections || '<p style="color:#B9BBBE;font-size:13px;padding:20px 0">Geen open taken.</p>'}
  ${doneSection}

  <div class="footer">
    <span class="footer-brand">laurence-os · E&amp;L</span>
    <span class="summary">${tasks.filter(t => !t.done).length} open · ${tasks.filter(t => t.done).length} klaar</span>
  </div>
</body>
</html>`
}

// ── TaskRow ──────────────────────────────────────────────────────
function TaskRow({ task, todayStr }: { task: TeamTask; todayStr: string }) {
  const { toggleTask, deleteTask, updateTask } = useTeamStore()
  const [editing, setEditing] = useState(false)
  const [editTitle, setEditTitle] = useState(task.title)
  const [editDeadline, setEditDeadline] = useState(task.deadline ?? '')
  const [editNotes, setEditNotes] = useState(task.notes ?? '')
  const dl = deadlineInfo(task.deadline, todayStr)

  function saveEdit() {
    updateTask(task.id, { title: editTitle.trim() || task.title, deadline: editDeadline || undefined, notes: editNotes.trim() || undefined })
    setEditing(false)
  }

  if (editing) {
    return (
      <div style={{ padding: '12px 20px', borderBottom: '1px solid var(--color-border)', background: 'rgba(76,100,129,0.04)', display: 'flex', flexDirection: 'column', gap: 8 }}>
        <input
          value={editTitle}
          onChange={e => setEditTitle(e.target.value)}
          autoFocus
          onKeyDown={e => { if (e.key === 'Enter') saveEdit(); if (e.key === 'Escape') setEditing(false) }}
          style={{ padding: '7px 10px', borderRadius: 7, border: '1px solid #4C6481', background: 'var(--color-surface)', color: 'var(--color-ink)', fontSize: 13, fontFamily: 'inherit', outline: 'none' }}
        />
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            type="date"
            value={editDeadline}
            onChange={e => setEditDeadline(e.target.value)}
            style={{ padding: '6px 8px', borderRadius: 7, border: '1px solid var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-ink)', fontSize: 12, fontFamily: 'inherit', outline: 'none' }}
          />
          <input
            value={editNotes}
            onChange={e => setEditNotes(e.target.value)}
            placeholder="Notitie..."
            style={{ flex: 1, padding: '6px 10px', borderRadius: 7, border: '1px solid var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-ink)', fontSize: 12, fontFamily: 'inherit', outline: 'none' }}
          />
          <button onClick={saveEdit} style={{ padding: '6px 12px', borderRadius: 7, border: 'none', background: '#4C6481', color: '#fff', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>OK</button>
          <button onClick={() => setEditing(false)} style={{ width: 30, borderRadius: 7, border: '1px solid var(--color-border)', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-muted)' }}><X size={12} /></button>
        </div>
      </div>
    )
  }

  return (
    <div
      style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '13px 20px', borderBottom: '1px solid var(--color-border)', opacity: task.done ? 0.45 : 1, transition: 'opacity 150ms', cursor: 'default' }}
      onDoubleClick={() => !task.done && setEditing(true)}
    >
      <button
        onClick={() => toggleTask(task.id)}
        style={{ width: 20, height: 20, borderRadius: 5, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: task.done ? '#4C6481' : 'transparent', border: `1.5px solid ${task.done ? '#4C6481' : 'var(--color-border)'}`, cursor: 'pointer', transition: 'all 150ms' }}
      >
        {task.done && <Check size={11} color="#fff" strokeWidth={3} />}
      </button>
      <div style={{ flex: 1 }}>
        <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-ink)', textDecoration: task.done ? 'line-through' : 'none', transition: 'all 150ms' }}>{task.title}</p>
        {task.notes && <p style={{ fontSize: 11, color: 'var(--color-subtle)', marginTop: 2 }}>{task.notes}</p>}
      </div>
      {dl && (
        <span style={{ fontSize: 10, fontWeight: dl.urgent ? 700 : 400, color: dl.urgent ? '#4C6481' : 'var(--color-muted)', flexShrink: 0, fontFamily: 'var(--font-mono)', letterSpacing: '0.04em' }}>
          {dl.label}
        </span>
      )}
      <button
        onClick={() => deleteTask(task.id)}
        style={{ width: 26, height: 26, borderRadius: 7, border: '1px solid var(--color-border)', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-subtle)', flexShrink: 0 }}
      >
        <Trash2 size={11} />
      </button>
    </div>
  )
}

// ── Main ─────────────────────────────────────────────────────────
export function TeamBoard() {
  const { tasks, addTask, clearDone } = useTeamStore()
  const [title, setTitle] = useState('')
  const [deadline, setDeadline] = useState('')
  const [priority, setPriority] = useState<TeamPriority>('week')
  const [notes, setNotes] = useState('')
  const [showNotes, setShowNotes] = useState(false)

  const todayStr = format(new Date(), 'yyyy-MM-dd')

  const grouped = {
    urgent: tasks.filter(t => t.priority === 'urgent'),
    week:   tasks.filter(t => t.priority === 'week'),
    later:  tasks.filter(t => t.priority === 'later'),
  }

  function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) return
    addTask({ title: title.trim(), deadline: deadline || undefined, priority, notes: notes.trim() || undefined })
    setTitle('')
    setDeadline('')
    setNotes('')
    setShowNotes(false)
  }

  function handleExport() {
    const html = generatePrintHTML(tasks, todayStr)
    const win = window.open('', '_blank')
    if (!win) return
    win.document.write(html)
    win.document.close()
    setTimeout(() => win.print(), 800)
  }

  const openCount = tasks.filter(t => !t.done).length
  const doneCount = tasks.filter(t => t.done).length

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* Stats + actions bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', gap: 16 }}>
          <span style={{ fontSize: 11, color: 'var(--color-muted)', fontFamily: 'var(--font-mono)' }}>
            {openCount} open
          </span>
          {doneCount > 0 && (
            <span style={{ fontSize: 11, color: 'var(--color-subtle)', fontFamily: 'var(--font-mono)' }}>
              {doneCount} klaar
            </span>
          )}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {doneCount > 0 && (
            <button onClick={clearDone} style={{ fontSize: 11, color: 'var(--color-subtle)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', padding: '6px 10px' }}>
              Verwijder afgevinkt
            </button>
          )}
          <button
            onClick={handleExport}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 9, border: '1px solid var(--color-border)', background: 'transparent', color: 'var(--color-muted)', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 150ms' }}
          >
            <Download size={13} /> PDF
          </button>
        </div>
      </div>

      {/* Add form */}
      <div className="card" style={{ padding: '18px 20px' }}>
        <form onSubmit={handleAdd}>
          <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Taak toevoegen..."
              autoComplete="off"
              style={{ flex: 1, padding: '9px 12px', borderRadius: 9, border: '1px solid var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-ink)', fontSize: 13, fontFamily: 'inherit', outline: 'none' }}
            />
            <input
              type="date"
              value={deadline}
              onChange={e => setDeadline(e.target.value)}
              style={{ padding: '9px 10px', borderRadius: 9, border: '1px solid var(--color-border)', background: 'var(--color-surface)', color: deadline ? 'var(--color-ink)' : 'var(--color-subtle)', fontSize: 12, fontFamily: 'inherit', outline: 'none', width: 140 }}
            />
          </div>

          {showNotes && (
            <input
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Extra notitie (optioneel)..."
              style={{ width: '100%', padding: '8px 12px', borderRadius: 9, border: '1px solid var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-ink)', fontSize: 12, fontFamily: 'inherit', outline: 'none', marginBottom: 10, boxSizing: 'border-box' }}
            />
          )}

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              {(['urgent', 'week', 'later'] as TeamPriority[]).map(p => {
                const cfg = PRIORITY[p]
                const active = priority === p
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPriority(p)}
                    style={{
                      padding: '5px 12px', borderRadius: 99, fontSize: 10, fontWeight: 700,
                      cursor: 'pointer', fontFamily: 'var(--font-mono)', letterSpacing: '0.06em',
                      border: `1.5px solid ${active ? cfg.color : 'var(--color-border)'}`,
                      background: active ? cfg.bg : 'transparent',
                      color: active ? cfg.color : 'var(--color-subtle)',
                      transition: 'all 150ms',
                    }}
                  >
                    {cfg.label}
                  </button>
                )
              })}
              <button
                type="button"
                onClick={() => setShowNotes(n => !n)}
                style={{ padding: '5px 10px', borderRadius: 99, fontSize: 10, cursor: 'pointer', fontFamily: 'inherit', border: '1px solid var(--color-border)', background: 'transparent', color: 'var(--color-subtle)' }}
              >
                {showNotes ? '− notitie' : '+ notitie'}
              </button>
            </div>
            <button
              type="submit"
              disabled={!title.trim()}
              style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 16px', borderRadius: 9, border: 'none', background: title.trim() ? '#4C6481' : 'var(--color-border)', color: title.trim() ? '#fff' : 'var(--color-muted)', fontSize: 12, fontWeight: 700, cursor: title.trim() ? 'pointer' : 'default', fontFamily: 'inherit', transition: 'all 150ms' }}
            >
              <Plus size={13} /> Toevoegen
            </button>
          </div>
        </form>
      </div>

      {/* Task groups */}
      {(['urgent', 'week', 'later'] as TeamPriority[]).map(p => {
        const cfg = PRIORITY[p]
        const pTasks = grouped[p]
        if (pTasks.length === 0) return null
        const openInGroup = pTasks.filter(t => !t.done).length
        const allDone = openInGroup === 0

        return (
          <div key={p} className="card" style={{ overflow: 'hidden' }}>
            {/* Group header */}
            <div style={{ padding: '13px 20px 11px', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: allDone ? 'var(--color-border)' : cfg.color, transition: 'background 300ms' }} />
              <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', fontFamily: 'var(--font-mono)', color: allDone ? 'var(--color-subtle)' : cfg.color, transition: 'color 300ms' }}>
                {cfg.label}
              </span>
              {openInGroup > 0 && (
                <span style={{ fontSize: 10, color: 'var(--color-subtle)', marginLeft: 2 }}>
                  {openInGroup} open
                </span>
              )}
              {allDone && (
                <span style={{ fontSize: 10, fontWeight: 700, color: '#4C6481', background: 'rgba(76,100,129,0.10)', padding: '2px 8px', borderRadius: 99, marginLeft: 'auto' }}>
                  Klaar
                </span>
              )}
            </div>

            {/* Tasks */}
            {pTasks.map(t => (
              <TaskRow key={t.id} task={t} todayStr={todayStr} />
            ))}
          </div>
        )
      })}

      {/* Empty state */}
      {tasks.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--color-subtle)' }}>
          <p style={{ fontSize: 22, marginBottom: 8 }}>✓</p>
          <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-ink)', marginBottom: 4 }}>Geen taken</p>
          <p style={{ fontSize: 12 }}>Voeg hierboven een taak toe voor je team.</p>
        </div>
      )}

      {/* Double-click hint */}
      {tasks.length > 0 && (
        <p style={{ fontSize: 10, color: 'var(--color-subtle)', textAlign: 'center', fontFamily: 'var(--font-mono)', letterSpacing: '0.04em' }}>
          Dubbelklik op een taak om te bewerken
        </p>
      )}
    </div>
  )
}
