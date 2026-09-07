interface StatCardProps {
  label: string
  value: string | number
  sub?: string
  trend?: 'up' | 'down' | 'neutral'
  color?: 'blue' | 'green' | 'orange' | 'default'
  chart?: number[]
  variant?: 'white' | 'warm' | 'stone'
}

function Sparkline({ data }: { data: number[] }) {
  const max = Math.max(...data, 1)
  return (
    <div className="sparkline mt-4">
      {data.map((v, i) => (
        <div
          key={i}
          className="sparkline-bar anim-bar"
          style={{
            height: `${Math.max(10, (v / max) * 100)}%`,
            background: i === data.length - 1 ? 'var(--color-accent)' : 'var(--color-border)',
            animationDelay: `${i * 30}ms`,
          }}
        />
      ))}
    </div>
  )
}

export function StatCard({ label, value, sub, trend, color = 'default', chart, variant = 'white' }: StatCardProps) {
  const bg = variant === 'warm' ? 'var(--color-surface-warm)' : variant === 'stone' ? 'var(--color-surface-stone)' : '#fff'
  const trendIcon = trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'
  const trendColor = trend === 'up' ? 'var(--color-brand-green)' : trend === 'down' ? 'var(--color-brand-orange)' : 'var(--color-muted)'
  const valueColor = color === 'green' ? 'var(--color-brand-green)' : color === 'orange' ? 'var(--color-brand-orange)' : color === 'blue' ? 'var(--color-brand-blue)' : 'var(--color-ink)'

  return (
    <div style={{ background: bg, borderRadius: 24, padding: '32px 36px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
        <p style={{ fontSize: 10, fontWeight: 500, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--color-subtle)' }}>
          {label}
        </p>
        {trend && (
          <span style={{ fontSize: 11, color: trendColor, fontWeight: 500 }}>
            {trendIcon}
          </span>
        )}
      </div>
      <p style={{ fontSize: 38, fontWeight: 500, letterSpacing: '-0.03em', lineHeight: 1, color: valueColor }}>
        {value}
      </p>
      {sub && <p style={{ fontSize: 12, marginTop: 10, color: 'var(--color-muted)', letterSpacing: '0.01em' }}>{sub}</p>}
      {chart && <Sparkline data={chart} />}
    </div>
  )
}
