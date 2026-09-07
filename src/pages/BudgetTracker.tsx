import { useState } from 'react'
import { useFinanceStore } from '../store/financeStore'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend } from 'recharts'
import { format } from 'date-fns'
import { nlBE } from 'date-fns/locale'

const MONTHS_NL = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Aug','Sep','Okt','Nov','Dec']
const bizLabels: Record<string, string> = { 'ceo-lifestyle': 'CEO Lifestyle', 'bora': 'Bora' }

const C = {
  grid: 'rgba(255,255,255,0.05)',
  axis: 'var(--color-muted)',
  text: 'var(--color-ink)',
  muted: 'var(--color-muted)',
  subtle: 'var(--color-subtle)',
  green: 'var(--color-brand-green)',
  orange: 'var(--color-brand-orange)',
  blue: 'var(--color-brand-blue)',
  accent: 'var(--color-accent)',
  border: 'var(--color-border)',
  tooltip: { fontSize: 11, borderRadius: 8, border: '1px solid var(--color-border)', background: 'rgba(10,10,15,0.95)', color: 'var(--color-ink)' },
}

function Card({ children, className = '', style }: { children: React.ReactNode; className?: string; style?: React.CSSProperties }) {
  return <div className={`card ${className}`} style={style}>{children}</div>
}

function PeriodBudget() {
  const { expenses, getMTDRevenue, getMonthExpenses } = useFinanceStore()
  const today = new Date()
  const monthStr = format(today, 'yyyy-MM')
  const monthName = format(today, 'MMMM yyyy', { locale: nlBE })
  const mtdRevenue = getMTDRevenue()
  const mtdExpenses = getMonthExpenses(monthStr)
  const profit = mtdRevenue - mtdExpenses
  const savings = Math.round(profit * 0.2)

  const fixedExpenses = expenses.filter(e => e.recurring && e.date.startsWith(monthStr))
  const varExpenses = expenses.filter(e => !e.recurring && e.date.startsWith(monthStr))

  const spendingData = ['software','marketing','team','rent','education','travel'].map(cat => ({
    name: cat.charAt(0).toUpperCase() + cat.slice(1),
    value: expenses.filter(e => e.category === cat).reduce((s,e) => s + e.amount, 0)
  })).filter(d => d.value > 0)

  const usedPct = mtdRevenue ? Math.round((mtdExpenses / mtdRevenue) * 100) : 0
  const savingsPct = mtdRevenue ? Math.round((savings / mtdRevenue) * 100) : 0
  const unusedPct = Math.max(0, 100 - usedPct - savingsPct)

  return (
    <div>
      <div className="flex items-center justify-between" style={{ marginBottom: 32 }}>
        <h3 style={{ fontSize: 20, fontWeight: 600, color: C.text }}>Budget {monthName}</h3>
      </div>
      <div className="grid grid-cols-4" style={{ gap: 16, marginBottom: 24 }}>
        {[
          { label: 'Revenue',  value: `€${mtdRevenue.toLocaleString('nl-BE')}`, color: C.green },
          { label: 'Costs', value: `€${mtdExpenses.toLocaleString('nl-BE')}`, color: C.orange },
          { label: 'Profit',  value: `€${profit.toLocaleString('nl-BE')}`, color: C.text },
          { label: 'Savings', value: `€${savings.toLocaleString('nl-BE')}`, color: C.blue },
        ].map(s => (
          <Card key={s.label} style={{ padding: '28px 32px', textAlign: 'center' }}>
            <p style={{ fontSize: 26, fontWeight: 600, letterSpacing: '-0.02em', color: s.color, fontVariantNumeric: 'tabular-nums' }}>{s.value}</p>
            <p style={{ fontSize: 11, marginTop: 8, color: C.muted, letterSpacing: '0.04em', textTransform: 'uppercase' }}>{s.label}</p>
          </Card>
        ))}
      </div>

      <Card style={{ padding: '36px 40px', marginBottom: 24 }}>
        <div className="flex items-center justify-between" style={{ marginBottom: 16 }}>
          <p style={{ fontSize: 15, fontWeight: 600, color: C.text, letterSpacing: '0.01em' }}>30-day Cost Forecast</p>
          <span style={{ fontSize: 11, color: C.green }}>↑ 12% projected</span>
        </div>
        <p className="font-num" style={{ fontSize: 36, fontWeight: 600, color: C.text, letterSpacing: '-0.03em', marginBottom: 24 }}>€{(mtdExpenses * 30 / new Date().getDate()).toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, '.')}</p>
        <div style={{ display: 'flex', borderRadius: 10, overflow: 'hidden', height: 8, marginBottom: 16, gap: 2 }}>
          <div style={{ width: `${unusedPct}%`, background: 'var(--color-brand-blue)', borderRadius: 10, minWidth: unusedPct > 0 ? 4 : 0 }} />
          <div style={{ width: `${usedPct}%`, background: 'var(--color-brand-orange)', borderRadius: 10, minWidth: usedPct > 0 ? 4 : 0 }} />
          <div style={{ width: `${savingsPct}%`, background: 'var(--color-brand-green)', borderRadius: 10, minWidth: savingsPct > 0 ? 4 : 0 }} />
        </div>
        <div style={{ display: 'flex', gap: 24, fontSize: 11 }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: C.muted }}><span style={{ width: 8, height: 8, borderRadius: 3, display: 'inline-block', background: 'var(--color-brand-blue)', flexShrink: 0 }} /> Unused {unusedPct}%</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: C.muted }}><span style={{ width: 8, height: 8, borderRadius: 3, display: 'inline-block', background: 'var(--color-brand-orange)', flexShrink: 0 }} /> Used {usedPct}%</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: C.muted }}><span style={{ width: 8, height: 8, borderRadius: 3, display: 'inline-block', background: 'var(--color-brand-green)', flexShrink: 0 }} /> Saved {savingsPct}%</span>
        </div>
      </Card>

      <div className="grid grid-cols-3" style={{ gap: 16 }}>
        <Card style={{ padding: '32px 36px' }}>
          <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: C.subtle, marginBottom: 24 }}>Fixed costs</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {fixedExpenses.map(e => (
              <div key={e.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <span style={{ fontSize: 13, color: C.muted }}>{e.description}</span>
                <span style={{ fontSize: 13, fontWeight: 500, color: C.text }}>€{e.amount}</span>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 20, paddingTop: 16, display: 'flex', justifyContent: 'space-between', borderTop: `1px solid ${C.border}` }}>
            <span style={{ fontSize: 11, color: C.subtle }}>Total</span>
            <span style={{ fontSize: 14, fontWeight: 600, color: C.text }}>€{fixedExpenses.reduce((s,e) => s + e.amount, 0)}</span>
          </div>
        </Card>

        <Card style={{ padding: '32px 36px' }}>
          <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: C.subtle, marginBottom: 24 }}>Variable costs</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {varExpenses.map(e => (
              <div key={e.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <span style={{ fontSize: 13, color: C.muted }}>{e.description}</span>
                <span style={{ fontSize: 13, fontWeight: 500, color: C.text }}>€{e.amount}</span>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 20, paddingTop: 16, display: 'flex', justifyContent: 'space-between', borderTop: `1px solid ${C.border}` }}>
            <span style={{ fontSize: 11, color: C.subtle }}>Total</span>
            <span style={{ fontSize: 14, fontWeight: 600, color: C.text }}>€{varExpenses.reduce((s,e) => s + e.amount, 0)}</span>
          </div>
        </Card>

        <Card style={{ padding: '32px 36px' }}>
          <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: C.subtle, marginBottom: 24 }}>Expenses by category</p>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={spendingData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.grid} />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.44)' }} />
              <YAxis tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.44)' }} />
              <Tooltip formatter={(v: number) => `€${v}`} contentStyle={C.tooltip} />
              <Bar dataKey="value" fill="var(--color-brand-blue)" radius={[4,4,0,0]} maxBarSize={24} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>
    </div>
  )
}

function RevenueByBusiness() {
  const { revenue } = useFinanceStore()
  const [filter, setFilter] = useState<string>('all')
  const filtered = filter === 'all' ? revenue : revenue.filter(r => r.business === filter)
  const total = filtered.filter(r => r.status === 'received').reduce((s, r) => s + r.amount, 0)

  const monthlyData = Array.from({ length: 12 }, (_, i) => {
    const m = `2026-${String(i+1).padStart(2,'0')}`
    return { name: MONTHS_NL[i], CEO: revenue.filter(r => r.business==='ceo-lifestyle' && r.date.startsWith(m) && r.status==='received').reduce((s,r)=>s+r.amount,0), Bora: revenue.filter(r => r.business==='bora' && r.date.startsWith(m) && r.status==='received').reduce((s,r)=>s+r.amount,0) }
  })

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h3 style={{ fontSize: 20, fontWeight: 600, color: C.text }}>Revenue by business</h3>
        <div className="tab-bar">
          {['all','ceo-lifestyle','bora'].map(b => (
            <button key={b} onClick={() => setFilter(b)} className={`tab-btn cursor-pointer ${filter===b ? 'active' : ''}`}>
              {b === 'all' ? 'All' : bizLabels[b]}
            </button>
          ))}
        </div>
      </div>

      <Card className="p-4 mb-4">
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={monthlyData}>
            <CartesianGrid strokeDasharray="3 3" stroke={C.grid} />
            <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.44)' }} />
            <YAxis tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.44)' }} />
            <Tooltip formatter={(v: number) => `€${v.toLocaleString('nl-BE')}`} contentStyle={C.tooltip} />
            <Legend wrapperStyle={{ fontSize: 11, color: 'rgba(255,255,255,0.44)' }} />
            <Bar dataKey="CEO"  fill="var(--color-brand-orange)" stackId="a" radius={[0,0,0,0]} maxBarSize={30} />
            <Bar dataKey="Bora" fill="var(--color-brand-green)" stackId="a" radius={[3,3,0,0]} maxBarSize={30} />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      <Card className="overflow-hidden">
        <table className="w-full text-[12px]">
          <thead style={{ background: 'rgba(255,255,255,0.03)', borderBottom: `1px solid ${C.border}` }}>
            <tr>
              {['Date','Description','Amount','Business','Status'].map(h => (
                <th key={h} className="text-left px-4 py-3 text-[10px] font-semibold uppercase tracking-wider" style={{ color: C.subtle }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.sort((a,b) => b.date.localeCompare(a.date)).slice(0,15).map(r => (
              <tr key={r.id} style={{ borderBottom: `1px solid ${C.border}` }}>
                <td className="px-4 py-2.5" style={{ color: C.subtle }}>{r.date}</td>
                <td className="px-4 py-2.5" style={{ color: C.text }}>{r.offer}</td>
                <td className="px-4 py-2.5 font-semibold" style={{ color: C.text }}>€{r.amount.toLocaleString('nl-BE')}</td>
                <td className="px-4 py-2.5" style={{ color: C.muted }}>{bizLabels[r.business]}</td>
                <td className="px-4 py-2.5">
                  <span className="text-[11px] px-2 py-0.5 rounded-full font-medium" style={
                    r.status==='received' ? { background: 'rgba(109,184,137,0.15)', color: '#8FD4AD' }
                    : r.status==='pending' ? { background: 'rgba(196,136,78,0.15)', color: '#D4A97A' }
                    : { background: 'rgba(255,255,255,0.07)', color: C.subtle }
                  }>
                    {r.status==='received' ? 'Received' : r.status==='pending' ? 'Pending' : 'Refunded'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot style={{ background: 'rgba(255,255,255,0.02)', borderTop: `1px solid ${C.border}` }}>
            <tr>
              <td colSpan={2} className="px-4 py-2.5 text-[11px]" style={{ color: C.subtle }}>Total received</td>
              <td className="px-4 py-2.5 font-bold" style={{ color: C.text }}>€{total.toLocaleString('nl-BE')}</td>
              <td colSpan={2} />
            </tr>
          </tfoot>
        </table>
      </Card>
    </div>
  )
}

function YearOverview() {
  const { getMonthlyBreakdown, getYTDRevenue } = useFinanceStore()
  const breakdown = getMonthlyBreakdown(2026)
  const ytd = getYTDRevenue()
  const ytdExpenses = breakdown.reduce((s,m) => s + m.expenses, 0)
  const ytdNet = ytd - ytdExpenses
  const millionProgress = Math.round((ytd / 1000000) * 100 * 10) / 10
  const chartData = breakdown.map((m,i) => ({ name: MONTHS_NL[i], Revenue: m.revenue, Costs: m.expenses }))

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h3 style={{ fontSize: 20, fontWeight: 600, color: C.text }}>2026 Year Overview</h3>
        <div className="flex gap-4 text-[12px]">
          <span style={{ color: C.green }}>Revenue: <strong>€{ytd.toLocaleString('nl-BE')}</strong></span>
          <span style={{ color: C.orange }}>Costs: <strong>€{ytdExpenses.toLocaleString('nl-BE')}</strong></span>
          <span style={{ color: C.text }}>Netto: <strong>€{ytdNet.toLocaleString('nl-BE')}</strong></span>
        </div>
      </div>

      <Card className="p-4 mb-4">
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke={C.grid} />
            <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.44)' }} />
            <YAxis tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.44)' }} />
            <Tooltip formatter={(v: number) => `€${v.toLocaleString('nl-BE')}`} contentStyle={C.tooltip} />
            <Legend wrapperStyle={{ fontSize: 11, color: 'rgba(255,255,255,0.44)' }} />
            <Line type="monotone" dataKey="Revenue"  stroke="var(--color-brand-green)" strokeWidth={2} dot={{ r: 3 }} />
            <Line type="monotone" dataKey="Costs" stroke="var(--color-brand-orange)" strokeWidth={2} dot={{ r: 3 }} />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      <Card className="overflow-hidden mb-4">
        <table className="w-full text-[11px]">
          <thead style={{ background: 'rgba(255,255,255,0.03)', borderBottom: `1px solid ${C.border}` }}>
            <tr>
              <th className="text-left px-3 py-2.5 font-semibold" style={{ color: C.subtle }}>Maand</th>
              {breakdown.map((_,i) => <th key={i} className="text-right px-2 py-2.5 font-medium" style={{ color: C.subtle }}>{MONTHS_NL[i]}</th>)}
            </tr>
          </thead>
          <tbody>
            {[
              { label: 'Revenue',  key: 'revenue',  color: C.green },
              { label: 'Costs', key: 'expenses', color: C.orange },
              { label: 'Net',  key: 'net',      color: C.text },
            ].map(row => (
              <tr key={row.label} style={{ borderBottom: `1px solid ${C.border}` }}>
                <td className="px-3 py-2 font-medium" style={{ color: C.muted }}>{row.label}</td>
                {breakdown.map((m,i) => {
                  const val = (m as any)[row.key]
                  return <td key={i} className="px-2 py-2 text-right font-semibold" style={{ color: val ? row.color : C.subtle }}>{val ? `€${val.toLocaleString('nl-BE')}` : '-'}</td>
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <Card className="p-4">
        <div className="flex justify-between items-center mb-2">
          <p style={{ fontSize: 16, fontWeight: 600, color: C.text }}>Millionair progress</p>
          <span className="text-[12px] font-semibold" style={{ color: C.blue }}>{millionProgress}%</span>
        </div>
        <div className="w-full rounded-full h-2 mb-1.5" style={{ background: 'rgba(255,255,255,0.08)' }}>
          <div className="h-2 rounded-full transition-all" style={{ width: `${Math.min(100, millionProgress)}%`, background: 'var(--color-brand-blue)' }} />
        </div>
        <div className="flex justify-between text-[10px]" style={{ color: C.subtle }}>
          <span>€0</span>
          <span style={{ color: C.text, fontWeight: 600 }}>€{ytd.toLocaleString('nl-BE')} YTD</span>
          <span>€1.000.000</span>
        </div>
      </Card>
    </div>
  )
}

export function BudgetTracker() {
  const [tab, setTab] = useState<'period'|'revenue'|'year'>('period')
  const { getMTDRevenue, getNetWorth } = useFinanceStore()
  const mtd = getMTDRevenue()
  const nw = getNetWorth()
  const now = new Date()

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto' }}>

      {/* ── Header ── */}
      <div className="anim-fade-up" style={{ marginBottom: 40, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
        <div>
          <p style={{ fontSize: 11, fontWeight: 400, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--color-subtle)', marginBottom: 14 }}>
            {format(now, "MMMM yyyy", { locale: nlBE })}
          </p>
          <h1 style={{ fontSize: 40, fontWeight: 300, letterSpacing: '0.01em', lineHeight: 1.1, color: 'var(--color-ink)', marginBottom: 12, fontFamily: "'DM Sans', sans-serif" }}>
            Finance
          </h1>
          <p style={{ fontSize: 13, color: 'var(--color-muted)' }}>Revenue, costs and net worth. Your financial OS.</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <div className="card" style={{ padding: '16px 20px', textAlign: 'center' }}>
            <p style={{ fontSize: 22, fontWeight: 600, letterSpacing: '-0.04em', color: 'var(--color-brand-green)', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>€{mtd.toLocaleString('nl-BE')}</p>
            <p style={{ fontSize: 9, color: 'var(--color-subtle)', marginTop: 6, letterSpacing: '0.1em', textTransform: 'uppercase' }}>MTD Revenue</p>
          </div>
          <div className="card" style={{ padding: '16px 20px', textAlign: 'center' }}>
            <p style={{ fontSize: 22, fontWeight: 600, letterSpacing: '-0.04em', color: 'var(--color-accent)', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>€{nw.toLocaleString('nl-BE')}</p>
            <p style={{ fontSize: 9, color: 'var(--color-subtle)', marginTop: 6, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Net Worth</p>
          </div>
        </div>
      </div>

      <div className="tab-bar w-fit" style={{ marginBottom: 48 }}>
        {[{ key: 'period', label: 'Period Budget' }, { key: 'revenue', label: 'Revenue' }, { key: 'year', label: 'Year Overview' }].map(t => (
          <button key={t.key} onClick={() => setTab(t.key as typeof tab)}
            className={`tab-btn cursor-pointer ${tab === t.key ? 'active' : ''}`}>
            {t.label}
          </button>
        ))}
      </div>
      {tab === 'period'  && <PeriodBudget />}
      {tab === 'revenue' && <RevenueByBusiness />}
      {tab === 'year'    && <YearOverview />}
    </div>
  )
}
