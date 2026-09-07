export function exportAllData() {
  const data = {
    exportedAt: new Date().toISOString(),
    habits: JSON.parse(localStorage.getItem('laurence-habits') || '{}'),
    tasks: JSON.parse(localStorage.getItem('laurence-tasks') || '{}'),
    finance: JSON.parse(localStorage.getItem('laurence-finance') || '{}'),
    planner: JSON.parse(localStorage.getItem('laurence-planner') || '{}'),
  }
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `laurence-os-backup-${new Date().toISOString().split('T')[0]}.json`
  a.click()
  URL.revokeObjectURL(url)
}

export function importData(jsonString: string) {
  const data = JSON.parse(jsonString)
  if (data.habits)  localStorage.setItem('laurence-habits',  JSON.stringify(data.habits))
  if (data.tasks)   localStorage.setItem('laurence-tasks',   JSON.stringify(data.tasks))
  if (data.finance) localStorage.setItem('laurence-finance', JSON.stringify(data.finance))
  if (data.planner) localStorage.setItem('laurence-planner', JSON.stringify(data.planner))
  window.location.reload()
}
