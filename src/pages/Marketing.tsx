import { useState, useMemo, useEffect, createContext, useContext } from 'react'
import { Sparkles, RefreshCw, Bookmark, BookmarkCheck, X, Copy, Check, ChevronDown, ChevronUp, Zap, Clock, Target, Users, TrendingUp, Film, LayoutGrid, MessageSquare, ExternalLink, FileText, Mail, ArrowUpRight, Heart, MessageCircle, Eye, Send, Bookmark as BookmarkIcon } from 'lucide-react'
import { useContentStore, useBoraContentStore, GOAL_COLOR, GOAL_LABEL } from '../store/contentStore'
import type { ContentOpportunity, ContentFormat, BusinessGoal, WeekPlanItem, ContentStore } from '../store/contentStore'
import { useTaskStore } from '../store/taskStore'
import { useHabitStore } from '../store/habitStore'
import { useSalesFinanceStore } from '../store/salesFinanceStore'
import { useLeadStore } from '../store/leadStore'
import { usePlannerStore } from '../store/plannerStore'
import { useRecurringInvoiceStore } from '../store/recurringInvoiceStore'
import { formatDistanceToNow, format, startOfWeek, endOfWeek, eachDayOfInterval } from 'date-fns'
import { nl, nlBE } from 'date-fns/locale'

type Business = 'lu' | 'bora'
const ContentStoreCtx = createContext<ContentStore>(null as any)
function useStore() { return useContext(ContentStoreCtx) }

// ── Windsor API ────────────────────────────────────────────────────────────
const WINDSOR_API_KEY = import.meta.env.VITE_WINDSOR_API_KEY as string | undefined
const INSTAGRAM_ACCOUNT = '17841401843538774'

async function fetchWindsor(fields: string[], dateFrom: string, dateTo: string) {
  if (!WINDSOR_API_KEY) throw new Error('NO_KEY')
  const params = new URLSearchParams({
    api_key: WINDSOR_API_KEY,
    date_from: dateFrom,
    date_to: dateTo,
    fields: fields.join(','),
    account_id: INSTAGRAM_ACCOUNT,
  })
  const res = await fetch(`https://connectors.windsor.ai/instagram?${params}`)
  if (!res.ok) throw new Error(`Windsor ${res.status}`)
  return res.json()
}

// ── Seed data (from last live fetch — refreshes when VITE_WINDSOR_API_KEY is set) ──
const SEED_DAILY = [
  { date: '2026-06-29', views: 3892, likes: 25, comments: 0, shares: 0, saves: 0, total_interactions: 31, reach: 1225, accounts_engaged: 17, follower_count: 0 },
  { date: '2026-06-30', views: 482,  likes: 16, comments: 0, shares: 0, saves: 0, total_interactions: 16, reach: 146,  accounts_engaged: 13, follower_count: 1 },
  { date: '2026-07-01', views: 778,  likes: 14, comments: 0, shares: 0, saves: 0, total_interactions: 16, reach: 330,  accounts_engaged: 14, follower_count: 2 },
  { date: '2026-07-02', views: 836,  likes: 9,  comments: 0, shares: 0, saves: 0, total_interactions: 11, reach: 543,  accounts_engaged: 10, follower_count: 1 },
  { date: '2026-07-03', views: 3827, likes: 71, comments: 2, shares: 1, saves: 0, total_interactions: 80, reach: 658,  accounts_engaged: 52, follower_count: 0 },
  { date: '2026-07-04', views: 2054, likes: 10, comments: 0, shares: 1, saves: 0, total_interactions: 14, reach: 931,  accounts_engaged: 13, follower_count: 1 },
  { date: '2026-07-05', views: 6374, likes: 24, comments: 0, shares: 3, saves: 0, total_interactions: 31, reach: 3450, accounts_engaged: 22, follower_count: 0 },
]

const SEED_POSTS = [
  {
    timestamp: '2026-07-03T13:49:07+0000',
    media_type: 'CAROUSEL_ALBUM',
    media_product_type: 'FEED',
    media_caption: "it's a good start of the summer 🤍🫜🐐👟🏊🏼‍♀️🫛🎙️🍸",
    media_like_count: 42,
    media_comments_count: 2,
    media_permalink: 'https://www.instagram.com/p/DaVT7QmCDU3/',
    media_engagement: 44,
    media_reach: 609,
    media_saved: 0,
    media_shares: 0,
    media_views: 1923,
  },
]

const SEED_ACCOUNT = { followers_count: 10285, media_count: 213, name: 'Laurence Uvin', username: 'laurenceuvin' }

// ── Helpers ────────────────────────────────────────────────────────────────
function fmt(n: number | null | undefined) {
  if (n == null) return '—'
  return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n)
}

function dayLabel(dateStr: string) {
  const d = new Date(dateStr)
  return format(d, 'EEE', { locale: nlBE }).slice(0, 2)
}

// ── Instagram Dashboard ────────────────────────────────────────────────────
function InstagramDashboard() {
  const [daily, setDaily] = useState(SEED_DAILY)
  const [posts, setPosts] = useState(SEED_POSTS)
  const [account] = useState(SEED_ACCOUNT)
  const [loading, setLoading] = useState(false)
  const [lastSync] = useState('maandag 6 juli')

  const totalViews = daily.reduce((s, d) => s + (d.views ?? 0), 0)
  const totalReach = daily.reduce((s, d) => s + (d.reach ?? 0), 0)
  const totalLikes = daily.reduce((s, d) => s + (d.likes ?? 0), 0)
  const totalInteractions = daily.reduce((s, d) => s + (d.total_interactions ?? 0), 0)
  const newFollowers = daily.reduce((s, d) => s + (d.follower_count ?? 0), 0)
  const maxViews = Math.max(...daily.map(d => d.views ?? 0), 1)
  const bestDay = daily.reduce((best, d) => (d.views ?? 0) > (best.views ?? 0) ? d : best, daily[0])

  async function refresh() {
    if (!WINDSOR_API_KEY) return
    setLoading(true)
    try {
      const today = format(new Date(), 'yyyy-MM-dd')
      const weekStart = format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd')
      const [dailyRes, postsRes] = await Promise.all([
        fetchWindsor(['date','views','likes','comments','shares','saves','total_interactions','reach','accounts_engaged','follower_count'], weekStart, today),
        fetchWindsor(['timestamp','media_type','media_caption','media_like_count','media_comments_count','media_permalink','media_product_type','media_engagement','media_reach','media_saved','media_shares','media_views'], weekStart, today),
      ])
      if (dailyRes.data) setDaily(dailyRes.data)
      if (postsRes.data) setPosts(postsRes.data)
    } finally {
      setLoading(false)
    }
  }

  // Suggestions based on data
  const suggestions = useMemo(() => {
    const today = new Date().getDay() // 0=sun, 1=mon...
    const todaySuggestion = today === 0 || today === 6
      ? 'Weekend: lifestyle of behind-the-scenes content presteert nu goed.'
      : today === 5
      ? 'Vrijdag: zaterdag is je sterkste dag — post vanavond zodat het bereik piekt.'
      : 'Doordeweeks: authority of educatieve content werkt het best.'

    return [
      `Zaterdag is je sterkste dag (${fmt(bestDay.views)} views) — plan je beste content dan.`,
      `Je carousel van 3 juli haalde ${fmt(posts[0]?.media_reach)} bereik bij slechts 1 post — meer variatie loont.`,
      todaySuggestion,
      'Saves zijn laag: voeg meer "sla dit op voor later" hooks toe aan je captions.',
    ]
  }, [daily, posts, bestDay])

  return (
    <div>
      {/* Account header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--color-subtle)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="0.5" fill="var(--color-subtle)"/></svg>
            <span style={{ fontSize: 11, color: 'var(--color-subtle)', fontFamily: 'Space Mono, monospace', letterSpacing: '0.12em' }}>
              @{account.username}
            </span>
            <a href="https://instagram.com/laurenceuvin" target="_blank" rel="noreferrer" style={{ color: 'var(--color-subtle)', display: 'flex' }}>
              <ArrowUpRight size={11} />
            </a>
          </div>
          <p style={{ fontSize: 10, color: 'var(--color-subtle)', fontFamily: 'Space Mono, monospace', letterSpacing: '0.10em' }}>
            WEEK 28 · DATA TOT EN MET {lastSync.toUpperCase()}
          </p>
        </div>
        {WINDSOR_API_KEY && (
          <button
            onClick={refresh}
            disabled={loading}
            className="btn-ghost"
            style={{ gap: 5, fontSize: 9 }}
          >
            <RefreshCw size={10} style={loading ? { animation: 'spin 1s linear infinite' } : {}} />
            Vernieuwen
          </button>
        )}
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 1, marginBottom: 28, border: '1px solid var(--color-border)', borderRadius: 16, overflow: 'hidden' }}>
        {[
          { label: 'VOLGERS', value: fmt(account.followers_count), sub: `+${newFollowers} deze week` },
          { label: 'POSTS', value: String(posts.length), sub: 'deze week' },
          { label: 'VIEWS', value: fmt(totalViews), sub: 'deze week' },
          { label: 'BEREIK', value: fmt(totalReach), sub: 'unieke accounts' },
          { label: 'LIKES', value: fmt(totalLikes), sub: `${fmt(totalInteractions)} interacties` },
        ].map((kpi, i) => (
          <div key={i} style={{
            padding: '18px 16px',
            background: 'var(--color-card)',
            borderRight: i < 4 ? '1px solid var(--color-border)' : 'none',
          }}>
            <p style={{ fontSize: 9, fontFamily: 'Space Mono, monospace', letterSpacing: '0.18em', color: 'var(--color-subtle)', marginBottom: 8, textTransform: 'uppercase' }}>
              {kpi.label}
            </p>
            <p style={{ fontSize: 22, fontWeight: 700, color: 'var(--color-ink)', letterSpacing: '-0.04em', lineHeight: 1, marginBottom: 4, fontFamily: 'Archivo, sans-serif' }}>
              {kpi.value}
            </p>
            <p style={{ fontSize: 10, color: 'var(--color-subtle)' }}>{kpi.sub}</p>
          </div>
        ))}
      </div>

      {/* Daily chart */}
      <div style={{ marginBottom: 28 }}>
        <p className="section-label" style={{ marginBottom: 14 }}>Views per dag</p>
        <div style={{ background: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: 16, padding: '20px 20px 14px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 80 }}>
            {daily.map((d, i) => {
              const pct = (d.views ?? 0) / maxViews
              const isToday = d.date === format(new Date(), 'yyyy-MM-dd')
              const isBest = d.date === bestDay.date
              return (
                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, height: '100%', justifyContent: 'flex-end' }}>
                  <span style={{ fontSize: 9, color: 'var(--color-subtle)', fontFamily: 'Space Mono, monospace' }}>
                    {pct > 0.3 ? fmt(d.views) : ''}
                  </span>
                  <div style={{
                    width: '100%',
                    height: `${Math.max(pct * 100, 4)}%`,
                    background: isBest ? 'var(--color-ink)' : isToday ? 'var(--color-muted)' : 'var(--color-border)',
                    borderRadius: '2px 2px 0 0',
                    transition: 'height 600ms cubic-bezier(.16,1,.3,1)',
                    opacity: isToday ? 0.5 : 1,
                  }} />
                </div>
              )
            })}
          </div>
          <div style={{ display: 'flex', gap: 6, marginTop: 8, borderTop: '1px solid var(--color-border)', paddingTop: 10 }}>
            {daily.map((d, i) => (
              <div key={i} style={{ flex: 1, textAlign: 'center', fontSize: 9, color: 'var(--color-subtle)', fontFamily: 'Space Mono, monospace', textTransform: 'uppercase' }}>
                {dayLabel(d.date)}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Posts this week */}
      <div style={{ marginBottom: 28 }}>
        <p className="section-label" style={{ marginBottom: 14 }}>Posts deze week</p>
        {posts.length === 0 ? (
          <div style={{ padding: '32px', background: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: 16, textAlign: 'center' }}>
            <p style={{ fontSize: 13, color: 'var(--color-subtle)' }}>Geen posts deze week.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {posts.map((post, i) => {
              const d = new Date(post.timestamp)
              const engRate = post.media_reach > 0 ? ((post.media_engagement / post.media_reach) * 100).toFixed(1) : '0'
              const typeLabel = post.media_type === 'CAROUSEL_ALBUM' ? 'Carousel' : post.media_type === 'VIDEO' ? 'Video' : post.media_type === 'REEL' ? 'Reel' : 'Post'
              return (
                <div key={i} style={{ background: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: 16, overflow: 'hidden' }}>
                  <div style={{ padding: '16px 18px', display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                    {/* Date block */}
                    <div style={{ flexShrink: 0, width: 40, textAlign: 'center', paddingTop: 2 }}>
                      <p style={{ fontSize: 18, fontWeight: 700, color: 'var(--color-ink)', letterSpacing: '-0.04em', lineHeight: 1, fontFamily: 'Archivo, sans-serif' }}>
                        {format(d, 'd')}
                      </p>
                      <p style={{ fontSize: 9, color: 'var(--color-subtle)', fontFamily: 'Space Mono, monospace', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                        {format(d, 'MMM', { locale: nlBE })}
                      </p>
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                        <span style={{ fontSize: 9, fontFamily: 'Space Mono, monospace', letterSpacing: '0.14em', color: 'var(--color-subtle)', textTransform: 'uppercase' }}>
                          {typeLabel}
                        </span>
                        <span style={{ fontSize: 9, color: 'var(--color-subtle)' }}>·</span>
                        <span style={{ fontSize: 9, color: 'var(--color-subtle)' }}>{engRate}% engagement</span>
                        <a href={post.media_permalink} target="_blank" rel="noreferrer" style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 3, fontSize: 10, color: 'var(--color-subtle)', textDecoration: 'none' }}>
                          Bekijk <ArrowUpRight size={10} />
                        </a>
                      </div>
                      <p style={{ fontSize: 13, color: 'var(--color-ink)', lineHeight: 1.5, marginBottom: 12, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const }}>
                        {post.media_caption}
                      </p>

                      {/* Metrics */}
                      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                        {[
                          { icon: Eye, label: 'Views', val: post.media_views },
                          { icon: Users, label: 'Bereik', val: post.media_reach },
                          { icon: Heart, label: 'Likes', val: post.media_like_count },
                          { icon: MessageCircle, label: 'Comments', val: post.media_comments_count },
                          { icon: Send, label: 'Shares', val: post.media_shares },
                          { icon: BookmarkIcon, label: 'Saves', val: post.media_saved },
                        ].map(({ icon: Icon, label, val }) => (
                          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <Icon size={10} color="var(--color-subtle)" />
                            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-ink)', fontFamily: 'Archivo, sans-serif' }}>{fmt(val)}</span>
                            <span style={{ fontSize: 10, color: 'var(--color-subtle)' }}>{label}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Suggestions */}
      <div>
        <p className="section-label" style={{ marginBottom: 14 }}>Suggesties voor vandaag</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 1, border: '1px solid var(--color-border)', borderRadius: 16, overflow: 'hidden' }}>
          {suggestions.map((s, i) => (
            <div key={i} style={{ padding: '14px 18px', background: 'var(--color-card)', borderBottom: i < suggestions.length - 1 ? '1px solid var(--color-border)' : 'none', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <span style={{ fontSize: 9, fontFamily: 'Space Mono, monospace', color: 'var(--color-subtle)', marginTop: 2, flexShrink: 0 }}>
                {String(i + 1).padStart(2, '0')}
              </span>
              <p style={{ fontSize: 13, color: 'var(--color-muted)', lineHeight: 1.55 }}>{s}</p>
            </div>
          ))}
        </div>

        {!WINDSOR_API_KEY && (
          <div style={{ marginTop: 12, padding: '12px 16px', background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 6 }}>
            <p style={{ fontSize: 11, color: 'var(--color-subtle)', lineHeight: 1.6 }}>
              Data is geseed van de laatste sync (maandag 6 juli).{' '}
              <span style={{ color: 'var(--color-muted)' }}>
                Voeg <code style={{ fontFamily: 'Space Mono, monospace', fontSize: 10 }}>VITE_WINDSOR_API_KEY=...</code> toe aan <code style={{ fontFamily: 'Space Mono, monospace', fontSize: 10 }}>.env</code> voor live sync.
              </span>
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Content AI ─────────────────────────────────────────────────────────────
function gatherContext() {
  const { tasks } = useTaskStore.getState()
  const { habits, getDailyScore } = useHabitStore.getState()
  const { records } = useSalesFinanceStore.getState()
  const { leads, activities } = useLeadStore.getState()
  const { goals } = usePlannerStore.getState()
  const { items: recurringItems } = useRecurringInvoiceStore.getState()

  const today = new Date().toISOString().split('T')[0]
  const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0]

  return {
    date: today,
    recentCompletedTasks: tasks.filter(t => t.completedAt && t.completedAt >= sevenDaysAgo).slice(0, 8).map(t => t.title),
    activeNeedleMovers: tasks.filter(t => t.needleMover && t.status !== 'done' && t.status !== 'cancelled').slice(0, 5).map(t => t.title),
    habitScore: getDailyScore(today),
    activeHabits: habits.filter(h => h.active).map(h => h.title).slice(0, 8),
    recentWins: records.filter(r => r.wonAt && r.wonAt.slice(0, 10) >= sevenDaysAgo).slice(0, 5).map(r => `${r.clientName} — ${r.service}`),
    activeClients: recurringItems.filter(i => i.active).map(i => `${i.clientName}: ${i.service}`),
    activeGoals: goals.filter(g => g.status === 'active').slice(0, 5).map(g => `${g.title}: ${g.currentNumber}/${g.targetNumber} ${g.unit || ''}`),
    recentActivities: activities.filter(a => a.createdAt >= sevenDaysAgo).slice(0, 8).map(a => a.content),
    hotLeads: leads.filter(l => l.temperature === 'Hot' && l.status !== 'won' && l.status !== 'lost').slice(0, 4).map(l => `${l.name} — ${l.program}`),
  }
}

const SYSTEM_PROMPTS: Record<Business, string> = {
  lu: `Je bent de persoonlijke AI Content Strategist van Laurence Uvin (@laurenceuvin op Instagram), embedded in haar Personal Operating System.

Laurence is een Belgische ondernemer, coach en content creator. Ze runt:
- CEO Lifestyle: premium business coaching (1:1, CEO Club, CMO retainer)
- Bora: sportschool/wellness met kinderopvang en community

Content thema's: entrepreneurship, high performance, business systemen, AI, automatisering, marketing, personal branding, CEO lifestyle, wealth building, wellness, fitness, Hyrox, productiviteit, reizen, behind the scenes van het bouwen van bedrijven.

Doelgroep: ambitieuze ondernemers.
Missie: educeren, inspireren, beliefs uitdagen, autoriteit bouwen, vertrouwen genereren, premium klanten aantrekken.

NOOIT generieke motivationele content. Altijd specifiek, authentiek, geankerd in wat er écht in haar OS gebeurt.`,

  bora: `Je bent de AI Content Strategist voor Bora (@boracoworking op Instagram), embedded in het OS van Laurence Uvin.

Bora is een premium sport- en wellnessconcept met kinderopvang en community. Doelgroep: actieve ouders, ondernemers, professionals die sporten, bewegen en verbinding zoeken.

Content thema's: sport & beweging, community moments, kinderopvang, wellness, sfeer in de ruimte, member spotlights, events, behind the scenes, gezond leven, work-life balance.

Toon: warm, energiek, inclusief. Geen hard-sell. Authentieke community content die mensen doet voelen dat Bora voor hen is.

NOOIT generieke fitnessmotivatie. Altijd geankerd in wat er echt bij Bora gebeurt.`,
}

const BORA_WEEK_THEMES = ['community', 'sport', 'kinderopvang', 'wellness', 'sfeer', 'member', 'event', 'behind-scenes']

async function generateOpportunities(business: Business): Promise<void> {
  const ctx = gatherContext()
  const store = business === 'bora' ? useBoraContentStore : useContentStore
  const { setLoading, setResult, setError } = store.getState()
  setLoading(true)

  const userPrompt = `OS Context op ${ctx.date}:
${JSON.stringify(ctx, null, 2)}

Genereer op basis van deze context 7 concrete content opportunities. Return ALLEEN geldig JSON zonder markdown of uitleg:

{
  "opportunities": [
    {
      "id": "uniek-id",
      "title": "Pakkende, specifieke content titel",
      "whyNow": "Waarom dit NU relevant is — max 1 zin, geankerd in OS-data",
      "priority": "high|medium|low",
      "businessGoal": "authority|education|storytelling|lifestyle|sales|behind-scenes|mindset|health|ai|travel",
      "targetAudience": "Specifiek segment",
      "estimatedEngagement": "high|medium|low",
      "recordingTime": "5 min",
      "difficulty": "easy|medium|hard",
      "cta": "Specifieke CTA",
      "formats": ["reel"],
      "trigger": "Welk OS-gegeven triggerde dit",
      "hooks": ["Hook 1", "Hook 2", "Hook 3"],
      "talkingPoints": ["Punt 1", "Punt 2", "Punt 3", "Punt 4"],
      "caption": "Volledige Instagram caption met hashtags"
    }
  ],
  "weekPlan": [
    { "day": "Maandag", "contentType": "Authority", "topic": "Specifiek topic", "format": "reel", "goal": "authority" },
    { "day": "Dinsdag", "contentType": "Education", "topic": "Specifiek topic", "format": "carousel", "goal": "education" },
    { "day": "Woensdag", "contentType": "Lifestyle", "topic": "Specifiek topic", "format": "story", "goal": "lifestyle" },
    { "day": "Donderdag", "contentType": "Storytelling", "topic": "Specifiek topic", "format": "reel", "goal": "storytelling" },
    { "day": "Vrijdag", "contentType": "Behind the scenes", "topic": "Specifiek topic", "format": "reel", "goal": "behind-scenes" }
  ],
  "insights": [
    "Proactieve content-aanbeveling in 1 zin",
    "Tweede aanbeveling",
    "Derde aanbeveling"
  ]
}`

  try {
    const response = await fetch('/.netlify/functions/anthropic', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 4000,
        system: SYSTEM_PROMPTS[business],
        messages: [{ role: 'user', content: userPrompt }],
      }),
    })
    if (!response.ok) throw new Error(`API ${response.status}`)
    const data = await response.json()
    const text: string = data.content?.[0]?.text ?? ''
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error('Geen JSON in respons')
    const result = JSON.parse(jsonMatch[0])
    setResult(result.opportunities ?? [], result.weekPlan ?? [], result.insights ?? [])
  } catch (e: any) {
    setError(e.message ?? 'Onbekende fout')
  }
}

async function generateScript(opp: ContentOpportunity, business: Business = 'lu'): Promise<string> {
  const name = business === 'bora' ? 'Bora' : 'Laurence'
  const res = await fetch('/.netlify/functions/anthropic', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6', max_tokens: 1200, system: SYSTEM_PROMPTS[business],
      messages: [{ role: 'user', content: `Schrijf een volledig Reel script voor ${name}:\n\nTitel: ${opp.title}\nHook: ${opp.hooks[0]}\nTalking points: ${opp.talkingPoints.join(' / ')}\nCTA: ${opp.cta}\n\nStructuur: HOOK — eerste 3 seconden. BODY — kern boodschap. CTA — laatste 5 seconden.\nSchrijf direct, authentiek.` }],
    }),
  })
  if (!res.ok) throw new Error(`API ${res.status}`)
  const data = await res.json()
  return data.content?.[0]?.text ?? ''
}

const FORMAT_ICON: Record<ContentFormat, typeof Film> = { reel: Film, carousel: LayoutGrid, story: MessageSquare, linkedin: ExternalLink, newsletter: Mail, thread: FileText }
const FORMAT_LABEL: Record<ContentFormat, string> = { reel: 'Reel', carousel: 'Carousel', story: 'Story', linkedin: 'LinkedIn', newsletter: 'Newsletter', thread: 'Thread' }
const PRIORITY_COLOR: Record<string, string> = { high: 'var(--color-brand-green)', medium: 'var(--color-brand-orange)', low: 'var(--color-border)' }
const DIFFICULTY_LABEL: Record<string, string> = { easy: 'Makkelijk', medium: 'Gemiddeld', hard: 'Intensief' }
const ENGAGEMENT_LABEL: Record<string, string> = { high: 'Hoog bereik', medium: 'Gemiddeld bereik', low: 'Niche bereik' }

function CopyButton({ text, small }: { text: string; small?: boolean }) {
  const [copied, setCopied] = useState(false)
  return (
    <button onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1500) }}
      style={{ display: 'flex', alignItems: 'center', gap: 4, padding: small ? '3px 8px' : '4px 10px', borderRadius: 4, border: '1px solid var(--color-border)', background: 'transparent', color: copied ? 'var(--color-brand-green)' : 'var(--color-subtle)', fontSize: 11, cursor: 'pointer', fontFamily: 'inherit', transition: 'color 120ms', whiteSpace: 'nowrap' }}>
      {copied ? <Check size={10} /> : <Copy size={10} />}
      {copied ? 'Gekopieerd' : 'Kopieer'}
    </button>
  )
}

function OpportunityCard({ opp, business }: { opp: ContentOpportunity; business: Business }) {
  const { savedIds, toggleSaved, dismiss, expandedScript, scriptLoading, setScript, setScriptLoading } = useStore()
  const [expanded, setExpanded] = useState(false)
  const [showAllHooks, setShowAllHooks] = useState(false)
  const isSaved = savedIds.has(opp.id)
  const goalColor = GOAL_COLOR[opp.businessGoal] ?? 'var(--color-accent)'
  const script = expandedScript[opp.id]
  const isScriptLoading = scriptLoading[opp.id]

  const handleScript = async () => {
    setScriptLoading(opp.id, true)
    try { setScript(opp.id, await generateScript(opp, business)) }
    finally { setScriptLoading(opp.id, false) }
  }

  return (
    <div className="anim-fade-up" style={{ background: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: 16, overflow: 'hidden', borderLeft: `2px solid ${PRIORITY_COLOR[opp.priority]}` }}>
      <div style={{ padding: '18px 20px 14px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 9, padding: '2px 8px', borderRadius: 2, background: `${goalColor}15`, color: goalColor, letterSpacing: '0.14em', border: `1px solid ${goalColor}28`, fontFamily: 'Space Mono, monospace', textTransform: 'uppercase' }}>
              {GOAL_LABEL[opp.businessGoal]}
            </span>
            <span style={{ fontSize: 10, color: 'var(--color-subtle)', display: 'flex', alignItems: 'center', gap: 3 }}>
              <Clock size={9} /> {opp.recordingTime}
            </span>
            <span style={{ fontSize: 10, color: 'var(--color-subtle)' }}>· {DIFFICULTY_LABEL[opp.difficulty]}</span>
          </div>
          <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
            <button onClick={() => toggleSaved(opp.id)} style={{ width: 26, height: 26, borderRadius: 4, border: '1px solid var(--color-border)', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: isSaved ? goalColor : 'var(--color-subtle)' }}>
              {isSaved ? <BookmarkCheck size={11} /> : <Bookmark size={11} />}
            </button>
            <button onClick={() => dismiss(opp.id)} style={{ width: 26, height: 26, borderRadius: 4, border: '1px solid var(--color-border)', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-subtle)' }}>
              <X size={11} />
            </button>
          </div>
        </div>
        <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-ink)', lineHeight: 1.3, marginBottom: 6, letterSpacing: '-0.02em', fontFamily: 'Archivo, sans-serif' }}>{opp.title}</h3>
        <p style={{ fontSize: 12, color: 'var(--color-muted)', lineHeight: 1.55, marginBottom: 12 }}>{opp.whyNow}</p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexWrap: 'wrap', marginBottom: 8 }}>
          {opp.formats.map(f => { const Icon = FORMAT_ICON[f]; return (
            <span key={f} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, padding: '2px 8px', borderRadius: 3, border: '1px solid var(--color-border)', color: 'var(--color-muted)' }}>
              <Icon size={9} /> {FORMAT_LABEL[f]}
            </span>
          )})}
          <span style={{ fontSize: 10, color: 'var(--color-subtle)' }}>{ENGAGEMENT_LABEL[opp.estimatedEngagement]}</span>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 10, color: 'var(--color-subtle)' }}><Users size={9} /> {opp.targetAudience}</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 10, color: 'var(--color-subtle)' }}><Target size={9} /> {opp.cta}</span>
        </div>
      </div>

      <button onClick={() => setExpanded(v => !v)}
        style={{ width: '100%', padding: '8px 20px', background: 'var(--color-surface)', border: 'none', borderTop: '1px solid var(--color-border)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'var(--color-muted)', fontSize: 11, fontFamily: 'inherit' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <Zap size={10} color={goalColor} />
          {expanded ? 'Verberg content' : 'Hooks · Talking points · Caption · Script'}
        </span>
        {expanded ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
      </button>

      {expanded && (
        <div style={{ padding: '18px 20px', borderTop: '1px solid var(--color-border)', display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Hooks */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <p className="section-label">Hooks</p>
              {opp.hooks.length > 1 && <button onClick={() => setShowAllHooks(v => !v)} style={{ fontSize: 10, color: 'var(--color-subtle)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>{showAllHooks ? 'Minder' : `Alle ${opp.hooks.length}`}</button>}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {(showAllHooks ? opp.hooks : opp.hooks.slice(0, 1)).map((hook, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10, padding: '10px 12px', borderRadius: 4, background: i === 0 ? `${goalColor}08` : 'var(--color-surface)', border: `1px solid ${i === 0 ? `${goalColor}22` : 'var(--color-border)'}` }}>
                  <p style={{ fontSize: 13, color: 'var(--color-ink)', lineHeight: 1.45, fontWeight: i === 0 ? 600 : 400, flex: 1 }}>{hook}</p>
                  <CopyButton text={hook} small />
                </div>
              ))}
            </div>
          </div>
          {/* Talking points */}
          <div>
            <p className="section-label" style={{ marginBottom: 8 }}>Talking points</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              {opp.talkingPoints.map((pt, i) => (
                <div key={i} style={{ display: 'flex', gap: 10 }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: goalColor, marginTop: 2, minWidth: 16, fontFamily: 'Space Mono, monospace' }}>{i + 1}.</span>
                  <p style={{ fontSize: 13, color: 'var(--color-muted)', lineHeight: 1.45 }}>{pt}</p>
                </div>
              ))}
            </div>
          </div>
          {/* Caption */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <p className="section-label">Caption</p>
              <CopyButton text={opp.caption} />
            </div>
            <div style={{ padding: '12px 14px', borderRadius: 4, background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
              <p style={{ fontSize: 12, color: 'var(--color-muted)', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{opp.caption}</p>
            </div>
          </div>
          {/* Script */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <p className="section-label">Reel script</p>
              {script && <CopyButton text={script} />}
            </div>
            {script ? (
              <div style={{ padding: '14px 16px', borderRadius: 4, background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
                <p style={{ fontSize: 13, color: 'var(--color-ink)', lineHeight: 1.75, whiteSpace: 'pre-wrap' }}>{script}</p>
              </div>
            ) : (
              <button onClick={handleScript} disabled={!!isScriptLoading}
                style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '12px 16px', borderRadius: 4, border: `1px dashed ${goalColor}50`, background: `${goalColor}06`, color: goalColor, fontSize: 12, cursor: isScriptLoading ? 'default' : 'pointer', fontFamily: 'inherit', justifyContent: 'center', transition: 'all 150ms' }}>
                {isScriptLoading ? <><RefreshCw size={11} style={{ animation: 'spin 1s linear infinite' }} /> Script genereren…</> : <><Film size={11} /> Genereer volledig Reel script</>}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function WeekPlan({ plan }: { plan: WeekPlanItem[] }) {
  if (plan.length === 0) return null
  return (
    <div style={{ marginBottom: 28 }}>
      <p className="section-label" style={{ marginBottom: 12 }}>Weekplan</p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 1, border: '1px solid var(--color-border)', borderRadius: 16, overflow: 'hidden' }}>
        {plan.slice(0, 5).map(item => {
          const color = GOAL_COLOR[item.goal as BusinessGoal] ?? 'var(--color-accent)'
          const Icon = FORMAT_ICON[item.format as ContentFormat] ?? Film
          return (
            <div key={item.day} style={{ padding: '14px 12px', background: 'var(--color-card)', borderRight: '1px solid var(--color-border)', borderTop: `2px solid ${color}` }}>
              <p style={{ fontSize: 9, fontFamily: 'Space Mono, monospace', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--color-subtle)', marginBottom: 6 }}>{item.day}</p>
              <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-ink)', lineHeight: 1.35, marginBottom: 8 }}>{item.topic}</p>
              <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 10, color }}><Icon size={9} /> {FORMAT_LABEL[item.format as ContentFormat] ?? item.format}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function ContentAI({ business }: { business: Business }) {
  const { opportunities, weekPlan, insights, lastGenerated, loading, error, savedIds } = useStore()
  const [activeFilter, setActiveFilter] = useState<BusinessGoal | 'all' | 'saved'>('all')

  const filtered = useMemo(() => {
    if (activeFilter === 'saved') return opportunities.filter(o => savedIds.has(o.id))
    if (activeFilter === 'all') return opportunities
    return opportunities.filter(o => o.businessGoal === activeFilter)
  }, [opportunities, activeFilter, savedIds])

  const usedGoals = useMemo(() => [...new Set(opportunities.map(o => o.businessGoal))], [opportunities])
  const lastGeneratedLabel = lastGenerated ? formatDistanceToNow(new Date(lastGenerated), { addSuffix: true, locale: nl }) : null
  const hasContent = opportunities.length > 0

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16, marginBottom: 24 }}>
        <p style={{ fontSize: 12, color: 'var(--color-subtle)' }}>
          {lastGeneratedLabel ? `Bijgewerkt ${lastGeneratedLabel}` : 'Scant je OS — taken, deals, habits, doelen — en genereert authentieke content ideeën.'}
        </p>
        <button onClick={() => generateOpportunities(business)} disabled={loading} className="btn-ghost" style={{ whiteSpace: 'nowrap' }}>
          {loading ? <><RefreshCw size={11} style={{ animation: 'spin 1s linear infinite' }} /> Genereren…</> : <><Sparkles size={11} /> {hasContent ? 'Vernieuwen' : 'Genereer ideeën'}</>}
        </button>
      </div>

      {insights.length > 0 && (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 20 }}>
          {insights.map((insight, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '8px 12px', borderRadius: 14, background: 'var(--color-card)', border: '1px solid var(--color-border)', flex: '1 1 280px' }}>
              <TrendingUp size={10} color="var(--color-brand-blue)" style={{ marginTop: 2, flexShrink: 0 }} />
              <p style={{ fontSize: 12, color: 'var(--color-muted)', lineHeight: 1.5 }}>{insight}</p>
            </div>
          ))}
        </div>
      )}

      {error && (
        <div style={{ padding: '12px 16px', borderRadius: 14, background: 'rgba(160,96,96,0.08)', border: '1px solid rgba(160,96,96,0.2)', marginBottom: 16, fontSize: 12, color: 'var(--color-red)' }}>
          {error === 'NO_KEY' ? 'Voeg VITE_ANTHROPIC_API_KEY toe aan je .env en herstart.' : `Fout: ${error}`}
        </div>
      )}

      {!hasContent ? (
        <div style={{ textAlign: 'center', padding: '64px 0' }}>
          <div style={{ width: 48, height: 48, borderRadius: 14, background: 'var(--color-surface)', border: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <Sparkles size={18} color="var(--color-subtle)" />
          </div>
          <h3 style={{ fontSize: 17, fontWeight: 700, color: 'var(--color-ink)', marginBottom: 8, letterSpacing: '-0.02em', fontFamily: 'Archivo, sans-serif' }}>
            {loading ? 'Scant je OS…' : 'Klaar om content te genereren'}
          </h3>
          <p style={{ fontSize: 12, color: 'var(--color-subtle)', lineHeight: 1.65, maxWidth: 360, margin: '0 auto 24px' }}>
            {loading ? 'De AI scant je taken, deals, habits en doelen.' : 'Elke deal, habit, taak en goal in je OS is potentieel content.'}
          </p>
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', gap: 5 }}>
              {[0,1,2].map(i => <div key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--color-subtle)', animation: `pulse-dot 1.2s ${i*0.2}s ease-in-out infinite` }} />)}
            </div>
          ) : (
            <button onClick={() => generateOpportunities(business)} className="btn-primary">
              <Sparkles size={12} /> Genereer content kansen
            </button>
          )}
        </div>
      ) : (
        <>
          <WeekPlan plan={weekPlan} />
          <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 16 }}>
            {(['all', ...usedGoals, savedIds.size > 0 ? 'saved' : null].filter(Boolean) as ('all' | BusinessGoal | 'saved')[]).map(f => {
              const isActive = activeFilter === f
              const color = f === 'all' || f === 'saved' ? 'var(--color-ink)' : GOAL_COLOR[f as BusinessGoal]
              const label = f === 'all' ? `Alles (${opportunities.length})` : f === 'saved' ? `Opgeslagen (${savedIds.size})` : GOAL_LABEL[f as BusinessGoal]
              return (
                <button key={f} onClick={() => setActiveFilter(f)} style={{ padding: '5px 12px', borderRadius: 3, fontSize: 11, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 130ms', border: `1px solid ${isActive ? color : 'var(--color-border)'}`, background: isActive ? `${color}12` : 'transparent', color: isActive ? color : 'var(--color-muted)' }}>
                  {label}
                </button>
              )
            })}
          </div>
          <p className="section-label" style={{ marginBottom: 12 }}>
            {activeFilter === 'saved' ? 'Opgeslagen' : activeFilter === 'all' ? 'Beste kansen nu' : GOAL_LABEL[activeFilter as BusinessGoal]}
          </p>
          {filtered.length === 0 ? (
            <p style={{ fontSize: 13, color: 'var(--color-subtle)', textAlign: 'center', padding: '40px 0' }}>
              {activeFilter === 'saved' ? 'Nog niets opgeslagen.' : 'Geen ideeën voor dit filter.'}
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {filtered.map(opp => <OpportunityCard key={opp.id} opp={opp} business={business} />)}
            </div>
          )}
          <div style={{ textAlign: 'center', marginTop: 28, paddingTop: 20, borderTop: '1px solid var(--color-border)' }}>
            <button onClick={() => generateOpportunities(business)} disabled={loading} style={{ fontSize: 11, color: 'var(--color-subtle)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <RefreshCw size={10} /> Nieuwe kansen genereren
            </button>
          </div>
        </>
      )}
    </>
  )
}

// ── Main ───────────────────────────────────────────────────────────────────
export function Marketing({ business = 'lu' }: { business?: Business } = {}) {
  const luStore = useContentStore()
  const boraStore = useBoraContentStore()
  const activeStore = business === 'bora' ? boraStore : luStore
  const [tab, setTab] = useState<'instagram' | 'content'>(business === 'bora' ? 'content' : 'instagram')

  return (
    <ContentStoreCtx.Provider value={activeStore}>
    <div style={{ maxWidth: 860, margin: '0 auto' }}>
      <style>{`
        @keyframes pulse-dot { 0%,100%{opacity:.3;transform:scale(.8)} 50%{opacity:1;transform:scale(1.1)} }
        @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
      `}</style>

      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.04em', color: 'var(--color-ink)', lineHeight: 1, marginBottom: 16, fontFamily: 'Archivo, sans-serif' }}>
          Content
        </h1>
        <div className="tab-bar" style={{ width: 'fit-content' }}>
          {business === 'lu' && (
            <button className={`tab-btn${tab === 'instagram' ? ' active' : ''}`} onClick={() => setTab('instagram')}>
              Instagram
            </button>
          )}
          <button className={`tab-btn${tab === 'content' ? ' active' : ''}`} onClick={() => setTab('content')}>
            Content AI
          </button>
        </div>
      </div>

      {tab === 'instagram' ? <InstagramDashboard /> : <ContentAI business={business} />}
    </div>
    </ContentStoreCtx.Provider>
  )
}
