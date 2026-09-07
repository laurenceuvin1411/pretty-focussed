// Dev-only helpers: `?guest` opens the app as a guest without signing in,
// `?demo` also seeds a realistic week so every session screen can be viewed.
// Never runs in production builds.
import { weekKey, nextWeekKey, prevWeekKey, weekDatesFromKey, quarterKey } from '../lib/pf/week'

const GUEST = 'demo@extern.be'

// Read once by the session screen so a seeded step opens directly.
export function takeDevView(): 'steps' | null {
  if (!import.meta.env.DEV) return null
  const v = sessionStorage.getItem('pf-dev-view')
  if (v) sessionStorage.removeItem('pf-dev-view')
  return v === 'steps' ? 'steps' : null
}

export function applyDevParams() {
  if (!import.meta.env.DEV) return
  const params = new URLSearchParams(window.location.search)
  if (!params.has('guest') && !params.has('demo')) return
  localStorage.setItem('laurence-os-last-user', GUEST)
  if (params.has('demo')) {
    const mode = params.get('demo') || 'slot'
    seed(mode)
    if (/^[1-5]$/.test(mode)) sessionStorage.setItem('pf-dev-view', 'steps')
  }
  // Clean the URL so a reload keeps the state without re-seeding.
  window.history.replaceState({}, '', window.location.pathname)
}

function persist(name: string, state: unknown) {
  localStorage.setItem(`${name}::${GUEST}`, JSON.stringify({ state, version: 0 }))
}

function seed(mode: string) {
  const now = new Date().toISOString()
  const id = () => crypto.randomUUID()
  const q = quarterKey()
  const goals: Record<string, unknown>[] = [
    { id: id(), quarter: q, lane: 'business', title: 'Launch the group programme with 8 members', why: 'Less 1:1, more leverage', target: 8, current: 3, unit: 'members', milestones: ['Sales page live', 'Warm-up week', 'Cart open'], done: false, createdAt: now },
    { id: id(), quarter: q, lane: 'business', title: 'Three new 1:1 clients', target: 3, current: 1, unit: 'clients', milestones: [], done: false, createdAt: now },
    { id: id(), quarter: q, lane: 'life', title: 'Half marathon in October', target: 21, current: 14, unit: 'km', milestones: [], done: false, createdAt: now },
    { id: id(), quarter: q, lane: 'life', title: 'See a friend every Sunday', milestones: [], done: false, createdAt: now },
  ]
  const y = String(new Date().getFullYear())
  const out = (lane: string, title: string, done = false) => ({ id: id(), year: y, lane, title, done, createdAt: now })
  const outcomes = [
    out('business', 'A group programme that runs without me in every call'),
    out('business', 'Fewer 1:1 clients, deeper work'),
    out('life', 'A body that can run 21 km'),
    out('life', 'One trip a quarter with Matthias'),
  ]
  goals[0].yearId = outcomes[0].id
  goals[1].yearId = outcomes[1].id
  goals[2].yearId = outcomes[2].id
  persist('pf-goals-v1', { goals })
  persist('pf-focus-v1', {
    years: { [y]: { word: 'Depth', line: 'Fewer things, held longer.' } },
    outcomes,
    months: { [new Date().toISOString().slice(0, 7)]: { focus: 'The sales page is live and five conversations are booked.', goalIds: [goals[0].id, goals[1].id, goals[2].id] } },
  })
  const rituals = [
    { id: id(), name: 'Run', emoji: '', timesPerWeek: 3, preferredDays: [1, 3, 5], cycleAware: true, createdAt: now },
    { id: id(), name: 'Pilates', emoji: '', timesPerWeek: 2, preferredDays: [0, 4], cycleAware: false, createdAt: now },
    { id: id(), name: 'Screen-free evening', emoji: '', timesPerWeek: 2, preferredDays: [2, 6], cycleAware: false, createdAt: now },
  ]
  persist('pf-rituals-v1', { rituals, logs: {}, cycleStart: '2026-08-25', cycleLength: 28 })
  const o1 = id(), o2 = id()
  const month = new Date().toISOString().slice(0, 7)
  persist('pf-revenue-v1', {
    targets: { [month]: 8000 },
    offers: [
      { id: o1, name: 'Strategy session', price: 600, kind: 'one_on_one', createdAt: now },
      { id: o2, name: 'Group programme', price: 1500, kind: 'group', createdAt: now },
    ],
    sales: [
      { id: id(), date: `${month}-01`, offerId: o1, label: 'Strategy session', amount: 600, createdAt: now },
      { id: id(), date: `${month}-02`, offerId: o2, label: 'Group programme', amount: 1500, createdAt: now },
      ...[1, 2, 3, 4, 5].flatMap(k => {
        const d = new Date(); d.setMonth(d.getMonth() - k)
        const m = d.toISOString().slice(0, 7)
        const amounts = [[600, 1500, 600, 1500], [600, 1500, 1500], [600, 600, 1500, 1500, 600], [1500, 600], [600, 1500, 1500, 600]][k - 1]
        return amounts.map((a, i) => ({ id: id(), date: `${m}-${String(3 + i * 5).padStart(2, '0')}`, offerId: a === 600 ? o1 : o2, label: a === 600 ? 'Strategy session' : 'Group programme', amount: a, createdAt: now }))
      }),
    ],
  })

  const key = new Date().getDay() === 0 ? nextWeekKey(weekKey()) : weekKey()
  const dates = weekDatesFromKey(key)
  const [p0, p1, p2] = [id(), id(), id()]
  const B = (start: string, end: string, title: string, kind: string, extra: Record<string, unknown> = {}) => ({ id: id(), start, end, title, kind, done: false, ...extra })
  const week: Record<string, unknown> = {
    key, status: 'draft', step: mode === 'slot' ? 0 : Number(mode) || 5,
    priorities: [
      { id: p0, title: 'Sales page for the group programme live', goalId: goals[0].id, done: false },
      { id: p1, title: 'Five sales conversations booked', goalId: goals[1].id, done: false },
      { id: p2, title: 'Long run, 16 km, on Saturday', goalId: goals[2].id, done: false },
    ],
    ritualDays: { [rituals[0].id]: [1, 3, 5], [rituals[1].id]: [0, 4], [rituals[2].id]: [2, 6] },
    days: {},
    review: { wins: 'Deep work first, mail after.', drops: 'Daily stories with no plan.', lesson: 'Three things done beats six half done.', energy: 4 },
  }
  if (mode === '5' || mode === 'closed') {
    week.days = {
      [dates[0]]: { date: dates[0], intention: 'Start with the page. The rest follows.', blocks: [B('07:00', '07:45', 'Pilates', 'ritual', { ritualId: rituals[1].id }), B('09:00', '11:00', 'Sales page: structure and copy', 'priority', { priorityId: p0 }), B('13:30', '15:00', 'Sales page: visuals and proof', 'priority', { priorityId: p0 })] },
      [dates[1]]: { date: dates[1], intention: 'Today you talk to people.', blocks: [B('07:00', '07:50', 'Run', 'ritual', { ritualId: rituals[0].id }), B('09:00', '10:30', 'Five conversations: list and messages', 'priority', { priorityId: p1 }), B('14:00', '14:45', 'Admin and mail', 'admin')] },
      [dates[2]]: { date: dates[2], intention: 'Finish what Monday started.', blocks: [B('09:00', '11:00', 'Sales page: finish and publish', 'priority', { priorityId: p0 }), B('20:00', '22:00', 'Screen-free evening', 'ritual', { ritualId: rituals[2].id })] },
      [dates[3]]: { date: dates[3], intention: 'Three conversations. Nothing more.', blocks: [B('07:00', '07:50', 'Run', 'ritual', { ritualId: rituals[0].id }), B('09:00', '10:30', 'Conversations 1 and 2', 'priority', { priorityId: p1 }), B('11:00', '12:00', 'Conversation 3 and follow-up', 'priority', { priorityId: p1 }), B('14:00', '14:45', 'Admin and mail', 'admin'), B('17:30', '18:30', 'Rest', 'rest')] },
      [dates[4]]: { date: dates[4], intention: 'Close lightly, then off.', blocks: [B('07:00', '07:45', 'Pilates', 'ritual', { ritualId: rituals[1].id }), B('09:00', '10:30', 'Conversations 4 and 5', 'priority', { priorityId: p1 }), B('11:00', '11:30', 'Recap of the week', 'admin')] },
      [dates[5]]: { date: dates[5], intention: '16 km. Easy pace.', blocks: [B('08:00', '10:00', 'Long run, 16 km', 'priority', { priorityId: p2, ritualId: rituals[0].id })] },
      [dates[6]]: { date: dates[6], intention: 'A friend, a walk, done.', blocks: [B('11:00', '14:00', 'Lunch with Sofie', 'rest'), B('20:00', '22:00', 'Screen-free evening', 'ritual', { ritualId: rituals[2].id })] },
    }
    week.assistantNote = 'Two things carry this week: the sales page is live by Wednesday, and Thursday and Friday you talk to five people. Saturday is the long run, so Friday stops at 11:30.'
    week.dropSuggestion = 'No new content ideas this week. The page is the content.'
    if (mode === 'closed') { week.status = 'planned'; week.sessionCompletedAt = now }
  }
  // Last week, so the look back has something to confirm: two of three stood, the mornings carried it.
  const pk = prevWeekKey(key)
  const pd = weekDatesFromKey(pk)
  const prevWeek = {
    key: pk, status: 'recapped', step: 5, sessionCompletedAt: now,
    priorities: [
      { id: id(), title: 'Offer page copy finished', goalId: goals[0].id, done: true },
      { id: id(), title: 'Three discovery calls', goalId: goals[1].id, done: true },
      { id: id(), title: 'Two 12 km runs', goalId: goals[2].id, done: false },
    ],
    ritualDays: { [rituals[0].id]: [1, 3, 5], [rituals[1].id]: [0, 4], [rituals[2].id]: [2, 6] },
    days: {
      [pd[0]]: { date: pd[0], blocks: [B('09:00', '11:00', 'Offer page copy', 'priority', { done: true }), B('14:00', '15:00', 'Mail and admin', 'admin', { done: true })] },
      [pd[1]]: { date: pd[1], blocks: [B('09:00', '10:30', 'Discovery calls, two', 'priority', { done: true }), B('16:00', '17:00', 'Newsletter draft', 'other', { done: false })] },
      [pd[3]]: { date: pd[3], blocks: [B('09:00', '10:00', 'Discovery call, one more', 'priority', { done: true }), B('15:00', '16:30', 'Bookkeeping', 'admin', { done: false })] },
    },
    dropSuggestion: 'Daily stories with no plan.',
  }
  persist('pf-week-v1', { weeks: { [key]: week, [pk]: prevWeek } })
  persist('pf-rituals-v1', { rituals, logs: { [pd[0]]: [rituals[1].id], [pd[1]]: [rituals[0].id], [pd[3]]: [rituals[0].id], [pd[4]]: [rituals[1].id] }, cycleStart: '2026-08-25', cycleLength: 28 })

  const lead = (name: string, stage: string, value: number, offerName: string, nextStep?: string, nextDate?: string, closedAt?: string) =>
    ({ id: id(), name, stage, value, offerName, nextStep, nextDate, closedAt, createdAt: now, updatedAt: now, source: 'Instagram' })
  persist('pf-sales-v1', { leads: [
    lead('Sofie D.', 'proposal', 1500, 'Group programme', 'She decides after her holiday', dates[4]),
    lead('Anke V.', 'conversation', 600, 'Strategy session', 'Send two dates', dates[3]),
    lead('Charlotte M.', 'conversation', 1500, 'Group programme', 'Voice note back', dates[3]),
    lead('Lien P.', 'new', 600, 'Strategy session', 'First reply'),
    lead('Emma R.', 'won', 1500, 'Group programme', undefined, undefined, `${month}-02`),
    lead('Julie S.', 'lost', 600, 'Strategy session', undefined, undefined, `${month}-01`),
  ] })
  const exp = (label: string, amount: number, kind: string, monthly: boolean, date = `${month}-01`) => ({ id: id(), date, label, amount, kind, monthly, createdAt: now })
  persist('pf-finance-v1', { payTarget: 3500, expenses: [
    exp('Studio rent', 650, 'space', true, `${new Date().getFullYear()}-01-01`), exp('Accountant', 180, 'other', true), exp('Tools', 140, 'tools', true),
    exp('VA, 20 hours', 600, 'team', true), exp('Photoshoot', 420, 'marketing', false, `${month}-03`),
  ] })

  const post = (title: string, date: string, format: string, status: string, metrics?: Record<string, number>) =>
    ({ id: id(), title, format, platform: 'instagram', date, status, metrics, createdAt: now })
  persist('pf-content-v1', {
    ideas: [
      { id: id(), title: 'The week I stopped answering mail before 11', format: 'reel', createdAt: now },
      { id: id(), title: 'What a 20-minute Sunday session looks like', format: 'carousel', createdAt: now },
      { id: id(), title: 'Three prices, one offer', createdAt: now },
    ],
    posts: [
      post('How I plan a launch week', `${month}-01`, 'carousel', 'posted', { reach: 18400, saves: 612, comments: 41, follows: 58 }),
      post('Rest is a business decision', `${month}-02`, 'reel', 'posted', { reach: 31200, saves: 940, comments: 77, follows: 121 }),
      post('The sales page in one afternoon', dates[2], 'carousel', 'posted', { reach: 9800, saves: 233, comments: 12, follows: 19 }),
      post('Five conversations, no pitch', dates[3], 'reel', 'drafted'),
      post('What I dropped this week', dates[4], 'story', 'planned'),
      post('Sunday session, live', dates[6], 'reel', 'planned'),
    ],
  })
}
