import { useState } from 'react'
import { Check, ArrowRight, Sparkles, Clock, Gift } from 'lucide-react'
import { getCurrentEmail, firstName } from '../lib/workspace'

const ACCENT = '#4C6481'
const GOLD = '#D4A96A'
const CONTACT_EMAIL = 'hello@laurenceuvin.com'

type Option = 'apero' | 'program'

const OPTIONS: Record<Option, {
  label: string; title: string; price: string; priceSub: string
  duration: string; bullets: string[]; cta: string; highlight?: string
}> = {
  apero: {
    label: 'Optie A',
    title: 'De Apero',
    price: '€600',
    priceSub: 'eenmalig · excl. btw',
    duration: '90 minuten · 1:1',
    bullets: [
      'Eén diepe sessie op jouw grootste knelpunt',
      'Concreet actieplan waar je meteen mee verder kan',
      'Zes maanden gratis toegang tot deze app',
    ],
    cta: 'Boek de Apero',
    highlight: '6 maanden app inbegrepen',
  },
  program: {
    label: 'Optie B',
    title: 'Private Coaching',
    price: '€5.000',
    priceSub: 'excl. btw · tot -30% via KMO-portefeuille',
    duration: 'Traject · 1:1',
    bullets: [
      'Persoonlijke begeleiding over meerdere maanden',
      'Strategie, systemen en uitvoering, samen',
      'Volledige toegang tot deze app tijdens het traject',
    ],
    cta: 'Start het gesprek',
  },
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '12px 14px', borderRadius: 14,
  border: '1px solid var(--color-border)', background: 'var(--color-surface)',
  color: 'var(--color-ink)', fontSize: 14, fontFamily: 'inherit',
  outline: 'none', boxSizing: 'border-box',
}

const labelStyle: React.CSSProperties = {
  fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase',
  color: 'var(--color-subtle)', fontFamily: 'var(--font-mono)', display: 'block', marginBottom: 6,
}

function OptionCard({ id, selected, onSelect }: { id: Option; selected: boolean; onSelect: () => void }) {
  const o = OPTIONS[id]
  const isProgram = id === 'program'
  return (
    <button
      onClick={onSelect}
      data-testid={`option-${id}`}
      style={{
        textAlign: 'left', padding: '26px 26px 24px', borderRadius: 24, cursor: 'pointer',
        fontFamily: 'inherit', position: 'relative', overflow: 'hidden',
        border: `1.5px solid ${selected ? (isProgram ? GOLD : ACCENT) : 'var(--color-border)'}`,
        background: selected
          ? (isProgram ? 'linear-gradient(160deg, rgba(212,169,106,0.10), var(--color-card) 60%)' : 'linear-gradient(160deg, rgba(76,100,129,0.08), var(--color-card) 60%)')
          : 'var(--color-card)',
        boxShadow: selected ? '0 10px 34px rgba(120,100,110,0.14)' : '0 2px 10px rgba(120,100,110,0.05)',
        transition: 'all 220ms cubic-bezier(.16,1,.3,1)',
        transform: selected ? 'translateY(-2px)' : 'none',
      }}
    >
      {o.highlight && (
        <span style={{ position: 'absolute', top: 16, right: 16, fontSize: 9, fontWeight: 700, padding: '4px 10px', borderRadius: 99, background: 'rgba(76,100,129,0.10)', color: ACCENT, fontFamily: 'var(--font-mono)', letterSpacing: '0.06em', display: 'flex', alignItems: 'center', gap: 4 }}>
          <Gift size={9} /> {o.highlight}
        </span>
      )}
      <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: isProgram ? GOLD : ACCENT, fontFamily: 'var(--font-mono)', marginBottom: 8 }}>{o.label}</p>
      <h3 style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--color-ink)', marginBottom: 4 }}>{o.title}</h3>
      <p style={{ fontSize: 11.5, color: 'var(--color-subtle)', fontFamily: 'var(--font-mono)', display: 'flex', alignItems: 'center', gap: 5, marginBottom: 16 }}>
        <Clock size={10} /> {o.duration}
      </p>
      <div style={{ marginBottom: 16 }}>
        <span style={{ fontSize: 30, fontWeight: 800, letterSpacing: '-0.03em', color: 'var(--color-ink)', fontFamily: 'var(--font-mono)' }}>{o.price}</span>
        <p style={{ fontSize: 11, color: 'var(--color-subtle)', marginTop: 2 }}>{o.priceSub}</p>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {o.bullets.map(b => (
          <div key={b} style={{ display: 'flex', gap: 9, alignItems: 'flex-start' }}>
            <span style={{ width: 16, height: 16, borderRadius: 6, background: isProgram ? 'rgba(212,169,106,0.15)' : 'rgba(76,100,129,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
              <Check size={9} color={isProgram ? GOLD : ACCENT} strokeWidth={3} />
            </span>
            <span style={{ fontSize: 13, color: 'var(--color-ink)', lineHeight: 1.5 }}>{b}</span>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 20, display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, fontWeight: 700, color: selected ? (isProgram ? GOLD : ACCENT) : 'var(--color-muted)' }}>
        {selected ? 'Geselecteerd' : o.cta} <ArrowRight size={13} />
      </div>
    </button>
  )
}

export function WorkWithLaurence() {
  const [selected, setSelected] = useState<Option | null>(null)
  const [name, setName] = useState(firstName())
  const [email, setEmail] = useState(getCurrentEmail() ?? '')
  const [phone, setPhone] = useState('')
  const [message, setMessage] = useState('')
  const [sent, setSent] = useState(false)

  const canSend = !!selected && name.trim() && email.trim()

  function submit() {
    if (!canSend || !selected) return
    const o = OPTIONS[selected]
    // Aanvraag lokaal bewaren als backup
    try {
      const prev = JSON.parse(localStorage.getItem('coaching-requests') ?? '[]')
      localStorage.setItem('coaching-requests', JSON.stringify([...prev, { option: selected, name, email, phone, message, at: new Date().toISOString() }]))
    } catch {}
    // Direct een voorbereide mail openen naar Laurence
    const subject = encodeURIComponent(`Aanvraag ${o.title} · ${name}`)
    const body = encodeURIComponent(
      `Hi Laurence,\n\nIk wil graag ${selected === 'apero' ? 'de Apero boeken' : 'starten met Private Coaching'}.\n\n` +
      `Naam: ${name}\nE-mail: ${email}\n${phone ? `Telefoon: ${phone}\n` : ''}` +
      `${message ? `\n${message}\n` : ''}\nGroeten,\n${name}`
    )
    window.location.href = `mailto:${CONTACT_EMAIL}?subject=${subject}&body=${body}`
    setSent(true)
  }

  return (
    <div style={{ maxWidth: 820 }}>
      {/* Hero */}
      <div style={{ position: 'relative', borderRadius: 28, padding: '34px 32px', marginBottom: 28, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.6)', background: 'linear-gradient(135deg, rgba(242,220,227,0.55) 0%, rgba(255,255,255,0.7) 45%, rgba(214,229,238,0.5) 100%)' }}>
        <div style={{ position: 'absolute', top: -80, right: -40, width: 260, height: 260, borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0) 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'relative' }}>
          <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: ACCENT, fontFamily: 'var(--font-mono)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Sparkles size={11} /> Werk met Laurence
          </p>
          <h1 style={{ fontSize: 30, fontWeight: 800, letterSpacing: '-0.03em', color: 'var(--color-ink)', lineHeight: 1.1, marginBottom: 12, maxWidth: 520 }}>
            Deze app is het systeem. De coaching is de versnelling.
          </h1>
          <p style={{ fontSize: 14, color: 'var(--color-muted)', lineHeight: 1.65, maxWidth: 520, fontFamily: 'var(--font-serif)', fontStyle: 'italic' }}>
            Kies hoe diep je wil gaan. Eén scherpe sessie, of een traject waarin we samen bouwen.
          </p>
        </div>
      </div>

      {/* Opties */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16, marginBottom: 28 }}>
        <OptionCard id="apero" selected={selected === 'apero'} onSelect={() => setSelected('apero')} />
        <OptionCard id="program" selected={selected === 'program'} onSelect={() => setSelected('program')} />
      </div>

      {/* KMO-hint */}
      <p style={{ fontSize: 11.5, color: 'var(--color-subtle)', lineHeight: 1.6, marginBottom: 28, padding: '12px 16px', borderRadius: 14, background: 'rgba(212,169,106,0.06)', border: '1px solid rgba(212,169,106,0.18)' }}>
        <strong style={{ color: GOLD }}>KMO-portefeuille.</strong> Ben je zelfstandige of KMO in Vlaanderen? Dan betaalt de overheid tot 30% van het coachingtraject terug. Ik help je met de aanvraag.
      </p>

      {/* Formulier */}
      {sent ? (
        <div style={{ padding: '32px 28px', borderRadius: 24, border: '1.5px solid rgba(109,184,137,0.35)', background: 'rgba(109,184,137,0.06)', textAlign: 'center' }} data-testid="sent">
          <div style={{ width: 44, height: 44, borderRadius: 16, background: '#6DB889', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
            <Check size={20} color="#fff" strokeWidth={3} />
          </div>
          <p style={{ fontSize: 17, fontWeight: 800, color: 'var(--color-ink)', marginBottom: 6, letterSpacing: '-0.01em' }}>Je mailprogramma staat open.</p>
          <p style={{ fontSize: 13, color: 'var(--color-muted)', lineHeight: 1.6, maxWidth: 400, margin: '0 auto' }}>
            Verstuur de mail en Laurence neemt binnen 48 uur contact op. Is er niets geopend? Mail dan zelf naar <a href={`mailto:${CONTACT_EMAIL}`} style={{ color: ACCENT, fontWeight: 700 }}>{CONTACT_EMAIL}</a>.
          </p>
        </div>
      ) : (
        <div style={{ padding: '26px 28px', borderRadius: 24, border: '1px solid var(--color-border)', background: 'var(--color-card)', boxShadow: '0 4px 20px rgba(120,100,110,0.06)' }}>
          <p style={{ fontSize: 15, fontWeight: 800, color: 'var(--color-ink)', marginBottom: 4, letterSpacing: '-0.01em' }}>
            {selected ? `Aanvraag · ${OPTIONS[selected].title}` : 'Kies hierboven een optie'}
          </p>
          <p style={{ fontSize: 12, color: 'var(--color-subtle)', marginBottom: 20 }}>Geen betaling nu. Je krijgt eerst een persoonlijk antwoord.</p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, marginBottom: 12 }}>
            <div>
              <label style={labelStyle}>Naam</label>
              <input value={name} onChange={e => setName(e.target.value)} placeholder="Je naam" data-testid="req-name" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>E-mail</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="jij@voorbeeld.be" data-testid="req-email" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Telefoon (optioneel)</label>
              <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+32 ..." style={inputStyle} />
            </div>
          </div>
          <div style={{ marginBottom: 18 }}>
            <label style={labelStyle}>Waar wil je aan werken? (optioneel)</label>
            <textarea value={message} onChange={e => setMessage(e.target.value)} placeholder="Een paar zinnen volstaan." rows={3} style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.6 }} />
          </div>

          <button
            onClick={submit}
            disabled={!canSend}
            data-testid="req-submit"
            style={{
              width: '100%', padding: '15px', borderRadius: 99, border: 'none',
              background: canSend ? 'var(--color-ink)' : 'var(--color-border)',
              color: canSend ? 'var(--color-bg)' : 'var(--color-muted)',
              fontSize: 14, fontWeight: 800, cursor: canSend ? 'pointer' : 'default',
              fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              boxShadow: canSend ? '0 6px 20px rgba(0,0,0,0.16)' : 'none', transition: 'all 200ms',
            }}
          >
            {selected ? OPTIONS[selected].cta : 'Selecteer een optie'} <ArrowRight size={15} />
          </button>
        </div>
      )}
    </div>
  )
}
