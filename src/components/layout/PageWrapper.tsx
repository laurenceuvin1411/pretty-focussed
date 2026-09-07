interface PageWrapperProps {
  title: string
  subtitle?: string
  children: React.ReactNode
  actions?: React.ReactNode
}
export function PageWrapper({ title, subtitle, children, actions }: PageWrapperProps) {
  return (
    <div>
      <div style={{ marginBottom: 64, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 500, letterSpacing: '-0.02em', lineHeight: 1.2, color: 'var(--color-ink)' }}>
            {title}
          </h1>
          {subtitle && (
            <p style={{ fontSize: 13, color: 'var(--color-muted)', marginTop: 10, letterSpacing: '0.01em' }}>
              {subtitle}
            </p>
          )}
        </div>
        {actions && <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>{actions}</div>}
      </div>
      {children}
    </div>
  )
}
