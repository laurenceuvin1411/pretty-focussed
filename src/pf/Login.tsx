// Come in. One card, two fields, one Ink pill.
import { useState } from 'react'
import './pf.css'
import { useAuthStore } from '../store/authStore'
import { ApertureMark, ApertureLoader } from './Aperture'

export function Login() {
  const { signIn, signUp } = useAuthStore()
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [loading, setLoading] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError(''); setNotice('')
    if (mode === 'signup') {
      if (password.length < 8) { setError('A password needs 8 characters or more.'); setLoading(false); return }
      const { error: err, needsConfirm } = await signUp(email, password)
      if (err) { setError(err.includes('already registered') ? 'This address already has a room. Come in instead.' : err); setLoading(false); return }
      if (needsConfirm) { setNotice('Your room is ready. Confirm your address from your inbox, then come in.'); setMode('login'); setPassword('') }
      setLoading(false)
      return
    }
    const err = await signIn(email, password)
    if (err) { setError(err === 'Invalid login credentials' ? 'That email and password do not match.' : err); setLoading(false) }
  }

  return (
    <div className="pf pf-room" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div className="pf-field" aria-hidden="true" />
      <div className="pf-grain" aria-hidden="true" />
      <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: 400 }} className="pf-enter">
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', marginBottom: 40 }}>
          <ApertureMark size={64} play />
          <h1 className="pf-h2" style={{ marginTop: 28 }}>Everything else can wait.</h1>
          <p className="pf-body" style={{ marginTop: 12 }}>{mode === 'login' ? 'Your week is where you left it.' : 'One room, one week at a time.'}</p>
        </div>

        <form onSubmit={submit} className="pf-fields" style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div className="pf-fieldset">
            <label className="pf-cap pf-label" htmlFor="pf-email">Email</label>
            <input id="pf-email" className="pf-input" type="email" autoComplete="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="you@studio.com" />
          </div>
          <div className="pf-fieldset">
            <label className="pf-cap pf-label" htmlFor="pf-password">Password</label>
            <input id="pf-password" className="pf-input" type="password" autoComplete={mode === 'login' ? 'current-password' : 'new-password'} required value={password} onChange={e => setPassword(e.target.value)} placeholder={mode === 'signup' ? '8 characters or more' : ''} />
          </div>
          {error && <p className="pf-error" role="alert">{error}</p>}
          {notice && <p className="pf-small" role="status">{notice}</p>}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginTop: 8 }}>
            <button type="button" className="pf-btn pf-btn--tertiary" onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(''); setNotice('') }}>
              {mode === 'login' ? 'New here' : 'I have a room'}
            </button>
            <button type="submit" className="pf-btn pf-btn--primary" disabled={loading} aria-label={mode === 'login' ? 'Come in' : 'Open your room'}>
              {loading ? <ApertureLoader size={20} color="var(--action-text)" /> : mode === 'login' ? 'Come in' : 'Open your room'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
