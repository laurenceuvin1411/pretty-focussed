
const classMap: Record<string, string> = {
  'ceo-lifestyle': 'badge badge-ceo',
  'bora':          'badge badge-bora',
  'personal':      'badge badge-pers',
  'all':           'badge badge-muted',
}

const labelMap: Record<string, string> = {
  'ceo-lifestyle': 'CEO Lifestyle',
  'bora':          'Bora',
  'personal':      'Persoonlijk',
  'all':           'Alles',
}

interface BadgeProps { business?: Business | string; label?: string; className?: string }
export function Badge({ business, label, className = '' }: BadgeProps) {
  const cls = business ? (classMap[business] || 'badge badge-muted') : 'badge badge-muted'
  const text = label || (business ? (labelMap[business] || business) : '')
  return <span className={`${cls} ${className}`}>{text}</span>
}
