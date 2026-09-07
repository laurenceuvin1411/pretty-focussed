import { useState, useEffect } from 'react'
import { useAuthStore } from '../store/authStore'

const CSS = `
  @keyframes lo-fade-up {
    from { opacity: 0; transform: translateY(18px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .lo-a0 { animation: lo-fade-up 0.6s cubic-bezier(.16,1,.3,1) 0.05s both; }
  .lo-a1 { animation: lo-fade-up 0.6s cubic-bezier(.16,1,.3,1) 0.15s both; }
  .lo-a2 { animation: lo-fade-up 0.6s cubic-bezier(.16,1,.3,1) 0.25s both; }
  .lo-a3 { animation: lo-fade-up 0.6s cubic-bezier(.16,1,.3,1) 0.35s both; }
  .lo-a4 { animation: lo-fade-up 0.6s cubic-bezier(.16,1,.3,1) 0.45s both; }
  .lo-input:focus {
    outline: none;
    border-color: var(--color-accent) !important;
    box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-accent) 18%, transparent) !important;
  }
  .lo-btn {
    transition: opacity 180ms ease, transform 180ms ease, box-shadow 180ms ease;
  }
  .lo-btn:hover:not(:disabled) {
    opacity: 0.88;
    transform: translateY(-1px);
    box-shadow: 0 8px 24px color-mix(in srgb, var(--color-accent) 28%, transparent);
  }
  .lo-btn:active:not(:disabled) { transform: translateY(0); }
  @media (prefers-reduced-motion: reduce) {
    .lo-a0,.lo-a1,.lo-a2,.lo-a3,.lo-a4 { animation: none !important; opacity: 1 !important; transform: none !important; }
  }
`

export function LoginPage() {
  const { signIn, signUp } = useAuthStore()
  const [mode, setMode]         = useState<'login' | 'signup'>('login')
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')
  const [notice, setNotice]     = useState('')
  const [loading, setLoading]   = useState(false)

  useEffect(() => {
    const style = document.createElement('style')
    style.textContent = CSS
    document.head.appendChild(style)
    return () => document.head.removeChild(style)
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    setNotice('')

    if (mode === 'signup') {
      if (password.length < 8) {
        setError('Kies een wachtwoord van minstens 8 tekens.')
        setLoading(false)
        return
      }
      const { error: err, needsConfirm } = await signUp(email, password)
      if (err) {
        setError(err.includes('already registered') ? 'Er bestaat al een account met dit adres. Log gewoon in.' : err)
        setLoading(false)
        return
      }
      if (needsConfirm) {
        setNotice('Account aangemaakt. Check je mailbox om je adres te bevestigen, daarna kan je inloggen.')
        setMode('login')
        setPassword('')
      }
      setLoading(false)
      return
    }

    const err = await signIn(email, password)
    if (err) {
      setError(err === 'Invalid login credentials' ? 'Verkeerd email of wachtwoord.' : err)
      setLoading(false)
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '11px 14px',
    borderRadius: 10,
    border: '1px solid var(--color-border)',
    background: 'var(--color-surface)',
    color: 'var(--color-ink)',
    fontSize: 14,
    fontFamily: 'inherit',
    boxSizing: 'border-box',
    transition: 'border-color 180ms, box-shadow 180ms',
  }

  return (
    <div style={{
      width: '100vw',
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--color-bg)',
      padding: 24,
      boxSizing: 'border-box',
    }}>
      <div style={{ width: '100%', maxWidth: 380, flex: '0 1 380px' }}>

        {/* Logo */}
        <div className="lo-a0" style={{ textAlign: 'center', marginBottom: 40 }}>
          <p style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--color-ink)', lineHeight: 1 }}>
            Laurence
          </p>
          <p style={{ fontSize: 9, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--color-subtle)', marginTop: 5 }}>
            Operating System
          </p>
        </div>

        {/* Card */}
        <div className="lo-a1 card" style={{ padding: '36px 32px' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 400, fontStyle: 'italic', color: 'var(--color-ink)', marginBottom: 6, lineHeight: 1.1 }}>
            {mode === 'login' ? 'Welkom terug' : 'Account aanmaken'}
          </h2>
          <p style={{ fontSize: 12, color: 'var(--color-muted)', marginBottom: 28, lineHeight: 1.5 }}>
            {mode === 'login'
              ? 'Log in om je dashboard te openen'
              : 'Kies zelf je wachtwoord. Alleen uitgenodigde adressen kunnen registreren.'}
          </p>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div className="lo-a2">
              <label htmlFor="lo-email" style={{ display: 'block', fontSize: 10, fontWeight: 600, letterSpacing: '0.13em', textTransform: 'uppercase', color: 'var(--color-subtle)', marginBottom: 7 }}>
                Email
              </label>
              <input
                id="lo-email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoFocus
                placeholder="jouw@email.com"
                style={inputStyle}
                className="lo-input"
              />
            </div>

            <div className="lo-a3">
              <label htmlFor="lo-pass" style={{ display: 'block', fontSize: 10, fontWeight: 600, letterSpacing: '0.13em', textTransform: 'uppercase', color: 'var(--color-subtle)', marginBottom: 7 }}>
                Wachtwoord
              </label>
              <input
                id="lo-pass"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                style={inputStyle}
                className="lo-input"
              />
              {mode === 'signup' && (
                <p style={{ fontSize: 10.5, color: 'var(--color-subtle)', marginTop: 6 }}>Minstens 8 tekens.</p>
              )}
            </div>

            {error && (
              <div style={{ padding: '9px 13px', borderRadius: 9, background: 'color-mix(in srgb, #c4736a 10%, transparent)', border: '1px solid color-mix(in srgb, #c4736a 22%, transparent)', fontSize: 12, color: '#f87171', lineHeight: 1.5 }}>
                {error}
              </div>
            )}

            {notice && (
              <div style={{ padding: '9px 13px', borderRadius: 9, background: 'rgba(109,184,137,0.10)', border: '1px solid rgba(109,184,137,0.28)', fontSize: 12, color: '#4A7A6A', lineHeight: 1.5 }}>
                {notice}
              </div>
            )}

            <div className="lo-a4" style={{ marginTop: 4 }}>
              <button
                type="submit"
                disabled={loading}
                className="lo-btn btn-primary"
                style={{ width: '100%', opacity: loading ? 0.6 : 1, cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, minHeight: 44 }}
              >
                {loading
                  ? <><Spinner /> {mode === 'login' ? 'Inloggen…' : 'Aanmaken…'}</>
                  : (mode === 'login' ? 'Inloggen' : 'Account aanmaken')}
              </button>
            </div>
          </form>
        </div>

        <p className="lo-a4" style={{ textAlign: 'center', fontSize: 11, color: 'var(--color-subtle)', marginTop: 18, lineHeight: 1.6 }}>
          {mode === 'login' ? 'Nog geen account? ' : 'Heb je al een account? '}
          <button
            type="button"
            onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(''); setNotice('') }}
            style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontFamily: 'inherit', fontSize: 11, color: 'var(--color-ink)', fontWeight: 700, textDecoration: 'underline' }}
          >
            {mode === 'login' ? 'Aanmaken' : 'Inloggen'}
          </button>
        </p>
      </div>
    </div>
  )
}

function Spinner() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ animation: 'spin 0.8s linear infinite' }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.5" strokeDasharray="26" strokeDashoffset="18" strokeLinecap="round" />
    </svg>
  )
}
