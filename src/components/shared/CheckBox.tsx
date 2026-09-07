import { useState } from 'react'
import { Check } from 'lucide-react'

interface CheckBoxProps {
  checked: boolean
  onChange: () => void
  size?: 'sm' | 'lg'
}
export function CheckBox({ checked, onChange, size = 'sm' }: CheckBoxProps) {
  const [animating, setAnimating] = useState(false)
  const dim = size === 'lg' ? 22 : 20

  const handleClick = () => {
    setAnimating(true)
    onChange()
    setTimeout(() => setAnimating(false), 300)
  }

  return (
    <button
      onClick={handleClick}
      className={`cb ${checked ? 'checked' : ''} ${animating && checked ? 'anim-check' : ''}`}
      style={{ width: dim, height: dim }}
    >
      <Check size={size === 'lg' ? 11 : 10} strokeWidth={2.5} />
    </button>
  )
}
