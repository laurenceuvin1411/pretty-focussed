import type { Habit, RevenueEntry, ExpenseEntry, Account, Goal, Task, PlannerEvent, WeekBlock } from '../types'

export const defaultHabits: Habit[] = [
  // ── Persoonlijk ──
  { id: 'h1',  name: 'Meal prep',          category: 'persoonlijk', icon: '🍱', color: '#C4935A', order: 1,  active: true, targetFrequency: 'custom', customDays: [0,3] },
  { id: 'h2',  name: '10.000 stappen',     category: 'persoonlijk', icon: '👟', color: '#C4935A', order: 2,  active: true, targetFrequency: 'daily' },
  { id: 'h3',  name: 'Zwemtraining',       category: 'persoonlijk', icon: '🏊', color: '#C4935A', order: 3,  active: true, targetFrequency: 'custom', customDays: [2,6] },
  { id: 'h4',  name: 'Looptraining',       category: 'persoonlijk', icon: '🏃', color: '#C4935A', order: 4,  active: true, targetFrequency: 'custom', customDays: [3] },
  { id: 'h5',  name: 'Fietstraining',      category: 'persoonlijk', icon: '🚴', color: '#C4935A', order: 5,  active: false, targetFrequency: 'custom', customDays: [6] },
  { id: 'h6',  name: 'Krachttraining',     category: 'persoonlijk', icon: '💪', color: '#C4935A', order: 6,  active: true, targetFrequency: 'custom', customDays: [1,4] },
  { id: 'h7',  name: 'Stretching',         category: 'persoonlijk', icon: '🧘', color: '#C4935A', order: 7,  active: true, targetFrequency: 'daily' },
  { id: 'h8',  name: '8 uur slaap',        category: 'persoonlijk', icon: '😴', color: '#C4935A', order: 8,  active: true, targetFrequency: 'daily' },
  { id: 'h9',  name: 'Water drinken',      category: 'persoonlijk', icon: '💧', color: '#C4935A', order: 9,  active: true, targetFrequency: 'daily' },
  { id: 'h10', name: 'Supplementen nemen', category: 'persoonlijk', icon: '💊', color: '#C4935A', order: 10, active: true, targetFrequency: 'daily' },
  // ── Professioneel ──
  { id: 'h11', name: 'Daily sales actions',  category: 'professioneel', icon: '📞', color: '#6DB889', order: 11, active: true, targetFrequency: 'weekdays' },
  { id: 'h12', name: 'LinkedIn post',        category: 'professioneel', icon: '💼', color: '#6DB889', order: 12, active: true, targetFrequency: 'weekdays' },
  { id: 'h13', name: 'Instagram content',    category: 'professioneel', icon: '📸', color: '#6DB889', order: 13, active: true, targetFrequency: 'custom', customDays: [1,2,3,4,5] },
  { id: 'h14', name: 'Boekhouding',          category: 'professioneel', icon: '📊', color: '#6DB889', order: 14, active: true, targetFrequency: 'custom', customDays: [5] },
  { id: 'h15', name: 'Inbox zero',           category: 'professioneel', icon: '📥', color: '#6DB889', order: 15, active: true, targetFrequency: 'weekdays' },
  { id: 'h16', name: 'Klanten opvolgen',     category: 'professioneel', icon: '🤝', color: '#6DB889', order: 16, active: true, targetFrequency: 'weekdays' },
  { id: 'h17', name: 'CEO planning',         category: 'professioneel', icon: '🎯', color: '#6DB889', order: 17, active: true, targetFrequency: 'custom', customDays: [1] },
  { id: 'h18', name: 'Podcast werk',         category: 'professioneel', icon: '🎙️', color: '#6DB889', order: 18, active: false, targetFrequency: 'custom', customDays: [3] },
  // ── Lifestyle ──
  { id: 'h19', name: 'Lezen',               category: 'lifestyle', icon: '📚', color: '#7AACCF', order: 19, active: true, targetFrequency: 'daily' },
  { id: 'h20', name: 'Opruimen',            category: 'lifestyle', icon: '🧹', color: '#7AACCF', order: 20, active: true, targetFrequency: 'daily' },
  { id: 'h21', name: 'Avondroutine',        category: 'lifestyle', icon: '🌙', color: '#7AACCF', order: 21, active: true, targetFrequency: 'daily' },
  { id: 'h22', name: 'Financiële check-in', category: 'lifestyle', icon: '💰', color: '#7AACCF', order: 22, active: true, targetFrequency: 'custom', customDays: [5] },
]

export const seedRevenue: RevenueEntry[] = [
  // ── Juni 2026 (MTD ~€7.300) ──────────────────────────────────
  { id: 'r1',  date: '2026-06-01', amount: 2200, business: 'bora',          type: 'membership', offer: 'Vaste desk members',         status: 'received' },
  { id: 'r2',  date: '2026-06-03', amount: 2800, business: 'ceo-lifestyle', type: 'coaching',   offer: '1:1 Coaching Premium',       status: 'received' },
  { id: 'r3',  date: '2026-06-10', amount: 1500, business: 'bora',          type: 'event',      offer: 'Event / workshop',           status: 'received' },
  { id: 'r4',  date: '2026-06-14', amount: 800,  business: 'ceo-lifestyle', type: 'digital',    offer: 'Online programma',           status: 'received' },
  { id: 'r5',  date: '2026-06-20', amount: 1800, business: 'ceo-lifestyle', type: 'coaching',   offer: 'Coaching sessies',           status: 'pending' },
  // ── Mei 2026 (~€7.700) ────────────────────────────────────────
  { id: 'r6',  date: '2026-05-02', amount: 2200, business: 'bora',          type: 'membership', offer: 'Vaste desk members',         status: 'received' },
  { id: 'r7',  date: '2026-05-05', amount: 3200, business: 'ceo-lifestyle', type: 'coaching',   offer: '1:1 Coaching Premium',       status: 'received' },
  { id: 'r8',  date: '2026-05-15', amount: 1200, business: 'bora',          type: 'event',      offer: 'Netwerkevent',               status: 'received' },
  { id: 'r9',  date: '2026-05-22', amount: 1100, business: 'ceo-lifestyle', type: 'digital',    offer: 'Online cursus',              status: 'received' },
  // ── April 2026 (~€7.063) ──────────────────────────────────────
  { id: 'r10', date: '2026-04-01', amount: 2200, business: 'bora',          type: 'membership', offer: 'Vaste desk members',         status: 'received' },
  { id: 'r11', date: '2026-04-08', amount: 2800, business: 'ceo-lifestyle', type: 'coaching',   offer: '1:1 Coaching',               status: 'received' },
  { id: 'r12', date: '2026-04-18', amount: 1200, business: 'bora',          type: 'event',      offer: 'Workshop',                   status: 'received' },
  { id: 'r13', date: '2026-04-25', amount: 863,  business: 'ceo-lifestyle', type: 'digital',    offer: 'Digitaal product',           status: 'received' },
  // ── Maart 2026 (~€6.900) ──────────────────────────────────────
  { id: 'r14', date: '2026-03-03', amount: 2200, business: 'bora',          type: 'membership', offer: 'Vaste desk members',         status: 'received' },
  { id: 'r15', date: '2026-03-10', amount: 2700, business: 'ceo-lifestyle', type: 'coaching',   offer: '1:1 Coaching',               status: 'received' },
  { id: 'r16', date: '2026-03-20', amount: 1000, business: 'bora',          type: 'event',      offer: 'Event',                      status: 'received' },
  { id: 'r17', date: '2026-03-28', amount: 1000, business: 'ceo-lifestyle', type: 'coaching',   offer: 'Groepsprogramma',            status: 'received' },
  // ── Februari 2026 (~€6.900) ───────────────────────────────────
  { id: 'r18', date: '2026-02-03', amount: 2200, business: 'bora',          type: 'membership', offer: 'Vaste desk members',         status: 'received' },
  { id: 'r19', date: '2026-02-10', amount: 2700, business: 'ceo-lifestyle', type: 'coaching',   offer: '1:1 Coaching',               status: 'received' },
  { id: 'r20', date: '2026-02-20', amount: 1200, business: 'bora',          type: 'event',      offer: 'Workshop',                   status: 'received' },
  { id: 'r21', date: '2026-02-25', amount: 800,  business: 'ceo-lifestyle', type: 'digital',    offer: 'Online product',             status: 'received' },
  // ── Januari 2026 (~€6.700) ────────────────────────────────────
  { id: 'r22', date: '2026-01-06', amount: 2200, business: 'bora',          type: 'membership', offer: 'Vaste desk members',         status: 'received' },
  { id: 'r23', date: '2026-01-13', amount: 2500, business: 'ceo-lifestyle', type: 'coaching',   offer: '1:1 Coaching',               status: 'received' },
  { id: 'r24', date: '2026-01-22', amount: 1200, business: 'bora',          type: 'event',      offer: 'Netwerkevent',               status: 'received' },
  { id: 'r25', date: '2026-01-28', amount: 800,  business: 'ceo-lifestyle', type: 'digital',    offer: 'Digitaal product',           status: 'received' },
]

export const seedExpenses: ExpenseEntry[] = [
  { id: 'e1', date: '2026-06-01', amount: 450,  business: 'bora',          category: 'rent',      description: 'Huur kantoor',          recurring: true,  vatDeductible: true  },
  { id: 'e2', date: '2026-06-01', amount: 89,   business: 'ceo-lifestyle', category: 'software',  description: 'Hostings + tools',      recurring: true,  vatDeductible: true  },
  { id: 'e3', date: '2026-06-01', amount: 200,  business: 'ceo-lifestyle', category: 'team',      description: 'Accountant',            recurring: true,  vatDeductible: true  },
  { id: 'e4', date: '2026-06-01', amount: 180,  business: 'personal',      category: 'insurance', description: 'Verzekeringen',         recurring: true,  vatDeductible: false },
  { id: 'e5', date: '2026-06-05', amount: 285,  business: 'ceo-lifestyle', category: 'software',  description: 'Software tools',        recurring: false, vatDeductible: true  },
  { id: 'e6', date: '2026-06-08', amount: 400,  business: 'ceo-lifestyle', category: 'marketing', description: 'Marketing/ads',         recurring: false, vatDeductible: true  },
  { id: 'e7', date: '2026-06-10', amount: 150,  business: 'bora',          category: 'travel',    description: 'Netwerking',            recurring: false, vatDeductible: true  },
  { id: 'e8', date: '2026-06-12', amount: 200,  business: 'ceo-lifestyle', category: 'education', description: 'Profess. ontwikkeling', recurring: false, vatDeductible: true  },
]

export const seedAccounts: Account[] = [
  { id: 'a1', name: 'Business account',       type: 'business',   balance: 12400, lastUpdated: '2026-06-16' },
  { id: 'a2', name: 'BTW rekening',          type: 'tax',        balance: 8500,  lastUpdated: '2026-06-16' },
  { id: 'a3', name: 'Noodfonds',             type: 'emergency',  balance: 8000,  lastUpdated: '2026-06-01' },
  { id: 'a4', name: 'Investeringsrekening',  type: 'investment', balance: 14000, lastUpdated: '2026-06-16' },
  { id: 'a5', name: 'Personal account',      type: 'personal',   balance: 4200,  lastUpdated: '2026-06-16' },
  { id: 'a6', name: 'Spaarpot woning',       type: 'savings',    balance: 3200,  lastUpdated: '2026-06-01' },
]

export const seedGoals: Goal[] = [

  // ── BUSINESS ─────────────────────────────────────────────────────
  {
    id: 'g_posts', title: '100 content posts publiceren', area: 'business', category: 'brand',
    icon: '📱', color: '#6DB889', unit: 'posts', horizon: 'annual',
    targetNumber: 100, currentNumber: 34, status: 'active',
    xpReward: 500,
    whyItMatters: 'Zichtbaarheid = autoriteit = inbound klanten. Elke post werkt voor jou terwijl je slaapt.',
    milestones: [
      { value: 25,  label: '25 posts',     emoji: '🌱' },
      { value: 50,  label: 'Halverwege',   emoji: '🔥' },
      { value: 75,  label: '75 posts',     emoji: '⚡' },
      { value: 100, label: '100 posts!',   emoji: '🏆' },
    ],
  },
  {
    id: 'g_website', title: 'Converterende coaching website live', area: 'business', category: 'brand',
    icon: '🌐', color: '#D4A96A', unit: '%', horizon: 'quarterly', quarter: 'Q3',
    targetNumber: 100, currentNumber: 20, status: 'active',
    xpReward: 450,
    whyItMatters: 'Mensen begrijpen binnen 5 seconden wat je verkoopt. Grootste hefboom op omzet.',
    milestones: [
      { value: 25,  label: 'Strategie',  emoji: '📋' },
      { value: 50,  label: 'Design',     emoji: '🎨' },
      { value: 75,  label: 'In review',  emoji: '👀' },
      { value: 100, label: 'Live!',      emoji: '🚀' },
    ],
  },
  {
    id: 'g_clients', title: 'Attract new coaching clients', area: 'business', category: 'sales',
    icon: '🤝', color: '#C4935A', unit: 'klanten', horizon: 'quarterly', quarter: 'Q3',
    targetNumber: 5, currentNumber: 2, status: 'active',
    xpReward: 400,
    whyItMatters: 'Premium coaching aan ambitieuze ondernemers. Dagelijkse sales outreach is de motor.',
    milestones: [
      { value: 1, label: 'Eerste klant!', emoji: '🌟' },
      { value: 3, label: 'Momentum',      emoji: '🔥' },
      { value: 5, label: 'Goal reached!', emoji: '🎯' },
    ],
  },

  // ── PERSOONLIJK ──────────────────────────────────────────────────
  {
    id: 'g_toilet', title: 'Kastje bouwen in toilet appartement', area: 'lifestyle', category: 'personal-finance',
    icon: '🪚', color: '#7AACCF', unit: '%', horizon: 'quarterly', quarter: 'Q3',
    targetNumber: 100, currentNumber: 0, status: 'active',
    xpReward: 200,
    whyItMatters: 'Klein project, groot gevoel van eigenaarschap over je eigen ruimte.',
    milestones: [
      { value: 25, label: 'Materialen',  emoji: '📦' },
      { value: 50, label: 'Constructie', emoji: '🔨' },
      { value: 100, label: 'Klaar!',     emoji: '✅' },
    ],
  },
  {
    id: 'g_ironman', title: 'Half Ironman training afronden', area: 'health', category: 'health',
    icon: '🏊', color: '#C4935A', unit: '%', horizon: 'annual',
    targetNumber: 100, currentNumber: 30, status: 'active',
    xpReward: 600,
    whyItMatters: '1.9km zwemmen, 90km fietsen, 21km lopen. Het bewijst dat je lichaam en mind grenzen kunnen verleggen.',
    milestones: [
      { value: 25,  label: 'Basis opgebouwd', emoji: '🌱' },
      { value: 50,  label: 'Halverwege',       emoji: '🚴' },
      { value: 75,  label: 'Race-ready',       emoji: '🏃' },
      { value: 100, label: 'Finisher!',        emoji: '🏅' },
    ],
  },
  {
    id: 'g_mealprep', title: 'Consistent meal preppen', area: 'health', category: 'health',
    icon: '🍱', color: '#6DB889', unit: 'weken', horizon: 'annual',
    targetNumber: 40, currentNumber: 8, status: 'active',
    xpReward: 300,
    whyItMatters: 'Controle over voeding = betere energie, minder stress, lager budget. Fundament van alles.',
    milestones: [
      { value: 10, label: '10 weken',    emoji: '🌱' },
      { value: 20, label: 'Halverwege',  emoji: '🔥' },
      { value: 40, label: 'Year habit!', emoji: '🏆' },
    ],
  },

  // ── GEZONDHEID & LICHAAM (extra) ───────────────────────────────
  {
    id: 'g1', title: 'Doelgewicht 65 kg', area: 'health', category: 'health',
    icon: '⚡', color: '#C4935A', unit: 'kg', horizon: 'annual',
    targetNumber: 68, currentNumber: 71, status: 'active',
    xpReward: 500,
    whyItMatters: 'Sterke, atletische en vrouwelijke uitstraling. Duurzaam vetverlies via hormonale balans en voeding.',
    milestones: [
      { value: 69, label: 'Eerste stap',  emoji: '🌱' },
      { value: 67, label: 'Halverwege',   emoji: '🔥' },
      { value: 65, label: 'Doelgewicht!', emoji: '🏆' },
    ],
  },
  {
    id: 'g2', title: 'Krachttraining 2x/week', area: 'health', category: 'health',
    icon: '💪', color: '#D4A96A', unit: 'sessies', horizon: 'annual',
    targetNumber: 96, currentNumber: 28, status: 'active',
    xpReward: 400,
    whyItMatters: 'Spieropbouw = sterkere stofwisseling, betere hormonen, meer energie. Consistentie wint.',
    milestones: [
      { value: 24,  label: 'Q1 klaar',      emoji: '🌱' },
      { value: 48,  label: 'Halverwege',     emoji: '💪' },
      { value: 72,  label: 'Drie kwart',     emoji: '⚡' },
      { value: 96,  label: 'Year completed!',emoji: '🏆' },
    ],
  },
  {
    id: 'g3', title: 'Cardio 2x/week', area: 'health', category: 'health',
    icon: '🏃', color: '#7AACCF', unit: 'sessies', horizon: 'annual',
    targetNumber: 96, currentNumber: 22, status: 'active',
    xpReward: 300,
    whyItMatters: 'Cardiovasculaire gezondheid, vetverbranding en energie overdag.',
    milestones: [
      { value: 24, label: 'Q1',         emoji: '🌬️' },
      { value: 48, label: 'Halverwege', emoji: '🏃' },
      { value: 96, label: 'Atletisch!', emoji: '🥇' },
    ],
  },

  // ── CEO LIFESTYLE ───────────────────────────────────────────────
  {
    id: 'g4', title: 'CEO Lifestyle: nieuwe website live', area: 'business', category: 'brand',
    icon: '🌐', color: '#D4A96A', unit: '%', horizon: 'quarterly', quarter: 'Q3',
    targetNumber: 100, currentNumber: 20, status: 'active',
    xpReward: 450,
    whyItMatters: 'Mensen begrijpen binnen 5 seconden wat je verkoopt. Wie, waarmee, wat levert het op. Grootste hefboom op omzet.',
    milestones: [
      { value: 25,  label: 'Strategie klaar', emoji: '📋' },
      { value: 50,  label: 'Design ready',    emoji: '🎨' },
      { value: 75,  label: 'In review',       emoji: '👀' },
      { value: 100, label: 'Live!',           emoji: '🚀' },
    ],
  },
  {
    id: 'g5', title: 'CEO Lifestyle: 5 actieve coachingklanten', area: 'business', category: 'sales',
    icon: '🤝', color: '#C4935A', unit: 'klanten', horizon: 'quarterly', quarter: 'Q3',
    targetNumber: 5, currentNumber: 2, status: 'active',
    xpReward: 400,
    whyItMatters: 'Premium coaching aan ambitieuze ondernemers. Dagelijkse sales outreach is de motor.',
    milestones: [
      { value: 1, label: 'Eerste klant!', emoji: '🌟' },
      { value: 3, label: 'Momentum',      emoji: '🔥' },
      { value: 5, label: 'Q3 doel!',      emoji: '🎯' },
    ],
  },
  {
    id: 'g6', title: 'CEO Lifestyle: 3 reels/week', area: 'business', category: 'brand',
    icon: '📱', color: '#6DB889', unit: 'reels', horizon: 'annual',
    targetNumber: 78, currentNumber: 12, status: 'active',
    xpReward: 300,
    whyItMatters: 'Zichtbaarheid = autoriteit = inbound klanten. Elke reel werkt voor jou terwijl je slaapt.',
    milestones: [
      { value: 20, label: 'Routine',    emoji: '🌱' },
      { value: 40, label: 'Authority',  emoji: '📣' },
      { value: 78, label: 'Dominantie',emoji: '👑' },
    ],
  },

  // ── SETT.DESIGN ─────────────────────────────────────────────────
  {
    id: 'g7', title: 'CEO Lifestyle: 1 podcast/week', area: 'business', category: 'brand',
    icon: '🎙️', color: '#7AACCF', unit: 'episodes', horizon: 'annual',
    targetNumber: 26, currentNumber: 4, status: 'active',
    xpReward: 300,
    whyItMatters: '1 podcast per week = autoriteit, bereik en diepgaande connectie met je doelgroep.',
    milestones: [
      { value: 4,  label: 'Q1 start',     emoji: '🎙️' },
      { value: 13, label: 'Halverwege',   emoji: '📣' },
      { value: 26, label: 'Heel 2026!',   emoji: '👑' },
    ],
  },
  {
    id: 'g8', title: 'Bora: meer groeien als eigenaar', area: 'business', category: 'revenue',
    icon: '🏢', color: '#6DB889', unit: '%', horizon: 'annual',
    targetNumber: 80, currentNumber: 35, status: 'active',
    xpReward: 350,
    whyItMatters: 'Jij focust op marketing, finance, community en team. Minder uitvoeren, meer sturen.',
    milestones: [
      { value: 40, label: 'Delegatie start',  emoji: '🌱' },
      { value: 60, label: 'Systemen werken',  emoji: '⚙️' },
      { value: 80, label: 'Eigenaar modus!',  emoji: '👑' },
    ],
  },

  // ── BORA COWORKING ──────────────────────────────────────────────
  {
    id: 'g9', title: 'Bora: eigenaar-modus bereiken', area: 'business', category: 'revenue',
    icon: '🏢', color: '#6DB889', unit: '%', horizon: 'annual',
    targetNumber: 80, currentNumber: 35, status: 'active',
    xpReward: 350,
    whyItMatters: 'Jij focust op marketing, finance en community. Het team doet de rest. Dat is hefboom.',
    milestones: [
      { value: 40, label: 'Delegatie start',  emoji: '🌱' },
      { value: 60, label: 'Systemen werken',  emoji: '⚙️' },
      { value: 80, label: 'Eigenaar modus!',  emoji: '👑' },
    ],
  },

  // ── FINANCIEEL ──────────────────────────────────────────────────
  {
    id: 'g10', title: 'Appartement: €12.600 afbetaald', area: 'finance', category: 'personal-finance',
    icon: '🏠', color: '#C4935A', unit: '€', horizon: 'annual',
    targetNumber: 12600, currentNumber: 6300, status: 'active',
    xpReward: 300,
    whyItMatters: 'Elke maand €1.050 afbetaling. Eigendom opbouwen = vermogen bouwen.',
    milestones: [
      { value: 3150,  label: 'Q1',         emoji: '🌱' },
      { value: 6300,  label: 'Halverwege', emoji: '🏡' },
      { value: 12600, label: 'Jaar klaar!',emoji: '🏆' },
    ],
  },
  {
    id: 'g11', title: 'Woningfonds: €18.000 gespaard', area: 'finance', category: 'personal-finance',
    icon: '🏡', color: '#6DB889', unit: '€', horizon: 'annual',
    targetNumber: 18000, currentNumber: 3200, status: 'active',
    xpReward: 400,
    whyItMatters: 'Save €1,000-2,000 monthly for future home. Wealth is freedom.',
    milestones: [
      { value: 6000,  label: '6 maanden', emoji: '💰' },
      { value: 12000, label: 'Minimum',   emoji: '🏠' },
      { value: 18000, label: 'Target!',   emoji: '🌟' },
    ],
  },

  // ── LIFESTYLE & RELATIE ─────────────────────────────────────────
  {
    id: 'g12', title: '1 grote reis + 2-3 korte trips', area: 'lifestyle', category: 'travel',
    icon: '✈️', color: '#D4A96A', unit: 'trips', horizon: 'annual',
    targetNumber: 4, currentNumber: 0, status: 'active',
    xpReward: 250,
    whyItMatters: 'New environments = new ideas. Budget travel upfront = no guilt.',
    milestones: [
      { value: 1, label: 'Eerste trip!', emoji: '🌍' },
      { value: 2, label: 'Kortje erbij', emoji: '🗺️' },
      { value: 4, label: 'Reisdoel!',    emoji: '🏖️' },
    ],
  }
]

export const seedTasks: Task[] = [
  // ── Needle movers ──
  { id: 't1',  title: 'Sales outreaches CEO Lifestyle (5x)',   business: 'ceo-lifestyle', category: 'revenue',    priority: 1, needleMover: true,  status: 'today',     dueDate: '2026-06-16', createdAt: '2026-06-16', tags: [] },
  { id: 't2',  title: 'Warme gesprekken opvolgen',             business: 'ceo-lifestyle', category: 'revenue',    priority: 1, needleMover: true,  status: 'today',     dueDate: '2026-06-16', createdAt: '2026-06-16', tags: [] },
  { id: 't3',  title: 'Zichtbaarheidsactie (reel of story)',   business: 'ceo-lifestyle', category: 'content',    priority: 2, needleMover: true,  status: 'today',     dueDate: '2026-06-16', createdAt: '2026-06-16', tags: [] },
  { id: 't4',  title: 'CEO Lifestyle website: homepage copy',  business: 'ceo-lifestyle', category: 'revenue', priority: 1, needleMover: true,  status: 'this-week', dueDate: '2026-06-20', createdAt: '2026-06-15', tags: [] },
  { id: 't5',  title: 'CEO Lifestyle website: positionering',    business: 'ceo-lifestyle',   category: 'revenue', priority: 1, needleMover: true,  status: 'this-week', dueDate: '2026-06-19', createdAt: '2026-06-15', tags: [] },
  { id: 't6',  title: 'Bora: bezettingsgraad opvolgen',         business: 'bora',            category: 'revenue', priority: 2, needleMover: true,  status: 'this-week', dueDate: '2026-06-20', createdAt: '2026-06-14', tags: [] },
  { id: 't7',  title: 'Bora: bezettingsgraad opvolgen',        business: 'bora',          category: 'revenue', priority: 2, needleMover: true,  status: 'this-week', dueDate: '2026-06-18', createdAt: '2026-06-14', tags: [] },
  { id: 't8',  title: 'Bora: leadopvolging deze week',         business: 'bora',          category: 'revenue',    priority: 2, needleMover: false, status: 'this-week', dueDate: '2026-06-19', createdAt: '2026-06-13', tags: [] },
  { id: 't9',  title: 'Krachttraining',                        business: 'personal',      category: 'health',     priority: 1, needleMover: true,  status: 'today',     dueDate: '2026-06-16', createdAt: '2026-06-16', tags: [] },
  { id: 't10', title: 'Mealprep doen',                         business: 'personal',      category: 'health',     priority: 2, needleMover: false, status: 'this-week', dueDate: '2026-06-18', createdAt: '2026-06-15', tags: [] },
  { id: 't11', title: 'CEO Lifestyle: podcast opnemen',        business: 'ceo-lifestyle', category: 'content',    priority: 2, needleMover: false, status: 'this-week', dueDate: '2026-06-17', createdAt: '2026-06-13', tags: [] },
  { id: 't12', title: 'Bora: teamoverleg plannen',             business: 'bora',          category: 'admin',      priority: 3, needleMover: false, status: 'backlog',   dueDate: '2026-06-25', createdAt: '2026-06-10', tags: [] },
  { id: 't13', title: 'CEO Lifestyle: case study uitschrijven', business: 'ceo-lifestyle',   category: 'content',    priority: 2, needleMover: false, status: 'backlog',   dueDate: '2026-06-30', createdAt: '2026-06-10', tags: [] },
  { id: 't14', title: 'Write CEO Lifestyle newsletter',        business: 'ceo-lifestyle', category: 'content',    priority: 2, needleMover: false, status: 'this-week', dueDate: '2026-06-17', createdAt: '2026-06-12', tags: [] },
]

export const seedPlannerEvents: PlannerEvent[] = [
  { id: 'pe1',  date: '2026-06-09', title: 'Hyrox training',          type: 'sport',    color: 'sage' },
  { id: 'pe2',  date: '2026-06-10', title: 'CEO Club sessie',         type: 'business', color: 'rose' },
  { id: 'pe3',  date: '2026-06-12', title: 'Bora community dinner',   type: 'bora',     color: 'amber' },
  { id: 'pe4',  date: '2026-06-14', title: 'Bora team meeting',         type: 'bora',     color: 'amber' },
  { id: 'pe5',  date: '2026-06-16', title: 'Voka netwerking',         type: 'admin',    color: 'terracotta' },
  { id: 'pe6',  date: '2026-06-21', title: 'Hyrox race',              type: 'sport',    color: 'sage' },
  { id: 'pe7',  date: '2026-06-28', title: 'Q3 planning dag',         type: 'business', color: 'rose' },
  { id: 'pe8',  date: '2026-07-04', title: 'Vakantie start',          type: 'rest',     color: 'blush' },
  { id: 'pe9',  date: '2026-07-14', title: 'CEO Lifestyle lancering',  type: 'business', color: 'rose' },
  { id: 'pe10', date: '2026-09-01', title: 'Bora open day',           type: 'bora',     color: 'amber' },
]

export const idealWeekPreset: WeekBlock[] = [
  { id: 'w1',  day: 'mon', start: '08:00', end: '09:00', type: 'operator',  label: 'Bora Backup',               business: 'bora' },
  { id: 'w2',  day: 'mon', start: '09:00', end: '11:00', type: 'deep-work', label: 'CEO Lifestyle: sales + content', business: 'ceo-lifestyle' },
  { id: 'w3',  day: 'mon', start: '11:00', end: '12:00', type: 'sales',     label: 'Leads opvolgen',             business: 'ceo-lifestyle' },
  { id: 'w4',  day: 'mon', start: '14:00', end: '15:00', type: 'operator',  label: '1:1 Finance Bora',           business: 'bora' },
  { id: 'w5',  day: 'mon', start: '18:00', end: '19:30', type: 'training',  label: 'Gym 1' },
  { id: 'w6',  day: 'tue', start: '09:00', end: '11:00', type: 'deep-work', label: 'CEO Lifestyle: projectwerk',  business: 'ceo-lifestyle' },
  { id: 'w7',  day: 'tue', start: '11:00', end: '12:00', type: 'sales',     label: 'CEO Lifestyle: proposals',    business: 'ceo-lifestyle' },
  { id: 'w8',  day: 'tue', start: '13:00', end: '14:00', type: 'operator',  label: 'Bora check-in Imani',        business: 'bora' },
  { id: 'w9',  day: 'wed', start: '07:00', end: '08:00', type: 'operator',  label: 'BNI (evalueer dit!)',         business: 'bora' },
  { id: 'w10', day: 'wed', start: '09:00', end: '11:00', type: 'deep-work', label: 'Content batch-dag',          business: 'ceo-lifestyle' },
  { id: 'w11', day: 'thu', start: '09:00', end: '11:00', type: 'sales',     label: 'Sales + business review',    business: 'ceo-lifestyle' },
  { id: 'w12', day: 'thu', start: '13:00', end: '15:00', type: 'operator',  label: 'Bora: Laurence/Imani',       business: 'bora' },
  { id: 'w13', day: 'thu', start: '18:00', end: '19:30', type: 'training',  label: 'Gym 2' },
  { id: 'w14', day: 'fri', start: '09:00', end: '11:00', type: 'deep-work', label: 'CEO Lifestyle: strategie',   business: 'ceo-lifestyle' },
  { id: 'w15', day: 'fri', start: '11:00', end: '13:00', type: 'sales',     label: 'Finance + sales review',     business: 'ceo-lifestyle' },
  { id: 'w16', day: 'fri', start: '15:30', end: '19:30', type: 'recovery',  label: '🌿 RUST: bewaken' },
  { id: 'w17', day: 'sat', start: '08:30', end: '11:30', type: 'operator',  label: 'Voka (netwerking)',           business: 'bora' },
  { id: 'w18', day: 'sat', start: '13:00', end: '14:30', type: 'training',  label: 'Gym 3' },
  { id: 'w19', day: 'sun', start: '09:00', end: '10:00', type: 'deep-work', label: 'Goalsetting sessie' },
  { id: 'w20', day: 'sun', start: '15:00', end: '19:00', type: 'deep-work', label: 'Reset + Week Planning' },
]
