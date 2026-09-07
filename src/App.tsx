import { BrowserRouter, Routes, Route, useParams } from 'react-router-dom'
import { useEffect } from 'react'
import { Sidebar } from './components/layout/Sidebar'
import { TopBar } from './components/layout/TopBar'
import { Dashboard } from './pages/Dashboard'
import { HabitTracker } from './pages/HabitTracker'
import { TaskCalendar } from './pages/TaskCalendar'
import { YearlyPlanner } from './pages/YearlyPlanner'
import { WeekOptimizer } from './pages/WeekOptimizer'
import { VisionCompass } from './pages/VisionCompass'
import { SalesDashboard } from './pages/SalesDashboard'
import { FinanceDashboard } from './pages/FinanceDashboard'
import { MonthReport } from './pages/MonthReport'
import { Projects } from './pages/Projects'
import { Sprint } from './pages/Sprint'
import { Productivity } from './pages/Productivity'
import { LuKompas } from './pages/LuKompas'
import { Recipes } from './pages/Recipes'
import { MonthlyGoals } from './pages/MonthlyGoals'
import { WorkWithLaurence } from './pages/WorkWithLaurence'
import { ContentCreation } from './pages/ContentCreation'
import { Marketing } from './pages/Marketing'
import { QuickCapture } from './components/shared/QuickCapture'
import { LoadingScreen } from './components/LoadingScreen'
import { SaveToast } from './components/SaveToast'
import { useThemeStore, applyTheme } from './store/themeStore'
import { useAuthStore } from './store/authStore'
import { useRecurringTasks } from './hooks/useRecurringTasks'
import { useDataSync } from './hooks/useDataSync'
import { useAutomationEngine } from './hooks/useAutomationEngine'
import { Automations } from './pages/Automations'
import { Health } from './pages/Health'
import { supabase } from './lib/supabase'
import { rememberUser, isOwner } from './lib/workspace'
import type { Session } from '@supabase/supabase-js'
import { useProjectDataStore } from './store/projectStore'
import { ProjectKompas } from './pages/ProjectKompas'
import { ProjectSales } from './pages/ProjectSales'
import { WeeklySession } from './pf/WeeklySession'
import { NowShell, Resume } from './pf/now/NowShell'
import { Now } from './pf/now/Now'
import { Focus } from './pf/now/Focus'
import { TodayScreen } from './pf/now/TodayScreen'
import { WeekScreen } from './pf/now/WeekScreen'
import { MeScreen } from './pf/now/MeScreen'
import { Login } from './pf/Login'
import { Field } from './pf/Field'
import { Today } from './pf/Today'
import { Goals } from './pf/Goals'
import { Money } from './pf/Money'
import { Rituals } from './pf/Rituals'
import { Recap } from './pf/Recap'
import { Content } from './pf/Content'
import { Settings } from './pf/Settings'

// Sub-pagina's van een custom project: eigen store per project-id
function ProjectSection({ section }: { section: 'content' | 'kompas' | 'sales' }) {
  const { id } = useParams()
  const project = useProjectDataStore(s => s.projects.find(p => p.id === id))
  if (!id || !project) return null
  if (section === 'kompas') return <ProjectKompas projectId={id} projectName={project.name} />
  if (section === 'sales')  return <ProjectSales projectId={id} projectName={project.name} />
  return <ContentCreation projectId={id} projectName={project.name} />
}

function AppShell({ userId }: { userId: string }) {
  useRecurringTasks()
  useAutomationEngine()
  const ready = useDataSync(userId)
  const { isDark } = useThemeStore()

  useEffect(() => { applyTheme(isDark) }, [isDark])

  if (!ready) return <LoadingScreen />

  return (
    <div className="min-h-screen bg-bg" style={{ width: '100%' }}>
      <Sidebar />
      <div style={{ marginLeft: 200 }}>
        <TopBar />
        <QuickCapture />
        <main className="min-h-screen" style={{ padding: '80px 36px 120px 36px', overflowX: 'hidden' }}>
          <Routes>
            <Route path="/os"      element={<Dashboard />} />
            <Route path="/habits"  element={<HabitTracker />} />
            <Route path="/tasks"   element={<TaskCalendar />} />
            <Route path="/planner" element={<MonthlyGoals />} />
            <Route path="/planner-old" element={<YearlyPlanner />} />
            <Route path="/week"    element={<WeekOptimizer />} />
            <Route path="/vision"  element={<VisionCompass />} />
            <Route path="/sales"   element={<SalesDashboard />} />
            <Route path="/finance" element={<FinanceDashboard />} />
            <Route path="/report"   element={<MonthReport />} />
            <Route path="/projects"   element={<Projects />} />
            <Route path="/marketing"  element={<Marketing />} />
            {isOwner() && <>
              <Route path="/lu-admin"     element={<Projects fixedProjectId="laurence-uvin" />} />
              <Route path="/lu-kompas"    element={<LuKompas />} />
              <Route path="/lu-content"   element={<ContentCreation />} />
              <Route path="/bora-admin"   element={<Projects fixedProjectId="bora" />} />
              <Route path="/bora-content"   element={<ContentCreation business="bora" />} />
              <Route path="/bora-marketing" element={<Marketing business="bora" />} />
            </>}
            <Route path="/projects/:id" element={<Projects />} />
            <Route path="/projects/:id/content" element={<ProjectSection section="content" />} />
            <Route path="/projects/:id/kompas"  element={<ProjectSection section="kompas" />} />
            <Route path="/projects/:id/sales"   element={<ProjectSection section="sales" />} />
            <Route path="/sprint"        element={<Sprint />} />
            <Route path="/productivity"  element={<Productivity />} />
            <Route path="/automations"  element={<Automations />} />
            <Route path="/health"       element={<Health />} />
            <Route path="/recipes"      element={<Recipes />} />
            <Route path="/coaching"     element={<WorkWithLaurence />} />
          </Routes>
        </main>
      </div>
    </div>
  )
}

export default function App() {
  const { user, loading, setSession } = useAuthStore()
  const { isDark } = useThemeStore()

  useEffect(() => { applyTheme(isDark) }, [isDark])

  useEffect(() => {
    // Onthoud wie er inlogt: stores gebruiken dat om hun opslag per account
    // te scheiden. Bij een ander account dan de vorige sessie herladen we,
    // zodat elke store met de juiste sleutel opnieuw opbouwt.
    function applyUser(session: Session | null) {
      const switched = rememberUser(session?.user?.email)
      setSession(session)
      if (switched) window.location.reload()
    }
    supabase.auth.getSession().then(({ data: { session } }) => applyUser(session))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => applyUser(session))
    return () => subscription.unsubscribe()
  }, [])

  if (loading) return <LoadingScreen />

  // TEMP dev-only: gastweergave simuleren (?guest in de URL) — niet in productie
  if (!user && import.meta.env.DEV && localStorage.getItem('laurence-os-last-user') === 'demo@extern.be') {
    return (
      <BrowserRouter>
        <Routes>
        <Route path="/session" element={<WeeklySession />} />
        <Route element={<NowShell />}>
          <Route path="/"         element={<Resume />} />
          <Route path="/now"      element={<Now />} />
          <Route path="/week"     element={<WeekScreen />} />
          <Route path="/focus"    element={<Focus />} />
          <Route path="/me"       element={<MeScreen />} />
          <Route path="/field"    element={<Field />} />
          <Route path="/today"    element={<TodayScreen />} />
          <Route path="/today/plan" element={<Today />} />
          <Route path="/goals"    element={<Goals />} />
          <Route path="/goals/year"  element={<Goals />} />
          <Route path="/goals/month" element={<Goals />} />
          <Route path="/goals/week"  element={<Goals />} />
          <Route path="/revenue"  element={<Money />} />
          <Route path="/money"    element={<Money />} />
          <Route path="/money/sales"   element={<Money />} />
          <Route path="/money/finance" element={<Money />} />
          <Route path="/rituals"  element={<Rituals />} />
          <Route path="/content"  element={<Content />} />
          <Route path="/recap"    element={<Recap />} />
          <Route path="/settings" element={<Settings />} />
        </Route>
        <Route path="*" element={
        <div style={{ display: 'flex', width: '100%' }}>
          <Sidebar />
          <div style={{ marginLeft: 200, flex: 1, minWidth: 0 }}>
            <main style={{ padding: '40px 36px', minHeight: '100vh', boxSizing: 'border-box' }}>
              <Routes>
                <Route path="/os"           element={<Dashboard />} />
                <Route path="/habits"       element={<HabitTracker />} />
                <Route path="/health"       element={<Health />} />
                <Route path="/recipes"      element={<Recipes />} />
                <Route path="/planner"      element={<MonthlyGoals />} />
                <Route path="/productivity" element={<Productivity />} />
                <Route path="/coaching"     element={<WorkWithLaurence />} />
                <Route path="/projects/:id" element={<Projects />} />
                <Route path="/projects/:id/content" element={<ProjectSection section="content" />} />
                <Route path="/projects/:id/kompas"  element={<ProjectSection section="kompas" />} />
                <Route path="/projects/:id/sales"   element={<ProjectSection section="sales" />} />
                <Route path="/sales"        element={<SalesDashboard />} />
                <Route path="*"             element={<Dashboard />} />
              </Routes>
            </main>
          </div>
        </div>
        } />
        </Routes>
      </BrowserRouter>
    )
  }

  if (!user) {
    return <Login />
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/session" element={<WeeklySession />} />
        <Route element={<NowShell />}>
          <Route path="/"         element={<Resume />} />
          <Route path="/now"      element={<Now />} />
          <Route path="/week"     element={<WeekScreen />} />
          <Route path="/focus"    element={<Focus />} />
          <Route path="/me"       element={<MeScreen />} />
          <Route path="/field"    element={<Field />} />
          <Route path="/today"    element={<TodayScreen />} />
          <Route path="/today/plan" element={<Today />} />
          <Route path="/goals"    element={<Goals />} />
          <Route path="/goals/year"  element={<Goals />} />
          <Route path="/goals/month" element={<Goals />} />
          <Route path="/goals/week"  element={<Goals />} />
          <Route path="/revenue"  element={<Money />} />
          <Route path="/money"    element={<Money />} />
          <Route path="/money/sales"   element={<Money />} />
          <Route path="/money/finance" element={<Money />} />
          <Route path="/rituals"  element={<Rituals />} />
          <Route path="/content"  element={<Content />} />
          <Route path="/recap"    element={<Recap />} />
          <Route path="/settings" element={<Settings />} />
        </Route>
        <Route path="*" element={<><AppShell userId={user.id} /><SaveToast /></>} />
      </Routes>
    </BrowserRouter>
  )
}
