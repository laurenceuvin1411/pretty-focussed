interface ProgressBarProps {
  value: number
  color?: string
}
export function ProgressBar({ value, color }: ProgressBarProps) {
  return (
    <div className="progress">
      <div
        className="progress-bar"
        style={{ width: `${Math.min(100, Math.max(0, value))}%`, background: color || 'var(--color-accent)' }}
      />
    </div>
  )
}
