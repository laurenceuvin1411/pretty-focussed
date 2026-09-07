import { useEffect } from 'react'
import { useRecurringStore } from '../store/recurringStore'
import { useTaskStore } from '../store/taskStore'

export function useRecurringTasks() {
  const { recurring, isDateGenerated, markDateGenerated } = useRecurringStore()
  const { tasks, addTask } = useTaskStore()

  useEffect(() => {
    const today = new Date()
    const todayStr = today.toISOString().split('T')[0]
    if (isDateGenerated(todayStr)) return

    const dayOfWeek = today.getDay()   // 0=Sun … 6=Sat
    const dayOfMonth = today.getDate() // 1–31

    const toCreate = recurring.filter(r => {
      if (!r.active) return false
      if (r.frequency === 'monthly') return r.monthlyDay === dayOfMonth
      return r.days.includes(dayOfWeek) // weekly (default)
    })

    toCreate.forEach(r => {
      const alreadyExists = tasks.some(t => t.title === r.title && t.dueDate === todayStr)
      if (alreadyExists) return
      addTask({
        title: r.title,
        business: r.business,
        category: r.category,
        priority: r.priority,
        needleMover: r.needleMover,
        status: 'today',
        dueDate: todayStr,
        estimatedMinutes: r.estimatedMinutes,
        tags: [...r.tags, 'recurring'],
      })
    })

    markDateGenerated(todayStr)
  }, [])
}
